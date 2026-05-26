# TrackFlow Pro v18.49 — Secure Report Responsive UX Patch

## Changed files

Replace these files only:

- `app/tracking-review/[domainSlug]/[token]/page.tsx`
- `app/components/trackflow/ReportChatAssistant.tsx`
- `PROJECT_CONTEXT_README.md`

No report registration, Firestore storage, Gemini API route, Supabase logging, or Firebase Admin files were changed in this patch.

## What changed

- Added a hero-level `Ask about this review` shortcut so clients can quickly find the assistant.
- Improved mobile/tablet spacing and headline readability.
- Made section anchors easier to navigate with fixed navbar spacing.
- Changed PDF mobile experience to a compact card with Open/Download buttons instead of forcing a cramped embedded PDF preview on small screens.
- Kept embedded PDF preview for tablet/desktop.
- Made the chatbot stack cleanly on mobile/tablet and use a wider chat panel on desktop.
- Improved suggested question chips so they stack on mobile without overflow.
- Improved chat message area height and padding across devices.
- Made final CTA buttons full-width on smaller screens.

## Test checklist

Run:

```bash
npm run build
npm run dev
```

Then test these screen widths:

- 360px mobile
- 390px mobile
- 430px mobile
- 768px tablet
- 1024px laptop/tablet landscape
- 1366px desktop

Check:

- No horizontal scrolling.
- Hero buttons are clear and tappable.
- `View findings`, `View PDF report`, and `Ask about this review` scroll correctly.
- PDF preview does not feel broken on mobile.
- Chatbot input is easy to type in on mobile.
- Suggested questions do not overflow.
- Final CTA buttons are readable and easy to tap.
- Existing secure report page still loads from Firestore.
- Gemini chat still streams from `/api/trackflow/report-chat`.
