create table public.corporate_income_events (
  id uuid primary key default gen_random_uuid(),
  canonical_asset_id text not null,
  ticker text not null,
  asset_name text,
  event_type text not null check (event_type in ('DIVIDEND', 'JCP', 'INCOME')),
  status text not null default 'UNKNOWN' check (status in ('ANNOUNCED', 'CONFIRMED', 'CORRECTED', 'CANCELLED', 'UNKNOWN')),
  record_date date, ex_date date, declaration_date date, payment_date date,
  gross_amount_per_unit numeric(28, 8) not null check (gross_amount_per_unit > 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  installment text, period text, source text not null,
  source_confidence text not null default 'medium' check (source_confidence in ('low', 'medium', 'high')),
  canonical_identity text not null unique,
  version integer not null default 1 check (version > 0),
  version_history jsonb not null default '[]'::jsonb,
  source_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ticker = upper(ticker) and ticker ~ '^[A-Z0-9.-]{1,30}$')
);

create table public.corporate_income_event_aliases (
  id uuid primary key default gen_random_uuid(),
  provider text not null, external_id text, external_identity_hash text not null,
  event_id uuid not null references public.corporate_income_events(id) on delete cascade,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  raw_hash text, metadata jsonb not null default '{}'::jsonb,
  unique (provider, external_identity_hash)
);

create table public.portfolio_income_expectations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  event_id uuid not null references public.corporate_income_events(id) on delete restrict,
  eligible_quantity numeric(28, 8) not null check (eligible_quantity > 0),
  gross_amount numeric(28, 8) not null check (gross_amount > 0),
  known_withholding_amount numeric(28, 8) check (known_withholding_amount is null or known_withholding_amount >= 0),
  expected_net_amount numeric(28, 8) check (expected_net_amount is null or expected_net_amount >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  eligibility_date date not null, expected_payment_date date,
  status text not null default 'EXPECTED' check (status in ('ELIGIBLE', 'EXPECTED', 'CONFIRMED_RECEIVED', 'RECONCILED', 'IGNORED', 'CANCELLED', 'CONFLICT')),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  match_status text not null default 'NO_MATCH' check (match_status in ('EXACT_MATCH', 'LIKELY_MATCH', 'AMBIGUOUS', 'NO_MATCH')),
  match_candidate_operation_id uuid references public.portfolio_operations(id) on delete set null,
  event_version integer not null default 1,
  source_changed_at timestamptz,
  ignored_at timestamptz, ignored_reason text, confirmed_at timestamptz, reconciled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (portfolio_id, event_id), unique (id, portfolio_id)
);

create function public.validate_income_match_portfolio() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.match_candidate_operation_id is not null and not exists (
    select 1 from public.portfolio_operations operation
    where operation.id = new.match_candidate_operation_id and operation.portfolio_id = new.portfolio_id
  ) then raise exception 'match candidate belongs to another portfolio' using errcode = '23514'; end if;
  return new;
end; $$;

create trigger portfolio_income_expectations_validate_match before insert or update of match_candidate_operation_id, portfolio_id
on public.portfolio_income_expectations for each row execute function public.validate_income_match_portfolio();
revoke all on function public.validate_income_match_portfolio() from public, anon, authenticated;

alter table public.portfolio_operations add constraint portfolio_operations_id_portfolio_unique unique (id, portfolio_id);

