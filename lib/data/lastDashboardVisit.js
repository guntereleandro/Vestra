export const LAST_DASHBOARD_VISIT_KEY = "vestra:lastDashboardVisit:v1";

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function createDashboardVisitSnapshot({ totals, operations, positions, journeyRecords }) {
  return {
    currentValue: safeNumber(totals.current),
    dividends: safeNumber(totals.dividends),
    operationsCount: Array.isArray(operations) ? operations.length : 0,
    positionsCount: Array.isArray(positions) ? positions.length : 0,
    highestPortfolio: safeNumber(journeyRecords?.highestPortfolio?.value),
  };
}

export function normalizeLastDashboardVisit(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const visitedAt = typeof value.visitedAt === "string" && !Number.isNaN(Date.parse(value.visitedAt)) ? value.visitedAt : "";
  if (!visitedAt) return null;
  const snapshot = value.snapshot && typeof value.snapshot === "object" ? value.snapshot : {};
  return {
    visitedAt,
    snapshot: {
      currentValue: safeNumber(snapshot.currentValue),
      dividends: safeNumber(snapshot.dividends),
      operationsCount: Math.max(0, Math.trunc(safeNumber(snapshot.operationsCount))),
      positionsCount: Math.max(0, Math.trunc(safeNumber(snapshot.positionsCount))),
      highestPortfolio: safeNumber(snapshot.highestPortfolio),
    },
  };
}

export function readLastDashboardVisit() {
  if (typeof localStorage === "undefined") return null;
  return normalizeLastDashboardVisit(parse(localStorage.getItem(LAST_DASHBOARD_VISIT_KEY), null));
}

export function writeLastDashboardVisit(snapshot) {
  if (typeof localStorage === "undefined") return null;
  const value = normalizeLastDashboardVisit({ visitedAt: new Date().toISOString(), snapshot });
  localStorage.setItem(LAST_DASHBOARD_VISIT_KEY, JSON.stringify(value));
  return value;
}
