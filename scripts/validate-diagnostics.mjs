import assert from "node:assert/strict";
import { generatePortfolioDiagnostics } from "../lib/engine/diagnostics/index.js";
import { validateDiagnosticPreferences } from "../lib/data/diagnosticPreferences.js";
import { assessRiskProfile, riskParametersToStrategy } from "../lib/engine/diagnostics/riskProfileAssessment.js";
import { validateRiskProfile } from "../lib/data/riskProfile.js";

const generatedAt = "2026-07-13T12:00:00.000Z";
const quoteDate = "2026-07-10T12:00:00.000Z";
const metadata = [
  { ticker: "AAA3", sector: "Financeiro", country: "Brasil", currency: "BRL", type: "Ação" },
  { ticker: "BBB3", sector: "Energia", country: "Brasil", currency: "BRL", type: "Ação" },
  { ticker: "CCC11", sector: "Imobiliário", country: "Brasil", currency: "BRL", type: "FII" },
  { ticker: "DDD", sector: "Tecnologia", country: "Estados Unidos", currency: "USD", type: "ETF" },
  { ticker: "EEE", sector: "Renda fixa", country: "Brasil", currency: "BRL", type: "Renda Fixa" },
];
const position = (ticker, currentValue, extra = {}) => ({ ticker, type: metadata.find((item) => item.ticker === ticker)?.type || "Ação", quantity: 1, currentValue, currentPrice: currentValue, hasQuote: true, quoteUpdatedAt: quoteDate, dividends: 0, ...extra });
const income = (ticker, totalValue, date) => ({ id: `${ticker}-${date}`, ticker, operationType: "DIVIDENDO", totalValue, date });

const scenarios = {
  "carteira vazia": { generatedAt },
  "carteira com um ativo": { generatedAt, positions: [position("AAA3", 100)], totals: { current: 100 }, assetMetadata: metadata },
  "carteira diversificada": { generatedAt, positions: [position("AAA3", 20), position("BBB3", 20), position("CCC11", 20), position("DDD", 20), position("EEE", 20)], totals: { current: 100 }, assetMetadata: metadata },
  "carteira concentrada": { generatedAt, positions: [position("AAA3", 80), position("BBB3", 10), position("CCC11", 10)], totals: { current: 100 }, assetMetadata: metadata },
  "carteira sem cotações": { generatedAt, positions: [position("AAA3", 0, { hasQuote: false, currentValue: null })], assetMetadata: metadata },
  "carteira sem setores": { generatedAt, positions: [position("AAA3", 50), position("BBB3", 50)], totals: { current: 100 }, assetMetadata: metadata.map(({ sector, ...item }) => item) },
  "proventos concentrados": { generatedAt, positions: [position("AAA3", 50), position("BBB3", 50)], totals: { current: 100 }, assetMetadata: metadata, operations: [income("AAA3", 90, "2026-01-10"), income("BBB3", 10, "2026-06-10")] },
  "dados inválidos": { generatedAt, positions: [position("AAA3", 100)], totals: { current: 100 }, operations: [{ ticker: "", operationType: "X", totalValue: Number.NaN }], assetMetadata: [] },
};

const forbidden = /\b(compre|comprar|venda|vender|aumente|aumentar|reduza|reduzir|mantenha|manter|oportunidade|carteira boa|carteira ruim|investimento seguro|impulsivo|emocional|pânico|panico|comportamento ruim|disciplina ruim|estratégia certa|estratégia errada)\b/i;
let failures = 0;

