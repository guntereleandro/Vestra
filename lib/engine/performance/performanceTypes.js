export const PERFORMANCE_LIMITS = Object.freeze({ minimumHistoryPoints: 2, fullConfidencePoints: 12, fullRegularityMonths: 6 });
export function safeNumber(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
export function clamp(value, min = 0, max = 100) { return Math.min(max, Math.max(min, safeNumber(value))); }
export function performanceScore(value, confidence, limitations = []) { return { value: Math.round(clamp(value)), confidence: clamp(confidence, 0, 1), limitations }; }
