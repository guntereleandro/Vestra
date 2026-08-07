"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, Coins, Plus, Sparkles, WalletCards } from "lucide-react";
import Achievements from "@/components/dashboard/Achievements";
import AllocationChart from "@/components/dashboard/AllocationChart";
import DailyInsights from "@/components/dashboard/DailyInsights";
import DailyTimeline from "@/components/dashboard/DailyTimeline";
import DashboardMetricCard from "@/components/dashboard/DashboardMetricCard";
import DashboardPositionCards from "@/components/dashboard/DashboardPositionCards";
import GoalsSummaryCard from "@/components/dashboard/GoalsSummaryCard";
import JourneyStats from "@/components/dashboard/JourneyStats";
import PortfolioHistoryChart from "@/components/dashboard/PortfolioHistoryChart";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import RecentOperations from "@/components/dashboard/RecentOperations";
import VisitSummaryCard from "@/components/dashboard/VisitSummaryCard";
import useInvestmentData from "@/hooks/useInvestmentData";
import DataSourceBadge from "@/components/data/DataSourceBadge";
import { readGoalMilestones, readGoals, writeGoalMilestones } from "@/lib/data/goals";
import { createDashboardVisitSnapshot, readLastDashboardVisit, writeLastDashboardVisit } from "@/lib/data/lastDashboardVisit";
import { mergeJourneyRecords, readJourneyRecords, writeJourneyRecords } from "@/lib/data/journeyRecords";
import { getJourneyRecordCandidates, heroContextMessage, prepareAchievements, prepareInsights, prepareJourneyStats, prepareTimeline, prepareVisitChanges } from "@/lib/dashboard/dailyExperience";
import { enrichGoals, registerGoalMilestones, summarizeGoalsForDashboard } from "@/lib/dashboard/goalsAnalytics";
import { currency, percent } from "@/lib/engine/totals";
import { appConfig } from "@/lib/config/appConfig";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function greeting(userName = "") {
  const hour = new Date().getHours();
  const value = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return userName ? `${value}, ${userName}.` : `${value}.`;
}

function latestHistoryInfo(history, currentValue) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date) || (a.timestamp || 0) - (b.timestamp || 0));
  const latest = sorted[sorted.length - 1] || null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const baseValue = previous ? previous.currentValue : latest ? latest.currentValue : null;
  const delta = typeof baseValue === "number" ? currentValue - baseValue : null;
  const deltaPercent = baseValue > 0 && delta !== null ? (delta / baseValue) * 100 : null;
  const updatedAt = latest?.timestamp ? dateTimeFormatter.format(new Date(latest.timestamp)) : latest?.date ? dateFormatter.format(new Date(`${latest.date}T00:00:00Z`)) : "";
  return { latest, previous, delta, deltaPercent, updatedAt };
}

