import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { jsonOk, readQuery, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (request) => {
  const query = readQuery(request, "q", 40);
  if (!query) return jsonOk({ assets: [] });
  if (query.length < 2) return jsonOk({ assets: [] });
  const assets = await brapiProvider.searchAssets(query);
  return jsonOk({ assets });
});
