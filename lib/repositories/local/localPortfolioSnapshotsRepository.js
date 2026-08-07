import { normalizePortfolioHistory, readPortfolioHistory, writePortfolioHistory } from "../../data/portfolioHistory.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositoryTypes.js";
import { clone, readSafely, requirePortfolio, writeSafely } from "./localRepositoryUtils.js";

export const localPortfolioSnapshotsRepository = {
  async listByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => readPortfolioHistory());
  },

  async getRange(portfolioId, startDate, endDate) {
    requirePortfolio(portfolioId);
    return readSafely(() => readPortfolioHistory().filter((item) => (
      (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate)
    )));
  },

  async getLatest(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => readPortfolioHistory().at(-1) || null);
  },

  async upsertDaily(snapshot) {
    requirePortfolio(snapshot?.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID);
    const [normalized] = normalizePortfolioHistory([clone(snapshot)]);
    if (!normalized) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const history = readPortfolioHistory();
      const index = history.findIndex((item) => item.date === normalized.date);
      if (index >= 0) history[index] = { ...normalized, id: history[index].id || normalized.id };
      else history.push(normalized);
      const saved = writePortfolioHistory(history);
      return saved.find((item) => item.date === normalized.date);
    });
  },

  async removeAllByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return writeSafely(() => {
      writePortfolioHistory([]);
      return true;
    });
  },
};
