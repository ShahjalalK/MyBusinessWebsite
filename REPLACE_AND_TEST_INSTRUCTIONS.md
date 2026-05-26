# TrackFlow Pro v18.65 — Secure Chat Messenger + Supabase History

Replace/add these files in your Next.js project:

```text
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts
app/admin/trackflow-chat/page.tsx
supabase/trackflow_report_chat.sql
PROJECT_CONTEXT_README.md
```

## 1. Supabase setup

Run this SQL in Supabase SQL Editor:

```text
supabase/trackflow_report_chat.sql
```

Then set these Vercel environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TRACKFLOW_CHAT_SESSIONS_TABLE=trackflow_report_chat_sessions
TRACKFLOW_CHAT_MESSAGES_TABLE=trackflow_report_chat_messages
TRACKFLOW_CHAT_ADMIN_SECRET=choose-a-long-private-admin-key
```

Important:

```text
Never expose SUPABASE_SERVICE_ROLE_KEY in client components.
Only use it from server files such as lib/supabase-admin.ts.
```

## 2. Build and run

```bash
npm run build
npm run dev
```

## 3. Test secure page chatbot

Open any secure report page:

```text
/tracking-review/{domainSlug}/{token}
```

Test:

```text
1. Bottom-right chat bubble appears
2. Click opens Messenger-style chat window
3. Ask: What does this finding mean?
4. Refresh page
5. Same conversation reloads
6. Ask another question
7. Close/open bubble
8. Mobile viewport still fits
```

## 4. Test Supabase admin viewer

Open:

```text
/admin/trackflow-chat?key=YOUR_TRACKFLOW_CHAT_ADMIN_SECRET
```

Expected:

```text
Recent chat sessions are listed
Click a session to view user and assistant messages
If Supabase is not configured, the page shows a setup message
```

## 5. Notes

```text
Firestore remains slim for report rendering.
Supabase stores chatbot sessions/messages.
localStorage is only a browser fallback if Supabase is not configured or temporarily unavailable.
The chatbot remains report-aware and evidence-safe.
```
