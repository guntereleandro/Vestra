import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { canonicalOperations, result as approved } from "./reconcile-real-import.mjs";

const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secret, "Credenciais server-only ausentes.");
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const checked = async (query) => { const response = await query; assert.ifError(response.error); return response.data || []; };
const [portfolios, members, active, preferences] = await Promise.all([
  checked(client.from("portfolios").select("id,name,is_archived")),
  checked(client.from("portfolio_members").select("portfolio_id,user_id,role")),
  checked(client.from("user_portfolio_preferences").select("user_id,active_portfolio_id")),
  checked(client.from("portfolio_preferences").select("portfolio_id,data_source")),
]);
const targets = portfolios.filter((portfolio) => portfolio.name === "Minha carteira" && !portfolio.is_archived).filter((portfolio) => {
  const owner = members.find((item) => item.portfolio_id === portfolio.id && item.role === "owner");
  return owner && active.some((item) => item.user_id === owner.user_id && item.active_portfolio_id === portfolio.id) && preferences.some((item) => item.portfolio_id === portfolio.id && item.data_source === "SUPABASE");
});
assert.equal(targets.length, 1, "Destino não inequívoco.");
const remote = await createSupabaseOperationsRepository(client).listByPortfolio(targets[0].id);
assert.equal(remote.length, 8, "Quantidade remota diferente de 8.");
const manifest = JSON.parse(await readFile(new URL("../data/imports/vestra_real_import_equivalence_manifest.json", import.meta.url), "utf8"));
assert.equal(manifest.source_fingerprint, approved.sourceFingerprint, "Manifesto pertence a outro staging.");
assert.equal(manifest.portfolio_id, targets[0].id, "Manifesto pertence a outra carteira.");

const numberEqual = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 1e-8;
const economicFields = ["operationType", "date", "quantity", "unitPrice", "fees", "totalValue", "assetType"];
const differences = (remoteItem, candidate) => economicFields.filter((field) => ["quantity", "unitPrice", "fees", "totalValue"].includes(field) ? !numberEqual(remoteItem[field], candidate[field]) : remoteItem[field] !== candidate[field]).map((field) => ({ field, remote: remoteItem[field], staging: candidate[field] }));
const rows = remote.map((remoteItem) => {
  const sameTickerType = canonicalOperations.filter((item) => item.ticker === remoteItem.ticker && item.operationType === remoteItem.operationType);
  const ranked = sameTickerType.map((candidate) => ({ candidate, diffs: differences(remoteItem, candidate) })).sort((a, b) => a.diffs.length - b.diffs.length || a.candidate.date.localeCompare(b.candidate.date));
  const exact = ranked.filter((item) => item.diffs.length === 0);
  const classification = exact.length === 1 ? "EXACT_MATCH" : ranked.length ? "PROBABLE_MATCH" : "UNRELATED";
  const selected = exact.length === 1 ? exact[0] : ranked[0] || null;
  return {
    remote: remoteItem,
    candidate: selected?.candidate || null,
    classification,
    differences: selected?.diffs || [{ field: "event", remote: "present", staging: "absent" }],
    candidateCount: sameTickerType.length,
  };
});

