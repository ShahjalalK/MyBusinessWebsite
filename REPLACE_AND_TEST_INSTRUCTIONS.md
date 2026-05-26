# TrackFlow Pro v18.68 — Premium Chat Readability + Input Patch

## Replace these files

```text
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
PROJECT_CONTEXT_README.md
```

## What changed

```text
Assistant answers render with better spacing, sections, bullets, numbered steps, and important-note style blocks.
Closed chat state shows smart quick-question chips above the floating chat button.
Open chat state shows starter questions before the first user question.
Latest assistant reply shows contextual follow-up question chips.
Input textarea auto-grows while typing longer questions.
Enter sends the message.
Shift + Enter creates a new line.
Chat history, Supabase load/save, localStorage fallback, and hero button open behavior are preserved.
Gemini prompt gets lightweight formatting guidance, but evidence-safe validation remains unchanged.
```

## Test after replace

```bash
npm run build
npm run dev
```

## Manual QA checklist

```text
1. Open a secure report page.
2. Confirm closed chat state shows online indicator and quick question chips.
3. Click the hero “Ask about this review” button and confirm the chat opens.
4. Ask a question and confirm the answer appears progressively.
5. Confirm assistant answer is formatted clearly, not one plain text wall.
6. Confirm follow-up question chips appear under the latest assistant answer.
7. Type a long question and confirm the textarea grows.
8. Press Shift + Enter and confirm a new line is inserted.
9. Press Enter and confirm the message sends.
10. Refresh the page and confirm chat history reloads when Supabase/localStorage is available.
```
