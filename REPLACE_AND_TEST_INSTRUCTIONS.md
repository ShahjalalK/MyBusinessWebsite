# TrackFlow Pro v18.66 — Supabase Admin TypeScript Fix

Replace this file:

```text
lib/supabase-admin.ts
```

Then run:

```bash
npm run build
npm run dev
```

Fix:
- Removed nullable `.map(... return null).filter(...)` pattern from Supabase chat readers.
- `loadReportChatMessages()` now returns a typed `StoredReportChatMessage[]` directly.
- `listReportChatSessions()` now returns a typed `StoredReportChatSession[]` directly.
- No API, Supabase table, Gemini, or UI behavior changed.
