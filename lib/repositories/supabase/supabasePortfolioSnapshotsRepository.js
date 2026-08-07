import { normalizePortfolioHistory } from "../../data/portfolioHistory.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { getSupabaseRepositoryClient, throwSupabaseRepositoryError } from "./supabaseRepositoryUtils.js";

const COLUMNS = "id, portfolio_id, snapshot_date, total_invested, current_value, profit_loss, dividends, positions_count, observed_at, created_at, updated_at";

function requirePortfolio(portfolioId) {
  if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
}

function fromRow(row) {
  if (!row) return null;
  return normalizePortfolioHistory([{
    id: row.id,
    portfolioId: row.portfolio_id,
    date: row.snapshot_date,
    timestamp: Date.parse(row.observed_at || row.updated_at || `${row.snapshot_date}T00:00:00Z`),
    totalInvested: Number(row.total_invested),
    currentValue: Number(row.current_value),
    profitLoss: Number(row.profit_loss),
    dividends: Number(row.dividends),
    positionsCount: Number(row.positions_count),
  }])[0] || null;
}

function toRow(portfolioId, snapshot) {
  const normalized = normalizePortfolioHistory([snapshot])[0];
  if (!normalized) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  return {
    portfolio_id: portfolioId,
    snapshot_date: normalized.date,
    total_invested: normalized.totalInvested,
    current_value: normalized.currentValue,
    profit_loss: normalized.profitLoss,
    dividends: normalized.dividends,
    positions_count: normalized.positionsCount,
    observed_at: new Date(normalized.timestamp).toISOString(),
  };
}

export function createSupabasePortfolioSnapshotsRepository(client) {
  const table = () => getSupabaseRepositoryClient(client).from("portfolio_snapshots");
  return {
    async listByPortfolio(portfolioId) {
      requirePortfolio(portfolioId);
      const { data, error } = await table().select(COLUMNS).eq("portfolio_id", portfolioId)
        .order("snapshot_date", { ascending: true });
      throwSupabaseRepositoryError(error);
      return (data || []).map(fromRow).filter(Boolean);
    },
    async getRange(portfolioId, startDate, endDate) {
      requirePortfolio(portfolioId);
      let query = table().select(COLUMNS).eq("portfolio_id", portfolioId);
      if (startDate) query = query.gte("snapshot_date", startDate);
      if (endDate) query = query.lte("snapshot_date", endDate);
      const { data, error } = await query.order("snapshot_date", { ascending: true });
      throwSupabaseRepositoryError(error);
      return (data || []).map(fromRow).filter(Boolean);
    },
    async getLatest(portfolioId) {
      requirePortfolio(portfolioId);
      const { data, error } = await table().select(COLUMNS).eq("portfolio_id", portfolioId)
        .order("snapshot_date", { ascending: false }).limit(1).maybeSingle();
      throwSupabaseRepositoryError(error);
      return fromRow(data);
    },
    async upsertDaily(snapshot) {
      requirePortfolio(snapshot?.portfolioId);
      const { data, error } = await table().upsert(toRow(snapshot.portfolioId, snapshot), {
        onConflict: "portfolio_id,snapshot_date",
      }).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },
    async removeAllByPortfolio(portfolioId) {
      requirePortfolio(portfolioId);
      const { error } = await table().delete().eq("portfolio_id", portfolioId);
      throwSupabaseRepositoryError(error, "write");
      return true;
    },
  };
}

export const supabasePortfolioSnapshotsRepository = createSupabasePortfolioSnapshotsRepository();
