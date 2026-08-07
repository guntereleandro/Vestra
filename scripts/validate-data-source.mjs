import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_SOURCE, DataSourceResolutionError, getDataSourceErrorMessage } from "../lib/services/dataSourceResolver.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(Object.keys(DATA_SOURCE).join(",") === "LOCAL,SUPABASE", "Fontes operacionais inesperadas.");
for (const code of ["NOT_AUTHENTICATED", "NO_ACTIVE_PORTFOLIO", "ACCESS_DENIED", "SESSION_EXPIRED", "NETWORK_UNAVAILABLE", "REMOTE_UNAVAILABLE"]) {
  assert(getDataSourceErrorMessage(new DataSourceResolutionError(code)).length > 20, `Estado ${code} sem mensagem segura.`);
}
const service = read("lib/services/operationsService.js");
assert(service.includes("resolveOperationsDataSource"), "CRUD nao usa o resolver.");
assert(!service.includes("Promise.all([") && !service.includes("dual"), "CRUD sugere escrita em mais de uma fonte.");
const hook = read("hooks/useInvestmentData.js");
assert(hook.includes("if (dataSource.source === DATA_SOURCE.LOCAL)"), "Persistencia local nao esta protegida por fonte.");
assert(hook.includes("DATA_SOURCE_CHANGED_EVENT"), "Troca de fonte/carteira nao invalida a tela.");
const portfolioService = read("lib/services/portfolioDataService.js");
assert(portfolioService.includes("portfolioHistory: data.portfolioHistory"), "Historico remoto nao acompanha a fonte ativa.");
assert(portfolioService.includes("if (source.source === DATA_SOURCE.SUPABASE)"), "Carga remota precisa de ramo explicito.");
assert(portfolioService.indexOf("portfolioHistory: data.portfolioHistory") < portfolioService.indexOf("export async function savePortfolioData"), "Carga remota nao esta isolada da gravacao Local.");
const syncService = read("lib/services/coreDomainSyncService.js");
assert(!syncService.includes("upsertByPortfolio(portfolioId, preferences)"), "Sincronizacao de dominio nao pode sobrescrever a fonte escolhida.");
console.log("Data Source Resolver: validacao aprovada.");
