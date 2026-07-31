import fs from "node:fs";

const schemaFile = process.env.SUPABASE_REMOTE_SCHEMA_FILE;
if (!schemaFile || !fs.existsSync(schemaFile)) {
  throw new Error("SUPABASE_REMOTE_SCHEMA_FILE ausente ou invalido.");
}

const source = fs.readFileSync(schemaFile, "utf8");
const normalized = source.replaceAll('"', "").toLowerCase();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const table of ["profiles", "portfolios", "portfolio_members"]) {
  assert(
    new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\b`).test(normalized),
    `Tabela remota ausente: ${table}.`,
  );
  assert(
    new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`).test(normalized),
    `RLS remoto ausente: ${table}.`,
  );
}

for (const functionName of [
  "create_portfolio_with_owner",
  "ensure_portfolio_has_owner",
  "is_portfolio_member",
  "is_portfolio_owner",
  "protect_membership",
  "protect_portfolio_identity",
  "set_updated_at",
]) {
  assert(
    new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${functionName}\\b`).test(normalized),
    `Funcao remota ausente: ${functionName}.`,
  );
  const start = normalized.indexOf(`function public.${functionName}`);
  const end = normalized.indexOf("alter function", start);
  const definition = normalized.slice(start, end > start ? end : undefined);
  assert(/set\s+search_path\s+to\s+''/.test(definition), `search_path inseguro em ${functionName}.`);
}

for (const policy of [
  "profiles_select_own",
  "profiles_insert_own",
  "profiles_update_own",
  "portfolios_select_member",
  "portfolios_update_owner",
  "portfolio_members_select_member",
  "portfolio_members_insert_owner",
  "portfolio_members_update_owner",
  "portfolio_members_delete_owner",
]) {
  assert(normalized.includes(`create policy ${policy}`), `Policy remota ausente: ${policy}.`);
}

assert(
  normalized.includes("create constraint trigger portfolios_require_owner"),
  "Constraint trigger remoto contra carteira orfa ausente.",
);
assert(
  normalized.includes("create index portfolio_members_user_id_idx")
  && normalized.includes("create index portfolios_created_by_idx"),
  "Indices remotos esperados ausentes.",
);
assert(
  normalized.includes("grant select,update on table public.portfolios to authenticated")
  && normalized.includes("grant select,insert,update on table public.profiles to authenticated")
  && normalized.includes("grant select,insert,delete,update on table public.portfolio_members to authenticated"),
  "Grants remotos de authenticated divergentes.",
);
assert(
  !/grant\s+(?:select|insert|update|delete|all)[^;]*on\s+table\s+public\.(?:profiles|portfolios|portfolio_members)\s+to\s+anon/.test(normalized),
  "Anon possui privilegio remoto de dados.",
);
assert(
  /grant\s+[^;]*select[^;]*on\s+table\s+public\.profiles\s+to\s+service_role/.test(normalized)
  && /grant\s+[^;]*select[^;]*on\s+table\s+public\.portfolio_members\s+to\s+service_role/.test(normalized)
  && /grant\s+[^;]*select[^;]*delete[^;]*on\s+table\s+public\.portfolios\s+to\s+service_role/.test(normalized),
  "Privilegios remotos server-only de auditoria/limpeza divergentes.",
);
assert(
  normalized.includes("revoke all on function public.create_portfolio_with_owner")
  && normalized.includes("grant all on function public.create_portfolio_with_owner")
  && normalized.includes("to authenticated"),
  "Privilegios remotos da RPC divergentes.",
);

for (const forbiddenTable of [
  "operations",
  "dividends",
  "quotes",
  "assets",
  "portfolio_snapshots",
  "preferences",
]) {
  assert(
    !new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${forbiddenTable}\\b`).test(normalized),
    `Tabela financeira remota encontrada: ${forbiddenTable}.`,
  );
}

console.log(
  "Schema remoto validado: 3 tabelas, constraints, funcoes, triggers, indices, RLS, policies, "
  + "grants minimos e nenhuma tabela financeira.",
);
