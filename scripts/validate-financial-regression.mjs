import assert from "node:assert/strict";
import {
  assertFinancialRegression,
  FINANCIAL_REGRESSION_OPERATIONS,
} from "./financial-regression-fixtures.mjs";

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.get(String(key)) ?? null; }
  setItem(key, value) { this.#data.set(String(key), String(value)); }
  removeItem(key) { this.#data.delete(String(key)); }
}

globalThis.localStorage = new MemoryStorage();

const [{ localOperationsRepository }, { LOCAL_DEFAULT_PORTFOLIO_ID }, { normalizeOperations }] = await Promise.all([
  import("../lib/repositories/local/localOperationsRepository.js"),
  import("../lib/repositories/repositoryTypes.js"),
  import("../lib/data/operations.js"),
]);

assertFinancialRegression(FINANCIAL_REGRESSION_OPERATIONS, "memoria");
await localOperationsRepository.replaceAllByPortfolio(
  LOCAL_DEFAULT_PORTFOLIO_ID,
  FINANCIAL_REGRESSION_OPERATIONS,
);
const local = await localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assertFinancialRegression(local, "local repository");
assert.equal(JSON.stringify(local), JSON.stringify(normalizeOperations(FINANCIAL_REGRESSION_OPERATIONS)), "round-trip local");

const invalid = normalizeOperations([{ operationType: "INVALID", ticker: "", assetName: "" }]);
assert.equal(invalid.length, 0, "registro invalido deve ser rejeitado");

console.log("Regressão financeira aprovada: memória e Local Repository, 9 operações e 22 verificações.");
