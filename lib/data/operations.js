import { nonNegativeNumber, validDate } from "../engine/validations.js";
import { normalizeAssetType, normalizeTicker } from "./assetsMaster.js";

export const OPERATION_TYPES = ["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO"];
export const INCOME_TYPES = ["DIVIDENDO", "JCP", "RENDIMENTO"];
export const EMPTY_OPERATION = { ticker: "", assetName: "", assetType: "Ação", operationType: "COMPRA", date: "", quantity: "", unitPrice: "", fees: "", totalValue: "", notes: "" };
export function isIncomeOperation(type) { return INCOME_TYPES.includes(type); }
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
    const operationType = OPERATION_TYPES.includes(operation.operationType) ? operation.operationType : "";
    if (!ticker || !assetName || !operationType) return [];
    const operationQuantity = nonNegativeNumber(operation.quantity), unitPrice = nonNegativeNumber(operation.unitPrice), fees = nonNegativeNumber(operation.fees);
    const totalValue = operationType === "COMPRA" ? operationQuantity * unitPrice + fees : operationType === "VENDA" ? Math.max(0, operationQuantity * unitPrice - fees) : nonNegativeNumber(operation.totalValue);
    return [{ id: typeof operation.id === "string" && operation.id ? operation.id : createOperationId(), ticker, assetName, assetType: normalizeAssetType(operation.assetType), operationType, date: validDate(operation.date) ? operation.date : new Date().toISOString().slice(0, 10), quantity: isIncomeOperation(operationType) ? 0 : operationQuantity, unitPrice: isIncomeOperation(operationType) ? 0 : unitPrice, fees, totalValue, notes: typeof operation.notes === "string" ? operation.notes.trim() : "" }];
  });
}
