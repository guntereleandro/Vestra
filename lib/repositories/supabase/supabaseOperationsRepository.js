import { operationsRepositoryMethods } from "../contracts/operationsRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabaseOperationsRepository = createSupabaseRepositoryStub(
  "operations",
  operationsRepositoryMethods,
);

