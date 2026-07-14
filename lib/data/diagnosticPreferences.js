export const DIAGNOSTIC_PREFERENCES_KEY = "vestra:diagnosticPreferences:v1";
export const RISK_PROFILES = ["conservative", "moderate", "aggressive"];
export const INVESTMENT_FOCUSES = ["income", "growth", "balanced", "custom"];
export const TARGET_ALLOCATION_CLASSES = ["Ações", "FIIs", "ETFs", "BDRs", "Cripto", "Renda Fixa", "Caixa", "Outros"];

export const DEFAULT_DIAGNOSTIC_PREFERENCES = Object.freeze({ maxPositionPercent: null, maxClassPercent: null, targetAllocation: Object.freeze({}), preferredCountries: Object.freeze([]), preferredCurrencies: Object.freeze([]), riskProfile: "", investmentFocus: "", updatedAt: "" });

export function normalizeDiagnosticPreferences(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return { maxPositionPercent: optionalPercent(source.maxPositionPercent), maxClassPercent: optionalPercent(source.maxClassPercent), targetAllocation: normalizeTargetAllocation(source.targetAllocation), preferredCountries: normalizeList(source.preferredCountries, false), preferredCurrencies: normalizeList(source.preferredCurrencies, true), riskProfile: RISK_PROFILES.includes(source.riskProfile) ? source.riskProfile : "", investmentFocus: INVESTMENT_FOCUSES.includes(source.investmentFocus) ? source.investmentFocus : "", updatedAt: validTimestamp(source.updatedAt) ? new Date(source.updatedAt).toISOString() : "" };
}

export function validateDiagnosticPreferences(value = {}) {
  const normalized = normalizeDiagnosticPreferences(value), errors = [];
  for (const field of ["maxPositionPercent", "maxClassPercent"]) { const raw = value[field]; if (raw !== null && raw !== undefined && raw !== "" && (!Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > 100)) errors.push(`${field}: percentual inválido.`); }
  if (value.targetAllocation && typeof value.targetAllocation === "object") {
    for (const [assetClass, percent] of Object.entries(value.targetAllocation)) if (!TARGET_ALLOCATION_CLASSES.includes(assetClass) || !Number.isFinite(Number(percent)) || Number(percent) < 0 || Number(percent) > 100) errors.push(`targetAllocation.${assetClass}: percentual inválido.`);
    const values = Object.values(normalized.targetAllocation), total = values.reduce((sum, percent) => sum + percent, 0);
    if (values.length && Math.abs(total - 100) > 0.01) errors.push("targetAllocation: a soma deve ser 100%.");
  }
  if (value.riskProfile && !RISK_PROFILES.includes(value.riskProfile)) errors.push("riskProfile: valor inválido.");
  if (value.investmentFocus && !INVESTMENT_FOCUSES.includes(value.investmentFocus)) errors.push("investmentFocus: valor inválido.");
  if (hasDuplicates(value.preferredCountries, false)) errors.push("preferredCountries: remova itens duplicados.");
  if (hasDuplicates(value.preferredCurrencies, true)) errors.push("preferredCurrencies: remova itens duplicados.");
  return { valid: errors.length === 0, errors, value: normalized };
}

export function hasConfiguredDiagnosticPreferences(value) { const item = normalizeDiagnosticPreferences(value); return item.maxPositionPercent !== null || item.maxClassPercent !== null || Object.keys(item.targetAllocation).length > 0 || item.preferredCountries.length > 0 || item.preferredCurrencies.length > 0 || Boolean(item.riskProfile) || Boolean(item.investmentFocus); }
export function readDiagnosticPreferences() { if (typeof localStorage === "undefined") return { ...DEFAULT_DIAGNOSTIC_PREFERENCES }; try { return normalizeDiagnosticPreferences(JSON.parse(localStorage.getItem(DIAGNOSTIC_PREFERENCES_KEY) || "{}")); } catch { return { ...DEFAULT_DIAGNOSTIC_PREFERENCES }; } }
export function writeDiagnosticPreferences(value) { const result = validateDiagnosticPreferences(value); if (!result.valid) throw new Error("INVALID_DIAGNOSTIC_PREFERENCES"); const normalized = { ...result.value, updatedAt: new Date().toISOString() }; localStorage.setItem(DIAGNOSTIC_PREFERENCES_KEY, JSON.stringify(normalized)); return normalized; }
export function migrateDiagnosticPreferences(value) { return normalizeDiagnosticPreferences(value); }

function optionalPercent(value) { return value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100 ? null : Number(value); }
function normalizeTargetAllocation(value) { if (!value || typeof value !== "object" || Array.isArray(value)) return {}; return TARGET_ALLOCATION_CLASSES.reduce((result, assetClass) => { const percent = Number(value[assetClass]); if (Number.isFinite(percent) && percent >= 0 && percent <= 100) result[assetClass] = percent; return result; }, {}); }
function normalizeList(value, uppercase) { if (!Array.isArray(value)) return []; const normalized = value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean).map((item) => uppercase ? item.toUpperCase() : item); return [...new Map(normalized.map((item) => [item.toLocaleLowerCase("pt-BR"), item])).values()].sort((a, b) => a.localeCompare(b, "pt-BR")); }
function hasDuplicates(value, uppercase) { if (!Array.isArray(value)) return false; const raw = value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean).map((item) => uppercase ? item.toUpperCase() : item.toLocaleLowerCase("pt-BR")); return new Set(raw).size !== raw.length; }
function validTimestamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
