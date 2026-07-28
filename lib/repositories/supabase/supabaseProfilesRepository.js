import { profilesRepositoryMethods } from "../contracts/profilesRepository.js";
import { createSupabaseRepositoryStub } from "./createSupabaseRepositoryStub.js";

export const supabaseProfilesRepository = createSupabaseRepositoryStub(
  "profiles",
  profilesRepositoryMethods,
);

