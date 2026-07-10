export const ASSET_TYPES = ["Ação", "Ação/Unit", "FII", "ETF", "BDR", "Cripto", "Renda Fixa", "Caixa", "Outros"];

export const INITIAL_ASSETS = [
  { ticker: "BBAS3", name: "Banco do Brasil", shortName: "Banco do Brasil", type: "Ação", sector: "Financeiro", exchange: "B3", isin: "BRBBASACNOR3" },
  { ticker: "PETR4", name: "Petrobras", shortName: "Petrobras PN", type: "Ação", sector: "Petróleo, Gás e Biocombustíveis", exchange: "B3", isin: "BRPETRACNPR6" },
  { ticker: "VALE3", name: "Vale", shortName: "Vale ON", type: "Ação", sector: "Materiais Básicos", exchange: "B3", isin: "BRVALEACNOR0" },
  { ticker: "ITSA4", name: "Itaúsa", shortName: "Itaúsa PN", type: "Ação", sector: "Financeiro", exchange: "B3", isin: "BRITSAACNPR7" },
  { ticker: "TAEE11", name: "Taesa", shortName: "Taesa Unit", type: "Ação/Unit", sector: "Energia Elétrica", exchange: "B3" },
  { ticker: "MXRF11", name: "Maxi Renda", shortName: "MXRF11", type: "FII", subtype: "Papel", sector: "Fundos Imobiliários", segment: "Papel", exchange: "B3" },
  { ticker: "XPML11", name: "XP Malls", shortName: "XP Malls", type: "FII", subtype: "Shopping", sector: "Fundos Imobiliários", segment: "Shoppings", exchange: "B3" },
  { ticker: "HGLG11", name: "CSHG Logística", shortName: "HGLG11", type: "FII", subtype: "Logística", sector: "Fundos Imobiliários", segment: "Logística", exchange: "B3" },
  { ticker: "KNRI11", name: "Kinea Renda Imobiliária", shortName: "KNRI11", type: "FII", subtype: "Híbrido", sector: "Fundos Imobiliários", segment: "Híbrido", exchange: "B3" },
  { ticker: "IVVB11", name: "iShares S&P 500", shortName: "IVVB11", type: "ETF", subtype: "Exterior", sector: "ETF", exchange: "B3" },
  { ticker: "AAPL34", name: "Apple BDR", shortName: "Apple BDR", type: "BDR", sector: "Tecnologia", country: "Estados Unidos", currency: "BRL", exchange: "B3" },
  { ticker: "BTC", name: "Bitcoin", shortName: "Bitcoin", type: "Cripto", sector: "Criptoativos", currency: "BRL", exchange: "Crypto" },
  { ticker: "ETH", name: "Ethereum", shortName: "Ethereum", type: "Cripto", sector: "Criptoativos", currency: "BRL", exchange: "Crypto" },
].map((asset) => normalizeAssetRecord(asset));

export function normalizeAssetType(type) {
  const value = String(type || "").trim();
  const aliases = {
    "AÃ§Ã£o": "Ação",
    "AÃƒÂ§ÃƒÂ£o": "Ação",
    "AÃ§Ã£o/Unit": "Ação/Unit",
    "AÃƒÂ§ÃƒÂ£o/Unit": "Ação/Unit",
    Acao: "Ação",
    "Acao/Unit": "Ação/Unit",
  };
  const normalized = aliases[value] || value;
  return ASSET_TYPES.includes(normalized) ? normalized : "Ação";
}

export function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 30);
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAssetRecord(asset = {}) {
  const ticker = normalizeTicker(asset.ticker);
  if (!ticker) return null;
  const name = cleanText(asset.name || asset.assetName) || ticker;
  const type = normalizeAssetType(asset.type || asset.assetType);
  const updatedAt = cleanText(asset.updatedAt) || new Date().toISOString();
  return {
    ticker,
    name,
    shortName: cleanText(asset.shortName) || name,
    type,
    subtype: cleanText(asset.subtype),
    sector: cleanText(asset.sector),
    segment: cleanText(asset.segment),
    country: cleanText(asset.country) || "Brasil",
    currency: cleanText(asset.currency).toUpperCase() || "BRL",
    exchange: cleanText(asset.exchange) || (type === "Cripto" ? "Crypto" : "B3"),
    isin: cleanText(asset.isin).toUpperCase(),
    cnpj: cleanText(asset.cnpj),
    logoPath: cleanText(asset.logoPath),
    source: cleanText(asset.source) || "local",
    updatedAt,
    notes: cleanText(asset.notes),
  };
}

function searchable(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function normalizeAssetsMaster(value) {
  if (!Array.isArray(value)) return [];
  const map = new Map();
  value.forEach((asset) => {
    const normalized = normalizeAssetRecord(asset);
    if (!normalized) return;
    const previous = map.get(normalized.ticker);
    map.set(normalized.ticker, { ...previous, ...normalized, updatedAt: normalized.updatedAt || previous?.updatedAt || new Date().toISOString() });
  });
  return [...map.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function searchAssets(query, assets = INITIAL_ASSETS, limit = 8) {
  const term = searchable(query);
  if (!term) return [];
  return normalizeAssetsMaster(assets)
    .map((asset) => {
      const ticker = searchable(asset.ticker);
      const name = searchable(asset.name);
      const shortName = searchable(asset.shortName);
      let score = 0;
      if (ticker === term) score = 100;
      else if (ticker.startsWith(term)) score = 80;
      else if (name.startsWith(term) || shortName.startsWith(term)) score = 60;
      else if (ticker.includes(term)) score = 40;
      else if (name.includes(term) || shortName.includes(term)) score = 20;
      return { asset, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.asset.ticker.localeCompare(b.asset.ticker))
    .slice(0, limit)
    .map((item) => item.asset);
}

export function mergeAssetsMaster(current, operations = [], quotes = []) {
  const map = new Map(INITIAL_ASSETS.map((asset) => [asset.ticker, asset]));
  normalizeAssetsMaster(current).forEach((asset) => map.set(asset.ticker, { ...map.get(asset.ticker), ...asset }));
  operations.forEach((operation) => {
    const ticker = normalizeTicker(operation.ticker);
    if (!ticker) return;
    const existing = map.get(ticker);
    map.set(ticker, normalizeAssetRecord({ ...existing, ticker, name: existing?.name || operation.assetName, type: existing?.type || operation.assetType, source: existing?.source || "manual" }));
  });
  quotes.forEach((quote) => {
    const ticker = normalizeTicker(quote.ticker);
    if (!ticker) return;
    const existing = map.get(ticker);
    map.set(ticker, normalizeAssetRecord({ ...existing, ticker, name: existing?.name || quote.name || ticker, type: existing?.type || quote.type, sector: existing?.sector || quote.sector, notes: existing?.notes || quote.notes, source: existing?.source || "manual" }));
  });
  return normalizeAssetsMaster([...map.values()]);
}
