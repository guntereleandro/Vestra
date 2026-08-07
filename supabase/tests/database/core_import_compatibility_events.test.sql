begin;
select no_plan();

select has_column('public', 'portfolio_operations', 'cash_amount');
select has_column('public', 'portfolio_operations', 'ratio_from');
select has_column('public', 'portfolio_operations', 'ratio_to');
select has_column('public', 'portfolio_operations', 'attributed_cost');
select has_column('public', 'portfolio_operations', 'target_ticker');
select has_column('public', 'portfolio_operations', 'target_quantity');
select has_column('public', 'portfolio_operations', 'transferred_cost');
select col_type_is('public', 'portfolio_operations', 'operation_type', 'text');

insert into auth.users (id) values ('45000000-0000-4000-8000-000000000001') on conflict (id) do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub', '45000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
create temporary table import_context (portfolio_id uuid);
grant select, insert on table import_context to authenticated;
insert into import_context select id from public.create_portfolio_with_owner('Import compatibility');

select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, ratio_from, ratio_to)
     values (gen_random_uuid(), (select portfolio_id from import_context), 'SADI11', 'SADI', 'FII', 'SPLIT', '2024-10-16', 1, 10) $$,
  'split has no financial flow'
);
select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, attributed_cost)
     values (gen_random_uuid(), (select portfolio_id from import_context), 'GGBR4', 'Gerdau', 'Ação', 'BONUS', '2024-06-01', 10, 0) $$,
  'bonus requires explicit attributed cost'
);
select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, target_ticker, target_asset_name, target_asset_type, target_quantity)
     values (gen_random_uuid(), (select portfolio_id from import_context), 'SADI11', 'SADI', 'FII', 'CONVERSION', '2025-12-10', 20, 'SAPI11', 'SAPI', 'FII', 18) $$,
  'conversion stores both sides without sale'
);
select lives_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, cash_amount)
     values (gen_random_uuid(), (select portfolio_id from import_context), 'MP-CASH', 'Mercado Pago', 'Caixa Remunerado', 'CASH_DEPOSIT', '2025-01-02', 10) $$,
  'remunerated cash deposit is value-only'
);
select throws_ok(
  $$ insert into public.portfolio_operations
     (id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity)
     values (gen_random_uuid(), (select portfolio_id from import_context), 'GGBR4', 'Gerdau', 'Ação', 'BONUS', '2024-06-01', 10) $$,
  '23514', null, 'bonus without cost is rejected remotely'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select * from public.portfolio_operations $$, '42501', null, 'anon remains blocked');
reset role;
delete from public.portfolios where id = (select portfolio_id from import_context);
select * from finish();
rollback;
