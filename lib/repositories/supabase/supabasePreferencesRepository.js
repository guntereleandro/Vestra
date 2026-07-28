import { preferencesRepositoryMethods } from "../contracts/preferencesRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabasePreferencesRepository = createSupabaseRepositoryStub(
  "preferences",
  preferencesRepositoryMethods,
);

