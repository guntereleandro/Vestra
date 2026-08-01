"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeAssetsMaster } from "@/lib/data/assetsMaster";
import { calculatePositions } from "@/lib/engine/portfolio";
import { calculatePortfolioTotals } from "@/lib/engine/totals";
import { loadPortfolioData, savePortfolioData } from "@/lib/services/portfolioDataService";
import { createOperation, removeOperation, updateOperation } from "@/lib/services/operationsService";
import { registerPortfolioSnapshot } from "@/lib/services/snapshotsService";
import {
  activateLocalSessionFallback,
  DATA_SOURCE,
  DATA_SOURCE_CHANGED_EVENT,
  getDataSourceErrorMessage,
} from "@/lib/services/dataSourceResolver";

const LOCAL_SOURCE = Object.freeze({
  source: DATA_SOURCE.LOCAL,
  portfolioId: "local-default-portfolio",
  portfolioName: "Carteira local",
  role: "owner",
  canWrite: true,
  operationCount: 0,
  updatedAt: "",
  loadedAt: "",
});

export default function useInvestmentData() {
  const [operations, setOperations] = useState([]);
  const [assetsMaster, setAssetsMaster] = useState([]);
  const [assetQuotes, setAssetQuotes] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [portfolioHistoryUnavailable, setPortfolioHistoryUnavailable] = useState(false);
  const [dataSource, setDataSource] = useState(LOCAL_SOURCE);
  const [sourceError, setSourceError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [revision, setRevision] = useState(0);
  const financeSignature = useRef("");

  useEffect(() => {
    const reload = () => {
      setOperations([]);
      setAssetsMaster([]);
      setAssetQuotes([]);
      setPortfolioHistory([]);
      setLoaded(false);
      setRevision((current) => current + 1);
    };
    window.addEventListener(DATA_SOURCE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(DATA_SOURCE_CHANGED_EVENT, reload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSourceError(null);
      try {
        const data = await loadPortfolioData();
        if (cancelled) return;
        setOperations(data.operations);
        setAssetsMaster(data.assetsMaster);
        setAssetQuotes(data.quotes);
        setPortfolioHistory(data.migrated ? await registerPortfolioSnapshot(data) : data.portfolioHistory);
        setPortfolioHistoryUnavailable(data.portfolioHistoryUnavailable);
        setDataSource(data.dataSource);
        financeSignature.current = JSON.stringify({ operations: data.operations, quotes: data.quotes });
      } catch (error) {
        if (!cancelled) {
          setSourceError({ code: error?.code || "REMOTE_UNAVAILABLE", message: getDataSourceErrorMessage(error) });
          setStorageError(true);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [revision]);

  useEffect(() => {
    if (!loaded || sourceError || dataSource.source !== DATA_SOURCE.LOCAL) return;
    const merged = mergeAssetsMaster(assetsMaster, operations, assetQuotes);
    const nextSignature = JSON.stringify({ operations, quotes: assetQuotes });
    let cancelled = false;
    async function persist() {
      try {
        await savePortfolioData({ operations, assetsMaster: merged, quotes: assetQuotes });
        if (nextSignature !== financeSignature.current) {
          const history = await registerPortfolioSnapshot({ operations, assetsMaster: merged, quotes: assetQuotes });
          if (!cancelled) setPortfolioHistory(history);
          financeSignature.current = nextSignature;
        }
        if (!cancelled) setStorageError(false);
      } catch {
        if (!cancelled) setStorageError(true);
      }
    }
    persist();
    return () => { cancelled = true; };
  }, [operations, assetQuotes, assetsMaster, dataSource.source, loaded, sourceError]);

  const addOperation = useCallback(async (operation) => {
    try {
      const saved = await createOperation(operation);
      setOperations((current) => [saved, ...current]);
      setDataSource((current) => ({ ...current, operationCount: current.operationCount + 1, updatedAt: saved.updatedAt || current.updatedAt }));
      setStorageError(false);
      return { ok: true, value: saved };
    } catch (error) {
      setStorageError(true);
      return { ok: false, error };
    }
  }, []);
  const editOperation = useCallback(async (id, operation) => {
    try {
      const saved = await updateOperation(id, operation);
      setOperations((current) => current.map((item) => item.id === id ? saved : item));
      setDataSource((current) => ({ ...current, updatedAt: saved.updatedAt || current.updatedAt }));
      setStorageError(false);
      return { ok: true, value: saved };
    } catch (error) {
      setStorageError(true);
      return { ok: false, error };
    }
  }, []);
  const deleteOperation = useCallback(async (id) => {
    try {
      await removeOperation(id);
      setOperations((current) => current.filter((item) => item.id !== id));
      setDataSource((current) => ({ ...current, operationCount: Math.max(0, current.operationCount - 1) }));
      setStorageError(false);
      return { ok: true };
    } catch (error) {
      setStorageError(true);
      return { ok: false, error };
    }
  }, []);
  const useLocalSource = useCallback(() => activateLocalSessionFallback(), []);
  const positions = useMemo(() => calculatePositions(operations, assetQuotes, assetsMaster), [operations, assetQuotes, assetsMaster]);
  const totals = useMemo(() => calculatePortfolioTotals(positions), [positions]);
  return {
    operations, setOperations, addOperation, editOperation, deleteOperation,
    assetsMaster, setAssetsMaster, assetQuotes, setAssetQuotes,
    portfolioHistory, portfolioHistoryUnavailable, positions, totals,
    loaded, storageError, sourceError, dataSource, useLocalSource,
  };
}
