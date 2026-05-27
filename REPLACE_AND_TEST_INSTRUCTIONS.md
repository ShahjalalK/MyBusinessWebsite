# TrackFlow Pro v18.87 — Cleanup UI Simplification Stage 14A

Replace these files in the email automation dashboard folder:

```text
page.tsx
CleanupPanel.tsx
PROJECT_CONTEXT_README.md
```

`types.ts` is included as a safe reference copy. It is unchanged from your uploaded version.

## What changed

- The Cleanup tab now uses simple operator-friendly labels:
  - Preview
  - Archive Report
  - Remove Files Only
  - Delete Test Data
- Technical words such as B2, Blob, Supabase, Firestore, manifest, soft, hard, and assets_only are hidden from the main workflow.
- Cleanup result rows are shown as human-readable items:
  - PDF file
  - Preview image
  - Chat history
  - Secure report
  - Sheet row
  - Linked lead
- Technical cleanup details remain available under “Show technical details”.
- Old lead cleanup is clearly separated from secure report cleanup.

## What did not change

- Backend cleanup routes
- API URLs
- Firestore fields
- Sheet fields
- B2/Blob/Supabase cleanup logic
- Cron cleanup behavior
- Lead cleanup behavior
- Dashboard stored state shape

## Test checklist

```bash
npm run build
npm run dev
```

Then test:

```text
1. Open Cleanup tab
2. Paste a test secure report URL or token
3. Click Preview
4. Confirm the summary is easy to understand
5. Run Archive Report only on test data first
6. Use Delete Test Data only for fake/test reports
7. Check Old Lead Cleanup buttons and filters
```

If a build error appears, send the exact terminal error.
