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
 * @property {number|null=} open
 * @property {number|null=} dayHigh
 * @property {number|null=} dayLow
 * @property {number=} previousClose
 * @property {number|null=} volume
 * @property {string=} marketStatus
 * @property {string=} currency
 * @property {string=} source
 * @property {string=} updatedAt
 * @property {object=} provenance
 *
 * @typedef {Object} HistoricalPrice
 * @property {string} timestamp
 * @property {number|null} open
 * @property {number|null} high
 * @property {number|null} low
 * @property {number} close
 * @property {number|null} adjustedClose
 * @property {number|null} volume
 *
 * @typedef {Object} MarketProvider
 * @property {(query: string, context?: object) => Promise<MarketAsset[]>} searchAssets
 * @property {(ticker: string, context?: object) => Promise<MarketAsset|null>} getAsset
 * @property {(ticker: string, context?: object) => Promise<MarketQuote|null>} getQuote
 * @property {(tickers: string[], context?: object) => Promise<MarketQuote[]>} getQuotes
 * @property {(ticker: string, options?: object) => Promise<{ticker: string, prices: HistoricalPrice[]}>} [getHistoricalPrices]
 * @property {object} capabilities
 * @property {() => Promise<{id: string, name: string, online: boolean, automaticQuotes: boolean, message: string}>} getProviderStatus
 */

export const MARKET_PROVIDER_CONTRACT_VERSION = "2.0.0";
