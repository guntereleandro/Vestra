import { normalizeTicker } from "@/lib/data/assetsMaster";
import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";
import { jsonOk, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (_request, { params }) => {
  const ticker = normalizeTicker(params?.ticker);
  if (!ticker) throw new MarketError(MARKET_ERRORS.INVALID_TICKER, "Invalid ticker", 400);
  const asset = await brapiProvider.getAsset(ticker);
  return jsonOk({ asset });
});
