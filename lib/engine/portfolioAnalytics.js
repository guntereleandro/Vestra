import { isPassiveIncomeOperation } from "@/lib/data/operations";

const TYPE_LABELS = {
  "Ação": "Acoes",
  "Ação/Unit": "Acoes",
  "AÃ§Ã£o": "Acoes",
  "AÃ§Ã£o/Unit": "Acoes",
  "AÃƒÂ§ÃƒÂ£o": "Acoes",
  "AÃƒÂ§ÃƒÂ£o/Unit": "Acoes",
  FII: "FIIs",
  ETF: "ETFs",
  BDR: "BDRs",
  Cripto: "Cripto",
  "Renda Fixa": "Renda Fixa",
  Caixa: "Caixa",
};

function validPosition(position) {
  return position && position.quantity > 0 && position.currentValue > 0;
}

function allocationTypeLabel(type) {
  const value = String(type || "");
  if (TYPE_LABELS[value]) return TYPE_LABELS[value];
  if (value.toUpperCase().includes("BDR")) return "BDRs";
  return value || "Outros";
}

export function calculateAllocationPercent(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function getLargestPosition(positions) {
  return positions.filter(validPosition).sort((a, b) => b.currentValue - a.currentValue)[0] || null;
}

export function getLargestProfit(positions) {
  return positions.filter(validPosition).sort((a, b) => b.profit - a.profit)[0] || null;
}

export function getLargestLoss(positions) {
  return positions.filter(validPosition).sort((a, b) => a.profit - b.profit)[0] || null;
}

export function sumDividendsByAsset(positions) {
  return positions.reduce((map, position) => {
    map[position.ticker] = (map[position.ticker] || 0) + Math.max(0, position.dividends || 0);
    return map;
  }, {});
}

export function getTopDividendAsset(positions) {
  return positions.filter((position) => position.dividends > 0).sort((a, b) => b.dividends - a.dividends)[0] || null;
}

export function getLatestOperation(operations) {
  return [...operations].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))[0] || null;
}

function groupSmallSlices(items, maxItems = 7) {
  const sorted = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= maxItems) return sorted;
  const visible = sorted.slice(0, maxItems - 1);
  const otherValue = sorted.slice(maxItems - 1).reduce((sum, item) => sum + item.value, 0);
  return [...visible, { name: "Outros", value: otherValue, ticker: "OUTROS" }];
}

export function prepareAllocationData(positions, mode = "type") {
  const valid = positions.filter(validPosition);
  const total = valid.reduce((sum, position) => sum + position.currentValue, 0);
  if (mode === "asset") {
    return groupSmallSlices(valid.map((position) => ({ name: position.ticker, label: position.name, value: position.currentValue, ticker: position.ticker }))).map((item) => ({ ...item, percent: calculateAllocationPercent(item.value, total) }));
  }
  const groups = valid.reduce((map, position) => {
    const name = allocationTypeLabel(position.type);
    map[name] = (map[name] || 0) + position.currentValue;
    return map;
  }, {});
  return Object.entries(groups).map(([name, value]) => ({ name, value, percent: calculateAllocationPercent(value, total) })).sort((a, b) => b.value - a.value);
}

export function preparePortfolioSummary(positions, operations) {
  const total = positions.filter(validPosition).reduce((sum, position) => sum + position.currentValue, 0);
  const largestPosition = getLargestPosition(positions);
  const largestProfit = getLargestProfit(positions);
  const largestLoss = getLargestLoss(positions);
  return {
    largestPosition,
    largestProfit: largestProfit?.profit > 0 ? largestProfit : null,
    largestLoss: largestLoss?.profit < 0 ? largestLoss : null,
    topDividendAsset: getTopDividendAsset(positions),
    latestOperation: getLatestOperation(operations),
    positionsCount: positions.filter(validPosition).length,
    largestPositionPercent: largestPosition ? calculateAllocationPercent(largestPosition.currentValue, total) : 0,
    incomeOperationsCount: operations.filter(isPassiveIncomeOperation).length,
  };
}

export function prepareHistoryChartData(history, range = "all") {
  const now = new Date();
  const cutoffs = { "7d": 7, "30d": 30, "12m": 365 };
  const cutoffDays = cutoffs[range];
  let filtered = cutoffDays ? history.filter((item) => {
    const diff = (now - new Date(`${item.date}T00:00:00`)) / 86400000;
    return diff <= cutoffDays;
  }) : history;
  if (range === "12m" || range === "all") {
    const monthly = new Map();
    filtered.forEach((item) => {
      const key = item.date.slice(0, 7);
      const previous = monthly.get(key);
      if (!previous || item.date >= previous.date) monthly.set(key, item);
    });
    filtered = [...monthly.values()];
  }
  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}
