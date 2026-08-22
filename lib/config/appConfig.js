import { brandConfig } from "./brandConfig.js";

export const appConfig = {
  appName: brandConfig.appName,
  appVersion: "0.8.2",
  knowledgeProvider: "local",
  enableRemoteKnowledge: false,
  enableKnowledgeAdmin: false,
  defaultCurrency: brandConfig.defaultCurrency,
  locale: brandConfig.defaultLocale,
  supportEmail: brandConfig.supportEmail,
  maintenanceMode: false,
  enablePortfolioHistory: true,
  enableAssetDetails: true,
  enableAllocationChart: true,
  enablePortfolioSummary: true,
  marketProvider: "brapi",
  quoteCacheTtlMinutes: 30,
  enableAutomaticQuotes: true,
  automaticQuoteRefreshMinutes: 30,
  maxTickersPerRequest: 1,
  marketQuoteConcurrency: 3,
  marketRequestTimeoutMs: 7000,
  marketClientTimeoutMs: 12000,
  marketSlowRequestMs: 4000,
  marketRateLimitPerMinute: 60,
  marketHistoryRanges: ["1mo", "3mo"],
  enableMarketMetadata: true,
  allowManualQuoteFallback: true,
};

// Futuramente estas configuracoes poderao vir de um banco de dados e de um painel administrativo protegido.
