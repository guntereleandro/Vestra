export const GOALS_KEY = "vestra:goals:v1";
export const GOAL_MILESTONES_KEY = "vestra:goalMilestones:v1";

export const GOAL_TYPES = [
  { id: "patrimony", name: "Patrimônio", icon: "landmark", color: "#d9b86c", meta: "Patrimônio atual", description: "Acompanha automaticamente o patrimônio atual." },
  { id: "passive_income", name: "Renda Passiva", icon: "coins", color: "#86efac", meta: "Proventos registrados", description: "Acompanha automaticamente os proventos recebidos." },
  { id: "purchase", name: "Compra", icon: "shopping-bag", color: "#7dd3fc", meta: "Progresso manual", description: "Use para uma compra planejada." },
  { id: "travel", name: "Viagem", icon: "plane", color: "#c4b5fd", meta: "Progresso manual", description: "Use para uma viagem futura." },
  { id: "vehicle", name: "Veículo", icon: "car", color: "#fda4af", meta: "Progresso manual", description: "Use para um carro, moto ou outro veículo." },
  { id: "education", name: "Educação", icon: "graduation-cap", color: "#fcd34d", meta: "Progresso manual", description: "Use para cursos, estudos ou formação." },
  { id: "custom", name: "Personalizado", icon: "target", color: "#a7f3d0", meta: "Progresso manual", description: "Use para qualquer objetivo próprio." },
];

export const AUTO_GOAL_TYPES = ["patrimony", "passive_income"];

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeType(type) {
  return GOAL_TYPES.some((item) => item.id === type) ? type : "custom";
}

function nowIso() {
  return new Date().toISOString();
}

export function goalTypeById(type) {
  return GOAL_TYPES.find((item) => item.id === type) || GOAL_TYPES[GOAL_TYPES.length - 1];
}

export function isAutomaticGoal(type) {
  return AUTO_GOAL_TYPES.includes(type);
}

export function createGoal(input) {
  const type = normalizeType(input?.type);
  const createdAt = nowIso();
  return {
    id: typeof input?.id === "string" && input.id ? input.id : `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: typeof input?.title === "string" && input.title.trim() ? input.title.trim() : "Objetivo",
    type,
    targetValue: Math.max(0, safeNumber(input?.targetValue)),
    description: typeof input?.description === "string" ? input.description.trim() : "",
    dueDate: typeof input?.dueDate === "string" ? input.dueDate : "",
    manualCurrent: isAutomaticGoal(type) ? 0 : Math.max(0, safeNumber(input?.manualCurrent)),
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeGoals(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((goal, index) => {
    if (!goal || typeof goal !== "object") return [];
    const normalized = createGoal(goal);
    if (!normalized.title || normalized.targetValue <= 0 || seen.has(normalized.id)) return [];
    seen.add(normalized.id);
    return [{ ...normalized, id: normalized.id || `goal-${index}`, createdAt: goal.createdAt || normalized.createdAt, updatedAt: goal.updatedAt || normalized.updatedAt }];
  });
}

export function readGoals() {
  if (typeof localStorage === "undefined") return [];
  return normalizeGoals(parse(localStorage.getItem(GOALS_KEY), []));
}

export function writeGoals(goals) {
  if (typeof localStorage === "undefined") return [];
  const normalized = normalizeGoals(goals);
  localStorage.setItem(GOALS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function normalizeGoalMilestones(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((event, index) => {
    if (!event || typeof event !== "object") return [];
    const id = typeof event.id === "string" && event.id ? event.id : `goal-milestone-${index}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{
      id,
      goalId: typeof event.goalId === "string" ? event.goalId : "",
      title: typeof event.title === "string" ? event.title : "Marco de objetivo",
      description: typeof event.description === "string" ? event.description : "",
      date: typeof event.date === "string" ? event.date : new Date().toISOString().slice(0, 10),
      value: Math.max(0, safeNumber(event.value)),
      percent: Math.max(0, safeNumber(event.percent)),
      type: "GOAL_MILESTONE",
    }];
  });
}

export function readGoalMilestones() {
  if (typeof localStorage === "undefined") return [];
  return normalizeGoalMilestones(parse(localStorage.getItem(GOAL_MILESTONES_KEY), []));
}

export function writeGoalMilestones(events) {
  if (typeof localStorage === "undefined") return [];
  const normalized = normalizeGoalMilestones(events);
  localStorage.setItem(GOAL_MILESTONES_KEY, JSON.stringify(normalized));
  return normalized;
}
