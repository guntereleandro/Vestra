import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { appConfig } from "@/lib/config/appConfig";
import { normalizeTicker } from "@/lib/data/assetsMaster";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";
import { jsonOk, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (request, { params }) => {
  const ticker = normalizeTicker((await params).ticker);
  if (!ticker) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid ticker", 400);
  const requestedRange = new URL(request.url).searchParams.get("range") || "3mo";
  const range = appConfig.marketHistoryRanges.includes(requestedRange) ? requestedRange : "3mo";
  const history = await brapiProvider.getHistoricalPrices(ticker, { range, interval: "1d" });
  return jsonOk({ history, supportedRanges: appConfig.marketHistoryRanges });
});
