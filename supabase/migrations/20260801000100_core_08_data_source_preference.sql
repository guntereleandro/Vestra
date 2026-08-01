alter table public.portfolio_preferences
  add column data_source text not null default 'LOCAL';

alter table public.portfolio_preferences
  add constraint portfolio_preferences_data_source
  check (data_source in ('LOCAL', 'SUPABASE'));

comment on column public.portfolio_preferences.data_source is
  'Explicit operations data source selected by the portfolio user; never changed by import or authentication.';
