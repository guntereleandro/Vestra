"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseIncomeExpectationsRepository } from "@/lib/repositories/supabase/supabaseIncomeExpectationsRepository";
import { DATA_SOURCE, DATA_SOURCE_CHANGED_EVENT } from "@/lib/services/dataSourceResolver";

export default function useAutomaticIncome(dataSource) {
  const [expectations, setExpectations] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [summary, setSummary] = useState(null);
  const load = useCallback(async () => {
    if (dataSource?.source !== DATA_SOURCE.SUPABASE || !dataSource.portfolioId) { setExpectations([]); return; }
    setLoading(true); setError("");
    try { setExpectations(await supabaseIncomeExpectationsRepository.listByPortfolio(dataSource.portfolioId)); }
    catch { setError("Não foi possível carregar os proventos esperados."); }
    finally { setLoading(false); }
  }, [dataSource?.source, dataSource?.portfolioId]);
  useEffect(() => { load(); }, [load]);
  const sync = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetch("/api/income/sync", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); const result = await response.json(); if (!response.ok) throw new Error(result.code); setSummary(result); await load(); return result; } catch { setError("A atualização foi parcial ou não pôde ser concluída."); return null; } finally { setLoading(false); } }, [load]);
  const ignore = useCallback(async (id, reason) => { await supabaseIncomeExpectationsRepository.ignore(id, reason); await load(); }, [load]);
  const restore = useCallback(async (id) => { await supabaseIncomeExpectationsRepository.restore(id); await load(); }, [load]);
  const confirm = useCallback(async (id, date, amount) => { await supabaseIncomeExpectationsRepository.confirm(id, date, amount); window.dispatchEvent(new Event(DATA_SOURCE_CHANGED_EVENT)); await load(); }, [load]);
  const link = useCallback(async (id, operationId) => { await supabaseIncomeExpectationsRepository.link(id, operationId); window.dispatchEvent(new Event(DATA_SOURCE_CHANGED_EVENT)); await load(); }, [load]);
  return { expectations, loading, error, summary, sync, ignore, restore, confirm, link };
}
