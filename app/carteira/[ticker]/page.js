import AssetDetailsPage from "@/components/portfolio/AssetDetailsPage";

export const metadata = { title: "Detalhes do ativo" };

export default function Page({ params }) {
  return <AssetDetailsPage ticker={params.ticker} />;
}
