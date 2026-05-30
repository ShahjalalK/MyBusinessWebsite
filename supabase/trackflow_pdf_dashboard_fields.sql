-- ============================================================
-- TrackFlow Chat Insights PDF download dashboard fields
-- Safe to run multiple times
-- ============================================================

alter table public.trackflow_report_chat_sessions
  add column if not exists pdf_downloaded_at timestamptz,
  add column if not exists last_pdf_downloaded_at timestamptz,
  add column if not exists pdf_download_count integer default 0;

grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.trackflow_report_chat_sessions
to service_role;

create index if not exists idx_trackflow_chat_sessions_last_pdf_downloaded_at
on public.trackflow_report_chat_sessions (last_pdf_downloaded_at desc);

notify pgrst, 'reload schema';
