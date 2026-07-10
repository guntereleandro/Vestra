import { goalTypeById, isAutomaticGoal } from "@/lib/data/goals";

const GOAL_THRESHOLDS = [10, 25, 50, 75, 100];

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function goalCurrentValue(goal, totals) {
  if (goal.type === "patrimony") return safeNumber(totals.current);
  if (goal.type === "passive_income") return safeNumber(totals.dividends);
  return safeNumber(goal.manualCurrent);
}

export function enrichGoals(goals, totals) {
  return goals.map((goal) => {
    const type = goalTypeById(goal.type);
    const currentValue = goalCurrentValue(goal, totals);
    const targetValue = Math.max(0, safeNumber(goal.targetValue));
    const percent = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;
    return {
      ...goal,
      typeMeta: type,
      automatic: isAutomaticGoal(goal.type),
      currentValue,
      percent,
      remaining: Math.max(0, targetValue - currentValue),
      completed: percent >= 100,
    };
  }).sort((a, b) => b.percent - a.percent || b.targetValue - a.targetValue || b.createdAt.localeCompare(a.createdAt));
}

export function summarizeGoals(goals) {
  const active = goals.filter((goal) => !goal.completed);
  const completed = goals.filter((goal) => goal.completed);
  const closest = active[0] || null;
  const largestProgress = goals[0] || null;
  const averageProgress = goals.length ? goals.reduce((sum, goal) => sum + goal.percent, 0) / goals.length : 0;
  return { activeCount: active.length, completedCount: completed.length, closest, largestProgress, averageProgress };
}

export function registerGoalMilestones(goals, existingEvents) {
  const events = [...existingEvents];
  const existingIds = new Set(events.map((event) => event.id));
  const date = todayIso();
  if (goals.length && !existingIds.has("goal-first")) {
    const first = [...goals].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    events.push({ id: "goal-first", goalId: first.id, title: "Primeiro objetivo", description: first.title, date, value: first.targetValue, percent: 0 });
    existingIds.add("goal-first");
  }
  goals.forEach((goal) => {
    GOAL_THRESHOLDS.forEach((threshold) => {
      const id = `goal-${goal.id}-${threshold}`;
      if (goal.percent >= threshold && !existingIds.has(id)) {
        events.push({ id, goalId: goal.id, title: threshold === 100 ? "Objetivo concluído" : `${threshold}% do objetivo`, description: goal.title, date, value: goal.currentValue, percent: threshold });
        existingIds.add(id);
      }
    });
  });
  return events;
}

export function summarizeGoalsForDashboard(goals) {
  const summary = summarizeGoals(goals);
  return {
    activeCount: summary.activeCount,
    completedCount: summary.completedCount,
    averageProgress: summary.averageProgress,
    closest: summary.closest,
  };
}
