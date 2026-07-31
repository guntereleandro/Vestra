import { normalizeAssetRecord, normalizeAssetsMaster, normalizeTicker } from "../../data/assetsMaster.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import {
  assertRecordInput,
  getSupabaseRepositoryClient,
  throwSupabaseRepositoryError,
} from "./supabaseRepositoryUtils.js";

const COLUMNS = [
  "portfolio_id", "ticker", "name", "short_name", "asset_type", "subtype", "sector",
  "segment", "country", "currency", "exchange", "isin", "cnpj", "logo_path", "source",
  "notes", "description", "website", "provider_limitations", "source_updated_at",
].join(", ");

function toRow(portfolioId, asset) {
  return {
    portfolio_id: portfolioId,
    ticker: asset.ticker,
    name: asset.name,
    short_name: asset.shortName,
    asset_type: asset.type,
    subtype: asset.subtype || null,
    sector: asset.sector || null,
    segment: asset.segment || null,
    country: asset.country,
    currency: asset.currency,
    exchange: asset.exchange,
    isin: asset.isin || null,
    cnpj: asset.cnpj || null,
    logo_path: asset.logoPath || null,
    source: asset.source,
    notes: asset.notes || null,
    description: asset.description || null,
    website: asset.website || null,
    provider_limitations: asset.providerLimitations,
    source_updated_at: asset.updatedAt,
  };
}

function fromRow(row) {
  if (!row) return null;
  return normalizeAssetRecord({
    portfolioId: row.portfolio_id,
    ticker: row.ticker,
    name: row.name,
    shortName: row.short_name,
    type: row.asset_type,
    subtype: row.subtype,
    sector: row.sector,
    segment: row.segment,
    country: row.country,
    currency: row.currency,
    exchange: row.exchange,
    isin: row.isin,
    cnpj: row.cnpj,
    logoPath: row.logo_path,
    source: row.source,
    notes: row.notes,
    description: row.description,
    website: row.website,
    providerLimitations: row.provider_limitations,
    updatedAt: row.source_updated_at,
  });
}

export function createSupabaseAssetsRepository(client) {
  return {
    async listByPortfolio(portfolioId) {
      if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_assets").select(COLUMNS).eq("portfolio_id", portfolioId).order("ticker");
      throwSupabaseRepositoryError(error);
      return (data || []).map(fromRow).filter(Boolean);
    },

    async getByTicker(portfolioId, ticker) {
      const normalizedTicker = normalizeTicker(ticker);
      if (!portfolioId || !normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_assets").select(COLUMNS)
        .eq("portfolio_id", portfolioId).eq("ticker", normalizedTicker).maybeSingle();
      throwSupabaseRepositoryError(error);
      return fromRow(data);
    },

    async upsert(input) {
      assertRecordInput(input);
      const asset = normalizeAssetRecord(input);
      if (!input.portfolioId || !asset) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_assets").upsert(toRow(input.portfolioId, asset), {
          onConflict: "portfolio_id,ticker",
        }).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },

    async remove(portfolioId, ticker) {
      const normalizedTicker = normalizeTicker(ticker);
      if (!portfolioId || !normalizedTicker) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { error, count } = await getSupabaseRepositoryClient(client)
        .from("portfolio_assets").delete({ count: "exact" })
        .eq("portfolio_id", portfolioId).eq("ticker", normalizedTicker);
      throwSupabaseRepositoryError(error, "write");
      if (!count) throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      return true;
    },

    async replaceAllByPortfolio(portfolioId, assets) {
      if (!portfolioId || !Array.isArray(assets)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const normalized = normalizeAssetsMaster(assets);
      if (normalized.length !== assets.length) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      if (!normalized.length) return [];
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_assets").upsert(
          normalized.map((asset) => toRow(portfolioId, asset)),
          { onConflict: "portfolio_id,ticker" },
        ).select(COLUMNS);
      throwSupabaseRepositoryError(error, "write");
      return (data || []).map(fromRow).filter(Boolean);
    },
  };
}

export const supabaseAssetsRepository = createSupabaseAssetsRepository();
