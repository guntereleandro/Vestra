import { chronologicalOperations } from "./averagePrice.js";
import { isCashOperation, isIncomeOperation, isValueBasedOperation } from "../data/operations.js";

function emptyState(ticker, operation = {}) {
  return {
    ticker,
    held: 0,
    invested: 0,
    dividends: 0,
    realizedProfit: 0,
    latest: operation,
    cash: operation.assetType === "Caixa Remunerado" || isCashOperation(operation.operationType),
    valueBased: ["Caixa Remunerado", "Renda Fixa"].includes(operation.assetType) && (isValueBasedOperation(operation.operationType) || operation.operationType === "RENDIMENTO"),
  };
}

function stateFor(states, ticker, operation) {
  if (!states.has(ticker)) states.set(ticker, emptyState(ticker, operation));
  const state = states.get(ticker);
  state.latest = { ...state.latest, ...operation, ticker };
  if (operation.assetType === "Caixa Remunerado" || isCashOperation(operation.operationType)) state.cash = true;
  if (isValueBasedOperation(operation.operationType)) state.valueBased = true;
  return state;
}

function applySale(state, operation) {
  if (state.held <= 0) return;
  const sold = Math.min(state.held, operation.quantity);
  const average = state.invested / state.held;
  state.realizedProfit += sold * operation.unitPrice - operation.fees - sold * average;
  state.held -= sold;
  state.invested = Math.max(0, state.invested - sold * average);
}

function applyConversion(states, operation) {
  const source = stateFor(states, operation.ticker, operation);
  if (source.held <= 0) return;
  const sourceQuantity = Math.min(source.held, operation.quantity);
  const proportionalCost = source.invested * (sourceQuantity / source.held);
  const requestedCost = operation.transferredCost === null ? proportionalCost : operation.transferredCost;
  const transferredCost = Math.min(source.invested, requestedCost);
  source.held -= sourceQuantity;
  source.invested = Math.max(0, source.invested - transferredCost);
  const targetOperation = {
    ...operation,
    ticker: operation.targetTicker,
    assetName: operation.targetAssetName,
    assetType: operation.targetAssetType,
  };
  const target = stateFor(states, operation.targetTicker, targetOperation);
  target.held += operation.targetQuantity;
  target.invested += transferredCost;
}

function applyValueRedemption(state, amount) {
  if (state.held <= 0) return;
  const redeemed = Math.min(state.held, amount);
  const cost = state.invested * (redeemed / state.held);
  state.realizedProfit += redeemed - cost;
  state.held -= redeemed;
  state.invested = Math.max(0, state.invested - cost);
}

function calculateStates(operations) {
  const states = new Map();
  for (const operation of chronologicalOperations(operations)) {
    const state = stateFor(states, operation.ticker, operation);
    if (operation.operationType === "COMPRA") {
      state.held += operation.quantity;
      state.invested += operation.quantity * operation.unitPrice + operation.fees;
    } else if (operation.operationType === "VENDA") {
      applySale(state, operation);
    } else if (operation.operationType === "SPLIT" && operation.ratioFrom > 0 && operation.ratioTo > 0) {
      state.held *= operation.ratioTo / operation.ratioFrom;
    } else if (operation.operationType === "BONUS" && operation.attributedCost !== null) {
      state.held += operation.quantity;
      state.invested += operation.attributedCost;
    } else if (operation.operationType === "CONVERSION") {
      applyConversion(states, operation);
    } else if (operation.operationType === "CASH_DEPOSIT") {
      state.cash = true;
      state.held += operation.totalValue;
      state.invested += operation.totalValue;
    } else if (operation.operationType === "CASH_WITHDRAWAL") {
      state.cash = true;
      const withdrawn = Math.min(state.held, operation.totalValue);
      state.held -= withdrawn;
      state.invested = Math.max(0, state.invested - withdrawn);
    } else if (operation.operationType === "FIXED_INCOME_APPLICATION") {
      state.valueBased = true;
      state.held += operation.totalValue;
      state.invested += operation.totalValue;
    } else if (operation.operationType === "FIXED_INCOME_REDEMPTION") {
      state.valueBased = true;
      applyValueRedemption(state, operation.totalValue);
    } else if (isIncomeOperation(operation.operationType)) {
      if (state.valueBased) state.held += operation.totalValue;
      else state.dividends += operation.totalValue;
    }
  }
  return states;
}

function positionFromState(state, quote, masterAsset) {
  const averagePrice = state.valueBased ? 1 : state.held ? state.invested / state.held : 0;
  const hasMarketQuote = Boolean(quote && Number.isFinite(Number(quote.currentQuote)) && Number(quote.currentQuote) >= 0);
  const hasQuote = state.valueBased || hasMarketQuote;
  const currentPrice = state.valueBased ? 1 : hasMarketQuote ? Number(quote.currentQuote) : averagePrice;
  const currentValue = state.held * currentPrice;
  const profit = currentValue - state.invested;
  return {
    ticker: state.ticker,
    name: masterAsset?.name || state.latest.assetName,
    shortName: masterAsset?.shortName || masterAsset?.name || state.latest.assetName,
    type: state.cash ? "Caixa Remunerado" : masterAsset?.type || state.latest.assetType,
    subtype: masterAsset?.subtype || "",
    quantity: state.held,
    averagePrice,
    invested: state.invested,
    currentPrice,
    currentValue,
    dividends: state.dividends,
    realizedProfit: state.realizedProfit,
    profit,
    profitability: state.invested ? (profit / state.invested) * 100 : 0,
    hasQuote,
    quoteUpdatedAt: state.valueBased ? "" : quote?.updatedAt || "",
    quoteOrigin: state.cash ? "cash-ledger" : state.valueBased ? "value-ledger" : quote?.origin || "",
    quoteStale: state.valueBased ? false : Boolean(quote?.stale),
    manualOverride: state.valueBased ? false : Boolean(quote?.manualOverride),
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

export function calculateAssetPosition(operations, quote, masterAsset) {
  if (!operations.length) return null;
  const ticker = operations[0].ticker;
  const state = calculateStates(operations).get(ticker);
  return state ? positionFromState(state, quote, masterAsset) : null;
}

export function calculatePositions(operations, quotes = [], assetsMaster = []) {
  const quoteMap = new Map(quotes.map((quote) => [quote.ticker, quote]));
  const assetMap = new Map(assetsMaster.map((asset) => [asset.ticker, asset]));
  return [...calculateStates(operations).values()]
    .map((state) => positionFromState(state, quoteMap.get(state.ticker), assetMap.get(state.ticker)))
    .filter((position) => position.quantity > 0 || position.dividends > 0)
    .sort((a, b) => b.currentValue - a.currentValue);
}
