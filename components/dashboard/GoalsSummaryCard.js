"use client";

import Link from "next/link";
import { Goal } from "lucide-react";
import { percent } from "@/lib/engine/totals";

export default function GoalsSummaryCard({ summary }) {
  return <section className="card rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">Objetivos</p>
        <h2 className="font-display mt-2 text-2xl">Metas patrimoniais</h2>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.08] text-[#d9b86c]"><Goal size={18} /></span>
    </div>
    <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
      <p className="text-3xl font-semibold text-white">{summary.activeCount}</p>
      <p className="pb-1 text-xs text-[#898e89]">ativos</p>
      <p className="text-3xl font-semibold text-[#f0d99e]">{percent.format(summary.averageProgress)}%</p>
      <p className="pb-1 text-xs text-[#898e89]">em média</p>
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-white/[.06] pt-4">
      <p className="text-xs text-[#777d78]">{summary.closest ? `${summary.closest.title} é o mais próximo.` : "Crie objetivos para acompanhar o progresso."}</p>
      <Link href="/objetivos" className="shrink-0 text-xs font-bold text-[#d9b86c] transition hover:text-[#f0d99e]">Ver todos →</Link>
    </div>
  </section>;
}
