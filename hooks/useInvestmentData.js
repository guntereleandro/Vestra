"use client";
import { useEffect, useMemo, useState } from "react";
import { mergeAssetsMaster } from "@/lib/data/assetsMaster";
import { readLocalData, writeLocalData } from "@/lib/data/storage";
import { calculatePositions } from "@/lib/engine/portfolio";
import { calculatePortfolioTotals } from "@/lib/engine/totals";
export default function useInvestmentData() {
  const [operations, setOperations] = useState([]), [assetsMaster, setAssetsMaster] = useState([]), [assetQuotes, setAssetQuotes] = useState([]), [loaded, setLoaded] = useState(false), [storageError, setStorageError] = useState(false);
  useEffect(() => { try { const data = readLocalData(); setOperations(data.operations); setAssetsMaster(data.assetsMaster); setAssetQuotes(data.quotes); } catch { setStorageError(true); } setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; const merged = mergeAssetsMaster(assetsMaster, operations, assetQuotes); try { writeLocalData({ operations, assetsMaster: merged, quotes: assetQuotes }); setStorageError(false); } catch { setStorageError(true); } }, [operations, assetQuotes, assetsMaster, loaded]);
  const positions = useMemo(() => calculatePositions(operations, assetQuotes, assetsMaster), [operations, assetQuotes, assetsMaster]);
  const totals = useMemo(() => calculatePortfolioTotals(positions), [positions]);
  return { operations, setOperations, assetsMaster, setAssetsMaster, assetQuotes, setAssetQuotes, positions, totals, loaded, storageError };
}
