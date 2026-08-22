import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { jsonOk, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (request) => {
  const verify = new URL(request.url).searchParams.get("verify") === "1";
  const status = await brapiProvider.getProviderStatus({ verify });
  return jsonOk({ status });
});
