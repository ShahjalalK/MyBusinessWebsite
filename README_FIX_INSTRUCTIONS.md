# TrackFlow Pro — Follow-up Days Gap + Active Leads Sync Fix

## Replace these files

1. `app/api/trackflow/[...action]/route.ts`
2. `app/admin/dashboard/page.tsx`
3. `app/admin/dashboard/AutomationPanel.tsx`
4. `app/admin/dashboard/followup-utils.ts`

If your dashboard folder is not exactly `app/admin/dashboard/`, replace the files in the same folder where your current `page.tsx`, `AutomationPanel.tsx`, and `followup-utils.ts` live.

## What this fixes

- Automation tab Active Leads now shows matching leads even when the variant editor is still empty.
- Google Ads opened leads can show under the correct follow-up step when `nextFollowupStep` is already stored in Firestore.
- Saving Days Gap now calls the reschedule endpoint with `recalculate_all`, so existing scheduled leads sync to the new gap both when the gap increases and when it decreases.
- Backend still skips replied, bounced, spam, unsubscribed, stopped, archived, and deleted leads.

## Test

```bash
npm run build
npm run dev
```

Then test:

1. Open `/admin/dashboard`.
2. Go to Automation tab.
3. Select `Google Ads` and `F-1`.
4. Confirm the opened Google Ads lead appears under `Active Leads` below the variation box.
5. Add a short follow-up message if the editor is empty.
6. Change Days Gap.
7. Click `Save Follow-up Settings`.
8. Open Leads tab, refresh latest leads, then open the lead drawer.
9. Confirm Next action / Next follow-up date matches the new Days Gap.

## Notes

- If Active Leads is still 0, click `Refresh latest 20` in Leads tab first, because Automation tab uses the dashboard lead cache.
- If the lead is not in the latest cache, load more or search/refresh until that lead is present.
