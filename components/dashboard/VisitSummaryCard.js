"use client";

import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleDollarSign, ClipboardList, Minus, Trophy } from "lucide-react";

const iconMap = {
  portfolio: ArrowUpRight,
  dividends: CircleDollarSign,
  operations: ClipboardList,
  record: Trophy,
};

export default function VisitSummaryCard({ summary }) {
  return <section className="fade-in card overflow-hidden rounded-2xl">
    <div className="flex flex-col gap-3 border-b border-white/[.06] p-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Desde sua última visita</p>
        <h2 className="font-display mt-2 text-2xl">O que mudou</h2>
      </div>
      <p className="flex items-center gap-2 text-xs text-[#777d78]"><CalendarClock size={14} className="text-[#d9b86c]" />Último acesso: {summary.lastAccessText || "agora"}</p>
    </div>
    {summary.hasChanges ? <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
      {summary.items.map((item) => <ChangeItem key={item.key} item={item} />)}
    </div> : <div className="p-6">
      <div className="rounded-2xl border border-white/[.055] bg-white/[.018] p-5 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/10 text-[#d9b86c]"><Minus size={18} /></span>
        <h3 className="font-display mt-4 text-xl text-white">{summary.emptyTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#898e89]">{summary.emptyText}</p>
      </div>
    </div>}
  </section>;
}

function ChangeItem({ item }) {
  const Icon = item.key === "portfolio" && item.tone === "negative" ? ArrowDownRight : iconMap[item.key] || ArrowUpRight;
  const toneClass = item.tone === "positive" ? "text-emerald-300" : item.tone === "negative" ? "text-rose-300" : "text-white";
  return <article className="group rounded-2xl border border-white/[.055] bg-white/[.018] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/20 hover:bg-white/[.03]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#70766f]">{item.title}</p>
        <p className={`mt-4 text-2xl font-semibold ${toneClass}`}>{item.value}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.08] text-[#d9b86c] transition group-hover:border-[#d9b86c]/30 group-hover:bg-[#d9b86c]/10"><Icon size={18} /></span>
    </div>
  </article>;
}
