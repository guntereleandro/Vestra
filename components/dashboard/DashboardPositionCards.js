"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import QuoteInfo from "@/components/quotes/QuoteInfo";
import { currency, percent, quantity } from "@/lib/engine/totals";

export default function DashboardPositionCards({ positions }) {
  if (!positions.length) return <div className="px-5 py-16 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><BriefcaseBusiness size={22} /></span>
    <h3 className="font-display mt-5 text-xl">Nenhum ativo em carteira</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">Registre uma compra para visualizar seus ativos no Dashboard.</p>
  </div>;

  return <div className="grid gap-4 p-5 xl:grid-cols-2">
    {positions.map((position) => {
      const gain = position.profit >= 0;
      return <Link key={position.ticker} href={`/carteira/${position.ticker}`} className="group rounded-2xl border border-white/[.06] bg-white/[.018] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25 hover:bg-white/[.035] focus:outline focus:outline-2 focus:outline-[#d9b86c]/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <AssetLogo ticker={position.ticker} name={position.name} logoPath={position.logoPath} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{position.ticker}</p>
              <p className="truncate text-xs text-[#777d78]">{position.name}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold text-white">{currency.format(position.currentValue)}</p>
            <p className={`mt-1 text-xs font-semibold ${gain ? "text-emerald-300" : "text-rose-300"}`}>{gain ? "+" : ""}{percent.format(position.profitability)}%</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
          <Info label="Valor atual" value={currency.format(position.currentValue)} strong />
          <Info label="Rentab." value={`${gain ? "+" : ""}${percent.format(position.profitability)}%`} tone={gain ? "positive" : "negative"} />
          <Info label="Preço médio" value={currency.format(position.averagePrice)} />
          <Info label="Cotação" value={currency.format(position.currentPrice)} />
          <Info label="Qtd." value={quantity.format(position.quantity)} />
        </div>
        <div className="mt-4 border-t border-white/[.06] pt-3">
          <QuoteInfo hasQuote={position.hasQuote} updatedAt={position.quoteUpdatedAt} origin={position.quoteOrigin} stale={position.quoteStale} manualOverride={position.manualOverride} />
        </div>
      </Link>;
    })}
  </div>;
}

function Info({ label, value, tone = "neutral", strong = false }) {
  const toneClass = tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-[#d7d9d5]";
  return <div className={`min-w-0 rounded-xl border border-white/[.05] bg-[#090b0a]/35 p-3 ${strong ? "col-span-2 sm:col-span-1" : ""}`}>
    <p className="text-[9px] uppercase tracking-[.14em] text-[#626762]">{label}</p>
    <p className={`mt-1 truncate ${strong ? "text-sm font-bold text-white" : `font-semibold ${toneClass}`}`}>{value}</p>
  </div>;
}
