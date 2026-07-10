import { appConfig } from "@/lib/config/appConfig";
import { normalizeTicker } from "@/lib/data/assetsMaster";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";
import { normalizeMarketAsset, normalizeMarketQuote } from "@/lib/market/marketNormalizers";

const BASE_URL = "https://brapi.dev/api";
const MAX_RESPONSE_BYTES = 500000;

function token() {
  return process.env.BRAPI_TOKEN || "";
}

function assertConfigured() {
  if (!token()) throw new MarketError(MARKET_ERRORS.PROVIDER_NOT_CONFIGURED, "BRAPI_TOKEN ausente", 503);
}

function controllerWithTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.marketRequestTimeoutMs);
  return { controller, timeout };
}

async function request(path, params = {}) {
  assertConfigured();
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries({ ...params, token: token() }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const { controller, timeout } = controllerWithTimeout();
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (response.status === 429) throw new MarketError(MARKET_ERRORS.RATE_LIMITED, "Rate limited", 429);
    if (!response.ok) throw new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Provider error", response.status);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_RESPONSE_BYTES) throw new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Response too large", 502);
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw new MarketError(MARKET_ERRORS.TIMEOUT, "Timeout", 504);
    if (error instanceof MarketError) throw error;
    throw new MarketError(MARKET_ERRORS.NETWORK_ERROR, "Network error", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function inferAssetType(item = {}) {
  const type = String(item.type || item.stockType || "").toLowerCase();
  const ticker = normalizeTicker(item.stock || item.symbol || item.ticker);
  if (type.includes("fii") || ticker.endsWith("11")) return "FII";
  if (type.includes("etf")) return "ETF";
  if (type.includes("bdr")) return "BDR";
  return "Ação";
}

function assetFromBrapi(item = {}) {
  const ticker = normalizeTicker(item.stock || item.symbol || item.ticker);
  if (!ticker) return null;
  return normalizeMarketAsset({
    ticker,
    name: item.name || item.longName || item.shortName || ticker,
    shortName: item.shortName || item.name || ticker,
    type: inferAssetType(item),
    sector: item.sector || item.sectorName || "",
    segment: item.segment || "",
    country: "Brasil",
    currency: item.currency || "BRL",
    exchange: item.exchange || "B3",
    logoPath: /^https:\/\//.test(item.logo || item.logourl || "") ? (item.logo || item.logourl) : "",
    source: "brapi",
    updatedAt: new Date().toISOString(),
  }, "brapi");
}

function quoteFromBrapi(item = {}) {
  const ticker = normalizeTicker(item.symbol || item.stock || item.ticker);
  const price = item.regularMarketPrice ?? item.price ?? item.close;
  return normalizeMarketQuote({
    ticker,
    price,
    change: item.regularMarketChange,
    changePercent: item.regularMarketChangePercent,
    previousClose: item.regularMarketPreviousClose,
    marketStatus: item.marketState || item.marketStatus || "unknown",
    currency: item.currency || "BRL",
    source: "brapi",
    updatedAt: item.regularMarketTime ? new Date(item.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
  }, "brapi");
}

function quoteResult(data) {
  return Array.isArray(data?.results) ? data.results : [];
}

export const brapiProvider = {
  id: "brapi",
  name: "brapi.dev",

  async searchAssets(query) {
    const term = String(query || "").trim().slice(0, 40);
    if (!term) return [];
    const data = await request("/quote/list", { search: term, limit: 20 });
    const stocks = Array.isArray(data?.stocks) ? data.stocks : Array.isArray(data?.results) ? data.results : [];
    return stocks.map(assetFromBrapi).filter(Boolean);
  },

  async getAsset(ticker) {
    const normalized = normalizeTicker(ticker);
    if (!normalized) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid ticker", 400);
    const quote = await this.getQuote(normalized);
    if (!quote) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
    return normalizeMarketAsset({ ticker: normalized, name: normalized, shortName: normalized, currency: quote.currency, exchange: "B3", source: "brapi", updatedAt: quote.updatedAt }, "brapi");
  },

  async getQuote(ticker) {
    const [quote] = await this.getQuotes([ticker]);
    if (!quote) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
    return quote;
  },

  async getQuotes(tickers) {
    const normalized = [...new Set((tickers || []).map(normalizeTicker).filter(Boolean))].slice(0, appConfig.maxTickersPerRequest);
    if (!normalized.length) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid tickers", 400);
    const data = await request(`/quote/${encodeURIComponent(normalized.join(","))}`, { range: "1d", interval: "1d" });
    return quoteResult(data).map(quoteFromBrapi).filter(Boolean);
  },

  async getProviderStatus() {
    if (!token()) return { id: "brapi", name: "brapi.dev", online: false, configured: false, automaticQuotes: false, code: MARKET_ERRORS.PROVIDER_NOT_CONFIGURED, message: "O provedor de mercado ainda nao esta configurado." };
    return { id: "brapi", name: "brapi.dev", online: true, configured: true, automaticQuotes: true, message: "brapi.dev configurado para cotacoes automaticas." };
  },
};
