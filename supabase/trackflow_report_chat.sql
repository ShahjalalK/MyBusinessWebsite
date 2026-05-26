create table if not exists public.trackflow_report_chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_token text not null,
  domain_slug text,
  session_id text,
  visitor_id text,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  quota_status text,
  error_message text,
  ip_address text,
  user_agent text
);

create index if not exists trackflow_report_chat_messages_report_token_idx
  on public.trackflow_report_chat_messages (report_token, created_at desc);

create index if not exists trackflow_report_chat_messages_session_idx
  on public.trackflow_report_chat_messages (session_id, created_at asc);

alter table public.trackflow_report_chat_messages enable row level security;

-- Service-role inserts are performed from the Next.js server route.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
