"use client";

import { BarChart3, Building2, Database, ShieldCheck } from "lucide-react";
import MarketSearch from "@/components/market/MarketSearch";

const features = [
  { title: "Pesquisa publica", description: "Consulte ativos sem entrar em uma carteira.", icon: Building2 },
  { title: "Dados de mercado", description: "Cotacao, setor, bolsa e metadados quando disponiveis.", icon: BarChart3 },
  { title: "Fallback local", description: "A busca continua util mesmo sem provedor externo configurado.", icon: Database },
  { title: "Token protegido", description: "A chave da brapi.dev permanece somente no servidor.", icon: ShieldCheck },
];

export default function MarketPage() {
  return <section className="page-container space-y-12">
    <div className="fade-in mx-auto max-w-5xl pt-4 text-center sm:pt-10">
      <p className="eyebrow">Mercado</p>
      <h1 className="font-display mt-4 text-4xl leading-tight text-white sm:text-6xl">Pesquise ativos brasileiros em poucos segundos.</h1>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#898e89] sm:text-base">Use ticker, nome ou empresa para abrir uma pagina publica com cotacao, indicadores disponiveis, dividendos e dados cadastrais do ativo.</p>
      <div className="mx-auto mt-9 max-w-3xl">
        <MarketSearch />
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {features.map(({ title, description, icon: Icon }) => <article key={title} className="card fade-in rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#d9b86c]/20">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9b86c]/15 bg-[#d9b86c]/8 text-[#d9b86c]"><Icon size={18} /></span>
        <h2 className="mt-5 text-sm font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#777d78]">{description}</p>
      </article>)}
    </div>
  </section>;
}
