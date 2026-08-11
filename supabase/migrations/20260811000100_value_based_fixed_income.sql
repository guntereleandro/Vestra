alter table public.portfolio_operations
  drop constraint portfolio_operations_type_allowed,
  drop constraint portfolio_operations_event_fields,
  drop constraint portfolio_operations_nonnegative_event_values;

alter table public.portfolio_operations
  add column value_amount numeric(24, 8),
  add constraint portfolio_operations_type_allowed check (
    operation_type in (
      'COMPRA', 'VENDA', 'DIVIDENDO', 'JCP', 'RENDIMENTO',
      'SPLIT', 'BONUS', 'CONVERSION',
      'CASH_DEPOSIT', 'CASH_WITHDRAWAL',
      'FIXED_INCOME_APPLICATION', 'FIXED_INCOME_REDEMPTION'
    )
  ),
  add constraint portfolio_operations_event_fields check (
    (operation_type in ('COMPRA', 'VENDA') and quantity > 0 and unit_price >= 0 and income_amount is null and cash_amount is null and value_amount is null)
    or (operation_type in ('DIVIDENDO', 'JCP', 'RENDIMENTO') and quantity = 0 and unit_price = 0 and income_amount > 0 and cash_amount is null and value_amount is null)
    or (operation_type in ('CASH_DEPOSIT', 'CASH_WITHDRAWAL') and quantity = 0 and unit_price = 0 and cash_amount > 0 and income_amount is null and value_amount is null and asset_type = 'Caixa Remunerado')
    or (operation_type in ('FIXED_INCOME_APPLICATION', 'FIXED_INCOME_REDEMPTION') and quantity = 0 and unit_price = 0 and value_amount > 0 and income_amount is null and cash_amount is null and asset_type = 'Renda Fixa')
    or (operation_type = 'SPLIT' and quantity = 0 and ratio_from > 0 and ratio_to > 0 and income_amount is null and cash_amount is null and value_amount is null)
    or (operation_type = 'BONUS' and quantity > 0 and attributed_cost >= 0 and income_amount is null and cash_amount is null and value_amount is null)
    or (operation_type = 'CONVERSION' and quantity > 0 and target_quantity > 0 and target_ticker is not null and target_asset_name is not null and target_asset_type is not null and income_amount is null and cash_amount is null and value_amount is null)
  ),
  add constraint portfolio_operations_nonnegative_event_values check (
    coalesce(cash_amount, 0) >= 0 and coalesce(value_amount, 0) >= 0
    and coalesce(ratio_from, 0) >= 0 and coalesce(ratio_to, 0) >= 0
    and coalesce(attributed_cost, 0) >= 0 and coalesce(target_quantity, 0) >= 0 and coalesce(transferred_cost, 0) >= 0
  );
