import { normalizeAssetRecord, normalizeTicker } from "@/lib/data/assetsMaster";
import { safeNumber } from "@/lib/engine/validations";

export function normalizeMarketAsset(value = {}, source = "unknown") {
  const normalized = normalizeAssetRecord({ ...value, source: value.source || source });
  if (!normalized) return null;
  return normalized;
}

export function normalizeMarketQuote(value = {}, source = "unknown") {
  const ticker = normalizeTicker(value.ticker);
  const rawPrice = value.price ?? value.currentQuote ?? value.cotacaoAtual;
  if (!ticker || rawPrice === "" || rawPrice == null || !Number.isFinite(Number(rawPrice)) || Number(rawPrice) <= 0) return null;
  const updatedAt = typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : new Date().toISOString();
  return {
    ticker,
    price: Number(rawPrice),
    change: safeNumber(value.change),
    changePercent: safeNumber(value.changePercent),
    previousClose: safeNumber(value.previousClose),
    marketStatus: typeof value.marketStatus === "string" && value.marketStatus ? value.marketStatus : "unknown",
    currency: typeof value.currency === "string" && value.currency ? value.currency.toUpperCase() : "BRL",
    source: typeof value.source === "string" && value.source ? value.source : source,
    updatedAt,
  };
}

export function quoteToManualRecord(quote) {
  const normalized = normalizeMarketQuote(quote, "manual");
  if (!normalized) return null;
  return {
    ticker: normalized.ticker,
    currentQuote: normalized.price,
    updatedAt: normalized.updatedAt.slice(0, 10),
    origin: normalized.source || "manual",
  };
}
