export const INCOME_EVENT_TYPES = Object.freeze(["DIVIDEND", "JCP", "INCOME"]);
export const INCOME_EVENT_STATUSES = Object.freeze(["ANNOUNCED", "CONFIRMED", "CORRECTED", "CANCELLED", "UNKNOWN"]);
export const INCOME_EXPECTATION_STATUSES = Object.freeze(["ELIGIBLE", "EXPECTED", "CONFIRMED_RECEIVED", "RECONCILED", "IGNORED", "CANCELLED", "CONFLICT"]);
export const INCOME_MATCH_STATUSES = Object.freeze(["EXACT_MATCH", "LIKELY_MATCH", "AMBIGUOUS", "NO_MATCH"]);
export const INCOME_PROVIDER_RESULTS = Object.freeze(["SUCCESS", "NO_EVENTS", "UNSUPPORTED", "PLAN_RESTRICTED", "NOT_FOUND", "RATE_LIMITED", "ERROR"]);

export const EVENT_TO_OPERATION_TYPE = Object.freeze({
  DIVIDEND: "DIVIDENDO",
  JCP: "JCP",
  INCOME: "RENDIMENTO",
});

export function isSupportedIncomeEventType(value) {
  return INCOME_EVENT_TYPES.includes(value);
}

export function normalizeIsoDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : null;
}

export function canonicalAssetId({ exchange = "B3", ticker, isin } = {}) {
  const normalizedIsin = String(isin || "").trim().toUpperCase();
  if (normalizedIsin) return `ISIN:${normalizedIsin}`;
  return `${String(exchange || "B3").trim().toUpperCase()}:${String(ticker || "").trim().toUpperCase()}`;
}
