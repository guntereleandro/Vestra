import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDirectory = path.join(root, "supabase");
const migrationsDirectory = path.join(supabaseDirectory, "migrations");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

assert(fs.existsSync(path.join(supabaseDirectory, "config.toml")), "supabase/config.toml ausente.");
assert(fs.existsSync(migrationsDirectory), "Diretorio de migrations ausente.");

const migrationFiles = fs.readdirSync(migrationsDirectory)
  .filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))
  .sort();
assert(migrationFiles.length > 0, "Nenhuma migration versionada encontrada.");

const sql = migrationFiles
  .map((name) => read(path.join(migrationsDirectory, name)))
  .join("\n")
  .toLowerCase();

for (const table of [
  "profiles",
  "portfolios",
  "portfolio_members",
  "portfolio_assets",
  "portfolio_asset_quotes",
  "portfolio_preferences",
  "user_portfolio_preferences",
  "portfolio_operations",
]) {
  assert(
    new RegExp(`create\\s+table\\s+public\\.${table}\\b`).test(sql),
    `Tabela public.${table} ausente.`,
  );
  assert(
    new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`).test(sql),
    `RLS ausente em public.${table}.`,
  );
  assert(
    new RegExp(`revoke\\s+all\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s*anon`).test(sql),
    `REVOKE de anon ausente em public.${table}.`,
  );
}

for (const column of [
  "display_name",
  "default_currency",
  "timezone",
  "created_by",
  "is_archived",
  "portfolio_id",
  "user_id",
  "invited_by",
  "accepted_at",
  "created_at",
  "updated_at",
  "data_source",
]) {
  assert(new RegExp(`\\b${column}\\b`).test(sql), `Coluna esperada ausente: ${column}.`);
}

for (const source of ["LOCAL", "SUPABASE"]) {
  assert(new RegExp(`['\"]${source.toLowerCase()}['\"]`, "i").test(sql), `Fonte ausente: ${source}.`);
}

for (const role of ["owner", "editor", "viewer"]) {
  assert(new RegExp(`['\"]${role}['\"]`).test(sql), `Papel ausente: ${role}.`);
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
  assert(new RegExp(`create\\s+policy\\s+${policy}\\b`).test(sql), `Policy ausente: ${policy}.`);
}

for (const functionName of [
  "set_updated_at",
  "is_portfolio_member",
  "is_portfolio_owner",
  "protect_membership",
  "ensure_portfolio_has_owner",
  "create_portfolio_with_owner",
]) {
  const functionPattern = new RegExp(
    `create\\s+function\\s+public\\.${functionName}\\b[\\s\\S]*?set\\s+search_path\\s*=\\s*''`,
  );
  assert(functionPattern.test(sql), `Funcao ${functionName} sem search_path seguro.`);
}

assert(
  /create\s+function\s+public\.create_portfolio_with_owner[\s\S]*?security\s+definer/.test(sql),
  "RPC atomica deve usar SECURITY DEFINER.",
);
assert(
  /insert\s+into\s+public\.portfolios[\s\S]*?insert\s+into\s+public\.portfolio_members/.test(sql),
  "RPC nao cria portfolio e owner na mesma funcao.",
);
assert(
  /portfolio\s+must\s+retain\s+at\s+least\s+one\s+owner/.test(sql),
  "Protecao do ultimo owner ausente.",
);
assert(
  /create\s+constraint\s+trigger\s+portfolios_require_owner[\s\S]*?deferrable\s+initially\s+deferred/.test(sql),
  "Constraint trigger contra portfolio orfao ausente.",
);
assert(
  /insert\s+into\s+public\.profiles[\s\S]*?from\s+auth\.users[\s\S]*?on\s+conflict\s*\(id\)\s+do\s+nothing/.test(sql),
  "Backfill idempotente de profiles ausente.",
);
assert(
  /create\s+index\s+portfolio_members_user_id_idx/.test(sql)
  && /create\s+index\s+portfolios_created_by_idx/.test(sql),
  "Indices de autorizacao ausentes.",
);
assert(
  /grant\s+select\s+on\s+table\s+public\.profiles\s+to\s+service_role/.test(sql)
  && /grant\s+select\s+on\s+table\s+public\.portfolio_members\s+to\s+service_role/.test(sql)
  && /grant\s+delete\s+on\s+table\s+public\.portfolios\s+to\s+service_role/.test(sql),
  "Privilegios server-only de auditoria/limpeza ausentes.",
);

for (const forbiddenTable of [
  "dividends",
  "portfolio_snapshots",
]) {
  assert(
    !new RegExp(`create\\s+table\\s+(?:public\\.)?${forbiddenTable}\\b`).test(sql),
    `Tabela fora do escopo criada antes da etapa correspondente: ${forbiddenTable}.`,
  );
}

for (const column of [
  "operation_type",
  "trade_date",
  "quantity",
  "unit_price",
  "fees",
  "income_amount",
  "created_by",
]) {
  assert(new RegExp(`\\b${column}\\b`).test(sql), `Coluna de operação ausente: ${column}.`);
}
for (const type of ["COMPRA", "VENDA", "DIVIDENDO", "JCP", "RENDIMENTO"]) {
  assert(new RegExp(`['"]${type}['"]`, "i").test(sql), `Tipo de operação ausente: ${type}.`);
}
for (const policy of [
  "portfolio_operations_select_member",
  "portfolio_operations_insert_editor",
  "portfolio_operations_update_editor",
  "portfolio_operations_delete_editor",
]) {
  assert(new RegExp(`create\\s+policy\\s+${policy}\\b`).test(sql), `Policy de operação ausente: ${policy}.`);
}
const operationsMigration = read(
  path.join(migrationsDirectory, "20260731000200_core_07_portfolio_operations.sql"),
).toLowerCase();
for (const forbiddenColumn of [
  "average_price",
  "current_position",
  "portfolio_value",
  "realized_profit",
]) {
  assert(!new RegExp(`\\b${forbiddenColumn}\\b`).test(operationsMigration), `Campo derivado persistido: ${forbiddenColumn}.`);
}

const credentialPatterns = [
  /sb_secret_[a-z0-9_-]+/i,
  /sb_publishable_[a-z0-9_-]+/i,
  /service_role\s*=\s*['"][^'"]+['"]/i,
  /password\s*=\s*['"][^'"]+['"]/i,
];
for (const pattern of credentialPatterns) {
  assert(!pattern.test(sql), "Migration contem possivel credencial ou senha.");
}

const testDirectory = path.join(supabaseDirectory, "tests", "database");
const testFiles = fs.existsSync(testDirectory)
  ? fs.readdirSync(testDirectory).filter((name) => name.endsWith(".test.sql"))
  : [];
assert(testFiles.length >= 2, "Testes SQL de schema e RLS ausentes.");

console.log(
  `Schema validado: ${migrationFiles.length} migrations, 8 tabelas, RLS, policies, grants, `
  + "funcoes seguras, indices, backfill idempotente e escopo financeiro preservado.",
);
