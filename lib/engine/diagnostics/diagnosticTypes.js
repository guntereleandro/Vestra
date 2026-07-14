export const DIAGNOSTIC_CATEGORIES = Object.freeze({
  ALLOCATION: "allocation",
  DIVERSIFICATION: "diversification",
  CONCENTRATION: "concentration",
  INCOME: "income",
  RISK: "risk",
  DATA_QUALITY: "data_quality",
  BEHAVIOR: "behavior",
});

export const DIAGNOSTIC_SEVERITIES = Object.freeze(["info", "low", "medium", "high"]);
export const DIAGNOSTIC_STATUSES = Object.freeze(["observed", "attention", "insufficient_data", "not_applicable"]);

export function createDiagnostic({ id, category, severity = "info", status = "observed", title, summary, evidence = [], metrics = {}, confidence = 1, limitations = [] }) {
  return { id, category, severity, status, title, summary, evidence, metrics, confidence: clamp(confidence), limitations };
}

export function createScore(value, confidence = 1, limitations = []) {
  return { value: Math.round(clamp(value, 0, 100)), confidence: clamp(confidence), limitations };
}

export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(Number(value)) ? Number(value) : minimum));
}
