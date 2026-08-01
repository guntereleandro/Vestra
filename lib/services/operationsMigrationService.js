import { createBackup } from "../data/storage.js";
import { isIncomeOperation, isOperationUuid, normalizeOperations } from "../data/operations.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { calculatePositions } from "../engine/portfolio.js";
import { calculatePortfolioTotals } from "../engine/totals.js";
import { localAssetsRepository } from "../repositories/local/localAssetsRepository.js";
import { localOperationsRepository } from "../repositories/local/localOperationsRepository.js";
import { localQuotesRepository } from "../repositories/local/localQuotesRepository.js";
import { supabaseAssetsRepository } from "../repositories/supabase/supabaseAssetsRepository.js";
import { supabaseOperationsRepository } from "../repositories/supabase/supabaseOperationsRepository.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
import { supabaseQuotesRepository } from "../repositories/supabase/supabaseQuotesRepository.js";
import { synchronizeLocalCoreDomainToSupabase } from "./coreDomainSyncService.js";

function comparable(operation) {
  return JSON.stringify({
    id: operation.id,
    ticker: operation.ticker,
    assetName: operation.assetName,
    assetType: operation.assetType,
    operationType: operation.operationType,
    date: operation.date,
    quantity: operation.quantity,
    unitPrice: operation.unitPrice,
    fees: operation.fees,
    totalValue: operation.totalValue,
    notes: operation.notes,
  });
}

function validateLocalOperations(operations) {
  const normalized = [];
  const invalid = operations.flatMap((operation, index) => {
    const [item] = normalizeOperations([operation]);
    const invalidTrade = item && !isIncomeOperation(item.operationType)
      && (!(item.quantity > 0) || item.unitPrice < 0);
    const invalidIncome = item && isIncomeOperation(item.operationType) && !(item.totalValue > 0);
    if (!item || !isOperationUuid(item.id) || invalidTrade || invalidIncome) {
      return [{ index, id: operation?.id || null, reason: "INVALID_OPERATION" }];
    }
    normalized.push(item);
    return [];
  });
  return { valid: invalid.length === 0, invalid, operations: normalized };
}

function reconcile(localOperations, remoteOperations) {
  const local = new Map(normalizeOperations(localOperations).map((operation) => [operation.id, operation]));
  const remote = new Map(normalizeOperations(remoteOperations).map((operation) => [operation.id, operation]));
  const onlyLocal = [];
  const onlyRemote = [];
  const equal = [];
  const divergent = [];

  for (const [id, operation] of local) {
    const remoteOperation = remote.get(id);
    if (!remoteOperation) onlyLocal.push(operation);
    else if (comparable(operation) === comparable(remoteOperation)) equal.push(operation);
    else divergent.push({
      id,
      ticker: operation.ticker,
      date: operation.date,
      local: operation,
      remote: remoteOperation,
    });
  }
  for (const [id, operation] of remote) {
    if (!local.has(id)) onlyRemote.push(operation);
  }
  return { onlyLocal, onlyRemote, equal, divergent };
}

async function context() {
  const portfolio = await supabasePortfoliosRepository.getActive();
  if (!portfolio) throw new Error("NO_ACTIVE_PORTFOLIO");
  const [localOperations, remoteOperations, localAssets, localQuotes, remoteAssets, remoteQuotes] = await Promise.all([
    localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    supabaseOperationsRepository.listByPortfolio(portfolio.id),
    localAssetsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    localQuotesRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    supabaseAssetsRepository.listByPortfolio(portfolio.id),
    supabaseQuotesRepository.listByPortfolio(portfolio.id),
  ]);
  const validation = validateLocalOperations(localOperations);
  return { portfolio, localOperations, remoteOperations, localAssets, localQuotes, remoteAssets, remoteQuotes, validation };
}

