import { REPOSITORY_ERROR_CODES, asStorageError, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID, isLocalPortfolio } from "../repositoryTypes.js";

let localWriteQueue = Promise.resolve();

export function clone(value) {
  if (value === undefined) return undefined;
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function requireLocalStorage() {
  if (typeof localStorage === "undefined") {
    throw repositoryError(REPOSITORY_ERROR_CODES.REPOSITORY_NOT_INITIALIZED);
  }
  return localStorage;
}

export function requirePortfolio(portfolioId) {
  if (!isLocalPortfolio(portfolioId)) {
    throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND, {
      details: { entity: "portfolio", id: portfolioId || null },
    });
  }
  return LOCAL_DEFAULT_PORTFOLIO_ID;
}

export async function readSafely(reader) {
  requireLocalStorage();
  try {
    return clone(reader());
  } catch (error) {
    throw asStorageError(error, "read");
  }
}

export function writeSafely(writer) {
  requireLocalStorage();
  const task = async () => {
    try {
      return clone(writer());
    } catch (error) {
      throw asStorageError(error, "write");
    }
  };
  localWriteQueue = localWriteQueue.then(task, task);
  return localWriteQueue;
}
