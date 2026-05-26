# Replace and Test — v18.78 Dashboard Analytics Panel Split Stage 5

Replace these files in the same dashboard folder where your current `page.tsx` lives:

```text
page.tsx
AnalyticsPanel.tsx
PROJECT_CONTEXT_README.md
```

Keep the existing files already added in previous stages:

```text
OverviewPanel.tsx
ScheduledPanel.tsx
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
hooks/useScheduledEmails.ts
hooks/useSystemStatus.ts
hooks/useFollowupAdmin.ts
```

After replacing, run:

```bash
npm run build
npm run dev
```

Test checklist:

```text
1. Dashboard opens normally.
2. Overview tab still works.
3. Scheduled tab still works.
4. Analytics tab opens.
5. Open/Click/Reply/Bounce cards display.
6. Load Postmaster button works or shows the same status as before.
7. Sender Performance cards display correctly.
8. Lead drawer still opens from other tabs.
```

This patch only moves the analytics tab UI into `AnalyticsPanel.tsx`. It does not change API routes, Firestore fields, Sheet columns, Brevo behavior, sender config, or stored Zustand state.
