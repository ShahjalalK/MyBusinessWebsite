# TrackFlow Pro — Follow-up Days Gap Reschedule Fix

Replace these files in your project:

```text
app/api/trackflow/[...action]/route.ts
page.tsx
```

## What changed

When Automation → Days Gap is saved, the dashboard now:

1. Saves the follow-up config as before.
2. Calls a new admin backend endpoint:

```text
POST /api/trackflow/automation/followups/reschedule
```

3. The endpoint recalculates existing `nextFollowupAt` for the selected service + selected follow-up step.
4. It only extends schedules by default, so increasing Days Gap moves ready/scheduled leads into the future without accidentally making earlier sends eligible.
5. It skips replied, bounced, spam, unsubscribed, stopped, archived, deleted, inactive, wrong-step, and no-engagement leads.
6. The dashboard refreshes the follow-up summary and lead cache after saving.

## Test

```bash
npm run build
npm run dev
```

Then test:

```text
1. Open Automation tab.
2. Pick a service and follow-up step that already has ready/scheduled leads.
3. Increase Days Gap.
4. Click Save.
5. Confirm the success alert says existing leads were checked/rescheduled.
6. Open Leads tab and refresh.
7. Confirm those leads are no longer Ready if the new gap pushes nextFollowupAt into the future.
8. Confirm replied/bounced/unsubscribed/spam leads were not changed.
```

## Firestore fields affected

Only eligible `outreach_leads` documents may update:

```text
nextFollowupAt
nextFollowupStep
nextFollowupStatus
nextFollowupReason
lastFollowupEvaluatedAt
automationLock
updatedAt
```

The automation config still saves to:

```text
automation_settings/followup_config
```
