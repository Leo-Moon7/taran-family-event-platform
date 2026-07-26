-- Allow signed-in role holders to read only their own admin profile.
-- Run after 008_review_submission_workflow.sql.
-- Additive/idempotent: it narrows the legacy broad read policy and does not
-- grant any client-side write privilege.

alter table public.taran_admin_profiles enable row level security;

revoke all on public.taran_admin_profiles from anon;
revoke insert, update, delete on public.taran_admin_profiles from authenticated;
grant select on public.taran_admin_profiles to authenticated;

drop policy if exists "admins can read admin profiles"
  on public.taran_admin_profiles;
drop policy if exists "users can read own admin profile"
  on public.taran_admin_profiles;

create policy "users can read own admin profile"
on public.taran_admin_profiles
for select
to authenticated
using (user_id = auth.uid());
