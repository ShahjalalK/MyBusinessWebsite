# TrackFlow Pro Secure Report Chat Assistant — Install Instructions

## Replace / add these files

Copy these files into the same paths in your Next.js project:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
app/api/trackflow/report-chat/route.ts
app/components/trackflow/ReportChatAssistant.tsx
lib/trackflow-ai/report-chat.ts
lib/supabase-admin.ts
PROJECT_CONTEXT_README.md
```

Optional Supabase history table:

```text
supabase/trackflow_report_chat.sql
```

## Environment variables

Add these to your Vercel / Next.js environment:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Optional, only if you want chat history saved outside Firestore
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

## Supabase setup, optional

Run `supabase/trackflow_report_chat.sql` in Supabase SQL editor if you want to save full client questions and AI answers.

If Supabase is not configured, the chatbot will still work; it will just skip chat-history logging.

## Test checklist

1. Run `npm run build` after replacing files.
2. Open an existing `/tracking-review/{domainSlug}/{token}` page.
3. Confirm the “Ask about this review” section appears before the final CTA.
4. Ask: “What does this finding mean?”
5. Confirm the answer stays evidence-safe and does not claim account-level truth.
6. Temporarily remove `GEMINI_API_KEY` and confirm the assistant shows a fallback instead of breaking the page.
7. If Supabase is configured, confirm rows appear in `trackflow_report_chat_messages`.
