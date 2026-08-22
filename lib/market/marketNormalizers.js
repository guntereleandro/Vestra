import { normalizeAssetRecord, normalizeTicker } from "../data/assetsMaster.js";
import { marketProvenance, MARKET_AVAILABILITY } from "./marketContracts.js";

function optionalNumber(value) {
  return value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
}

function optionalTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function normalizeMarketAsset(value = {}, source = "unknown") {
  const normalized = normalizeAssetRecord({ ...value, source: value.source || source });
  if (!normalized) return null;
  const updatedAt = optionalTimestamp(value.updatedAt);
  return {
    ...normalized,
    updatedAt,
    provenance: value.provenance || marketProvenance({ provider: value.provider || value.source || source, sourceUpdatedAt: updatedAt, fetchedAt: optionalTimestamp(value.fetchedAt), availability: value.availability || MARKET_AVAILABILITY.AVAILABLE, limitation: value.limitation || null, fallback: value.fallback }),
  };
}

export function normalizeMarketQuote(value = {}, source = "unknown") {
  const ticker = normalizeTicker(value.ticker);
  const rawPrice = value.price ?? value.currentQuote ?? value.cotacaoAtual;
  if (!ticker || rawPrice === "" || rawPrice == null || !Number.isFinite(Number(rawPrice)) || Number(rawPrice) <= 0) return null;
  const updatedAt = optionalTimestamp(value.updatedAt || value.regularMarketTime);
  const provider = typeof value.provider === "string" && value.provider ? value.provider : (value.source || source);
  return {
    ticker,
    price: Number(rawPrice),
    change: optionalNumber(value.change ?? value.regularMarketChange),
    changePercent: optionalNumber(value.changePercent ?? value.regularMarketChangePercent),
    open: optionalNumber(value.open ?? value.regularMarketOpen),
    dayHigh: optionalNumber(value.dayHigh ?? value.regularMarketDayHigh),
    dayLow: optionalNumber(value.dayLow ?? value.regularMarketDayLow),
    previousClose: optionalNumber(value.previousClose ?? value.regularMarketPreviousClose),
    volume: optionalNumber(value.volume ?? value.regularMarketVolume),
    marketStatus: typeof value.marketStatus === "string" && value.marketStatus ? value.marketStatus : "unknown",
    currency: typeof value.currency === "string" && value.currency ? value.currency.toUpperCase() : "BRL",
    source: typeof value.source === "string" && value.source ? value.source : source,
    updatedAt,
    provenance: value.provenance || marketProvenance({ provider, sourceUpdatedAt: updatedAt, fetchedAt: optionalTimestamp(value.fetchedAt), availability: MARKET_AVAILABILITY.AVAILABLE, fallback: value.fallback }),
    dividends: Array.isArray(value.dividends) ? value.dividends : undefined,
  };
}

export function normalizeHistoricalPrice(value = {}) {
  const timestamp = optionalTimestamp(value.timestamp || value.date);
  const close = optionalNumber(value.close);
  if (!timestamp || close == null) return null;
  return {
    timestamp,
    open: optionalNumber(value.open),
    high: optionalNumber(value.high),
    low: optionalNumber(value.low),
    close,
    adjustedClose: optionalNumber(value.adjustedClose),
    volume: optionalNumber(value.volume),
  };
}

export function normalizeMarketHistory(value = {}, source = "unknown") {
  const ticker = normalizeTicker(value.ticker);
  if (!ticker) return null;
  const prices = (Array.isArray(value.prices) ? value.prices : []).map(normalizeHistoricalPrice).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return {
    ticker,
    range: value.range || "3mo",
    interval: value.interval || "1d",
    prices,
    source: value.source || source,
    adjustedCloseAvailable: prices.some((price) => price.adjustedClose != null),
    provenance: value.provenance || marketProvenance({ provider: value.provider || value.source || source, sourceUpdatedAt: prices.at(-1)?.timestamp || null, fetchedAt: optionalTimestamp(value.fetchedAt) }),
  };
}

export function quoteToManualRecord(quote) {
  const normalized = normalizeMarketQuote(quote, "manual");
  if (!normalized) return null;
  return {
    ticker: normalized.ticker,
    currentQuote: normalized.price,
    updatedAt: normalized.updatedAt ? normalized.updatedAt.slice(0, 10) : "",
    origin: normalized.source || "manual",
  };
}
