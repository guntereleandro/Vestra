import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class MemoryStorage {
  #data = new Map();

  get length() {
    return this.#data.size;
  }

  key(index) {
    return [...this.#data.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#data.has(String(key)) ? this.#data.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#data.set(String(key), String(value));
  }

  removeItem(key) {
    this.#data.delete(String(key));
  }

  clear() {
    this.#data.clear();
  }

  keys() {
    return [...this.#data.keys()];
  }
}

globalThis.localStorage = new MemoryStorage();

const [
  { getRepositories, getRepositoryProvider },
  { repositoryContracts, validateRepositoryContract },
  { REPOSITORY_ERROR_CODES, RepositoryError },
  { LOCAL_DEFAULT_PORTFOLIO_ID, LOCAL_PROFILE_ID },
  { STORAGE_KEYS, clearVestraData, createBackup, readLocalData, restoreBackup, validateBackup },
  { isOperationUuid },
] = await Promise.all([
  import("../lib/repositories/repositoryRegistry.js"),
  import("../lib/repositories/contracts/index.js"),
  import("../lib/repositories/repositoryErrors.js"),
  import("../lib/repositories/repositoryTypes.js"),
  import("../lib/data/storage.js"),
  import("../lib/data/operations.js"),
]);

const repositories = getRepositories();
assert(getRepositoryProvider() === "local", "Provider inicial deve ser local.");
assert(
  Object.keys(REPOSITORY_ERROR_CODES).sort().join("|")
    === [
      "CONFLICT",
      "ENTITY_NOT_FOUND",
      "INVALID_INPUT",
      "REPOSITORY_NOT_INITIALIZED",
      "STORAGE_READ_ERROR",
      "STORAGE_WRITE_ERROR",
      "UNSUPPORTED_OPERATION",
    ].join("|"),
  "Catálogo de erros padronizados está incompleto.",
);

for (const [name, methods] of Object.entries(repositoryContracts)) {
  const validation = validateRepositoryContract(name, repositories[name]);
  assert(validation.valid, `${name}: contrato incompleto (${validation.missingMethods.join(", ")}).`);
  for (const method of methods) {
    assert(repositories[name][method].constructor.name === "AsyncFunction", `${name}.${method} deve ser assíncrono.`);
  }
}

const profile = await repositories.profiles.getCurrent();
assert(profile.id === LOCAL_PROFILE_ID, "Perfil local instável.");
const profileInput = { displayName: "Perfil isolado" };
const profileBefore = JSON.stringify(profileInput);
const savedProfile = await repositories.profiles.upsert(profileInput);
assert(savedProfile.id === LOCAL_PROFILE_ID && JSON.stringify(profileInput) === profileBefore, "Upsert de perfil inválido ou mutou entrada.");

const portfolios = await repositories.portfolios.list();
const activePortfolio = await repositories.portfolios.getActive();
assert(portfolios.length === 1 && activePortfolio.id === LOCAL_DEFAULT_PORTFOLIO_ID, "Carteira padrão local ausente.");
await repositories.portfolios.setActive(LOCAL_DEFAULT_PORTFOLIO_ID);

const assetInput = {
  portfolioId: LOCAL_DEFAULT_PORTFOLIO_ID,
  ticker: "TEST3",
  name: "Ativo de teste",
  type: "Ação",
  source: "validation",
};
const assetBefore = JSON.stringify(assetInput);
await repositories.assets.upsert(assetInput);
assert(JSON.stringify(assetInput) === assetBefore, "Upsert de ativo mutou a entrada.");
assert((await repositories.assets.getByTicker(LOCAL_DEFAULT_PORTFOLIO_ID, "TEST3")).name === "Ativo de teste", "CRUD de ativo falhou.");

const operationInput = {
  id: "10000000-0000-4000-8000-000000000001",
  ticker: "TEST3",
  assetName: "Ativo de teste",
  assetType: "Ação",
  operationType: "COMPRA",
  date: "2026-01-10",
  quantity: 10,
  unitPrice: 20,
  fees: 1,
  totalValue: 201,
  notes: "isolado",
};
const operationBefore = JSON.stringify(operationInput);
await repositories.operations.create(operationInput);
assert(JSON.stringify(operationInput) === operationBefore, "Create de operação mutou a entrada.");
let operations = await repositories.operations.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert(operations.length === 1 && operations[0].totalValue === 201, "Create/list de operação falhou.");
await repositories.operations.update(operationInput.id, { ...operationInput, quantity: 12 });
assert((await repositories.operations.getById(operationInput.id)).quantity === 12, "Update de operação falhou.");

const dividendInput = {
  id: "10000000-0000-4000-8000-000000000002",
  ticker: "TEST3",
  assetName: "Ativo de teste",
  assetType: "Ação",
  operationType: "DIVIDENDO",
  date: "2026-02-10",
  quantity: 0,
  unitPrice: 0,
  fees: 0,
  totalValue: 15,
  notes: "",
};
await repositories.dividends.create(dividendInput);
let dividends = await repositories.dividends.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert(dividends.length === 1 && dividends[0].id === dividendInput.id, "CRUD derivado de proventos falhou.");
await repositories.dividends.update(dividendInput.id, { ...dividendInput, totalValue: 18 });
dividends = await repositories.dividends.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert(dividends[0].totalValue === 18, "Update derivado de provento falhou.");

const quoteInput = { portfolioId: LOCAL_DEFAULT_PORTFOLIO_ID, ticker: "TEST3", currentQuote: 25, updatedAt: "2026-02-10" };
const quoteBefore = JSON.stringify(quoteInput);
await repositories.quotes.upsert(quoteInput);
assert(JSON.stringify(quoteInput) === quoteBefore, "Upsert de cotação mutou a entrada.");
assert((await repositories.quotes.getByTicker(LOCAL_DEFAULT_PORTFOLIO_ID, "TEST3")).currentQuote === 25, "CRUD de cotação falhou.");

const snapshot = {
  portfolioId: LOCAL_DEFAULT_PORTFOLIO_ID,
  id: "portfolio-history-2026-02-10",
  date: "2026-02-10",
  timestamp: 1,
  totalInvested: 241,
  currentValue: 300,
  profitLoss: 59,
  dividends: 18,
  positionsCount: 1,
};
await repositories.portfolioSnapshots.upsertDaily(snapshot);
await repositories.portfolioSnapshots.upsertDaily({ ...snapshot, timestamp: 2, currentValue: 301 });
let snapshots = await repositories.portfolioSnapshots.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert(snapshots.length === 1 && snapshots[0].currentValue === 301, "Upsert diário de snapshot falhou.");

const preferenceInput = { diagnosticPreferences: { maxPositionPercent: 25 } };
const preferenceBefore = JSON.stringify(preferenceInput);
const preferences = await repositories.preferences.upsertByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID, preferenceInput);
assert(preferences.diagnosticPreferences.maxPositionPercent === 25, "Preferências não foram persistidas.");
assert(JSON.stringify(preferenceInput) === preferenceBefore, "Preferências mutaram a entrada.");

const firstRead = JSON.stringify(await repositories.operations.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID));
const secondRead = JSON.stringify(await repositories.operations.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID));
assert(firstRead === secondRead, "Leitura de repositório não determinística.");

