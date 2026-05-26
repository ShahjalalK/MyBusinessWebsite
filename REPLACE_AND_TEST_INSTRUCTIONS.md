# v18.83 Dashboard Leads Panel Split Stage 10

Replace these files in the same dashboard folder where your email automation `page.tsx` lives:

```text
page.tsx
LeadsPanel.tsx
PROJECT_CONTEXT_README.md
```

## What changed

```text
Leads tab visual UI moved to LeadsPanel.tsx
page.tsx still owns lead actions, bulk actions, selected lead drawer, and store wiring
No API URL, Firestore field, Zustand state, or destructive action behavior changed
```

## Test

Run:

```bash
npm run build
npm run dev
```

Then test:

```text
1. Open dashboard
2. Open Leads tab
3. Change Active / Archived / Trash / All view
4. Change month/status/service filters
5. Search by email/company
6. Select/unselect rows and select-all
7. Open a lead drawer by clicking a row
8. Test Archive / Restore / Move to Trash only on safe test leads
9. Permanent delete only on fake/test records
10. Confirm Overview, Sheet Leads, Outreach, Scheduled, Cleanup, Automation, and Analytics still open
```
