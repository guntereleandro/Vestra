"use client";

import Link from "next/link";
import { Activity, Award, CircleDollarSign, ClipboardList, Layers3, TrendingDown, TrendingUp } from "lucide-react";
import { preparePortfolioSummary } from "@/lib/engine/portfolioAnalytics";
import { currency, percent } from "@/lib/engine/totals";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default function PortfolioSummary({ positions, operations }) {
  const summary = preparePortfolioSummary(positions, operations);
  const items = [];
  if (summary.largestPosition) items.push({ key: "largest", title: "Maior posição", value: summary.largestPosition.ticker, text: `${percent.format(summary.largestPositionPercent)}% da carteira.`, href: `/carteira/${summary.largestPosition.ticker}`, icon: Award });
  if (summary.largestProfit) items.push({ key: "profit", title: "Maior lucro", value: summary.largestProfit.ticker, text: currency.format(summary.largestProfit.profit), href: `/carteira/${summary.largestProfit.ticker}`, icon: TrendingUp, tone: "positive" });
  if (summary.largestLoss) items.push({ key: "loss", title: "Maior prejuizo", value: summary.largestLoss.ticker, text: currency.format(summary.largestLoss.profit), href: `/carteira/${summary.largestLoss.ticker}`, icon: TrendingDown, tone: "negative" });
  if (summary.topDividendAsset) items.push({ key: "dividends", title: "Mais proventos", value: summary.topDividendAsset.ticker, text: currency.format(summary.topDividendAsset.dividends), href: `/carteira/${summary.topDividendAsset.ticker}`, icon: CircleDollarSign });
  if (summary.latestOperation) items.push({ key: "latest", title: "Última operação", value: summary.latestOperation.ticker, text: `${summary.latestOperation.operationType.toLowerCase()} em ${dateFormatter.format(new Date(`${summary.latestOperation.date}T00:00:00Z`))}.`, href: `/carteira/${summary.latestOperation.ticker}`, icon: Activity });
  if (summary.positionsCount) items.push({ key: "count", title: "Ativos atuais", value: summary.positionsCount, text: summary.positionsCount === 1 ? "ativo com posição." : "ativos com posição.", icon: Layers3 });

  return <section className="card overflow-hidden rounded-2xl">
    <div className="border-b border-white/[.06] p-5 sm:p-6">
      <p className="eyebrow">Resumo</p>
      <h2 className="font-display mt-2 text-2xl">Leitura da carteira</h2>
      <p className="mt-2 text-sm text-[#777d78]">Fatos calculados a partir dos dados registrados.</p>
    </div>
    {!items.length ? <div className="px-5 py-14 text-center sm:px-6">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><ClipboardList size={21} /></span>
      <h3 className="font-display mt-4 text-xl">Sem dados para resumir</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">O painel aparece quando houver operações e posições calculadas.</p>
    </div> : <div className="grid gap-3 p-5 sm:grid-cols-2">
      {items.map((item) => <SummaryCard key={item.key} item={item} />)}
    </div>}
  </section>;
}

function SummaryCard({ item }) {
  const Icon = item.icon;
  const toneClass = item.tone === "positive" ? "text-emerald-300" : item.tone === "negative" ? "text-rose-300" : "text-white";
  const content = <div className="group h-full rounded-2xl border border-white/[.055] bg-white/[.018] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25 hover:bg-white/[.035]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#70766f]">{item.title}</p>
        <p className={`mt-4 truncate text-2xl font-semibold ${toneClass}`}>{item.value}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.015] text-[#d9b86c] transition group-hover:border-[#d9b86c]/30 group-hover:bg-[#d9b86c]/10"><Icon size={18} /></span>
    </div>
    <p className="mt-5 text-xs leading-relaxed text-[#a0a5a0]">{item.text}</p>
  </div>;
  return item.href ? <Link href={item.href} className="focus:outline focus:outline-2 focus:outline-[#d9b86c]/60">{content}</Link> : content;
}
