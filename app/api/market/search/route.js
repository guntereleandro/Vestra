import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";
import { jsonOk, readQuery, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (request) => {
  const query = readQuery(request, "q", 40);
  if (!query) return jsonOk({ assets: [] });
  if (query.length < 2) return jsonOk({ assets: [] });
  const assets = await brapiProvider.searchAssets(query);
  if (!assets.length) throw new MarketError(MARKET_ERRORS.ASSET_NOT_FOUND, "Asset not found", 404);
  return jsonOk({ assets });
});
