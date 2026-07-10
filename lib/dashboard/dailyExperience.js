import { isIncomeOperation } from "@/lib/data/operations";

const DAY_MS = 86400000;
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateTime(date) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function relativeDate(date) {
  if (!date) return "";
  const today = todayIso();
  const diff = Math.round((dateTime(today) - dateTime(date)) / DAY_MS);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff > 1 && diff < 7) return `${diff} dias atrás`;
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function groupDate(date) {
  if (!date) return "Mais antigos";
  const today = todayIso();
  const diff = Math.round((dateTime(today) - dateTime(date)) / DAY_MS);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff > 1 && diff < 7) return "Esta semana";
  return "Mais antigos";
}

function operationTitle(type) {
  if (type === "COMPRA") return "Compra";
  if (type === "VENDA") return "Venda";
  if (type === "DIVIDENDO") return "Dividendo";
  if (type === "JCP") return "JCP";
  if (type === "RENDIMENTO") return "Rendimento";
  return "Operação";
}

function operationEvent(operation) {
  const income = isIncomeOperation(operation.operationType);
  return {
    id: `operation-${operation.id}`,
    type: operation.operationType,
    date: operation.date,
    title: operationTitle(operation.operationType),
    description: income ? operation.ticker : `${operation.ticker} · ${operation.quantity} ${operation.quantity === 1 ? "unidade" : "unidades"}`,
    value: operation.totalValue,
    ticker: operation.ticker,
  };
}

function firstByDate(items) {
  return [...items].sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}

function maxOperation(operations, predicate) {
  return operations.filter(predicate).sort((a, b) => safeNumber(b.totalValue) - safeNumber(a.totalValue))[0] || null;
}

function maxPosition(positions, field) {
  return positions.filter((position) => safeNumber(position[field]) > 0).sort((a, b) => safeNumber(b[field]) - safeNumber(a[field]))[0] || null;
}

function maxHistory(history, field) {
  return history.filter((item) => safeNumber(item[field]) > 0).sort((a, b) => safeNumber(b[field]) - safeNumber(a[field]))[0] || null;
}

export function getJourneyRecordCandidates({ operations, positions, totals, portfolioHistory }) {
  const largestContribution = maxOperation(operations, (operation) => operation.operationType === "COMPRA");
  const largestDividend = maxOperation(operations, (operation) => isIncomeOperation(operation.operationType));
  const largestProfit = maxPosition(positions, "profit");
  const highestPortfolio = maxHistory([...portfolioHistory, { date: todayIso(), currentValue: totals.current }], "currentValue");
  const highestAssetCount = maxHistory([...portfolioHistory, { date: todayIso(), positionsCount: positions.length }], "positionsCount");
  return [
    highestPortfolio && { key: "highestPortfolio", value: highestPortfolio.currentValue, date: highestPortfolio.date, label: "Maior patrimônio" },
    largestContribution && { key: "largestContribution", value: largestContribution.totalValue, date: largestContribution.date, label: "Maior aporte", ticker: largestContribution.ticker },
    largestDividend && { key: "largestDividend", value: largestDividend.totalValue, date: largestDividend.date, label: "Maior dividendo", ticker: largestDividend.ticker },
    largestProfit && { key: "largestProfit", value: largestProfit.profit, date: todayIso(), label: "Maior lucro registrado", ticker: largestProfit.ticker },
    highestAssetCount && { key: "highestAssetCount", value: highestAssetCount.positionsCount, date: highestAssetCount.date, label: "Maior quantidade de ativos" },
  ].filter(Boolean);
}

function recordEvents(records) {
  const map = {
    highestPortfolio: { title: "Novo maior patrimônio", description: "Seu patrimônio atingiu" },
    largestContribution: { title: "Novo maior aporte", description: "Maior compra registrada" },
    largestDividend: { title: "Novo maior dividendo", description: "Maior provento registrado" },
    largestProfit: { title: "Novo maior lucro", description: "Maior lucro registrado em um ativo" },
    highestAssetCount: { title: "Novo recorde de ativos", description: "Maior quantidade de ativos acompanhados" },
  };
  return Object.values(records).flatMap((record) => {
    const meta = map[record.key];
    if (!meta) return [];
    return [{
      id: `record-${record.key}-${record.date}`,
      type: record.key,
      date: record.date,
      title: meta.title,
      description: record.ticker ? `${meta.description}: ${record.ticker}` : meta.description,
      value: record.value,
      ticker: record.ticker,
      record: true,
    }];
  });
}

