-- Missing Prompt 4 baseline. Run ONCE on a new Supabase project, then 002_update.sql.
-- Do not run this over an existing team's schema. The catch-up is a separate migration.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, name text not null
);
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$')
);
create table public.cars (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  make text not null, model text not null, year integer not null, plate text, colour text, gearbox text,
  mileage_km integer, last_service_month text, last_service_km integer,
  battery_changed text check (battery_changed in ('under_1y','1_2y','over_2y'))
);
create table public.predrive_checks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(), slept double precision not null, awake double precision not null,
  median_ms double precision not null, misses integer not null,
  risk text not null constraint predrive_checks_risk_check check (risk in ('low','raised','high'))
);
create table public.trips (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid not null references public.cars(id), predrive_id uuid references public.predrive_checks(id),
  started_at timestamptz not null default now(), ended_at timestamptz, origin jsonb, destination jsonb,
  distance_km double precision
);
create table public.trip_events (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  at timestamptz not null, kind text not null check (kind in ('tired','microsleep','not_responding','lost','yawn','hard_brake')),
  lat double precision, lng double precision, details jsonb not null default '{}'
);
create table public.trip_features (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  at timestamptz not null, perclos double precision, blink_rate double precision, mean_blink_ms double precision,
  yawns integer, minutes_driving double precision, hour_of_day integer, hard_brakes integer, risk double precision
);
create table public.emergency_alerts (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  contact_id uuid not null references public.emergency_contacts(id), at timestamptz not null default now(),
  lat double precision not null, lng double precision not null,
  status text not null constraint emergency_alerts_status_check check (status in ('sent','cancelled','failed')),
  resolved_at timestamptz
);
create table public.car_checks (
  id uuid primary key default gen_random_uuid(), car_id uuid not null references public.cars(id) on delete cascade,
  at timestamptz not null default now(), kind text not null check (kind in ('dashboard','startup'))
);
create table public.findings (
  id uuid primary key default gen_random_uuid(), check_id uuid not null references public.car_checks(id) on delete cascade,
  label text not null, severity text not null constraint findings_severity_check check (severity in ('info','soon','stop')),
  advice text not null, confidence double precision, photo_url text
);

-- RLS follows parent ownership, including ownership of linked car/check/contact rows.
alter table public.profiles enable row level security;
create policy owner on public.profiles for all to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
alter table public.emergency_contacts enable row level security;
create policy owner on public.emergency_contacts for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
alter table public.cars enable row level security;
create policy owner on public.cars for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
alter table public.predrive_checks enable row level security;
create policy owner on public.predrive_checks for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
alter table public.trips enable row level security;
create policy trip_owner_access on public.trips
for all to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (select 1 from public.cars c where c.id = car_id and c.user_id = auth.uid())
  and (predrive_id is null or exists (select 1 from public.predrive_checks p where p.id = predrive_id and p.user_id = auth.uid()))
);
alter table public.trip_events enable row level security;
create policy owner on public.trip_events for all to authenticated using (
  exists (select 1 from public.trips t where t.id=trip_events.trip_id and t.user_id=(select auth.uid()))
) with check (exists (select 1 from public.trips t where t.id=trip_events.trip_id and t.user_id=(select auth.uid())));
alter table public.trip_features enable row level security;
create policy owner on public.trip_features for all to authenticated using (
  exists (select 1 from public.trips t where t.id=trip_features.trip_id and t.user_id=(select auth.uid()))
) with check (exists (select 1 from public.trips t where t.id=trip_features.trip_id and t.user_id=(select auth.uid())));
alter table public.emergency_alerts enable row level security;
create policy owner on public.emergency_alerts for all to authenticated using (
  exists (select 1 from public.trips t where t.id=emergency_alerts.trip_id and t.user_id=(select auth.uid()))
) with check (exists (select 1 from public.trips t where t.id=emergency_alerts.trip_id and t.user_id=(select auth.uid()))
  and exists (select 1 from public.emergency_contacts c where c.id=emergency_alerts.contact_id and c.user_id=(select auth.uid())));
alter table public.car_checks enable row level security;
create policy owner on public.car_checks for all to authenticated using (
  exists (select 1 from public.cars c where c.id=car_checks.car_id and c.user_id=(select auth.uid()))
) with check (exists (select 1 from public.cars c where c.id=car_checks.car_id and c.user_id=(select auth.uid())));
alter table public.findings enable row level security;
create policy owner on public.findings for all to authenticated using (
  exists (select 1 from public.car_checks k join public.cars c on c.id=k.car_id where k.id=findings.check_id and c.user_id=(select auth.uid()))
) with check (exists (select 1 from public.car_checks k join public.cars c on c.id=k.car_id where k.id=findings.check_id and c.user_id=(select auth.uid())));

create index on public.emergency_contacts(user_id);
create index on public.cars(user_id);
create index on public.predrive_checks(user_id,at);
create index on public.trips(user_id,started_at);
create index on public.trips(car_id);
create index on public.trips(predrive_id);
create index on public.trip_events(trip_id,at);
create index on public.trip_features(trip_id,at);
create index on public.emergency_alerts(trip_id);
create index on public.emergency_alerts(contact_id);
create index on public.car_checks(car_id,at);
create index on public.findings(check_id);
revoke all on public.profiles, public.emergency_contacts, public.cars, public.predrive_checks, public.trips,
  public.trip_events, public.trip_features, public.emergency_alerts, public.car_checks, public.findings from anon;
grant select,insert,update,delete on public.profiles, public.emergency_contacts, public.cars, public.predrive_checks,
  public.trips, public.trip_events, public.trip_features, public.emergency_alerts, public.car_checks, public.findings to authenticated;
commit;
