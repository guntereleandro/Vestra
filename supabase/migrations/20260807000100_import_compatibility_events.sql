alter table public.portfolio_operations
  drop constraint portfolio_operations_fields_by_type;

alter table public.portfolio_operations
  alter column operation_type type text using operation_type::text;

drop type public.portfolio_operation_type;

alter table public.portfolio_operations
  add column cash_amount numeric(24, 8),
  add column ratio_from numeric(28, 8),
  add column ratio_to numeric(28, 8),
  add column attributed_cost numeric(24, 8),
  add column target_ticker text,
  add column target_asset_name text,
  add column target_asset_type text,
  add column target_quantity numeric(28, 8),
  add column transferred_cost numeric(24, 8),
  add constraint portfolio_operations_type_allowed check (
    operation_type in ('COMPRA', 'VENDA', 'DIVIDENDO', 'JCP', 'RENDIMENTO', 'SPLIT', 'BONUS', 'CONVERSION', 'CASH_DEPOSIT', 'CASH_WITHDRAWAL')
  ),
  add constraint portfolio_operations_event_fields check (
    (operation_type in ('COMPRA', 'VENDA') and quantity > 0 and unit_price >= 0 and income_amount is null and cash_amount is null)
    or (operation_type in ('DIVIDENDO', 'JCP', 'RENDIMENTO') and quantity = 0 and unit_price = 0 and income_amount > 0 and cash_amount is null)
    or (operation_type in ('CASH_DEPOSIT', 'CASH_WITHDRAWAL') and quantity = 0 and unit_price = 0 and cash_amount > 0 and income_amount is null and asset_type = 'Caixa Remunerado')
    or (operation_type = 'SPLIT' and quantity = 0 and ratio_from > 0 and ratio_to > 0 and income_amount is null and cash_amount is null)
    or (operation_type = 'BONUS' and quantity > 0 and attributed_cost >= 0 and income_amount is null and cash_amount is null)
    or (operation_type = 'CONVERSION' and quantity > 0 and target_quantity > 0 and target_ticker is not null and target_asset_name is not null and target_asset_type is not null and income_amount is null and cash_amount is null)
  ),
  add constraint portfolio_operations_target_ticker_format check (
    target_ticker is null or (target_ticker = upper(target_ticker) and target_ticker ~ '^[A-Z0-9.-]{1,30}$')
  ),
  add constraint portfolio_operations_target_name_length check (
    target_asset_name is null or char_length(btrim(target_asset_name)) between 1 and 80
  ),
  add constraint portfolio_operations_nonnegative_event_values check (
    coalesce(cash_amount, 0) >= 0 and coalesce(ratio_from, 0) >= 0 and coalesce(ratio_to, 0) >= 0
    and coalesce(attributed_cost, 0) >= 0 and coalesce(target_quantity, 0) >= 0 and coalesce(transferred_cost, 0) >= 0
  );

create index portfolio_operations_target_ticker_idx
  on public.portfolio_operations(portfolio_id, target_ticker, trade_date)
  where target_ticker is not null;
