import { mergeAssetsMaster } from "../data/assetsMaster.js";
import { getRepositories } from "../repositories/repositoryRegistry.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { registerPortfolioSnapshot } from "./snapshotsService.js";

let saveQueue = Promise.resolve();

export async function loadPortfolioData(portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  const repositories = getRepositories();
  const legacyData = await repositories.coreData.load();
  const [operations, quotes, portfolioHistory] = await Promise.all([
    repositories.operations.listByPortfolio(portfolioId),
    repositories.quotes.listByPortfolio(portfolioId),
    repositories.portfolioSnapshots.listByPortfolio(portfolioId),
  ]);
  return {
    operations,
    quotes,
    assetsMaster: mergeAssetsMaster(legacyData.assetsMaster, operations, quotes),
    portfolioHistory,
    migrated: legacyData.migrated,
  };
}

export function savePortfolioData(data, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  const task = async () => {
    const repositories = getRepositories();
    const assetsMaster = mergeAssetsMaster(data.assetsMaster, data.operations, data.quotes);
    await repositories.operations.replaceAllByPortfolio(portfolioId, data.operations);
    await repositories.quotes.replaceAllByPortfolio(portfolioId, data.quotes);
    const current = await repositories.coreData.load();
    await repositories.coreData.replace({
      operations: current.operations,
      assetsMaster,
      quotes: current.quotes,
    });
    return { operations: current.operations, assetsMaster, quotes: current.quotes };
  };
  saveQueue = saveQueue.then(task, task);
  return saveQueue;
}

export async function savePortfolioDataAndSnapshot(data, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  const saved = await savePortfolioData(data, portfolioId);
  const portfolioHistory = await registerPortfolioSnapshot(saved, portfolioId);
  return { ...saved, portfolioHistory };
}
