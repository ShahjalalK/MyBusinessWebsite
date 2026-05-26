-- TrackFlow Pro secure report chat history
-- Run this in Supabase SQL Editor.
-- Server-side inserts/reads should use SUPABASE_SERVICE_ROLE_KEY only.
-- Do not expose the service role key to client components.

create extension if not exists pgcrypto;

create table if not exists public.trackflow_report_chat_sessions (
  id uuid primary key,
  report_token text not null,
  domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trackflow_report_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trackflow_report_chat_sessions(id) on delete cascade,
  report_token text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source text,
  quota_status text,
  created_at timestamptz not null default now()
);

create index if not exists trackflow_report_chat_sessions_token_idx
  on public.trackflow_report_chat_sessions(report_token);

create index if not exists trackflow_report_chat_sessions_updated_idx
  on public.trackflow_report_chat_sessions(updated_at desc);

create index if not exists trackflow_report_chat_messages_session_idx
  on public.trackflow_report_chat_messages(session_id, created_at asc);

create index if not exists trackflow_report_chat_messages_token_idx
  on public.trackflow_report_chat_messages(report_token, created_at desc);

alter table public.trackflow_report_chat_sessions enable row level security;
alter table public.trackflow_report_chat_messages enable row level security;

-- No public RLS policies are needed.
-- The Next.js server uses the Supabase service role key, which bypasses RLS.
