# Replace and Test Instructions — v18.85 Deployed Cron Cleanup Stage 12

This patch makes cleanup production/deployed-server safe. Cronjob.org should call only the deployed Vercel `/api/trackflow/...` endpoint. Cleanup no longer depends on local-only routes such as `app/api/export/blob-reports/route.ts` or `app/api/export/sheet/route.ts`.

Copy these files into the same locations in your Next.js/Vercel project:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
lib/trackflow-cleanup/sheet-cleanup.ts
lib/supabase-admin.ts
lib/trackflow-storage/b2.ts
PROJECT_CONTEXT_README.md
```

## Required deployed ENV for full cleanup

At minimum, Vercel needs:

```env
CRON_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
B2_ENDPOINT=...
B2_BUCKET_NAME=...
B2_KEY_ID=...
B2_APPLICATION_KEY=...
```

Optional but recommended on Vercel:

```env
BLOB_READ_WRITE_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_SHEET_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_NAME=Sheet1
```

If optional ENV is missing, that specific cleanup step is skipped safely; the cron will not try to call localhost.

## Build test

```bash
npm run build
npm run dev
```

## Manual report cleanup dry-run

```text
GET /api/trackflow/cleanup/report?token=YOUR_TEST_TOKEN
```

Or POST:

```json
{
  "token": "YOUR_TEST_TOKEN",
  "mode": "soft",
  "leadMode": "none",
  "sheetMode": "mark",
  "dryRun": true
}
```

## Manual confirmed cleanup test

Use only a fake/test report first:

```json
{
  "token": "YOUR_TEST_TOKEN",
  "mode": "soft",
  "leadMode": "archive",
  "sheetMode": "mark",
  "dryRun": false,
  "confirm": "CLEANUP_REPORT_ASSETS"
}
```

Hard cleanup is manual-only:

```json
{
  "token": "YOUR_TEST_TOKEN",
  "mode": "hard",
  "leadMode": "delete",
  "sheetMode": "clear",
  "dryRun": false,
  "confirm": "DELETE_REPORT_ASSETS"
}
```

## Cronjob.org dry-run

Call the deployed Vercel endpoint only:

```text
https://trackflowpro.com/api/trackflow/cron/cleanup-expired-reports?dryRun=true&limit=5
```

Send the cron secret using one of your existing supported cron-auth methods for this route.

## Cronjob.org confirmed cleanup

Run this only after checking dry-run output:

```text
https://trackflowpro.com/api/trackflow/cron/cleanup-expired-reports?dryRun=false&confirm=CLEANUP_EXPIRED_REPORTS&limit=5
```

Cron cleanup uses safe soft cleanup only. Hard cleanup is blocked in cron and must be done manually through the POST cleanup endpoint.

## What this patch does not require

```text
No localhost route
No local app running
No app/api/export/blob-reports/route.ts call
No app/api/export/sheet/route.ts call
```
