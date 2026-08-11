import { analyzeAllocation } from "./allocationDiagnostics.js";
import { analyzeDiversification } from "./diversificationDiagnostics.js";
import { analyzeIncome } from "./incomeDiagnostics.js";
import { analyzeRisk } from "./riskDiagnostics.js";
import { resolveDiagnosticRules } from "./diagnosticRules.js";
import { createDiagnostic, createScore } from "./diagnosticTypes.js";
import { analyzeStrategy } from "./strategyDiagnostics.js";
import { analyzeRiskProfileCoherence } from "./riskProfileAssessment.js";
import { analyzeBehavior } from "./behaviorDiagnostics.js";

export function generatePortfolioDiagnostics(input = {}) {
  const positions = Array.isArray(input.positions) ? input.positions.filter((item) => item && typeof item === "object") : [];
  const operations = Array.isArray(input.operations) ? input.operations : [];
  const metadata = Array.isArray(input.assetMetadata) ? input.assetMetadata : Array.isArray(input.assetsMetadata) ? input.assetsMetadata : [];
  const metadataByTicker = new Map(metadata.filter((item) => item?.ticker).map((item) => [item.ticker, item]));
  const rules = resolveDiagnosticRules();
  const strategyParameters = input.parameters && typeof input.parameters === "object" ? input.parameters : {};
  const suppliedTotal = Number(input.totals?.current ?? input.totals?.currentValue);
  const calculatedTotal = positions.reduce((sum, position) => sum + (Number.isFinite(Number(position.currentValue)) ? Math.max(0, Number(position.currentValue)) : 0), 0);
  const totalValue = Number.isFinite(suppliedTotal) && suppliedTotal >= 0 ? suppliedTotal : calculatedTotal;
  const allocation = analyzeAllocation(positions, totalValue, rules);
  const diversification = analyzeDiversification(positions, metadataByTicker, rules);
  const income = analyzeIncome(operations, positions, rules, input.income ?? input.proventos);
  const invalidOperations = operations.filter((operation) => !validOperation(operation));
  const dataQuality = analyzeDataQuality({ positions, invalidOperations, metadataByTicker, generatedAt: input.generatedAt, rules });
  const risk = analyzeRisk({ positions, allocation, income, rules });
  const strategyDiagnostics = analyzeStrategy({ positions, totalValue, parameters: strategyParameters, rules: resolveDiagnosticRules(strategyParameters) });
  const profileDiagnostics = analyzeRiskProfileCoherence({ positions, totalValue, riskProfile: input.riskProfile });
  const behavior = analyzeBehavior(operations, input.generatedAt, rules);
  const diagnostics = [...allocation.diagnostics, ...diversification.diagnostics, ...income.diagnostics, ...risk, ...dataQuality.diagnostics, ...strategyDiagnostics, ...profileDiagnostics, ...behavior.diagnostics];
  return {
    generatedAt: validTimestamp(input.generatedAt) ? new Date(input.generatedAt).toISOString() : null,
    summary: buildSummary({ positions, allocation, income, diversification }),
    scores: { diversification: diversification.diversificationScore, concentration: allocation.concentrationScore, income_resilience: income.incomeResilienceScore, data_quality: dataQuality.score, behavior_consistency: behavior.score },
    diagnostics,
    dataQuality: dataQuality.details,
    context: { riskProfileConfigured: Boolean(input.riskProfile?.calculatedProfile), calculatedProfile: input.riskProfile?.calculatedProfile || null, behaviorHistorySufficient: behavior.sufficientHistory, behaviorMetrics: behavior.metrics },
    limitations: globalLimitations({ positions, totalValue, metadataCoverage: dataQuality.details.metadataCoverage, generatedAt: input.generatedAt }),
  };
}

