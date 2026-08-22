import "server-only";
import { appConfig } from "@/lib/config/appConfig";
import { MARKET_ERRORS, MarketError } from "@/lib/market/marketErrors";

const buckets = globalThis.__vestraMarketRateLimit || new Map();
globalThis.__vestraMarketRateLimit = buckets;

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function enforceMarketRateLimit(request) {
  const now = Date.now();
  const windowMs = 60_000;
  const key = clientKey(request);
  const current = buckets.get(key);
  const bucket = !current || now >= current.resetAt ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (buckets.size > 1000) {
    for (const [entryKey, entry] of buckets) if (now >= entry.resetAt) buckets.delete(entryKey);
  }
  if (bucket.count > appConfig.marketRateLimitPerMinute) throw new MarketError(MARKET_ERRORS.RATE_LIMITED, "Internal rate limit", 429);
  return { limit: appConfig.marketRateLimitPerMinute, remaining: Math.max(0, appConfig.marketRateLimitPerMinute - bucket.count), resetAt: bucket.resetAt };
}
