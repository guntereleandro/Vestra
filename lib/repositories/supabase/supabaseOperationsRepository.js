import { isCashOperation, isFixedIncomeOperation, isIncomeOperation, isOperationUuid, normalizeOperations, validatePortfolioEvent } from "../../data/operations.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { getSupabaseRepositoryClient, throwSupabaseRepositoryError } from "./supabaseRepositoryUtils.js";

const COLUMNS = [
  "id", "portfolio_id", "ticker", "asset_name", "asset_type", "operation_type",
  "trade_date", "quantity", "unit_price", "fees", "income_amount", "cash_amount", "value_amount", "ratio_from", "ratio_to", "attributed_cost", "target_ticker", "target_asset_name", "target_asset_type", "target_quantity", "transferred_cost", "notes",
  "source", "external_id", "created_by", "created_at", "updated_at",
].join(", ");
const IMPORT_BATCH_SIZE = 500;

function normalizeOne(input, expectedId) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
  const [operation] = normalizeOperations([{ ...input, id: expectedId || input.id }]);
  if (!operation || !isOperationUuid(operation.id) || !validatePortfolioEvent(operation).valid) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
  return operation;
}

function toRow(portfolioId, operation) {
  return {
    id: operation.id,
    portfolio_id: portfolioId,
    ticker: operation.ticker,
    asset_name: operation.assetName,
    asset_type: operation.assetType,
    operation_type: operation.operationType,
    trade_date: operation.date,
    quantity: operation.quantity,
    unit_price: operation.unitPrice,
    fees: operation.fees,
    income_amount: isIncomeOperation(operation.operationType) ? operation.totalValue : null,
    cash_amount: isCashOperation(operation.operationType) ? operation.totalValue : null,
    value_amount: isFixedIncomeOperation(operation.operationType) ? operation.totalValue : null,
    ratio_from: operation.operationType === "SPLIT" ? operation.ratioFrom : null,
    ratio_to: operation.operationType === "SPLIT" ? operation.ratioTo : null,
    attributed_cost: operation.operationType === "BONUS" ? operation.attributedCost : null,
    target_ticker: operation.operationType === "CONVERSION" ? operation.targetTicker : null,
    target_asset_name: operation.operationType === "CONVERSION" ? operation.targetAssetName : null,
    target_asset_type: operation.operationType === "CONVERSION" ? operation.targetAssetType : null,
    target_quantity: operation.operationType === "CONVERSION" ? operation.targetQuantity : null,
    transferred_cost: operation.operationType === "CONVERSION" ? operation.transferredCost : null,
    notes: operation.notes,
    source: "local",
  };
}

function fromRow(row) {
  if (!row) return null;
  const [operation] = normalizeOperations([{
    id: row.id,
    ticker: row.ticker,
    assetName: row.asset_name,
    assetType: row.asset_type,
    operationType: row.operation_type,
    date: row.trade_date,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    fees: Number(row.fees),
    totalValue: row.income_amount != null ? Number(row.income_amount) : row.cash_amount != null ? Number(row.cash_amount) : row.value_amount != null ? Number(row.value_amount) : undefined,
    ratioFrom: row.ratio_from == null ? undefined : Number(row.ratio_from),
    ratioTo: row.ratio_to == null ? undefined : Number(row.ratio_to),
    attributedCost: row.attributed_cost == null ? null : Number(row.attributed_cost),
    targetTicker: row.target_ticker,
    targetAssetName: row.target_asset_name,
    targetAssetType: row.target_asset_type,
    targetQuantity: row.target_quantity == null ? undefined : Number(row.target_quantity),
    transferredCost: row.transferred_cost == null ? null : Number(row.transferred_cost),
    notes: row.notes,
  }]);
  return operation ? {
    ...operation,
    portfolioId: row.portfolio_id,
    source: row.source,
    externalId: row.external_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } : null;
}

function normalizeAll(operations) {
  if (!Array.isArray(operations)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  const normalized = operations.map((operation) => normalizeOne(operation));
  if (new Set(normalized.map((operation) => operation.id)).size !== normalized.length) {
    throw repositoryError(REPOSITORY_ERROR_CODES.CONFLICT);
  }
  return normalized;
}

export function createSupabaseOperationsRepository(client) {
  return {
    async listByPortfolio(portfolioId) {
      if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_operations")
        .select(COLUMNS)
        .eq("portfolio_id", portfolioId)
        .order("trade_date", { ascending: true })
        .order("id", { ascending: true });
      throwSupabaseRepositoryError(error);
      return (data || []).map(fromRow).filter(Boolean);
    },

    async getById(id) {
      if (!isOperationUuid(id)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_operations").select(COLUMNS).eq("id", id).maybeSingle();
      throwSupabaseRepositoryError(error);
      return fromRow(data);
    },

    async create(input) {
      const operation = normalizeOne(input);
      if (!input.portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_operations").insert(toRow(input.portfolioId, operation)).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },

    async update(id, input) {
      const operation = normalizeOne(input, id);
      if (!input.portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const row = toRow(input.portfolioId, operation);
      delete row.id;
      delete row.portfolio_id;
      const { data, error } = await getSupabaseRepositoryClient(client)
        .from("portfolio_operations").update(row).eq("id", id)
        .eq("portfolio_id", input.portfolioId).select(COLUMNS).single();
      throwSupabaseRepositoryError(error, "write");
      return fromRow(data);
    },

    async remove(id) {
      if (!isOperationUuid(id)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const { error, count } = await getSupabaseRepositoryClient(client)
        .from("portfolio_operations").delete({ count: "exact" }).eq("id", id);
      throwSupabaseRepositoryError(error, "write");
      if (!count) throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      return true;
    },

    async replaceAllByPortfolio(portfolioId, operations) {
      if (!portfolioId) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
      const normalized = normalizeAll(operations);
      const saved = [];
      for (let index = 0; index < normalized.length; index += IMPORT_BATCH_SIZE) {
        const batch = normalized.slice(index, index + IMPORT_BATCH_SIZE);
        const { data, error } = await getSupabaseRepositoryClient(client)
          .from("portfolio_operations")
          .upsert(batch.map((operation) => toRow(portfolioId, operation)), { onConflict: "id" })
          .select(COLUMNS);
        throwSupabaseRepositoryError(error, "write");
        saved.push(...(data || []).map(fromRow).filter(Boolean));
      }
      return saved;
    },
  };
}

export const supabaseOperationsRepository = createSupabaseOperationsRepository();
