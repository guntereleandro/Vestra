export const PASSIVE_INCOME_TYPES = Object.freeze(["DIVIDENDO", "JCP", "RENDIMENTO"]);

const ECONOMIC_RETURN_ONLY_ASSET_TYPES = new Set(["Caixa Remunerado", "Renda Fixa"]);

export function isIncomeOperationType(type) {
  return PASSIVE_INCOME_TYPES.includes(type);
}

export function isPassiveIncomeOperation(operation) {
  return isIncomeOperationType(operation?.operationType)
    && !ECONOMIC_RETURN_ONLY_ASSET_TYPES.has(operation?.assetType);
}
