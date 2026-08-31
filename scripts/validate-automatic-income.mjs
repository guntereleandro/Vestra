import assert from "node:assert/strict";
import { canonicalizeIncomeEvent, externalIncomeIdentity } from "../lib/domain/income/canonicalIncomeEvent.js";
import { resolveIncomeEligibilityDate, calculateEligibleQuantity } from "../lib/engine/incomeEligibility.js";
import { buildIncomeExpectation, multiplyDecimal } from "../lib/engine/incomeExpectation.js";
import { matchIncomeExpectation } from "../lib/engine/incomeMatching.js";

const event = canonicalizeIncomeEvent({ ticker: "TEST3", eventType: "DIVIDEND", recordDate: "2026-05-10", paymentDate: "2026-05-20", grossAmountPerUnit: "0.12345678", currency: "BRL", installment: "1", period: "2026" });
assert.ok(event?.canonicalIdentity);
assert.equal(event.canonicalIdentity, canonicalizeIncomeEvent({ ticker: "TEST3", eventType: "DIVIDEND", recordDate: "2026-05-10", paymentDate: "2026-05-20", grossAmountPerUnit: "0.12345678", currency: "BRL", installment: "1", period: "2026" }).canonicalIdentity);
assert.notEqual(event.canonicalIdentity, canonicalizeIncomeEvent({ ticker: "TEST3", eventType: "JCP", recordDate: "2026-05-10", paymentDate: "2026-05-20", grossAmountPerUnit: "0.12345678", currency: "BRL", installment: "1", period: "2026" }).canonicalIdentity);
assert.equal(externalIncomeIdentity("brapi", { id: "abc" }, event).externalIdentityHash, externalIncomeIdentity("brapi", { id: "abc", changed: true }, event).externalIdentityHash);
assert.equal(multiplyDecimal("30", "0.12345678"), "3.7037034");
assert.equal(buildIncomeExpectation(event, "30").expectedNetAmount, null);
assert.deepEqual(resolveIncomeEligibilityDate({ exDate: "2026-05-11" }), { date: null, basis: "MARKET_CALENDAR_REQUIRED", confidence: "incomplete" });

const op = (operationType, date, quantity, extra = {}) => ({ id: crypto.randomUUID(), ticker: extra.ticker || "TEST3", assetName: "Teste", assetType: "Ação", operationType, date, quantity, unitPrice: extra.unitPrice || 10, fees: 0, totalValue: extra.totalValue || 0, ratioFrom: extra.ratioFrom, ratioTo: extra.ratioTo, attributedCost: extra.attributedCost, targetTicker: extra.targetTicker, targetAssetName: extra.targetAssetName, targetAssetType: extra.targetAssetType, targetQuantity: extra.targetQuantity, transferredCost: extra.transferredCost });
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10)], "TEST3", "2026-05-10"), 10);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-11", 10)], "TEST3", "2026-05-10"), 0);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10), op("VENDA", "2026-05-09", 4)], "TEST3", "2026-05-10"), 6);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10), op("VENDA", "2026-05-11", 10)], "TEST3", "2026-05-10"), 10);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10), op("SPLIT", "2026-05-05", 0, { ratioFrom: 1, ratioTo: 10 })], "TEST3", "2026-05-10"), 100);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10), op("BONUS", "2026-05-05", 2, { attributedCost: 0 })], "TEST3", "2026-05-10"), 12);
assert.equal(calculateEligibleQuantity([op("COMPRA", "2026-05-01", 10), op("CONVERSION", "2026-05-05", 10, { targetTicker: "NEW3", targetAssetName: "Novo", targetAssetType: "Ação", targetQuantity: 20, transferredCost: null })], "NEW3", "2026-05-10"), 20);

const incomeOperation = { id: crypto.randomUUID(), ticker: "TEST3", operationType: "DIVIDENDO", date: "2026-05-20", totalValue: 10 };
assert.equal(matchIncomeExpectation({ ticker: "TEST3", eventType: "DIVIDEND", expectedPaymentDate: "2026-05-20", grossAmount: 10 }, [incomeOperation]).status, "EXACT_MATCH");
assert.equal(matchIncomeExpectation({ ticker: "TEST3", eventType: "JCP", expectedPaymentDate: "2026-05-20", grossAmount: 10 }, [incomeOperation]).status, "NO_MATCH");
assert.equal(matchIncomeExpectation({ ticker: "TEST3", eventType: "DIVIDEND", expectedPaymentDate: "2026-05-21", grossAmount: 10 }, [incomeOperation]).status, "LIKELY_MATCH");
assert.equal(matchIncomeExpectation({ ticker: "TEST3", eventType: "DIVIDEND", expectedPaymentDate: "2026-05-20", grossAmount: 10 }, [incomeOperation, { ...incomeOperation, id: crypto.randomUUID() }]).status, "AMBIGUOUS");
console.log("Automatic income contracts, precision, eligibility and matching: OK");
