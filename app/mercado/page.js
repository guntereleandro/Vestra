import MarketPage from "@/components/market/MarketPage";
import { brandConfig } from "@/lib/config/brandConfig";

export const metadata = {
  title: "Mercado",
  description: `Pesquise ativos, cotacoes e indicadores no Mercado do ${brandConfig.appName}.`,
  alternates: { canonical: "/mercado" },
  openGraph: { title: `Mercado | ${brandConfig.appName}`, description: "Pesquisa publica de ativos, cotacoes e indicadores.", url: "/mercado", type: "website" },
  twitter: { card: "summary", title: `Mercado | ${brandConfig.appName}`, description: "Pesquisa publica de ativos, cotacoes e indicadores." },
};

export default function Page() {
  return <MarketPage />;
}
