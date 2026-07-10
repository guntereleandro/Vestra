"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { prepareHistoryChartData } from "@/lib/engine/portfolioAnalytics";
import { currency } from "@/lib/engine/totals";

const ranges = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "12m", label: "12 meses" },
  { value: "all", label: "Todo periodo" },
];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default function PortfolioHistoryChart({ history, featured = false }) {
  const [range, setRange] = useState("30d");
  const [active, setActive] = useState(null);
  const data = useMemo(() => prepareHistoryChartData(history, range), [history, range]);
  const values = data.map((item) => item.currentValue);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : 5 + (index / (data.length - 1)) * 90;
    const y = 88 - ((item.currentValue - min) / span) * 76;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const areaPath = points.length > 1 ? `${path} L ${points[points.length - 1].x} 92 L ${points[0].x} 92 Z` : "";
  const activePoint = active ?? points[points.length - 1];

  return <section className={`card overflow-hidden rounded-[1.5rem] transition duration-300 hover:border-[#d9b86c]/20 ${featured ? "shadow-[0_24px_80px_rgba(0,0,0,.32)]" : ""}`}>
    <div className="flex flex-col gap-5 border-b border-white/[.06] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
      <div>
        <p className="eyebrow">Evolução</p>
        <h2 className="font-display mt-2 text-2xl sm:text-3xl">Evolução patrimonial</h2>
        <p className="mt-2 text-sm text-[#777d78]">Snapshots diários do patrimônio atual.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex" role="tablist" aria-label="Periodo do grafico">
        {ranges.map((item) => <button key={item.value} type="button" onClick={() => setRange(item.value)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${range === item.value ? "border-[#d9b86c]/50 bg-[#d9b86c]/12 text-[#efd58f]" : "border-white/10 text-[#898e89] hover:text-white"}`}>{item.label}</button>)}
      </div>
    </div>
    {data.length === 0 ? <EmptyChart title="Primeiro acompanhamento" text="A evolução aparecerá quando uma operação ou cotação atualizar o patrimônio." /> : data.length === 1 ? <EmptyChart title="Histórico iniciado" text={`Patrimônio em ${dateFormatter.format(new Date(`${data[0].date}T00:00:00Z`))}: ${currency.format(data[0].currentValue)}.`} /> : <div className="p-5 sm:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[.16em] text-[#777d78]">Valor atual</p>
          <p className="mt-1 text-3xl font-semibold text-white sm:text-4xl">{activePoint ? currency.format(activePoint.currentValue) : currency.format(max)}</p>
        </div>
        {activePoint && <p className="text-xs text-[#a0a5a0]">{dateFormatter.format(new Date(`${activePoint.date}T00:00:00Z`))}</p>}
      </div>
      <div className="relative h-[21rem] w-full overflow-hidden rounded-2xl border border-white/[.06] bg-[#090b0a]/55 sm:h-[25rem]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Grafico de evolucao patrimonial">
          <defs><linearGradient id="historyArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d9b86c" stopOpacity=".28" /><stop offset="100%" stopColor="#d9b86c" stopOpacity="0" /></linearGradient></defs>
          {[16, 35, 54, 73, 92].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth=".25" />)}
          <path d={areaPath} fill="url(#historyArea)" />
          <path d={path} fill="none" stroke="#d9b86c" strokeWidth="1.45" vectorEffect="non-scaling-stroke" />
          {points.map((point) => <circle key={point.id} cx={point.x} cy={point.y} r="1.4" fill="#efd58f" vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div className="absolute inset-0 flex">
          {points.map((point) => <button key={point.id} type="button" aria-label={`${dateFormatter.format(new Date(`${point.date}T00:00:00Z`))}: ${currency.format(point.currentValue)}`} onFocus={() => setActive(point)} onMouseEnter={() => setActive(point)} className="h-full min-w-0 flex-1 focus:outline focus:outline-2 focus:outline-[#d9b86c]/60" />)}
        </div>
      </div>
    </div>}
  </section>;
}

function EmptyChart({ title, text }) {
  return <div className="grid min-h-[24rem] place-items-center px-6 py-16 text-center sm:min-h-[28rem]">
    <div>
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c] shadow-[0_18px_55px_rgba(0,0,0,.24)]"><BarChart3 size={26} /></span>
      <h3 className="font-display mt-6 text-2xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#777d78]">{text}</p>
      <Link href="/operacoes" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9b86c]/25 bg-[#d9b86c]/10 px-4 py-3 text-xs font-bold text-[#f0d99e] transition duration-300 hover:-translate-y-0.5 hover:border-[#d9b86c]/45 hover:bg-[#d9b86c]/15 focus:outline focus:outline-2 focus:outline-[#d9b86c]/60"><Plus size={15} />Registrar primeira evolução</Link>
    </div>
  </div>;
}
