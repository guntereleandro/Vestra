"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_DIAGNOSTIC_PREFERENCES, hasConfiguredDiagnosticPreferences } from "@/lib/data/diagnosticPreferences";
import { getCorePreferences, updateCorePreferences } from "@/lib/services/preferencesService";

export default function useDiagnosticPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_DIAGNOSTIC_PREFERENCES), [loaded, setLoaded] = useState(false), [error, setError] = useState(null);
  useEffect(() => { let cancelled = false; getCorePreferences().then((value) => { if (!cancelled) { setPreferences(value.diagnosticPreferences); setError(null); } }).catch(() => { if (!cancelled) setError("Não foi possível carregar a estratégia."); }).finally(() => { if (!cancelled) setLoaded(true); }); return () => { cancelled = true; }; }, []);
  const savePreferences = useCallback(async (next) => { try { const result = await updateCorePreferences({ diagnosticPreferences: next }); const saved = result.diagnosticPreferences; setPreferences(saved); setError(null); return { ok: true, value: saved }; } catch { setError("Revise os campos antes de salvar."); return { ok: false }; } }, []);
  return { preferences, savePreferences, loaded, error, configured: hasConfiguredDiagnosticPreferences(preferences) };
}
