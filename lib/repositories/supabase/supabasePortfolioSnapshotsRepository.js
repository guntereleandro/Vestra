import { portfolioSnapshotsRepositoryMethods } from "../contracts/portfolioSnapshotsRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabasePortfolioSnapshotsRepository = createSupabaseRepositoryStub(
  "portfolioSnapshots",
  portfolioSnapshotsRepositoryMethods,
);

