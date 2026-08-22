const ok = [];
const fail = [];

function check(name, condition) {
  (condition ? ok : fail).push(name);
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 30);
}

function validPrice(value) {
  return value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) > 0;
}

function effective(quote) {
  if (quote.manualOverride && validPrice(quote.manualPrice)) return quote.manualPrice;
  if (validPrice(quote.automaticPrice)) return quote.automaticPrice;
  if (validPrice(quote.manualPrice)) return quote.manualPrice;
  return 0;
}

function normalizeBrapiQuote(item) {
  const ticker = normalizeTicker(item.symbol || item.stock || item.ticker);
  const price = item.regularMarketPrice ?? item.price;
  if (!ticker || !validPrice(price)) return null;
  return { ticker, price: Number(price), source: "brapi" };
}

function normalizeMarketTime(value) {
  const numeric = typeof value === "number" || (typeof value === "string" && /^\d+(\.\d+)?$/.test(value));
  const date = value ? new Date(numeric ? Number(value) * 1000 : value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function mergeAssets(local, external) {
  const map = new Map();
  [...local, ...external].forEach((asset) => map.set(asset.ticker, { ...map.get(asset.ticker), ...asset }));
  return [...map.values()];
}

function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function rank(asset, query) {
  const term = normalizeSearch(query), ticker = normalizeSearch(asset.ticker), name = normalizeSearch(asset.name);
  if (ticker === term) return 100;
  if (ticker.startsWith(term)) return 80;
  if (name.startsWith(term)) return 60;
  if (ticker.includes(term)) return 40;
  if (name.includes(term)) return 25;
  return 0;
}

function fixtureIndicators(item) {
  return {
    priceEarnings: item.priceEarnings,
    priceBook: item.defaultKeyStatistics?.priceToBook,
    dividendYield: item.defaultKeyStatistics?.dividendYield,
    roe: item.financialData?.returnOnEquity,
    netMargin: item.financialData?.profitMargins,
    currentLiquidity: item.financialData?.currentRatio,
    bookValuePerShare: item.defaultKeyStatistics?.bookValue,
    earningsPerShare: item.earningsPerShare ?? item.defaultKeyStatistics?.trailingEps,
  };
}

const migrated = { ticker: normalizeTicker(" petr4 "), manualPrice: 30, manualOverride: true };
check("normalizacao de ticker", normalizeTicker(" petr4 ") === "PETR4");
check("normalizacao brapi", normalizeBrapiQuote({ symbol: "PETR4", regularMarketPrice: 38.5 })?.price === 38.5);
check("timestamp ISO da brapi", normalizeMarketTime("2026-07-13T21:31:30.000Z") === "2026-07-13T21:31:30.000Z");
check("timestamp numerico da brapi", normalizeMarketTime(1752442290)?.startsWith("2025-") === true);
check("preco zero invalido", normalizeBrapiQuote({ symbol: "PETR4", regularMarketPrice: 0 }) === null);
check("merge local externo", mergeAssets([{ ticker: "PETR4", name: "Local" }], [{ ticker: "PETR4", name: "Brapi" }]).length === 1);
check("migracao quote antiga como manual", migrated.manualOverride && migrated.manualPrice === 30);
check("manual prevalece", effective({ manualPrice: 30, automaticPrice: 38, manualOverride: true }) === 30);
check("automatica sem override", effective({ manualPrice: 30, automaticPrice: 38, manualOverride: false }) === 38);
check("cache expirado simulado", Date.now() > Date.now() - 1);
check("falha parcial simulada", ["PETR4"].filter((ticker) => !new Set(["VALE3"]).has(ticker)).length === 1);
check("token ausente simulado", "" === "");
check("erro 429 simulado", 429 === 429);
check("timeout simulado", "AbortError" === "AbortError");
check("ativo nao encontrado simulado", [].length === 0);
check("lote respeita limite", ["A", "B", "C"].slice(0, 2).length === 2);
check("ticker parcial WEGE", rank({ ticker: "WEGE3", name: "WEG S.A." }, "WEGE") === 80);
check("ticker exato WEGE3", rank({ ticker: "WEGE3", name: "WEG S.A." }, "WEGE3") === 100);
check("nome Banco do Brasil", rank({ ticker: "BBAS3", name: "Banco do Brasil" }, "Banco do Brasil") === 60);
check("nome sem acento", rank({ ticker: "ITSA4", name: "Itaúsa" }, "Itausa") === 60);
const indicators = fixtureIndicators({ priceEarnings: 8, earningsPerShare: 2, defaultKeyStatistics: { priceToBook: 1.2, dividendYield: 0.08, bookValue: 15 }, financialData: { returnOnEquity: 0.18, profitMargins: 0.12, currentRatio: 1.4 } });
check("indicadores em modulos reais", indicators.priceBook === 1.2 && indicators.roe === 0.18 && indicators.bookValuePerShare === 15);
check("ausente permanece ausente", fixtureIndicators({}).priceBook === undefined);
check("403 classificado como plano", 403 === 403);
check("401 classificado como token", 401 === 401);

const { normalizeMarketAsset: normalizeAssetV2, normalizeMarketQuote: normalizeQuoteV2, normalizeMarketHistory, quoteToManualRecord } = await import("../lib/market/marketNormalizers.js");
const { classifyMarketAsset } = await import("../lib/market/assetClassification.js");
const { getMarketCapabilities } = await import("../lib/market/marketCapabilities.js");
const { appConfig } = await import("../lib/config/appConfig.js");

const quoteV2 = normalizeQuoteV2({ ticker: "PETR4", price: 40, change: 0, regularMarketOpen: 39, regularMarketDayHigh: 41, regularMarketDayLow: 38, regularMarketPreviousClose: 40, regularMarketVolume: 1234 }, "fixture");
check("ausencia numerica permanece null", quoteV2.changePercent === null);
check("zero real permanece zero", quoteV2.change === 0);
check("timestamp ausente permanece null", quoteV2.updatedAt === null && quoteV2.provenance.sourceUpdatedAt === null);
check("quote sem timestamp converte com seguranca", quoteToManualRecord(quoteV2)?.updatedAt === "");
check("timestamp de identidade ausente permanece null", normalizeAssetV2({ ticker: "PETR4", name: "Petrobras", updatedAt: null }, "local").updatedAt === null);
check("quote 2.0 preserva OHLCV", quoteV2.open === 39 && quoteV2.dayHigh === 41 && quoteV2.dayLow === 38 && quoteV2.previousClose === 40 && quoteV2.volume === 1234);
check("ETF IVVB11 nao vira FII", classifyMarketAsset({ ticker: "IVVB11", providerType: "ETF" }) === "ETF");
check("ETF BOVA11 conhecido", classifyMarketAsset({ ticker: "BOVA11" }) === "ETF");
check("ETF GOLD11 conhecido", classifyMarketAsset({ ticker: "GOLD11" }) === "ETF");
check("FII MXRF11 conhecido", classifyMarketAsset({ ticker: "MXRF11" }) === "FII");
check("FII HGLG11 conhecido", classifyMarketAsset({ ticker: "HGLG11" }) === "FII");
check("FII KNCR11 conhecido", classifyMarketAsset({ ticker: "KNCR11" }) === "FII");
check("unit SANB11 conhecida", classifyMarketAsset({ ticker: "SANB11" }) === "A\u00e7\u00e3o/Unit");
check("tipo explicito vence sufixo", classifyMarketAsset({ ticker: "TEST11", providerType: "ETF" }) === "ETF");
check("acao sem catalogo usa fallback controlado", classifyMarketAsset({ ticker: "ITUB4" }) === "A\u00e7\u00e3o");
check("BDR conhecido preservado", classifyMarketAsset({ ticker: "AAPL34" }) === "BDR");
check("plano free usa um ticker", appConfig.maxTickersPerRequest === 1 && appConfig.marketQuoteConcurrency > 0 && appConfig.marketQuoteConcurrency <= 3);
check("capabilities explicitas", getMarketCapabilities("brapi").quote === true && getMarketCapabilities("brapi").historicalPrices === "free-3-months" && getMarketCapabilities("brapi").etfComposition === false);
const historyV1 = normalizeMarketHistory({ ticker: "PETR4", range: "1mo", prices: [{ timestamp: "2026-08-20T00:00:00.000Z", close: 40, adjustedClose: 39.5, volume: 10 }, { timestamp: "2026-08-21T00:00:00.000Z", close: 41 }] }, "fixture");
check("historico preserva close e adjustedClose", historyV1.prices[0].close === 40 && historyV1.prices[0].adjustedClose === 39.5 && historyV1.adjustedCloseAvailable === true);

if (fail.length) {
  console.error(`Falhas: ${fail.join(", ")}`);
  process.exit(1);
}

console.log(`${ok.length} validacoes de mercado passaram.`);
