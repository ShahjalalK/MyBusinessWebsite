# Replace and Test Instructions — v18.77 Dashboard Overview Panel Split Stage 4

Replace/add these files in the same folder as your email automation dashboard `page.tsx`:

```text
page.tsx
OverviewPanel.tsx
PROJECT_CONTEXT_README.md
```

Keep your existing helper/hook files from the previous working version:

```text
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
ScheduledPanel.tsx
hooks/useScheduledEmails.ts
hooks/useSystemStatus.ts
hooks/useFollowupAdmin.ts
```

Then run:

```bash
npm run build
npm run dev
```

Test checklist:

```text
1. Overview tab opens normally.
2. Top summary cards show cached leads, hot leads, replies, bounces.
3. Refresh Report works.
4. Refresh Usage works.
5. System cleanup buttons still trigger confirmation/action.
6. Hot lead cards open the lead drawer.
7. Manage Automation switches to the automation tab.
8. See more leads button still behaves the same.
9. Scheduled tab still works after this patch.
```

This patch only splits the overview visual panel. It does not change API routes, Firestore fields, Sheet columns, Brevo behavior, or storage behavior.
