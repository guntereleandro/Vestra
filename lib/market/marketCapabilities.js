export const MARKET_CAPABILITY = Object.freeze({
  SEARCH: "search",
  QUOTE: "quote",
  QUOTE_DETAILS: "quoteDetails",
  HISTORICAL_PRICES: "historicalPrices",
  FUNDAMENTALS: "fundamentals",
  DIVIDENDS: "dividends",
  CORPORATE_ACTIONS: "corporateActions",
  ETF_COMPOSITION: "etfComposition",
});

const registry = Object.freeze({
  local: Object.freeze({
    search: true,
    quote: "context-only",
    quoteDetails: false,
    historicalPrices: false,
    fundamentals: false,
    dividends: false,
    corporateActions: false,
    etfComposition: false,
  }),
  brapi: Object.freeze({
    search: true,
    quote: true,
    quoteDetails: true,
    historicalPrices: "free-3-months",
    fundamentals: "plan-dependent",
    dividends: "partial",
    corporateActions: "partial",
    etfComposition: false,
  }),
});

export function getMarketCapabilities(providerId = "local") {
  return registry[providerId] || Object.freeze({});
}

export function providerSupports(providerId, capability) {
  return Boolean(getMarketCapabilities(providerId)[capability]);
}

export function listMarketProviderCapabilities() {
  return registry;
}
