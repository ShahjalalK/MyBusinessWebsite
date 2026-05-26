# TrackFlow Pro v18.67 — Premium Floating Chat UX Fix

Replace this file:

```text
app/components/trackflow/ReportChatAssistant.tsx
```

Optional context update:

```text
PROJECT_CONTEXT_README.md
```

Do not replace `app/tracking-review/[domainSlug]/[token]/page.tsx` for this fix unless you have another page-specific change. Your current page already renders `<ReportChatAssistant />` and the hero button already links to `#ask-this-review`; the updated chat component now catches that click and opens the floating chat window.

## What changed

- Chat message area is taller and easier to read.
- Closed chat bubble shows an online/active green indicator.
- When the chat window is open, the bottom floating button is hidden.
- Hero “Ask about this review” button opens the chat window instead of behaving like a normal page section jump.
- Assistant answers appear progressively with a typing-style effect.
- Saved conversation behavior from the previous Supabase/localStorage update is preserved.
- No Gemini prompt, Supabase API route, Firestore report loading, or PDF logic was changed.

## Test

```bash
npm run build
npm run dev
```

Then open a secure report page and test:

```text
1. Bottom-right bubble is visible when chat is closed.
2. Bubble shows green online/active indicator.
3. Click bubble → chat window opens.
4. The blue bottom button disappears while the chat window is open.
5. Message area has enough reading space.
6. Ask a question → answer types in progressively.
7. Close button closes the chat.
8. Hero section “Ask about this review” button opens the chat window.
9. Refresh page → saved messages reload if Supabase is configured, otherwise localStorage fallback works.
```
