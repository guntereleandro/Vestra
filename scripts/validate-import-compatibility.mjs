import assert from "node:assert/strict";
import { normalizeOperations, validatePortfolioEvent } from "../lib/data/operations.js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { calculatePortfolioTotals } from "../lib/engine/totals.js";
import { calculateWealthGrowth } from "../lib/engine/performance/wealthGrowth.js";
import { classifyInvestidor10Record, IMPORT_CLASSIFICATION } from "../lib/import/portfolioImportClassifier.js";

const base = (id, ticker, assetName, assetType, operationType, date, extra = {}) => ({ id, ticker, assetName, assetType, operationType, date, quantity: 0, unitPrice: 0, fees: 0, totalValue: 0, notes: "fixture real sanitizada", ...extra });
const events = normalizeOperations([
  base("10000000-0000-4000-8000-000000000001", "SADI11", "SADI", "FII", "COMPRA", "2024-01-10", { quantity: 2, unitPrice: 100 }),
  base("10000000-0000-4000-8000-000000000002", "SADI11", "SADI", "FII", "SPLIT", "2024-10-16", { ratioFrom: 1, ratioTo: 10 }),
  base("10000000-0000-4000-8000-000000000003", "SADI11", "SADI", "FII", "CONVERSION", "2025-12-10", { quantity: 20, targetTicker: "SAPI11", targetAssetName: "SAPI", targetAssetType: "FII", targetQuantity: 18 }),
  base("10000000-0000-4000-8000-000000000004", "GGBR4", "Gerdau", "Ação", "COMPRA", "2024-01-01", { quantity: 100, unitPrice: 10 }),
  base("10000000-0000-4000-8000-000000000005", "GGBR4", "Gerdau", "Ação", "BONUS", "2024-06-01", { quantity: 10, attributedCost: 0 }),
  base("10000000-0000-4000-8000-000000000006", "GOAU4", "Metalúrgica Gerdau", "Ação", "COMPRA", "2024-01-01", { quantity: 50, unitPrice: 8 }),
  base("10000000-0000-4000-8000-000000000007", "GOAU4", "Metalúrgica Gerdau", "Ação", "BONUS", "2024-06-01", { quantity: 5, attributedCost: 50 }),
  base("10000000-0000-4000-8000-000000000008", "MP-CASH", "Mercado Pago", "Caixa Remunerado", "CASH_DEPOSIT", "2025-01-02", { totalValue: 10 }),
  base("10000000-0000-4000-8000-000000000009", "MP-CASH", "Mercado Pago", "Caixa Remunerado", "CASH_DEPOSIT", "2025-01-03", { totalValue: 20 }),
  base("10000000-0000-4000-8000-000000000010", "MP-CASH", "Mercado Pago", "Caixa Remunerado", "RENDIMENTO", "2025-01-04", { totalValue: 3 }),
  base("10000000-0000-4000-8000-000000000011", "MP-CASH", "Mercado Pago", "Caixa Remunerado", "CASH_WITHDRAWAL", "2025-01-05", { totalValue: 5 }),
  base("10000000-0000-4000-8000-000000000012", "TESOURO-IPCA-2032", "Tesouro IPCA+ 2032", "Renda Fixa", "COMPRA", "2025-02-01", { quantity: 0.1, unitPrice: 4000 }),
  base("10000000-0000-4000-8000-000000000014", "LCI-BRB-20270730", "LCI BRB 107% CDI", "Renda Fixa", "FIXED_INCOME_APPLICATION", "2026-07-30", { totalValue: 1000 }),
  base("10000000-0000-4000-8000-000000000015", "LCI-BRB-20270730", "LCI BRB 107% CDI", "Renda Fixa", "RENDIMENTO", "2026-08-11", { totalValue: 4.47 }),
  base("10000000-0000-4000-8000-000000000016", "CDB-TESTE", "CDB Teste", "Renda Fixa", "FIXED_INCOME_APPLICATION", "2026-01-01", { totalValue: 1000 }),
  base("10000000-0000-4000-8000-000000000017", "CDB-TESTE", "CDB Teste", "Renda Fixa", "RENDIMENTO", "2026-02-01", { totalValue: 100 }),
  base("10000000-0000-4000-8000-000000000018", "CDB-TESTE", "CDB Teste", "Renda Fixa", "FIXED_INCOME_REDEMPTION", "2026-03-01", { totalValue: 550 }),
]);

