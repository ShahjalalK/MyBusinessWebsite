# TrackFlow Pro v18.50 — Secure Report Chat Answer Quality Patch

## Replace these files

```text
app/api/trackflow/report-chat/route.ts
lib/trackflow-ai/report-chat.ts
app/components/trackflow/ReportChatAssistant.tsx
lib/supabase-admin.ts
PROJECT_CONTEXT_README.md
```

## What this patch fixes

- Prevents incomplete client-facing answers such as “Based on our browser-visible review of…”
- Adds deterministic professional answers for common secure-page questions.
- Adds TrackFlow Pro identity handling:
  - TrackFlow Pro / who prepared this review: Shahjalal Khan, Founder & Tracking Architect.
  - Reviewed business CEO/founder/owner: outside the tracking-review scope unless explicitly present in saved report data.
- Reduces repeated “browser-visible review” openings.
- Avoids markdown-heavy output with visible `**bold**` markers.
- Validates Gemini output before it reaches the client.
- Keeps Node.js runtime for Firebase Admin compatibility.
- Keeps Supabase logging optional and compatible with the simple SQL table setup.

## Required env vars

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Optional chat history logging:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TRACKFLOW_CHAT_SESSIONS_TABLE=trackflow_report_chat_sessions
TRACKFLOW_CHAT_MESSAGES_TABLE=trackflow_report_chat_messages
```

## Test checklist

After replacing files, run:

```bash
npm run build
npm run dev
```

Open a secure report page and test:

```text
What does this finding mean?
What should we verify first?
Can this affect Google Ads reporting?
Who prepared this review?
What is CEO name of this company?
```

Expected CEO/identity behavior:

```text
If the user means TrackFlow Pro, answer Shahjalal Khan, Founder & Tracking Architect.
If the user means the reviewed business, say leadership is outside the tracking-review scope unless present in the saved report.
```

Expected tracking-answer behavior:

```text
Short, complete answers.
No half-sentences.
No invented account-level claims.
No “tracking is broken” claims.
Clear next verification step.
```

## Notes

This patch does not touch Firestore report registration, report normalizers, PDF storage, Blob export, or secure page layout.
