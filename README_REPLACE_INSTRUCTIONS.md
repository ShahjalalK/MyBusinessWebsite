# TrackFlow Pro v18.73 — TrackFlow API Modularization Stage 1

## Replace / add these files

Add these new files:

```text
lib/trackflow-api/core.ts
lib/trackflow-api/security.ts
lib/trackflow-email/sender-selection.ts
lib/trackflow-email/contact-memory.ts
lib/trackflow-email/suppression.ts
lib/trackflow-email/email-events.ts
```

Replace these existing files:

```text
app/api/trackflow/[...action]/route.ts
PROJECT_CONTEXT_README.md
```

Keep your existing file:

```text
lib/trackflow-storage/b2.ts
```

The zip includes `lib/trackflow-storage/b2.ts` only so the full patch folder is self-contained. If your local `b2.ts` already matches the latest working version, you can leave it as-is.

## What changed

This is a safe stage-1 split only:

```text
route.ts still owns all existing route paths and dispatch behavior.
Shared helpers moved to lib/trackflow-api/core.ts.
Admin/cron/webhook/unsubscribe security helpers moved to lib/trackflow-api/security.ts.
Sender selection, contact memory, suppression, and lightweight email event logging moved to lib/trackflow-email/.
Dashboard page.tsx was not touched.
Email automation behavior, Firestore fields, Sheet columns, Brevo behavior, report register behavior, and B2/Blob storage behavior should stay the same.
```

## Test checklist

Run:

```bash
npm run build
npm run dev
```

Then test these routes from the dashboard:

```text
1. Send one test email draft/send flow.
2. Load scheduled emails.
3. Load cleanup candidates.
4. Load usage/system health.
5. Open a secure report PDF preview.
6. Download a secure report PDF.
7. Confirm unsubscribe page still renders from an old/test link.
```

If any TypeScript error appears, send the exact error and the updated file it points to.