async function expectCode(action, code, label) {
  try {
    await action();
    throw new Error(`${label}: erro esperado não ocorreu.`);
  } catch (error) {
    assert(error instanceof RepositoryError && error.code === code, `${label}: código inesperado ${error?.code || error?.message}.`);
  }
}

await expectCode(
  () => repositories.operations.create({ ticker: "" }),
  REPOSITORY_ERROR_CODES.INVALID_INPUT,
  "Entrada inválida",
);
await expectCode(
  () => repositories.operations.listByPortfolio("outra-carteira"),
  REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND,
  "Isolamento por portfolioId",
);
await expectCode(
  () => repositories.portfolios.create({ name: "Outra" }),
  REPOSITORY_ERROR_CODES.UNSUPPORTED_OPERATION,
  "Múltiplas carteiras locais",
);

const backup = createBackup();
validateBackup(backup);
restoreBackup(backup);
assert((await repositories.operations.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID)).length === 2, "Backup/restore incompatível com repositórios.");

const allowedKeys = new Set(Object.values(STORAGE_KEYS));
const unexpectedKeys = localStorage.keys().filter((key) => !allowedKeys.has(key));
assert(unexpectedKeys.length === 0, `Novas chaves locais não autorizadas: ${unexpectedKeys.join(", ")}.`);

const repositoryFiles = fs.readdirSync(path.join(root, "lib", "repositories", "local"))
  .filter((name) => name.endsWith(".js"));
for (const file of repositoryFiles) {
  const source = fs.readFileSync(path.join(root, "lib", "repositories", "local", file), "utf8");
  assert(!source.includes("/engine/"), `${file}: adapter local não deve duplicar/importar regra financeira.`);
  assert(!source.includes("react"), `${file}: adapter local não deve acessar React.`);
}

await repositories.dividends.remove(dividendInput.id);
await repositories.operations.remove(operationInput.id);
await repositories.quotes.remove(LOCAL_DEFAULT_PORTFOLIO_ID, "TEST3");
await repositories.portfolioSnapshots.removeAllByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID);
assert((await repositories.operations.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID)).length === 0, "Remove de operação/provento falhou.");
assert((await repositories.quotes.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID)).length === 0, "Remove de cotação falhou.");
assert((await repositories.portfolioSnapshots.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID)).length === 0, "Limpeza de snapshots falhou.");

clearVestraData();
assert(localStorage.keys().filter((key) => allowedKeys.has(key)).length === 0, "Limpeza atual não removeu as chaves persistentes.");

localStorage.setItem(STORAGE_KEYS.operations, JSON.stringify([{
  id: "legacy-operation",
  ticker: "LEG3",
  assetName: "Legado",
  assetType: "Ação",
  operationType: "COMPRA",
  date: "2026-01-01",
  quantity: 1,
  unitPrice: 10,
  fees: 0,
}]));
const migratedId = readLocalData().operations[0].id;
assert(isOperationUuid(migratedId), "ID legado não foi migrado para UUID.");
assert(readLocalData().operations[0].id === migratedId, "Migração de UUID não foi idempotente.");
clearVestraData();

console.log("Repositórios validados: 8 contratos assíncronos, adapter local isolado, CRUD, backup, UUID e chaves legadas preservados.");
