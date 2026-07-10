import { normalizeAssetsMaster } from "@/lib/data/assetsMaster";

export function normalizeSearchTerm(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function rankAsset(asset, query) {
  const term = normalizeSearchTerm(query);
  if (!term) return 0;
  const ticker = normalizeSearchTerm(asset.ticker);
  const name = normalizeSearchTerm(asset.name);
  const shortName = normalizeSearchTerm(asset.shortName);
  if (ticker === term) return 100;
  if (ticker.startsWith(term)) return 80;
  if (name.startsWith(term) || shortName.startsWith(term)) return 60;
  if (ticker.includes(term)) return 40;
  if (name.includes(term) || shortName.includes(term)) return 25;
  return 0;
}

export function searchAndRankAssets(query, assets = [], limit = 8) {
  return normalizeAssetsMaster(assets)
    .map((asset) => ({ ...asset, rank: rankAsset(asset, query) }))
    .filter((asset) => asset.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.ticker.localeCompare(b.ticker))
    .slice(0, limit);
}

export function mergeRankedAssets(query, groups = [], limit = 12) {
  const map = new Map();
  groups.flat().forEach((asset) => {
    if (!asset?.ticker) return;
    const previous = map.get(asset.ticker);
    map.set(asset.ticker, { ...previous, ...asset, rank: Math.max(previous?.rank || 0, asset.rank || rankAsset(asset, query)) });
  });
  return [...map.values()]
    .map((asset) => ({ ...asset, rank: asset.rank || rankAsset(asset, query) }))
    .sort((a, b) => b.rank - a.rank || a.ticker.localeCompare(b.ticker))
    .slice(0, limit);
}
