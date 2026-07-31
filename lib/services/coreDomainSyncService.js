import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { localAssetsRepository } from "../repositories/local/localAssetsRepository.js";
import { localPreferencesRepository } from "../repositories/local/localPreferencesRepository.js";
import { localQuotesRepository } from "../repositories/local/localQuotesRepository.js";
import { supabaseAssetsRepository } from "../repositories/supabase/supabaseAssetsRepository.js";
import { supabasePreferencesRepository } from "../repositories/supabase/supabasePreferencesRepository.js";
import { supabaseQuotesRepository } from "../repositories/supabase/supabaseQuotesRepository.js";

export async function synchronizeLocalCoreDomainToSupabase(portfolioId) {
  if (!portfolioId) return { synchronized: false, reason: "NO_ACTIVE_PORTFOLIO" };

  const [assets, quotes, preferences] = await Promise.all([
    localAssetsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    localQuotesRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    localPreferencesRepository.getByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
  ]);

  const synchronizedAssets = await supabaseAssetsRepository.replaceAllByPortfolio(portfolioId, assets);
  const synchronizedQuotes = await supabaseQuotesRepository.replaceAllByPortfolio(portfolioId, quotes);
  await supabasePreferencesRepository.upsertByPortfolio(portfolioId, preferences);

  return {
    synchronized: true,
    portfolioId,
    assets: synchronizedAssets.length,
    quotes: synchronizedQuotes.length,
    preferences: 1,
  };
}
