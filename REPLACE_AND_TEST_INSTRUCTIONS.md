# Replace and Test — v18.91 Resilient Delete Flow

Replace these files in your Next.js project:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
app/dashboard/.../page.tsx
app/dashboard/.../CleanupPanel.tsx
app/dashboard/.../types.ts
PROJECT_CONTEXT_README.md
```

## Test order

1. Run:

```bash
npm run build
npm run dev
```

2. Open Dashboard → Cleanup tab.
3. Click Refresh Reports.
4. Select a test secure report.
5. Click Preview first.
6. Run Archive Report on one test record.
7. Then test Delete Test Data on a fake/test record only.

## Expected behavior

If a file was already deleted manually, cleanup should not stop:

```text
PDF missing        → already removed / skipped safely
Preview missing    → already removed / skipped safely
Supabase not set   → skipped safely
Sheet row missing  → skipped safely
Cleanup job issue  → logged, but cleanup response still returns
```

If “Delete test contact, no memory” is used on a contacted lead, it should show a clear needs-review message instead of a 500 error.
