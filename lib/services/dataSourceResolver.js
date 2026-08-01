import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "../supabase/client/browserClient.js";
import { LOCAL_DEFAULT_PORTFOLIO_ID } from "../repositories/repositoryTypes.js";
import { localAssetsRepository } from "../repositories/local/localAssetsRepository.js";
import { localOperationsRepository } from "../repositories/local/localOperationsRepository.js";
import { localQuotesRepository } from "../repositories/local/localQuotesRepository.js";
import { supabaseAssetsRepository } from "../repositories/supabase/supabaseAssetsRepository.js";
import { supabaseOperationsRepository } from "../repositories/supabase/supabaseOperationsRepository.js";
import { supabasePortfoliosRepository } from "../repositories/supabase/supabasePortfoliosRepository.js";
import { supabasePreferencesRepository } from "../repositories/supabase/supabasePreferencesRepository.js";
import { supabaseQuotesRepository } from "../repositories/supabase/supabaseQuotesRepository.js";

export const DATA_SOURCE = Object.freeze({ LOCAL: "LOCAL", SUPABASE: "SUPABASE" });
export const DATA_SOURCE_CHANGED_EVENT = "vestra:data-source-changed";

let sessionOverride = null;
const remoteCache = new Map();

export class DataSourceResolutionError extends Error {
  constructor(code, options = {}) {
    super(code, { cause: options.cause });
    this.name = "DataSourceResolutionError";
    this.code = code;
  }
}

function emitChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_SOURCE_CHANGED_EVENT));
}

function localResolution(reason = "PREFERENCE_LOCAL") {
  return {
    source: DATA_SOURCE.LOCAL,
    portfolioId: LOCAL_DEFAULT_PORTFOLIO_ID,
    portfolioName: "Carteira local",
    role: "owner",
    canWrite: true,
    reason,
    operationsRepository: localOperationsRepository,
    assetsRepository: localAssetsRepository,
    quotesRepository: localQuotesRepository,
  };
}

function mapResolutionError(error) {
  if (error instanceof DataSourceResolutionError) return error;
  const status = error?.cause?.status || error?.cause?.cause?.status;
  const code = error?.cause?.code || error?.cause?.cause?.code;
  if (["refresh_token_not_found", "refresh_token_already_used", "bad_jwt"].includes(code || error?.code)) return new DataSourceResolutionError("SESSION_EXPIRED", { cause: error });
  if (status === 401) return new DataSourceResolutionError("SESSION_EXPIRED", { cause: error });
  if (status === 403 || code === "42501") return new DataSourceResolutionError("ACCESS_DENIED", { cause: error });
  if (error instanceof TypeError) return new DataSourceResolutionError("NETWORK_UNAVAILABLE", { cause: error });
  return new DataSourceResolutionError("REMOTE_UNAVAILABLE", { cause: error });
}

async function remoteContext() {
  const { data, error } = await createBrowserSupabaseClient().auth.getUser();
  if (error?.code === "session_not_found") throw new DataSourceResolutionError("NOT_AUTHENTICATED");
  if (error) throw mapResolutionError(error);
  const user = data.user;
  if (!user) throw new DataSourceResolutionError("NOT_AUTHENTICATED");
  const portfolio = await supabasePortfoliosRepository.getActive();
  if (!portfolio) throw new DataSourceResolutionError("NO_ACTIVE_PORTFOLIO");
  if (!portfolio.role) throw new DataSourceResolutionError("ACCESS_DENIED");
  const preferences = await supabasePreferencesRepository.getByPortfolio(portfolio.id);
  return { user, portfolio, preferences };
}

export async function resolveOperationsDataSource({ loadRemote = true } = {}) {
  if (sessionOverride === DATA_SOURCE.LOCAL) return localResolution("SESSION_OVERRIDE");
  if (!isBrowserSupabaseConfigured()) return localResolution("NO_CONFIGURATION");
  const { data: sessionData, error: sessionError } = await createBrowserSupabaseClient().auth.getSession();
  if (sessionError) throw mapResolutionError(sessionError);
  if (!sessionData.session) return localResolution("NO_LOGIN");

  let context;
  try {
    context = await remoteContext();
  } catch (error) {
    if (error.code === "NOT_AUTHENTICATED") return localResolution("NO_LOGIN");
    throw mapResolutionError(error);
  }
  if (context.preferences.dataSource !== DATA_SOURCE.SUPABASE) return localResolution();

  const resolution = {
    source: DATA_SOURCE.SUPABASE,
    portfolioId: context.portfolio.id,
    portfolioName: context.portfolio.name,
    role: context.portfolio.role,
    canWrite: ["owner", "editor"].includes(context.portfolio.role),
    reason: "PREFERENCE_SUPABASE",
    operationsRepository: supabaseOperationsRepository,
    assetsRepository: supabaseAssetsRepository,
    quotesRepository: supabaseQuotesRepository,
  };
  if (loadRemote) {
    try {
      resolution.remoteData = await loadRemotePortfolioData(resolution, { allowCache: true });
    } catch (error) {
      throw mapResolutionError(error);
    }
  }
  return resolution;
}

