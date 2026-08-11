import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { canonicalOperations, result as approvedDryRun } from "./reconcile-real-import.mjs";

const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secret, "Credenciais server-only ausentes.");
assert.equal(process.env.CONFIRM_REAL_IMPORT, "IMPORT_101_MISSING_EVENTS", "Confirmação explícita ausente.");
assert.equal(canonicalOperations.length, 109, "Contrato canônico diferente de 109 eventos.");

const manifest = JSON.parse(await readFile(new URL("../data/imports/vestra_real_import_equivalence_manifest.json", import.meta.url), "utf8"));
assert.equal(manifest.source_fingerprint, approvedDryRun.sourceFingerprint, "Manifesto pertence a outro staging.");
assert.equal(manifest.aliases.length, 8, "Manifesto não contém 8 aliases.");

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const repository = createSupabaseOperationsRepository(client);
const checked = async (query, message) => { const response = await query; assert.ifError(response.error, message); return response.data || []; };
const [portfolios, memberships, active, preferences] = await Promise.all([
  checked(client.from("portfolios").select("id,name,is_archived")),
  checked(client.from("portfolio_members").select("portfolio_id,user_id,role")),
  checked(client.from("user_portfolio_preferences").select("user_id,active_portfolio_id")),
  checked(client.from("portfolio_preferences").select("portfolio_id,data_source")),
]);
const eligible = portfolios.filter((portfolio) => !portfolio.is_archived && portfolio.name === "Minha carteira").filter((portfolio) => {
  const owners = memberships.filter((item) => item.portfolio_id === portfolio.id && item.role === "owner");
  return owners.length === 1 && active.some((item) => item.user_id === owners[0].user_id && item.active_portfolio_id === portfolio.id) && preferences.some((item) => item.portfolio_id === portfolio.id && item.data_source === "SUPABASE");
});
assert.equal(eligible.length, 1, "Usuário, carteira, owner ativo ou Data Source não são inequívocos.");
const portfolioId = eligible[0].id;
assert.equal(manifest.portfolio_id, portfolioId, "Manifesto pertence a outra carteira.");

const beforeRaw = await checked(client.from("portfolio_operations").select("*").eq("portfolio_id", portfolioId).order("trade_date").order("id"));
const before = await repository.listByPortfolio(portfolioId);
assert.equal(before.length, 8, "Estado remoto mudou: eram esperadas 8 operações.");
const economic = (item) => JSON.stringify({ ticker: item.ticker, operationType: item.operationType, date: item.date, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), fees: Number(item.fees), totalValue: Number(item.totalValue), assetType: item.assetType });
const full = (item) => JSON.stringify({ ticker: item.ticker, assetName: item.assetName, assetType: item.assetType, operationType: item.operationType, date: item.date, quantity: item.quantity, unitPrice: item.unitPrice, fees: item.fees, totalValue: item.totalValue, ratioFrom: item.ratioFrom, ratioTo: item.ratioTo, attributedCost: item.attributedCost, targetTicker: item.targetTicker, targetQuantity: item.targetQuantity, transferredCost: item.transferredCost });
const beforeById = new Map(before.map((item) => [item.id, item]));
const aliasesByCanonical = new Map(manifest.aliases.map((item) => [item.canonical_id, item.preserved_remote_id]));
for (const alias of manifest.aliases) {
  const canonical = canonicalOperations.find((item) => item.id === alias.canonical_id);
  const preserved = beforeById.get(alias.preserved_remote_id);
  assert(canonical && preserved && economic(canonical) === economic(preserved), `Alias divergente: ${alias.canonical_id}`);
}

const missing = canonicalOperations.filter((item) => !aliasesByCanonical.has(item.id));
assert.equal(missing.length, 101, "O lote ausente não contém exatamente 101 eventos.");
assert.equal(missing.some((item) => beforeById.has(item.id)), false, "Conflito de UUID nos 101 eventos.");
assert.equal(missing.some((item) => ["10000000-", "50000000-", "51000000-"].some((prefix) => item.id.startsWith(prefix))), false, "Fixture encontrada no lote.");
const missingEconomic = new Set(missing.map(economic));
assert.equal(before.some((item) => missingEconomic.has(economic(item))), false, "Duplicidade econômica fora do manifesto.");

const priorBackupPath = new URL("../backups/pre-real-import-2026-08-11T04-11-42.121Z.backup.json", import.meta.url);
const priorBackupPayload = await readFile(priorBackupPath, "utf8");
assert.equal(createHash("sha256").update(priorBackupPayload).digest("hex"), "2395090bfc903a9902d84240b2c54516667c216b39e06030bb1bdfab7e08426c", "Backup anterior perdeu integridade.");
const priorBackup = JSON.parse(priorBackupPayload);
assert.equal(priorBackup.portfolioId, portfolioId);
assert.equal(priorBackup.operationCount, 8);

