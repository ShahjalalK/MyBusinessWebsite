# TrackFlow Pro v18.92 — Cleanup Contact Badge Stage 14F-A

Replace these files in your project:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

## Test

```bash
npm run build
npm run dev
```

Then test:

```text
Dashboard → Cleanup tab
Refresh Reports
Check the new Contact badge on each secure report
Click View in Leads for a contacted/email row
Select a test report
Preview
Archive Report or Delete Test Data only after preview is correct
```

Expected behavior:

```text
Cleanup tab shows a simple contact badge: Not contacted / Email sent / Email opened / Email clicked / Replied / LinkedIn sent.
Detailed open/click/reply history remains in the Leads tab.
View in Leads switches to the Leads tab and fills the search box with the linked contact/report value.
```
