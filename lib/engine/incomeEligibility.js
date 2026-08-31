import { calculatePositions } from "./portfolio.js";

export function resolveIncomeEligibilityDate(event) {
  if (event?.recordDate) return { date: event.recordDate, basis: "RECORD_DATE", confidence: "high" };
  if (event?.lastDatePrior) return { date: event.lastDatePrior, basis: "PROVIDER_LAST_DATE_PRIOR", confidence: "high" };
  if (event?.exDate) return { date: null, basis: "MARKET_CALENDAR_REQUIRED", confidence: "incomplete" };
  return { date: null, basis: "MISSING_CUTOFF", confidence: "incomplete" };
}

export function calculateEligibleQuantity(operations, ticker, eligibilityDate) {
  if (!eligibilityDate || !ticker) return 0;
  const historical = (operations || []).filter((operation) => operation.date <= eligibilityDate);
  const position = calculatePositions(historical).find((item) => item.ticker === ticker);
  return position?.quantity || 0;
}
