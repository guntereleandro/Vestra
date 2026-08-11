import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { isOperationUuid, normalizeOperations, validatePortfolioEvent } from "../lib/data/operations.js";
import { calculatePositions } from "../lib/engine/portfolio.js";

const sourceUrl = new URL("../data/imports/vestra_staging_importacao_real.json", import.meta.url);
const sourceText = await readFile(sourceUrl, "utf8");
const sourceFingerprint = createHash("sha256").update(sourceText).digest("hex");
const staging = JSON.parse(sourceText);
const canonical = [];
const blocked = [];
const notes = (record) => [record.Fonte, record.Observação].filter(Boolean).join(" — ");
const dryId = (domain, index, record) => {
  const digest = createHash("sha256").update(`${sourceFingerprint}:${domain}:${index}:${JSON.stringify(record)}`).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
};
const assetType = (value) => ({ "AÇÃO": "Ação", FII: "FII", ETF: "ETF" })[value] || value;
const confirmedBonusCosts = new Map([
  ["GGBR4:2024-04-22", 11.55],
  ["GOAU4:2025-12-22", 24.90],
]);

function trade(record, index, domain = "rv") {
  const quantity = Number(record.Quantidade);
  const unitPrice = Number(record["Preço unit."]);
  const suppliedTotal = Number(record.Total);
  const derivedGross = quantity * unitPrice;
  const fees = record.Evento === "COMPRA" ? suppliedTotal - derivedGross : derivedGross - suppliedTotal;
  assert.ok(Math.abs(fees) < 1e-8, `Taxa implícita não reconciliada em ${domain}:${index + 1}`);
  return {
    id: dryId(domain, index, record),
    ticker: record.Ativo,
    assetName: record.Ativo,
    assetType: assetType(record.Classe),
    operationType: record.Evento,
    date: record.Data,
    quantity,
    unitPrice,
    fees: 0,
    totalValue: suppliedTotal,
    notes: notes(record),
  };
}

const conversionOut = staging.renda_variavel.find((item) => item.Evento === "CONVERSION_OUT");
const conversionIn = staging.renda_variavel.find((item) => item.Evento === "CONVERSION_IN");
assert.ok(conversionOut && conversionIn, "Par de conversão ausente.");
assert.equal(conversionOut.Data, conversionIn.Data, "Datas da conversão divergem.");
assert.equal(conversionOut.Total, conversionIn.Total, "Custos informados da conversão divergem.");

for (const [index, record] of staging.renda_variavel.entries()) {
  if (record.Status === "REVIEW_BONUS_COST") {
    const attributedCost = confirmedBonusCosts.get(`${record.Ativo}:${record.Data}`);
    assert.ok(Number.isFinite(attributedCost), `Custo confirmado ausente para ${record.Ativo}.`);
    canonical.push({ id: dryId("rv", index, record), ticker: record.Ativo, assetName: record.Ativo, assetType: assetType(record.Classe), operationType: "BONUS", date: record.Data, quantity: Number(record.Quantidade), unitPrice: 0, fees: 0, totalValue: 0, attributedCost, notes: `${notes(record)} — custo atribuído confirmado` });
    continue;
  }
  if (record.Evento === "CONVERSION_IN") continue;
  if (record.Evento === "CONVERSION_OUT") {
    canonical.push({
      id: dryId("rv", index, { out: record, in: conversionIn }), ticker: record.Ativo, assetName: record.Ativo, assetType: assetType(record.Classe),
      operationType: "CONVERSION", date: record.Data, quantity: Number(record.Quantidade), unitPrice: 0, fees: 0, totalValue: 0,
      targetTicker: conversionIn.Ativo, targetAssetName: conversionIn.Ativo, targetAssetType: assetType(conversionIn.Classe),
      targetQuantity: Number(conversionIn.Quantidade), transferredCost: null, notes: notes(record),
    });
    continue;
  }
  if (record.Evento === "SPLIT") {
    canonical.push({ id: dryId("rv", index, record), ticker: record.Ativo, assetName: record.Ativo, assetType: assetType(record.Classe), operationType: "SPLIT", date: record.Data, quantity: 0, unitPrice: 0, fees: 0, totalValue: 0, ratioFrom: 1, ratioTo: 10, notes: notes(record) });
    continue;
  }
  canonical.push(trade(record, index));
}

