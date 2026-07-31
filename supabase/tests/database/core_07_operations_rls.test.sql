begin;
select no_plan();

insert into auth.users (id)
values
  ('41000000-0000-4000-8000-000000000001'),
  ('42000000-0000-4000-8000-000000000002'),
  ('43000000-0000-4000-8000-000000000003'),
  ('44000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

create temporary table core07_context (portfolio_id uuid);
grant select, insert on table core07_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into core07_context
select id from public.create_portfolio_with_owner('CORE-07');

select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price, fees)
     values (
       '41000000-0000-4000-8000-000000000011',
       (select portfolio_id from core07_context),
       'TEST3', 'Teste', 'Ação', 'COMPRA', '2026-01-01', 1.12345678, 10.12345678, 0.01
     ) $$,
  'owner creates operation'
);

select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price, fees)
     values (
       '41000000-0000-4000-8000-000000000011',
       (select portfolio_id from core07_context),
       'TEST3', 'Teste', 'Ação', 'COMPRA', '2026-01-01', 1.12345678, 10.12345678, 0.01
     )
     on conflict (id) do update set notes = excluded.notes $$,
  'owner import is idempotent by id'
);

select is(
  (select count(*) from public.portfolio_operations),
  1::bigint,
  'idempotent import does not duplicate'
);

select lives_ok(
  $$ update public.portfolio_operations set notes = 'owner'
     where id = '41000000-0000-4000-8000-000000000011' $$,
  'owner updates operation'
);

select throws_ok(
  $$ update public.portfolio_operations
     set created_by = '42000000-0000-4000-8000-000000000002'
     where id = '41000000-0000-4000-8000-000000000011' $$,
  '23514', 'operation identity is immutable',
  'created_by is immutable'
);

select throws_ok(
  $$ update public.portfolio_operations
     set portfolio_id = gen_random_uuid()
     where id = '41000000-0000-4000-8000-000000000011' $$,
  '23514', 'operation identity is immutable',
  'portfolio_id is immutable'
);

select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price)
     values (
       gen_random_uuid(), (select portfolio_id from core07_context),
       'BAD3', 'Inválida', 'Ação', 'COMPRA', '2026-01-01', 0, 10
     ) $$,
  '23514', null,
  'trade requires positive quantity'
);

select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, income_amount)
     values (
       gen_random_uuid(), (select portfolio_id from core07_context),
       'BAD3', 'Inválida', 'Ação', 'DIVIDENDO', '2026-01-01', 0
     ) $$,
  '23514', null,
  'income requires positive amount'
);

select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date)
     values (
       gen_random_uuid(), (select portfolio_id from core07_context),
       'BAD3', 'Inválida', 'Ação', 'AJUSTE', '2026-01-01'
     ) $$,
  '22P02', null,
  'unknown operation type is rejected'
);

insert into public.portfolio_members (portfolio_id, user_id, role, invited_by)
values
  ((select portfolio_id from core07_context), '42000000-0000-4000-8000-000000000002', 'editor', '41000000-0000-4000-8000-000000000001'),
  ((select portfolio_id from core07_context), '43000000-0000-4000-8000-000000000003', 'viewer', '41000000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub', '42000000-0000-4000-8000-000000000002', true);
select results_eq(
  $$ select count(*) from public.portfolio_operations $$,
  $$ values (1::bigint) $$,
  'editor reads operations'
);
select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, income_amount)
     values (
       '42000000-0000-4000-8000-000000000012',
       (select portfolio_id from core07_context),
       'TEST3', 'Teste', 'Ação', 'JCP', '2026-02-01', 5.25
     ) $$,
  'editor creates operation'
);
select lives_ok(
  $$ update public.portfolio_operations set notes = 'editor'
     where id = '41000000-0000-4000-8000-000000000011' $$,
  'editor updates owner operation'
);
select lives_ok(
  $$ delete from public.portfolio_operations
     where id = '42000000-0000-4000-8000-000000000012' $$,
  'editor deletes operation'
);
select is_empty(
  $$ update public.portfolio_members set role = 'owner'
     where portfolio_id = (select portfolio_id from core07_context)
       and user_id = '42000000-0000-4000-8000-000000000002'
     returning user_id $$,
  'editor cannot administer memberships'
);

select set_config('request.jwt.claim.sub', '43000000-0000-4000-8000-000000000003', true);
select results_eq(
  $$ select count(*) from public.portfolio_operations $$,
  $$ values (1::bigint) $$,
  'viewer reads operations'
);
select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price)
     values (
       gen_random_uuid(), (select portfolio_id from core07_context),
       'TEST3', 'Teste', 'Ação', 'COMPRA', '2026-03-01', 1, 1
     ) $$,
  '42501', null,
  'viewer cannot create'
);
select is_empty(
  $$ update public.portfolio_operations set notes = 'viewer'
     returning id $$,
  'viewer cannot update'
);
select is_empty(
  $$ delete from public.portfolio_operations returning id $$,
  'viewer cannot delete'
);

select set_config('request.jwt.claim.sub', '44000000-0000-4000-8000-000000000004', true);
select is_empty(
  $$ select id from public.portfolio_operations $$,
  'non-member cannot read'
);
select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price)
     values (
       gen_random_uuid(), (select portfolio_id from core07_context),
       'TEST3', 'Teste', 'Ação', 'COMPRA', '2026-03-01', 1, 1
     ) $$,
  '42501', null,
  'non-member cannot create'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select throws_ok(
  $$ select * from public.portfolio_operations $$,
  '42501', null,
  'anon has no access'
);

reset role;
select lives_ok(
  $$ delete from public.portfolios
     where id = (select portfolio_id from core07_context) $$,
  'portfolio cascade removes operations'
);

select * from finish();
rollback;
