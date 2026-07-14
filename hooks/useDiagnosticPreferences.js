"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_DIAGNOSTIC_PREFERENCES, hasConfiguredDiagnosticPreferences, readDiagnosticPreferences, writeDiagnosticPreferences } from "@/lib/data/diagnosticPreferences";

export default function useDiagnosticPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_DIAGNOSTIC_PREFERENCES), [loaded, setLoaded] = useState(false), [error, setError] = useState(null);
  useEffect(() => { try { setPreferences(readDiagnosticPreferences()); } catch { setError("Não foi possível carregar a estratégia."); } setLoaded(true); }, []);
  const savePreferences = useCallback((next) => { try { const saved = writeDiagnosticPreferences(next); setPreferences(saved); setError(null); return { ok: true, value: saved }; } catch { setError("Revise os campos antes de salvar."); return { ok: false }; } }, []);
  return { preferences, savePreferences, loaded, error, configured: hasConfiguredDiagnosticPreferences(preferences) };
}
