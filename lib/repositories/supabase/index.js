import { supabaseProfilesRepository } from "./supabaseProfilesRepository.js";
import { supabasePortfoliosRepository } from "./supabasePortfoliosRepository.js";
import { supabaseOperationsRepository } from "./supabaseOperationsRepository.js";
import { supabaseDividendsRepository } from "./supabaseDividendsRepository.js";
import { supabaseQuotesRepository } from "./supabaseQuotesRepository.js";
import { supabasePortfolioSnapshotsRepository } from "./supabasePortfolioSnapshotsRepository.js";
import { supabasePreferencesRepository } from "./supabasePreferencesRepository.js";

export const supabaseRepositories = Object.freeze({
  profiles: supabaseProfilesRepository,
  portfolios: supabasePortfoliosRepository,
  operations: supabaseOperationsRepository,
  dividends: supabaseDividendsRepository,
  quotes: supabaseQuotesRepository,
  portfolioSnapshots: supabasePortfolioSnapshotsRepository,
  preferences: supabasePreferencesRepository,
});

