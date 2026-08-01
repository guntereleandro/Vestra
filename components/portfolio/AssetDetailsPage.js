"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ClipboardList, Coins, FileQuestion } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import DataSourceBadge from "@/components/data/DataSourceBadge";
import QuoteInfo from "@/components/quotes/QuoteInfo";
import useInvestmentData from "@/hooks/useInvestmentData";
import { isIncomeOperation } from "@/lib/data/operations";
import { currency, percent, quantity } from "@/lib/engine/totals";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default function AssetDetailsPage({ ticker }) {
  const normalizedTicker = String(ticker || "").toUpperCase();
  const { operations, positions, assetsMaster, assetQuotes, loaded, dataSource, sourceError, useLocalSource } = useInvestmentData();
  const position = positions.find((item) => item.ticker === normalizedTicker);
  const asset = assetsMaster.find((item) => item.ticker === normalizedTicker);
  const quote = assetQuotes.find((item) => item.ticker === normalizedTicker);
  const assetOperations = operations.filter((operation) => operation.ticker === normalizedTicker).sort((a, b) => b.date.localeCompare(a.date));
  const incomeOperations = assetOperations.filter((operation) => isIncomeOperation(operation.operationType));
  const known = position || assetOperations.length || asset;

  if (!loaded) return <div className="page-container"><p className="text-sm text-[#777d78]">Carregando ativo...</p></div>;

  if (!known) return <div className="page-container">
    <Link href="/carteira" className="inline-flex items-center gap-2 text-xs font-bold text-[#d9b86c]"><ArrowLeft size={15} />Voltar para Carteira</Link>
    <section className="card mt-8 px-5 py-16 text-center sm:px-6">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><FileQuestion size={24} /></span>
      <h1 className="font-display mt-5 text-3xl">Ativo nao encontrado</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">Nao ha operacoes, cotacoes ou cadastro local para {normalizedTicker}.</p>
    </section>
  </div>;

  const base = position || { ticker: normalizedTicker, name: asset?.name || normalizedTicker, shortName: asset?.shortName || normalizedTicker, type: asset?.type || "", sector: asset?.sector || "", segment: asset?.segment || "", quantity: 0, averagePrice: 0, invested: 0, currentPrice: quote?.currentQuote || 0, currentValue: 0, profit: 0, profitability: 0, dividends: 0, quoteUpdatedAt: quote?.updatedAt || "", quoteOrigin: quote?.origin || "", logoPath: asset?.logoPath || "", exchange: asset?.exchange || "", source: asset?.source || "local" };
  const gain = base.profit >= 0;

  return <div className="page-container"><DataSourceBadge dataSource={dataSource} sourceError={sourceError} onUseLocal={useLocalSource} />
    <Link href="/carteira" className="inline-flex items-center gap-2 text-xs font-bold text-[#d9b86c]"><ArrowLeft size={15} />Voltar para Carteira</Link>
    <header className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="flex items-center gap-4">
        <AssetLogo ticker={base.ticker} name={base.name} logoPath={base.logoPath || asset?.logoPath} size="lg" />
        <div><p className="eyebrow">Detalhes do ativo</p><h1 className="font-display mt-2 text-4xl">{base.ticker}</h1><p className="mt-2 text-sm text-[#777d78]">{base.name} {base.type ? `· ${base.type}` : ""}{base.exchange ? ` · ${base.exchange}` : ""}</p></div>
      </div>
      {dataSource.canWrite && !sourceError && <Link href="/operacoes" className="gold-button text-center">Registrar operacao</Link>}
    </header>

    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DetailMetric label="Quantidade atual" value={quantity.format(base.quantity)} />
      <DetailMetric label="Preco medio" value={currency.format(base.averagePrice)} />
      <DetailMetric label="Valor atual" value={currency.format(base.currentValue)} />
      <DetailMetric label="Resultado" value={`${gain ? "+" : ""}${currency.format(base.profit)}`} detail={`${gain ? "+" : ""}${percent.format(base.profitability)}%`} tone={gain ? "positive" : "negative"} />
      <DetailMetric label="Valor investido" value={currency.format(base.invested)} />
      <DetailMetric label="Cotacao atual" value={currency.format(base.currentPrice)} detail={<QuoteInfo hasQuote={Boolean(quote)} updatedAt={quote?.updatedAt} origin={quote?.origin || base.quoteOrigin} stale={quote?.stale} manualOverride={quote?.manualOverride} />} />
      <DetailMetric label="Proventos recebidos" value={currency.format(base.dividends)} />
      <DetailMetric label="Operacoes" value={String(assetOperations.length)} />
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.75fr]">
      <section className="card overflow-hidden rounded-2xl">
        <SectionHeader icon={BriefcaseBusiness} title="Resumo da posicao" subtitle="Dados consolidados a partir das operacoes." />
        <div className="grid gap-3 p-5 text-sm text-[#c5c8c4] sm:grid-cols-2 sm:p-6">
          <Info label="Ticker" value={base.ticker} />
          <Info label="Nome" value={base.name} />
          <Info label="Nome curto" value={asset?.shortName || base.shortName || "Nao informado"} />
          <Info label="Tipo" value={base.type || "Nao informado"} />
          <Info label="Subtipo" value={asset?.subtype || base.subtype || "Nao informado"} />
          <Info label="Setor" value={asset?.sector || base.sector || "Nao informado"} />
          <Info label="Segmento" value={asset?.segment || base.segment || "Nao informado"} />
          <Info label="Moeda" value={asset?.currency || base.currency || "BRL"} />
          <Info label="Pais" value={asset?.country || base.country || "Brasil"} />
          <Info label="Bolsa" value={asset?.exchange || base.exchange || "Nao informada"} />
          <Info label="ISIN" value={asset?.isin || base.isin || "Nao informado"} />
          <Info label="CNPJ" value={asset?.cnpj || base.cnpj || "Nao informado"} />
          <Info label="Origem cadastral" value={asset?.source || base.source || "local"} />
          <Info label="Ultima cotacao" value={quote?.updatedAt ? dateFormatter.format(new Date(`${quote.updatedAt}T00:00:00Z`)) : "Nao informada"} />
        </div>
      </section>

      <section className="card overflow-hidden rounded-2xl">
        <SectionHeader icon={Coins} title="Historico de proventos" subtitle="Dividendos, JCP e rendimentos registrados." />
        {!incomeOperations.length ? <Empty text="Nenhum provento registrado para este ativo." /> : <div className="divide-y divide-white/[.05]">{incomeOperations.map((operation) => <div key={operation.id} className="flex items-center justify-between gap-4 p-4 text-sm"><div><p className="font-bold text-white">{operation.operationType}</p><p className="text-xs text-[#777d78]">{dateFormatter.format(new Date(`${operation.date}T00:00:00Z`))}</p></div><p className="font-semibold text-[#d9b86c]">{currency.format(operation.totalValue)}</p></div>)}</div>}
      </section>
    </div>

    <section className="card mt-6 overflow-hidden rounded-2xl">
      <SectionHeader icon={ClipboardList} title="Historico de operacoes" subtitle="Da mais recente para a mais antiga." />
      {!assetOperations.length ? <Empty text="Nenhuma operacao registrada para este ativo." /> : <div className="p-3 sm:overflow-x-auto sm:p-0">
        <table className="asset-table w-full border-collapse text-left">
          <thead><tr className="text-[9px] uppercase tracking-[.14em] text-[#626762]">{["Data", "Tipo", "Quantidade", "Preco unitario", "Taxas", "Valor total", "Observacoes"].map((head) => <th key={head} className="border-b border-white/[.06] px-5 py-4">{head}</th>)}</tr></thead>
          <tbody>{assetOperations.map((operation) => <tr key={operation.id} className="hover:bg-white/[.018]"><td data-label="Data" className="asset-cell">{dateFormatter.format(new Date(`${operation.date}T00:00:00Z`))}</td><td data-label="Tipo" className="asset-cell">{operation.operationType}</td><td data-label="Quantidade" className="asset-cell">{isIncomeOperation(operation.operationType) ? "-" : quantity.format(operation.quantity)}</td><td data-label="Preco unitario" className="asset-cell">{isIncomeOperation(operation.operationType) ? "-" : currency.format(operation.unitPrice)}</td><td data-label="Taxas" className="asset-cell">{currency.format(operation.fees)}</td><td data-label="Valor total" className="asset-cell font-bold text-white">{currency.format(operation.totalValue)}</td><td data-label="Observacoes" className="asset-cell">{operation.notes || "-"}</td></tr>)}</tbody>
        </table>
      </div>}
    </section>
  </div>;
}

function DetailMetric({ label, value, detail, tone = "neutral" }) {
  return <article className="card rounded-2xl p-5"><p className="eyebrow">{label}</p><p className={`mt-3 break-words text-2xl font-semibold [overflow-wrap:anywhere] ${tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-white"}`}>{value}</p>{detail && <div className="mt-2 text-xs text-[#898e89]">{detail}</div>}</article>;
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return <div className="flex items-center gap-3 border-b border-white/[.06] p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Icon size={18} /></span><div><h2 className="font-display text-xl">{title}</h2><p className="mt-1 text-xs text-[#777d78]">{subtitle}</p></div></div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><p className="text-[10px] uppercase tracking-[.14em] text-[#777d78]">{label}</p><p className="mt-1 break-words font-semibold text-white">{value}</p></div>;
}

function Empty({ text }) {
  return <p className="p-6 text-sm text-[#777d78]">{text}</p>;
}
