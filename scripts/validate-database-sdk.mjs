import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseProfilesRepository } from "../lib/repositories/supabase/supabaseProfilesRepository.js";
import { createSupabasePortfoliosRepository } from "../lib/repositories/supabase/supabasePortfoliosRepository.js";
import { createSupabaseAssetsRepository } from "../lib/repositories/supabase/supabaseAssetsRepository.js";
import { createSupabaseQuotesRepository } from "../lib/repositories/supabase/supabaseQuotesRepository.js";
import { createSupabasePreferencesRepository } from "../lib/repositories/supabase/supabasePreferencesRepository.js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { createSupabasePortfolioSnapshotsRepository } from "../lib/repositories/supabase/supabasePortfolioSnapshotsRepository.js";
import {
  assertFinancialRegression,
  FINANCIAL_REGRESSION_OPERATIONS,
} from "./financial-regression-fixtures.mjs";
import { reconcileOperations } from "../lib/services/operationsMigrationService.js";
import { calculatePositions } from "../lib/engine/portfolio.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && publishableKey && secretKey, "Variaveis SUPABASE_TEST_* ausentes.");

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const testRun = randomUUID();
const password = `Local-${randomUUID()}-Aa1!`;
const createdUsers = [];
const portfolioIds = [];
let portfolioId = null;

async function createUser(label) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `${label}-${testRun}@example.invalid`,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  createdUsers.push(data.user.id);
  return data.user;
}

async function authenticatedClient(user) {
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error) throw error;
  return client;
}