export async function loadRemotePortfolioData(resolution, { allowCache = true } = {}) {
  const portfolioId = resolution?.portfolioId;
  if (!portfolioId) throw new DataSourceResolutionError("NO_ACTIVE_PORTFOLIO");
  if (allowCache && remoteCache.has(portfolioId)) return remoteCache.get(portfolioId);
  const [operations, assetsMaster, quotes] = await Promise.all([
    supabaseOperationsRepository.listByPortfolio(portfolioId),
    supabaseAssetsRepository.listByPortfolio(portfolioId),
    supabaseQuotesRepository.listByPortfolio(portfolioId),
  ]);
  const updatedAt = operations.reduce(
    (latest, operation) => operation.updatedAt > latest ? operation.updatedAt : latest,
    "",
  );
  const data = { operations, assetsMaster, quotes, loadedAt: new Date().toISOString(), updatedAt };
  remoteCache.set(portfolioId, data);
  return data;
}

export async function selectPortfolioDataSource(source) {
  if (!Object.values(DATA_SOURCE).includes(source)) throw new DataSourceResolutionError("INVALID_SOURCE");
  const context = await remoteContext().catch((error) => { throw mapResolutionError(error); });
  if (source === DATA_SOURCE.SUPABASE) {
    await loadRemotePortfolioData({ portfolioId: context.portfolio.id }, { allowCache: false });
  }
  await supabasePreferencesRepository.upsertByPortfolio(context.portfolio.id, {
    ...context.preferences,
    dataSource: source,
  });
  sessionOverride = null;
  clearRemoteOperationsCache();
  emitChange();
  return { source, portfolio: context.portfolio };
}

export async function getDataSourceSelectionStatus() {
  const context = await remoteContext().catch((error) => { throw mapResolutionError(error); });
  const [localOperations, remoteData] = await Promise.all([
    localOperationsRepository.listByPortfolio(LOCAL_DEFAULT_PORTFOLIO_ID),
    loadRemotePortfolioData({ portfolioId: context.portfolio.id }, { allowCache: false }),
  ]);
  return {
    selectedSource: context.preferences.dataSource,
    portfolio: context.portfolio,
    localOperationCount: localOperations.length,
    remoteOperationCount: remoteData.operations.length,
    remoteUpdatedAt: remoteData.updatedAt,
    checkedAt: remoteData.loadedAt,
    canWrite: ["owner", "editor"].includes(context.portfolio.role),
  };
}

export function activateLocalSessionFallback() {
  sessionOverride = DATA_SOURCE.LOCAL;
  clearRemoteOperationsCache();
  emitChange();
  return localResolution("SESSION_OVERRIDE");
}

export function clearRemoteOperationsCache() {
  remoteCache.clear();
}

export function resetDataSourceRuntime() {
  sessionOverride = null;
  clearRemoteOperationsCache();
  emitChange();
}

export function invalidateRemotePortfolioCache(portfolioId) {
  if (portfolioId) remoteCache.delete(portfolioId);
}

export async function selectActiveRemotePortfolio(portfolioId) {
  const portfolio = await supabasePortfoliosRepository.setActive(portfolioId);
  sessionOverride = null;
  clearRemoteOperationsCache();
  emitChange();
  return portfolio;
}

export function getDataSourceErrorMessage(error) {
  const messages = {
    NOT_AUTHENTICATED: "Entre na sua conta para usar a carteira remota.",
    NO_ACTIVE_PORTFOLIO: "Selecione uma carteira remota antes de continuar.",
    ACCESS_DENIED: "Você não possui acesso a esta carteira.",
    SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
    NETWORK_UNAVAILABLE: "A rede está indisponível. Seus dados locais continuam preservados.",
    REMOTE_UNAVAILABLE: "Não foi possível carregar a carteira remota.",
    INVALID_SOURCE: "A fonte selecionada é inválida.",
  };
  return messages[error?.code] || messages.REMOTE_UNAVAILABLE;
}
