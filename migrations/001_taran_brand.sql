-- Run once in Supabase SQL Editor before deploying code that uses taran_* tables.
-- Existing rows and policies remain attached because tables are renamed in place.

do $$
declare
  pair text[];
begin
  foreach pair slice 1 in array array[
    array['memoa_admin_profiles', 'taran_admin_profiles'],
    array['memoa_site_copy', 'taran_site_copy'],
    array['memoa_providers', 'taran_providers'],
    array['memoa_articles', 'taran_articles'],
    array['memoa_content_revisions', 'taran_content_revisions'],
    array['memoa_banners', 'taran_banners'],
    array['memoa_customers', 'taran_customers'],
    array['memoa_admin_events', 'taran_admin_events']
  ]
  loop
    if to_regclass('public.' || pair[1]) is not null
       and to_regclass('public.' || pair[2]) is null then
      execute format('alter table public.%I rename to %I', pair[1], pair[2]);
    end if;
  end loop;
end $$;

update public.taran_site_copy set site_id = 'taran' where site_id = 'memoa';
update public.taran_banners set site_id = 'taran' where site_id = 'memoa';
