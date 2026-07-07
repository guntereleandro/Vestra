export const ASSET_TYPES = ["Ação", "Ação/Unit", "FII", "ETF", "Cripto", "Renda Fixa", "Caixa"];
export const INITIAL_ASSETS = [
  { ticker: "BBAS3", name: "Banco do Brasil", type: "Ação", sector: "Financeiro" },
  { ticker: "PETR4", name: "Petrobras", type: "Ação", sector: "Petróleo, Gás e Biocombustíveis" },
  { ticker: "VALE3", name: "Vale", type: "Ação", sector: "Materiais Básicos" },
  { ticker: "ITSA4", name: "Itaúsa", type: "Ação", sector: "Financeiro" },
  { ticker: "TAEE11", name: "Taesa", type: "Ação/Unit", sector: "Energia Elétrica" },
  { ticker: "MXRF11", name: "Maxi Renda", type: "FII", sector: "Papel" },
  { ticker: "XPML11", name: "XP Malls", type: "FII", sector: "Shoppings" },
  { ticker: "HGLG11", name: "CSHG Logística", type: "FII", sector: "Logística" },
  { ticker: "KNRI11", name: "Kinea Renda Imobiliária", type: "FII", sector: "Híbrido" },
  { ticker: "BTC", name: "Bitcoin", type: "Cripto", sector: "Criptoativos" },
  { ticker: "ETH", name: "Ethereum", type: "Cripto", sector: "Criptoativos" },
].map((asset) => ({ ...asset, segment: "", currency: "BRL", country: "Brasil", notes: "" }));

function searchable(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim(); }
export function searchAssets(query, assets = INITIAL_ASSETS) { const term = searchable(query); if (!term) return []; return assets.filter((asset) => searchable(asset.ticker).includes(term) || searchable(asset.name).includes(term)).slice(0, 8); }
export function normalizeAssetsMaster(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((asset) => { const ticker = typeof asset?.ticker === "string" ? asset.ticker.trim().toUpperCase() : ""; if (!ticker) return []; return [{ ticker, name: typeof asset.name === "string" && asset.name.trim() ? asset.name.trim() : ticker, type: ASSET_TYPES.includes(asset.type) ? asset.type : "Ação", sector: typeof asset.sector === "string" ? asset.sector.trim() : "", segment: typeof asset.segment === "string" ? asset.segment.trim() : "", currency: typeof asset.currency === "string" && asset.currency.trim() ? asset.currency.trim().toUpperCase() : "BRL", country: typeof asset.country === "string" && asset.country.trim() ? asset.country.trim() : "Brasil", notes: typeof asset.notes === "string" ? asset.notes.trim() : "" }]; });
}
export function mergeAssetsMaster(current, operations = [], quotes = []) {
  const map = new Map(INITIAL_ASSETS.map((asset) => [asset.ticker, asset]));
  normalizeAssetsMaster(current).forEach((asset) => map.set(asset.ticker, { ...map.get(asset.ticker), ...asset }));
  operations.forEach((operation) => { const existing = map.get(operation.ticker); map.set(operation.ticker, { ticker: operation.ticker, name: existing?.name || operation.assetName, type: existing?.type || operation.assetType, sector: existing?.sector || "", segment: existing?.segment || "", currency: existing?.currency || "BRL", country: existing?.country || "Brasil", notes: existing?.notes || "" }); });
  quotes.forEach((quote) => { const existing = map.get(quote.ticker); if (!existing) map.set(quote.ticker, { ticker: quote.ticker, name: quote.name || quote.ticker, type: quote.type || "Ação", sector: quote.sector || "", segment: quote.segment || "", currency: quote.currency || "BRL", country: quote.country || "Brasil", notes: quote.notes || "" }); else map.set(quote.ticker, { ...existing, sector: existing.sector || quote.sector || "", notes: existing.notes || quote.notes || "" }); });
  return [...map.values()];
}
