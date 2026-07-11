import MarketAssetPage from "@/components/market/MarketAssetPage";

export const metadata = { title: "Ativo no Mercado" };

export default async function Page({ params }) {
  const { ticker } = await params;
  return <MarketAssetPage ticker={ticker} />;
}