assert.equal(events.length, 17);
for (const event of events) assert.equal(validatePortfolioEvent(event).valid, true, event.operationType);
const positions = calculatePositions(events, [{ ticker: "GGBR4", currentQuote: 12 }, { ticker: "GOAU4", currentQuote: 9 }, { ticker: "SAPI11", currentQuote: 12 }]);
const byTicker = new Map(positions.map((position) => [position.ticker, position]));
assert.equal(byTicker.get("SAPI11").quantity, 18);
assert.equal(byTicker.get("SAPI11").invested, 200);
assert.equal(byTicker.get("SAPI11").realizedProfit, 0);
assert.equal(byTicker.get("GGBR4").quantity, 110);
assert.ok(Math.abs(byTicker.get("GGBR4").averagePrice - (1000 / 110)) < 1e-8);
assert.equal(byTicker.get("GOAU4").quantity, 55);
assert.equal(byTicker.get("GOAU4").invested, 450);
assert.equal(byTicker.get("MP-CASH").quantity, 28);
assert.equal(byTicker.get("MP-CASH").invested, 25);
assert.equal(byTicker.get("MP-CASH").profit, 3);
assert.equal(byTicker.get("MP-CASH").dividends, 0);
assert.equal(byTicker.get("TESOURO-IPCA-2032").quantity, 0.1);
assert.equal(byTicker.get("TESOURO-IPCA-2032").invested, 400);
assert.equal(byTicker.get("LCI-BRB-20270730").quantity, 1004.47);
assert.equal(byTicker.get("LCI-BRB-20270730").invested, 1000);
assert.ok(Math.abs(byTicker.get("LCI-BRB-20270730").profit - 4.47) < 1e-8);
assert.equal(byTicker.get("LCI-BRB-20270730").dividends, 0);
assert.equal(byTicker.get("CDB-TESTE").quantity, 550);
assert.equal(byTicker.get("CDB-TESTE").invested, 500);
assert.equal(byTicker.get("CDB-TESTE").realizedProfit, 50);
assert.equal(calculatePortfolioTotals(positions).realizedProfit, 50);
const growth = calculateWealthGrowth([{ date: "2025-01-01", currentValue: 0, dividends: 0 }, { date: "2025-01-06", currentValue: 28, dividends: 0 }], events);
assert.equal(growth.contributions, 25);
assert.equal(growth.appreciation, 3);
assert.equal(classifyInvestidor10Record({ origin: "Bônus" }), IMPORT_CLASSIFICATION.BONUS);
assert.equal(classifyInvestidor10Record({ origin: "Desdobramento" }), IMPORT_CLASSIFICATION.SPLIT);
assert.equal(classifyInvestidor10Record({ origin: "Conversão" }), IMPORT_CLASSIFICATION.CONVERSION);
assert.equal(classifyInvestidor10Record({ assetName: "CDB - Mercado Pago - Pós-Fixado - 120% CDI" }), IMPORT_CLASSIFICATION.REMUNERATED_CASH);
const pendingBonus = normalizeOperations([base("10000000-0000-4000-8000-000000000013", "GGBR4", "Gerdau", "Ação", "BONUS", "2024-06-01", { quantity: 1 })])[0];
assert.equal(validatePortfolioEvent(pendingBonus).reason, "BONUS_COST_PENDING");

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.get(String(key)) ?? null; }
  setItem(key, value) { this.data.set(String(key), String(value)); }
  removeItem(key) { this.data.delete(String(key)); }
}
globalThis.localStorage = new MemoryStorage();
const [{ localOperationsRepository }, { LOCAL_DEFAULT_PORTFOLIO_ID }, { createBackup, validateBackup }] = await Promise.all([
  import("../lib/repositories/local/localOperationsRepository.js"),
  import("../lib/repositories/repositoryTypes.js"),
  import("../lib/data/storage.js"),
]);
await localOperationsRepository.replaceAllByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID, events);
const localEvents = await localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert.equal(localEvents.length, events.length);
const backup = createBackup();
assert.equal(backup.version, 6);
assert.equal(validateBackup(backup).operations.length, events.length);

console.log("Compatibilidade de importação validada: split, bônus, conversão, caixa remunerado e Tesouro fracionário.");