for (const [name, fixture] of Object.entries(scenarios)) {
  try {
    const result = generatePortfolioDiagnostics(fixture);
    validateResult(result);
    assert.deepEqual(result, generatePortfolioDiagnostics(structuredClone(fixture)), "resultado não determinístico");
    assert.equal(forbidden.test(JSON.stringify(result)), false, "recomendação explícita encontrada");
    scenarioAssertions(name, result);
    console.log(`OK  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`ERRO  ${name}: ${error.message}`);
  }
}

const preferenceScenarios = [
  ["preferências vazias", {}, true],
  ["limites válidos", { maxPositionPercent: 15, maxClassPercent: 60 }, true],
  ["limite inválido", { maxPositionPercent: 101 }, false],
  ["alocação-alvo somando 100", { targetAllocation: { "Ações": 50, ETFs: 50 } }, true],
  ["alocação-alvo inválida", { targetAllocation: { "Ações": 60, ETFs: 30 } }, false],
  ["lista duplicada", { preferredCurrencies: ["USD", "usd"] }, false],
];
for (const [name, value, expected] of preferenceScenarios) {
  try { assert.equal(validateDiagnosticPreferences(value).valid, expected); console.log(`OK  ${name}`); }
  catch (error) { failures += 1; console.error(`ERRO  ${name}: ${error.message}`); }
}

const strategicFixture = { ...scenarios["carteira concentrada"], parameters: { maxPositionPercent: 15, maxClassPercent: 60, targetAllocation: { "Ações": 90, FIIs: 10 }, preferredCountries: ["Canadá"], preferredCurrencies: ["USD"] } };
try {
  const strategic = generatePortfolioDiagnostics(strategicFixture), strategicAgain = generatePortfolioDiagnostics(structuredClone(strategicFixture));
  assert.deepEqual(strategic, strategicAgain, "resultado estratégico não determinístico");
  assert.ok(strategic.diagnostics.some((item) => item.id.startsWith("strategy-position-") && item.status === "attention"), "limite por posição não diagnosticado");
  assert.ok(strategic.diagnostics.some((item) => item.id.startsWith("strategy-class-") && item.status === "attention"), "limite por classe não diagnosticado");
  assert.ok(strategic.diagnostics.some((item) => item.id === "strategy-country-canada"), "país preferido ausente não diagnosticado");
  assert.ok(strategic.diagnostics.some((item) => item.id === "strategy-currency-usd"), "moeda preferida ausente não diagnosticada");
  assert.equal(forbidden.test(JSON.stringify(strategic)), false, "linguagem prescritiva encontrada");
  const exact = generatePortfolioDiagnostics({ generatedAt, positions: [position("AAA3", 50), position("CCC11", 50)], totals: { current: 100 }, assetMetadata: metadata, parameters: { targetAllocation: { "Ações": 50, FIIs: 50 } } });
  assert.ok(exact.diagnostics.filter((item) => item.id.startsWith("strategy-target-")).every((item) => item.status === "observed"), "aderência exata não reconhecida");
  console.log("OK  diagnósticos personalizados");
} catch (error) { failures += 1; console.error(`ERRO  diagnósticos personalizados: ${error.message}`); }

const baseAnswers = { experienceLevel: "beginner", investmentHorizonYears: 1, liquidityNeed: "high", incomeStability: "low", lossTolerancePercent: 5, emergencyReserveStatus: "none", primaryObjective: "preserve_capital" };
try {
  assert.equal(assessRiskProfile({}).calculatedProfile, null, "respostas vazias deveriam ser insuficientes");
  assert.equal(assessRiskProfile(baseAnswers, generatedAt).calculatedProfile, "conservative");
  assert.equal(assessRiskProfile({ ...baseAnswers, experienceLevel: "intermediate", investmentHorizonYears: 5, liquidityNeed: "medium", incomeStability: "medium", lossTolerancePercent: 20, emergencyReserveStatus: "partial", primaryObjective: "balanced_growth" }, generatedAt).calculatedProfile, "moderate");
  const aggressive = assessRiskProfile({ ...baseAnswers, experienceLevel: "advanced", investmentHorizonYears: 15, liquidityNeed: "low", incomeStability: "high", lossTolerancePercent: 40, emergencyReserveStatus: "complete", primaryObjective: "long_term_growth" }, generatedAt);
  assert.equal(aggressive.calculatedProfile, "aggressive");
  assert.throws(() => assessRiskProfile({ ...baseAnswers, lossTolerancePercent: 101 }), /INVALID_LOSS_TOLERANCE/);
  assert.throws(() => assessRiskProfile({ ...baseAnswers, investmentHorizonYears: -1 }), /INVALID_HORIZON/);
  assert.equal(validateRiskProfile({ lossTolerancePercent: 101 }).valid, false);
  const originalPreferences = { maxPositionPercent: 12, targetAllocation: { "Ações": 100 } };
  assessRiskProfile(baseAnswers, generatedAt);
  assert.deepEqual(originalPreferences, { maxPositionPercent: 12, targetAllocation: { "Ações": 100 } }, "avaliação sobrescreveu preferências");
  const applied = riskParametersToStrategy(aggressive.parameters);
  assert.equal(applied.maxPositionPercent, aggressive.parameters.suggestedMaxPositionPercent, "aplicação explícita inválida");
  assert.equal(Math.round(Object.values(applied.targetAllocation).reduce((sum, value) => sum + value, 0)), 100, "alocação derivada não soma 100");
  const coherentFixture = { ...scenarios["carteira concentrada"], riskProfile: { ...baseAnswers, answers: baseAnswers, calculatedProfile: "conservative", calculatedAt: generatedAt } };
  const coherence = generatePortfolioDiagnostics(coherentFixture);
  assert.ok(coherence.diagnostics.some((item) => item.scope === "risk_profile"), "divergência de coerência ausente");
  assert.deepEqual(coherence, generatePortfolioDiagnostics(structuredClone(coherentFixture)), "coerência não determinística");
  assert.equal(forbidden.test(JSON.stringify(coherence)), false, "linguagem prescritiva no perfil");
  assert.equal(containsNonFinite(coherence), false, "valor não finito no perfil");
  console.log("OK  perfil e tolerância a risco");
} catch (error) { failures += 1; console.error(`ERRO  perfil e tolerância a risco: ${error.message}`); }

const buy = (ticker, date, value, assetType = "Ação") => ({ id: `buy-${ticker}-${date}`, ticker, assetType, operationType: "COMPRA", date, quantity: 1, unitPrice: value, totalValue: value });
const sell = (ticker, date, value, assetType = "Ação") => ({ id: `sell-${ticker}-${date}`, ticker, assetType, operationType: "VENDA", date, quantity: 1, unitPrice: value, totalValue: value });
try {
  const noOperations = generatePortfolioDiagnostics({ generatedAt, operations: [] });
  assert.equal(noOperations.scores.behavior_consistency.value, 0);
  const shortHistory = generatePortfolioDiagnostics({ generatedAt, operations: [buy("AAA3", "2026-06-01", 100)] });
  assert.equal(shortHistory.context.behaviorHistorySufficient, false);
  const regularOps = ["2026-02-05", "2026-03-05", "2026-04-05", "2026-05-05", "2026-06-05", "2026-07-05"].map((date, index) => buy(index % 2 ? "BBB3" : "AAA3", date, 100));
  const regular = generatePortfolioDiagnostics({ generatedAt, operations: regularOps });
  assert.equal(regular.context.behaviorMetrics.activeContributionMonths, 6);
  const irregular = generatePortfolioDiagnostics({ generatedAt, operations: [...regularOps.slice(0, 3), buy("AAA3", "2026-06-06", 800), buy("AAA3", "2026-06-07", 800), buy("AAA3", "2026-06-08", 800)] });
  assert.ok(irregular.diagnostics.some((item) => item.id === "behavior-asset-concentration"));
  assert.ok(irregular.diagnostics.some((item) => item.id === "behavior-rhythm-change"));
  const reducedOps = [buy("AAA3", "2026-02-05", 400), buy("AAA3", "2026-03-05", 400), buy("AAA3", "2026-04-05", 400), buy("BBB3", "2026-05-05", 100), buy("BBB3", "2026-06-05", 100), buy("BBB3", "2026-07-05", 100)];
  assert.ok(generatePortfolioDiagnostics({ generatedAt, operations: reducedOps }).diagnostics.find((item) => item.id === "behavior-rhythm-change").metrics.changePercent < 0);
  const turnoverOps = [buy("AAA3", "2025-10-01", 100), sell("AAA3", "2025-10-10", 100), buy("BBB3", "2025-11-01", 100), sell("BBB3", "2025-11-15", 100), buy("CCC3", "2025-12-01", 100), sell("CCC3", "2025-12-20", 100), ...regularOps];
  const turnover = generatePortfolioDiagnostics({ generatedAt, operations: turnoverOps });
  assert.ok(turnover.diagnostics.some((item) => item.id === "behavior-turnover"));
  assert.ok(turnover.diagnostics.some((item) => item.id === "behavior-short-holdings"));
  const longHold = generatePortfolioDiagnostics({ generatedAt, operations: [buy("AAA3", "2025-01-01", 100), sell("AAA3", "2026-02-01", 100), buy("BBB3", "2025-02-01", 100), sell("BBB3", "2026-03-01", 100), ...regularOps] });
  assert.ok(longHold.context.behaviorMetrics.averageHoldingDays > 365);
  const concentratedIncome = [...regularOps, ...["2026-02-10", "2026-03-10", "2026-04-10", "2026-05-10", "2026-06-10", "2026-07-10"].map((date) => income("AAA3", 100, date))];
  assert.ok(generatePortfolioDiagnostics({ generatedAt, operations: concentratedIncome }).diagnostics.some((item) => item.id === "behavior-income-dependency"));
  assert.deepEqual(regular, generatePortfolioDiagnostics({ generatedAt, operations: structuredClone(regularOps) }), "comportamento não determinístico");
  assert.equal(containsNonFinite(turnover), false);
  assert.equal(forbidden.test(JSON.stringify(turnover)), false);
  console.log("OK  padrões de comportamento");
} catch (error) { failures += 1; console.error(`ERRO  padrões de comportamento: ${error.message}`); }

if (failures) {
  console.error(`\n${failures} cenário(s) falharam.`);
  process.exitCode = 1;
} else {
  console.log(`\n${Object.keys(scenarios).length + preferenceScenarios.length + 3} grupos de cenários validados com sucesso.`);
}

function validateResult(result) {
  assert.equal(typeof result, "object");
  assert.ok("generatedAt" in result && Array.isArray(result.summary) && typeof result.scores === "object" && Array.isArray(result.diagnostics) && typeof result.dataQuality === "object" && Array.isArray(result.limitations));
  for (const key of ["diversification", "concentration", "income_resilience", "data_quality"]) {
    assert.ok(result.scores[key], `score ${key} ausente`);
    assert.ok(result.scores[key].value >= 0 && result.scores[key].value <= 100, `score ${key} fora da faixa`);
    assert.ok(result.scores[key].confidence >= 0 && result.scores[key].confidence <= 1, `confiança ${key} fora da faixa`);
  }
  result.diagnostics.forEach((item) => ["id", "category", "severity", "status", "title", "summary", "evidence", "metrics", "confidence", "limitations"].forEach((key) => assert.ok(key in item, `${item.id || "diagnóstico"}: ${key} ausente`)));
  assert.equal(containsNonFinite(result), false, "NaN ou Infinity encontrado");
}

function scenarioAssertions(name, result) {
  if (name === "carteira vazia") assert.equal(result.dataQuality.positionCount, 0);
  if (name === "carteira concentrada") assert.equal(result.diagnostics.find((item) => item.id === "risk-position-concentration").status, "attention");
  if (name === "carteira sem cotações") assert.equal(result.dataQuality.missingQuoteCount, 1);
  if (name === "carteira sem setores") assert.equal(result.diagnostics.find((item) => item.id === "sector-diversification").status, "insufficient_data");
  if (name === "proventos concentrados") assert.equal(result.diagnostics.find((item) => item.id === "income-concentration").status, "attention");
  if (name === "dados inválidos") assert.equal(result.dataQuality.invalidOperationsIgnored, 1);
}

function containsNonFinite(value) {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(containsNonFinite);
  if (value && typeof value === "object") return Object.values(value).some(containsNonFinite);
  return false;
}
