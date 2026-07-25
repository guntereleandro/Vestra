export const REPOSITORY_ERROR_CODES = Object.freeze({
  REPOSITORY_NOT_INITIALIZED: "REPOSITORY_NOT_INITIALIZED",
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  STORAGE_READ_ERROR: "STORAGE_READ_ERROR",
  STORAGE_WRITE_ERROR: "STORAGE_WRITE_ERROR",
  CONFLICT: "CONFLICT",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
});

const UI_MESSAGES = Object.freeze({
  REPOSITORY_NOT_INITIALIZED: "Os dados ainda não estão disponíveis.",
  ENTITY_NOT_FOUND: "O registro não foi encontrado.",
  INVALID_INPUT: "Revise os dados informados.",
  STORAGE_READ_ERROR: "Não foi possível carregar os dados.",
  STORAGE_WRITE_ERROR: "Não foi possível salvar os dados.",
  CONFLICT: "Os dados foram alterados. Atualize e tente novamente.",
  UNSUPPORTED_OPERATION: "Esta operação ainda não está disponível.",
});

export class RepositoryError extends Error {
  constructor(code, options = {}) {
    super(UI_MESSAGES[code] || "Não foi possível acessar os dados.", { cause: options.cause });
    this.name = "RepositoryError";
    this.code = code;
    this.details = options.details || null;
  }
}

export function repositoryError(code, options) {
  return new RepositoryError(code, options);
}

export function sanitizeRepositoryError(error) {
  if (error instanceof RepositoryError) return { code: error.code, message: error.message };
  return {
    code: REPOSITORY_ERROR_CODES.REPOSITORY_NOT_INITIALIZED,
    message: UI_MESSAGES.REPOSITORY_NOT_INITIALIZED,
  };
}

export function asStorageError(error, operation) {
  if (error instanceof RepositoryError) return error;
  const code = operation === "write"
    ? REPOSITORY_ERROR_CODES.STORAGE_WRITE_ERROR
    : REPOSITORY_ERROR_CODES.STORAGE_READ_ERROR;
  return repositoryError(code, { cause: error });
}

