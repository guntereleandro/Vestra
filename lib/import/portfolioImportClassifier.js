import { normalizeOperations, validatePortfolioEvent } from "../data/operations.js";

function normalizedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

export const IMPORT_CLASSIFICATION = Object.freeze({
  COMMON_OPERATION: "COMMON_OPERATION",
  SPLIT: "SPLIT",
  BONUS: "BONUS",
  CONVERSION: "CONVERSION",
  REMUNERATED_CASH: "REMUNERATED_CASH",
  UNSUPPORTED: "UNSUPPORTED",
});

export function classifyInvestidor10Record(record = {}) {
  const origin = normalizedText(record.origin || record.source || record.eventType);
  const product = normalizedText(record.productName || record.assetName || record.description);
  if (origin.includes("BONUS") || origin.includes("BONIFIC")) return IMPORT_CLASSIFICATION.BONUS;
  if (origin.includes("DESDOBRAMENTO") || origin.includes("GRUPAMENTO") || origin.includes("SPLIT")) return IMPORT_CLASSIFICATION.SPLIT;
  if (origin.includes("CONVERSAO") || origin.includes("INCORPORACAO")) return IMPORT_CLASSIFICATION.CONVERSION;
  if (product.includes("MERCADO PAGO") && (product.includes("120% CDI") || product.includes("POS-FIXADO"))) return IMPORT_CLASSIFICATION.REMUNERATED_CASH;
  if (["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO"].includes(origin || normalizedText(record.operationType))) return IMPORT_CLASSIFICATION.COMMON_OPERATION;
  return IMPORT_CLASSIFICATION.UNSUPPORTED;
}

export function previewPortfolioImport(records = [], mapper = (record) => record.operation) {
  return records.map((record, index) => {
    const classification = classifyInvestidor10Record(record);
    const [operation] = normalizeOperations([mapper(record, classification)]);
    const validation = validatePortfolioEvent(operation);
    return {
      index,
      classification,
      operation: validation.valid ? operation : null,
      status: validation.valid ? "READY" : "REVIEW_REQUIRED",
      warning: validation.valid ? null : validation.reason,
    };
  });
}
