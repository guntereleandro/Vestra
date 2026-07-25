import { createPortfolioSnapshot } from "../data/portfolioHistory.js";
import { calculatePositions } from "../engine/portfolio.js";
import { getRepositories } from "../repositories/repositoryRegistry.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";

export async function listPortfolioSnapshots(portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().portfolioSnapshots.listByPortfolio(portfolioId);
}

export async function registerPortfolioSnapshot(data, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  const positions = calculatePositions(data.operations, data.quotes, data.assetsMaster);
  const snapshot = createPortfolioSnapshot(positions);
  if (
    snapshot.positionsCount === 0
    && snapshot.currentValue <= 0
    && snapshot.totalInvested <= 0
    && snapshot.dividends <= 0
  ) {
    return listPortfolioSnapshots(portfolioId);
  }
  await getRepositories().portfolioSnapshots.upsertDaily({ ...snapshot, portfolioId });
  return listPortfolioSnapshots(portfolioId);
}

