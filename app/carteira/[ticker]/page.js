import AssetDetailsPage from "@/components/portfolio/AssetDetailsPage";

export const metadata = { title: "Detalhes do ativo" };

export default async function Page({ params }) {
  const { ticker } = await params;
  return <AssetDetailsPage ticker={ticker} />;
}
