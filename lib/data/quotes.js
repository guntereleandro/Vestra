import { normalizeTicker } from "@/lib/data/assetsMaster";
import { validDate } from "@/lib/engine/validations";

export const QUOTE_ORIGIN = "manual";

function validPrice(value) {
  return value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) > 0;
}

function normalizedDate(value) {
  const raw = String(value || "").slice(0, 10);
  return validDate(raw) ? raw : new Date().toISOString().slice(0, 10);
}

export function calculateEffectiveQuote(quote = {}) {
  const manualValid = validPrice(quote.manualPrice);
  const automaticValid = validPrice(quote.automaticPrice);
  if (quote.manualOverride && manualValid) return { price: Number(quote.manualPrice), source: "manual", updatedAt: quote.manualUpdatedAt || quote.updatedAt || "" };
  if (automaticValid) return { price: Number(quote.automaticPrice), source: quote.automaticSource || "brapi", updatedAt: quote.automaticUpdatedAt || quote.updatedAt || "" };
  if (manualValid) return { price: Number(quote.manualPrice), source: "manual", updatedAt: quote.manualUpdatedAt || quote.updatedAt || "" };
  return { price: 0, source: "", updatedAt: "" };
}

export function normalizeQuoteRecord(quote = {}) {
  const ticker = normalizeTicker(quote.ticker);
  if (!ticker) return null;
  const legacyManual = quote.manualPrice ?? quote.currentQuote ?? quote.price ?? quote.cotacaoAtual;
  const manualPrice = validPrice(legacyManual) ? Number(legacyManual) : null;
  const automaticPrice = validPrice(quote.automaticPrice) ? Number(quote.automaticPrice) : null;
  const manualOverride = typeof quote.manualOverride === "boolean" ? quote.manualOverride : manualPrice != null && !automaticPrice;
  const manualUpdatedAt = manualPrice != null ? normalizedDate(quote.manualUpdatedAt || quote.updatedAt || quote.dataAtualizacao) : "";
  const automaticUpdatedAt = automaticPrice != null ? (String(quote.automaticUpdatedAt || quote.updatedAt || new Date().toISOString())) : "";
  const effective = calculateEffectiveQuote({ manualPrice, automaticPrice, manualOverride, manualUpdatedAt, automaticUpdatedAt, automaticSource: quote.automaticSource || quote.source });
  if (!manualPrice && !automaticPrice) return null;
  return {
    ticker,
    manualPrice,
    automaticPrice,
    effectivePrice: effective.price,
    currentQuote: effective.price,
    manualOverride,
    automaticUpdatedAt,
    manualUpdatedAt,
    updatedAt: String(effective.updatedAt || manualUpdatedAt || automaticUpdatedAt).slice(0, 10),
    source: effective.source,
    origin: effective.source,
    automaticSource: quote.automaticSource || (automaticPrice != null ? "brapi" : ""),
    stale: Boolean(quote.stale),
  };
}

export function normalizeQuotes(value) {
  const source = Array.isArray(value) ? value : value && typeof value === "object" ? Object.entries(value).map(([ticker, quote]) => typeof quote === "object" ? { ticker, ...quote } : { ticker, currentQuote: quote }) : [];
  const map = new Map();
  source.forEach((quote) => {
    const normalized = normalizeQuoteRecord(quote);
    if (normalized) map.set(normalized.ticker, normalized);
  });
  return [...map.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function applyAutomaticQuotes(currentQuotes, marketQuotes) {
  const map = new Map(normalizeQuotes(currentQuotes).map((quote) => [quote.ticker, quote]));
  marketQuotes.forEach((marketQuote) => {
    if (!validPrice(marketQuote.price)) return;
    const ticker = normalizeTicker(marketQuote.ticker);
    if (!ticker) return;
    const previous = map.get(ticker) || { ticker, manualOverride: false };
    map.set(ticker, normalizeQuoteRecord({
      ...previous,
      ticker,
      automaticPrice: Number(marketQuote.price),
      automaticUpdatedAt: marketQuote.updatedAt || new Date().toISOString(),
      automaticSource: marketQuote.source || "brapi",
      stale: Boolean(marketQuote.stale),
    }));
  });
  return [...map.values()].filter(Boolean).sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function setManualQuote(currentQuotes, quote) {
  const map = new Map(normalizeQuotes(currentQuotes).map((item) => [item.ticker, item]));
  const ticker = normalizeTicker(quote.ticker);
  if (!ticker || !validPrice(quote.currentQuote ?? quote.manualPrice)) return [...map.values()];
  map.set(ticker, normalizeQuoteRecord({ ...map.get(ticker), ticker, manualPrice: quote.currentQuote ?? quote.manualPrice, manualUpdatedAt: quote.updatedAt || new Date().toISOString().slice(0, 10), manualOverride: true }));
  return [...map.values()].filter(Boolean).sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function removeManualQuote(currentQuotes, ticker) {
  const map = new Map(normalizeQuotes(currentQuotes).map((item) => [item.ticker, item]));
  const key = normalizeTicker(ticker);
  const current = map.get(key);
  if (!current) return [...map.values()];
  const next = normalizeQuoteRecord({ ...current, manualPrice: null, manualUpdatedAt: "", manualOverride: false });
  if (next) map.set(key, next);
  else map.delete(key);
  return [...map.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function useAutomaticQuote(currentQuotes, ticker) {
  const map = new Map(normalizeQuotes(currentQuotes).map((item) => [item.ticker, item]));
  const key = normalizeTicker(ticker);
  const current = map.get(key);
  if (!current) return [...map.values()];
  map.set(key, normalizeQuoteRecord({ ...current, manualOverride: false }));
  return [...map.values()].filter(Boolean).sort((a, b) => a.ticker.localeCompare(b.ticker));
}
