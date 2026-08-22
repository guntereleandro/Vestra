import { appConfig } from "@/lib/config/appConfig";
import { normalizeTicker } from "@/lib/data/assetsMaster";
import { MARKET_ERRORS, MarketError, marketErrorResponse } from "@/lib/market/marketErrors";
import { enforceMarketRateLimit } from "@/lib/market/server/marketRateLimit";

export function jsonOk(data) {
  return Response.json({ ok: true, ...data });
}

export function safeRoute(handler) {
  return async (request, context) => {
    try {
      enforceMarketRateLimit(request);
      return await handler(request, context);
    } catch (error) {
      return marketErrorResponse(error);
    }
  };
}

export function readQuery(request, key, maxLength = 40) {
  const value = new URL(request.url).searchParams.get(key) || "";
  return value.trim().slice(0, maxLength);
}

export function readTickers(request) {
  const raw = readQuery(request, "tickers", 300);
  const tickers = [...new Set(raw.split(",").map(normalizeTicker).filter(Boolean))];
  if (!tickers.length) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid tickers", 400);
  if (tickers.length > appConfig.maxTickersPerRequest) throw new MarketError(MARKET_ERRORS.PROVIDER_ERROR, "Too many tickers", 413);
  return tickers;
}
