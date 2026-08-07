import { isIncomeOperation } from "../data/operations.js";
import { safeNumber } from "./validations.js";

export function analyzeIncome(operations = [], filters = {}) {
  const income = operations.filter((item) => isIncomeOperation(item?.operationType)).map((item) => ({ ...item, totalValue: safeNumber(item.totalValue) }));
  const years = [...new Set(income.map((item) => item.date.slice(0, 4)))].sort().reverse();
  const tickers = [...new Set(income.map((item) => item.ticker))].sort();
  const filtered = income.filter((item) => {
    const [year, month] = item.date.split("-");
    if (filters.ticker && item.ticker !== filters.ticker) return false;
    if (filters.type && item.operationType !== filters.type) return false;
    if (filters.year && year !== filters.year) return false;
    if (filters.month && month !== filters.month) return false;
    if (filters.startDate && item.date < filters.startDate) return false;
    if (filters.endDate && item.date > filters.endDate) return false;
    return true;
  });
  const sum = (items) => items.reduce((total, item) => total + item.totalValue, 0);
  const group = (items, key) => [...items.reduce((map, item) => map.set(item[key], (map.get(item[key]) || 0) + item.totalValue), new Map())]
    .map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const months = [...new Set(income.map((item) => item.date.slice(0, 7)))];
  const first = income.map((item) => item.date).sort()[0];
  const last = income.map((item) => item.date).sort().at(-1);
  const spanMonths = first && last ? (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(last.slice(5, 7)) - Number(first.slice(5, 7)) + 1 : 0;
  return {
    income, filtered: [...filtered].sort((a, b) => filters.order === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)),
    total: sum(income), periodTotal: sum(filtered), paymentCount: filtered.length,
    monthlyAverage: spanMonths >= 6 ? sum(income) / spanMonths : null,
    byAsset: group(filtered, "ticker"), byType: group(filtered, "operationType"),
    tickers, years, activeMonths: months.length, spanMonths, monthsWithoutPayments: Math.max(0, spanMonths - months.length),
  };
}
