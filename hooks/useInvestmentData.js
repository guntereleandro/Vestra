"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeAssetsMaster } from "@/lib/data/assetsMaster";
import { calculatePositions } from "@/lib/engine/portfolio";
import { calculatePortfolioTotals } from "@/lib/engine/totals";
import { loadPortfolioData, savePortfolioData } from "@/lib/services/portfolioDataService";
import { createOperation, removeOperation, updateOperation } from "@/lib/services/operationsService";
import { registerPortfolioSnapshot } from "@/lib/services/snapshotsService";
export default function useInvestmentData() {
  const [operations, setOperations] = useState([]), [assetsMaster, setAssetsMaster] = useState([]), [assetQuotes, setAssetQuotes] = useState([]), [portfolioHistory, setPortfolioHistory] = useState([]), [loaded, setLoaded] = useState(false), [storageError, setStorageError] = useState(false);
  const financeSignature = useRef("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await loadPortfolioData();
        if (cancelled) return;
        setOperations(data.operations);
        setAssetsMaster(data.assetsMaster);
        setAssetQuotes(data.quotes);
        setPortfolioHistory(data.migrated ? await registerPortfolioSnapshot(data) : data.portfolioHistory);
        financeSignature.current = JSON.stringify({ operations: data.operations, quotes: data.quotes });
      } catch {
        if (!cancelled) setStorageError(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
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
  }, [operations, assetQuotes, assetsMaster, loaded]);
  const addOperation = useCallback(async (operation) => {
    try {
      const saved = await createOperation(operation);
      setOperations((current) => [saved, ...current]);
      setStorageError(false);
      return { ok: true, value: saved };
    } catch {
      setStorageError(true);
      return { ok: false };
    }
  }, []);
  const editOperation = useCallback(async (id, operation) => {
    try {
      const saved = await updateOperation(id, operation);
      setOperations((current) => current.map((item) => item.id === id ? saved : item));
      setStorageError(false);
      return { ok: true, value: saved };
    } catch {
      setStorageError(true);
      return { ok: false };
    }
  }, []);
  const deleteOperation = useCallback(async (id) => {
    try {
      await removeOperation(id);
      setOperations((current) => current.filter((item) => item.id !== id));
      setStorageError(false);
      return { ok: true };
    } catch {
      setStorageError(true);
      return { ok: false };
    }
  }, []);
  const positions = useMemo(() => calculatePositions(operations, assetQuotes, assetsMaster), [operations, assetQuotes, assetsMaster]);
  const totals = useMemo(() => calculatePortfolioTotals(positions), [positions]);
  return { operations, setOperations, addOperation, editOperation, deleteOperation, assetsMaster, setAssetsMaster, assetQuotes, setAssetQuotes, portfolioHistory, positions, totals, loaded, storageError };
}
