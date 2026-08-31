const SCALE = 100000000n;
function scaled(value) {
  const [whole = "0", fraction = ""] = String(value ?? 0).replace(",", ".").split(".");
  return BigInt(whole || 0) * SCALE + BigInt((fraction + "00000000").slice(0, 8));
}
function decimal(value) {
  const negative = value < 0n; const absolute = negative ? -value : value;
  const whole = absolute / SCALE; const fraction = String(absolute % SCALE).padStart(8, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
export function multiplyDecimal(left, right) { return decimal((scaled(left) * scaled(right)) / SCALE); }
export function subtractDecimal(left, right) { return decimal(scaled(left) - scaled(right)); }

export function buildIncomeExpectation(event, eligibleQuantity, knownWithholdingAmount = null) {
  const grossAmount = multiplyDecimal(eligibleQuantity, event.grossAmountPerUnit);
  return {
    eligibleQuantity: String(eligibleQuantity), grossAmount,
    knownWithholdingAmount: knownWithholdingAmount == null ? null : String(knownWithholdingAmount),
    expectedNetAmount: knownWithholdingAmount == null ? null : subtractDecimal(grossAmount, knownWithholdingAmount),
    currency: event.currency, eligibilityDate: event.recordDate || event.lastDatePrior,
    expectedPaymentDate: event.paymentDate, status: "EXPECTED", confidence: event.sourceConfidence || "medium",
  };
}
