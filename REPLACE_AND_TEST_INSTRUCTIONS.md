# v18.75 Dashboard Action Hook Split Stage 2

Replace these files in the same dashboard folder that contains your current `page.tsx`:

```text
page.tsx
hooks/useScheduledEmails.ts
hooks/useSystemStatus.ts
hooks/useFollowupAdmin.ts
PROJECT_CONTEXT_README.md
```

Keep your existing stage-1 helper files in the same folder:

```text
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
```

This patch intentionally does not change dashboard UI, API routes, Firestore fields, Sheet columns, Brevo behavior, or report storage.

After replacing, run:

```bash
npm run build
npm run dev
```

Test checklist:

```text
1. Open dashboard and switch tabs.
2. Scheduled tab loads scheduled emails.
3. Edit scheduled email, save it, cancel one test item if safe, and send-soon if safe.
4. Overview/Analytics loads Firebase usage summary.
5. Overview/Automation loads system health.
6. Automation follow-up summary loads.
7. Follow-up dry-run works.
8. Postmaster health button still works or shows the same configured/not-configured message.
9. Existing lead bulk actions still work.
```
