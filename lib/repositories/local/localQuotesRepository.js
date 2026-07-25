import { normalizeQuoteRecord, normalizeQuotes } from "../../data/quotes.js";
import { normalizeTicker } from "../../data/assetsMaster.js";
import { readLocalData, writeLocalData } from "../../data/storage.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositoryTypes.js";
import { clone, readSafely, requirePortfolio, writeSafely } from "./localRepositoryUtils.js";

function writeQuotes(quotes) {
  const data = readLocalData();
  writeLocalData({ operations: data.operations, assetsMaster: data.assetsMaster, quotes });
  return quotes;
}

export const localQuotesRepository = {
  async listByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => readLocalData().quotes);
  },

  async getByTicker(portfolioId, ticker) {
    const normalizedTicker = normalizeTicker(ticker);
    if (!normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    const quotes = await this.listByPortfolio(portfolioId);
    return clone(quotes.find((item) => item.ticker === normalizedTicker) || null);
  },

  async upsert(input) {
    requirePortfolio(input?.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID);
    const quote = normalizeQuoteRecord(clone(input));
    if (!quote) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const map = new Map(readLocalData().quotes.map((item) => [item.ticker, item]));
      map.set(quote.ticker, quote);
      writeQuotes([...map.values()]);
      return quote;
    });
  },

  async remove(portfolioId, ticker) {
    requirePortfolio(portfolioId);
    const normalizedTicker = normalizeTicker(ticker);
    if (!normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const current = readLocalData().quotes;
      const next = current.filter((item) => item.ticker !== normalizedTicker);
      if (next.length === current.length) {
        throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      }
      writeQuotes(next);
      return true;
    });
  },

  async replaceAllByPortfolio(portfolioId, quotes) {
    requirePortfolio(portfolioId);
    if (!Array.isArray(quotes)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    const normalized = normalizeQuotes(clone(quotes));
    if (normalized.length !== quotes.length) {
      throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    }
    return writeSafely(() => writeQuotes(normalized));
  },
};

