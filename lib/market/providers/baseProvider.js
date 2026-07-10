/**
 * @typedef {Object} MarketAsset
 * @property {string} ticker
 * @property {string=} name
 * @property {string=} shortName
 * @property {string=} type
 * @property {string=} subtype
 * @property {string=} sector
 * @property {string=} segment
 * @property {string=} country
 * @property {string=} currency
 * @property {string=} exchange
 * @property {string=} isin
 * @property {string=} cnpj
 * @property {string=} logoPath
 * @property {string=} source
 * @property {string=} updatedAt
 *
 * @typedef {Object} MarketQuote
 * @property {string} ticker
 * @property {number} price
 * @property {number=} change
 * @property {number=} changePercent
 * @property {number=} previousClose
 * @property {string=} marketStatus
 * @property {string=} currency
 * @property {string=} source
 * @property {string=} updatedAt
 *
 * @typedef {Object} MarketProvider
 * @property {(query: string, context?: object) => Promise<MarketAsset[]>} searchAssets
 * @property {(ticker: string, context?: object) => Promise<MarketAsset|null>} getAsset
 * @property {(ticker: string, context?: object) => Promise<MarketQuote|null>} getQuote
 * @property {(tickers: string[], context?: object) => Promise<MarketQuote[]>} getQuotes
 * @property {() => Promise<{id: string, name: string, online: boolean, automaticQuotes: boolean, message: string}>} getProviderStatus
 */

export const MARKET_PROVIDER_CONTRACT_VERSION = "1.0.0";
