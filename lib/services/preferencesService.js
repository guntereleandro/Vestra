import { getRepositories } from "../repositories/repositoryRegistry.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";

export async function getCorePreferences(portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().preferences.getByPortfolio(portfolioId);
}

export async function updateCorePreferences(preferences, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().preferences.upsertByPortfolio(portfolioId, preferences);
}

