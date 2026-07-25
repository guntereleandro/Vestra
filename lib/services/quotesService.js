import { getRepositories } from "../repositories/repositoryRegistry.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";

export async function listQuotes(portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().quotes.listByPortfolio(portfolioId);
}

export async function upsertQuote(quote, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().quotes.upsert({ ...quote, portfolioId });
}

export async function removeQuote(ticker, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().quotes.remove(portfolioId, ticker);
}

export async function replaceQuotes(quotes, portfolioId = LOCAL_DEFAULT_PORTFOLIO_ID) {
  return getRepositories().quotes.replaceAllByPortfolio(portfolioId, quotes);
}

