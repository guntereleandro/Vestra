import { normalizeQuoteRecord, normalizeQuotes } from "../../data/quotes.js";
import { normalizeTicker } from "../../data/assetsMaster.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { getSupabaseRepositoryClient, throwSupabaseRepositoryError } from "./supabaseRepositoryUtils.js";

const COLUMNS = [
  "portfolio_id", "ticker", "manual_price", "automatic_price", "manual_override",
  "manual_updated_at", "automatic_updated_at", "automatic_source", "stale",
].join(", ");

function toRow(portfolioId, quote) {
  return {
    portfolio_id: portfolioId,
    ticker: quote.ticker,
    manual_price: quote.manualPrice,
    automatic_price: quote.automaticPrice,
    manual_override: quote.manualOverride,
    manual_updated_at: quote.manualUpdatedAt || null,
    automatic_updated_at: quote.automaticUpdatedAt || null,
    automatic_source: quote.automaticSource || null,
    stale: quote.stale,
  };
}

function fromRow(row) {
  if (!row) return null;
  return normalizeQuoteRecord({
    ticker: row.ticker,
    manualPrice: row.manual_price,
    automaticPrice: row.automatic_price,
    manualOverride: row.manual_override,
    manualUpdatedAt: row.manual_updated_at,
    automaticUpdatedAt: row.automatic_updated_at,
    automaticSource: row.automatic_source,
    stale: row.stale,
  });
}

export function createSupabaseQuotesRepository(client) {
  return {
    async listByPortfolio(portfolioId) {
      if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_asset_quotes").select(COLUMNS).eq("portfolio_id", portfolioId).order("ticker");
      throwSupabaseRepositoryError(error);
      return (data || []).map(fromRow).filter(Boolean);
    },

    async getByTicker(portfolioId, ticker) {
      const normalizedTicker = normalizeTicker(ticker);
      if (!portfolioId || !normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_asset_quotes").select(COLUMNS)
        .eq("portfolio_id", portfolioId).eq("ticker", normalizedTicker).maybeSingle();
      throwSupabaseRepositoryError(error);
      return fromRow(data);
    },

    async upsert(input) {
      const quote = normalizeQuoteRecord(input);
      if (!input?.portfolioId || !quote) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_asset_quotes").upsert(toRow(input.portfolioId, quote), {
          onConflict: "portfolio_id,ticker",
        }).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },

    async remove(portfolioId, ticker) {
      const normalizedTicker = normalizeTicker(ticker);
      if (!portfolioId || !normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { error, count } = await getSupabaseRepositoryClient(client)
        .from("portfolio_asset_quotes").delete({ count: "exact" })
        .eq("portfolio_id", portfolioId).eq("ticker", normalizedTicker);
      throwSupabaseRepositoryError(error, "write");
      if (!count) throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      return true;
    },

    async replaceAllByPortfolio(portfolioId, quotes) {
      if (!portfolioId || !Array.isArray(quotes)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const normalized = normalizeQuotes(quotes);
      if (normalized.length !== quotes.length) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      if (!normalized.length) return [];
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_asset_quotes").upsert(
          normalized.map((quote) => toRow(portfolioId, quote)),
          { onConflict: "portfolio_id,ticker" },
        ).select(COLUMNS);
      throwSupabaseRepositoryError(error, "write");
      return (data || []).map(fromRow).filter(Boolean);
    },
  };
}

export const supabaseQuotesRepository = createSupabaseQuotesRepository();
