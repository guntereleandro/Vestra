import { createBackup } from "../data/storage.js";
import { isIncomeOperation, isOperationUuid, normalizeOperations } from "../data/operations.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { localOperationsRepository } from "../repositories/local/localOperationsRepository.js";
import { supabaseOperationsRepository } from "../repositories/supabase/supabaseOperationsRepository.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
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
  const [localOperations, remoteOperations] = await Promise.all([
    localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    supabaseOperationsRepository.listByPortfolio(portfolio.id),
  ]);
  const validation = validateLocalOperations(localOperations);
  return { portfolio, localOperations, remoteOperations, validation };
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