const exactIds = new Set(rows.filter((row) => row.classification === "EXACT_MATCH").map((row) => row.candidate.id));
assert.equal(manifest.aliases.length, 8, "Manifesto deve possuir 8 aliases explícitos.");
for (const alias of manifest.aliases) {
  const row = rows.find((item) => item.remote.id === alias.preserved_remote_id && item.candidate?.id === alias.canonical_id);
  assert(row && row.classification === "EXACT_MATCH", `Alias não corresponde integralmente: ${alias.canonical_id}`);
}
const missing = canonicalOperations.filter((item) => !exactIds.has(item.id));
const combined = [...remote, ...missing];
const positions = calculatePositions(combined, []);
const byTicker = new Map(positions.map((item) => [item.ticker, item]));
const quantityDivergences = approved.positions.map((item) => ({ ticker: item.ticker, expected: item.expectedQuantity, calculated: byTicker.get(item.ticker)?.quantity || 0 })).filter((item) => !numberEqual(item.expected, item.calculated));
const financialChecks = {
  ggbr4Cost: byTicker.get("GGBR4")?.invested,
  ggbr4AveragePrice: byTicker.get("GGBR4")?.averagePrice,
  goau4Cost: byTicker.get("GOAU4")?.invested,
  goau4AveragePrice: byTicker.get("GOAU4")?.averagePrice,
  treasuryQuantity: byTicker.get("TESOURO-IPCA-2032-20320815")?.quantity,
  treasuryCost: byTicker.get("TESOURO-IPCA-2032-20320815")?.invested,
  lciBalance: byTicker.get("LCI-BRB-107CDI-20270730")?.quantity,
  cashContributions: byTicker.get("MP-CASH")?.invested,
  cashBalance: byTicker.get("MP-CASH")?.quantity,
};
const financialReconciled = quantityDivergences.length === 0 && numberEqual(financialChecks.ggbr4Cost, 178.42333333333335) && numberEqual(financialChecks.ggbr4AveragePrice, 17.842333333333336) && numberEqual(financialChecks.goau4Cost, 237.1) && numberEqual(financialChecks.goau4AveragePrice, 9.879166666666668) && numberEqual(financialChecks.treasuryQuantity, 0.1) && numberEqual(financialChecks.treasuryCost, 294.73) && numberEqual(financialChecks.lciBalance, 1004.47) && numberEqual(financialChecks.cashContributions, 171.58) && numberEqual(financialChecks.cashBalance, 183.18);
const simulatedFutureRemote = [...remote, ...missing];
const futureById = new Map(simulatedFutureRemote.map((item) => [item.id, item]));
const aliasesByCanonicalId = new Map(manifest.aliases.map((item) => [item.canonical_id, item.preserved_remote_id]));
const futureResolution = canonicalOperations.map((item) => {
  if (futureById.has(item.id)) return { canonicalId: item.id, status: comparableForResolution(futureById.get(item.id)) === comparableForResolution(item) ? "PRESENT_DETERMINISTIC_ID" : "CONFLICT" };
  const remoteId = aliasesByCanonicalId.get(item.id);
  const aliased = remoteId && futureById.get(remoteId);
  return { canonicalId: item.id, status: aliased && comparableForResolution(aliased) === comparableForResolution(item) ? "PRESENT_PRESERVED_ALIAS" : "MISSING" };
});
const futureWouldCreate = futureResolution.filter((item) => item.status === "MISSING").length;
const futureConflicts = futureResolution.filter((item) => item.status === "CONFLICT").length;

console.log(JSON.stringify({
  target: { id: targets[0].id, name: targets[0].name },
  rows: rows.map((row) => ({
    remote: { id: row.remote.id, ticker: row.remote.ticker, operationType: row.remote.operationType, date: row.remote.date, quantity: row.remote.quantity, unitPrice: row.remote.unitPrice, fees: row.remote.fees, totalValue: row.remote.totalValue, assetType: row.remote.assetType, source: row.remote.source, notes: row.remote.notes },
    candidate: row.candidate && { id: row.candidate.id, ticker: row.candidate.ticker, operationType: row.candidate.operationType, date: row.candidate.date, quantity: row.candidate.quantity, unitPrice: row.candidate.unitPrice, fees: row.candidate.fees, totalValue: row.candidate.totalValue, assetType: row.candidate.assetType, notes: row.candidate.notes },
    classification: row.classification,
    differences: row.differences,
    candidateCount: row.candidateCount,
  })),
  exactMatches: exactIds.size,
  remainingToImport: missing.length,
  quantityDivergences,
  financialChecks,
  financialReconciled,
  futureIdempotency: { presentByDeterministicId: futureResolution.filter((item) => item.status === "PRESENT_DETERMINISTIC_ID").length, presentByPreservedAlias: futureResolution.filter((item) => item.status === "PRESENT_PRESERVED_ALIAS").length, wouldCreate: futureWouldCreate, conflicts: futureConflicts },
  approved: rows.every((row) => row.classification === "EXACT_MATCH") && financialReconciled && futureWouldCreate === 0 && futureConflicts === 0,
}, null, 2));

function comparableForResolution(item) {
  return JSON.stringify({ ticker: item.ticker, operationType: item.operationType, date: item.date, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), fees: Number(item.fees), totalValue: Number(item.totalValue), assetType: item.assetType });
}
