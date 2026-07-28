import { dividendsRepositoryMethods } from "../contracts/dividendsRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabaseDividendsRepository = createSupabaseRepositoryStub(
  "dividends",
  dividendsRepositoryMethods,
);

