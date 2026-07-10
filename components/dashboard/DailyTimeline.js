"use client";

import { Award, BadgeDollarSign, CircleDollarSign, Landmark, PackageCheck, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { currency } from "@/lib/engine/totals";

const iconMap = {
  COMPRA: ShoppingCart,
  VENDA: TrendingDown,
  DIVIDENDO: CircleDollarSign,
  JCP: CircleDollarSign,
  RENDIMENTO: BadgeDollarSign,
  highestPortfolio: TrendingUp,
  largestContribution: Landmark,
  largestDividend: CircleDollarSign,
  largestProfit: Award,
  highestAssetCount: PackageCheck,
  FIRST_ASSET: PackageCheck,
  FIRST_CONTRIBUTION: Landmark,
  FIRST_DIVIDEND: CircleDollarSign,
  GOAL_MILESTONE: Award,
};

export default function DailyTimeline({ events }) {
  const groups = ["Hoje", "Ontem", "Esta semana", "Mais antigos"].map((label) => ({ label, events: events.filter((event) => event.groupLabel === label) })).filter((group) => group.events.length);
  return <section className="card overflow-hidden rounded-2xl">
    <div className="border-b border-white/[.06] p-6">
      <p className="eyebrow">Timeline</p>
      <h2 className="font-display mt-2 text-2xl">O que aconteceu na sua jornada</h2>
      <p className="mt-2 text-sm text-[#777d78]">Acontecimentos organizados do mais recente ao mais antigo.</p>
    </div>
    {!events.length ? <EmptyTimeline /> : <div className="space-y-7 p-5 sm:p-6">
      {groups.map((group) => <div key={group.label}>
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#70766f]">{group.label}</h3>
        <div className="relative space-y-4 before:absolute before:bottom-3 before:left-5 before:top-3 before:w-px before:bg-white/[.06]">
          {group.events.map((event) => <TimelineItem key={event.id} event={event} />)}
        </div>
      </div>)}
    </div>}
  </section>;
}

function TimelineItem({ event }) {
  const Icon = iconMap[event.type] || Award;
  return <article className="fade-in group relative flex gap-4 pl-0">
    <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d9b86c]/18 bg-[#111511] text-[#d9b86c] transition duration-300 group-hover:border-[#d9b86c]/35 group-hover:bg-[#d9b86c]/10"><Icon size={17} /></span>
    <div className="min-w-0 flex-1 rounded-2xl border border-white/[.055] bg-white/[.018] p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#d9b86c]/20 group-hover:bg-white/[.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-[#a0a5a0]">{event.description}</p>
        </div>
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[.14em] text-[#626762]">{event.relativeDate}</p>
      </div>
      {event.value > 0 ? <p className="mt-3 text-lg font-semibold text-[#f2f1eb]">{event.type === "VENDA" ? "" : event.type === "COMPRA" ? "" : event.record ? "" : "+"}{currency.format(event.value)}</p> : null}
    </div>
  </article>;
}

function EmptyTimeline() {
  return <div className="px-6 py-16 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><TrendingUp size={22} /></span>
    <h3 className="font-display mt-5 text-xl">Sua timeline começa no primeiro registro</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#777d78]">Cadastre uma compra, venda ou provento para acompanhar os momentos importantes da carteira.</p>
  </div>;
}
