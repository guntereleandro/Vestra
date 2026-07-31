begin;

select plan(26);

select has_type('public', 'portfolio_role', 'portfolio_role enum exists');
select enum_has_labels(
  'public',
  'portfolio_role',
  array['owner', 'editor', 'viewer'],
  'portfolio roles are constrained'
);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'portfolios', 'portfolios exists');
select has_table('public', 'portfolio_members', 'portfolio_members exists');

select has_pk('public', 'profiles', 'profiles has a primary key');
select has_pk('public', 'portfolios', 'portfolios has a primary key');
select has_pk('public', 'portfolio_members', 'memberships have a composite primary key');

select col_type_is('public', 'profiles', 'id', 'uuid', 'profile id is uuid');
select col_type_is('public', 'profiles', 'created_at', 'timestamp with time zone', 'profile timestamps use timestamptz');
select col_type_is('public', 'portfolios', 'id', 'uuid', 'portfolio id is uuid');
select col_type_is('public', 'portfolios', 'created_by', 'uuid', 'portfolio creator is uuid');
select col_type_is('public', 'portfolio_members', 'role', 'public.portfolio_role', 'membership uses portfolio_role');

select fk_ok('public', 'profiles', 'id', 'auth', 'users', 'id', 'profile references auth user');
select fk_ok('public', 'portfolios', 'created_by', 'auth', 'users', 'id', 'portfolio creator references auth user');
select fk_ok('public', 'portfolio_members', 'portfolio_id', 'public', 'portfolios', 'id', 'membership references portfolio');
select fk_ok('public', 'portfolio_members', 'user_id', 'auth', 'users', 'id', 'membership references auth user');
select fk_ok('public', 'portfolio_members', 'invited_by', 'auth', 'users', 'id', 'inviter references auth user');

select has_function(
  'public',
  'create_portfolio_with_owner',
  array['text', 'text', 'text', 'text', 'text'],
  'atomic portfolio RPC exists'
);
select has_function('public', 'set_updated_at', array[]::text[], 'updated_at trigger function exists');
select has_function('public', 'is_portfolio_member', array['uuid', 'uuid'], 'membership helper exists');
select has_function('public', 'is_portfolio_owner', array['uuid', 'uuid'], 'owner helper exists');
select has_function('public', 'ensure_portfolio_has_owner', array[]::text[], 'orphan guard exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles RLS is enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.portfolios'::regclass),
  true,
  'portfolios RLS is enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.portfolio_members'::regclass),
  true,
  'portfolio_members RLS is enabled'
);

select * from finish();
rollback;
