create type public.portfolio_operation_type as enum (
  'COMPRA',
  'VENDA',
  'DIVIDENDO',
  'JCP',
  'RENDIMENTO'
);

create table public.portfolio_operations (
  id uuid primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ticker text not null,
  asset_name text not null,
  asset_type text not null,
  operation_type public.portfolio_operation_type not null,
  trade_date date not null,
  quantity numeric(28, 8) not null default 0,
  unit_price numeric(24, 8) not null default 0,
  fees numeric(24, 8) not null default 0,
  income_amount numeric(24, 8),
  notes text not null default '',
  source text not null default 'local',
  external_id text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_operations_ticker_format
    check (ticker = upper(ticker) and ticker ~ '^[A-Z0-9.-]{1,30}$'),
  constraint portfolio_operations_asset_name_length
    check (char_length(btrim(asset_name)) between 1 and 80),
  constraint portfolio_operations_asset_type_length
    check (char_length(btrim(asset_type)) between 1 and 40),
  constraint portfolio_operations_notes_length
    check (char_length(notes) <= 240),
  constraint portfolio_operations_source_length
    check (char_length(btrim(source)) between 1 and 40),
  constraint portfolio_operations_external_id_length
    check (external_id is null or char_length(external_id) between 1 and 200),
  constraint portfolio_operations_fees_nonnegative check (fees >= 0),
  constraint portfolio_operations_fields_by_type check (
    (
      operation_type in ('COMPRA', 'VENDA')
      and quantity > 0
      and unit_price >= 0
      and income_amount is null
    )
    or
    (
      operation_type in ('DIVIDENDO', 'JCP', 'RENDIMENTO')
      and quantity = 0
      and unit_price = 0
      and income_amount > 0
    )
  )
);

create index portfolio_operations_portfolio_date_idx
  on public.portfolio_operations(portfolio_id, trade_date, id);
create index portfolio_operations_portfolio_ticker_idx
  on public.portfolio_operations(portfolio_id, ticker, trade_date);
create index portfolio_operations_portfolio_type_idx
  on public.portfolio_operations(portfolio_id, operation_type, trade_date);
create index portfolio_operations_created_by_idx
  on public.portfolio_operations(created_by);

create function public.protect_operation_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.portfolio_id is distinct from old.portfolio_id
    or new.created_by is distinct from old.created_by then
    raise exception 'operation identity is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_operation_identity() from public, anon, authenticated;

create trigger portfolio_operations_protect_identity
before update on public.portfolio_operations
for each row execute function public.protect_operation_identity();

create trigger portfolio_operations_set_updated_at
before update on public.portfolio_operations
for each row execute function public.set_updated_at();

alter table public.portfolio_operations enable row level security;

revoke all on table public.portfolio_operations from public, anon;
grant select, insert, update, delete on table public.portfolio_operations to authenticated;
grant select, delete on table public.portfolio_operations to service_role;

create policy portfolio_operations_select_member
on public.portfolio_operations for select to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_operations_insert_editor
on public.portfolio_operations for insert to authenticated
with check (
  public.can_edit_portfolio(portfolio_id)
  and created_by = (select auth.uid())
);

create policy portfolio_operations_update_editor
on public.portfolio_operations for update to authenticated
using (public.can_edit_portfolio(portfolio_id))
with check (
  public.can_edit_portfolio(portfolio_id)
);

create policy portfolio_operations_delete_editor
on public.portfolio_operations for delete to authenticated
using (public.can_edit_portfolio(portfolio_id));
