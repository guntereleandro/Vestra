export const MARKET_AVAILABILITY = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  PLAN_RESTRICTED: "plan-restricted",
  NOT_APPLICABLE: "not-applicable",
  FALLBACK: "fallback",
});

export const CORPORATE_ACTION_TYPE = Object.freeze({
  DIVIDEND: "DIVIDEND",
  JCP: "JCP",
  BONUS: "BONUS",
  SPLIT: "SPLIT",
  REVERSE_SPLIT: "REVERSE_SPLIT",
  SUBSCRIPTION: "SUBSCRIPTION",
  CONVERSION: "CONVERSION",
  UNKNOWN: "UNKNOWN",
});

export const MARKET_QUOTE_CONTRACT_VERSION = "2.0.0";
export const MARKET_HISTORY_CONTRACT_VERSION = "1.0.0";
export const CORPORATE_ACTION_CONTRACT_VERSION = "1.0.0";

export function marketProvenance({ provider = "unknown", sourceUpdatedAt = null, fetchedAt = null, availability = MARKET_AVAILABILITY.AVAILABLE, limitation = null, fallback = false } = {}) {
  return { provider, sourceUpdatedAt, fetchedAt, availability, limitation, fallback: Boolean(fallback) };
}
