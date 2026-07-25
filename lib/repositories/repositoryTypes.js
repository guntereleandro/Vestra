export const REPOSITORY_PROVIDER = Object.freeze({
  LOCAL: "local",
  SUPABASE: "supabase",
});

export const LOCAL_PROFILE_ID = "local-profile";
export const LOCAL_DEFAULT_PORTFOLIO_ID = "local-default-portfolio";

export const REPOSITORY_DOMAINS = Object.freeze([
  "profiles",
  "portfolios",
  "operations",
  "dividends",
  "quotes",
  "portfolioSnapshots",
  "preferences",
]);

export function isLocalPortfolio(portfolioId) {
  return portfolioId === LOCAL_DEFAULT_PORTFOLIO_ID;
}

