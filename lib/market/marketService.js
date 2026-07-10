import { appConfig } from "@/lib/config/appConfig";
import { localProvider } from "@/lib/market/providers/localProvider";
import { mergeRankedAssets, searchAndRankAssets } from "@/lib/market/assetSearch";
import { getCachedQuote, setCachedQuote } from "@/lib/market/quoteCache";
import { userMarketMessage } from "@/lib/market/marketErrors";

const providers = { local: localProvider };

function shouldUseRemote(query) {
  const term = String(query || "").trim();
  return appConfig.marketProvider === "brapi" && appConfig.enableMarketMetadata && term.length >= 2;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const code = data?.error?.code || "PROVIDER_ERROR";
    return { ok: false, code, message: userMarketMessage(code), data };
  }
  return { ok: true, data };
}

export async function searchMarketAssets(query, context = {}) {
  const local = await localProvider.searchAssets(query, context);
  if (!shouldUseRemote(query)) return local;
  const remote = await fetchJson(`/api/market/search?q=${encodeURIComponent(String(query).trim())}`);
  if (!remote.ok) return local;
  return mergeRankedAssets(query, [searchAndRankAssets(query, local, 20), remote.data.assets || []], 12);
}

export async function getMarketAsset(ticker, context = {}) {
  const local = await localProvider.getAsset(ticker, context);
  if (appConfig.marketProvider !== "brapi") return local;
  const remote = await fetchJson(`/api/market/assets/${encodeURIComponent(ticker)}`);
  return remote.ok ? { ...local, ...remote.data.asset } : local;
}

export async function getMarketQuote(ticker, context = {}) {
  const manual = await localProvider.getQuote(ticker, context);
  if (manual) return manual;
  const cached = getCachedQuote(ticker);
  if (cached) return { ...cached, source: cached.source || "cache" };
  if (!appConfig.enableAutomaticQuotes || appConfig.marketProvider !== "brapi") return null;
  const result = await fetchJson(`/api/market/quotes?tickers=${encodeURIComponent(ticker)}`);
  const quote = result.ok ? result.data.quotes?.[0] : null;
  if (quote) setCachedQuote(quote);
  return quote || null;
}

export async function getMarketQuotes(tickers, context = {}) {
  const results = await Promise.all((tickers || []).map((ticker) => getMarketQuote(ticker, context)));
  return results.filter(Boolean);
}

export async function fetchAutomaticQuotes(tickers) {
  const unique = [...new Set((tickers || []).filter(Boolean))];
  const cached = [];
  const missing = [];
  unique.forEach((ticker) => {
    const quote = getCachedQuote(ticker);
    if (quote) cached.push(quote);
    else missing.push(ticker);
  });
  if (!missing.length || !appConfig.enableAutomaticQuotes || appConfig.marketProvider !== "brapi") return { quotes: cached, cached, notFound: [], error: null };
  const chunks = [];
  for (let index = 0; index < missing.length; index += appConfig.maxTickersPerRequest) chunks.push(missing.slice(index, index + appConfig.maxTickersPerRequest));
  const fetched = [];
  const notFound = [];
  let error = null;
  for (const chunk of chunks) {
    const result = await fetchJson(`/api/market/quotes?tickers=${encodeURIComponent(chunk.join(","))}`);
    if (!result.ok) {
      error = result.code;
      continue;
    }
    (result.data.quotes || []).forEach((quote) => { setCachedQuote(quote); fetched.push(quote); });
    notFound.push(...(result.data.notFound || []));
  }
  return { quotes: [...cached, ...fetched], cached, fetched, notFound, error };
}

export async function getProviderStatus() {
  if (appConfig.marketProvider !== "brapi") return localProvider.getProviderStatus();
  const result = await fetchJson("/api/market/status");
  return result.ok ? result.data.status : { id: "brapi", name: "brapi.dev", online: false, configured: false, automaticQuotes: false, code: result.code, message: result.message };
}

export function getAvailableProviders() {
  return [...Object.values(providers).map((provider) => ({ id: provider.id, name: provider.name })), { id: "brapi", name: "brapi.dev" }];
}
