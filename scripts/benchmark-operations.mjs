import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { normalizeOperations } from "../lib/data/operations.js";
import { calculatePositions } from "../lib/engine/portfolio.js";

const BATCH_SIZE = 500;

function uuid(index) {
  return `70000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function fixtures(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: uuid(index + 1),
    ticker: `T${String(index % 50).padStart(3, "0")}`,
    assetName: `Ativo ${index % 50}`,
    assetType: "Ação",
    operationType: "COMPRA",
    date: `2026-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
    quantity: 1.12345678,
    unitPrice: 10.12345678,
    fees: 0.01,
    totalValue: 0,
    notes: "",
  }));
}

const results = [];
for (const count of [100, 1000, 10000]) {
  const input = fixtures(count);
  const start = performance.now();
  const normalized = normalizeOperations(input);
  const afterNormalize = performance.now();
  const ordered = [...normalized].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const afterList = performance.now();
  const positions = calculatePositions(ordered);
  const afterEngine = performance.now();
  assert.equal(normalized.length, count);
  assert.equal(positions.length, 50);
  const total = afterEngine - start;
  assert.ok(total < 5000, `${count}: benchmark excedeu 5 segundos`);
  results.push({
    count,
    normalizeMs: Number((afterNormalize - start).toFixed(2)),
    listMs: Number((afterList - afterNormalize).toFixed(2)),
    engineMs: Number((afterEngine - afterList).toFixed(2)),
    batches: Math.ceil(count / BATCH_SIZE),
  });
}

console.log(`Benchmark de operações aprovado: ${JSON.stringify(results)}`);
