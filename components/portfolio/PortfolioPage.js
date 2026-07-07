"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import PositionsTable from "@/components/portfolio/PositionsTable";
import useInvestmentData from "@/hooks/useInvestmentData";
import { ASSET_TYPES } from "@/lib/data/assetsMaster";
import { currency } from "@/lib/engine/totals";
import { useState } from "react";
import QuoteModal from "@/components/quotes/QuoteModal";

export default function PortfolioPage() {
  const { positions, totals, assetQuotes, setAssetQuotes, loaded, storageError } = useInvestmentData();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [editingQuote, setEditingQuote] = useState(null);
  const filtered = positions.filter((position) => (type === "Todos" || position.type === type) && (position.ticker.toLowerCase().includes(search.toLowerCase()) || position.name.toLowerCase().includes(search.toLowerCase())));
  const saveQuote = (quote) => { setAssetQuotes((current) => [...current.filter((item) => item.ticker !== quote.ticker), quote]); setEditingQuote(null); };
  return <div className="page-container"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Patrimônio</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">Carteira</h1><p className="mt-3 max-w-2xl text-sm text-[#777d78]">Posições consolidadas automaticamente a partir do seu histórico de operações.</p></div><Link href="/operacoes" className="gold-button flex items-center justify-center gap-2"><Plus size={16} />Registrar operação</Link></header><section className="mt-8 grid gap-3 sm:grid-cols-3"><div className="card rounded-2xl p-5"><p className="eyebrow">Patrimônio</p><p className="mt-3 text-2xl font-semibold">{currency.format(totals.current)}</p></div><div className="card rounded-2xl p-5"><p className="eyebrow">Investido</p><p className="mt-3 text-2xl font-semibold">{currency.format(totals.invested)}</p></div><div className="card rounded-2xl p-5"><p className="eyebrow">Proventos</p><p className="mt-3 text-2xl font-semibold">{currency.format(totals.dividends)}</p></div></section><section className="card mt-6 overflow-hidden rounded-2xl"><div className="flex flex-col gap-3 border-b border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl">Posições atuais</h2><p className="mt-1 text-xs text-[#777d78]">{positions.length} {positions.length === 1 ? "ativo consolidado" : "ativos consolidados"}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Buscar ativo</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#626762]" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ativo..." className="field py-2.5 pl-9 text-xs sm:w-44" /></label><select aria-label="Filtrar tipo de ativo" value={type} onChange={(event) => setType(event.target.value)} className="field py-2.5 text-xs sm:w-40"><option>Todos</option>{ASSET_TYPES.map((item) => <option key={item}>{item}</option>)}</select></div></div>{loaded ? <PositionsTable positions={filtered} emptyMessage={positions.length ? "Nenhuma posição encontrada" : "Sua carteira ainda está vazia"} onEditQuote={setEditingQuote} /> : <div className="p-12 text-center text-sm text-[#777d78]">Calculando carteira...</div>}</section><p className="mt-4 text-[10px] text-[#555b56]">Sem cotação manual, o preço médio é usado apenas como fallback visual. Cotações automáticas serão adicionadas futuramente.</p>{storageError && <p className="mt-2 text-xs text-rose-400">Não foi possível acessar os dados locais.</p>}{editingQuote && <QuoteModal position={editingQuote} quote={assetQuotes.find((item) => item.ticker === editingQuote.ticker)} onClose={() => setEditingQuote(null)} onSave={saveQuote} />}</div>;
}
