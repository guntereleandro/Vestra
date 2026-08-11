import { nonNegativeNumber, validDate } from "../engine/validations.js";
import { normalizeAssetType, normalizeTicker } from "./assetsMaster.js";
import { PASSIVE_INCOME_TYPES, isIncomeOperationType, isPassiveIncomeOperation } from "../domain/operations/passiveIncome.js";

export const OPERATION_TYPES = ["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO"];
export const INCOME_TYPES = PASSIVE_INCOME_TYPES;
export const CORPORATE_ACTION_TYPES = ["SPLIT", "BONUS", "CONVERSION"];
export const CASH_OPERATION_TYPES = ["CASH_DEPOSIT", "CASH_WITHDRAWAL"];
export const FIXED_INCOME_OPERATION_TYPES = ["FIXED_INCOME_APPLICATION", "FIXED_INCOME_REDEMPTION"];
export const PORTFOLIO_EVENT_TYPES = [...OPERATION_TYPES, ...CORPORATE_ACTION_TYPES, ...CASH_OPERATION_TYPES, ...FIXED_INCOME_OPERATION_TYPES];
export const EMPTY_OPERATION = { ticker: "", assetName: "", assetType: "Ação", operationType: "COMPRA", date: "", quantity: "", unitPrice: "", fees: "", totalValue: "", notes: "" };
export function isIncomeOperation(type) { return isIncomeOperationType(type); }
export function isCorporateAction(type) { return CORPORATE_ACTION_TYPES.includes(type); }
export function isCashOperation(type) { return CASH_OPERATION_TYPES.includes(type); }
export function isFixedIncomeOperation(type) { return FIXED_INCOME_OPERATION_TYPES.includes(type); }
export function isValueBasedOperation(type) { return isCashOperation(type) || isFixedIncomeOperation(type); }
export { isPassiveIncomeOperation };
export function createOperationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
export function isOperationUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
export function migrateOperationIds(value) {
  if (!Array.isArray(value)) return { operations: [], migrated: false };
  let migrated = false;
  const operations = value.map((operation) => {
    if (!operation || typeof operation !== "object" || isOperationUuid(operation.id)) return operation;
    migrated = true;
    return { ...operation, id: createOperationId() };
  });
  return { operations, migrated };
}
export function normalizeOperations(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((operation, index) => {
    if (!operation || typeof operation !== "object") return [];
    const ticker = normalizeTicker(operation.ticker);
    const assetName = typeof operation.assetName === "string" ? operation.assetName.trim() : "";
    const operationType = PORTFOLIO_EVENT_TYPES.includes(operation.operationType) ? operation.operationType : "";
    if (!ticker || !assetName || !operationType) return [];
    const operationQuantity = nonNegativeNumber(operation.quantity), unitPrice = nonNegativeNumber(operation.unitPrice), fees = nonNegativeNumber(operation.fees);
    const moneyOnly = isIncomeOperation(operationType) || isValueBasedOperation(operationType);
    const totalValue = operationType === "COMPRA" ? operationQuantity * unitPrice + fees : operationType === "VENDA" ? Math.max(0, operationQuantity * unitPrice - fees) : (moneyOnly ? nonNegativeNumber(operation.totalValue) : 0);
    const optionalCost = operation.attributedCost === null || operation.attributedCost === "" || operation.attributedCost === undefined ? null : nonNegativeNumber(operation.attributedCost);
    const optionalTransferredCost = operation.transferredCost === null || operation.transferredCost === "" || operation.transferredCost === undefined ? null : nonNegativeNumber(operation.transferredCost);
    return [{ id: typeof operation.id === "string" && operation.id ? operation.id : createOperationId(), ticker, assetName, assetType: isCashOperation(operationType) ? "Caixa Remunerado" : isFixedIncomeOperation(operationType) ? "Renda Fixa" : normalizeAssetType(operation.assetType), operationType, date: validDate(operation.date) ? operation.date : new Date().toISOString().slice(0, 10), quantity: moneyOnly || operationType === "SPLIT" ? 0 : operationQuantity, unitPrice: moneyOnly || isCorporateAction(operationType) ? 0 : unitPrice, fees: isCorporateAction(operationType) || isValueBasedOperation(operationType) ? 0 : fees, totalValue, ratioFrom: operationType === "SPLIT" ? nonNegativeNumber(operation.ratioFrom) : 0, ratioTo: operationType === "SPLIT" ? nonNegativeNumber(operation.ratioTo) : 0, attributedCost: operationType === "BONUS" ? optionalCost : null, costBasisStatus: operationType === "BONUS" ? (optionalCost === null ? "PENDING" : "CONFIRMED") : "NOT_APPLICABLE", targetTicker: operationType === "CONVERSION" ? normalizeTicker(operation.targetTicker) : "", targetAssetName: operationType === "CONVERSION" && typeof operation.targetAssetName === "string" ? operation.targetAssetName.trim() : "", targetAssetType: operationType === "CONVERSION" ? normalizeAssetType(operation.targetAssetType) : "", targetQuantity: operationType === "CONVERSION" ? nonNegativeNumber(operation.targetQuantity) : 0, transferredCost: operationType === "CONVERSION" ? optionalTransferredCost : null, notes: typeof operation.notes === "string" ? operation.notes.trim() : "" }];
  });
}

export function validatePortfolioEvent(operation) {
  if (!operation) return { valid: false, reason: "INVALID_EVENT" };
  if (["COMPRA", "VENDA"].includes(operation.operationType)) return { valid: operation.quantity > 0 && operation.unitPrice >= 0, reason: "INVALID_TRADE" };
  if (isIncomeOperation(operation.operationType) || isValueBasedOperation(operation.operationType)) return { valid: operation.totalValue > 0, reason: "INVALID_AMOUNT" };
  if (operation.operationType === "SPLIT") return { valid: operation.ratioFrom > 0 && operation.ratioTo > 0, reason: "INVALID_RATIO" };
  if (operation.operationType === "BONUS") return { valid: operation.quantity > 0 && operation.attributedCost !== null, reason: "BONUS_COST_PENDING" };
  if (operation.operationType === "CONVERSION") return { valid: operation.quantity > 0 && operation.targetTicker && operation.targetAssetName && operation.targetQuantity > 0, reason: "INVALID_CONVERSION" };
  return { valid: false, reason: "INVALID_EVENT" };
}
