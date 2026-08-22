import { INITIAL_ASSETS, normalizeTicker } from "../data/assetsMaster.js";

const KNOWN_ETFS = new Set(["BOVA11", "GOLD11", "IVVB11"]);
const KNOWN_FIIS = new Set(["HGLG11", "KNCR11", "MXRF11"]);
const KNOWN_UNITS = new Set(["SANB11", "TAEE11"]);
const ACTION = "A\u00e7\u00e3o";
const UNIT = "A\u00e7\u00e3o/Unit";

function normalizeType(value) {
  const type = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (type.includes("etf")) return "ETF";
  if (type.includes("fii") || type.includes("real estate fund") || type.includes("fundo imobili")) return "FII";
  if (type.includes("unit")) return UNIT;
  if (type.includes("bdr")) return "BDR";
  if (["stock", "acao", "equity", "common", "preferred", "ordinaria", "preferencial"].some((term) => type.includes(term))) return ACTION;
  return "";
}

export function classifyMarketAsset({ ticker, metadataType, catalogType, providerType } = {}) {
  const symbol = normalizeTicker(ticker);
  const explicit = normalizeType(metadataType) || normalizeType(catalogType) || normalizeType(providerType);
  if (explicit) return explicit;
  const catalog = INITIAL_ASSETS.find((asset) => asset.ticker === symbol);
  const catalogResolved = normalizeType(catalog?.type);
  if (catalogResolved) return catalogResolved;
  if (KNOWN_ETFS.has(symbol)) return "ETF";
  if (KNOWN_FIIS.has(symbol)) return "FII";
  if (KNOWN_UNITS.has(symbol)) return UNIT;
  if (/[3-8]$/.test(symbol)) return ACTION;
  return "Outros";
}

export function marketAssetClass(value) {
  return normalizeType(value) || "Ativo";
}
