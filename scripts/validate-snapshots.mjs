import assert from "node:assert/strict";
import { normalizePortfolioHistory } from "../lib/data/portfolioHistory.js";
import { reconcileSnapshots } from "../lib/services/snapshotsMigrationService.js";

const first = { id: "a", date: "2026-08-01", timestamp: 1, totalInvested: 100, currentValue: 110, profitLoss: 10, dividends: 0, positionsCount: 1 };
const updated = { ...first, timestamp: 2, currentValue: 115, profitLoss: 15 };
const second = { ...first, id: "b", date: "2026-08-02", timestamp: 3, currentValue: 120, profitLoss: 20 };
const normalized = normalizePortfolioHistory([first, second, updated]);
assert.equal(normalized.length, 2, "Mesmo dia deve ser idempotente.");
assert.equal(normalized[0].currentValue, 115, "Atualização mais recente do dia deve vencer.");
assert.deepEqual(normalized.map((item) => item.date), ["2026-08-01", "2026-08-02"]);
const equivalent = reconcileSnapshots(normalized, normalized);
assert.equal(equivalent.identical.length, 2);
assert.equal(equivalent.missing.length, 0);
const preview = reconcileSnapshots([first, second], [{ ...first, currentValue: 999 }]);
assert.equal(preview.conflicts.length, 1, "Conflito por data deve ser explícito.");
assert.equal(preview.missing.length, 1, "Data ausente deve ser importável.");
assert.equal(preview.conflicts[0].date, "2026-08-01");
console.log("Snapshots validados: normalização, ordenação, idempotência, repetição e conflitos.");
