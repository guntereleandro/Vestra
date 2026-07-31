create function public.can_edit_portfolio(target_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portfolio_members
    where portfolio_id = target_portfolio_id
      and user_id = (select auth.uid())
      and role in ('owner', 'editor')
  );
$$;

revoke all on function public.can_edit_portfolio(uuid) from public;
grant execute on function public.can_edit_portfolio(uuid) to authenticated, service_role;

create table public.portfolio_assets (
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ticker text not null,
  name text not null,
  short_name text not null,
  asset_type text not null,
  subtype text,
  sector text,
  segment text,
  country text not null default 'Brasil',
  currency text not null default 'BRL',
  exchange text not null default 'B3',
  isin text,
  cnpj text,
  logo_path text,
  source text not null default 'local',
  notes text,
  description text,
  website text,
  provider_limitations text[] not null default '{}',
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (portfolio_id, ticker),
  constraint portfolio_assets_ticker_format check (ticker = upper(ticker) and ticker ~ '^[A-Z0-9.-]{1,30}$'),
  constraint portfolio_assets_currency_format check (currency ~ '^[A-Z]{3}$')
);

create table public.portfolio_asset_quotes (
  portfolio_id uuid not null,
  ticker text not null,
  manual_price numeric(24, 8),
  automatic_price numeric(24, 8),
  manual_override boolean not null default false,
  manual_updated_at date,
  automatic_updated_at timestamptz,
  automatic_source text,
  stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (portfolio_id, ticker),
  foreign key (portfolio_id, ticker)
    references public.portfolio_assets(portfolio_id, ticker)
    on delete cascade,
  constraint portfolio_asset_quotes_has_price check (manual_price is not null or automatic_price is not null),
  constraint portfolio_asset_quotes_manual_price_positive check (manual_price is null or manual_price > 0),
  constraint portfolio_asset_quotes_automatic_price_positive check (automatic_price is null or automatic_price > 0)
);

create table public.portfolio_preferences (
  portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
  max_position_percent numeric(5, 2),
  max_class_percent numeric(5, 2),
  target_allocation jsonb not null default '{}'::jsonb,
  preferred_countries text[] not null default '{}',
  preferred_currencies text[] not null default '{}',
  risk_profile text,
  investment_focus text,
  diagnostic_updated_at timestamptz,
  experience_level text,
  investment_horizon_years numeric(5, 2),
  liquidity_need text,
  income_stability text,
  loss_tolerance_percent numeric(5, 2),
  emergency_reserve_status text,
  primary_objective text,
  risk_answers jsonb not null default '{}'::jsonb,
  calculated_profile text,
  calculated_at timestamptz,
  risk_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_preferences_max_position check (max_position_percent between 0 and 100),
  constraint portfolio_preferences_max_class check (max_class_percent between 0 and 100),
  constraint portfolio_preferences_horizon check (investment_horizon_years between 0 and 100),
  constraint portfolio_preferences_loss_tolerance check (loss_tolerance_percent between 0 and 100),
  constraint portfolio_preferences_risk_profile check (risk_profile is null or risk_profile in ('conservative', 'moderate', 'aggressive')),
  constraint portfolio_preferences_investment_focus check (investment_focus is null or investment_focus in ('income', 'growth', 'balanced', 'custom')),
  constraint portfolio_preferences_experience check (experience_level is null or experience_level in ('beginner', 'intermediate', 'advanced')),
  constraint portfolio_preferences_liquidity check (liquidity_need is null or liquidity_need in ('high', 'medium', 'low')),
  constraint portfolio_preferences_income_stability check (income_stability is null or income_stability in ('low', 'medium', 'high')),
  constraint portfolio_preferences_reserve check (emergency_reserve_status is null or emergency_reserve_status in ('none', 'partial', 'complete')),
  constraint portfolio_preferences_objective check (primary_objective is null or primary_objective in ('preserve_capital', 'income', 'balanced_growth', 'long_term_growth')),
  constraint portfolio_preferences_calculated_profile check (calculated_profile is null or calculated_profile in ('conservative', 'moderate', 'aggressive'))
);

