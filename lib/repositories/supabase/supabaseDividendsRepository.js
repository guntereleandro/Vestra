import { isPassiveIncomeOperation } from "../../data/operations.js";
import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { createSupabaseOperationsRepository } from "./supabaseOperationsRepository.js";

export function createSupabaseDividendsRepository(client) {
  const operations = createSupabaseOperationsRepository(client);
  const requireIncome = (input) => { if (!isPassiveIncomeOperation(input)) throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT); };
  return {
    async listByPortfolio(portfolioId) { return (await operations.listByPortfolio(portfolioId)).filter(isPassiveIncomeOperation); },
    async create(input) { requireIncome(input); return operations.create(input); },
    async update(id, input) { requireIncome(input); return operations.update(id, input); },
    async remove(id) {
      const current = await operations.getById(id);
      if (!current || !isPassiveIncomeOperation(current)) throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND);
      return operations.remove(id);
    },
  };
}
export const supabaseDividendsRepository = createSupabaseDividendsRepository();
