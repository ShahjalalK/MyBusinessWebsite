# TrackFlow Pro v18.70 — Dynamic Report-Aware Chat Questions Patch

Replace these files in your project:

```text
app/components/trackflow/reportChatQuestions.ts
app/components/trackflow/ReportChatAssistant.tsx
app/tracking-review/[domainSlug]/[token]/page.tsx
PROJECT_CONTEXT_README.md
```

What changed:

```text
- Chat question chips are now generated from the secure report context.
- No specific score such as 83/100 is hardcoded into questions.
- Phone-call reports can show phone-call questions.
- Lead-form reports can show form-submission questions.
- Booking reports can show booking/appointment tracking questions.
- Ecommerce reports can show cart/checkout/purchase questions.
- GA4/GTM/Google Ads/server-side context creates matching verification questions.
- Already-asked questions are hidden from closed-state, starter, and follow-up chips.
- Question rules live in a separate reportChatQuestions.ts file.
- Zustand/global state was not added.
- Supabase history, localStorage fallback, typing animation, formatted answers, and auto-growing input are preserved.
```

Run:

```bash
npm run build
npm run dev
```

Test:

```text
1. Open a secure report page.
2. Check the closed chat state: compact question chips should appear above the button.
3. Ask one suggested question.
4. Confirm the same question no longer appears in suggestions.
5. Ask another question and confirm new follow-up chips appear.
6. Open a report with phone-call focus and check phone-call question priority.
7. Open a report with form/booking/ecommerce focus and check matching dynamic questions.
8. Confirm the hero "Ask about this review" button still opens the chat.
9. Confirm chat history still reloads after refresh when Supabase is configured.
```

Notes:

```text
- app/api/trackflow/report-chat/route.ts was not changed.
- Gemini prompt/backend behavior was not changed.
- This is a UI/context suggestion patch only.
```
