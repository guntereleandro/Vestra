"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import { appConfig } from "@/lib/config/appConfig";
import useMarketData from "@/hooks/useMarketData";
import { applyAutomaticQuotes } from "@/lib/data/quotes";

export default function MarketDataCenter({ positions = [], setAssetQuotes }) {
  const { providerStatus, cacheStats, clearCache, refreshQuotes, loading } = useMarketData();
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({ total: 0, valid: 0, expired: 0 });
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    providerStatus().then((next) => { if (!cancelled) setStatus(next); });
    setStats(cacheStats());
    return () => { cancelled = true; };
  }, [providerStatus, cacheStats]);

  function cleanCache() {
    clearCache();
    setStats(cacheStats());
    setMessage("Cache de mercado limpo.");
  }

  async function updateQuotes() {
    const result = await refreshQuotes(positions.map((position) => position.ticker));
    if (result.quotes?.length && setAssetQuotes) setAssetQuotes((current) => applyAutomaticQuotes(current, result.quotes));
    setStats(cacheStats());
    setSummary({ updated: result.fetched?.length || 0, cached: result.cached?.length || 0, notFound: result.notFound?.length || 0, error: result.error ? 1 : 0, at: new Date().toLocaleString("pt-BR") });
  }

  const notConfigured = status?.configured === false;

  return <section className="card mt-6 overflow-hidden rounded-2xl">
    <div className="flex items-start gap-3 border-b border-white/[.06] p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Database size={18} /></span><div><h2 className="font-display text-xl">Dados de mercado</h2><p className="mt-1 text-xs text-[#777d78]">Cotacoes automaticas via provedor externo, com fallback local e manual.</p></div></div>
    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
      <MarketCard label="Provedor atual" value={status?.name || "brapi.dev"} detail={`id: ${appConfig.marketProvider}`} />
      <MarketCard label="Status" value={status?.online ? "Disponivel" : notConfigured ? "Nao configurado" : "Indisponivel"} detail={status?.message || "Fallback local ativo."} />
      <MarketCard label="Cotacoes automaticas" value={appConfig.enableAutomaticQuotes ? "Ativadas" : "Desativadas"} detail="Usa rotas internas do servidor." />
      <MarketCard label="Cache de mercado" value={`${stats.total} entradas`} detail={`${stats.valid} validas · ${stats.expired} expiradas`} />
    </div>
    {notConfigured && <p className="mx-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-300 sm:mx-6">O provedor de mercado ainda nao esta configurado. Defina BRAPI_TOKEN no servidor para habilitar cotacoes automaticas.</p>}
    <div className="flex flex-col gap-3 border-t border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><p className="text-xs leading-relaxed text-[#777d78]">A chave da brapi fica somente no servidor. A carteira continua funcionando com cotacoes manuais e dados locais se a API estiver indisponivel.</p><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={updateQuotes} disabled={loading || !positions.length || notConfigured} className="flex items-center justify-center gap-2 rounded-xl border border-[#d9b86c]/25 bg-[#d9b86c]/5 px-4 py-3 text-xs font-bold text-[#d9b86c] disabled:opacity-40"><RefreshCw size={15} />{loading ? "Atualizando..." : "Atualizar cotacoes"}</button><button type="button" onClick={cleanCache} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-[#c5c8c4]"><Trash2 size={15} />Limpar cache</button></div></div>
    {summary && <p role="status" className="px-5 pb-3 text-xs text-[#898e89] sm:px-6">Ultima atualizacao: {summary.at}. Atualizadas: {summary.updated}. Cache: {summary.cached}. Nao encontradas: {summary.notFound}. Erros: {summary.error}.</p>}
    {message && <p role="status" className="px-5 pb-5 text-xs text-emerald-400 sm:px-6">{message}</p>}
  </section>;
}

function MarketCard({ label, value, detail }) {
  return <article className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-center gap-2 text-[#d9b86c]"><RefreshCw size={14} /><p className="text-[10px] font-bold uppercase tracking-[.14em]">{label}</p></div><p className="mt-3 text-lg font-semibold text-white">{value}</p><p className="mt-1 text-[11px] leading-relaxed text-[#777d78]">{detail}</p></article>;
}
