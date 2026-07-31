import { profilesRepositoryMethods } from "./profilesRepository.js";
import { portfoliosRepositoryMethods } from "./portfoliosRepository.js";
import { operationsRepositoryMethods } from "./operationsRepository.js";
import { dividendsRepositoryMethods } from "./dividendsRepository.js";
import { quotesRepositoryMethods } from "./quotesRepository.js";
import { portfolioSnapshotsRepositoryMethods } from "./portfolioSnapshotsRepository.js";
import { preferencesRepositoryMethods } from "./preferencesRepository.js";
import { assetsRepositoryMethods } from "./assetsRepository.js";

export const repositoryContracts = Object.freeze({
  profiles: profilesRepositoryMethods,
  portfolios: portfoliosRepositoryMethods,
  operations: operationsRepositoryMethods,
  dividends: dividendsRepositoryMethods,
  quotes: quotesRepositoryMethods,
  portfolioSnapshots: portfolioSnapshotsRepositoryMethods,
  preferences: preferencesRepositoryMethods,
  assets: assetsRepositoryMethods,
});

export function validateRepositoryContract(name, repository) {
  const methods = repositoryContracts[name] || [];
  const missingMethods = methods.filter((method) => typeof repository?.[method] !== "function");
  return { valid: missingMethods.length === 0, missingMethods };
}
