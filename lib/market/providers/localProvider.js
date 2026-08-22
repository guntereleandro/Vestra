import { INITIAL_ASSETS, normalizeAssetsMaster, normalizeTicker } from "@/lib/data/assetsMaster";
import { searchAndRankAssets } from "@/lib/market/assetSearch";
import { normalizeMarketAsset, normalizeMarketQuote } from "@/lib/market/marketNormalizers";
import { getMarketCapabilities } from "@/lib/market/marketCapabilities";

function contextAssets(context = {}) {
  return normalizeAssetsMaster(context.assetsMaster?.length ? context.assetsMaster : INITIAL_ASSETS);
}

function contextQuotes(context = {}) {
  return Array.isArray(context.quotes) ? context.quotes : [];
}

export const localProvider = {
  id: "local",
  name: "Cadastro local",
  capabilities: getMarketCapabilities("local"),

  async searchAssets(query, context = {}) {
    return searchAndRankAssets(query, contextAssets(context)).map((asset) => normalizeMarketAsset({ ...asset, updatedAt: null, fallback: true }, "local")).filter(Boolean);
  },

  async getAsset(ticker, context = {}) {
    const normalizedTicker = normalizeTicker(ticker);
    const asset = contextAssets(context).find((item) => item.ticker === normalizedTicker);
    return normalizeMarketAsset(asset ? { ...asset, updatedAt: null, fallback: true } : asset, "local");
  },

  async getQuote(ticker, context = {}) {
    const normalizedTicker = normalizeTicker(ticker);
    const quote = contextQuotes(context).find((item) => item.ticker === normalizedTicker);
    if (!quote) return null;
    const normalized = normalizeMarketQuote({ ...quote, price: quote.currentQuote, source: quote.origin || "manual", fallback: true }, quote.origin || "manual");
    return normalized ? { ...normalized, manualOverride: quote.manualOverride === true } : null;
  },

  async getQuotes(tickers, context = {}) {
    const results = await Promise.all((tickers || []).map((ticker) => this.getQuote(ticker, context)));
    return results.filter(Boolean);
  },

  async getProviderStatus() {
    return { id: "local", name: "Cadastro local", online: true, connectivity: "local", configured: true, automaticQuotes: false, capabilities: this.capabilities, message: "Dados locais e cotacoes manuais disponiveis offline." };
  },
};