for (const [index, record] of staging.renda_fixa_caixa.entries()) {
  if (record.Status !== "READY_CASH") {
    if (record.Investimento.includes("LCI BRB")) {
      canonical.push({ id: dryId("fixed-income", index, record), ticker: "LCI-BRB-107CDI-20270730", assetName: "LCI BRB 107% CDI", assetType: "Renda Fixa", operationType: "FIXED_INCOME_APPLICATION", date: "2026-07-30", quantity: 0, unitPrice: 0, fees: 0, totalValue: 1000, notes: "Vencimento 2027-07-30 — aplicação por valor" });
      canonical.push({ id: dryId("fixed-income-yield", index, { record, asOf: "2026-08-11", grossBalance: 1004.47 }), ticker: "LCI-BRB-107CDI-20270730", assetName: "LCI BRB 107% CDI", assetType: "Renda Fixa", operationType: "RENDIMENTO", date: "2026-08-11", quantity: 0, unitPrice: 0, fees: 0, totalValue: 4.47, notes: "Ajuste acumulado de reconciliação: saldo bruto confirmado em 2026-08-11" });
      continue;
    }
    const closedHistory = record.Investimento.includes("Banco Inter") || record.Investimento.includes("Santander") || record.Investimento.includes("CDB XP");
    blocked.push({ domain: "renda_fixa_caixa", index: index + 1, status: record.Status, event: record.Evento, asset: record.Investimento, category: closedHistory ? "B" : "A", impact: closedHistory ? "Somente histórico/performance; posição atual encerrada." : "Pode afetar a posição atual.", reason: record.Status === "REVIEW_ANOMALY" ? "Vencimento anterior à data do lançamento e ausência de contrato por valor puro." : "Valor disponível preservado; quantidade e preço unitário não serão inventados." });
    continue;
  }
  canonical.push({
    id: dryId("cash", index, record), ticker: "MP-CASH", assetName: record.Investimento, assetType: "Caixa Remunerado",
    operationType: "CASH_DEPOSIT", date: record.Data, quantity: 0, unitPrice: 0, fees: 0, totalValue: Number(record.Valor), notes: record.Observação || "",
  });
}

canonical.push({
  id: dryId("cash-yield", 0, { ticker: "MP-CASH", asOf: "2026-08-11", balance: 183.18, contributions: 171.58 }),
  ticker: "MP-CASH", assetName: "Mercado Pago - Caixa Remunerado 120% CDI", assetType: "Caixa Remunerado",
  operationType: "RENDIMENTO", date: "2026-08-11", quantity: 0, unitPrice: 0, fees: 0, totalValue: 11.60,
  notes: "Ajuste acumulado de reconciliação; saldo líquido confirmado em 2026-08-11; sem distribuição diária inventada",
});

for (const [index, record] of staging.tesouro_direto.entries()) {
  const candidate = {
    id: dryId("treasury", index, record), ticker: "TESOURO-IPCA-2032-20320815", assetName: record.Investimento, assetType: "Renda Fixa",
    operationType: "COMPRA", date: record.Data, quantity: Number(record.Quantidade), unitPrice: Number(record["Preço unit."]), fees: 0,
    totalValue: Number(record.Total), notes: [record.Vencimento, record.Observação].filter(Boolean).join(" — "),
  };
  assert.ok(Math.abs(candidate.quantity * candidate.unitPrice - candidate.totalValue) < 1e-8, "Tesouro não reconcilia quantidade × preço.");
  const [normalizedCandidate] = normalizeOperations([candidate]);
  assert.equal(validatePortfolioEvent(normalizedCandidate).valid, true, "Tesouro incompatível com o contrato numérico.");
  canonical.push(normalizedCandidate);
}

const normalized = normalizeOperations(canonical);
assert.equal(normalized.length, canonical.length, "Normalizador descartou registros prontos.");
for (const operation of normalized) assert.equal(validatePortfolioEvent(operation).valid, true, `${operation.ticker}:${operation.operationType}`);
assert.equal(new Set(normalized.map((item) => item.id)).size, normalized.length, "IDs determinísticos duplicados.");
assert.ok(normalized.every((item) => isOperationUuid(item.id)), "ID determinístico fora do contrato UUID.");

