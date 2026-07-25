import { getRepositories } from "../repositories/repositoryRegistry.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";

export async function listOperations(portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().operations.listByPortfolio(portfolioId);
}

export async function createOperation(input, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().operations.create({ ...input, portfolioId });
}

export async function updateOperation(id, input, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().operations.update(id, { ...input, portfolioId });
}

export async function removeOperation(id) {
  return getRepositories().operations.remove(id);
}

export async function replaceOperations(operations, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().operations.replaceAllByPortfolio(portfolioId, operations);
}

