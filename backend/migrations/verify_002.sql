-- Run in Supabase SQL editor AFTER 002_update.sql. Reads schema/data; changes no rows.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','emergency_contacts','cars','predrive_checks','trips',
    'trip_events','trip_features','emergency_alerts','car_checks','findings','trip_points','emergency_locations','sms_deliveries']
  loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=table_name and c.relrowsecurity) then
      raise exception 'Missing table or RLS: %', table_name;
    end if;
    if not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=table_name and p.policyname='owner') then
      raise exception 'Missing ownership policy: %', table_name;
    end if;
  end loop;
  if exists(select 1 from public.predrive_checks where risk not in ('safe','caution','high')) then
    raise exception 'Readiness risk mapping failed';
  end if;
  if exists(select 1 from public.findings where urgency not in ('monitor','soon','stop')) then
    raise exception 'Finding urgency mapping failed';
  end if;
  if not exists(select 1 from storage.buckets where id='dashboard-photos' and public=false) then
    raise exception 'Missing private dashboard bucket';
  end if;
end $$;
select 'BUCKL 002 schema smoke checks passed' as result;
