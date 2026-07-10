"use client";

import { CalendarDays, CircleDollarSign, ClipboardList, Layers3, WalletCards } from "lucide-react";
import { currency } from "@/lib/engine/totals";

export default function JourneyStats({ stats }) {
  const items = [
    { label: "Você possui", value: stats.assets, detail: stats.assets === 1 ? "ativo" : "ativos", icon: Layers3 },
    { label: "Você realizou", value: stats.operations, detail: stats.operations === 1 ? "operação" : "operações", icon: ClipboardList },
    { label: "Você investiu", value: currency.format(stats.invested), detail: "em posições atuais", icon: WalletCards },
    { label: "Você recebeu", value: currency.format(stats.dividends), detail: "em proventos", icon: CircleDollarSign },
    { label: "Você acompanha há", value: stats.trackedDays || "0", detail: stats.trackedDays === 1 ? "dia" : "dias", icon: CalendarDays },
  ];
  return <section className="card overflow-hidden rounded-2xl">
    <div className="border-b border-white/[.06] p-6">
      <p className="eyebrow">Sua jornada</p>
      <h2 className="font-display mt-2 text-2xl">Resumo do caminho até aqui</h2>
    </div>
    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return <article key={item.label} className="rounded-2xl border border-white/[.055] bg-white/[.018] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/20 hover:bg-white/[.03]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#70766f]">{item.label}</p>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.08] text-[#d9b86c]"><Icon size={16} /></span>
          </div>
          <p className="mt-4 break-words text-2xl font-semibold text-white [overflow-wrap:anywhere]">{item.value}</p>
          <p className="mt-2 text-xs text-[#898e89]">{item.detail}</p>
        </article>;
      })}
    </div>
  </section>;
}
