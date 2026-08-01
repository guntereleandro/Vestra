import { brandConfig } from "../config/brandConfig.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
import { supabaseProfilesRepository } from "../repositories/supabase/supabaseProfilesRepository.js";
import { synchronizeLocalCoreDomainToSupabase } from "./coreDomainSyncService.js";
import { selectActiveRemotePortfolio } from "./dataSourceResolver.js";

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

export function setActiveRemotePortfolio(portfolioId) {
  return selectActiveRemotePortfolio(portfolioId);
}

export async function completeRemoteOnboarding({ portfolioName, currency, timezone }) {
  const currentProfile = await supabaseProfilesRepository.getCurrent();
  await supabaseProfilesRepository.upsert({
    displayName: currentProfile?.displayName || "",
    locale: currentProfile?.locale || brandConfig.defaultLocale,
    currency: currency || brandConfig.defaultCurrency,
    timezone: timezone || "America/Sao_Paulo",
  });
  const portfolios = await supabasePortfoliosRepository.list();
  if (portfolios.length) return { profileCreated: !currentProfile, portfolio: portfolios.find((item) => item.isActive) || portfolios[0] };
  const portfolio = await supabasePortfoliosRepository.create({
    name: String(portfolioName || "").trim(),
    baseCurrency: currency || brandConfig.defaultCurrency,
    timezone: timezone || "America/Sao_Paulo",
  });
  return { profileCreated: !currentProfile, portfolio };
}
