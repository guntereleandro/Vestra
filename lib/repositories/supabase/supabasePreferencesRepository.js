import {
  normalizeDiagnosticPreferences,
  validateDiagnosticPreferences,
} from "../../data/diagnosticPreferences.js";
import { normalizeRiskProfile, validateRiskProfile } from "../../data/riskProfile.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { getSupabaseRepositoryClient, throwSupabaseRepositoryError } from "./supabaseRepositoryUtils.js";

const COLUMNS = [
  "portfolio_id", "max_position_percent", "max_class_percent", "target_allocation",
  "preferred_countries", "preferred_currencies", "risk_profile", "investment_focus",
  "diagnostic_updated_at", "experience_level", "investment_horizon_years",
  "liquidity_need", "income_stability", "loss_tolerance_percent",
  "emergency_reserve_status", "primary_objective", "risk_answers",
  "calculated_profile", "calculated_at", "risk_updated_at",
  "data_source",
].join(", ");

function toRow(portfolioId, preferences) {
  const diagnostic = validateDiagnosticPreferences(preferences?.diagnosticPreferences || {});
  const risk = validateRiskProfile(preferences?.riskProfile || {});
  if (!diagnostic.valid || !risk.valid) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  const d = diagnostic.value;
  const r = risk.value;
  return {
    portfolio_id: portfolioId,
    max_position_percent: d.maxPositionPercent,
    max_class_percent: d.maxClassPercent,
    target_allocation: d.targetAllocation,
    preferred_countries: d.preferredCountries,
    preferred_currencies: d.preferredCurrencies,
    risk_profile: d.riskProfile || null,
    investment_focus: d.investmentFocus || null,
    diagnostic_updated_at: d.updatedAt || null,
    experience_level: r.experienceLevel || null,
    investment_horizon_years: r.investmentHorizonYears,
    liquidity_need: r.liquidityNeed || null,
    income_stability: r.incomeStability || null,
    loss_tolerance_percent: r.lossTolerancePercent,
    emergency_reserve_status: r.emergencyReserveStatus || null,
    primary_objective: r.primaryObjective || null,
    risk_answers: r.answers,
    calculated_profile: r.calculatedProfile || null,
    calculated_at: r.calculatedAt || null,
    risk_updated_at: r.updatedAt || null,
    data_source: preferences.dataSource === "SUPABASE" ? "SUPABASE" : "LOCAL",
  };
}

function fromRow(row) {
  if (!row) {
    return {
      dataSource: "LOCAL",
      diagnosticPreferences: normalizeDiagnosticPreferences(),
      riskProfile: normalizeRiskProfile(),
    };
  }
  return {
    dataSource: row.data_source === "SUPABASE" ? "SUPABASE" : "LOCAL",
    diagnosticPreferences: normalizeDiagnosticPreferences({
      maxPositionPercent: row.max_position_percent,
      maxClassPercent: row.max_class_percent,
      targetAllocation: row.target_allocation,
      preferredCountries: row.preferred_countries,
      preferredCurrencies: row.preferred_currencies,
      riskProfile: row.risk_profile,
      investmentFocus: row.investment_focus,
      updatedAt: row.diagnostic_updated_at,
    }),
    riskProfile: normalizeRiskProfile({
      experienceLevel: row.experience_level,
      investmentHorizonYears: row.investment_horizon_years,
      liquidityNeed: row.liquidity_need,
      incomeStability: row.income_stability,
      lossTolerancePercent: row.loss_tolerance_percent,
      emergencyReserveStatus: row.emergency_reserve_status,
      primaryObjective: row.primary_objective,
      answers: row.risk_answers,
      calculatedProfile: row.calculated_profile,
      calculatedAt: row.calculated_at,
      updatedAt: row.risk_updated_at,
    }),
  };
}

export function createSupabasePreferencesRepository(client) {
  return {
    async getByPortfolio(portfolioId) {
      if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_preferences").select(COLUMNS).eq("portfolio_id", portfolioId).maybeSingle();
      throwSupabaseRepositoryError(error);
      return fromRow(data);
    },

    async upsertByPortfolio(portfolioId, preferences) {
      if (!portfolioId || !preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
        throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      }
      const current = await this.getByPortfolio(portfolioId);
      const merged = {
        dataSource: preferences.dataSource === undefined
          ? current.dataSource
          : preferences.dataSource,
        diagnosticPreferences: preferences.diagnosticPreferences === undefined
          ? current.diagnosticPreferences
          : { ...current.diagnosticPreferences, ...preferences.diagnosticPreferences },
        riskProfile: preferences.riskProfile === undefined
          ? current.riskProfile
          : { ...current.riskProfile, ...preferences.riskProfile },
      };
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_preferences").upsert(toRow(portfolioId, merged), {
          onConflict: "portfolio_id",
        }).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },
  };
}

export const supabasePreferencesRepository = createSupabasePreferencesRepository();
