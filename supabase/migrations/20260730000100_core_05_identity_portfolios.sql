create type public.portfolio_role as enum ('owner', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default ''
    constraint profiles_display_name_length check (char_length(display_name) <= 120),
  avatar_url text
    constraint profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 2048),
  locale text not null default 'pt-BR'
    constraint profiles_locale_format check (locale ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$'),
  default_currency text not null default 'BRL'
    constraint profiles_default_currency_format check (default_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'America/Sao_Paulo'
    constraint profiles_timezone_length check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint portfolios_name_length check (char_length(btrim(name)) between 1 and 120),
  slug text
    constraint portfolios_slug_format check (
      slug is null
      or (
        char_length(slug) between 1 and 80
        and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      )
    ),
  description text
    constraint portfolios_description_length check (
      description is null or char_length(description) <= 500
    ),
  base_currency text not null default 'BRL'
    constraint portfolios_base_currency_format check (base_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'America/Sao_Paulo'
    constraint portfolios_timezone_length check (char_length(timezone) between 1 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_members (
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.portfolio_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (portfolio_id, user_id)
);

create index portfolio_members_user_id_idx
  on public.portfolio_members (user_id, portfolio_id);
create index portfolios_created_by_idx
  on public.portfolios (created_by);
create unique index portfolios_member_slug_uidx
  on public.portfolios (created_by, slug)
  where slug is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create function public.is_portfolio_member(
  target_portfolio_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null and exists (
    select 1
    from public.portfolio_members member
    where member.portfolio_id = target_portfolio_id
      and member.user_id = target_user_id
  );
$$;

create function public.is_portfolio_owner(
  target_portfolio_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null and exists (
    select 1
    from public.portfolio_members member
    where member.portfolio_id = target_portfolio_id
      and member.user_id = target_user_id
      and member.role = 'owner'::public.portfolio_role
  );
$$;

create function public.protect_portfolio_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'portfolio created_by cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create function public.protect_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_owner_exists boolean;
begin
  if tg_op = 'UPDATE' then
    if new.portfolio_id is distinct from old.portfolio_id
      or new.user_id is distinct from old.user_id then
      raise exception 'membership identity cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  if old.role = 'owner'::public.portfolio_role
    and (tg_op = 'DELETE' or new.role <> 'owner'::public.portfolio_role) then
    select exists (
      select 1
      from public.portfolio_members member
      where member.portfolio_id = old.portfolio_id
        and member.user_id <> old.user_id
        and member.role = 'owner'::public.portfolio_role
    ) into remaining_owner_exists;

    if not remaining_owner_exists then
      raise exception 'portfolio must retain at least one owner'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create function public.ensure_portfolio_has_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.portfolio_members member
    where member.portfolio_id = new.id
      and member.role = 'owner'::public.portfolio_role
  ) then
    raise exception 'portfolio must have at least one owner'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.create_portfolio_with_owner(
  portfolio_name text,
  portfolio_slug text default null,
  portfolio_description text default null,
  portfolio_base_currency text default 'BRL',
  portfolio_timezone text default 'America/Sao_Paulo'
)
returns public.portfolios
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_portfolio public.portfolios;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.portfolios (
    name,
    slug,
    description,
    base_currency,
    timezone,
    created_by
  )
  values (
    btrim(portfolio_name),
    nullif(btrim(portfolio_slug), ''),
    nullif(btrim(portfolio_description), ''),
    upper(btrim(portfolio_base_currency)),
    btrim(portfolio_timezone),
    current_user_id
  )
  returning * into created_portfolio;

  insert into public.portfolio_members (
    portfolio_id,
    user_id,
    role,
    accepted_at
  )
  values (
    created_portfolio.id,
    current_user_id,
    'owner'::public.portfolio_role,
    now()
  );

  return created_portfolio;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger portfolios_set_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger portfolios_protect_identity
before update on public.portfolios
for each row execute function public.protect_portfolio_identity();

create trigger portfolio_members_set_updated_at
before update on public.portfolio_members
for each row execute function public.set_updated_at();

create trigger portfolio_members_protect
before update or delete on public.portfolio_members
for each row execute function public.protect_membership();

create constraint trigger portfolios_require_owner
after insert on public.portfolios
deferrable initially deferred
for each row execute function public.ensure_portfolio_has_owner();

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_members enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy portfolios_select_member
on public.portfolios
for select
to authenticated
using (public.is_portfolio_member(id));

create policy portfolios_update_owner
on public.portfolios
for update
to authenticated
using (public.is_portfolio_owner(id))
with check (public.is_portfolio_owner(id));

create policy portfolio_members_select_member
on public.portfolio_members
for select
to authenticated
using (public.is_portfolio_member(portfolio_id));

create policy portfolio_members_insert_owner
on public.portfolio_members
for insert
to authenticated
with check (
  public.is_portfolio_owner(portfolio_id)
  and user_id <> (select auth.uid())
);

create policy portfolio_members_update_owner
on public.portfolio_members
for update
to authenticated
using (public.is_portfolio_owner(portfolio_id))
with check (public.is_portfolio_owner(portfolio_id));

create policy portfolio_members_delete_owner
on public.portfolio_members
for delete
to authenticated
using (
  public.is_portfolio_owner(portfolio_id)
  and user_id <> (select auth.uid())
);

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.portfolios from public, anon, authenticated;
revoke all on table public.portfolio_members from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, update on table public.portfolios to authenticated;
grant select, insert, update, delete on table public.portfolio_members to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_portfolio_member(uuid, uuid) from public, anon;
revoke all on function public.is_portfolio_owner(uuid, uuid) from public, anon;
revoke all on function public.protect_portfolio_identity() from public, anon, authenticated;
revoke all on function public.protect_membership() from public, anon, authenticated;
revoke all on function public.ensure_portfolio_has_owner() from public, anon, authenticated;
revoke all on function public.create_portfolio_with_owner(text, text, text, text, text)
  from public, anon;

grant execute on function public.is_portfolio_member(uuid, uuid) to authenticated;
grant execute on function public.is_portfolio_owner(uuid, uuid) to authenticated;
grant execute on function public.create_portfolio_with_owner(text, text, text, text, text)
  to authenticated;

insert into public.profiles (id)
select users.id
from auth.users users
on conflict (id) do nothing;
