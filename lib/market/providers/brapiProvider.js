import { appConfig } from "@/lib/config/appConfig";
import { privateEnvConfig } from "@/lib/config/envConfig";
import * as https from "node:https";
import * as tls from "node:tls";
import { normalizeTicker } from "@/lib/data/assetsMaster";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";
import { normalizeMarketAsset, normalizeMarketQuote } from "@/lib/market/marketNormalizers";
import { normalizeMarketHistory } from "@/lib/market/marketNormalizers";
import { classifyMarketAsset } from "@/lib/market/assetClassification";
import { getMarketCapabilities } from "@/lib/market/marketCapabilities";
import { marketProvenance, MARKET_AVAILABILITY } from "@/lib/market/marketContracts";

const BASE_URL = "https://brapi.dev/api";
const MAX_RESPONSE_BYTES = 500000;
export const BRAPI_ASSET_MODULES = ["summaryProfile", "defaultKeyStatistics", "financialData"];
const systemCertificates = typeof tls.getCACertificates === "function" ? tls.getCACertificates("system") : [];
const brapiAgent = systemCertificates.length ? new https.Agent({ ca: [...tls.rootCertificates, ...systemCertificates] }) : undefined;

function performRequest(url, signal) {
  return new Promise((resolve, reject) => {
    const requestHandle = https.get(url, { agent: brapiAgent, headers: { accept: "application/json" } }, (response) => {
      const chunks = [];
      let total = 0;
      response.on("data", (chunk) => {
        total += chunk.length;
        if (total > MAX_RESPONSE_BYTES) {
          requestHandle.destroy(new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Response too large", 502));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status: response.statusCode || 500, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    requestHandle.on("error", reject);
    signal.addEventListener("abort", () => {
      const error = new Error("Timeout");
      error.name = "AbortError";
      requestHandle.destroy(error);
    }, { once: true });
  });
}

function token() {
  return privateEnvConfig.brapiToken;
}

function assertConfigured() {
  if (!token()) throw new MarketError(MARKET_ERRORS.PROVIDER_NOT_CONFIGURED, "BRAPI_TOKEN ausente", 503);
}

function controllerWithTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.marketRequestTimeoutMs);
  return { controller, timeout };
}

export async function brapiRequest(path, params = {}) {
  assertConfigured();
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries({ ...params, token: token() }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const { controller, timeout } = controllerWithTimeout();
  try {
    const response = await performRequest(url, controller.signal);
    if (response.status === 401) throw new MarketError(MARKET_ERRORS.INVALID_TOKEN, "Invalid token", 401);
    if (response.status === 403) throw new MarketError(MARKET_ERRORS.PROVIDER_PERMISSION, "Provider permission", 403);
    if (response.status === 404) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
    if (response.status === 429) throw new MarketError(MARKET_ERRORS.RATE_LIMITED, "Rate limited", 429);
    if (response.status < 200 || response.status >= 300) throw new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Provider error", response.status);
    const length = Number(response.headers["content-length"] || 0);
    if (length > MAX_RESPONSE_BYTES) throw new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Response too large", 502);
    return JSON.parse(response.body);
  } catch (error) {
    if (error?.name === "AbortError") throw new MarketError(MARKET_ERRORS.TIMEOUT, "Timeout", 504);
    if (error instanceof MarketError) throw error;
    throw new MarketError(MARKET_ERRORS.NETWORK_ERROR, "Network error", 502);
  } finally {
    clearTimeout(timeout);
  }
}

const request = brapiRequest;

function inferAssetType(item = {}) {
  const ticker = normalizeTicker(item.stock || item.symbol || item.ticker);
  return classifyMarketAsset({ ticker, providerType: item.type || item.stockType });
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function firstNumber(...values) {
  const value = values.find((item) => item !== undefined && item !== null && item !== "" && Number.isFinite(Number(item)));
  return value === undefined ? undefined : Number(value);
}

function marketTimestamp(value) {
  const numeric = typeof value === "number" || (typeof value === "string" && /^\d+(\.\d+)?$/.test(value));
  const date = value ? new Date(numeric ? Number(value) * 1000 : value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeDividend(item = {}) {
  const paymentDate = firstText(item.paymentDate, item.date);
  const declarationDate = firstText(item.approvedOn, item.declarationDate);
  const recordDate = firstText(item.lastDatePrior, item.recordDate);
  const exDate = firstText(item.exDate);
  const date = firstText(paymentDate, exDate, recordDate, declarationDate);
  const value = firstNumber(item.rate, item.value, item.amount, item.dividend);
  if (!date || value === undefined || value <= 0) return null;
  return { date, paymentDate: paymentDate || null, declarationDate: declarationDate || null, recordDate: recordDate || null, exDate: exDate || null, value, type: firstText(item.label, item.type) || "Dividendo" };
}

function dividendsFromBrapi(item = {}) {
  const sources = [item.dividendsData?.cashDividends, item.cashDividends, item.dividends];
  return sources.flatMap((value) => Array.isArray(value) ? value : []).map(normalizeDividend).filter(Boolean).slice(0, 24);
}

function indicatorsFromBrapi(item = {}) {
  const statistics = item.defaultKeyStatistics || {};
  const financial = item.financialData || {};
  return {
    priceEarnings: firstNumber(item.priceEarnings, statistics.trailingPE, statistics.forwardPE),
    priceBook: firstNumber(statistics.priceToBook, item.priceToBook),
    dividendYield: firstNumber(statistics.dividendYield, statistics.yield, item.dividendYield),
    roe: firstNumber(financial.returnOnEquity, item.returnOnEquity),
    roic: firstNumber(financial.returnOnInvestedCapital, item.returnOnInvestedCapital),
    netMargin: firstNumber(financial.profitMargins, statistics.profitMargins, item.profitMargins),
    ebitdaMargin: firstNumber(financial.ebitdaMargins, item.ebitdaMargins),
    currentLiquidity: firstNumber(financial.currentRatio, item.currentRatio),
    bookValuePerShare: firstNumber(statistics.bookValue, item.bookValue),
    earningsPerShare: firstNumber(item.earningsPerShare, statistics.trailingEps, statistics.earningsPerShare),
  };
}

function assetFromBrapi(item = {}, providerLimitations = []) {
  const ticker = normalizeTicker(item.stock || item.symbol || item.ticker);
  if (!ticker) return null;
  const logoPath = firstText(item.logo, item.logourl, item.logoPath);
  return normalizeMarketAsset({
    ticker,
    name: item.name || item.longName || item.shortName || ticker,
    shortName: item.shortName || item.name || ticker,
    type: inferAssetType(item),
    sector: item.summaryProfile?.sector || item.summaryProfile?.sectorDisp || item.sector || item.sectorName || "",
    segment: item.summaryProfile?.industry || item.summaryProfile?.industryDisp || item.segment || item.industry || "",
    country: "Brasil",
    currency: item.currency || "BRL",
    exchange: item.exchange || "B3",
    logoPath: /^https:\/\//.test(logoPath) ? logoPath : "",
    description: firstText(item.summaryProfile?.longBusinessSummary, item.summaryProfile?.description, item.longBusinessSummary, item.description),
    website: firstText(item.summaryProfile?.website, item.website, item.websiteUrl),
    indicators: indicatorsFromBrapi(item),
    dividends: dividendsFromBrapi(item),
    source: "brapi",
    updatedAt: marketTimestamp(item.regularMarketTime),
    providerLimitations,
    provenance: marketProvenance({ provider: "brapi", sourceUpdatedAt: marketTimestamp(item.regularMarketTime), fetchedAt: new Date().toISOString(), availability: providerLimitations.length ? MARKET_AVAILABILITY.PLAN_RESTRICTED : MARKET_AVAILABILITY.AVAILABLE, limitation: providerLimitations[0] || null }),
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
    open: item.regularMarketOpen,
    dayHigh: item.regularMarketDayHigh,
    dayLow: item.regularMarketDayLow,
    previousClose: item.regularMarketPreviousClose,
    volume: item.regularMarketVolume,
    marketStatus: item.marketState || item.marketStatus || "unknown",
    currency: item.currency || "BRL",
    source: "brapi",
    updatedAt: marketTimestamp(item.regularMarketTime),
    fetchedAt: new Date().toISOString(),
    provider: "brapi",
    dividends: dividendsFromBrapi(item),
  }, "brapi");
}

function quoteResult(data) {
  return Array.isArray(data?.results) ? data.results : [];
}

export const brapiProvider = {
  id: "brapi",
  name: "brapi.dev",
  capabilities: getMarketCapabilities("brapi"),

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
    let data;
    let limitations = [];
    try {
      data = await request(`/quote/${encodeURIComponent(normalized)}`, { range: "1d", interval: "1d", modules: BRAPI_ASSET_MODULES.join(",") });
    } catch (error) {
      if (error?.code !== MARKET_ERRORS.PROVIDER_PERMISSION) throw error;
      data = await request(`/quote/${encodeURIComponent(normalized)}`, { range: "1d", interval: "1d" });
      limitations = ["ADVANCED_MODULES_UNAVAILABLE"];
    }
    const [item] = quoteResult(data);
    const asset = assetFromBrapi(item, limitations);
    if (!asset) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
    return { ...asset, quote: quoteFromBrapi(item) };
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

  async getHistoricalPrices(ticker, { range = "3mo", interval = "1d" } = {}) {
    const normalized = normalizeTicker(ticker);
    if (!normalized) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid ticker", 400);
    const supportedRange = appConfig.marketHistoryRanges.includes(range) ? range : "3mo";
    const data = await request(`/quote/${encodeURIComponent(normalized)}`, { range: supportedRange, interval: "1d" });
    const [item] = quoteResult(data);
    if (!item) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
    const prices = (Array.isArray(item.historicalDataPrice) ? item.historicalDataPrice : []).map((price) => ({
      timestamp: marketTimestamp(price.date),
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      adjustedClose: price.adjustedClose,
      volume: price.volume,
    }));
    return normalizeMarketHistory({ ticker: normalized, range: supportedRange, interval, prices, source: "brapi", fetchedAt: new Date().toISOString() }, "brapi");
  },

  async getProviderStatus({ verify = false } = {}) {
    if (!token()) return { id: "brapi", name: "brapi.dev", online: false, connectivity: "not-configured", configured: false, automaticQuotes: false, capabilities: this.capabilities, code: MARKET_ERRORS.PROVIDER_NOT_CONFIGURED, message: "O provedor de mercado ainda nao esta configurado." };
    if (!verify) return { id: "brapi", name: "brapi.dev", online: null, connectivity: "unverified", configured: true, automaticQuotes: true, capabilities: this.capabilities, checkedAt: null, message: "Configurado. Conectividade ainda nao verificada." };
    const checkedAt = new Date().toISOString();
    try {
      await this.getQuote("PETR4");
      return { id: "brapi", name: "brapi.dev", online: true, connectivity: "online", configured: true, automaticQuotes: true, capabilities: this.capabilities, checkedAt, message: "Conectividade verificada." };
    } catch (error) {
      return { id: "brapi", name: "brapi.dev", online: false, connectivity: "unavailable", configured: true, automaticQuotes: true, capabilities: this.capabilities, checkedAt, code: error?.code || MARKET_ERRORS.PROVIDER_ERROR, message: "Indisponivel temporariamente." };
    }
  },
};
