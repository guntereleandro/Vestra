-- Server-only privileges used for sanitized audits and controlled test cleanup.
-- Normal application flows continue to use authenticated + RLS.
grant select on table public.profiles to service_role;
grant select on table public.portfolios to service_role;
grant select on table public.portfolio_members to service_role;
grant delete on table public.portfolios to service_role;
