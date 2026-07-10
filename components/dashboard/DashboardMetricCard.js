"use client";

export default function DashboardMetricCard({ title, value, secondary, updatedAt, icon: Icon, tone = "neutral" }) {
  const toneClass = tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-[#c9cbc7]";
  return <article className="group card flex min-h-44 flex-col rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25 hover:bg-white/[.025]">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#70766f]">{title}</p>
        <p className={`mt-5 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] ${toneClass}`}>{value}</p>
      </div>
      {Icon ? <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.018] text-[#d9b86c] transition duration-300 group-hover:border-[#d9b86c]/30 group-hover:bg-[#d9b86c]/10"><Icon size={18} /></span> : null}
    </div>
    <p className="mt-auto pt-5 text-xs leading-relaxed text-[#898e89]">{secondary || "Sem informação adicional"}</p>
    {updatedAt ? <p className="mt-3 border-t border-white/[.06] pt-3 text-[10px] uppercase tracking-[.14em] text-[#555b56]">Atualizado {updatedAt}</p> : null}
  </article>;
}
