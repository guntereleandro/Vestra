create table public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  snapshot_date date not null,
  total_invested numeric(24, 8) not null default 0,
  current_value numeric(24, 8) not null default 0,
  profit_loss numeric(24, 8) not null default 0,
  dividends numeric(24, 8) not null default 0,
  positions_count integer not null default 0,
  observed_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_snapshots_daily_unique unique (portfolio_id, snapshot_date),
  constraint portfolio_snapshots_positions_nonnegative check (positions_count >= 0),
  constraint portfolio_snapshots_values_finite check (
    total_invested between -1000000000000000 and 1000000000000000
    and current_value between -1000000000000000 and 1000000000000000
    and profit_loss between -1000000000000000 and 1000000000000000
    and dividends between -1000000000000000 and 1000000000000000
  )
);

create index portfolio_snapshots_portfolio_date_idx
  on public.portfolio_snapshots(portfolio_id, snapshot_date desc);

create function public.protect_snapshot_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.portfolio_id is distinct from old.portfolio_id
    or new.snapshot_date is distinct from old.snapshot_date
    or new.created_by is distinct from old.created_by then
    raise exception 'snapshot identity is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_snapshot_identity() from public, anon, authenticated;

create trigger portfolio_snapshots_protect_identity
before update on public.portfolio_snapshots
for each row execute function public.protect_snapshot_identity();

create trigger portfolio_snapshots_set_updated_at
before update on public.portfolio_snapshots
for each row execute function public.set_updated_at();

alter table public.portfolio_snapshots enable row level security;

revoke all on table public.portfolio_snapshots from public, anon;
grant select, insert, update on table public.portfolio_snapshots to authenticated;
grant select, delete on table public.portfolio_snapshots to service_role;

create policy portfolio_snapshots_select_member
on public.portfolio_snapshots for select to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_snapshots_insert_editor
on public.portfolio_snapshots for insert to authenticated
with check (
  public.can_edit_portfolio(portfolio_id)
  and created_by = (select auth.uid())
);

create policy portfolio_snapshots_update_editor
on public.portfolio_snapshots for update to authenticated
using (public.can_edit_portfolio(portfolio_id))
with check (public.can_edit_portfolio(portfolio_id));
