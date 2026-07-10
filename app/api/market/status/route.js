import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { jsonOk, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async () => {
  const status = await brapiProvider.getProviderStatus();
  return jsonOk({ status });
});
