import MarketAssetPage from "@/components/market/MarketAssetPage";
import { brandConfig } from "@/lib/config/brandConfig";

export async function generateMetadata({ params }) {
  const { ticker } = await params;
  const symbol = String(ticker || "").toUpperCase();
  const title = `${symbol} no Mercado`;
  const description = `Cotacao e dados publicos de ${symbol} no ${brandConfig.appName}.`;
  return { title, description, alternates: { canonical: `/mercado/${encodeURIComponent(symbol)}` }, openGraph: { title: `${title} | ${brandConfig.appName}`, description, url: `/mercado/${encodeURIComponent(symbol)}`, type: "website" }, twitter: { card: "summary", title, description } };
}

export default async function Page({ params }) {
  const { ticker } = await params;
  return <MarketAssetPage ticker={ticker} />;
}
