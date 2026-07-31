begin;

select no_plan();

insert into auth.users (id)
values
  ('10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

insert into public.profiles (id, display_name)
values
  ('10000000-0000-4000-8000-000000000001', 'User A'),
  ('20000000-0000-4000-8000-000000000002', 'User B'),
  ('30000000-0000-4000-8000-000000000003', 'User C')
on conflict (id) do update set display_name = excluded.display_name;

create temporary table test_context (
  portfolio_a uuid,
  portfolio_b uuid
);
grant select, insert, update on table test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$ select id from public.profiles order by id $$,
  $$ values ('10000000-0000-4000-8000-000000000001'::uuid) $$,
  'A reads only own profile'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Updated A'
     where id = '10000000-0000-4000-8000-000000000001' $$,
  'A updates own profile'
);

select is_empty(
  $$ update public.profiles set display_name = 'Forbidden'
     where id = '20000000-0000-4000-8000-000000000002'
     returning id $$,
  'A cannot update B profile'
);

insert into test_context (portfolio_a)
select id
from public.create_portfolio_with_owner('Portfolio A');

select ok(
  exists (
    select 1
    from public.portfolio_members
    where portfolio_id = (select portfolio_a from test_context)
      and user_id = '10000000-0000-4000-8000-000000000001'
      and role = 'owner'
  ),
  'RPC makes A the owner atomically'
);

select lives_ok(
  $$ update public.portfolios set description = 'Owner update'
     where id = (select portfolio_a from test_context) $$,
  'owner updates own portfolio'
);

select lives_ok(
  $$ insert into public.portfolio_members (portfolio_id, user_id, role, invited_by)
     values (
       (select portfolio_a from test_context),
       '20000000-0000-4000-8000-000000000002',
       'viewer',
       '10000000-0000-4000-8000-000000000001'
     ) $$,
  'owner adds B as viewer'
);

select lives_ok(
  $$ update public.portfolio_members set role = 'editor'
     where portfolio_id = (select portfolio_a from test_context)
       and user_id = '20000000-0000-4000-8000-000000000002' $$,
  'owner promotes B to editor'
);

select throws_ok(
  $$ insert into public.portfolios (name, created_by)
     values ('Orphan', '10000000-0000-4000-8000-000000000001') $$,
  '42501',
  null,
  'direct portfolio insert is denied'
);

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

select results_eq(
  $$ select id from public.portfolios order by id $$,
  $$ select portfolio_a from test_context $$,
  'B sees portfolio after membership'
);

select results_eq(
  $$ select user_id from public.portfolio_members
     where portfolio_id = (select portfolio_a from test_context)
     order by user_id $$,
  $$ values
       ('10000000-0000-4000-8000-000000000001'::uuid),
       ('20000000-0000-4000-8000-000000000002'::uuid) $$,
  'B sees memberships of joined portfolio'
);

select is_empty(
  $$ update public.portfolios set description = 'Editor forbidden'
     where id = (select portfolio_a from test_context)
     returning id $$,
  'editor cannot update portfolio in CORE-05'
);

select is_empty(
  $$ update public.portfolio_members set role = 'owner'
     where portfolio_id = (select portfolio_a from test_context)
       and user_id = '20000000-0000-4000-8000-000000000002'
     returning user_id $$,
  'B cannot promote self'
);

select is_empty(
  $$ delete from public.portfolio_members
     where portfolio_id = (select portfolio_a from test_context)
       and user_id = '10000000-0000-4000-8000-000000000001'
     returning user_id $$,
  'B cannot remove A'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);

select is_empty(
  $$ select id from public.portfolios
     where id = (select portfolio_a from test_context) $$,
  'C cannot see A portfolio'
);

select is_empty(
  $$ select user_id from public.portfolio_members
     where portfolio_id = (select portfolio_a from test_context) $$,
  'C cannot see A memberships'
);

select throws_ok(
  $$ insert into public.portfolio_members (portfolio_id, user_id, role)
     values (
       (select portfolio_a from test_context),
       '30000000-0000-4000-8000-000000000003',
       'owner'
     ) $$,
  '42501',
  null,
  'C cannot create membership in A portfolio'
);

insert into test_context (portfolio_b)
select id
from public.create_portfolio_with_owner('Portfolio C');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ insert into public.portfolio_members (portfolio_id, user_id, role)
     values (
       (select portfolio_b from test_context where portfolio_b is not null),
       '10000000-0000-4000-8000-000000000001',
       'owner'
     ) $$,
  '42501',
  null,
  'A cannot add self to C portfolio'
);

select throws_ok(
  $$ update public.portfolio_members set role = 'viewer'
     where portfolio_id = (select portfolio_a from test_context where portfolio_a is not null)
       and user_id = '10000000-0000-4000-8000-000000000001' $$,
  '23514',
  'portfolio must retain at least one owner',
  'last owner cannot be demoted'
);

reset role;
select lives_ok(
  $$ delete from public.portfolios
     where id = (select portfolio_b from test_context where portfolio_b is not null) $$,
  'portfolio deletion can cascade memberships for server-only maintenance'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is_empty(
  $$ delete from public.portfolio_members
     where portfolio_id = (select portfolio_a from test_context where portfolio_a is not null)
       and user_id = '10000000-0000-4000-8000-000000000001'
     returning user_id $$,
  'owner cannot directly remove self'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'anon has no profile privileges'
);
select throws_ok(
  $$ select * from public.portfolios $$,
  '42501',
  null,
  'anon has no portfolio privileges'
);
select throws_ok(
  $$ select * from public.portfolio_members $$,
  '42501',
  null,
  'anon has no membership privileges'
);
select throws_ok(
  $$ select public.create_portfolio_with_owner('Anon portfolio') $$,
  '42501',
  null,
  'anon cannot execute portfolio RPC'
);

reset role;
select * from finish();
rollback;
