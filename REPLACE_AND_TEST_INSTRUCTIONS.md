# Replace and Test Instructions

1. Replace these files in your project:
   - app/api/trackflow/[...action]/route.ts
   - lib/trackflow-cleanup/report-cleanup.ts
   - app/email-automation/page.tsx (or your current dashboard page.tsx location)
   - app/email-automation/CleanupPanel.tsx
   - app/email-automation/types.ts
   - PROJECT_CONTEXT_README.md

2. Run:
   npm run build
   npm run dev

3. Test:
   - Open Dashboard → Cleanup tab
   - Click Refresh Reports
   - Confirm secure reports load without Firestore permission errors
   - Select a test report
   - Click Preview
   - Only after preview looks correct, test Archive Report on a test report

Notes:
- Do not loosen Firestore rules for audit_reports.
- The report list is now loaded through the admin-only TrackFlow API.
