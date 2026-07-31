import { brandConfig } from "../../config/brandConfig.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import {
  assertRecordInput,
  getSupabaseRepositoryClient,
  throwSupabaseRepositoryError,
} from "./supabaseRepositoryUtils.js";

const PORTFOLIO_COLUMNS = [
  "id",
  "name",
  "slug",
  "description",
  "base_currency",
  "timezone",
  "created_by",
  "is_archived",
  "created_at",
  "updated_at",
  "portfolio_members!inner(role)",
].join(", ");

function normalizePortfolio(row, activePortfolioId = null) {
  if (!row) return null;
  const membership = Array.isArray(row.portfolio_members)
    ? row.portfolio_members[0]
    : row.portfolio_members;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    baseCurrency: row.base_currency,
    timezone: row.timezone,
    createdBy: row.created_by,
    isArchived: row.is_archived,
    role: membership?.role || null,
    isActive: row.id === activePortfolioId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabasePortfoliosRepository(client) {
  async function readActivePortfolioId(supabase) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    throwSupabaseRepositoryError(authError);
    const userId = authData?.user?.id;
    if (!userId) return null;
    const { data, error } = await supabase
      .from("user_portfolio_preferences")
      .select("active_portfolio_id")
      .eq("user_id", userId)
      .maybeSingle();
    throwSupabaseRepositoryError(error);
    return data?.active_portfolio_id || null;
  }

  return {
    async list() {
      const supabase = getSupabaseRepositoryClient(client);
      const [{ data, error }, persistedActiveId] = await Promise.all([
        supabase.from("portfolios").select(PORTFOLIO_COLUMNS).order("created_at", { ascending: true }),
        readActivePortfolioId(supabase),
      ]);
      throwSupabaseRepositoryError(error);
      const activePortfolioId = persistedActiveId || data?.[0]?.id || null;
      const portfolios = (data || []).map((row) => normalizePortfolio(row, activePortfolioId));
      return portfolios.map((portfolio) => ({
        ...portfolio,
        isActive: portfolio.id === activePortfolioId,
      }));
    },

    async getActive() {
      const portfolios = await this.list();
      return portfolios.find((portfolio) => portfolio.isActive)
        || portfolios[0]
        || null;
    },

    async create(input) {
      assertRecordInput(input);
      const name = String(input.name || "").trim();
      if (!name) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);

      const supabase = getSupabaseRepositoryClient(client);
      const { data, error } = await supabase.rpc("create_portfolio_with_owner", {
        portfolio_name: name,
        portfolio_slug: input.slug || null,
        portfolio_description: input.description || null,
        portfolio_base_currency: input.baseCurrency || brandConfig.defaultCurrency,
        portfolio_timezone: input.timezone || "America/Sao_Paulo",
      });
      throwSupabaseRepositoryError(error, "write");
      if (data?.id) await this.setActive(data.id);
      return normalizePortfolio({
        ...data,
        portfolio_members: { role: "owner" },
      }, data?.id);
    },

    async update(id, input) {
      if (!id) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      assertRecordInput(input);
      const payload = {};
      if (input.name !== undefined) payload.name = String(input.name).trim();
      if (input.slug !== undefined) payload.slug = input.slug || null;
      if (input.description !== undefined) payload.description = input.description || null;
      if (input.baseCurrency !== undefined) payload.base_currency = input.baseCurrency;
      if (input.timezone !== undefined) payload.timezone = input.timezone;
      if (input.isArchived !== undefined) payload.is_archived = Boolean(input.isArchived);
      if (!Object.keys(payload).length) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);

      const supabase = getSupabaseRepositoryClient(client);
      const { data, error } = await supabase
        .from("portfolios")
        .update(payload)
        .eq("id", id)
        .select(PORTFOLIO_COLUMNS)
        .single();
      throwSupabaseRepositoryError(error, "write");
      return normalizePortfolio(data);
    },

    async setActive(id) {
      const portfolios = await this.list();
      const portfolio = portfolios.find((item) => item.id === id);
      if (!portfolio) throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      const supabase = getSupabaseRepositoryClient(client);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      throwSupabaseRepositoryError(authError);
      if (!authData?.user?.id) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { error } = await supabase.from("user_portfolio_preferences").upsert({
        user_id: authData.user.id,
        active_portfolio_id: id,
      }, { onConflict: "user_id" });
      throwSupabaseRepositoryError(error, "write");
      return { ...portfolio, isActive: true };
    },
  };
}

export const supabasePortfoliosRepository = createSupabasePortfoliosRepository();
