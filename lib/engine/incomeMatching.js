import { EVENT_TO_OPERATION_TYPE } from "../domain/income/incomeContracts.js";

const cents = (value) => Math.round(Number(value || 0) * 100);
export function matchIncomeExpectation(expectation, operations = []) {
  const type = EVENT_TO_OPERATION_TYPE[expectation.eventType];
  const sameAssetType = operations.filter((operation) => operation.ticker === expectation.ticker && operation.operationType === type);
  const exact = sameAssetType.filter((operation) => operation.date === expectation.expectedPaymentDate && cents(operation.totalValue) === cents(expectation.expectedNetAmount ?? expectation.grossAmount));
  if (exact.length === 1) return { status: "EXACT_MATCH", operationId: exact[0].id };
  if (exact.length > 1) return { status: "AMBIGUOUS", candidates: exact.map((item) => item.id) };
  const likely = sameAssetType.filter((operation) => operation.date === expectation.expectedPaymentDate || cents(operation.totalValue) === cents(expectation.expectedNetAmount ?? expectation.grossAmount));
  if (likely.length === 1) return { status: "LIKELY_MATCH", operationId: likely[0].id };
  if (likely.length > 1) return { status: "AMBIGUOUS", candidates: likely.map((item) => item.id) };
  return { status: "NO_MATCH" };
}
