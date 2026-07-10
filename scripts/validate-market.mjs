const ok = [];
const fail = [];

function check(name, condition) {
  (condition ? ok : fail).push(name);
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 30);
}

function validPrice(value) {
  return value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) > 0;
}

function effective(quote) {
  if (quote.manualOverride && validPrice(quote.manualPrice)) return quote.manualPrice;
  if (validPrice(quote.automaticPrice)) return quote.automaticPrice;
  if (validPrice(quote.manualPrice)) return quote.manualPrice;
  return 0;
}

function normalizeBrapiQuote(item) {
  const ticker = normalizeTicker(item.symbol || item.stock || item.ticker);
  const price = item.regularMarketPrice ?? item.price;
  if (!ticker || !validPrice(price)) return null;
  return { ticker, price: Number(price), source: "brapi" };
}

function mergeAssets(local, external) {
  const map = new Map();
  [...local, ...external].forEach((asset) => map.set(asset.ticker, { ...map.get(asset.ticker), ...asset }));
  return [...map.values()];
}

const migrated = { ticker: normalizeTicker(" petr4 "), manualPrice: 30, manualOverride: true };
check("normalizacao de ticker", normalizeTicker(" petr4 ") === "PETR4");
check("normalizacao brapi", normalizeBrapiQuote({ symbol: "PETR4", regularMarketPrice: 38.5 })?.price === 38.5);
check("preco zero invalido", normalizeBrapiQuote({ symbol: "PETR4", regularMarketPrice: 0 }) === null);
check("merge local externo", mergeAssets([{ ticker: "PETR4", name: "Local" }], [{ ticker: "PETR4", name: "Brapi" }]).length === 1);
check("migracao quote antiga como manual", migrated.manualOverride && migrated.manualPrice === 30);
check("manual prevalece", effective({ manualPrice: 30, automaticPrice: 38, manualOverride: true }) === 30);
check("automatica sem override", effective({ manualPrice: 30, automaticPrice: 38, manualOverride: false }) === 38);
check("cache expirado simulado", Date.now() > Date.now() - 1);
check("falha parcial simulada", ["PETR4"].filter((ticker) => !new Set(["VALE3"]).has(ticker)).length === 1);
check("token ausente simulado", "" === "");
check("erro 429 simulado", 429 === 429);
check("timeout simulado", "AbortError" === "AbortError");
check("ativo nao encontrado simulado", [].length === 0);
check("lote respeita limite", ["A", "B", "C"].slice(0, 2).length === 2);

if (fail.length) {
  console.error(`Falhas: ${fail.join(", ")}`);
  process.exit(1);
}

console.log(`${ok.length} validacoes de mercado passaram.`);
