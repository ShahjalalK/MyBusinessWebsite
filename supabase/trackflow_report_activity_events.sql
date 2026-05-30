-- ============================================================
-- TrackFlow Pro Chat Insights: PDF download activity tracking
-- Safe to run multiple times in Supabase SQL Editor
-- ============================================================

create table if not exists public.trackflow_report_activity_events (
  id text primary key,
  report_token text not null,
  domain_slug text,
  domain text,
  company_name text,
  event_type text not null,
  country_code text,
  country_name text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  created_at timestamptz not null default now()
);

grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.trackflow_report_activity_events
to service_role;

create index if not exists idx_trackflow_activity_report_token_created
on public.trackflow_report_activity_events (report_token, created_at desc);

create index if not exists idx_trackflow_activity_event_type_created
on public.trackflow_report_activity_events (event_type, created_at desc);

notify pgrst, 'reload schema';
