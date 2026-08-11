import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { canonicalOperations } from "./reconcile-real-import.mjs";
import manifest from "../data/imports/vestra_real_import_equivalence_manifest.json" with { type: "json" };

assert.equal(process.env.CONFIRM_REAL_IMPORT, "IMPORT_101_MISSING_EVENTS");
const aliases = new Set(manifest.aliases.map((item) => item.canonical_id));
const missing = canonicalOperations.filter((item) => !aliases.has(item.id));
assert.equal(missing.length, 101);
const q = (value) => value == null || value === "" ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const n = (value) => value == null ? "null" : String(Number(value));
const portfolio = q(manifest.portfolio_id);
const rows = missing.map((item) => `(${q(item.id)}::uuid, ${portfolio}::uuid, ${q(item.ticker)}, ${q(item.assetName)}, ${q(item.assetType)}, ${q(item.operationType)}, ${q(item.date)}::date, ${n(item.quantity)}, ${n(item.unitPrice)}, ${n(item.fees)}, ${["DIVIDENDO", "JCP", "RENDIMENTO"].includes(item.operationType) ? n(item.totalValue) : "null"}, ${["CASH_DEPOSIT", "CASH_WITHDRAWAL"].includes(item.operationType) ? n(item.totalValue) : "null"}, ${["FIXED_INCOME_APPLICATION", "FIXED_INCOME_REDEMPTION"].includes(item.operationType) ? n(item.totalValue) : "null"}, ${item.operationType === "SPLIT" ? n(item.ratioFrom) : "null"}, ${item.operationType === "SPLIT" ? n(item.ratioTo) : "null"}, ${item.operationType === "BONUS" ? n(item.attributedCost) : "null"}, ${item.operationType === "CONVERSION" ? q(item.targetTicker) : "null"}, ${item.operationType === "CONVERSION" ? q(item.targetAssetName) : "null"}, ${item.operationType === "CONVERSION" ? q(item.targetAssetType) : "null"}, ${item.operationType === "CONVERSION" ? n(item.targetQuantity) : "null"}, ${item.operationType === "CONVERSION" ? n(item.transferredCost) : "null"}, ${q(item.notes)}, 'real_import', (select user_id from public.portfolio_members where portfolio_id = ${portfolio}::uuid and role = 'owner' limit 1))`).join(",\n");
const aliasChecks = manifest.aliases.map((alias) => `if not exists (select 1 from public.portfolio_operations where portfolio_id = ${portfolio}::uuid and id = ${q(alias.preserved_remote_id)}::uuid) then raise exception 'missing preserved alias'; end if;`).join("\n");
const sql = `do $$
begin
  if (select count(*) from public.portfolio_operations where portfolio_id = ${portfolio}::uuid) <> 8 then raise exception 'precondition: expected 8 operations'; end if;
  if (select count(*) from public.portfolio_members where portfolio_id = ${portfolio}::uuid and role = 'owner') <> 1 then raise exception 'precondition: expected one owner'; end if;
  if not exists (select 1 from public.portfolios where id = ${portfolio}::uuid and name = 'Minha carteira' and not is_archived) then raise exception 'precondition: target portfolio'; end if;
  if not exists (select 1 from public.portfolio_preferences where portfolio_id = ${portfolio}::uuid and data_source = 'SUPABASE') then raise exception 'precondition: data source'; end if;
  ${aliasChecks}
  insert into public.portfolio_operations (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price, fees, income_amount, cash_amount, value_amount, ratio_from, ratio_to, attributed_cost, target_ticker, target_asset_name, target_asset_type, target_quantity, transferred_cost, notes, source, created_by)
  values
  ${rows};
  if (select count(*) from public.portfolio_operations where portfolio_id = ${portfolio}::uuid) <> 109 then raise exception 'postcondition: expected 109 operations'; end if;
end $$;`;
const rollback = `do $$ begin delete from public.portfolio_operations where portfolio_id = ${portfolio}::uuid and id in (${missing.map((item) => `${q(item.id)}::uuid`).join(",")}); if (select count(*) from public.portfolio_operations where portfolio_id = ${portfolio}::uuid) <> 8 then raise exception 'rollback did not restore 8 operations'; end if; end $$;`;
await mkdir(new URL("../supabase/.temp/", import.meta.url), { recursive: true });
await writeFile(new URL("../supabase/.temp/real-import-101.sql", import.meta.url), sql, "utf8");
await writeFile(new URL("../supabase/.temp/real-import-rollback.sql", import.meta.url), rollback, "utf8");
console.log(JSON.stringify({ generated: 101, aliases: 8 }));
