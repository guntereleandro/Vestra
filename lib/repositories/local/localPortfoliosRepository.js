import { brandConfig } from "../../config/brandConfig.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID, LOCAL_PROFILE_ID } from "../repositoryTypes.js";
import { clone } from "./localRepositoryUtils.js";

let defaultPortfolio = {
  id: LOCAL_DEFAULT_PORTFOLIO_ID,
  profileId: LOCAL_PROFILE_ID,
  name: "Carteira principal",
  baseCurrency: brandConfig.defaultCurrency,
  isActive: true,
};

export const localPortfoliosRepository = {
  async list() {
    return [clone(defaultPortfolio)];
  },

  async getActive() {
    return clone(defaultPortfolio);
  },

  async create() {
    throw repositoryError(REPOSITORY_ERROR_CODES.UNSUPPORTED_OPERATION);
  },

  async update(id, input) {
    if (id !== LOCAL_DEFAULT_PORTFOLIO_ID) {
      throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    }
    defaultPortfolio = {
      ...defaultPortfolio,
      ...clone(input),
      id: LOCAL_DEFAULT_PORTFOLIO_ID,
      profileId: LOCAL_PROFILE_ID,
      isActive: true,
    };
    return clone(defaultPortfolio);
  },

  async setActive(id) {
    if (id !== LOCAL_DEFAULT_PORTFOLIO_ID) {
      throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
    }
    return clone(defaultPortfolio);
  },
};

