import { brandConfig } from "../../config/brandConfig.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { LOCAL_PROFILE_ID } from "../repositoryTypes.js";
import { clone } from "./localRepositoryUtils.js";

let currentProfile = {
  id: LOCAL_PROFILE_ID,
  displayName: "",
  locale: brandConfig.defaultLocale,
  currency: brandConfig.defaultCurrency,
};

export const localProfilesRepository = {
  async getCurrent() {
    return clone(currentProfile);
  },

  async upsert(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    }
    currentProfile = {
      ...currentProfile,
      ...clone(profile),
      id: LOCAL_PROFILE_ID,
    };
    return clone(currentProfile);
  },
};

