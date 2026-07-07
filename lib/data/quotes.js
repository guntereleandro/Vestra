import { ASSET_TYPES } from "@/lib/data/assetsMaster";
import { validDate } from "@/lib/engine/validations";
export const QUOTE_ORIGIN = "manual";
export function normalizeQuotes(value, assets = []) {
  const metadata = new Map(assets.map((asset) => [asset.ticker, asset]));
  const source = Array.isArray(value) ? value : value && typeof value === "object" ? Object.entries(value).map(([ticker, quote]) => typeof quote === "object" ? { ticker, ...quote } : { ticker, currentQuote: quote }) : [];
  return source.flatMap((quote) => { const ticker = typeof quote?.ticker === "string" ? quote.ticker.trim().toUpperCase() : ""; const raw = quote?.currentQuote ?? quote?.cotacaoAtual; if (!ticker || raw === "" || raw === null || raw === undefined || !Number.isFinite(Number(raw)) || Number(raw) < 0) return []; return [{ ticker, currentQuote: Number(raw), updatedAt: validDate(quote.updatedAt || quote.dataAtualizacao) ? (quote.updatedAt || quote.dataAtualizacao) : new Date().toISOString().slice(0, 10), origin: "manual" }]; });
}
