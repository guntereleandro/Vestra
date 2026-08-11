import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { createSupabaseOperationsRepository } from "../lib/repositories/supabase/supabaseOperationsRepository.js";
import { canonicalOperations, result as approved } from "./reconcile-real-import.mjs";

const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
assert(url && secret);
const manifest = JSON.parse(await readFile(new URL("../data/imports/vestra_real_import_equivalence_manifest.json", import.meta.url), "utf8"));
const aliases = new Map(manifest.aliases.map((item) => [item.canonical_id, item.preserved_remote_id]));
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const repository = createSupabaseOperationsRepository(client);
const remote = await repository.listByPortfolio(manifest.portfolio_id);
assert.equal(remote.length, 109, "Total remoto diferente de 109.");
const byId = new Map(remote.map((item) => [item.id, item]));
const economic = (item) => JSON.stringify({ ticker: item.ticker, operationType: item.operationType, date: item.date, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), fees: Number(item.fees), totalValue: Number(item.totalValue), assetType: item.assetType });
const full = (item) => JSON.stringify({ ticker: item.ticker, assetName: item.assetName, assetType: item.assetType, operationType: item.operationType, date: item.date, quantity: item.quantity, unitPrice: item.unitPrice, fees: item.fees, totalValue: item.totalValue, ratioFrom: item.ratioFrom, ratioTo: item.ratioTo, attributedCost: item.attributedCost, targetTicker: item.targetTicker, targetQuantity: item.targetQuantity, transferredCost: item.transferredCost });
const statuses = canonicalOperations.map((item) => {
  const deterministic = byId.get(item.id);
  if (deterministic) return full(deterministic) === full(item) ? "DETERMINISTIC" : "CONFLICT";
  const aliased = byId.get(aliases.get(item.id));
  return aliased && economic(aliased) === economic(item) ? "ALIAS" : "MISSING";
});
assert.equal(statuses.filter((item) => item === "DETERMINISTIC").length, 101);
assert.equal(statuses.filter((item) => item === "ALIAS").length, 8);
assert.equal(statuses.filter((item) => item === "MISSING").length, 0);
assert.equal(statuses.filter((item) => item === "CONFLICT").length, 0);

const positions = calculatePositions(remote, []);
const byTicker = new Map(positions.map((item) => [item.ticker, item]));
const eq = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 1e-8;
for (const item of approved.positions) assert(eq(byTicker.get(item.ticker)?.quantity, item.expectedQuantity), `Quantidade divergente: ${item.ticker}`);
assert(eq(byTicker.get("GGBR4").invested, 178.42333333333335) && eq(byTicker.get("GGBR4").averagePrice, 17.842333333333336));
assert(eq(byTicker.get("GOAU4").invested, 237.1) && eq(byTicker.get("GOAU4").averagePrice, 9.879166666666668));
assert(eq(byTicker.get("SADI11")?.quantity, 0) && eq(byTicker.get("SAPI11").realizedProfit, 0));
assert(eq(byTicker.get("TESOURO-IPCA-2032-20320815").quantity, 0.1) && eq(byTicker.get("TESOURO-IPCA-2032-20320815").invested, 294.73));
assert(eq(byTicker.get("LCI-BRB-107CDI-20270730").quantity, 1004.47));
assert(eq(byTicker.get("MP-CASH").invested, 171.58) && eq(byTicker.get("MP-CASH").quantity, 183.18) && eq(byTicker.get("MP-CASH").profit, 11.6));

console.log(JSON.stringify({ total: remote.length, deterministic: 101, aliases: 8, wouldCreate: 0, conflicts: 0, positions: approved.positions.map((item) => ({ ticker: item.ticker, quantity: byTicker.get(item.ticker)?.quantity || 0 })), ggbr4: { cost: byTicker.get("GGBR4").invested, averagePrice: byTicker.get("GGBR4").averagePrice }, goau4: { cost: byTicker.get("GOAU4").invested, averagePrice: byTicker.get("GOAU4").averagePrice }, treasury: { quantity: byTicker.get("TESOURO-IPCA-2032-20320815").quantity, cost: byTicker.get("TESOURO-IPCA-2032-20320815").invested }, lciBalance: byTicker.get("LCI-BRB-107CDI-20270730").quantity, cash: { contributions: byTicker.get("MP-CASH").invested, withdrawals: 0, yield: byTicker.get("MP-CASH").profit, balance: byTicker.get("MP-CASH").quantity }, reconciled: true }, null, 2));
