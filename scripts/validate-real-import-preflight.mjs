import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { canonicalOperations } from "./reconcile-real-import.mjs";

const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secret, "Credenciais server-only de teste ausentes.");

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const [portfolios, memberships, active, preferences, operations] = await Promise.all([
  client.from("portfolios").select("id,name,is_archived"),
  client.from("portfolio_members").select("portfolio_id,user_id,role"),
  client.from("user_portfolio_preferences").select("user_id,active_portfolio_id"),
  client.from("portfolio_preferences").select("portfolio_id,data_source"),
  client.from("portfolio_operations").select("portfolio_id,id"),
]);
for (const result of [portfolios, memberships, active, preferences, operations]) assert.ifError(result.error);

const candidates = portfolios.data.filter((portfolio) => !portfolio.is_archived).map((portfolio) => ({
  ...portfolio,
  ownerCount: memberships.data.filter((item) => item.portfolio_id === portfolio.id && item.role === "owner").length,
  activeUserCount: active.data.filter((item) => item.active_portfolio_id === portfolio.id).length,
  dataSource: preferences.data.find((item) => item.portfolio_id === portfolio.id)?.data_source || null,
  operationCount: operations.data.filter((item) => item.portfolio_id === portfolio.id).length,
}));
const eligible = candidates.filter((item) => item.ownerCount > 0 && item.activeUserCount > 0 && item.dataSource === "SUPABASE");
assert.equal(eligible.length, 1, "A carteira de destino não é inequívoca.");

const fixturePrefixes = ["10000000-", "50000000-", "51000000-"];
assert.equal(operations.data.filter((item) => fixturePrefixes.some((prefix) => item.id.startsWith(prefix))).length, 0, "Fixture encontrada remotamente.");

const migrationService = await readFile(new URL("../lib/services/operationsMigrationService.js", import.meta.url), "utf8");
const dataSourceService = await readFile(new URL("../lib/services/dataSourceResolver.js", import.meta.url), "utf8");
assert(migrationService.includes("createOperationsSafetyBackup"), "Backup pré-importação indisponível.");
assert(migrationService.includes("replaceAllByPortfolio"), "Importação não usa upsert reconciliado.");
assert(!migrationService.includes("dual write"), "Fluxo sugere dual write.");
assert(dataSourceService.includes("DATA_SOURCE.SUPABASE"), "Resolver não reconhece SUPABASE.");

const remoteOperations = await createSupabaseOperationsRepository(client).listByPortfolio(eligible[0].id);
const comparable = (item) => JSON.stringify({ ticker: item.ticker, assetName: item.assetName, assetType: item.assetType, operationType: item.operationType, date: item.date, quantity: item.quantity, unitPrice: item.unitPrice, fees: item.fees, totalValue: item.totalValue, ratioFrom: item.ratioFrom, ratioTo: item.ratioTo, attributedCost: item.attributedCost, targetTicker: item.targetTicker, targetQuantity: item.targetQuantity, transferredCost: item.transferredCost });
const remoteById = new Map(remoteOperations.map((item) => [item.id, item]));
const remoteSignatures = new Map(remoteOperations.map((item) => [comparable(item), item.id]));
const idConflicts = canonicalOperations.filter((item) => remoteById.has(item.id) && comparable(remoteById.get(item.id)) !== comparable(item));
const semanticDuplicates = canonicalOperations.filter((item) => remoteSignatures.has(comparable(item)) && remoteSignatures.get(comparable(item)) !== item.id);
assert.equal(idConflicts.length, 0, "Conflito de UUID com operação remota.");
assert.equal(semanticDuplicates.length, 0, "Possível duplicação econômica com operação remota existente.");
const canonicalTickers = new Set(canonicalOperations.map((item) => item.ticker));
const overlapping = remoteOperations.filter((item) => canonicalTickers.has(item.ticker));
const combinedPositions = calculatePositions([...remoteOperations, ...canonicalOperations], []);
const approvedByTicker = new Map(calculatePositions(canonicalOperations, []).map((item) => [item.ticker, item]));
const combinedDivergences = combinedPositions.filter((item) => approvedByTicker.has(item.ticker)).filter((item) => {
  const approved = approvedByTicker.get(item.ticker);
  return Math.abs(item.quantity - approved.quantity) > 1e-8 || Math.abs(item.invested - approved.invested) > 1e-8 || Math.abs(item.realizedProfit - approved.realizedProfit) > 1e-8;
}).map((item) => ({ ticker: item.ticker, quantityDelta: item.quantity - approvedByTicker.get(item.ticker).quantity, investedDelta: item.invested - approvedByTicker.get(item.ticker).invested, realizedProfitDelta: item.realizedProfit - approvedByTicker.get(item.ticker).realizedProfit }));

console.log(JSON.stringify({
  target: { id: eligible[0].id, name: eligible[0].name, dataSource: eligible[0].dataSource, role: "owner", existingOperations: eligible[0].operationCount },
  checks: { uniqueDestination: true, activePortfolio: true, supabaseSelected: true, fixturesAbsent: true, backupAvailable: true, dualWriteAbsent: true, oneAtomicBatchFor109Events: canonicalOperations.length <= 500, idConflicts: idConflicts.length, semanticDuplicates: semanticDuplicates.length },
  preexistingOverlap: overlapping.map((item) => ({ ticker: item.ticker, operationType: item.operationType })),
  combinedDivergences,
}, null, 2));
