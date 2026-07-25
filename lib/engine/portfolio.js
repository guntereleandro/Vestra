import { chronologicalOperations } from "./averagePrice.js";
import { isIncomeOperation } from "../data/operations.js";

export function calculateAssetPosition(operations, quote, masterAsset) {
  if (!operations.length) return null;
  const sorted = chronologicalOperations(operations);
  let held = 0, invested = 0, dividends = 0;
  sorted.forEach((operation) => {
    if (operation.operationType === "COMPRA") {
      held += operation.quantity;
      invested += operation.quantity * operation.unitPrice + operation.fees;
    }
    if (operation.operationType === "VENDA" && held > 0) {
      const sold = Math.min(held, operation.quantity), average = invested / held;
      held -= sold;
      invested = Math.max(0, invested - sold * average);
    }
    if (isIncomeOperation(operation.operationType)) dividends += operation.totalValue;
  });
  const latest = sorted[sorted.length - 1];
  const averagePrice = held ? invested / held : 0;
  const hasQuote = Boolean(quote && Number.isFinite(Number(quote.currentQuote)) && Number(quote.currentQuote) >= 0);
  const currentPrice = hasQuote ? Number(quote.currentQuote) : averagePrice;
  const currentValue = held * currentPrice;
  const profit = currentValue - invested;
  return {
    ticker: latest.ticker,
    name: masterAsset?.name || latest.assetName,
    shortName: masterAsset?.shortName || masterAsset?.name || latest.assetName,
    type: masterAsset?.type || latest.assetType,
    subtype: masterAsset?.subtype || "",
    quantity: held,
    averagePrice,
    invested,
    currentPrice,
    currentValue,
    dividends,
    profit,
    profitability: invested ? (profit / invested) * 100 : 0,
    hasQuote,
    quoteUpdatedAt: quote?.updatedAt || "",
    quoteOrigin: quote?.origin || "",
    quoteStale: Boolean(quote?.stale),
    manualOverride: Boolean(quote?.manualOverride),
    sector: masterAsset?.sector || "",
    segment: masterAsset?.segment || "",
    currency: masterAsset?.currency || "BRL",
    country: masterAsset?.country || "Brasil",
    exchange: masterAsset?.exchange || "",
    isin: masterAsset?.isin || "",
    cnpj: masterAsset?.cnpj || "",
    logoPath: masterAsset?.logoPath || "",
    source: masterAsset?.source || "local",
  };
}

export function calculatePositions(operations, quotes = [], assetsMaster = []) {
  const groups = operations.reduce((map, operation) => {
    (map[operation.ticker] ||= []).push(operation);
    return map;
  }, {});
  const quoteMap = new Map(quotes.map((quote) => [quote.ticker, quote]));
  const assetMap = new Map(assetsMaster.map((asset) => [asset.ticker, asset]));
  return Object.entries(groups)
    .map(([ticker, items]) => calculateAssetPosition(items, quoteMap.get(ticker), assetMap.get(ticker)))
    .filter((position) => position && (position.quantity > 0 || position.dividends > 0))
    .sort((a, b) => b.currentValue - a.currentValue);
}
