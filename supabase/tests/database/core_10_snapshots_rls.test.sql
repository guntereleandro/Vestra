begin;
select plan(17);

select has_table('public', 'portfolio_snapshots', 'portfolio_snapshots exists');
select has_column('public', 'portfolio_snapshots', 'snapshot_date', 'snapshot date exists');
select has_column('public', 'portfolio_snapshots', 'current_value', 'current value exists');
select has_column('public', 'portfolio_snapshots', 'total_invested', 'invested value exists');
select has_column('public', 'portfolio_snapshots', 'dividends', 'dividends exists');
select col_type_is('public', 'portfolio_snapshots', 'current_value', 'numeric(24,8)', 'current value precision');
select col_type_is('public', 'portfolio_snapshots', 'snapshot_date', 'date', 'civil date');
select col_is_pk('public', 'portfolio_snapshots', 'id', 'snapshot id primary key');
select col_is_fk('public', 'portfolio_snapshots', 'portfolio_id', 'portfolio FK');
select has_index('public', 'portfolio_snapshots', 'portfolio_snapshots_daily_unique', 'daily uniqueness');
select has_index('public', 'portfolio_snapshots', 'portfolio_snapshots_portfolio_date_idx', 'range index');
select policies_are('public', 'portfolio_snapshots', array[
  'portfolio_snapshots_insert_editor',
  'portfolio_snapshots_select_member',
  'portfolio_snapshots_update_editor'
], 'only intended snapshot policies');
select table_privs_are('public', 'portfolio_snapshots', 'anon', array[]::text[], 'anon has no grants');
select table_privs_are('public', 'portfolio_snapshots', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'authenticated grants exclude delete');
select table_privs_are('public', 'portfolio_snapshots', 'service_role', array['DELETE', 'SELECT'], 'service role maintenance grants');
select has_trigger('public', 'portfolio_snapshots', 'portfolio_snapshots_protect_identity', 'identity trigger');
select has_trigger('public', 'portfolio_snapshots', 'portfolio_snapshots_set_updated_at', 'updated_at trigger');

select * from finish();
rollback;
