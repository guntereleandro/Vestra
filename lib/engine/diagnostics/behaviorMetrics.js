import { isIncomeOperationType, isPassiveIncomeOperation } from "../../domain/operations/passiveIncome.js";

export function calculateBehaviorMetrics(operations = [], generatedAt, nearbyOperationDays = 7) {
  const reference = validDate(generatedAt) ? new Date(generatedAt) : null;
  const valid = operations.filter(validOperation).map((item) => ({ ...item, timestamp: new Date(`${item.date}T00:00:00Z`).getTime(), value: amount(item) })).sort((a, b) => a.timestamp - b.timestamp || String(a.id || "").localeCompare(String(b.id || "")));
  const buys = valid.filter((item) => item.operationType === "COMPRA"), sales = valid.filter((item) => item.operationType === "VENDA"), income = valid.filter(isPassiveIncomeOperation);
  const historyMonths = valid.length ? monthDistance(valid[0].date, (reference || new Date(valid.at(-1).timestamp)).toISOString().slice(0, 10)) : 0;
  const monthly = reference ? recentMonths(buys, reference, 6) : [];
  const activeContributionMonths = monthly.filter((item) => item.value > 0).length;
  const recentValue = monthly.slice(0, 3).reduce((sum, item) => sum + item.value, 0), previousValue = monthly.slice(3, 6).reduce((sum, item) => sum + item.value, 0);
  const rhythmChangePercent = previousValue > 0 ? (recentValue - previousValue) / previousValue * 100 : recentValue > 0 ? 100 : 0;
  const contributionsByAsset = distribution(buys, "ticker"), contributionsByClass = distribution(buys, "assetType");
  const totalContributions = buys.reduce((sum, item) => sum + item.value, 0), topTwoContributionPercent = share(contributionsByAsset.slice(0, 2), totalContributions), topClassContributionPercent = share(contributionsByClass.slice(0, 1), totalContributions);
  const closedPositions = calculateClosedPositions(valid), averageHoldingDays = closedPositions.length ? closedPositions.reduce((sum, item) => sum + item.holdingDays, 0) / closedPositions.length : null;
  const nearbyOperations = valid.slice(1).filter((item, index) => daysBetween(valid[index].date, item.date) <= nearbyOperationDays).length;
  const incomeByAsset = distribution(income, "ticker"), totalIncome = income.reduce((sum, item) => sum + item.value, 0), topIncomePercent = share(incomeByAsset.slice(0, 1), totalIncome), incomeMonths = new Set(income.map((item) => item.date.slice(0, 7))).size;
  const turnoverPercent = totalContributions > 0 ? sales.reduce((sum, item) => sum + item.value, 0) / totalContributions * 100 : 0;
  return { validOperationCount: valid.length, buyCount: buys.length, saleCount: sales.length, incomeCount: income.length, historyMonths, monthlyContributions: monthly, activeContributionMonths, monthlyContributionFrequency: monthly.length ? activeContributionMonths / monthly.length : 0, recentContributionValue: recentValue, previousContributionValue: previousValue, rhythmChangePercent, contributionsByAsset, contributionsByClass, totalContributions, topTwoContributionPercent, topClassContributionPercent, closedPositions, averageHoldingDays, nearbyOperations, incomeByAsset, totalIncome, topIncomePercent, incomeMonths, turnoverPercent };
}

function calculateClosedPositions(operations) { const state = new Map(), result = []; for (const item of operations) { if (!state.has(item.ticker)) state.set(item.ticker, { quantity: 0, openedAt: null }); const current = state.get(item.ticker); if (item.operationType === "COMPRA" && Number(item.quantity) > 0) { if (current.quantity <= 0) current.openedAt = item.date; current.quantity += Number(item.quantity); } if (item.operationType === "VENDA" && current.quantity > 0) { current.quantity = Math.max(0, current.quantity - Number(item.quantity || 0)); if (current.quantity === 0 && current.openedAt) { result.push({ ticker: item.ticker, openedAt: current.openedAt, closedAt: item.date, holdingDays: daysBetween(current.openedAt, item.date) }); current.openedAt = null; } } } return result; }
function recentMonths(items, reference, count) { const result = []; for (let offset = 0; offset < count; offset += 1) { const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - offset, 1)), key = date.toISOString().slice(0, 7); result.push({ month: key, value: items.filter((item) => item.date.startsWith(key)).reduce((sum, item) => sum + item.value, 0), count: items.filter((item) => item.date.startsWith(key)).length }); } return result; }
function distribution(items, field) { const map = items.reduce((result, item) => { const key = item[field] || "Não informado"; result[key] = (result[key] || 0) + item.value; return result; }, {}); return Object.entries(map).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)); }
function share(items, total) { return total > 0 ? items.reduce((sum, item) => sum + item.value, 0) / total * 100 : 0; }
function amount(item) { if (Number.isFinite(Number(item.totalValue))) return Math.max(0, Number(item.totalValue)); return Math.max(0, Number(item.quantity || 0) * Number(item.unitPrice || 0)); }
function validOperation(item) { return item && typeof item.ticker === "string" && item.ticker && (["COMPRA", "VENDA"].includes(item.operationType) || isIncomeOperationType(item.operationType)) && /^\d{4}-\d{2}-\d{2}$/.test(item.date || "") && Number.isFinite(Date.parse(`${item.date}T00:00:00Z`)); }
function validDate(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function daysBetween(a, b) { return Math.max(0, (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000); }
function monthDistance(a, b) { const start = new Date(`${a}T00:00:00Z`), end = new Date(`${b}T00:00:00Z`); return Math.max(1, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1); }