create table public.income_reconciliation_links (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  expectation_id uuid not null,
  operation_id uuid not null,
  reconciliation_type text not null check (reconciliation_type in ('CREATED', 'EXISTING')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (expectation_id), unique (operation_id),
  foreign key (expectation_id, portfolio_id) references public.portfolio_income_expectations(id, portfolio_id) on delete cascade,
  foreign key (operation_id, portfolio_id) references public.portfolio_operations(id, portfolio_id) on delete restrict
);

create index corporate_income_events_asset_payment_idx on public.corporate_income_events(canonical_asset_id, payment_date);
create index income_expectations_portfolio_payment_idx on public.portfolio_income_expectations(portfolio_id, expected_payment_date, status);
create index income_links_portfolio_idx on public.income_reconciliation_links(portfolio_id);

create trigger corporate_income_events_set_updated_at before update on public.corporate_income_events for each row execute function public.set_updated_at();
create trigger portfolio_income_expectations_set_updated_at before update on public.portfolio_income_expectations for each row execute function public.set_updated_at();

alter table public.corporate_income_events enable row level security;
alter table public.corporate_income_event_aliases enable row level security;
alter table public.portfolio_income_expectations enable row level security;
alter table public.income_reconciliation_links enable row level security;

revoke all on table public.corporate_income_events, public.corporate_income_event_aliases, public.portfolio_income_expectations, public.income_reconciliation_links from public, anon, authenticated;
grant select on table public.corporate_income_events to authenticated;
grant select on table public.portfolio_income_expectations, public.income_reconciliation_links to authenticated;
grant update (status, ignored_at, ignored_reason) on table public.portfolio_income_expectations to authenticated;
grant select, insert, update, delete on table public.corporate_income_events, public.corporate_income_event_aliases, public.portfolio_income_expectations, public.income_reconciliation_links to service_role;

create policy corporate_income_events_read_authenticated on public.corporate_income_events for select to authenticated using (true);
create policy income_expectations_read_member on public.portfolio_income_expectations for select to authenticated using (public.is_portfolio_member(portfolio_id));
create policy income_expectations_review_editor on public.portfolio_income_expectations for update to authenticated using (public.can_edit_portfolio(portfolio_id)) with check (public.can_edit_portfolio(portfolio_id));
create policy income_links_read_member on public.income_reconciliation_links for select to authenticated using (public.is_portfolio_member(portfolio_id));

create function public.confirm_income_expectation(target_expectation_id uuid, effective_date date, received_amount numeric, operation_notes text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare expectation public.portfolio_income_expectations; event public.corporate_income_events; linked uuid; operation_id uuid;
begin
  select operation_id into linked from public.income_reconciliation_links where expectation_id = target_expectation_id;
  if linked is not null then return linked; end if;
  select * into expectation from public.portfolio_income_expectations where id = target_expectation_id for update;
  if expectation.id is null or not public.can_edit_portfolio(expectation.portfolio_id) then raise exception 'expectation access denied' using errcode = '42501'; end if;
  if expectation.status in ('CANCELLED', 'CONFLICT') then raise exception 'expectation cannot be confirmed' using errcode = '23514'; end if;
  select * into event from public.corporate_income_events where id = expectation.event_id;
  if event.status = 'CANCELLED' or effective_date is null or received_amount <= 0 then raise exception 'invalid confirmation' using errcode = '23514'; end if;
  operation_id := gen_random_uuid();
  insert into public.portfolio_operations(id, portfolio_id, ticker, asset_name, asset_type, operation_type, trade_date, quantity, unit_price, fees, income_amount, notes, source, external_id, created_by)
  values (operation_id, expectation.portfolio_id, event.ticker, coalesce(event.asset_name, event.ticker), case when event.event_type = 'INCOME' then 'FII' else 'Ação' end,
    case event.event_type when 'DIVIDEND' then 'DIVIDENDO' when 'JCP' then 'JCP' else 'RENDIMENTO' end,
    effective_date, 0, 0, 0, received_amount, left(coalesce(operation_notes, ''), 240), 'automatic-income-confirmation', target_expectation_id::text, auth.uid());
  insert into public.income_reconciliation_links(portfolio_id, expectation_id, operation_id, reconciliation_type)
  values (expectation.portfolio_id, expectation.id, operation_id, 'CREATED');
  update public.portfolio_income_expectations set status = 'RECONCILED', confirmed_at = now(), reconciled_at = now() where id = expectation.id;
  return operation_id;
end; $$;

create function public.link_income_expectation(target_expectation_id uuid, target_operation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare expectation public.portfolio_income_expectations; operation public.portfolio_operations; linked uuid; event_type text;
begin
  select operation_id into linked from public.income_reconciliation_links where expectation_id = target_expectation_id;
  if linked is not null then return linked; end if;
  select * into expectation from public.portfolio_income_expectations where id = target_expectation_id for update;
  if expectation.id is null or not public.can_edit_portfolio(expectation.portfolio_id) then raise exception 'expectation access denied' using errcode = '42501'; end if;
  select * into operation from public.portfolio_operations where id = target_operation_id and portfolio_id = expectation.portfolio_id;
  select cie.event_type into event_type from public.corporate_income_events cie where cie.id = expectation.event_id;
  if operation.id is null or operation.operation_type <> case event_type when 'DIVIDEND' then 'DIVIDENDO' when 'JCP' then 'JCP' else 'RENDIMENTO' end then raise exception 'incompatible operation' using errcode = '23514'; end if;
  insert into public.income_reconciliation_links(portfolio_id, expectation_id, operation_id, reconciliation_type)
  values (expectation.portfolio_id, expectation.id, operation.id, 'EXISTING');
  update public.portfolio_income_expectations set status = 'RECONCILED', reconciled_at = now() where id = expectation.id;
  return operation.id;
end; $$;

revoke all on function public.confirm_income_expectation(uuid, date, numeric, text), public.link_income_expectation(uuid, uuid) from public, anon;
grant execute on function public.confirm_income_expectation(uuid, date, numeric, text), public.link_income_expectation(uuid, uuid) to authenticated;
