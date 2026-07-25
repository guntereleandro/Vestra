"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flag, Plus, Target, Trophy } from "lucide-react";
import GoalCard from "@/components/goals/GoalCard";
import GoalFormModal from "@/components/goals/GoalFormModal";
import useInvestmentData from "@/hooks/useInvestmentData";
import { createGoal, readGoalMilestones, readGoals, writeGoalMilestones, writeGoals } from "@/lib/data/goals";
import { enrichGoals, registerGoalMilestones, summarizeGoals } from "@/lib/dashboard/goalsAnalytics";
import { percent } from "@/lib/engine/totals";
import { brandConfig } from "@/lib/config/brandConfig";

const filters = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "completed", label: "Concluídos" },
];

export default function GoalsPage() {
  const { totals, loaded } = useInvestmentData();
  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { setGoals(readGoals()); }, []);
  const enrichedGoals = useMemo(() => enrichGoals(goals, totals), [goals, totals]);
  const summary = useMemo(() => summarizeGoals(enrichedGoals), [enrichedGoals]);
  const visibleGoals = useMemo(() => enrichedGoals.filter((goal) => filter === "all" || (filter === "active" ? !goal.completed : goal.completed)), [enrichedGoals, filter]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("new") === "goal") { setEditing(null); setModalOpen(true); } }, []);

  useEffect(() => {
    if (!loaded || !enrichedGoals.length) return;
    writeGoalMilestones(registerGoalMilestones(enrichedGoals, readGoalMilestones()));
  }, [loaded, enrichedGoals]);

  function saveGoal(input) {
    const next = input.id ? goals.map((goal) => goal.id === input.id ? createGoal({ ...goal, ...input, id: goal.id, createdAt: goal.createdAt }) : goal) : [createGoal(input), ...goals];
    setGoals(writeGoals(next));
    setEditing(null);
    setModalOpen(false);
  }

  function deleteGoal(goal) {
    setGoals(writeGoals(goals.filter((item) => item.id !== goal.id)));
  }

  return <div className="page-container">
    <section className="fade-in card relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[#d9b86c]/[.045] blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Objetivos</p>
          <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">Patrimônio com direção.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#898e89]">Acompanhe automaticamente metas de patrimônio e renda passiva usando os dados que você já registra no {brandConfig.appName}.</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="gold-button flex items-center justify-center gap-2"><Plus size={16} />Criar objetivo</button>
      </div>
    </section>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HeroMetric icon={Target} label="Objetivos ativos" value={summary.activeCount} detail="em acompanhamento" />
      <HeroMetric icon={CheckCircle2} label="Concluídos" value={summary.completedCount} detail="objetivos alcançados" />
      <HeroMetric icon={Flag} label="Mais próximo" value={summary.closest ? `${percent.format(summary.closest.percent)}%` : "0,00%"} detail={summary.closest?.title || "Crie seu primeiro objetivo"} />
      <HeroMetric icon={Trophy} label="Maior progresso" value={summary.largestProgress ? `${percent.format(summary.largestProgress.percent)}%` : "0,00%"} detail={summary.largestProgress?.title || "Sem objetivos ainda"} />
    </section>

    <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl border border-white/[.06] p-1">
        {filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${filter === item.value ? "bg-[#d9b86c] text-[#090b0a]" : "text-[#898e89] hover:text-white"}`}>{item.label}</button>)}
      </div>
      <p className="text-xs text-[#777d78]">Ordenado por maior percentual, maior valor e mais recente.</p>
    </section>

    <section className="mt-6">
      {!visibleGoals.length ? <EmptyGoals onCreate={() => { setEditing(null); setModalOpen(true); }} /> : <div className="grid gap-4 xl:grid-cols-2">
        {visibleGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={(item) => { setEditing(item); setModalOpen(true); }} onDelete={deleteGoal} />)}
      </div>}
    </section>

    {modalOpen && <GoalFormModal goal={editing} onClose={() => { setEditing(null); setModalOpen(false); }} onSave={saveGoal} />}
  </div>;
}

function HeroMetric({ icon: Icon, label, value, detail }) {
  return <article className="card rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b86c]/25">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#70766f]">{label}</p><p className="mt-4 text-3xl font-semibold text-white">{value}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.08] text-[#d9b86c]"><Icon size={18} /></span></div>
    <p className="mt-4 text-xs text-[#898e89]">{detail}</p>
  </article>;
}

function EmptyGoals({ onCreate }) {
  return <div className="card grid min-h-96 place-items-center rounded-2xl p-8 text-center">
    <div>
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Target size={30} /></div>
      <h2 className="font-display mt-6 text-3xl">Transforme patrimônio em objetivos.</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#898e89]">Comece criando seu primeiro objetivo.</p>
      <button onClick={onCreate} className="gold-button mt-7 inline-flex items-center gap-2"><Plus size={16} />Criar objetivo</button>
    </div>
  </div>;
}
