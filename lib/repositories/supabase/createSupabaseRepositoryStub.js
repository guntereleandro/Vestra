export const SUPABASE_NOT_IMPLEMENTED = "NOT_IMPLEMENTED";

export class SupabaseRepositoryNotImplementedError extends Error {
  constructor(repository, method) {
    super("O provider Supabase ainda não foi implementado.");
    this.name = "SupabaseRepositoryNotImplementedError";
    this.code = SUPABASE_NOT_IMPLEMENTED;
    this.repository = repository;
    this.method = method;
  }
}

export function createSupabaseRepositoryStub(repository, methods) {
  return Object.freeze(Object.fromEntries(methods.map((method) => [
    method,
    async function supabaseRepositoryStub() {
      throw new SupabaseRepositoryNotImplementedError(repository, method);
    },
  ])));
}

