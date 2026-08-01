import { mergeAssetsMaster } from "../data/assetsMaster.js";
import { localCoreDataRepository } from "../repositories/local/localCoreDataRepository.js";
import { localOperationsRepository } from "../repositories/local/localOperationsRepository.js";
import { localPortfolioSnapshotsRepository } from "../repositories/local/localPortfolioSnapshotsRepository.js";
import { localQuotesRepository } from "../repositories/local/localQuotesRepository.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { DATA_SOURCE, resolveOperationsDataSource } from "./dataSourceResolver.js";
import { registerPortfolioSnapshot } from "./snapshotsService.js";

let saveQueue = Promise.resolve();

export async function loadPortfolioData() {
  const source = await resolveOperationsDataSource();
  if (source.source === DATA_SOURCE.SUPABASE) {
    const data = source.remoteData;
    return {
      operations: data.operations,
      quotes: data.quotes,
      assetsMaster: mergeAssetsMaster(data.assetsMaster, data.operations, data.quotes),
      portfolioHistory: [],
      portfolioHistoryUnavailable: true,
      migrated: false,
      dataSource: {
        source: source.source,
        portfolioId: source.portfolioId,
        portfolioName: source.portfolioName,
        role: source.role,
        canWrite: source.canWrite,
        operationCount: data.operations.length,
        updatedAt: data.updatedAt,
        loadedAt: data.loadedAt,
      },
    };
  }

  const legacyData = await localCoreDataRepository.load();
  const [operations, quotes, portfolioHistory] = await Promise.all([
    localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    localQuotesRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    localPortfolioSnapshotsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
  ]);
  return {
    operations,
    quotes,
    assetsMaster: mergeAssetsMaster(legacyData.assetsMaster, operations, quotes),
    portfolioHistory,
    portfolioHistoryUnavailable: false,
    migrated: legacyData.migrated,
    dataSource: {
      source: DATA_SOURCE.LOCAL,
      portfolioId: LOCAL_DEFAULT_PORTFOLIO_ID,
      portfolioName: "Carteira local",
      role: "owner",
      canWrite: true,
      operationCount: operations.length,
      updatedAt: "",
      loadedAt: new Date().toISOString(),
    },
  };
}

export function savePortfolioData(data) {
  const task = async () => {
    const assetsMaster = mergeAssetsMaster(data.assetsMaster, data.operations, data.quotes);
    await localOperationsRepository.replaceAllByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID, data.operations);
    await localQuotesRepository.replaceAllByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID, data.quotes);
    const current = await localCoreDataRepository.load();
    await localCoreDataRepository.replace({
      operations: current.operations,
      assetsMaster,
      quotes: current.quotes,
    });
    return { operations: current.operations, assetsMaster, quotes: current.quotes };
  };
  saveQueue = saveQueue.then(task, task);
  return saveQueue;
}

export async function savePortfolioDataAndSnapshot(data) {
  const saved = await savePortfolioData(data);
  const portfolioHistory = await registerPortfolioSnapshot(saved, LOCAL_DEFAULT_PORTFOLIO_ID);
  return { ...saved, portfolioHistory };
}
