"use client";
import { useMemo, useState } from "react";
import { generatePerformanceAnalysis } from "@/lib/engine/performance/performanceEngine";
export default function usePerformanceAnalysis({ history, operations, positions, loaded }) { const [generatedAt] = useState(() => new Date().toISOString()); return useMemo(() => { if (!loaded) return { performance: null, error: null }; try { return { performance: generatePerformanceAnalysis({ history, operations, positions, generatedAt }), error: null }; } catch { return { performance: null, error: "Não foi possível calcular a performance patrimonial." }; } }, [generatedAt, history, loaded, operations, positions]); }
