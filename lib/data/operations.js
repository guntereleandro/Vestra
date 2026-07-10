import { nonNegativeNumber, validDate } from "@/lib/engine/validations";
import { normalizeAssetType, normalizeTicker } from "@/lib/data/assetsMaster";

export const OPERATION_TYPES = ["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO"];
export const INCOME_TYPES = ["DIVIDENDO", "JCP", "RENDIMENTO"];
export const EMPTY_OPERATION = { ticker: "", assetName: "", assetType: "Ação", operationType: "COMPRA", date: "", quantity: "", unitPrice: "", fees: "", totalValue: "", notes: "" };
export function isIncomeOperation(type) { return INCOME_TYPES.includes(type); }
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
    return [{ id: typeof operation.id === "string" && operation.id ? operation.id : `operation-${index}-${ticker}`, ticker, assetName, assetType: normalizeAssetType(operation.assetType), operationType, date: validDate(operation.date) ? operation.date : new Date().toISOString().slice(0, 10), quantity: isIncomeOperation(operationType) ? 0 : operationQuantity, unitPrice: isIncomeOperation(operationType) ? 0 : unitPrice, fees, totalValue, notes: typeof operation.notes === "string" ? operation.notes.trim() : "" }];
  });
}
