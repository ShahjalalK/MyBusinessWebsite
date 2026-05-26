# TrackFlow Pro v18.69 — Smart Chat Suggestions UX Patch

## Replace these files

```text
app/components/trackflow/ReportChatAssistant.tsx
PROJECT_CONTEXT_README.md
```

## What changed

```text
Closed-state question chips are now compact pills only.
The large "Ask a quick question" background card was removed.
Questions already asked by the visitor are hidden from future suggestions.
Starter questions and follow-up questions rotate to the next useful report-aware question.
Follow-up suggestions prioritize GA4, GTM, Google Ads, lead-path testing, account access, and safest next steps.
Messenger-style open/close behavior, Supabase/localStorage history, typing-style response, and auto-growing input are preserved.
```

## Test commands

```bash
npm run build
npm run dev
```

## Manual QA checklist

```text
1. Open a secure tracking-review page.
2. Confirm the closed chat state shows only compact question chips above the button.
3. Confirm the chips do not cover too much page text.
4. Click a suggested question.
5. Confirm the same question does not appear again after it was asked.
6. Ask another question and confirm new follow-up chips appear under the latest assistant answer.
7. Confirm open chat still has readable formatted answers.
8. Confirm the input auto-grows with longer text.
9. Confirm Enter sends and Shift+Enter creates a new line.
10. Refresh the page and confirm saved history still loads when Supabase/localStorage is available.
```
