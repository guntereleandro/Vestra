import { repositoryContracts, validateRepositoryContract } from "./contracts/index.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "./repositoryErrors.js";
import { REPOSITORY_PROVIDER } from "./repositoryTypes.js";
import { localProfilesRepository } from "./local/localProfilesRepository.js";
import { localPortfoliosRepository } from "./local/localPortfoliosRepository.js";
import { localOperationsRepository } from "./local/localOperationsRepository.js";
import { localDividendsRepository } from "./local/localDividendsRepository.js";
import { localQuotesRepository } from "./local/localQuotesRepository.js";
import { localPortfolioSnapshotsRepository } from "./local/localPortfolioSnapshotsRepository.js";
import { localPreferencesRepository } from "./local/localPreferencesRepository.js";
import { localCoreDataRepository } from "./local/localCoreDataRepository.js";
import { supabaseRepositories } from "./supabase/index.js";

const localRepositories = Object.freeze({
  profiles: localProfilesRepository,
  portfolios: localPortfoliosRepository,
  operations: localOperationsRepository,
  dividends: localDividendsRepository,
  quotes: localQuotesRepository,
  portfolioSnapshots: localPortfolioSnapshotsRepository,
  preferences: localPreferencesRepository,
  coreData: localCoreDataRepository,
});

const repositoriesByProvider = Object.freeze({
  [REPOSITORY_PROVIDER.LOCAL]: localRepositories,
  [REPOSITORY_PROVIDER.SUPABASE]: supabaseRepositories,
});

let provider = REPOSITORY_PROVIDER.LOCAL;

function assertComplete(repositories) {
  for (const name of Object.keys(repositoryContracts)) {
    const validation = validateRepositoryContract(name, repositories[name]);
    if (!validation.valid) {
      throw repositoryError(REPOSITORY_ERROR_CODES.REPOSITORY_NOT_INITIALIZED, {
        details: { repository: name, missingMethods: validation.missingMethods },
      });
    }
  }
}

export function getRepositoryProvider() {
  return provider;
}

export function setRepositoryProvider(nextProvider) {
  if (!repositoriesByProvider[nextProvider]) {
    throw repositoryError(REPOSITORY_ERROR_CODES.UNSUPPORTED_OPERATION);
  }
  provider = nextProvider;
}

export function getRepositories() {
  const repositories = repositoriesByProvider[provider];
  if (!repositories) {
    throw repositoryError(REPOSITORY_ERROR_CODES.REPOSITORY_NOT_INITIALIZED);
  }
  assertComplete(repositories);
  return repositories;
}
