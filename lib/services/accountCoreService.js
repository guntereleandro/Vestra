import { brandConfig } from "../config/brandConfig.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
import { supabaseProfilesRepository } from "../repositories/supabase/supabaseProfilesRepository.js";
import { synchronizeLocalCoreDomainToSupabase } from "./coreDomainSyncService.js";

export async function ensureCurrentRemoteProfile(user) {
  const current = await supabaseProfilesRepository.getCurrent();
  if (current) return current;
  return supabaseProfilesRepository.upsert({
    displayName: user?.user_metadata?.display_name || "",
    locale: brandConfig.defaultLocale,
    currency: brandConfig.defaultCurrency,
    timezone: "America/Sao_Paulo",
  });
}

export function listRemotePortfolios() {
  return supabasePortfoliosRepository.list();
}

export function createRemotePortfolio(input) {
  return supabasePortfoliosRepository.create(input);
}

export async function synchronizeActiveRemotePortfolio() {
  const portfolio = await supabasePortfoliosRepository.getActive();
  return synchronizeLocalCoreDomainToSupabase(portfolio?.id);
}