function analyzeDataQuality({ positions, invalidOperations, metadataByTicker, generatedAt, rules }) {
  const missingQuotes = positions.filter((item) => Number(item.quantity) > 0 && !item.hasQuote);
  const reference = validTimestamp(generatedAt) ? new Date(generatedAt) : null;
  const staleQuotes = reference ? positions.filter((item) => item.hasQuote && (!validTimestamp(item.quoteUpdatedAt) || ageDays(item.quoteUpdatedAt, reference) > rules.maxQuoteAgeDays)) : [];
  const enriched = positions.map((item) => ({ ...metadataByTicker.get(item.ticker), ...item }));
  const missingMetadata = enriched.filter((item) => !item.sector || !item.country || !item.currency);
  const quoteCoverage = positions.length ? (positions.length - missingQuotes.length) / positions.length : 0;
  const freshness = reference && positions.length ? (positions.length - staleQuotes.length) / positions.length : 0;
  const metadataCoverage = positions.length ? 1 - missingMetadata.length / positions.length : 0;
  const operationQuality = invalidOperations.length ? 0 : 1;
  const weights = rules.scoreWeights.dataQuality;
  const value = (quoteCoverage * weights.quotes + freshness * weights.quoteFreshness + metadataCoverage * weights.metadata + operationQuality * weights.operations) * 100;
  const diagnostics = [
    qualityDiagnostic("missing-quotes", "Cotações ausentes", missingQuotes, `${missingQuotes.length} posições não possuem cotação válida.`),
    createDiagnostic({ id: "stale-quotes", category: "data_quality", severity: staleQuotes.length ? "medium" : "info", status: reference ? (staleQuotes.length ? "attention" : "observed") : "insufficient_data", title: "Cotações desatualizadas", summary: reference ? `${staleQuotes.length} cotações excedem ${rules.maxQuoteAgeDays} dias ou não possuem data válida.` : "A data de geração é necessária para avaliar a idade das cotações.", evidence: staleQuotes.map((item) => item.ticker), metrics: { staleQuoteCount: staleQuotes.length, maxQuoteAgeDays: rules.maxQuoteAgeDays }, confidence: reference ? 1 : 0, limitations: reference ? [] : ["generatedAt não foi informado."] }),
    qualityDiagnostic("missing-metadata", "Metadados ausentes", missingMetadata, `${missingMetadata.length} posições não possuem setor, país ou moeda completos.`),
    qualityDiagnostic("ignored-invalid-operations", "Operações inválidas ignoradas", invalidOperations, `${invalidOperations.length} operações inválidas foram ignoradas nas análises de renda.`),
    createDiagnostic({ id: "insufficient-history", category: "data_quality", severity: "low", status: "insufficient_data", title: "Histórico insuficiente", summary: "A engine não recebeu uma série histórica patrimonial para análises temporais.", metrics: { historyPoints: 0 }, confidence: 1, limitations: ["Análises temporais não fazem parte do contrato desta etapa."] }),
  ];
  return { diagnostics, score: createScore(value, positions.length ? (reference ? 1 : 0.8) : 0, reference ? [] : ["Sem data de referência, a atualidade das cotações não compõe uma avaliação confiável."]), details: { positionCount: positions.length, missingQuoteCount: missingQuotes.length, staleQuoteCount: staleQuotes.length, missingMetadataCount: missingMetadata.length, invalidOperationsIgnored: invalidOperations.length, quoteCoverage, metadataCoverage } };
}

function qualityDiagnostic(id, title, items, summary) { return createDiagnostic({ id, category: "data_quality", severity: items.length ? "medium" : "info", status: items.length ? "attention" : "observed", title, summary, evidence: items.map((item) => item?.ticker || item?.id || "registro sem identificação"), metrics: { count: items.length }, confidence: 1 }); }
function buildSummary({ positions, allocation, income, diversification }) { const lines = []; if (!positions.length) return ["A carteira não possui posições para diagnóstico."]; if (allocation.largestPosition) lines.push(`A maior posição representa ${Math.round(allocation.largestPosition.percent)}% da carteira.`); lines.push(`Os três maiores ativos concentram ${Math.round(allocation.topThreePercent)}% do patrimônio.`); if (income.total > 0) lines.push(`${Math.round(income.largestSourcePercent)}% dos proventos registrados vieram de um único ativo.`); if (!diversification.counts.sectors) lines.push("Não há dados suficientes para avaliar diversificação setorial."); return lines; }
function globalLimitations({ positions, totalValue, metadataCoverage, generatedAt }) { return [!positions.length && "Carteira vazia.", totalValue <= 0 && "Patrimônio atual indisponível ou igual a zero.", metadataCoverage < 1 && "Metadados incompletos reduzem a confiança das análises relacionadas.", !validTimestamp(generatedAt) && "Sem data de geração, não é possível avaliar a atualidade das cotações.", "Os resultados são fatos descritivos e não constituem recomendação financeira."].filter(Boolean); }
function validOperation(item) { return item && typeof item === "object" && typeof item.ticker === "string" && item.ticker && ["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO", "SPLIT", "BONUS", "CONVERSION", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "FIXED_INCOME_APPLICATION", "FIXED_INCOME_REDEMPTION"].includes(item.operationType) && Number.isFinite(Number(item.totalValue)) && Number(item.totalValue) >= 0; }
function validTimestamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function ageDays(value, reference) { return (reference.getTime() - new Date(value).getTime()) / 86400000; }
