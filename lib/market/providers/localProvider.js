import { INITIAL_ASSETS, normalizeAssetsMaster, normalizeTicker } from "@/lib/data/assetsMaster";
import { searchAndRankAssets } from "@/lib/market/assetSearch";
import { normalizeMarketAsset, normalizeMarketQuote } from "@/lib/market/marketNormalizers";

function contextAssets(context = {}) {
  return normalizeAssetsMaster(context.assetsMaster?.length ? context.assetsMaster : INITIAL_ASSETS);
}

function contextQuotes(context = {}) {
  return Array.isArray(context.quotes) ? context.quotes : [];
}

export const localProvider = {
  id: "local",
  name: "Cadastro local",

  async searchAssets(query, context = {}) {
    return searchAndRankAssets(query, contextAssets(context)).map((asset) => normalizeMarketAsset(asset, "local")).filter(Boolean);
  },

  async getAsset(ticker, context = {}) {
    const normalizedTicker = normalizeTicker(ticker);
    const asset = contextAssets(context).find((item) => item.ticker === normalizedTicker);
    return normalizeMarketAsset(asset, "local");
  },

  async getQuote(ticker, context = {}) {
    const normalizedTicker = normalizeTicker(ticker);
    const quote = contextQuotes(context).find((item) => item.ticker === normalizedTicker);
    if (!quote) return null;
    return normalizeMarketQuote({ ...quote, price: quote.currentQuote, source: quote.origin || "manual" }, quote.origin || "manual");
  },

  async getQuotes(tickers, context = {}) {
    const results = await Promise.all((tickers || []).map((ticker) => this.getQuote(ticker, context)));
    return results.filter(Boolean);
  },

  async getProviderStatus() {
    return { id: "local", name: "Cadastro local", online: true, automaticQuotes: false, message: "Dados locais e cotacoes manuais disponiveis offline." };
  },
};
