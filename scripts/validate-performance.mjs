import assert from "node:assert/strict";
import { generatePerformanceAnalysis } from "../lib/engine/performance/performanceEngine.js";

const history = [
  { date: "2026-01-01", currentValue: 10000, totalInvested: 10000, dividends: 0 },
  { date: "2026-02-01", currentValue: 12000, totalInvested: 11500, dividends: 100 },
  { date: "2026-03-01", currentValue: 10800, totalInvested: 11500, dividends: 200 },
  { date: "2026-04-01", currentValue: 14000, totalInvested: 13000, dividends: 400 },
];
const operations = [
  { ticker: "AAA3", operationType: "COMPRA", date: "2026-02-01", totalValue: 1500 },
  { ticker: "BBB3", operationType: "COMPRA", date: "2026-04-01", totalValue: 1500 },
];
const positions = [
  { ticker: "AAA3", name: "AAA", profit: 800, dividends: 200 },
  { ticker: "BBB3", name: "BBB", profit: -300, dividends: 50 },
];
const forbidden = /\b(compre|venda|oportunidade)\b/i;
try {
  const empty = generatePerformanceAnalysis({});
  assert.equal(empty.dataQuality.sufficientHistory, false);
  const result = generatePerformanceAnalysis({ history, operations, positions, generatedAt: "2026-04-01T00:00:00.000Z" });
  assert.equal(result.growth.growth, 4400);
  assert.equal(result.growth.contributions, 3000);
  assert.equal(result.growth.income, 400);
  assert.equal(result.growth.appreciation, 1000);
  assert.ok(result.drawdown.value > 0 && result.drawdown.percent > 0);
  assert.equal(result.contributions.best[0].ticker, "AAA3");
  assert.equal(result.contributions.worst[0].ticker, "BBB3");
  assert.ok(result.scores.wealth_consistency.value >= 0 && result.scores.wealth_consistency.value <= 100);
  assert.deepEqual(result, generatePerformanceAnalysis({ history: structuredClone(history), operations: structuredClone(operations), positions: structuredClone(positions), generatedAt: "2026-04-01T00:00:00.000Z" }));
  assert.equal(nonFinite(result), false);
  assert.equal(forbidden.test(JSON.stringify(result)), false);
  console.log("OK  histórico insuficiente");
  console.log("OK  crescimento e decomposição");
  console.log("OK  drawdown e contribuições");
  console.log("OK  score, determinismo e linguagem neutra");
  console.log("\n4 grupos de performance validados com sucesso.");
} catch (error) { console.error(`ERRO  performance: ${error.message}`); process.exitCode = 1; }
function nonFinite(value) { if (typeof value === "number") return !Number.isFinite(value); if (Array.isArray(value)) return value.some(nonFinite); if (value && typeof value === "object") return Object.values(value).some(nonFinite); return false; }
