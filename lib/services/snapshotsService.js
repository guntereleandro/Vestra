import { createPortfolioSnapshot } from "../data/portfolioHistory.js";
import { calculatePositions } from "../engine/portfolio.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { resolveOperationsDataSource, invalidateRemotePortfolioCache, DATA_SOURCE } from "./dataSourceResolver.js";

async function contextFor(portfolioId) {
  const source = await resolveOperationsDataSource({ loadRemote: false });
  if (portfolioId && portfolioId !== source.portfolioId) throw new Error("SNAPSHOT_PORTFOLIO_MISMATCH");
  return source;
}

export async function listPortfolioSnapshots(portfolioId) {
  const source = await contextFor(portfolioId);
  return source.snapshotsRepository.listByPortfolio(source.portfolioId);
}

export async function registerPortfolioSnapshot(data, portfolioId) {
  const source = await contextFor(portfolioId);
  const positions = calculatePositions(data.operations, data.quotes, data.assetsMaster);
  const snapshot = createPortfolioSnapshot(positions);
  if (
    snapshot.positionsCount === 0
    && snapshot.currentValue <= 0
    && snapshot.totalInvested <= 0
    && snapshot.dividends <= 0
  ) {
    return source.snapshotsRepository.listByPortfolio(source.portfolioId);
  }
  if (!source.canWrite) return source.snapshotsRepository.listByPortfolio(source.portfolioId);
  await source.snapshotsRepository.upsertDaily({ ...snapshot, portfolioId: source.portfolioId });
  if (source.source === DATA_SOURCE.SUPABASE) invalidateRemotePortfolioCache(source.portfolioId);
  return source.snapshotsRepository.listByPortfolio(source.portfolioId);
}
