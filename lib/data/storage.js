import { INITIAL_ASSETS, mergeAssetsMaster, normalizeAssetsMaster } from "@/lib/data/assetsMaster";
import { normalizeOperations } from "@/lib/data/operations";
import { normalizeQuotes } from "@/lib/data/quotes";
import { nonNegativeNumber } from "@/lib/engine/validations";

export const STORAGE_KEYS = { operations: "vestra:operations:v1", assetsMaster: "vestra:assetsMaster:v1", quotes: "vestra:assetQuotes:v1", legacyAssets: "vestra:assets:v1", legacyQuotes: "vestra:quotes:v1", migration: "vestra:migration:operations:v1" };
export const BACKUP_VERSION = 1;
function parse(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
export function readLocalData() {
  const rawOperations = localStorage.getItem(STORAGE_KEYS.operations);
  let operations = normalizeOperations(parse(rawOperations, []));
  let assetsMaster = normalizeAssetsMaster(parse(localStorage.getItem(STORAGE_KEYS.assetsMaster), []));
  const quoteSource = localStorage.getItem(STORAGE_KEYS.quotes) || localStorage.getItem(STORAGE_KEYS.legacyQuotes), rawQuotes = parse(quoteSource, []);
  const legacyQuoteRecords = Array.isArray(rawQuotes) ? rawQuotes : Object.entries(rawQuotes || {}).map(([ticker, quote]) => typeof quote === "object" ? { ticker, ...quote } : { ticker, currentQuote: quote });
  assetsMaster = mergeAssetsMaster(assetsMaster, operations, legacyQuoteRecords);
  let quotes = normalizeQuotes(rawQuotes, assetsMaster);
  if (rawOperations === null && !localStorage.getItem(STORAGE_KEYS.migration)) {
    const legacy = parse(localStorage.getItem(STORAGE_KEYS.legacyAssets), []), date = new Date().toISOString().slice(0, 10), migratedOperations = [], migratedQuotes = [];
    legacy.forEach((asset, index) => { const ticker = typeof asset?.ticker === "string" ? asset.ticker.trim().toUpperCase() : "", name = typeof asset?.name === "string" ? asset.name.trim() : "", held = nonNegativeNumber(asset?.quantity); if (!ticker || !name || held <= 0) return; const type = asset.type || "Ação", unitPrice = nonNegativeNumber(asset.averagePrice); migratedOperations.push({ id: `migration-buy-${asset.id || index}`, ticker, assetName: name, assetType: type, operationType: "COMPRA", date, quantity: held, unitPrice, fees: 0, totalValue: held * unitPrice, notes: "Posição migrada da primeira versão do Vestra." }); const dividends = nonNegativeNumber(asset.dividends); if (dividends > 0) migratedOperations.push({ id: `migration-income-${asset.id || index}`, ticker, assetName: name, assetType: type, operationType: type === "FII" ? "RENDIMENTO" : "DIVIDENDO", date, quantity: 0, unitPrice: 0, fees: 0, totalValue: dividends, notes: "Proventos migrados da primeira versão do Vestra." }); if (asset.currentPrice !== "" && asset.currentPrice != null && Number.isFinite(Number(asset.currentPrice))) migratedQuotes.push({ ticker, currentQuote: Number(asset.currentPrice), updatedAt: date, origin: "manual", name, type }); });
    operations = normalizeOperations(migratedOperations); quotes = normalizeQuotes([...migratedQuotes, ...quotes], assetsMaster); localStorage.setItem(STORAGE_KEYS.migration, "completed");
  }
  assetsMaster = mergeAssetsMaster(assetsMaster, operations, quotes);
  return { operations, assetsMaster, quotes };
}
export function writeLocalData({ operations, assetsMaster, quotes }) { localStorage.setItem(STORAGE_KEYS.operations, JSON.stringify(normalizeOperations(operations))); localStorage.setItem(STORAGE_KEYS.assetsMaster, JSON.stringify(normalizeAssetsMaster(assetsMaster))); localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(normalizeQuotes(quotes, assetsMaster))); }

function customizedAssets(assets) {
  const initial = new Map(INITIAL_ASSETS.map((asset) => [asset.ticker, asset]));
  return normalizeAssetsMaster(assets).filter((asset) => { const base = initial.get(asset.ticker); return !base || ["name", "type", "sector", "segment", "currency", "country", "notes"].some((field) => asset[field] !== base[field]); });
}

export function createBackup() {
  const data = readLocalData();
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), operations: data.operations, quotes: data.quotes, assetsMaster: customizedAssets(data.assetsMaster) };
}

export function validateBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_STRUCTURE");
  if (value.version !== BACKUP_VERSION) throw new Error("UNKNOWN_VERSION");
  if (!Array.isArray(value.operations) || !Array.isArray(value.quotes) || !Array.isArray(value.assetsMaster)) throw new Error("INVALID_STRUCTURE");
  return { operations: normalizeOperations(value.operations), assetsMaster: normalizeAssetsMaster(value.assetsMaster), quotes: normalizeQuotes(value.quotes, value.assetsMaster) };
}

export function restoreBackup(value) { const data = validateBackup(value); writeLocalData(data); localStorage.setItem(STORAGE_KEYS.migration, "completed"); }
export function clearVestraData() { Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key)); }
