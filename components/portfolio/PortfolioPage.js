"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import PositionsTable from "@/components/portfolio/PositionsTable";
import QuoteModal from "@/components/quotes/QuoteModal";
import PortfolioDiagnosticsPanel from "@/components/diagnostics/PortfolioDiagnosticsPanel";
import PerformancePanel from "@/components/performance/PerformancePanel";
import useInvestmentData from "@/hooks/useInvestmentData";
import useMarketData from "@/hooks/useMarketData";
import usePortfolioDiagnostics from "@/hooks/usePortfolioDiagnostics";
import useDiagnosticPreferences from "@/hooks/useDiagnosticPreferences";
import usePerformanceAnalysis from "@/hooks/usePerformanceAnalysis";
import { ASSET_TYPES } from "@/lib/data/assetsMaster";
import { applyAutomaticQuotes, removeManualQuote, setManualQuote, useAutomaticQuote } from "@/lib/data/quotes";
import { currency } from "@/lib/engine/totals";

export default function PortfolioPage() {
  const data = useInvestmentData();
  const { positions, totals, operations, assetsMaster, assetQuotes, setAssetQuotes, portfolioHistory, loaded, storageError } = data;
  const preferences = useDiagnosticPreferences();
  const diagnostics = usePortfolioDiagnostics({ positions, operations, totals, assetMetadata: assetsMaster, parameters: preferences.configured ? preferences.preferences : undefined, loaded: loaded && preferences.loaded });
  const { performance, error: performanceError } = usePerformanceAnalysis({ history: portfolioHistory, operations, positions, loaded });
  const { refreshQuotes, loading: refreshing } = useMarketData({ quotes: assetQuotes });
  const [search, setSearch] = useState(""), [type, setType] = useState("Todos"), [editingQuote, setEditingQuote] = useState(null), [refreshSummary, setRefreshSummary] = useState(null);
  const filtered = positions.filter((position) => (type === "Todos" || position.type === type) && (position.ticker.toLowerCase().includes(search.toLowerCase()) || position.name.toLowerCase().includes(search.toLowerCase())));
  const saveQuote = (quote) => { setAssetQuotes((current) => setManualQuote(current, quote)); setEditingQuote(null); };
  const clearQuote = (ticker) => { setAssetQuotes((current) => removeManualQuote(current, ticker)); setEditingQuote(null); };
  const preferAutomatic = (ticker) => { setAssetQuotes((current) => useAutomaticQuote(current, ticker)); setEditingQuote(null); };
  async function updateQuotes() { const result = await refreshQuotes(positions.map((position) => position.ticker)); if (result.quotes?.length) setAssetQuotes((current) => applyAutomaticQuotes(current, result.quotes)); setRefreshSummary({ updated: result.fetched?.length || 0, cached: result.cached?.length || 0, notFound: result.notFound?.length || 0, error: result.error ? 1 : 0, at: new Date().toLocaleString("pt-BR") }); }

  return <div className="page-container">
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Patrimonio</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">Carteira</h1><p className="mt-3 max-w-2xl text-sm text-[#777d78]">Posicoes consolidadas automaticamente a partir do seu historico de operacoes.</p></div><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={updateQuotes} disabled={refreshing || !positions.length} className="rounded-xl border border-[#d9b86c]/25 bg-[#d9b86c]/5 px-4 py-3 text-xs font-bold text-[#d9b86c] disabled:opacity-40">{refreshing ? "Atualizando..." : "Atualizar cotacoes"}</button><Link href="/operacoes" className="gold-button flex items-center justify-center gap-2"><Plus size={16} />Registrar operacao</Link></div></header>
    <section className="mt-8 grid gap-3 sm:grid-cols-3">{[["Patrimonio", totals.current], ["Investido", totals.invested], ["Proventos", totals.dividends]].map(([label, value]) => <div key={label} className="card rounded-2xl p-5"><p className="eyebrow">{label}</p><p className="mt-3 text-2xl font-semibold">{currency.format(value)}</p></div>)}</section>
    {refreshSummary && <p className="mt-4 text-xs text-[#898e89]">Ultima atualizacao: {refreshSummary.at}. Atualizadas: {refreshSummary.updated}. Cache: {refreshSummary.cached}. Nao encontradas: {refreshSummary.notFound}. Erros: {refreshSummary.error}.</p>}
    <PerformancePanel performance={performance} error={performanceError} loaded={loaded} />
    <PortfolioDiagnosticsPanel result={diagnostics.diagnosticsResult} error={diagnostics.diagnosticsError} loaded={loaded && preferences.loaded} positionsCount={positions.length} strategyConfigured={preferences.configured} />
    <section className="card mt-6 overflow-hidden rounded-2xl"><div className="flex flex-col gap-3 border-b border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl">Posicoes atuais</h2><p className="mt-1 text-xs text-[#777d78]">{positions.length} {positions.length === 1 ? "ativo consolidado" : "ativos consolidados"}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Buscar ativo</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#626762]" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ativo..." className="field py-2.5 pl-9 text-xs sm:w-44" /></label><select aria-label="Filtrar tipo de ativo" value={type} onChange={(event) => setType(event.target.value)} className="field py-2.5 text-xs sm:w-40"><option>Todos</option>{ASSET_TYPES.map((item) => <option key={item}>{item}</option>)}</select></div></div>{loaded ? <PositionsTable positions={filtered} emptyMessage={positions.length ? "Nenhuma posicao encontrada" : "Sua carteira ainda esta vazia"} onEditQuote={setEditingQuote} /> : <div className="p-12 text-center text-sm text-[#777d78]">Calculando carteira...</div>}</section>
    <p className="mt-4 text-[10px] text-[#555b56]">Cotacoes automaticas dependem da configuracao do provedor. O preco medio e usado apenas como fallback visual.</p>{storageError && <p className="mt-2 text-xs text-rose-400">Nao foi possivel acessar os dados locais.</p>}{editingQuote && <QuoteModal position={editingQuote} quote={assetQuotes.find((item) => item.ticker === editingQuote.ticker)} onClose={() => setEditingQuote(null)} onSave={saveQuote} onClear={clearQuote} onUseAutomatic={preferAutomatic} />}
  </div>;
}
