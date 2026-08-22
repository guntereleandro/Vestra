"use client";

import { useCallback, useMemo, useState } from "react";
import { searchMarketAssets, getMarketAsset, getMarketQuote, getProviderStatus, fetchAutomaticQuotes } from "@/lib/market/marketService";
import { clearMarketCache, getMarketCacheStats } from "@/lib/market/quoteCache";

const EMPTY_LIST = Object.freeze([]);

export default function useMarketData({ assetsMaster = EMPTY_LIST, quotes = EMPTY_LIST } = {}) {
  const context = useMemo(() => ({ assetsMaster, quotes }), [assetsMaster, quotes]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchAssets = useCallback(async (query) => {
    setLoading(true);
    setError("");
    try {
      return await searchMarketAssets(query, context);
    } catch {
      setError("Nao foi possivel pesquisar ativos.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [context]);

  const getAsset = useCallback(async (ticker) => {
    setLoading(true);
    setError("");
    try {
      return await getMarketAsset(ticker, context);
    } catch {
      setError("Nao foi possivel carregar o ativo.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [context]);

  const getQuote = useCallback(async (ticker) => {
    setLoading(true);
    setError("");
    try {
      return await getMarketQuote(ticker, context);
    } catch {
      setError("Nao foi possivel carregar a cotacao.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [context]);

  const refreshQuotes = useCallback(async (tickers, options) => {
    setLoading(true);
    setError("");
    try {
      return await fetchAutomaticQuotes(tickers, options);
    } catch {
      setError("Nao foi possivel atualizar as cotacoes agora.");
      return { quotes: [], cached: [], fetched: [], notFound: [], failed: [], error: "PROVIDER_ERROR" };
    } finally {
      setLoading(false);
    }
  }, []);

  const providerStatus = useCallback((options) => getProviderStatus(options), []);
  const cacheStats = useCallback(() => getMarketCacheStats(), []);
  const clearCache = useCallback(() => clearMarketCache(), []);

  return { searchAssets, getAsset, getQuote, refreshQuotes, providerStatus, cacheStats, clearCache, loading, error };
}
