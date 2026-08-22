import { appConfig } from "../config/appConfig.js";
import { normalizeMarketQuote } from "./marketNormalizers.js";

export const MARKET_CACHE_KEY = "vestra:marketCache:v1";

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function ttlMs(ttlMinutes = appConfig.quoteCacheTtlMinutes) {
  return Math.max(1, Number(ttlMinutes) || 1) * 60 * 1000;
}

export function normalizeMarketCache(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((map, [ticker, entry]) => {
    const quote = normalizeMarketQuote(entry?.data || entry, entry?.source || "cache");
    const timestamp = Number(entry?.timestamp);
    const expiresAt = Number(entry?.expiresAt);
    if (!quote || !Number.isFinite(timestamp) || !Number.isFinite(expiresAt)) return map;
    map[quote.ticker] = { ticker: quote.ticker, data: quote, source: entry.source || quote.source || "cache", timestamp, expiresAt };
    return map;
  }, {});
}

export function readMarketCache() {
  return normalizeMarketCache(parse(localStorage.getItem(MARKET_CACHE_KEY), {}));
}

export function writeMarketCache(cache) {
  const normalized = normalizeMarketCache(cache);
  localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getCachedQuote(ticker, { allowExpired = false } = {}) {
  const key = String(ticker || "").toUpperCase();
  const entry = readMarketCache()[key];
  if (!entry) return null;
  const expired = Date.now() > entry.expiresAt;
  if (expired && !allowExpired) return null;
  return { ...entry.data, source: entry.source || entry.data.source || "cache", stale: expired };
}

export function invalidateCachedQuote(ticker) {
  const key = String(ticker || "").toUpperCase();
  const cache = readMarketCache();
  if (!cache[key]) return cache;
  delete cache[key];
  return writeMarketCache(cache);
}

export function pruneExpiredMarketCache() {
  const cache = readMarketCache();
  const now = Date.now();
  const active = Object.fromEntries(Object.entries(cache).filter(([, entry]) => now <= entry.expiresAt));
  if (Object.keys(active).length !== Object.keys(cache).length) writeMarketCache(active);
  return active;
}

export function setCachedQuote(quote, ttlMinutes = appConfig.quoteCacheTtlMinutes) {
  const normalized = normalizeMarketQuote(quote, quote?.source || "cache");
  if (!normalized) return readMarketCache();
  const cache = readMarketCache();
  const timestamp = Date.now();
  const next = { ticker: normalized.ticker, data: normalized, source: normalized.source || "cache", timestamp, expiresAt: timestamp + ttlMs(ttlMinutes) };
  const current = cache[normalized.ticker];
  if (JSON.stringify(current) === JSON.stringify(next)) return cache;
  cache[normalized.ticker] = next;
  return writeMarketCache(cache);
}

export function clearMarketCache() {
  localStorage.removeItem(MARKET_CACHE_KEY);
}

export function getMarketCacheStats() {
  const cache = readMarketCache();
  const entries = Object.values(cache);
  const now = Date.now();
  return { total: entries.length, valid: entries.filter((entry) => now <= entry.expiresAt).length, expired: entries.filter((entry) => now > entry.expiresAt).length };
}