create table public.user_portfolio_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_portfolio_id uuid references public.portfolios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portfolio_assets_ticker_idx on public.portfolio_assets(ticker);
create index portfolio_asset_quotes_ticker_idx on public.portfolio_asset_quotes(ticker);
create index user_portfolio_preferences_active_idx on public.user_portfolio_preferences(active_portfolio_id);

create trigger portfolio_assets_set_updated_at
before update on public.portfolio_assets
for each row execute function public.set_updated_at();

create trigger portfolio_asset_quotes_set_updated_at
before update on public.portfolio_asset_quotes
for each row execute function public.set_updated_at();

create trigger portfolio_preferences_set_updated_at
before update on public.portfolio_preferences
for each row execute function public.set_updated_at();

create trigger user_portfolio_preferences_set_updated_at
before update on public.user_portfolio_preferences
for each row execute function public.set_updated_at();

alter table public.portfolio_assets enable row level security;
alter table public.portfolio_asset_quotes enable row level security;
alter table public.portfolio_preferences enable row level security;
alter table public.user_portfolio_preferences enable row level security;

revoke all on table public.portfolio_assets from public, anon;
revoke all on table public.portfolio_asset_quotes from public, anon;
revoke all on table public.portfolio_preferences from public, anon;
revoke all on table public.user_portfolio_preferences from public, anon;

grant select, insert, update, delete on table public.portfolio_assets to authenticated;
grant select, insert, update, delete on table public.portfolio_asset_quotes to authenticated;
grant select, insert, update, delete on table public.portfolio_preferences to authenticated;
grant select, insert, update, delete on table public.user_portfolio_preferences to authenticated;

grant select, delete on table public.portfolio_assets to service_role;
grant select, delete on table public.portfolio_asset_quotes to service_role;
grant select, delete on table public.portfolio_preferences to service_role;
grant select, delete on table public.user_portfolio_preferences to service_role;

create policy portfolio_assets_select_member
on public.portfolio_assets for select to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_assets_insert_editor
on public.portfolio_assets for insert to authenticated
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_assets_update_editor
on public.portfolio_assets for update to authenticated
using (public.can_edit_portfolio(portfolio_id))
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_assets_delete_editor
on public.portfolio_assets for delete to authenticated
using (public.can_edit_portfolio(portfolio_id));

create policy portfolio_asset_quotes_select_member
on public.portfolio_asset_quotes for select to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_asset_quotes_insert_editor
on public.portfolio_asset_quotes for insert to authenticated
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_asset_quotes_update_editor
on public.portfolio_asset_quotes for update to authenticated
using (public.can_edit_portfolio(portfolio_id))
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_asset_quotes_delete_editor
on public.portfolio_asset_quotes for delete to authenticated
using (public.can_edit_portfolio(portfolio_id));

create policy portfolio_preferences_select_member
on public.portfolio_preferences for select to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_preferences_insert_editor
on public.portfolio_preferences for insert to authenticated
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_preferences_update_editor
on public.portfolio_preferences for update to authenticated
using (public.can_edit_portfolio(portfolio_id))
with check (public.can_edit_portfolio(portfolio_id));

create policy portfolio_preferences_delete_editor
on public.portfolio_preferences for delete to authenticated
using (public.can_edit_portfolio(portfolio_id));

create policy user_portfolio_preferences_select_own
on public.user_portfolio_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_portfolio_preferences_insert_own
on public.user_portfolio_preferences for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (active_portfolio_id is null or public.is_portfolio_member(active_portfolio_id))
);

create policy user_portfolio_preferences_update_own
on public.user_portfolio_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (active_portfolio_id is null or public.is_portfolio_member(active_portfolio_id))
);

create policy user_portfolio_preferences_delete_own
on public.user_portfolio_preferences for delete to authenticated
using ((select auth.uid()) = user_id);
