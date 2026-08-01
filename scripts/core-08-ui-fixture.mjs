import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseProfilesRepository } from "../lib/repositories/supabase/supabaseProfilesRepository.js";
import { createSupabasePortfoliosRepository } from "../lib/repositories/supabase/supabasePortfoliosRepository.js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { createSupabasePreferencesRepository } from "../lib/repositories/supabase/supabasePreferencesRepository.js";

const [mode, fixtureFile] = process.argv.slice(2);
const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
if (!mode || !fixtureFile || !url || !publishableKey || !secretKey) throw new Error("Configuracao de fixture incompleta.");
const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

if (mode === "setup") {
  const suffix = randomUUID();
  const email = `core08-ui-${suffix}@example.invalid`;
  const password = `Ui-${randomUUID()}-Aa1!`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError) throw createError;
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError) throw loginError;
  await createSupabaseProfilesRepository(client).upsert({ displayName: "CORE-08 UI" });
  const portfolio = await createSupabasePortfoliosRepository(client).create({ name: "Carteira CORE-08 UI" });
  await createSupabaseOperationsRepository(client).create({
    id: randomUUID(), portfolioId: portfolio.id, ticker: "UITEST3", assetName: "Ativo remoto CORE-08",
    assetType: "Acao", operationType: "COMPRA", date: "2026-08-01", quantity: 7,
    unitPrice: 13.5, fees: 0, totalValue: 94.5, notes: "fixture temporaria",
  });
  await createSupabasePreferencesRepository(client).upsertByPortfolio(portfolio.id, { dataSource: "SUPABASE" });
  fs.writeFileSync(fixtureFile, JSON.stringify({ email, password, userId: created.user.id, portfolioId: portfolio.id }), { encoding: "utf8", mode: 0o600 });
  console.log("Fixture visual criada.");
} else if (mode === "cleanup") {
  const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
  const { error: portfolioError } = await admin.from("portfolios").delete().eq("id", fixture.portfolioId);
  if (portfolioError) throw portfolioError;
  const { error: userError } = await admin.auth.admin.deleteUser(fixture.userId);
  if (userError) throw userError;
  fs.rmSync(fixtureFile, { force: true });
  console.log("Fixture visual removida.");
} else {
  throw new Error("Modo invalido.");
}
