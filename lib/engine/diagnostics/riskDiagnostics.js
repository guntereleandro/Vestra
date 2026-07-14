import { createDiagnostic } from "./diagnosticTypes.js";

export function analyzeRisk({ positions, allocation, income, rules }) {
  const missingValue = positions.filter((position) => Number(position.quantity) > 0 && (!position.hasQuote || !Number.isFinite(Number(position.currentValue))));
  return [
    thresholdDiagnostic("risk-position-concentration", "Concentração por ativo", allocation.largestPosition?.percent || 0, rules.maxPositionPercent, allocation.largestPosition ? `A maior posição representa ${Math.round(allocation.largestPosition.percent)}% da carteira.` : "Não há posição com valor conhecido para avaliar concentração.", Boolean(allocation.largestPosition)),
    thresholdDiagnostic("risk-class-concentration", "Concentração por classe", allocation.largestClass?.percent || 0, rules.maxClassPercent, allocation.largestClass ? `A maior classe representa ${Math.round(allocation.largestClass.percent)}% da carteira.` : "Não há classe com valor conhecido para avaliar concentração.", Boolean(allocation.largestClass)),
    thresholdDiagnostic("risk-income-dependency", "Dependência de uma fonte de proventos", income.largestSourcePercent, rules.maxIncomeSourcePercent, income.total > 0 ? `Uma única fonte representa ${Math.round(income.largestSourcePercent)}% dos proventos registrados.` : "Não há proventos para avaliar dependência de renda.", income.total > 0),
    createDiagnostic({ id: "risk-missing-position-value", category: "risk", severity: missingValue.length ? "high" : "info", status: missingValue.length ? "attention" : "observed", title: "Posições sem valor ou cotação", summary: missingValue.length ? `${missingValue.length} posições não possuem valor atual ou cotação válida.` : "Todas as posições informadas possuem valor atual calculável.", evidence: missingValue.map((item) => ({ ticker: item.ticker, hasQuote: Boolean(item.hasQuote), currentValue: Number.isFinite(Number(item.currentValue)) ? Number(item.currentValue) : null })), metrics: { affectedPositions: missingValue.length }, confidence: 1 }),
    createDiagnostic({ id: "risk-few-assets", category: "risk", severity: positions.length && positions.length < rules.minimumAssets ? "medium" : "info", status: positions.length ? (positions.length < rules.minimumAssets ? "attention" : "observed") : "not_applicable", title: "Quantidade reduzida de ativos", summary: positions.length ? `A carteira possui ${positions.length} ativos; a referência configurada é ${rules.minimumAssets}.` : "A carteira não possui ativos com posição.", metrics: { assetCount: positions.length, minimumAssets: rules.minimumAssets }, confidence: 1 }),
  ];
}

function thresholdDiagnostic(id, title, value, threshold, summary, applicable) {
  return createDiagnostic({ id, category: "risk", severity: applicable && value > threshold ? "high" : "info", status: applicable ? (value > threshold ? "attention" : "observed") : "insufficient_data", title, summary, metrics: { percent: value, thresholdPercent: threshold }, confidence: applicable ? 1 : 0 });
}
