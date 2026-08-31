import { canonicalAssetId, isSupportedIncomeEventType, normalizeIsoDate } from "./incomeContracts.js";

function clean(value) { return value == null || value === "" ? null : String(value).trim(); }
function decimal(value) {
  if (value == null || value === "") return null;
  const normalized = String(value).replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalized) && Number(normalized) > 0 ? normalized : null;
}
function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function canonicalizeIncomeEvent(input = {}) {
  const ticker = clean(input.ticker)?.toUpperCase() || null;
  const eventType = clean(input.eventType)?.toUpperCase();
  const amount = decimal(input.grossAmountPerUnit);
  if (!ticker || !isSupportedIncomeEventType(eventType) || !amount) return null;
  const event = {
    canonicalAssetId: canonicalAssetId({ exchange: input.exchange, ticker, isin: input.isin }),
    ticker,
    assetName: clean(input.assetName), eventType,
    status: clean(input.status)?.toUpperCase() || "UNKNOWN",
    recordDate: normalizeIsoDate(input.recordDate), exDate: normalizeIsoDate(input.exDate),
    declarationDate: normalizeIsoDate(input.declarationDate), paymentDate: normalizeIsoDate(input.paymentDate),
    grossAmountPerUnit: amount, currency: clean(input.currency)?.toUpperCase() || null,
    installment: clean(input.installment), period: clean(input.period), source: clean(input.source) || "unknown",
    sourceConfidence: clean(input.sourceConfidence) || "medium", sourceUpdatedAt: input.sourceUpdatedAt || null,
  };
  const identityParts = [event.canonicalAssetId, input.isin || null, event.eventType, event.recordDate,
    event.exDate, event.paymentDate, event.grossAmountPerUnit, event.currency, event.installment, event.period];
  const identityMaterial = identityParts.map((part) => part ?? "-").join("|");
  return { ...event, canonicalIdentity: `income:v1:${stableHash(identityMaterial)}:${identityMaterial}` };
}

export function externalIncomeIdentity(provider, raw = {}, event) {
  const externalId = clean(raw.id || raw.externalId);
  const rawMaterial = JSON.stringify(raw, Object.keys(raw).sort());
  const identityMaterial = externalId ? `${provider}|id|${externalId}` : `${provider}|canonical|${event.canonicalIdentity}`;
  return { provider, externalId, externalIdentityHash: `ext:v1:${stableHash(identityMaterial)}`, rawHash: `raw:v1:${stableHash(rawMaterial)}` };
}