function close(left, right) { return Math.abs(Number(left || 0) - Number(right || 0)) < 1e-8; }
function financialSnapshot(operations, quotes, assets) {
  const positions = calculatePositions(operations, quotes, assets);
  return {
    positions: new Map(positions.map((position) => [position.ticker, {
      ticker: position.ticker,
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      invested: position.invested,
      currentValue: position.currentValue,
      dividends: position.dividends,
      realizedProfit: position.realizedProfit || 0,
    }])),
    totals: calculatePortfolioTotals(positions),
  };
}
function compareFinancial(state) {
  const local = financialSnapshot(state.validation.operations, state.localQuotes, state.localAssets);
  const remote = financialSnapshot(state.remoteOperations, state.remoteQuotes, state.remoteAssets);
  const onlyLocal = [], onlyRemote = [], divergent = [], equivalent = [];
  const tickers = new Set([...local.positions.keys(), ...remote.positions.keys()]);
  for (const ticker of tickers) {
    const left = local.positions.get(ticker), right = remote.positions.get(ticker);
    if (!right) onlyLocal.push(ticker);
    else if (!left) onlyRemote.push(ticker);
    else if (["quantity", "averagePrice", "invested", "currentValue", "dividends", "realizedProfit"].every((field) => close(left[field], right[field]))) equivalent.push(ticker);
    else divergent.push(ticker);
  }
  const totalsEquivalent = ["invested", "current", "profit", "dividends", "realizedProfit"].every((field) => close(local.totals[field], remote.totals[field]));
  return { onlyLocal, onlyRemote, divergent, equivalent, totalsEquivalent, localTotals: local.totals, remoteTotals: remote.totals };
}

export function getOperationsMigrationErrorMessage(error) {
  if (error?.message === "NO_ACTIVE_PORTFOLIO") return "Crie ou selecione uma carteira remota antes de continuar.";
  const status = error?.cause?.status || error?.cause?.cause?.status;
  const code = error?.cause?.code || error?.cause?.cause?.code;
  if (status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
  if (status === 403 || code === "42501") return "Sua permissão não permite alterar esta carteira.";
  if (error instanceof TypeError) return "A rede está indisponível. Verifique a conexão e tente novamente.";
  return "Não foi possível acessar as operações remotas agora.";
}

export async function previewOperationsMigration() {
  const state = await context();
  const reconciliation = reconcile(state.validation.operations, state.remoteOperations);
  return {
    portfolio: { id: state.portfolio.id, name: state.portfolio.name },
    localCount: state.localOperations.length,
    remoteCount: state.remoteOperations.length,
    invalid: state.validation.invalid,
    onlyLocal: reconciliation.onlyLocal.map(({ id, ticker, date }) => ({ id, ticker, date })),
    onlyRemote: reconciliation.onlyRemote.map(({ id, ticker, date }) => ({ id, ticker, date })),
    equal: reconciliation.equal.map(({ id, ticker, date }) => ({ id, ticker, date })),
    divergent: reconciliation.divergent.map(({ id, ticker, date }) => ({ id, ticker, date })),
    financial: compareFinancial(state),
    canImport: state.validation.valid && reconciliation.onlyLocal.length > 0,
  };
}

export function createOperationsSafetyBackup() {
  return createBackup();
}

export async function importSafeLocalOperations() {
  const state = await context();
  if (!state.validation.valid) {
    return { imported: 0, status: "INVALID_LOCAL_DATA", invalid: state.validation.invalid };
  }
  const reconciliation = reconcile(state.validation.operations, state.remoteOperations);
  if (!reconciliation.onlyLocal.length) {
    return {
      imported: 0,
      status: "NOTHING_TO_IMPORT",
      equal: reconciliation.equal.length,
      divergent: reconciliation.divergent.length,
    };
  }

  await synchronizeLocalCoreDomainToSupabase(state.portfolio.id);
  const saved = await supabaseOperationsRepository.replaceAllByPortfolio(
    state.portfolio.id,
    reconciliation.onlyLocal.map((operation) => ({ ...operation, portfolioId: state.portfolio.id })),
  );
  const after = await supabaseOperationsRepository.listByPortfolio(state.portfolio.id);
  const finalReconciliation = reconcile(state.validation.operations, after);
  return {
    imported: saved.length,
    status: "COMPLETED",
    localCount: state.localOperations.length,
    remoteCount: after.length,
    equal: finalReconciliation.equal.length,
    onlyLocal: finalReconciliation.onlyLocal.length,
    onlyRemote: finalReconciliation.onlyRemote.length,
    divergent: finalReconciliation.divergent.length,
  };
}

export { reconcile as reconcileOperations };