function milestoneEvents(operations) {
  const firstContribution = firstByDate(operations.filter((operation) => operation.operationType === "COMPRA"));
  const firstDividend = firstByDate(operations.filter((operation) => isIncomeOperation(operation.operationType)));
  const firstAsset = firstContribution;
  return [
    firstAsset && { id: "milestone-first-asset", type: "FIRST_ASSET", date: firstAsset.date, title: "Primeiro ativo", description: firstAsset.ticker, value: firstAsset.totalValue, ticker: firstAsset.ticker },
    firstContribution && { id: "milestone-first-contribution", type: "FIRST_CONTRIBUTION", date: firstContribution.date, title: "Primeiro aporte", description: firstContribution.ticker, value: firstContribution.totalValue, ticker: firstContribution.ticker },
    firstDividend && { id: "milestone-first-dividend", type: "FIRST_DIVIDEND", date: firstDividend.date, title: "Primeiro dividendo", description: firstDividend.ticker, value: firstDividend.totalValue, ticker: firstDividend.ticker },
  ].filter(Boolean);
}

export function prepareTimeline({ operations, records, goalEvents = [] }) {
  const operationEvents = operations.slice(-80).map(operationEvent);
  const normalizedGoalEvents = goalEvents.map((event) => ({ ...event, type: "GOAL_MILESTONE", record: true }));
  return [...operationEvents, ...recordEvents(records), ...milestoneEvents(operations), ...normalizedGoalEvents]
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
    .slice(0, 12)
    .map((event) => ({ ...event, groupLabel: groupDate(event.date), relativeDate: relativeDate(event.date) }));
}

export function prepareJourneyStats({ operations, positions, totals, portfolioHistory }) {
  const firstDates = [firstByDate(operations)?.date, firstByDate(portfolioHistory)?.date].filter(Boolean).sort();
  const start = firstDates[0];
  const trackedDays = start ? Math.max(1, Math.round((dateTime(todayIso()) - dateTime(start)) / DAY_MS) + 1) : 0;
  return {
    assets: positions.length,
    operations: operations.length,
    invested: totals.invested,
    dividends: totals.dividends,
    trackedDays,
  };
}

