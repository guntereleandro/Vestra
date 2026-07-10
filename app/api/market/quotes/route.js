import { brapiProvider } from "@/lib/market/providers/brapiProvider";
import { jsonOk, readTickers, safeRoute } from "@/app/api/market/_utils";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (request) => {
  const tickers = readTickers(request);
  const quotes = await brapiProvider.getQuotes(tickers);
  const found = new Set(quotes.map((quote) => quote.ticker));
  return jsonOk({ quotes, notFound: tickers.filter((ticker) => !found.has(ticker)) });
});
