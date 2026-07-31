create or replace function public.protect_membership()
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

  if tg_op = 'DELETE' and not exists (
    select 1
    from public.portfolios portfolio
    where portfolio.id = old.portfolio_id
  ) then
    return old;
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

revoke all on function public.protect_membership() from public, anon, authenticated;
