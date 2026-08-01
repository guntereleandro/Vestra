import {
  DATA_SOURCE,
  invalidateRemotePortfolioCache,
  resolveOperationsDataSource,
} from "./dataSourceResolver.js";

async function resolved() {
  return resolveOperationsDataSource({ loadRemote: false });
}

export async function listOperations() {
  const source = await resolveOperationsDataSource();
  if (source.source === DATA_SOURCE.SUPABASE) return source.remoteData.operations;
  return source.operationsRepository.listByPortfolio(source.portfolioId);
}

export async function createOperation(input) {
  const source = await resolved();
  if (!source.canWrite) throw new Error("READ_ONLY_SOURCE");
  const saved = await source.operationsRepository.create({ ...input, portfolioId: source.portfolioId });
  if (source.source === DATA_SOURCE.SUPABASE) invalidateRemotePortfolioCache(source.portfolioId);
  return saved;
}

export async function updateOperation(id, input) {
  const source = await resolved();
  if (!source.canWrite) throw new Error("READ_ONLY_SOURCE");
  const saved = await source.operationsRepository.update(id, { ...input, portfolioId: source.portfolioId });
  if (source.source === DATA_SOURCE.SUPABASE) invalidateRemotePortfolioCache(source.portfolioId);
  return saved;
}

export async function removeOperation(id) {
  const source = await resolved();
  if (!source.canWrite) throw new Error("READ_ONLY_SOURCE");
  const removed = await source.operationsRepository.remove(id);
  if (source.source === DATA_SOURCE.SUPABASE) invalidateRemotePortfolioCache(source.portfolioId);
  return removed;
}

export async function replaceOperations(operations) {
  const source = await resolved();
  if (!source.canWrite) throw new Error("READ_ONLY_SOURCE");
  const saved = await source.operationsRepository.replaceAllByPortfolio(source.portfolioId, operations);
  if (source.source === DATA_SOURCE.SUPABASE) invalidateRemotePortfolioCache(source.portfolioId);
  return saved;
}
