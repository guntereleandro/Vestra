import { createDiagnostic, createScore } from "./diagnosticTypes.js";
import { isPassiveIncomeOperation } from "../../domain/operations/passiveIncome.js";

const finiteNonNegative = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

export function analyzeIncome(operations, positions, rules, suppliedIncome = []) {
  const incomeRecords = Array.isArray(suppliedIncome) ? suppliedIncome.map(normalizeIncomeRecord).filter(Boolean) : [];
  const validIncome = [...operations, ...incomeRecords].filter((operation) => isPassiveIncomeOperation(operation) && operation.ticker && finiteNonNegative(operation.totalValue) && validDate(operation.date));
  const byAssetMap = validIncome.reduce((map, operation) => { map[operation.ticker] = (map[operation.ticker] || 0) + Number(operation.totalValue); return map; }, {});
  if (!validIncome.length) positions.forEach((position) => { if (finiteNonNegative(position.dividends) && Number(position.dividends) > 0) byAssetMap[position.ticker] = Number(position.dividends); });
  const byAsset = Object.entries(byAssetMap).map(([ticker, value]) => ({ ticker, value })).sort((a, b) => b.value - a.value || a.ticker.localeCompare(b.ticker));
  const total = byAsset.reduce((sum, item) => sum + item.value, 0);
  const largestSourcePercent = total > 0 ? (byAsset[0].value / total) * 100 : 0;
  const periodMonths = coveredMonths(validIncome);
  const monthlyAverage = periodMonths >= rules.minimumIncomeMonths ? total / periodMonths : null;
  const diagnostics = [
    createDiagnostic({ id: "income-total-by-asset", category: "income", status: total > 0 ? "observed" : "not_applicable", title: "Proventos registrados", summary: total > 0 ? `${byAsset.length} ativos possuem proventos registrados, totalizando ${formatNumber(total)}.` : "Não há proventos registrados.", evidence: byAsset, metrics: { totalIncome: total, byAsset }, confidence: validIncome.length ? 1 : (total > 0 ? 0.7 : 1), limitations: !validIncome.length && total > 0 ? ["O período dos proventos não está disponível nas posições consolidadas."] : [] }),
    createDiagnostic({ id: "income-concentration", category: "income", severity: largestSourcePercent > rules.maxIncomeSourcePercent ? "high" : "info", status: total > 0 ? (largestSourcePercent > rules.maxIncomeSourcePercent ? "attention" : "observed") : "not_applicable", title: "Concentração dos proventos", summary: total > 0 ? `${Math.round(largestSourcePercent)}% dos proventos registrados vieram de um único ativo.` : "Não há proventos para calcular concentração.", evidence: byAsset.slice(0, 3), metrics: { largestSourcePercent, thresholdPercent: rules.maxIncomeSourcePercent }, confidence: total > 0 ? 1 : 0 }),
    createDiagnostic({ id: "monthly-income-average", category: "income", status: monthlyAverage == null ? "insufficient_data" : "observed", title: "Média mensal de proventos", summary: monthlyAverage == null ? `O histórico não cobre os ${rules.minimumIncomeMonths} meses necessários para calcular uma média mensal.` : `A média mensal registrada no período observado é ${formatNumber(monthlyAverage)}.`, metrics: { periodMonths, minimumMonths: rules.minimumIncomeMonths, monthlyAverage }, confidence: monthlyAverage == null ? Math.min(1, periodMonths / rules.minimumIncomeMonths) : 1, limitations: monthlyAverage == null ? ["Histórico de proventos insuficiente."] : ["A média descreve apenas registros passados e não projeta renda futura."] }),
  ];
  const sourceComponent = total > 0 ? Math.max(0, 100 - Math.max(0, largestSourcePercent - rules.maxIncomeSourcePercent) * (100 / Math.max(1, 100 - rules.maxIncomeSourcePercent))) : 0;
  const historyComponent = Math.min(100, (periodMonths / rules.minimumIncomeMonths) * 100);
  const weights = rules.scoreWeights.incomeResilience;
  return { diagnostics, total, byAsset, largestSourcePercent, periodMonths, incomeResilienceScore: createScore(sourceComponent * weights.sourceConcentration + historyComponent * weights.history, total > 0 ? Math.min(1, 0.7 + (periodMonths / rules.minimumIncomeMonths) * 0.3) : 0, total > 0 ? (periodMonths < rules.minimumIncomeMonths ? ["Histórico curto reduz a confiança."] : []) : ["Não há proventos para avaliar resiliência de renda."]) };
}

function validDate(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)); }
function normalizeIncomeRecord(item) { if (!item || typeof item !== "object") return null; return { ticker: item.ticker, assetType: item.assetType, operationType: item.operationType || "DIVIDENDO", totalValue: item.totalValue ?? item.value ?? item.amount, date: item.date }; }
function coveredMonths(items) { if (!items.length) return 0; const dates = items.map((item) => new Date(`${item.date}T00:00:00Z`)).sort((a, b) => a - b); return Math.max(1, (dates.at(-1).getUTCFullYear() - dates[0].getUTCFullYear()) * 12 + dates.at(-1).getUTCMonth() - dates[0].getUTCMonth() + 1); }
function formatNumber(value) { return Number(value.toFixed(2)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
