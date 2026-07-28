import { portfoliosRepositoryMethods } from "../contracts/portfoliosRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabasePortfoliosRepository = createSupabaseRepositoryStub(
  "portfolios",
  portfoliosRepositoryMethods,
);

