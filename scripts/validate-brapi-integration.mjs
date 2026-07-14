import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const configuredToken = fs.existsSync(envPath) ? (fs.readFileSync(envPath, "utf8").match(/^BRAPI_TOKEN=(.*)$/m)?.[1] || "").trim() : "";
const token = process.argv.includes("--without-token") ? "" : configuredToken;
const internalBaseUrl = process.argv.find((argument) => argument.startsWith("--internal="))?.split("=").slice(1).join("=").replace(/\/$/, "") || "";
const baseUrl = "https://brapi.dev/api";
const modules = ["summaryProfile", "defaultKeyStatistics", "financialData"];
const expectedFields = {
  quote: ["regularMarketPrice", "regularMarketChangePercent", "longName"],
  summaryProfile: ["sector", "industry"],
  defaultKeyStatistics: ["priceToBook", "dividendYield", "bookValue", "trailingEps"],
  financialData: ["returnOnEquity", "profitMargins", "ebitdaMargins", "currentRatio"],
};

function classify(status) {
  if (status === 401) return "erro de token";
  if (status === 403) return "erro de plano/permissão";
  if (status === 404) return "ativo não encontrado";
  return status >= 400 ? "erro do provedor" : "ok";
}

async function providerFetch(pathname, params = {}) {
  const url = new URL(`${baseUrl}${pathname}`);
  Object.entries({ ...params, token }).forEach(([key, value]) => value && url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function inspect(ticker, status, item = {}) {
  const receivedModules = modules.filter((name) => item[name] && typeof item[name] === "object");
  const available = [];
  const missing = [];
  Object.entries(expectedFields).forEach(([group, fields]) => fields.forEach((field) => {
    const source = group === "quote" ? item : item[group] || {};
    (source[field] === undefined || source[field] === null ? missing : available).push(`${group}.${field}`);
  }));
  return { ticker, httpStatus: status, result: classify(status), requestedModules: modules, receivedModules, availableFields: available, missingFields: missing };
}

if (!token) {
  console.log(JSON.stringify({ configured: false, result: "erro de token: BRAPI_TOKEN ausente" }, null, 2));
  process.exit(0);
}

let failed = false;
const searchCases = [
  ["PETR", ["PETR3", "PETR4"]], ["PETR4", ["PETR4"]], ["Petrobras", ["PETR3", "PETR4"]],
  ["VALE", ["VALE3"]], ["ITUB", ["ITUB3", "ITUB4"]], ["Banco do Brasil", ["BBAS3"]],
  ["WEGE", ["WEGE3"]], ["WEG", ["WEGE3"]], ["MXRF", ["MXRF11"]], ["HGLG", ["HGLG11"]], ["IVVB", ["IVVB11"]],
];

for (const [query, expected] of searchCases) {
  const response = await providerFetch("/quote/list", { search: query, limit: "20" });
  const matches = (response.data.stocks || []).map((item) => ({ ticker: item.stock, name: item.name }));
  const found = expected.every((ticker) => matches.some((item) => item.ticker === ticker));
  console.log(JSON.stringify({ layer: "brapi", endpoint: "/api/quote/list", params: { search: query, limit: 20 }, httpStatus: response.status, result: classify(response.status), found, matches: matches.slice(0, 8) }));
  if (!found) failed = true;
}

for (const ticker of ["PETR4", "VALE3", "ITUB4", "BBAS3", "WEGE3", "MXRF11", "VESTRA999"]) {
  let response = await providerFetch(`/quote/${ticker}`, { range: "1d", interval: "1d", modules: modules.join(",") });
  if (response.status === 403) {
    console.log(JSON.stringify(inspect(ticker, response.status)));
    response = await providerFetch(`/quote/${ticker}`, { range: "1d", interval: "1d" });
    console.log(JSON.stringify({ ...inspect(ticker, response.status, response.data.results?.[0]), fallback: "dados básicos" }));
    continue;
  }
  console.log(JSON.stringify(inspect(ticker, response.status, response.data.results?.[0])));
}

if (internalBaseUrl) {
  for (const [query, expected] of searchCases) {
    const endpoint = `/api/market/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(`${internalBaseUrl}${endpoint}`, { signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => ({}));
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const found = expected.every((ticker) => assets.some((asset) => asset.ticker === ticker));
    console.log(JSON.stringify({ layer: "vestra", provider: "brapi", tokenConfigured: Boolean(token), endpoint, httpStatus: response.status, resultCount: assets.length, tickers: assets.map((asset) => asset.ticker), sources: [...new Set(assets.map((asset) => asset.source))], found, fallbackReason: data.error?.code || null }));
    if (!found) failed = true;
  }
  for (const ticker of ["PETR4", "VALE3", "ITUB4", "BBAS3", "WEGE3", "MXRF11", "VESTRA999"]) {
    const endpoint = `/api/market/assets/${ticker}`;
    const response = await fetch(`${internalBaseUrl}${endpoint}`, { signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => ({}));
    const asset = data.asset || null;
    const quote = data.quote || asset?.quote || null;
    console.log(JSON.stringify({ layer: "vestra", provider: "brapi", tokenConfigured: Boolean(token), endpoint, httpStatus: response.status, ticker: asset?.ticker || null, name: asset?.name || null, quote: quote?.price ?? null, changePercent: quote?.changePercent ?? null, currency: quote?.currency || asset?.currency || null, source: quote?.source || asset?.source || null, updatedAt: quote?.updatedAt || asset?.updatedAt || null, fallbackReason: data.error?.code || asset?.providerLimitations?.[0] || null }));
    if (ticker === "VESTRA999" ? response.status !== 404 : response.status !== 200 || !quote?.price || quote.source !== "brapi") failed = true;
  }
}

if (failed) process.exit(1);
