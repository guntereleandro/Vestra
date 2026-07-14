import { createDiagnostic, createScore, clamp } from "./diagnosticTypes.js";

export function analyzeDiversification(positions, metadataByTicker, rules) {
  const held = positions.filter((position) => Number(position.currentValue) > 0 || Number(position.quantity) > 0);
  const enriched = held.map((position) => ({ ...metadataByTicker.get(position.ticker), ...position }));
  const classes = unique(enriched, "type");
  const sectors = unique(enriched, "sector");
  const countries = distribution(enriched, "country");
  const currencies = distribution(enriched, "currency");
  const knownSectors = enriched.filter((item) => item.sector).length;
  const metadataConfidence = held.length ? knownSectors / held.length : 0;
  const diagnostics = [
    createDiagnostic({ id: "asset-count", category: "diversification", severity: held.length && held.length < rules.minimumAssets ? "medium" : "info", status: held.length ? (held.length < rules.minimumAssets ? "attention" : "observed") : "insufficient_data", title: "Quantidade de ativos", summary: held.length ? `A carteira possui ${held.length} ativos com posição.` : "A carteira não possui ativos com posição.", metrics: { assetCount: held.length, minimumAssets: rules.minimumAssets }, confidence: 1 }),
    createDiagnostic({ id: "class-count", category: "diversification", severity: classes.length && classes.length < rules.minimumClasses ? "medium" : "info", status: held.length ? (classes.length < rules.minimumClasses ? "attention" : "observed") : "insufficient_data", title: "Quantidade de classes", summary: held.length ? `${classes.length} classes de ativos foram identificadas.` : "Não há dados suficientes para contar classes de ativos.", evidence: classes, metrics: { classCount: classes.length, minimumClasses: rules.minimumClasses }, confidence: held.length ? classes.length / held.length : 0 }),
    createDiagnostic({ id: "sector-diversification", category: "diversification", status: knownSectors ? "observed" : "insufficient_data", title: "Diversificação setorial", summary: knownSectors ? `${sectors.length} setores conhecidos foram identificados.` : "Não há dados suficientes para avaliar diversificação setorial.", evidence: sectors, metrics: { sectorCount: sectors.length, knownMetadataPercent: held.length ? (knownSectors / held.length) * 100 : 0 }, confidence: metadataConfidence, limitations: knownSectors < held.length ? ["Parte das posições não possui setor informado."] : [] }),
    createDiagnostic({ id: "geographic-currency-exposure", category: "diversification", status: countries.length || currencies.length ? "observed" : "insufficient_data", title: "Exposição por país e moeda", summary: countries.length || currencies.length ? `${countries.length} países e ${currencies.length} moedas possuem dados conhecidos.` : "Não há dados suficientes para avaliar exposição por país e moeda.", evidence: { countries, currencies }, metrics: { countries, currencies }, confidence: metadataCoverage(enriched, ["country", "currency"]), limitations: metadataCoverage(enriched, ["country", "currency"]) < 1 ? ["País ou moeda ausente em parte das posições."] : [] }),
  ];
  const weights = rules.scoreWeights.diversification;
  const assetComponent = Math.min(100, (held.length / rules.minimumAssets) * 100);
  const classComponent = Math.min(100, (classes.length / rules.minimumClasses) * 100);
  const sectorComponent = Math.min(100, (sectors.length / Math.max(1, rules.minimumClasses)) * 100);
  return { diagnostics, counts: { assets: held.length, classes: classes.length, sectors: sectors.length }, diversificationScore: createScore(assetComponent * weights.assets + classComponent * weights.classes + sectorComponent * weights.sectors, held.length ? (0.7 + metadataConfidence * 0.3) : 0, knownSectors < held.length ? ["O componente setorial usa apenas metadados conhecidos."] : []) };
}

const unique = (items, field) => [...new Set(items.map((item) => item[field]).filter(Boolean))].sort();
const distribution = (items, field) => Object.entries(items.reduce((map, item) => { if (item[field]) map[item[field]] = (map[item[field]] || 0) + 1; return map; }, {})).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
const metadataCoverage = (items, fields) => items.length ? items.reduce((sum, item) => sum + fields.filter((field) => item[field]).length, 0) / (items.length * fields.length) : 0;
