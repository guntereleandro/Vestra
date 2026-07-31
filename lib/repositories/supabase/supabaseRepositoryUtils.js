import { REPOSITORY_ERROR_CODES, repositoryError } from "../repositoryErrors.js";
import { createBrowserSupabaseClient } from "../../supabase/client/browserClient.js";

export function getSupabaseRepositoryClient(client) {
  return client || createBrowserSupabaseClient();
}

export function assertRecordInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw repositoryError(REPOSITORY_ERROR_CODES.INVALID_INPUT);
  }
}

export function throwSupabaseRepositoryError(error, operation = "read") {
  if (!error) return;
  if (error.code === "PGRST116") {
    throw repositoryError(REPOSITORY_ERROR_CODES.ENTITY_NOT_FOUND, { cause: error });
  }
  if (error.code === "23505") {
    throw repositoryError(REPOSITORY_ERROR_CODES.CONFLICT, { cause: error });
  }
  throw repositoryError(
    operation === "write"
      ? REPOSITORY_ERROR_CODES.STORAGE_WRITE_ERROR
      : REPOSITORY_ERROR_CODES.STORAGE_READ_ERROR,
    { cause: error },
  );
}
