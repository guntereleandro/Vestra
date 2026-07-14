import { createDiagnostic, createScore } from "./diagnosticTypes.js";

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const percent = (value, total) => total > 0 ? (value / total) * 100 : 0;

export function analyzeAllocation(positions, totalValue, rules) {
  const valid = positions.filter((position) => number(position.currentValue) > 0);
  const byAsset = valid.map((position) => ({ ticker: position.ticker, value: number(position.currentValue), percent: percent(number(position.currentValue), totalValue) })).sort((a, b) => b.value - a.value);
  const classMap = sumBy(valid, (position) => position.type || "Não informado");
  const byClass = entriesWithPercent(classMap, totalValue);
  const largestPosition = byAsset[0] || null;
  const topThreePercent = byAsset.slice(0, 3).reduce((sum, item) => sum + item.percent, 0);
  const largestClass = byClass[0] || null;
  const diagnostics = [];

  diagnostics.push(createDiagnostic({ id: "allocation-by-class", category: "allocation", title: "Alocação por classe", summary: valid.length ? `${byClass.length} classes compõem as posições com valor conhecido.` : "Não há posições com valor conhecido para calcular a alocação.", status: valid.length ? "observed" : "insufficient_data", evidence: byClass, metrics: { byClass }, confidence: totalValue > 0 ? 1 : 0, limitations: totalValue > 0 ? [] : ["Patrimônio atual indisponível."] }));
  diagnostics.push(createDiagnostic({ id: "allocation-by-asset", category: "allocation", title: "Alocação por ativo", summary: valid.length ? `${byAsset.length} ativos possuem participação calculável.` : "Não há ativos com participação calculável.", status: valid.length ? "observed" : "insufficient_data", evidence: byAsset, metrics: { byAsset }, confidence: totalValue > 0 ? 1 : 0, limitations: totalValue > 0 ? [] : ["Patrimônio atual indisponível."] }));
  diagnostics.push(createDiagnostic({ id: "largest-position", category: "concentration", severity: largestPosition?.percent > rules.maxPositionPercent ? "high" : "info", status: largestPosition ? (largestPosition.percent > rules.maxPositionPercent ? "attention" : "observed") : "insufficient_data", title: "Maior posição", summary: largestPosition ? `A maior posição representa ${Math.round(largestPosition.percent)}% da carteira.` : "Não há dados suficientes para identificar a maior posição.", evidence: largestPosition ? [largestPosition] : [], metrics: { largestPositionPercent: largestPosition?.percent || 0, thresholdPercent: rules.maxPositionPercent }, confidence: totalValue > 0 ? 1 : 0 }));
  diagnostics.push(createDiagnostic({ id: "top-three-concentration", category: "concentration", severity: topThreePercent > rules.maxTopThreePercent ? "high" : "info", status: valid.length ? (topThreePercent > rules.maxTopThreePercent ? "attention" : "observed") : "insufficient_data", title: "Concentração das três maiores posições", summary: valid.length ? `Os três maiores ativos concentram ${Math.round(topThreePercent)}% do patrimônio.` : "Não há dados suficientes para calcular a concentração das três maiores posições.", evidence: byAsset.slice(0, 3), metrics: { topThreePercent, thresholdPercent: rules.maxTopThreePercent }, confidence: totalValue > 0 ? 1 : 0 }));

  const positionComponent = largestPosition ? Math.max(0, 100 - Math.max(0, largestPosition.percent - rules.maxPositionPercent) * (100 / Math.max(1, 100 - rules.maxPositionPercent))) : 0;
  const topThreeComponent = valid.length ? Math.max(0, 100 - Math.max(0, topThreePercent - rules.maxTopThreePercent) * (100 / Math.max(1, 100 - rules.maxTopThreePercent))) : 0;
  const classComponent = largestClass ? Math.max(0, 100 - Math.max(0, largestClass.percent - rules.maxClassPercent) * (100 / Math.max(1, 100 - rules.maxClassPercent))) : 0;
  const weights = rules.scoreWeights.concentration;
  return { diagnostics, byAsset, byClass, largestPosition, largestClass, topThreePercent, concentrationScore: createScore(positionComponent * weights.largestPosition + topThreeComponent * weights.topThree + classComponent * weights.largestClass, totalValue > 0 ? 1 : 0, totalValue > 0 ? [] : ["Score indisponível sem valores atuais."]) };
}

function sumBy(items, keyFor) { return items.reduce((map, item) => { const key = keyFor(item); map[key] = (map[key] || 0) + number(item.currentValue); return map; }, {}); }
function entriesWithPercent(map, total) { return Object.entries(map).map(([key, value]) => ({ key, value, percent: percent(value, total) })).sort((a, b) => b.value - a.value); }
