import assert from "node:assert/strict";
import { calculateAveragePrice } from "../lib/engine/averagePrice.js";
import { calculatePositions } from "../lib/engine/portfolio.js";
import { calculatePortfolioTotals } from "../lib/engine/totals.js";
import { normalizeOperations } from "../lib/data/operations.js";

const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
  "00000000-0000-4000-8000-000000000008",
  "00000000-0000-4000-8000-000000000009",
];

function operation(index, ticker, operationType, date, quantity, unitPrice, fees, totalValue = 0) {
  return {
    id: ids[index],
    ticker,
    assetName: ticker === "AAA3" ? "Ativo A" : "Ativo B",
    assetType: "Ação",
    operationType,
    date,
    quantity,
    unitPrice,
    fees,
    totalValue,
    notes: "",
  };
}

export const FINANCIAL_REGRESSION_OPERATIONS = Object.freeze([
  operation(4, "AAA3", "DIVIDENDO", "2026-05-10", 0, 0, 0, 12),
  operation(2, "AAA3", "VENDA", "2026-03-10", 6, 20, 2),
  operation(0, "AAA3", "COMPRA", "2026-01-10", 10, 10, 2),
  operation(7, "BBB3", "COMPRA", "2026-02-15", 1.25, 100, 1.25),
  operation(1, "AAA3", "COMPRA", "2026-02-10", 5, 14, 1),
  operation(5, "AAA3", "JCP", "2026-06-10", 0, 0, 0, 8),
  operation(3, "AAA3", "VENDA", "2026-04-10", 9, 15, 1),
  operation(8, "BBB3", "RENDIMENTO", "2026-06-15", 0, 0, 0, 5),
  operation(6, "AAA3", "COMPRA", "2026-07-10", 2.5, 8, 0.5),
]);

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);
}

export function assertFinancialRegression(input, label = "memory") {
  const operations = normalizeOperations(input);
  assert.equal(operations.length, 9, `${label}: quantidade`);
  const positions = calculatePositions(
    operations,
    [{ ticker: "AAA3", currentQuote: 10 }, { ticker: "BBB3", currentQuote: 110 }],
  );
  const aaa = positions.find((position) => position.ticker === "AAA3");
  const bbb = positions.find((position) => position.ticker === "BBB3");
  const totals = calculatePortfolioTotals(positions);

  close(aaa.quantity, 2.5, `${label}: recompra`);
  close(aaa.invested, 20.5, `${label}: custo apos zerar`);
  close(aaa.averagePrice, 8.2, `${label}: preco medio recompra`);
  close(aaa.realizedProfit, 79, `${label}: lucro realizado`);
  close(aaa.dividends, 20, `${label}: dividendos e JCP`);
  close(bbb.quantity, 1.25, `${label}: quantidade fracionaria`);
  close(bbb.invested, 126.25, `${label}: compra com taxa`);
  close(bbb.dividends, 5, `${label}: rendimento`);
  close(totals.invested, 146.75, `${label}: total investido`);
  close(totals.current, 162.5, `${label}: patrimonio atual`);
  close(totals.profit, 15.75, `${label}: resultado nao realizado`);
  close(totals.realizedProfit, 79, `${label}: resultado realizado total`);
  close(totals.dividends, 25, `${label}: proventos acumulados`);

  close(calculateAveragePrice(operations.filter((item) => item.ticker === "AAA3")), 8.2, `${label}: averagePrice`);
  assert.deepEqual(
    calculatePositions(structuredClone(operations), [{ ticker: "AAA3", currentQuote: 10 }, { ticker: "BBB3", currentQuote: 110 }]),
    positions,
    `${label}: determinismo`,
  );
  return { positions, totals };
}