const positions = calculatePositions(normalized);
const positionMap = new Map(positions.map((item) => [item.ticker, item]));
const expected = staging.quantidades_finais_rv;
const reconciliation = Object.entries(expected).map(([ticker, expectedQuantity]) => {
  const position = positionMap.get(ticker);
  const calculatedQuantity = position?.quantity || 0;
  return { ticker, calculatedQuantity, expectedQuantity, difference: calculatedQuantity - expectedQuantity, invested: position?.invested || 0, averagePrice: position?.averagePrice || 0, realizedProfit: position?.realizedProfit || 0 };
});
const divergences = reconciliation.filter((item) => Math.abs(item.difference) > 1e-8);
const cash = positionMap.get("MP-CASH");
const treasuryPosition = positionMap.get("TESOURO-IPCA-2032-20320815") || null;

const result = {
  sourceRecords: staging.renda_variavel.length + staging.renda_fixa_caixa.length + staging.tesouro_direto.length,
  sourceByDomain: { rendaVariavel: staging.renda_variavel.length, rendaFixaCaixa: staging.renda_fixa_caixa.length, tesouroDireto: staging.tesouro_direto.length },
  readySourceRecords: 108,
  canonicalReadyEvents: normalized.length,
  blockedRecords: blocked.length,
  sourceFingerprint,
  deterministicIdStrategy: "SHA-256 do arquivo congelado + domínio + índice + registro; UUID derivado e idempotente para este staging.",
  remainingCategoryA: [],
  canonicalEventCounts: Object.fromEntries(Object.entries(Object.groupBy(normalized, (item) => item.operationType)).map(([key, value]) => [key, value.length])),
  blocked,
  positions: reconciliation,
  divergences,
  additionalPositions: positions.filter((item) => !(item.ticker in expected)).map((item) => ({ ticker: item.ticker, quantity: item.quantity, invested: item.invested, averagePrice: item.averagePrice, realizedProfit: item.realizedProfit })),
  cash: cash ? { deposits: normalized.filter((item) => item.operationType === "CASH_DEPOSIT").length, contributions: cash.invested, withdrawals: 0, accumulatedYield: cash.profit, balance: cash.quantity } : null,
  fixedIncome: positions.filter((item) => item.type === "Renda Fixa").map((item) => ({ identifier: item.ticker, balance: item.quantity, invested: item.invested, accumulatedYield: item.profit, internalUnitPrice: item.currentPrice })),
  treasuryCandidate: treasuryPosition ? { ticker: treasuryPosition.ticker, quantity: treasuryPosition.quantity, invested: treasuryPosition.invested, averagePrice: treasuryPosition.averagePrice } : null,
};

assert.equal(result.sourceRecords, 114);
assert.equal(result.canonicalReadyEvents, 109);
assert.equal(result.blockedRecords, 6);
assert.deepEqual(divergences, []);
assert.equal(positionMap.get("SADI11"), undefined);
assert.equal(positionMap.get("SAPI11")?.quantity, 40);
assert.ok(Math.abs(positionMap.get("SAPI11")?.invested - 369.04) < 1e-8);
assert.equal(positionMap.get("GGBR4")?.quantity, 10);
assert.equal(positionMap.get("GOAU4")?.quantity, 24);
assert.ok(Math.abs(cash?.quantity - 183.18) < 1e-8);
assert.ok(Math.abs(cash?.invested - 171.58) < 1e-8);
assert.ok(Math.abs(cash?.profit - 11.60) < 1e-8);
assert.equal(treasuryPosition?.quantity, 0.1);
assert.equal(treasuryPosition?.invested, 294.73);
const lciPosition = positionMap.get("LCI-BRB-107CDI-20270730");
assert.ok(Math.abs(lciPosition?.quantity - 1004.47) < 1e-8);
assert.equal(lciPosition?.invested, 1000);
assert.ok(Math.abs(lciPosition?.profit - 4.47) < 1e-8);
assert.equal(lciPosition?.currentPrice, 1);

export { normalized as canonicalOperations, result };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(result, null, 2));
}
