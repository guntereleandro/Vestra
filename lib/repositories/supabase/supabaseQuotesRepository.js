import { quotesRepositoryMethods } from "../contracts/quotesRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabaseQuotesRepository = createSupabaseRepositoryStub(
  "quotes",
  quotesRepositoryMethods,
);

