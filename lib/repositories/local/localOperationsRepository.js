import { isOperationUuid, normalizeOperations, validatePortfolioEvent } from "../../data/operations.js";
import { readLocalData, writeLocalData } from "../../data/storage.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositoryTypes.js";
import { clone, readSafely, requirePortfolio, writeSafely } from "./localRepositoryUtils.js";

function normalizeOne(input, expectedId) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
  const source = { ...clone(input), id: expectedId || input.id };
  const [normalized] = normalizeOperations([source]);
  if (!normalized || !isOperationUuid(normalized.id) || (expectedId && normalized.id !== expectedId) || !validatePortfolioEvent(normalized).valid) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
  return normalized;
}

function normalizeAll(operations) {
  if (!Array.isArray(operations)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  const normalized = normalizeOperations(clone(operations));
  if (normalized.length !== operations.length) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
  const ids = new Set(normalized.map((item) => item.id));
  if (ids.size !== normalized.length) throw repositoryError(REPOSITORY_ERROR_CODES.CONFLICT);
  return normalized;
}

function writeOperations(operations) {
  const data = readLocalData();
  writeLocalData({ operations, assetsMaster: data.assetsMaster, quotes: data.quotes });
  return operations;
}

export const localOperationsRepository = {
  async listByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => readLocalData().operations);
  },

  async getById(id) {
    if (!id) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    const operations = await this.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
    return clone(operations.find((item) => item.id === id) || null);
  },

  async create(input) {
    requirePortfolio(input?.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID);
    const operation = normalizeOne(input);
    return writeSafely(() => {
      const current = readLocalData().operations;
      if (current.some((item) => item.id === operation.id)) {
        throw repositoryError(REPOSITORY_ERROR_CODES.CONFLICT);
      }
      writeOperations([operation, ...current]);
      return operation;
    });
  },

  async update(id, input) {
    if (!id) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    requirePortfolio(input?.portfolioId || LOCAL_DEFAULT_PORTFOLIO_ID);
    const operation = normalizeOne(input, id);
    return writeSafely(() => {
      const current = readLocalData().operations;
      if (!current.some((item) => item.id === id)) {
        throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      }
      writeOperations(current.map((item) => item.id === id ? operation : item));
      return operation;
    });
  },

  async remove(id) {
    if (!id) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    return writeSafely(() => {
      const current = readLocalData().operations;
      const next = current.filter((item) => item.id !== id);
      if (next.length === current.length) {
        throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      }
      writeOperations(next);
      return true;
    });
  },

  async replaceAllByPortfolio(portfolioId, operations) {
    requirePortfolio(portfolioId);
    const normalized = normalizeAll(operations);
    return writeSafely(() => writeOperations(normalized));
  },
};
