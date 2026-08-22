import { appConfig } from "@/lib/config/appConfig";
import { localProvider } from "@/lib/market/providers/localProvider";
import { mergeRankedAssets, searchAndRankAssets } from "@/lib/market/assetSearch";
import { getCachedQuote, invalidateCachedQuote, setCachedQuote } from "@/lib/market/quoteCache";
import { MARKET_ERRORS, MarketError, userMarketMessage } from "@/lib/market/marketErrors";
import { getMarketCapabilities } from "@/lib/market/marketCapabilities";

const providers = { local: localProvider };
const inFlight = new Map();

function shouldUseRemote(query) {
  const term = String(query || "").trim();
  return appConfig.marketProvider === "brapi" && appConfig.enableMarketMetadata && term.length >= 2;
}

function requestOnce(url) {
  if (inFlight.has(url)) return inFlight.get(url);
  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), appConfig.marketClientTimeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        const code = data?.error?.code || MARKET_ERRORS.PROVIDER_ERROR;
        throw new MarketError(code, userMarketMessage(code), response.status);
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") throw new MarketError(MARKET_ERRORS.TIMEOUT, userMarketMessage(MARKET_ERRORS.TIMEOUT), 504);
      if (error instanceof MarketError) throw error;
      throw new MarketError(MARKET_ERRORS.NETWORK_ERROR, userMarketMessage(MARKET_ERRORS.NETWORK_ERROR), 502);
    } finally {
      clearTimeout(timer);
    }
  })();
  inFlight.set(url, promise);
  promise.finally(() => inFlight.delete(url)).catch(() => {});
  return promise;
}

export async function searchMarketAssetsDetailed(query, context = {}) {
  const local = await localProvider.searchAssets(query, context);
  if (!shouldUseRemote(query)) return { assets: local, provider: "local", fallback: false, error: null };
  try {
    const remote = await requestOnce(`/api/market/search?q=${encodeURIComponent(String(query).trim())}`);
    return { assets: mergeRankedAssets(query, [searchAndRankAssets(query, local, 20), remote.assets || []], 12), provider: "brapi", fallback: false, error: null };
  } catch (error) {
    return { assets: local, provider: "local", fallback: true, error: { code: error.code || MARKET_ERRORS.PROVIDER_ERROR, message: userMarketMessage(error.code) } };
  }
}

export async function searchMarketAssets(query, context = {}) {
  return (await searchMarketAssetsDetailed(query, context)).assets;
}

export async function getMarketAsset(ticker, context = {}) {
  const local = await localProvider.getAsset(ticker, context);
  if (appConfig.marketProvider !== "brapi") return local;
  try {
    const remote = await requestOnce(`/api/market/assets/${encodeURIComponent(ticker)}`);
    return { ...local, ...remote.asset, quote: remote.asset?.quote || null, fallback: false };
  } catch (error) {
    if (local) return { ...local, fallback: true, remoteError: { code: error.code, message: userMarketMessage(error.code) } };
    throw error;
  }
}

export async function getMarketQuote(ticker, context = {}, { force = false } = {}) {
  const manual = await localProvider.getQuote(ticker, context);
  if (manual?.manualOverride) return manual;
  if (!force) {
    const cached = getCachedQuote(ticker);
    if (cached) return { ...cached, source: cached.source || "cache" };
  } else invalidateCachedQuote(ticker);
  if (appConfig.enableAutomaticQuotes && appConfig.marketProvider === "brapi") {
    try {
      const result = await requestOnce(`/api/market/quotes?tickers=${encodeURIComponent(ticker)}`);
      const quote = result.quotes?.[0] || null;
      if (quote) setCachedQuote(quote);
      if (quote) return quote;
    } catch (error) {
      if (!manual) throw error;
      return { ...manual, fallback: true, remoteError: { code: error.code, message: userMarketMessage(error.code) } };
    }
  }
  return manual || null;
}

async function runLimited(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export async function getMarketQuotes(tickers, context = {}) {
  const unique = [...new Set((tickers || []).filter(Boolean))];
  const results = await runLimited(unique, appConfig.marketQuoteConcurrency, async (ticker) => {
    try { return await getMarketQuote(ticker, context); } catch { return null; }
  });
  return results.filter(Boolean);
}

export async function fetchAutomaticQuotes(tickers, { force = false } = {}) {
  const unique = [...new Set((tickers || []).filter(Boolean))];
  const cached = [], missing = [];
  unique.forEach((ticker) => {
    const quote = force ? null : getCachedQuote(ticker);
    if (quote) cached.push(quote); else missing.push(ticker);
  });
  if (!missing.length || !appConfig.enableAutomaticQuotes || appConfig.marketProvider !== "brapi") return { quotes: cached, cached, fetched: [], notFound: [], failed: [], error: null };
  const outcomes = await runLimited(missing, appConfig.marketQuoteConcurrency, async (ticker) => {
    try {
      const data = await requestOnce(`/api/market/quotes?tickers=${encodeURIComponent(ticker)}`);
      const quote = data.quotes?.[0] || null;
      if (quote) { setCachedQuote(quote); return { ticker, quote }; }
      return { ticker, notFound: true };
    } catch (error) {
      return { ticker, error: error.code || MARKET_ERRORS.PROVIDER_ERROR };
    }
  });
  const fetched = outcomes.map((item) => item.quote).filter(Boolean);
  const notFound = outcomes.filter((item) => item.notFound).map((item) => item.ticker);
  const failed = outcomes.filter((item) => item.error).map((item) => ({ ticker: item.ticker, code: item.error }));
  return { quotes: [...cached, ...fetched], cached, fetched, notFound, failed, error: failed.length ? "PARTIAL_FAILURE" : null };
}

export async function getMarketHistory(ticker, range = "3mo") {
  if (!getMarketCapabilities("brapi").historicalPrices) throw new MarketError(MARKET_ERRORS.PROVIDER_PERMISSION, "History unavailable", 403);
  return requestOnce(`/api/market/history/${encodeURIComponent(ticker)}?range=${encodeURIComponent(range)}`);
}

export async function getProviderStatus({ verify = false } = {}) {
  if (appConfig.marketProvider !== "brapi") return localProvider.getProviderStatus();
  try { return (await requestOnce(`/api/market/status${verify ? "?verify=1" : ""}`)).status; }
  catch (error) { return { id: "brapi", name: "brapi.dev", online: false, connectivity: "unavailable", configured: null, automaticQuotes: false, code: error.code, message: userMarketMessage(error.code) }; }
}

export function getAvailableProviders() {
  return [...Object.values(providers).map((provider) => ({ id: provider.id, name: provider.name, capabilities: provider.capabilities })), { id: "brapi", name: "brapi.dev", capabilities: getMarketCapabilities("brapi") }];
}
