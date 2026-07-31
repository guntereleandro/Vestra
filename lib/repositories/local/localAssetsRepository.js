import { normalizeAssetRecord, normalizeAssetsMaster, normalizeTicker } from "../../data/assetsMaster.js";
import { readLocalData, writeLocalData } from "../../data/storage.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositoryTypes.js";
import { clone, readSafely, requirePortfolio, writeSafely } from "./localRepositoryUtils.js";

function writeAssets(assetsMaster) {
  const data = readLocalData();
  writeLocalData({ operations: data.operations, assetsMaster, quotes: data.quotes });
  return assetsMaster;
}

export const localAssetsRepository = {
  async listByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => readLocalData().assetsMaster);
  },

  async getByTicker(portfolioId, ticker) {
    const normalizedTicker = normalizeTicker(ticker);
    if (!normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    const assets = await this.listByPortfolio(portfolioId);
    return clone(assets.find((asset) => asset.ticker === normalizedTicker) || null);
  },

  async upsert(input) {
    requirePortfolio(input?.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID);
    const asset = normalizeAssetRecord(clone(input));
    if (!asset) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const map = new Map(readLocalData().assetsMaster.map((item) => [item.ticker, item]));
      map.set(asset.ticker, asset);
      writeAssets([...map.values()]);
      return asset;
    });
  },

  async remove(portfolioId, ticker) {
    requirePortfolio(portfolioId);
    const normalizedTicker = normalizeTicker(ticker);
    if (!normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const current = readLocalData().assetsMaster;
      const next = current.filter((asset) => asset.ticker !== normalizedTicker);
      if (next.length === current.length) {
        throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      }
      writeAssets(next);
      return true;
    });
  },

  async replaceAllByPortfolio(portfolioId, assets) {
    requirePortfolio(portfolioId);
    if (!Array.isArray(assets)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    const normalized = normalizeAssetsMaster(clone(assets));
    if (normalized.length !== assets.length) {
      throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    }
    return writeSafely(() => writeAssets(normalized));
  },
};
