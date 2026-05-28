# TrackFlowPro Follow-up Combined Fix

This package merges both follow-up fixes together:

1. Follow-up templates load/save through backend admin API, so message boxes stay after refresh.
2. Active Leads under each follow-up message load from Firestore outreach_leads, not Google Sheet or only the Leads tab cache.
3. Days Gap save recalculates nextFollowupAt and stores nextFollowupDelayMinutes / nextFollowupConfigStepKey.

## Replace these files

- app/api/trackflow/[...action]/route.ts
- app/admin/dashboard/page.tsx
- app/admin/dashboard/followup-utils.ts
- app/admin/dashboard/AutomationPanel.tsx
- app/admin/dashboard/types.ts

The last three are included to keep your dashboard folder consistent with the uploaded latest files.

## Test locally

Make sure your Windows time/timezone is correct first, because Firebase Admin can fail with ACCESS_TOKEN_EXPIRED if system time is wrong.

```bash
npm run build
npm run dev
```

Then test:

1. Login as admin.
2. Open Admin Dashboard -> Automation.
3. Select Google Ads -> F-1.
4. Confirm saved follow-up message appears.
5. Confirm Active Leads appears below the message.
6. Change Days Gap and Save Follow-up Settings.
7. Refresh browser and click Refresh Config.
8. Confirm message still appears and Active Leads still appears.
9. Check Firestore lead fields:
   - nextFollowupAt
   - nextFollowupDelayMinutes
   - nextFollowupConfigStepKey
   - nextFollowupStatus
   - nextFollowupReason

## Debug endpoint

While logged in through the dashboard, check Network tab for:

```text
/api/trackflow/automation/followups/candidates?service=Google+Ads&step=step1&limit=100&scanLimit=500
```

Expected response:

```json
{
  "success": true,
  "source": "firestore",
  "rows": [...]
}
```