export function prepareInsights({ operations, positions, portfolioHistory, visitChanges }) {
  const insights = [];
  const changedPortfolio = visitChanges?.items?.find((item) => item.key === "portfolio");
  if (changedPortfolio) insights.push({ title: "Desde a última visita", value: changedPortfolio.value, text: "mudança no patrimônio." });
  const latest = portfolioHistory[portfolioHistory.length - 1];
  const cutoff = Date.now() - 30 * DAY_MS;
  const previous = [...portfolioHistory].reverse().find((item) => dateTime(item.date) <= cutoff);
  if (latest && previous && previous.currentValue > 0) {
    const growth = ((latest.currentValue - previous.currentValue) / previous.currentValue) * 100;
    insights.push({ title: "Últimos 30 dias", value: `${growth >= 0 ? "+" : ""}${growth.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, text: "variação do patrimônio." });
  }
  const largest = [...positions].sort((a, b) => safeNumber(b.currentValue) - safeNumber(a.currentValue))[0];
  if (largest) insights.push({ title: "Maior posição", value: largest.ticker, text: "continua sendo sua maior posição." });
  const month = todayIso().slice(0, 7);
  const contributionsThisMonth = operations.filter((operation) => operation.operationType === "COMPRA" && operation.date.startsWith(month)).length;
  insights.push({ title: "Este mês", value: contributionsThisMonth, text: contributionsThisMonth === 1 ? "aporte registrado." : "aportes registrados." });
  const hasDividends = operations.some((operation) => isIncomeOperation(operation.operationType));
  if (!hasDividends) insights.push({ title: "Proventos", value: "Nenhum", text: "dividendo registrado até agora." });
  const categories = new Set(positions.map((position) => position.type).filter(Boolean)).size;
  if (categories > 0) insights.push({ title: "Categorias", value: categories, text: categories === 1 ? "categoria de ativo." : "categorias de ativos." });
  return insights.slice(0, 5);
}

export function heroContextMessage({ operations, totals, records, portfolioHistory, visitChanges }) {
  if (visitChanges?.items?.some((item) => item.key === "record")) return "Seu patrimônio atingiu um novo recorde.";
  if (visitChanges?.items?.some((item) => item.key === "operations")) return "Você realizou novas operações.";
  const recentIncome = operations.some((operation) => isIncomeOperation(operation.operationType) && (Date.now() - dateTime(operation.date)) <= 7 * DAY_MS);
  if (recentIncome) return "Você recebeu dividendos recentemente.";
  if (records.highestPortfolio?.value === totals.current && totals.current > 0) return "Seu patrimônio atingiu um novo recorde.";
  const latest = portfolioHistory[portfolioHistory.length - 1];
  const previous = portfolioHistory[portfolioHistory.length - 2];
  if (latest && previous && latest.currentValue > previous.currentValue) return "Sua carteira continua crescendo.";
  return "Nenhuma movimentação recente.";
}

export function formatLastAccess(visit) {
  if (!visit?.visitedAt) return "Primeiro acesso registrado agora";
  const date = new Date(visit.visitedAt);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const visitStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((todayStart - visitStart) / DAY_MS);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Hoje às ${time}`;
  if (diff === 1) return `Ontem às ${time}`;
  return `Há ${diff} dias`;
}

export function prepareVisitChanges({ previousVisit, currentSnapshot }) {
  if (!previousVisit?.snapshot) {
    return { lastAccessText: "", hasChanges: false, items: [], emptyTitle: "Primeira visita acompanhada", emptyText: "A partir de agora, o Vestra mostrará o que mudou desde seu último acesso." };
  }
  const previous = previousVisit.snapshot;
  const items = [];
  const currentDelta = safeNumber(currentSnapshot.currentValue) - safeNumber(previous.currentValue);
  if (Math.abs(currentDelta) >= 0.01) items.push({ key: "portfolio", title: "Patrimônio", value: `${currentDelta > 0 ? "+" : ""}${currentDelta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, tone: currentDelta > 0 ? "positive" : "negative" });
  const dividendDelta = safeNumber(currentSnapshot.dividends) - safeNumber(previous.dividends);
  if (dividendDelta > 0.009) items.push({ key: "dividends", title: "Dividendos", value: `+${dividendDelta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, tone: "positive" });
  const operationDelta = Math.max(0, Math.trunc(safeNumber(currentSnapshot.operationsCount) - safeNumber(previous.operationsCount)));
  if (operationDelta > 0) items.push({ key: "operations", title: operationDelta === 1 ? "Nova operação" : "Novas operações", value: operationDelta === 1 ? "1 operação" : `${operationDelta} operações`, tone: "neutral" });
  const recordDelta = safeNumber(currentSnapshot.highestPortfolio) - safeNumber(previous.highestPortfolio);
  if (recordDelta > 0.009) items.push({ key: "record", title: "Novo maior patrimônio", value: currentSnapshot.highestPortfolio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), tone: "positive" });
  return { lastAccessText: formatLastAccess(previousVisit), hasChanges: items.length > 0, items, emptyTitle: "Nenhuma mudança desde sua última visita.", emptyText: "Sua carteira permanece atualizada." };
}

export function prepareAchievements({ operations, totals, goals = [] }) {
  const achievements = [
    { key: "first-investment", title: "Primeiro investimento", unlocked: operations.some((operation) => operation.operationType === "COMPRA") },
    { key: "first-dividend", title: "Primeiro dividendo", unlocked: operations.some((operation) => isIncomeOperation(operation.operationType)) },
    { key: "first-goal", title: "Primeiro objetivo", unlocked: goals.length > 0 },
    { key: "first-goal-completed", title: "Primeiro objetivo concluído", unlocked: goals.some((goal) => goal.completed) },
    { key: "10-operations", title: "10 operações", unlocked: operations.length >= 10 },
    { key: "50-operations", title: "50 operações", unlocked: operations.length >= 50 },
    { key: "100-operations", title: "100 operações", unlocked: operations.length >= 100 },
    { key: "10k", title: "Patrimônio acima de 10 mil", unlocked: totals.current >= 10000 },
    { key: "50k", title: "Patrimônio acima de 50 mil", unlocked: totals.current >= 50000 },
    { key: "100k", title: "Patrimônio acima de 100 mil", unlocked: totals.current >= 100000 },
    { key: "500k", title: "Patrimônio acima de 500 mil", unlocked: totals.current >= 500000 },
    { key: "1m", title: "Patrimônio acima de 1 milhão", unlocked: totals.current >= 1000000 },
  ];
  return achievements;
}

export function relativeDateLabel(date) {
  return relativeDate(date);
}
