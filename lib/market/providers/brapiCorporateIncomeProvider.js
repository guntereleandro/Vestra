import "server-only";
import { brapiRequest } from "./brapiProvider.js";
import { canonicalizeIncomeEvent, externalIncomeIdentity } from "../../domain/income/canonicalIncomeEvent.js";

function eventType(label) {
  const value = String(label || "").toUpperCase();
  if (value.includes("AMORT")) return null;
  if (value.includes("JCP") || value.includes("JUROS SOBRE")) return "JCP";
  if (value.includes("REND")) return "INCOME";
  if (value.includes("DIV")) return "DIVIDEND";
  return null;
}
function normalizeRaw(ticker, item, asset = {}) {
  const type = eventType(item.label || item.type || item.eventType);
  if (!type) return null;
  const event = canonicalizeIncomeEvent({
    ticker, isin: asset.isin, exchange: asset.exchange || "B3", assetName: asset.name,
    eventType: type, status: String(item.status || "CONFIRMED").toUpperCase().includes("CANCEL") ? "CANCELLED" : "CONFIRMED", recordDate: item.lastDatePrior || item.recordDate,
    exDate: item.exDate, declarationDate: item.approvedOn || item.declarationDate,
    paymentDate: item.paymentDate || item.date, grossAmountPerUnit: item.rate ?? item.value ?? item.amount,
    currency: item.currency || asset.currency || "BRL", installment: item.installment, period: item.period,
    source: "brapi", sourceConfidence: item.lastDatePrior || item.recordDate ? "high" : "medium",
    sourceUpdatedAt: item.updatedAt,
  });
  return event ? { event, alias: externalIncomeIdentity("brapi", item, event), raw: item } : null;
}
function providerResult(error) {
  if (error?.status === 403 || error?.code === "PROVIDER_PERMISSION") return "PLAN_RESTRICTED";
  if (error?.status === 404 || error?.code === "ASSET_NOT_FOUND") return "NOT_FOUND";
  if (error?.status === 429 || error?.code === "RATE_LIMITED") return "RATE_LIMITED";
  return "ERROR";
}

const cache = new Map(); const inflight = new Map();
export async function fetchBrapiCorporateIncomeEvents(asset, { startDate, endDate, force = false } = {}) {
  const ticker = asset.ticker; const isFii = String(asset.type || asset.assetType).toUpperCase().includes("FII");
  if (["ETF", "CAIXA REMUNERADO", "RENDA FIXA", "TESOURO DIRETO"].includes(String(asset.type || asset.assetType).toUpperCase())) return { ticker, status: "UNSUPPORTED", events: [] };
  const key = `${ticker}|${startDate || ""}|${endDate || ""}`; const cached = cache.get(key);
  if (!force && cached?.expiresAt > Date.now()) return cached.value;
  if (inflight.has(key)) return inflight.get(key);
  const pending = (async () => {
    try {
      const path = isFii ? "/v2/fii/dividends" : "/v2/stocks/dividends";
      const data = await brapiRequest(path, { stock: ticker, ticker, startDate, endDate });
      const raw = isFii ? data?.dividends || data?.results?.[0]?.dividends || [] : data?.results?.[0]?.data?.cashDividends || data?.cashDividends || [];
      const events = raw.map((item) => normalizeRaw(ticker, item, asset)).filter(Boolean);
      const value = { ticker, status: events.length ? "SUCCESS" : "NO_EVENTS", events };
      cache.set(key, { value, expiresAt: Date.now() + (events.length ? 6 : 1) * 60 * 60 * 1000 }); return value;
    } catch (error) { return { ticker, status: providerResult(error), events: [] }; }
  })();
  inflight.set(key, pending);
  try { return await pending; } finally { inflight.delete(key); }
}

export async function fetchIncomeEventsWithConcurrency(assets, options = {}) {
  const results = []; let cursor = 0;
  async function worker() { while (cursor < assets.length) { const asset = assets[cursor++]; results.push(await fetchBrapiCorporateIncomeEvents(asset, options)); } }
  await Promise.all(Array.from({ length: Math.min(3, assets.length) }, worker));
  return results;
}
