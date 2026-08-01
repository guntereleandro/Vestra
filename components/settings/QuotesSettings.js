"use client";

import { useState } from "react";
import { Edit3, RefreshCw } from "lucide-react";
import QuoteModal from "@/components/quotes/QuoteModal";
import DataSourceBadge from "@/components/data/DataSourceBadge";
import DataManagement from "@/components/settings/DataManagement";
import MarketDataCenter from "@/components/settings/MarketDataCenter";
import useInvestmentData from "@/hooks/useInvestmentData";
import { currency } from "@/lib/engine/totals";
import { removeManualQuote, setManualQuote, useAutomaticQuote } from "@/lib/data/quotes";
import DiagnosticPreferencesForm from "@/components/diagnostics/preferences/DiagnosticPreferencesForm";
import RiskProfileForm from "@/components/diagnostics/risk/RiskProfileForm";

export default function QuotesSettings() {
  const { positions, assetsMaster, setAssetsMaster, assetQuotes, setAssetQuotes, loaded, storageError, dataSource, sourceError, useLocalSource } = useInvestmentData();
  const [editing, setEditing] = useState(null);
  const save = (quote) => {
    const { sector, notes, ...dynamicQuote } = quote;
    setAssetQuotes((current) => setManualQuote(current, dynamicQuote));
    setAssetsMaster((current) => current.map((asset) => asset.ticker === quote.ticker ? { ...asset, sector, notes, shortName: quote.shortName || asset.shortName, subtype: quote.subtype || asset.subtype, exchange: quote.exchange || asset.exchange, currency: quote.currency || asset.currency, logoPath: quote.logoPath || asset.logoPath } : asset));
    setEditing(null);
  };
  const clearQuote = (ticker) => { setAssetQuotes((current) => removeManualQuote(current, ticker)); setEditing(null); };
  const preferAutomatic = (ticker) => { setAssetQuotes((current) => useAutomaticQuote(current, ticker)); setEditing(null); };

  return <div className="page-container"><DataSourceBadge dataSource={dataSource} sourceError={sourceError} onUseLocal={useLocalSource} />
    <header><p className="eyebrow">Preferencias</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">Configuracoes</h1><p className="mt-3 max-w-2xl text-sm text-[#777d78]">Gerencie cotacoes, backups e os dados locais da aplicacao.</p></header>
    <section className="card mt-8 overflow-hidden rounded-2xl">
      <div className="border-b border-white/[.06] p-5 sm:p-6"><h2 className="font-display text-xl">Dados e cotacoes</h2><p className="mt-1 text-xs text-[#777d78]">Atualizacao manual, sem conexao com APIs externas.</p></div>
      {!loaded ? <div className="p-12 text-center text-sm text-[#777d78]">Carregando ativos...</div> : positions.length === 0 ? <div className="px-5 py-12 text-center"><RefreshCw size={21} className="mx-auto text-[#d9b86c]" /><h3 className="font-display mt-4 text-xl">Nenhum ativo para atualizar</h3></div> : <div className="divide-y divide-white/[.05]">{positions.map((position) => { const quote = assetQuotes.find((item) => item.ticker === position.ticker), master = assetsMaster.find((item) => item.ticker === position.ticker); return <div key={position.ticker} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{position.ticker}</p><p className="mt-1 text-xs text-[#777d78]">{position.name}{master?.sector ? ` · ${master.sector}` : ""}</p></div><div className="flex items-center justify-between gap-5"><div className="text-right"><p className="text-sm font-semibold">{quote ? currency.format(quote.currentQuote) : "Nao informada"}</p><p className="mt-1 text-[9px] text-[#626762]">{quote ? `${quote.updatedAt.split("-").reverse().join("/")} · ${quote.origin || "manual"}` : "Usando preco medio"}</p></div><button onClick={() => setEditing(position)} aria-label={`Atualizar cotacao ${position.ticker}`} className="icon-button"><Edit3 size={15} /></button></div></div>; })}</div>}
    </section>
    <DiagnosticPreferencesForm />
    <RiskProfileForm />
    <MarketDataCenter positions={positions} setAssetQuotes={setAssetQuotes} />
    <DataManagement />
    {storageError && <p className="mt-4 text-xs text-rose-400">Nao foi possivel salvar os dados neste navegador.</p>}
    {editing && <QuoteModal detailed assetsMaster={assetsMaster} position={editing} masterAsset={assetsMaster.find((item) => item.ticker === editing.ticker)} quote={assetQuotes.find((item) => item.ticker === editing.ticker)} onClose={() => setEditing(null)} onSave={save} onClear={clearQuote} onUseAutomatic={preferAutomatic} />}
  </div>;
}
