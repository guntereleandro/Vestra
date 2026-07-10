"use client";

import { CalendarDays, Edit3, Trash2 } from "lucide-react";
import GoalIcon from "@/components/goals/GoalIcon";
import { currency, percent } from "@/lib/engine/totals";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default function GoalCard({ goal, onEdit, onDelete }) {
  return <article className="fade-in group card overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.018]"><GoalIcon icon={goal.typeMeta.icon} color={goal.typeMeta.color} /></span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{goal.title}</p>
          <p className="mt-1 text-xs text-[#898e89]">{goal.typeMeta.name}{goal.automatic ? " · automático" : " · manual"}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => onEdit(goal)} aria-label={`Editar objetivo ${goal.title}`} className="icon-button h-9 w-9"><Edit3 size={14} /></button>
        <button type="button" onClick={() => onDelete(goal)} aria-label={`Excluir objetivo ${goal.title}`} className="icon-button h-9 w-9 hover:text-rose-400"><Trash2 size={14} /></button>
      </div>
    </div>
    {goal.description ? <p className="mt-4 text-sm leading-relaxed text-[#a0a5a0]">{goal.description}</p> : null}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Metric label="Valor atual" value={currency.format(goal.currentValue)} strong />
      <Metric label="Valor alvo" value={currency.format(goal.targetValue)} />
      <Metric label="Percentual" value={`${percent.format(goal.percent)}%`} />
      <Metric label="Falta" value={currency.format(goal.remaining)} />
    </div>
    <div className="mt-5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em] text-[#626762]"><span>Progresso</span><span>{percent.format(goal.percent)}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.06]">
        <div className="h-full rounded-full bg-[#d9b86c] transition-all duration-700" style={{ width: `${Math.min(100, goal.percent)}%` }} />
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-4 text-[11px] text-[#777d78]">
      <span>Última atualização: {dateFormatter.format(new Date(goal.updatedAt))}</span>
      {goal.dueDate ? <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{dateFormatter.format(new Date(`${goal.dueDate}T00:00:00Z`))}</span> : null}
    </div>
  </article>;
}

function Metric({ label, value, strong = false }) {
  return <div className="rounded-xl border border-white/[.05] bg-white/[.018] p-3">
    <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#626762]">{label}</p>
    <p className={`mt-2 truncate ${strong ? "text-base font-semibold text-white" : "text-sm font-semibold text-[#d7d9d5]"}`}>{value}</p>
  </div>;
}