try {
  const [userA, userB, userC] = await Promise.all([
    createUser("core05-a"),
    createUser("core05-b"),
    createUser("core05-c"),
  ]);
  const [clientA, clientB, clientC] = await Promise.all([
    authenticatedClient(userA),
    authenticatedClient(userB),
    authenticatedClient(userC),
  ]);

  const profilesA = createSupabaseProfilesRepository(clientA);
  const savedProfile = await profilesA.upsert({ displayName: "SDK A" });
  assert(savedProfile.id === userA.id, "Profile SDK nao respeitou Auth User.");
  assert((await profilesA.getCurrent())?.displayName === "SDK A", "Profile SDK nao foi lido.");

  const portfoliosA = createSupabasePortfoliosRepository(clientA);
  assert((await portfoliosA.list()).length === 0, "Novo usuario nao iniciou sem carteira para onboarding.");
  const created = await portfoliosA.create({ name: "SDK Portfolio", baseCurrency: "USD", timezone: "America/Manaus" });
  portfolioId = created.id;
  portfolioIds.push(portfolioId);
  assert(created.role === "owner", "RPC nao retornou owner.");
  assert(created.baseCurrency === "USD" && created.timezone === "America/Manaus", "Onboarding nao persistiu moeda e fuso.");
  assert((await portfoliosA.list()).some((item) => item.id === portfolioId), "Owner nao listou carteira.");
  assert(
    (await portfoliosA.update(portfolioId, { description: "Owner update" })).description
      === "Owner update",
    "Owner nao atualizou carteira.",
  );
  assert((await portfoliosA.getActive())?.id === portfolioId, "Carteira ativa nao foi persistida.");

  const assetsA = createSupabaseAssetsRepository(clientA);
  const quotesA = createSupabaseQuotesRepository(clientA);
  const preferencesA = createSupabasePreferencesRepository(clientA);
  await assetsA.upsert({
    portfolioId,
    ticker: "TEST3",
    name: "Ativo SDK",
    type: "Ação",
    updatedAt: "2026-07-31T12:00:00.000Z",
  });
  await quotesA.upsert({
    portfolioId,
    ticker: "TEST3",
    currentQuote: 42.5,
    updatedAt: "2026-07-31",
  });
  await preferencesA.upsertByPortfolio(portfolioId, {
    diagnosticPreferences: { maxPositionPercent: 20 },
    riskProfile: { calculatedProfile: "moderate" },
  });
  assert((await preferencesA.getByPortfolio(portfolioId)).dataSource === "LOCAL", "Fonte inicial nao e LOCAL.");
  const { error: invalidSourceError } = await clientA
    .from("portfolio_preferences")
    .update({ data_source: "INVALID" })
    .eq("portfolio_id", portfolioId);
  assert(invalidSourceError?.code === "23514", "Constraint de data_source nao rejeitou valor invalido.");
  await preferencesA.upsertByPortfolio(portfolioId, { dataSource: "SUPABASE" });
  assert((await createSupabasePreferencesRepository(clientA).getByPortfolio(portfolioId)).dataSource === "SUPABASE", "Fonte SUPABASE nao persistiu apos recarregar repository.");
  assert((await assetsA.getByTicker(portfolioId, "TEST3"))?.name === "Ativo SDK", "Asset SDK nao foi persistido.");
  assert((await quotesA.getByTicker(portfolioId, "TEST3"))?.currentQuote === 42.5, "Quote SDK nao foi persistida.");
  assert((await preferencesA.getByPortfolio(portfolioId)).riskProfile.calculatedProfile === "moderate", "Preferences SDK nao foram persistidas.");

  const operationsA = createSupabaseOperationsRepository(clientA);
  await operationsA.replaceAllByPortfolio(portfolioId, FINANCIAL_REGRESSION_OPERATIONS);
  await operationsA.replaceAllByPortfolio(portfolioId, FINANCIAL_REGRESSION_OPERATIONS);
  const remoteRegression = await operationsA.listByPortfolio(portfolioId);
  assert(remoteRegression.length === FINANCIAL_REGRESSION_OPERATIONS.length, "Importacao idempotente duplicou operacoes.");
  assertFinancialRegression(remoteRegression, "Supabase Repository");
  assert(
    remoteRegression.every((operation, index, list) => index === 0 || list[index - 1].date <= operation.date),
    "Ordenacao remota nao e deterministica.",
  );
  assert((await preferencesA.getByPortfolio(portfolioId)).dataSource === "SUPABASE", "Importacao alterou a fonte escolhida.");
  const compatibilityEvents = [
    { id: "51000000-0000-4000-8000-000000000001", ticker: "SADI11", assetName: "SADI", assetType: "FII", operationType: "COMPRA", date: "2024-01-10", quantity: 2, unitPrice: 100, fees: 0, totalValue: 200, notes: "" },
    { id: "51000000-0000-4000-8000-000000000002", ticker: "SADI11", assetName: "SADI", assetType: "FII", operationType: "SPLIT", date: "2024-10-16", ratioFrom: 1, ratioTo: 10, notes: "" },
    { id: "51000000-0000-4000-8000-000000000003", ticker: "SADI11", assetName: "SADI", assetType: "FII", operationType: "CONVERSION", date: "2025-12-10", quantity: 20, targetTicker: "SAPI11", targetAssetName: "SAPI", targetAssetType: "FII", targetQuantity: 18, notes: "" },
    { id: "51000000-0000-4000-8000-000000000004", ticker: "MP-CASH", assetName: "Mercado Pago", assetType: "Caixa Remunerado", operationType: "CASH_DEPOSIT", date: "2025-01-02", totalValue: 25, notes: "" },
    { id: "51000000-0000-4000-8000-000000000005", ticker: "MP-CASH", assetName: "Mercado Pago", assetType: "Caixa Remunerado", operationType: "RENDIMENTO", date: "2025-01-03", totalValue: 2, notes: "" },
  ];
  await operationsA.replaceAllByPortfolio(portfolioId, compatibilityEvents);
  const remoteCompatibility = await operationsA.listByPortfolio(portfolioId);
  const compatibilityIds = new Set(compatibilityEvents.map((operation) => operation.id));
  const roundTripEvents = remoteCompatibility.filter((operation) => compatibilityIds.has(operation.id));
  assert(roundTripEvents.length === compatibilityEvents.length, "Eventos de compatibilidade nao completaram round-trip remoto.");
  const compatibilityPositions = calculatePositions(roundTripEvents);
  assert(compatibilityPositions.find((position) => position.ticker === "SAPI11")?.quantity === 18, "Conversao remota perdeu quantidade destino.");
  assert(compatibilityPositions.find((position) => position.ticker === "MP-CASH")?.currentValue === 27, "Caixa remunerado remoto perdeu saldo.");
  const snapshotsA = createSupabasePortfolioSnapshotsRepository(clientA);
  const snapshot = {
    portfolioId, date: "2026-08-01", timestamp: Date.parse("2026-08-01T12:00:00Z"),
    totalInvested: 1000, currentValue: 1100, profitLoss: 100, dividends: 25, positionsCount: 2,
  };
  await snapshotsA.upsertDaily(snapshot);
  await snapshotsA.upsertDaily({ ...snapshot, currentValue: 1120, profitLoss: 120 });
  assert((await snapshotsA.listByPortfolio(portfolioId)).length === 1, "Upsert diario duplicou snapshot.");
  assert((await snapshotsA.getLatest(portfolioId)).currentValue === 1120, "Atualizacao diaria nao foi deterministica.");
  await snapshotsA.upsertDaily({ ...snapshot, date: "2026-08-02", timestamp: Date.parse("2026-08-02T12:00:00Z") });
  assert((await snapshotsA.getRange(portfolioId, "2026-08-02", "2026-08-02")).length === 1, "Range remoto incorreto.");

  const secondPortfolio = await portfoliosA.create({ name: "SDK Portfolio B" });
  portfolioIds.push(secondPortfolio.id);
  const secondPreferences = createSupabasePreferencesRepository(clientA);
  assert((await secondPreferences.getByPortfolio(secondPortfolio.id)).dataSource === "LOCAL", "Carteira B nao iniciou em LOCAL.");
  assert((await secondPreferences.getByPortfolio(portfolioId)).dataSource === "SUPABASE", "Carteira B alterou preferencia da carteira A.");
  await portfoliosA.setActive(portfolioId);
  assert(
    reconcileOperations(FINANCIAL_REGRESSION_OPERATIONS, remoteRegression).divergent.length === 0,
    "Reconciliacao marcou registros equivalentes como divergentes.",
  );
  assert(
    (await createSupabaseOperationsRepository(clientA).listByPortfolio(portfolioId)).length
      === FINANCIAL_REGRESSION_OPERATIONS.length + compatibilityEvents.length,
    "Operacoes nao persistiram apos recriar repository.",
  );

  const { data: hiddenFromC, error: cReadError } = await clientC
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId);
  assert(!cReadError && hiddenFromC.length === 0, "Usuario C acessou carteira de A.");

  const { error: addMemberError } = await clientA.from("portfolio_members").insert({
    portfolio_id: portfolioId,
    user_id: userB.id,
    role: "viewer",
    invited_by: userA.id,
  });
  if (addMemberError) throw addMemberError;

  const portfoliosB = createSupabasePortfoliosRepository(clientB);
  assert((await portfoliosB.list()).some((item) => item.id === portfolioId), "Viewer nao listou carteira.");
  assert((await createSupabaseAssetsRepository(clientB).listByPortfolio(portfolioId)).length === 1, "Viewer nao leu assets.");
  const operationsB = createSupabaseOperationsRepository(clientB);
  assert((await operationsB.listByPortfolio(portfolioId)).length === FINANCIAL_REGRESSION_OPERATIONS.length + compatibilityEvents.length, "Viewer nao leu operacoes.");
  const snapshotsB = createSupabasePortfolioSnapshotsRepository(clientB);
  assert((await snapshotsB.listByPortfolio(portfolioId)).length === 2, "Viewer nao leu snapshots.");
  try {
    await snapshotsB.upsertDaily({ ...snapshot, date: "2026-08-03" });
    throw new Error("Viewer criou snapshot.");
  } catch (error) {
    assert(error.code === "STORAGE_WRITE_ERROR", "Viewer retornou erro inesperado ao criar snapshot.");
  }
  try {
    await operationsB.create({
      ...FINANCIAL_REGRESSION_OPERATIONS[0],
      id: "50000000-0000-4000-8000-000000000001",
      portfolioId,
    });
    throw new Error("Viewer criou operacao.");
  } catch (error) {
    assert(error.code === "STORAGE_WRITE_ERROR", "Viewer retornou erro inesperado.");
  }
  try {
    await createSupabasePreferencesRepository(clientB).upsertByPortfolio(portfolioId, { dataSource: "LOCAL" });
    throw new Error("Viewer alterou fonte.");
  } catch (error) {
    assert(error.code === "STORAGE_WRITE_ERROR", "Viewer retornou erro inesperado ao alterar fonte.");
  }
  const { data: membershipsB, error: membershipsBError } = await clientB
    .from("portfolio_members")
    .select("user_id, role")
    .eq("portfolio_id", portfolioId);
  assert(!membershipsBError && membershipsB.length === 2, "Viewer nao leu memberships.");
  const { data: viewerUpdate, error: viewerUpdateError } = await clientB
    .from("portfolios")
    .update({ description: "forbidden" })
    .eq("id", portfolioId)
    .select("id");
  assert(!viewerUpdateError && viewerUpdate.length === 0, "Viewer atualizou carteira.");

  const { data: selfPromotion, error: selfPromotionError } = await clientB
    .from("portfolio_members")
    .update({ role: "owner" })
    .eq("portfolio_id", portfolioId)
    .eq("user_id", userB.id)
    .select("user_id");
  assert(!selfPromotionError && selfPromotion.length === 0, "Viewer promoveu a si proprio.");

  const { error: addByViewerError } = await clientB.from("portfolio_members").insert({
    portfolio_id: portfolioId,
    user_id: userC.id,
    role: "viewer",
  });
  assert(addByViewerError, "Viewer adicionou membership.");

  const { error: promoteEditorError } = await clientA
    .from("portfolio_members")
    .update({ role: "editor" })
    .eq("portfolio_id", portfolioId)
    .eq("user_id", userB.id);
  if (promoteEditorError) throw promoteEditorError;

  const editorOperation = {
    ...FINANCIAL_REGRESSION_OPERATIONS[0],
    id: "50000000-0000-4000-8000-000000000002",
    portfolioId,
  };
  await operationsB.create(editorOperation);
  await operationsB.update(editorOperation.id, { ...editorOperation, notes: "editor" });
  assert((await operationsB.getById(editorOperation.id)).notes === "editor", "Editor nao atualizou operacao.");
  await operationsB.remove(editorOperation.id);
  assert(await operationsB.getById(editorOperation.id) === null, "Editor nao excluiu operacao.");
  await snapshotsB.upsertDaily({ ...snapshot, date: "2026-08-03", timestamp: Date.parse("2026-08-03T12:00:00Z") });
  assert((await snapshotsA.listByPortfolio(portfolioId)).length === 3, "Editor nao persistiu snapshot.");
  await createSupabasePreferencesRepository(clientB).upsertByPortfolio(portfolioId, { dataSource: "LOCAL" });
  assert((await preferencesA.getByPortfolio(portfolioId)).dataSource === "LOCAL", "Editor nao alterou fonte para LOCAL.");
  await preferencesA.upsertByPortfolio(portfolioId, { dataSource: "SUPABASE" });

  const assetsB = createSupabaseAssetsRepository(clientB);
  await assetsB.upsert({
    portfolioId,
    ticker: "EDIT3",
    name: "Ativo Editor",
    type: "Ação",
  });
  assert((await assetsB.getByTicker(portfolioId, "EDIT3"))?.name === "Ativo Editor", "Editor nao persistiu asset.");

  const { data: editorUpdate, error: editorUpdateError } = await clientB
    .from("portfolios")
    .update({ description: "editor forbidden" })
    .eq("id", portfolioId)
    .select("id");
  assert(!editorUpdateError && editorUpdate.length === 0, "Editor atualizou carteira.");

  const { data: membershipsC, error: membershipsCError } = await clientC
    .from("portfolio_members")
    .select("user_id")
    .eq("portfolio_id", portfolioId);
  assert(!membershipsCError && membershipsC.length === 0, "Usuario C leu memberships alheios.");
  assert((await createSupabaseAssetsRepository(clientC).listByPortfolio(portfolioId)).length === 0, "Usuario C leu assets alheios.");
  assert((await createSupabaseOperationsRepository(clientC).listByPortfolio(portfolioId)).length === 0, "Usuario C leu operacoes alheias.");
  assert((await createSupabasePortfolioSnapshotsRepository(clientC).listByPortfolio(portfolioId)).length === 0, "Usuario C leu snapshots alheios.");

  const { error: addByCError } = await clientC.from("portfolio_members").insert({
    portfolio_id: portfolioId,
    user_id: userC.id,
    role: "owner",
  });
  assert(addByCError, "Usuario C inseriu membership alheio.");

  const { error: lastOwnerDemotionError } = await clientA
    .from("portfolio_members")
    .update({ role: "viewer" })
    .eq("portfolio_id", portfolioId)
    .eq("user_id", userA.id);
  assert(lastOwnerDemotionError, "Ultimo owner foi rebaixado.");

  const { data: ownerSelfDelete, error: ownerSelfDeleteError } = await clientA
    .from("portfolio_members")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("user_id", userA.id)
    .select("user_id");
  assert(!ownerSelfDeleteError && ownerSelfDelete.length === 0, "Ultimo owner removeu a si proprio.");

  await clientA.auth.signOut();
  const clientAReloaded = await authenticatedClient(userA);
  const preferencesReloaded = createSupabasePreferencesRepository(clientAReloaded);
  assert((await preferencesReloaded.getByPortfolio(portfolioId)).dataSource === "SUPABASE", "Logout ou novo login alterou a preferencia remota.");
  await preferencesReloaded.upsertByPortfolio(portfolioId, { dataSource: "LOCAL" });
  assert((await preferencesReloaded.getByPortfolio(portfolioId)).dataSource === "LOCAL", "Retorno explicito ao LOCAL nao persistiu.");

  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: anonError } = await anon.from("profiles").select("id");
  assert(anonError, "Anon recebeu acesso a profiles.");
  const { error: anonPortfolioError } = await anon.from("portfolios").select("id");
  assert(anonPortfolioError, "Anon recebeu acesso a portfolios.");
  const { error: anonMembershipError } = await anon.from("portfolio_members").select("user_id");
  assert(anonMembershipError, "Anon recebeu acesso a memberships.");
  const { error: anonOperationsError } = await anon.from("portfolio_operations").select("id");
  assert(anonOperationsError, "Anon recebeu acesso a operacoes.");
  const { error: anonPreferencesError } = await anon.from("portfolio_preferences").select("data_source");
  assert(anonPreferencesError, "Anon recebeu acesso a preferencia de fonte.");
  const { error: anonSnapshotsError } = await anon.from("portfolio_snapshots").select("id");
  assert(anonSnapshotsError, "Anon recebeu acesso a snapshots.");
  const { error: anonRpcError } = await anon.rpc("create_portfolio_with_owner", {
    portfolio_name: "Anon forbidden",
  });
  assert(anonRpcError, "Anon executou RPC protegida.");
} finally {
  if (process.env.SUPABASE_TEST_KEEP_DATA !== "1") {
    for (const id of portfolioIds.reverse()) {
      const { error } = await admin.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    }
    for (const userId of createdUsers) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  }
}

console.log(
  "SDK validado: profile, carteiras, fonte LOCAL/SUPABASE, login/logout, assets, quotes, operacoes, snapshots, regressao, idempotencia, papeis e isolamento.",
);
