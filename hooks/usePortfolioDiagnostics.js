"use client";

import { useMemo, useState } from "react";
import { generatePortfolioDiagnostics } from "@/lib/engine/diagnostics";
import useRiskProfile from "@/hooks/useRiskProfile";

export default function usePortfolioDiagnostics({ positions, operations, totals, assetMetadata, parameters, riskProfile, loaded }) {
  const [generatedAt] = useState(() => new Date().toISOString());
  const localRisk = useRiskProfile();
  const effectiveRiskProfile = riskProfile || (localRisk.configured ? localRisk.riskProfile : undefined);

  return useMemo(() => {
    if (!loaded || !localRisk.loaded) return { diagnosticsResult: null, diagnosticsError: null };
    try {
      return {
        diagnosticsResult: generatePortfolioDiagnostics({ positions, operations, totals, assetMetadata, parameters, riskProfile: effectiveRiskProfile, generatedAt }),
        diagnosticsError: null,
      };
    } catch {
      return { diagnosticsResult: null, diagnosticsError: "Não foi possível calcular o diagnóstico neste momento." };
    }
  }, [assetMetadata, effectiveRiskProfile, generatedAt, loaded, localRisk.loaded, operations, parameters, positions, totals]);
}
