import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { calculatePortfolioTotals } from "../lib/engine/totals.js";
import { generatePortfolioDiagnostics } from "../lib/engine/diagnostics/index.js";
import { calculateBehaviorMetrics } from "../lib/engine/diagnostics/behaviorMetrics.js";
import { calculateWealthGrowth } from "../lib/engine/performance/wealthGrowth.js";
import { createPortfolioSnapshot } from "../lib/data/portfolioHistory.js";
import { mergeJourneyRecords } from "../lib/data/journeyRecords.js";
import { getJourneyRecordCandidates, prepareAchievements, prepareTimeline } from "../lib/dashboard/dailyExperience.js";
import { canonicalOperations, result as approved } from "./reconcile-real-import.mjs";

const base = (id, ticker, assetType, operationType, date, totalValue, extra = {}) => ({ id, ticker, assetName: ticker, assetType, operationType, date, quantity: 0, unitPrice: 0, fees: 0, totalValue, ...extra });
const dashboard = (operations) => {
  const positions = calculatePositions(operations, []);
  const totals = calculatePortfolioTotals(positions);
  const candidates = getJourneyRecordCandidates({ operations, positions, totals, portfolioHistory: [] });
  const records = mergeJourneyRecords({ largestDividend: { key: "largestDividend", value: 999, date: "2020-01-01", ticker: "INVALID" } }, candidates);
  const timeline = prepareTimeline({ operations, records });
  const achievements = prepareAchievements({ operations, totals });
  return { positions, totals, candidates, records, timeline, achievements, snapshot: createPortfolioSnapshot(positions, "2026-08-11") };
};
const noDividendRecord = (result) => {
  assert.equal(result.totals.dividends, 0);
  assert.equal(result.candidates.some((item) => item.key === "largestDividend"), false);
  assert.equal("largestDividend" in result.records, false);
  assert.equal(result.timeline.some((item) => item.type === "FIRST_DIVIDEND" || item.type === "largestDividend"), false);
  assert.equal(result.achievements.find((item) => item.key === "first-dividend").unlocked, false);
  assert.equal(result.snapshot.dividends, 0);
};
const incomeDiagnostics = (operations) => generatePortfolioDiagnostics({ operations, positions: calculatePositions(operations, []), generatedAt: "2026-08-11T12:00:00.000Z" });
const assertNoIncomeDiagnostics = (result) => {
  assert.equal(result.diagnostics.find((item) => item.id === "income-total-by-asset").metrics.totalIncome, 0);
  assert.equal(result.diagnostics.find((item) => item.id === "income-concentration").status, "not_applicable");
  assert.equal(result.diagnostics.find((item) => item.id === "risk-income-dependency").status, "insufficient_data");
  assert.equal(result.context.behaviorMetrics.totalIncome, 0);
  assert.equal(result.context.behaviorMetrics.incomeCount, 0);
};

const cashOperations = [
  base("cash-1", "MP-CASH", "Caixa Remunerado", "CASH_DEPOSIT", "2026-01-02", 171.58),
  base("cash-2", "MP-CASH", "Caixa Remunerado", "RENDIMENTO", "2026-08-11", 11.6),
];
const cash = dashboard(cashOperations);
assert.ok(Math.abs(cash.positions[0].quantity - 183.18) < 1e-8);
assert.ok(Math.abs(cash.positions[0].profit - 11.6) < 1e-8);
noDividendRecord(cash);
assertNoIncomeDiagnostics(incomeDiagnostics(cashOperations));
const cashGrowth = calculateWealthGrowth([{ date: "2026-01-01", currentValue: 0, dividends: 0 }, { date: "2026-08-12", currentValue: 183.18, dividends: 0 }], cashOperations);
assert.ok(Math.abs(cashGrowth.contributions - 171.58) < 1e-8);
assert.ok(Math.abs(cashGrowth.appreciation - 11.6) < 1e-8);
assert.equal(cashGrowth.income, 0);

const lciOperations = [
  base("lci-1", "LCI-BRB", "Renda Fixa", "FIXED_INCOME_APPLICATION", "2026-07-30", 1000),
  base("lci-2", "LCI-BRB", "Renda Fixa", "RENDIMENTO", "2026-08-11", 4.47),
];
const lci = dashboard(lciOperations);
assert.ok(Math.abs(lci.positions[0].quantity - 1004.47) < 1e-8);
assert.ok(Math.abs(lci.positions[0].profit - 4.47) < 1e-8);
noDividendRecord(lci);
assertNoIncomeDiagnostics(incomeDiagnostics(lciOperations));

for (const [operationType, expected] of [["DIVIDENDO", 10], ["JCP", 8], ["RENDIMENTO", 6]]) {
  const passive = dashboard([base(`passive-${operationType}`, "AAA3", "Ação", operationType, "2026-08-10", expected)]);
  assert.equal(passive.totals.dividends, expected);
  assert.equal(passive.candidates.find((item) => item.key === "largestDividend").value, expected);
  assert.equal(passive.timeline.some((item) => item.type === "FIRST_DIVIDEND"), true);
  assert.equal(passive.achievements.find((item) => item.key === "first-dividend").unlocked, true);
  const diagnostics = incomeDiagnostics([base(`diagnostic-${operationType}`, "AAA3", "Ação", operationType, "2026-08-10", expected)]);
  assert.equal(diagnostics.diagnostics.find((item) => item.id === "income-total-by-asset").metrics.totalIncome, expected);
  assert.equal(diagnostics.context.behaviorMetrics.totalIncome, expected);
}

const real = dashboard(canonicalOperations);
noDividendRecord(real);
for (const item of approved.positions) assert.ok(Math.abs((real.positions.find((position) => position.ticker === item.ticker)?.quantity || 0) - item.expectedQuantity) < 1e-8, item.ticker);
assert.ok(Math.abs(real.positions.find((item) => item.ticker === "GGBR4").invested - 178.42333333333335) < 1e-8);
assert.ok(Math.abs(real.positions.find((item) => item.ticker === "GOAU4").invested - 237.1) < 1e-8);
assert.ok(Math.abs(real.positions.find((item) => item.ticker === "MP-CASH").quantity - 183.18) < 1e-8);
assert.ok(Math.abs(real.positions.find((item) => item.ticker === "LCI-BRB-107CDI-20270730").quantity - 1004.47) < 1e-8);
assertNoIncomeDiagnostics(incomeDiagnostics(canonicalOperations));

const behavior = calculateBehaviorMetrics([...cashOperations, ...lciOperations], "2026-08-11T12:00:00.000Z");
assert.equal(behavior.totalIncome, 0);
assert.equal(behavior.incomeCount, 0);

const semanticConsumers = [
  "lib/dashboard/dailyExperience.js",
  "lib/engine/incomeAnalytics.js",
  "lib/engine/portfolioAnalytics.js",
  "lib/engine/diagnostics/incomeDiagnostics.js",
  "lib/engine/diagnostics/behaviorMetrics.js",
  "lib/repositories/local/localDividendsRepository.js",
  "lib/repositories/supabase/supabaseDividendsRepository.js",
];
for (const file of semanticConsumers) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(source, /isPassiveIncomeOperation/, `${file}: regra oficial ausente`);
  assert.doesNotMatch(source, /(?:new Set|const\s+INCOME_TYPES)[^\n]*(?:DIVIDENDO|JCP|RENDIMENTO)/, `${file}: lista paralela de proventos`);
}

console.log("Semântica validada: capital, retorno econômico e proventos permanecem separados nos seis casos.");