export default function Dashboard() {
  const { operations, positions, totals, portfolioHistory, portfolioHistoryUnavailable, loaded, storageError, dataSource, sourceError, useLocalSource } = useInvestmentData();
  const [journeyRecords, setJourneyRecords] = useState({});
  const [goals, setGoals] = useState([]);
  const [goalMilestones, setGoalMilestones] = useState([]);
  const [previousVisit, setPreviousVisit] = useState(undefined);
  const [visitWritten, setVisitWritten] = useState(false);
  const historyInfo = useMemo(() => latestHistoryInfo(portfolioHistory, totals.current), [portfolioHistory, totals.current]);
  const resultTone = totals.profit > 0 ? "positive" : totals.profit < 0 ? "negative" : "neutral";
  const variationTone = historyInfo.delta > 0 ? "positive" : historyInfo.delta < 0 ? "negative" : "neutral";
  const variationText = historyInfo.delta === null
    ? "Primeiro acompanhamento"
    : `${historyInfo.delta >= 0 ? "+" : ""}${currency.format(historyInfo.delta)}${historyInfo.deltaPercent !== null ? ` (${historyInfo.deltaPercent >= 0 ? "+" : ""}${percent.format(historyInfo.deltaPercent)}%)` : ""}`;
  const lastUpdate = historyInfo.updatedAt;
  const recordCandidates = useMemo(() => getJourneyRecordCandidates({ operations, positions, totals, portfolioHistory }), [operations, positions, totals, portfolioHistory]);

  useEffect(() => {
    setJourneyRecords(readJourneyRecords());
    setGoals(readGoals());
    setGoalMilestones(readGoalMilestones());
    setPreviousVisit(readLastDashboardVisit());
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const merged = mergeJourneyRecords(readJourneyRecords(), recordCandidates);
    setJourneyRecords((current) => {
      const currentText = JSON.stringify(current);
      const nextText = JSON.stringify(merged);
      if (currentText !== nextText) writeJourneyRecords(merged);
      return currentText === nextText ? current : merged;
    });
  }, [loaded, recordCandidates]);

  const currentVisitSnapshot = useMemo(() => createDashboardVisitSnapshot({ totals, operations, positions, journeyRecords }), [totals, operations, positions, journeyRecords]);
  const visitSummary = useMemo(() => prepareVisitChanges({ previousVisit, currentSnapshot: currentVisitSnapshot }), [previousVisit, currentVisitSnapshot]);

  useEffect(() => {
    if (!loaded || previousVisit === undefined || visitWritten) return;
    writeLastDashboardVisit(currentVisitSnapshot);
    setVisitWritten(true);
  }, [loaded, previousVisit, visitWritten, currentVisitSnapshot]);

  const enrichedGoals = useMemo(() => enrichGoals(goals, totals), [goals, totals]);
  useEffect(() => {
    if (!loaded || !enrichedGoals.length) return;
    const next = registerGoalMilestones(enrichedGoals, readGoalMilestones());
    setGoalMilestones(writeGoalMilestones(next));
  }, [loaded, enrichedGoals]);
  const goalsSummary = useMemo(() => summarizeGoalsForDashboard(enrichedGoals), [enrichedGoals]);
  const positionsPreview = useMemo(() => [...positions].sort((a, b) => b.currentValue - a.currentValue).slice(0, 6), [positions]);
  const timeline = useMemo(() => prepareTimeline({ operations, records: journeyRecords, goalEvents: goalMilestones }), [operations, journeyRecords, goalMilestones]);
  const journeyStats = useMemo(() => prepareJourneyStats({ operations, positions, totals, portfolioHistory }), [operations, positions, totals, portfolioHistory]);
  const insights = useMemo(() => prepareInsights({ operations, positions, portfolioHistory, visitChanges: visitSummary }), [operations, positions, portfolioHistory, visitSummary]);
  const achievements = useMemo(() => prepareAchievements({ operations, totals, goals: enrichedGoals }), [operations, totals, enrichedGoals]);
  const heroMessage = useMemo(() => heroContextMessage({ operations, totals, records: journeyRecords, portfolioHistory, visitChanges: visitSummary }), [operations, totals, journeyRecords, portfolioHistory, visitSummary]);
  const heroMeta = [
    { label: "Variação", value: variationText, tone: variationTone },
    { label: "Ativos", value: positions.length },
    { label: "Operações", value: operations.length },
    { label: "Dividendos", value: currency.format(totals.dividends) },
  ];

  return <div className="page-container"><DataSourceBadge dataSource={dataSource} sourceError={sourceError} onUseLocal={useLocalSource} />
    <section className="fade-in card relative overflow-hidden rounded-[2rem] p-6 transition duration-500 hover:border-[#d9b86c]/20 sm:p-8 lg:p-11">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#d9b86c]/70 to-transparent" />
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#d9b86c]/[.045] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-xs font-semibold text-[#c8c3b2]"><Sparkles size={14} className="text-[#d9b86c]" />{greeting()}</p>
            <h1 className="font-display mt-6 max-w-3xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">Seu patrimônio hoje é</h1>
          </div>
          <Link href="/operacoes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9b86c]/30 bg-[#d9b86c]/10 px-4 py-3 text-xs font-bold text-[#f0d99e] shadow-[0_12px_35px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d9b86c]/55 hover:bg-[#d9b86c]/15 hover:text-white focus:outline focus:outline-2 focus:outline-[#d9b86c]/60"><Plus size={16} />Nova operação</Link>
        </div>
        <p className="gold-text mt-9 break-words text-5xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-7xl lg:text-8xl">{currency.format(totals.current)}</p>
        <p className="mt-5 text-sm text-[#c8c3b2]">{heroMessage}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#a0a5a0]">
          {heroMeta.map((item, index) => <div key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" /> : null}
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#626762]">{item.label}</span>
            <span className={`font-semibold ${item.tone === "positive" ? "text-emerald-300" : item.tone === "negative" ? "text-rose-300" : "text-[#e3e0d8]"}`}>{item.value}</span>
          </div>)}
        </div>
        <p className="mt-6 text-xs text-[#686e69]">{lastUpdate ? `Última atualização: ${lastUpdate}` : "Aguardando histórico patrimonial"}</p>
      </div>
    </section>

    <section className="mt-8">
      <VisitSummaryCard summary={visitSummary} />
    </section>

    <section className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardMetricCard title="Valor investido" value={currency.format(totals.invested)} secondary="Custo consolidado das posições atuais." icon={WalletCards} />
      <DashboardMetricCard title="Lucro / prejuízo" value={`${totals.profit >= 0 ? "+" : ""}${currency.format(totals.profit)}`} secondary={`${totals.profitability >= 0 ? "+" : ""}${percent.format(totals.profitability)}% de rentabilidade total.`} icon={totals.profit >= 0 ? ArrowUpRight : ArrowDownRight} tone={resultTone} />
      <DashboardMetricCard title="Proventos recebidos" value={currency.format(totals.dividends)} secondary="Dividendos, JCP e rendimentos registrados." icon={Coins} />
      <DashboardMetricCard title="Patrimônio atual" value={currency.format(totals.current)} secondary={`${positions.length} ${positions.length === 1 ? "ativo calculado" : "ativos calculados"}.`} icon={Banknote} />
    </section>

    <section className="mt-14">
      {appConfig.enablePortfolioHistory && <PortfolioHistoryChart history={portfolioHistory} source={dataSource?.source} unavailable={portfolioHistoryUnavailable} featured />}
    </section>

    <section className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)]">
      {appConfig.enableAllocationChart && <AllocationChart positions={positions} />}
      {appConfig.enablePortfolioSummary && <PortfolioSummary positions={positions} operations={operations} />}
    </section>

    <section className="mt-12">
      <GoalsSummaryCard summary={goalsSummary} />
    </section>

    <section className="mt-12">
      <JourneyStats stats={journeyStats} />
    </section>

    <section className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)]">
      <DailyTimeline events={timeline} />
      <DailyInsights insights={insights} />
    </section>

    <section className="mt-12">
      <Achievements achievements={achievements} />
    </section>

    <section className="mt-14 grid gap-8 2xl:grid-cols-[minmax(0,1.2fr)_minmax(23rem,.8fr)]">
      <section className="card overflow-hidden rounded-2xl">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[.06] p-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Carteira</p>
            <h2 className="font-display mt-2 text-2xl">Principais ativos</h2>
            <p className="mt-2 text-sm text-[#777d78]">Cards ordenados pelo valor atual da posição.</p>
          </div>
          <Link href="/carteira" className="text-xs font-bold text-[#d9b86c] transition hover:text-[#f0d99e]">Ver carteira</Link>
        </div>
        {loaded ? <DashboardPositionCards positions={positionsPreview} /> : <div className="p-12 text-center text-sm text-[#777d78]">Calculando patrimônio...</div>}
      </section>
      <RecentOperations operations={operations} />
    </section>

    <footer className="mt-14 border-t border-white/[.05] pt-6 text-[10px] text-[#555b56]"><p className={storageError ? "text-rose-400" : ""}>{storageError ? "Não foi possível acessar o armazenamento deste navegador." : `${appConfig.appName} ${appConfig.appVersion} - Dados salvos somente neste navegador.`}</p></footer>
  </div>;
}
