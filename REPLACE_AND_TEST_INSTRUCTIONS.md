# TrackFlow Pro v18.86 — Manual Report Cleanup Controls

## Replace these files

Place these files in the email automation dashboard route folder where the current `page.tsx`, `CleanupPanel.tsx`, and `types.ts` live:

```text
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

## What changed

- Added a **Report Asset Cleanup** section to the existing Cleanup tab.
- Added manual preview/dry-run support for a report token or secure report URL.
- Added confirmed soft/assets/hard cleanup controls.
- Added per-service cleanup step results for B2, Blob, Supabase, Firestore, Google Sheet, and linked lead cleanup.
- Existing lead cleanup candidate actions remain unchanged.

## Safety defaults

- Preview cleanup does not delete anything.
- Soft cleanup is the default recommendation.
- Hard cleanup requires typing `DELETE_REPORT_ASSETS` before the button unlocks.
- The UI calls `/api/trackflow/cleanup/report`; it does not depend on local-only export routes.

## Test checklist

```bash
npm run build
npm run dev
```

Then test in the Cleanup tab:

1. Paste a test secure report URL or report token.
2. Click **Preview Cleanup**.
3. Confirm the manifest shows the expected B2 PDF key, Blob targets, report token, lead, and Sheet row.
4. Run **Soft Cleanup** on a fake/test report only.
5. Check Firestore `cleanup_jobs` for the job log.
6. Check the step table for any warning/error rows.
7. Use **Hard Cleanup** only for fake/test data.
