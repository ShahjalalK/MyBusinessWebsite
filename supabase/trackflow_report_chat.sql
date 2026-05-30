-- ============================================================
-- FILE: supabase/trackflow_report_chat.sql
-- Purpose: Secure report chat history + admin Chat Insights dashboard.
-- Safe to run more than once.
-- ============================================================

create table if not exists public.trackflow_report_chat_sessions (
  id uuid primary key,
  report_token text not null,
  domain text,
  domain_slug text,
  company_name text,
  country_code text,
  country_name text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  message_count integer not null default 0,
  last_user_question text,
  last_assistant_answer_snippet text,
  reviewed_at timestamptz,
  report_url text
);

create table if not exists public.trackflow_report_chat_messages (
  id bigserial primary key,
  session_id uuid not null,
  report_token text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source text,
  quota_status text,
  created_at timestamptz not null default now()
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
  add column if not exists first_seen_at timestamptz default now(),
  add column if not exists last_seen_at timestamptz default now(),
  add column if not exists message_count integer default 0,
  add column if not exists last_user_question text,
  add column if not exists last_assistant_answer_snippet text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists report_url text;

create index if not exists trackflow_report_chat_sessions_report_token_idx
  on public.trackflow_report_chat_sessions (report_token);

create index if not exists trackflow_report_chat_sessions_updated_at_idx
  on public.trackflow_report_chat_sessions (updated_at desc);

create index if not exists trackflow_report_chat_sessions_reviewed_at_idx
  on public.trackflow_report_chat_sessions (reviewed_at);

create index if not exists trackflow_report_chat_messages_session_token_idx
  on public.trackflow_report_chat_messages (session_id, report_token, created_at);

alter table public.trackflow_report_chat_sessions enable row level security;
alter table public.trackflow_report_chat_messages enable row level security;

-- Access should happen through the server-side Supabase service-role key only.
-- Do not add public anon select/insert policies for these tables.