const backup = { format: "vestra-supabase-pre-real-import-v1", createdAt: new Date().toISOString(), projectRef: new URL(url).hostname.split(".")[0], portfolioId, portfolioName: eligible[0].name, operationCount: beforeRaw.length, operations: beforeRaw };
const backupPayload = JSON.stringify(backup, null, 2);
const backupHash = createHash("sha256").update(backupPayload).digest("hex");
await mkdir(new URL("../backups/", import.meta.url), { recursive: true });
const backupPath = new URL(`../backups/pre-real-import-final-${backup.createdAt.replaceAll(":", "-")}.backup.json`, import.meta.url);
await writeFile(backupPath, backupPayload, { encoding: "utf8", flag: "wx" });

const importedIds = missing.map((item) => item.id);
let wrote = false;
try {
  const saved = await repository.replaceAllByPortfolio(portfolioId, missing.map((item) => ({ ...item, portfolioId })));
  wrote = true;
  assert.equal(saved.length, 101, "A transação não retornou 101 eventos.");
  const after = await repository.listByPortfolio(portfolioId);
  assert.equal(after.length, 109, "Total remoto diferente de 109 eventos econômicos.");
  for (const [id, item] of beforeById) assert.equal(full(after.find((remote) => remote.id === id)), full(item), `Operação preservada alterada: ${id}`);
  for (const item of missing) assert.equal(full(after.find((remote) => remote.id === item.id)), full(item), `Round-trip divergente: ${item.id}`);

  const positions = calculatePositions(after, []);
  const byTicker = new Map(positions.map((item) => [item.ticker, item]));
  const equal = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 1e-8;
  for (const item of approvedDryRun.positions) assert(equal(byTicker.get(item.ticker)?.quantity, item.expectedQuantity), `Quantidade divergente: ${item.ticker}`);
  assert(equal(byTicker.get("GGBR4").invested, 178.42333333333335) && equal(byTicker.get("GGBR4").averagePrice, 17.842333333333336), "GGBR4 divergente.");
  assert(equal(byTicker.get("GOAU4").invested, 237.1) && equal(byTicker.get("GOAU4").averagePrice, 9.879166666666668), "GOAU4 divergente.");
  assert(equal(byTicker.get("SADI11")?.quantity, 0) && equal(byTicker.get("SAPI11").realizedProfit, 0), "Conversão SADI/SAPI divergente.");
  assert(equal(byTicker.get("TESOURO-IPCA-2032-20320815").quantity, 0.1) && equal(byTicker.get("TESOURO-IPCA-2032-20320815").invested, 294.73), "Tesouro divergente.");
  assert(equal(byTicker.get("LCI-BRB-107CDI-20270730").quantity, 1004.47), "LCI divergente.");
  assert(equal(byTicker.get("MP-CASH").invested, 171.58) && equal(byTicker.get("MP-CASH").quantity, 183.18) && equal(byTicker.get("MP-CASH").profit, 11.6), "Mercado Pago divergente.");

  const afterById = new Map(after.map((item) => [item.id, item]));
  const rerun = canonicalOperations.map((item) => {
    const deterministic = afterById.get(item.id);
    if (deterministic) return full(deterministic) === full(item) ? "DETERMINISTIC" : "CONFLICT";
    const preserved = afterById.get(aliasesByCanonical.get(item.id));
    return preserved && economic(preserved) === economic(item) ? "ALIAS" : "MISSING";
  });
  assert.equal(rerun.filter((status) => status === "DETERMINISTIC").length, 101);
  assert.equal(rerun.filter((status) => status === "ALIAS").length, 8);
  assert.equal(rerun.filter((status) => status === "MISSING").length, 0);
  assert.equal(rerun.filter((status) => status === "CONFLICT").length, 0);

  console.log(JSON.stringify({ backupPath: decodeURIComponent(backupPath.pathname).replace(/^\/(.:)/, "$1"), backupSha256: backupHash, destination: { portfolioId, name: eligible[0].name, role: "owner", dataSource: "SUPABASE" }, imported: 101, preservedByAlias: 8, total: 109, idempotency: { deterministic: 101, aliases: 8, wouldCreate: 0, conflicts: 0 }, reconciliation: { positions: approvedDryRun.positions.map((item) => ({ ticker: item.ticker, quantity: byTicker.get(item.ticker)?.quantity || 0 })), ggbr4: { cost: byTicker.get("GGBR4").invested, averagePrice: byTicker.get("GGBR4").averagePrice }, goau4: { cost: byTicker.get("GOAU4").invested, averagePrice: byTicker.get("GOAU4").averagePrice }, treasury: { quantity: byTicker.get("TESOURO-IPCA-2032-20320815").quantity, cost: byTicker.get("TESOURO-IPCA-2032-20320815").invested }, lciBalance: byTicker.get("LCI-BRB-107CDI-20270730").quantity, cash: { contributions: byTicker.get("MP-CASH").invested, withdrawals: 0, yield: byTicker.get("MP-CASH").profit, balance: byTicker.get("MP-CASH").quantity } }, reconciled: true }, null, 2));
} catch (error) {
  if (wrote) {
    const rollback = await client.from("portfolio_operations").delete({ count: "exact" }).eq("portfolio_id", portfolioId).in("id", importedIds);
    if (rollback.error || rollback.count !== 101) throw new AggregateError([error, rollback.error || new Error(`Rollback removeu ${rollback.count} de 101 eventos.`)], "Falha na importação e no rollback integral.");
  }
  throw error;
}
