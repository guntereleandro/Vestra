import assert from "node:assert/strict";
import { analyzeIncome } from "../lib/engine/incomeAnalytics.js";

const records = [
  { id: "1", ticker: "AAA3", operationType: "DIVIDENDO", date: "2025-12-10", totalValue: 10 },
  { id: "2", ticker: "AAA3", operationType: "JCP", date: "2026-01-10", totalValue: 20 },
  { id: "3", ticker: "BBB11", operationType: "RENDIMENTO", date: "2026-01-10", totalValue: 30 },
  { id: "4", ticker: "AAA3", operationType: "COMPRA", date: "2026-01-11", totalValue: 999 },
];
assert.equal(analyzeIncome([]).total, 0);
const all = analyzeIncome(records);
assert.equal(all.total, 60); assert.equal(all.paymentCount, 3); assert.equal(all.monthlyAverage, null);
assert.equal(all.byAsset.find((item) => item.name === "AAA3").total, 30);
assert.equal(all.byType.length, 3); assert.equal(all.monthsWithoutPayments, 0);
assert.equal(analyzeIncome(records, { ticker: "AAA3" }).periodTotal, 30);
assert.equal(analyzeIncome(records, { type: "JCP" }).periodTotal, 20);
assert.equal(analyzeIncome(records, { year: "2025" }).paymentCount, 1);
assert.equal(analyzeIncome(records, { year: "2026", month: "01" }).paymentCount, 2);
assert.equal(analyzeIncome(records, { startDate: "2026-01-01", endDate: "2026-01-31" }).periodTotal, 50);
assert.deepEqual(analyzeIncome(records, { order: "oldest" }).filtered.map((item) => item.id), ["1", "2", "3"]);
console.log("Proventos validados: totais, tipos, ativos, período, média, filtros, mesmo dia e ordenação.");
