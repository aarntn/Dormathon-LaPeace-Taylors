-- Prompt 4c: apply once AFTER the Prompt 4 schema. Existing rows are migrated in place.
begin;
alter table public.predrive_checks
  add column alert_self text check (alert_self in ('very_alert','ok','bit_tired','very_tired')),
  add column trip_length text check (trip_length in ('under_30','30_60','1_2h','over_2h')),
  add column face_perclos double precision check (face_perclos between 0 and 1),
  add column face_mean_blink_ms double precision check (face_mean_blink_ms >= 0),
  add column face_yawns integer check (face_yawns >= 0),
  add column hour integer check (hour between 0 and 23);
alter table public.predrive_checks drop constraint predrive_checks_risk_check;
update public.predrive_checks set risk=case risk when 'low' then 'safe' when 'raised' then 'caution' else risk end;
alter table public.predrive_checks add constraint predrive_checks_risk_check check (risk in ('safe','caution','high'));
alter table public.trips
  add column passenger_mode boolean not null default false,
  add column route_choice text not null default 'fastest' check (route_choice in ('safer','fastest')),
  add column avg_speed_kmh double precision check (avg_speed_kmh >= 0),
  add column safety_score integer check (safety_score between 0 and 100);
create table public.trip_points (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  at timestamptz not null, lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180), speed_kmh double precision check (speed_kmh between 0 and 400),
  unique(trip_id,at)
);
alter table public.emergency_contacts
  add column share_live_location boolean not null default true,
  add column text_when_ok boolean not null default true;
create table public.emergency_locations (
  id uuid primary key default gen_random_uuid(), alert_id uuid not null references public.emergency_alerts(id) on delete cascade,
  at timestamptz not null, lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180), unique(alert_id,at)
);
alter table public.findings rename column severity to urgency;
alter table public.findings drop constraint findings_severity_check;
update public.findings set urgency='monitor' where urgency='info';
alter table public.findings add constraint findings_urgency_check check (urgency in ('monitor','soon','stop'));
alter table public.car_checks add column result jsonb not null default '{}';

-- Persistent delivery ledger: atomic claims stop concurrent/retried HTTP calls sending twice.
-- A timed-out submission is marked unknown and requires provider reconciliation.
alter table public.emergency_alerts drop constraint emergency_alerts_status_check;
alter table public.emergency_alerts add constraint emergency_alerts_status_check check (status in ('pending','sent','cancelled','failed','unknown'));
-- Keep any repeated historical alerts/events; give them distinct legacy keys.
alter table public.emergency_alerts add column request_key text;
update public.emergency_alerts set request_key=id::text;
alter table public.emergency_alerts alter column request_key set not null;
create unique index emergency_alert_request_once on public.emergency_alerts(trip_id,contact_id,request_key);
alter table public.trip_events add column event_key text;
update public.trip_events set event_key=id::text;
alter table public.trip_events alter column event_key set not null;
create unique index trip_event_once on public.trip_events(trip_id,event_key);
create table public.sms_deliveries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.emergency_contacts(id), alert_id uuid references public.emergency_alerts(id),
  delivery_key text not null, body text not null, at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','unknown')),
  provider_sid text, claimed_at timestamptz, sent_at timestamptz, attempts integer not null default 0, unique(user_id,delivery_key)
);
create index on public.sms_deliveries(contact_id);
create index on public.sms_deliveries(alert_id);
alter table public.trip_points enable row level security;
create policy owner on public.trip_points for all to authenticated using (
  exists (select 1 from public.trips t where t.id=trip_points.trip_id and t.user_id=(select auth.uid()))
) with check (exists (select 1 from public.trips t where t.id=trip_points.trip_id and t.user_id=(select auth.uid())));
alter table public.emergency_locations enable row level security;
create policy owner on public.emergency_locations for all to authenticated using (
  exists (select 1 from public.emergency_alerts a join public.trips t on t.id=a.trip_id where a.id=emergency_locations.alert_id and t.user_id=(select auth.uid()))
) with check (exists (select 1 from public.emergency_alerts a join public.trips t on t.id=a.trip_id where a.id=emergency_locations.alert_id and t.user_id=(select auth.uid())));
alter table public.sms_deliveries enable row level security;
create policy owner on public.sms_deliveries for all to authenticated using (sms_deliveries.user_id=(select auth.uid())) with check (
  sms_deliveries.user_id=(select auth.uid()) and exists (select 1 from public.emergency_contacts c where c.id=sms_deliveries.contact_id and c.user_id=(select auth.uid()))
  and (sms_deliveries.alert_id is null or exists (select 1 from public.emergency_alerts a join public.trips t on t.id=a.trip_id where a.id=sms_deliveries.alert_id and t.user_id=(select auth.uid())))
);
revoke all on public.trip_points,public.emergency_locations,public.sms_deliveries from anon;
grant select,insert,update,delete on public.trip_points,public.emergency_locations,public.sms_deliveries to authenticated;

-- Dashboard photos remain private; only their owner's JWT can upload/read them.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('dashboard-photos','dashboard-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists buckl_dashboard_upload on storage.objects;
drop policy if exists buckl_dashboard_read on storage.objects;
create policy buckl_dashboard_upload on storage.objects for insert to authenticated
with check (bucket_id='dashboard-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy buckl_dashboard_read on storage.objects for select to authenticated
using (bucket_id='dashboard-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
notify pgrst, 'reload schema';
commit;
