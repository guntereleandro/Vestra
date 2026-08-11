import { isPassiveIncomeOperation } from "../../data/operations.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositoryTypes.js";
import { clone, requirePortfolio } from "./localRepositoryUtils.js";
import { localOperationsRepository } from "./localOperationsRepository.js";

function requireDividend(input) {
  if (!input || !isPassiveIncomeOperation(input)) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
}

export const localDividendsRepository = {
  async listByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    const operations = await localOperationsRepository.listByPortfolio(portfolioId);
    return clone(operations.filter(isPassiveIncomeOperation));
  },

  async create(input) {
    requireDividend(input);
    return localOperationsRepository.create({
      ...clone(input),
      portfolioId: input.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID,
    });
  },

  async update(id, input) {
    requireDividend(input);
    const current = await localOperationsRepository.getById(id);
    if (!current || !isPassiveIncomeOperation(current)) {
      throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
    }
    return localOperationsRepository.update(id, {
      ...clone(input),
      portfolioId: input.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID,
    });
  },

  async remove(id) {
    const current = await localOperationsRepository.getById(id);
    if (!current || !isPassiveIncomeOperation(current)) {
      throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
    }
    return localOperationsRepository.remove(id);
  },
};
