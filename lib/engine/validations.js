export function safeNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
export function nonNegativeNumber(value) { return Math.max(0, safeNumber(value)); }
export function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || ""); }
