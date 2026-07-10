"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PieChart } from "lucide-react";
import { prepareAllocationData } from "@/lib/engine/portfolioAnalytics";
import { currency, percent } from "@/lib/engine/totals";

const colors = ["#d9b86c", "#7dd3fc", "#86efac", "#fda4af", "#c4b5fd", "#fcd34d", "#a7f3d0", "#f0abfc"];

export default function AllocationChart({ positions }) {
  const [mode, setMode] = useState("type");
  const data = useMemo(() => prepareAllocationData(positions, mode), [positions, mode]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const segments = data.map((item, index) => {
    const dash = total ? (item.value / total) * 100 : 0;
    const segment = { ...item, color: colors[index % colors.length], dash, offset };
    offset += dash;
    return segment;
  });

  return <section className="card overflow-hidden rounded-2xl transition duration-300 hover:border-[#d9b86c]/20">
    <div className="flex flex-col gap-4 border-b border-white/[.06] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div>
        <p className="eyebrow">Alocação</p>
        <h2 className="font-display mt-2 text-2xl">Alocação atual</h2>
        <p className="mt-2 text-sm text-[#777d78]">Valor atual das posições em carteira.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-1">
        {[["type", "Por tipo"], ["asset", "Por ativo"]].map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${mode === value ? "bg-[#d9b86c] text-[#090b0a]" : "text-[#898e89] hover:text-white"}`}>{label}</button>)}
      </div>
    </div>
    {!segments.length ? <div className="px-5 py-14 text-center sm:px-6"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><PieChart size={21} /></span><h3 className="font-display mt-4 text-xl">Carteira vazia</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">Registre uma compra para visualizar a alocação.</p></div> : <div className="grid gap-8 p-6 md:grid-cols-[17rem_1fr] md:items-center">
      <div className="mx-auto grid h-64 w-64 place-items-center rounded-full transition duration-500 hover:scale-[1.02]" style={{ background: `conic-gradient(${segments.map((item) => `${item.color} ${item.offset}% ${item.offset + item.dash}%`).join(", ")})` }}>
        <div className="grid h-40 w-40 place-items-center rounded-full border border-white/[.08] bg-[#101311] text-center shadow-[inset_0_0_40px_rgba(0,0,0,.36)]">
          <div className="px-4"><p className="text-[10px] uppercase tracking-[.14em] text-[#777d78]">Patrimônio</p><p className="mt-2 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">{currency.format(total)}</p></div>
        </div>
      </div>
      <div className="space-y-2.5">
        {segments.map((item) => {
          const content = <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.055] bg-white/[.018] p-3.5 transition duration-300 hover:border-[#d9b86c]/20 hover:bg-white/[.035]">
            <div className="flex min-w-0 items-center gap-3"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.name}</p>{item.label && <p className="truncate text-[10px] text-[#777d78]">{item.label}</p>}</div></div>
            <div className="text-right"><p className="text-xs font-semibold text-white">{currency.format(item.value)}</p><p className="text-[10px] text-[#a0a5a0]">{percent.format(item.percent)}%</p></div>
          </div>;
          return mode === "asset" && item.ticker && item.ticker !== "OUTROS" ? <Link key={item.name} href={`/carteira/${item.ticker}`} className="block focus:outline focus:outline-2 focus:outline-[#d9b86c]/60">{content}</Link> : <div key={item.name}>{content}</div>;
        })}
      </div>
    </div>}
  </section>;
}
