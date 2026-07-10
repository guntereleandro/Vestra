"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { mergeAssetsMaster } from "@/lib/data/assetsMaster";
import { readLocalData, registerPortfolioSnapshot, writeLocalData } from "@/lib/data/storage";
import { calculatePositions } from "@/lib/engine/portfolio";
import { calculatePortfolioTotals } from "@/lib/engine/totals";
export default function useInvestmentData() {
  const [operations, setOperations] = useState([]), [assetsMaster, setAssetsMaster] = useState([]), [assetQuotes, setAssetQuotes] = useState([]), [portfolioHistory, setPortfolioHistory] = useState([]), [loaded, setLoaded] = useState(false), [storageError, setStorageError] = useState(false);
  const financeSignature = useRef("");
  useEffect(() => { try { const data = readLocalData(); setOperations(data.operations); setAssetsMaster(data.assetsMaster); setAssetQuotes(data.quotes); setPortfolioHistory(data.migrated ? registerPortfolioSnapshot(data) : data.portfolioHistory); financeSignature.current = JSON.stringify({ operations: data.operations, quotes: data.quotes }); } catch { setStorageError(true); } setLoaded(true); }, []);
  useEffect(() => {
    if (!loaded) return;
    const merged = mergeAssetsMaster(assetsMaster, operations, assetQuotes);
    const nextSignature = JSON.stringify({ operations, quotes: assetQuotes });
    try {
      writeLocalData({ operations, assetsMaster: merged, quotes: assetQuotes });
      if (nextSignature !== financeSignature.current) {
        setPortfolioHistory(registerPortfolioSnapshot({ operations, assetsMaster: merged, quotes: assetQuotes }));
        financeSignature.current = nextSignature;
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [operations, assetQuotes, assetsMaster, loaded]);
  const positions = useMemo(() => calculatePositions(operations, assetQuotes, assetsMaster), [operations, assetQuotes, assetsMaster]);
  const totals = useMemo(() => calculatePortfolioTotals(positions), [positions]);
  return { operations, setOperations, assetsMaster, setAssetsMaster, assetQuotes, setAssetQuotes, portfolioHistory, positions, totals, loaded, storageError };
}
