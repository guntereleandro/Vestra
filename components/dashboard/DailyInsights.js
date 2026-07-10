"use client";

import { Lightbulb } from "lucide-react";

export default function DailyInsights({ insights }) {
  return <section className="card overflow-hidden rounded-2xl">
    <div className="border-b border-white/[.06] p-6">
      <p className="eyebrow">Insights</p>
      <h2 className="font-display mt-2 text-2xl">Leituras rápidas</h2>
      <p className="mt-2 text-sm text-[#777d78]">Regras simples, sem recomendações de compra ou venda.</p>
    </div>
    {!insights.length ? <div className="px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Lightbulb size={20} /></span>
      <h3 className="font-display mt-4 text-xl">Insights aparecem com histórico</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#777d78]">Registre operações e acompanhe snapshots para ver leituras curtas sobre a carteira.</p>
    </div> : <div className="grid gap-3 p-5 sm:grid-cols-2">
      {insights.map((insight) => <article key={`${insight.title}-${insight.value}`} className="rounded-2xl border border-white/[.055] bg-white/[.018] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/20 hover:bg-white/[.03]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#70766f]">{insight.title}</p>
            <p className="mt-4 text-2xl font-semibold text-white">{insight.value}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.08] text-[#d9b86c]"><Lightbulb size={17} /></span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#a0a5a0]">{insight.text}</p>
      </article>)}
    </div>}
  </section>;
}
