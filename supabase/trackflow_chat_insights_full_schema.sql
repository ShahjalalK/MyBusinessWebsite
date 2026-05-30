-- ============================================================
-- TrackFlow Pro Chat Insights full safe schema fix
-- Safe to run multiple times in Supabase SQL Editor
-- Adds:
-- - chat session columns used by dashboard
-- - message table permissions
-- - PDF download activity table
-- ============================================================

create table if not exists public.trackflow_report_chat_sessions (
  id text primary key,
  report_token text not null,
  domain text,
  updated_at timestamptz
);

create table if not exists public.trackflow_report_chat_messages (
  session_id text,
  report_token text,
  role text,
  content text,
  source text,
  quota_status text,
  created_at timestamptz default now()
);

alter table public.trackflow_report_chat_sessions
  add column if not exists domain_slug text,
  add column if not exists company_name text,
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists device_type text,
  add column if not exists browser text,
  add column if not exists os text,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists message_count integer default 0,
  add column if not exists last_user_question text,
  add column if not exists last_assistant_answer_snippet text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists report_url text;

alter table public.trackflow_report_chat_messages
  add column if not exists session_id text,
  add column if not exists report_token text,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists source text,
  add column if not exists quota_status text,
  add column if not exists created_at timestamptz default now();

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

update public.trackflow_report_chat_sessions
set
  updated_at = coalesce(updated_at, now()),
  first_seen_at = coalesce(first_seen_at, updated_at, now()),
  last_seen_at = coalesce(last_seen_at, updated_at, now()),
  message_count = coalesce(message_count, 0);

grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.trackflow_report_chat_sessions
to service_role;

grant select, insert, update, delete
on table public.trackflow_report_chat_messages
to service_role;

grant select, insert, update, delete
on table public.trackflow_report_activity_events
to service_role;

grant usage, select, update
on all sequences in schema public
to service_role;

create index if not exists idx_trackflow_chat_sessions_updated_at
on public.trackflow_report_chat_sessions (updated_at desc);

create index if not exists idx_trackflow_chat_sessions_report_token
on public.trackflow_report_chat_sessions (report_token);

create index if not exists idx_trackflow_chat_messages_session_token_created
on public.trackflow_report_chat_messages (session_id, report_token, created_at asc);

create index if not exists idx_trackflow_chat_messages_report_token_created
on public.trackflow_report_chat_messages (report_token, created_at desc);

create index if not exists idx_trackflow_activity_report_token_created
on public.trackflow_report_activity_events (report_token, created_at desc);

create index if not exists idx_trackflow_activity_event_type_created
on public.trackflow_report_activity_events (event_type, created_at desc);

notify pgrst, 'reload schema';
