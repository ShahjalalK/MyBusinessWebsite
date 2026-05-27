# Replace and Test — v18.88 Secure Reports List Cleanup

Replace these files in your email automation dashboard folder:

```text
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Then run:

```bash
npm run build
npm run dev
```

Test checklist:

```text
1. Open the Cleanup tab.
2. Click Refresh Reports in Secure Report Cleanup.
3. Confirm saved reports from Firestore audit_reports appear.
4. Search by domain/company/email/token.
5. Use filters: All, Active, Expired, Viewed, No view, Cleaned, Test.
6. Click Select on a saved report.
7. Confirm the report URL/token field fills automatically.
8. Click Preview.
9. Review the cleanup summary.
10. Run Archive Report only on test data first.
```

Notes:

```text
- Backend cleanup endpoints were not changed in this patch.
- The list loads from Firestore audit_reports using the dashboard Firebase client.
- If Firestore rules block audit_reports reads, do not make reports public. Add a small admin-only backend list endpoint later.
- Delete Test Data is only for fake/test records or carefully reviewed delete requests.
```
