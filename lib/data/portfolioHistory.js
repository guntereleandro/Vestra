import { calculatePortfolioTotals } from "../engine/totals.js";
import { safeNumber, validDate } from "../engine/validations.js";

export const PORTFOLIO_HISTORY_KEY = "vestra:portfolioHistory:v1";

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function snapshotSignature(snapshot) {
  return [
    snapshot.date,
    snapshot.totalInvested.toFixed(6),
    snapshot.currentValue.toFixed(6),
    snapshot.profitLoss.toFixed(6),
    snapshot.dividends.toFixed(6),
    snapshot.positionsCount,
  ].join("|");
}

export function normalizePortfolioHistory(value) {
  if (!Array.isArray(value)) return [];
  const byDate = new Map();
  value.forEach((record, index) => {
    if (!record || typeof record !== "object" || !validDate(record.date)) return;
    const timestamp = Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : Date.parse(`${record.date}T00:00:00Z`);
    if (!Number.isFinite(timestamp)) return;
    const normalized = {
      id: typeof record.id === "string" && record.id ? record.id : `portfolio-history-${record.date}-${index}`,
      date: record.date,
      timestamp,
      totalInvested: safeNumber(record.totalInvested),
      currentValue: safeNumber(record.currentValue),
      profitLoss: safeNumber(record.profitLoss),
      dividends: safeNumber(record.dividends),
      positionsCount: Math.max(0, Math.trunc(safeNumber(record.positionsCount))),
    };
    const previous = byDate.get(normalized.date);
    if (!previous || normalized.timestamp >= previous.timestamp) byDate.set(normalized.date, normalized);
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp - b.timestamp);
}

export function readPortfolioHistory() {
  return normalizePortfolioHistory(parse(localStorage.getItem(PORTFOLIO_HISTORY_KEY), []));
}

export function writePortfolioHistory(history) {
  const normalized = normalizePortfolioHistory(history);
  localStorage.setItem(PORTFOLIO_HISTORY_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createPortfolioSnapshot(positions, date = todayIso()) {
  const totals = calculatePortfolioTotals(positions);
  const timestamp = Date.now();
  return {
    id: `portfolio-history-${date}`,
    date,
    timestamp,
    totalInvested: totals.invested,
    currentValue: totals.current,
    profitLoss: totals.profit,
    dividends: totals.dividends,
    positionsCount: positions.filter((position) => position.quantity > 0 && position.currentValue > 0).length,
  };
}

export function upsertPortfolioSnapshot(positions) {
  const snapshot = createPortfolioSnapshot(positions);
  if (snapshot.positionsCount === 0 && snapshot.currentValue <= 0 && snapshot.totalInvested <= 0 && snapshot.dividends <= 0) return readPortfolioHistory();
  const history = readPortfolioHistory();
  const existingIndex = history.findIndex((record) => record.date === snapshot.date);
  if (existingIndex >= 0) {
    if (snapshotSignature(history[existingIndex]) === snapshotSignature(snapshot)) return history;
    history[existingIndex] = { ...snapshot, id: history[existingIndex].id || snapshot.id };
  } else {
    history.push(snapshot);
  }
  return writePortfolioHistory(history);
}
