import {
  readDiagnosticPreferences,
  validateDiagnosticPreferences,
  writeDiagnosticPreferences,
} from "../../data/diagnosticPreferences.js";
import { readRiskProfile, validateRiskProfile, writeRiskProfile } from "../../data/riskProfile.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { clone, readSafely, requirePortfolio, writeSafely } from "./localRepositoryUtils.js";

export const localPreferencesRepository = {
  async getByPortfolio(portfolioId) {
    requirePortfolio(portfolioId);
    return readSafely(() => ({
      diagnosticPreferences: readDiagnosticPreferences(),
      riskProfile: readRiskProfile(),
    }));
  },

  async upsertByPortfolio(portfolioId, preferences) {
    requirePortfolio(portfolioId);
    if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
      throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
    }
    return writeSafely(() => {
      const current = {
        diagnosticPreferences: readDiagnosticPreferences(),
        riskProfile: readRiskProfile(),
      };
      if (preferences.diagnosticPreferences !== undefined) {
        const validation = validateDiagnosticPreferences(preferences.diagnosticPreferences);
        if (!validation.valid) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
        current.diagnosticPreferences = writeDiagnosticPreferences(validation.value);
      }
      if (preferences.riskProfile !== undefined) {
        const validation = validateRiskProfile(preferences.riskProfile);
        if (!validation.valid) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
        current.riskProfile = writeRiskProfile(validation.value);
      }
      return clone(current);
    });
  },
};

