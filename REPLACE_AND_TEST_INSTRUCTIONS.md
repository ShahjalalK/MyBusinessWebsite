# TrackFlow Pro v18.76 — Dashboard Scheduled Panel Split Stage 3

## Replace/Add these files

Place these files in the same folder as your current dashboard `page.tsx`:

```text
page.tsx
ScheduledPanel.tsx
PROJECT_CONTEXT_README.md
```

`ScheduledPanel.tsx` must sit beside `page.tsx`, not inside a deeper folder, because it imports:

```ts
./types
./constants
./utils
../../../lib/senders
```

## What changed

```text
Scheduled email tab UI moved out of page.tsx
ScheduledPanel.tsx now owns:
- scheduled email table
- scheduled status alert
- scheduled edit drawer
- scheduled WYSIWYG editor
- refresh / edit / send soon / cancel / save buttons

page.tsx still owns:
- dashboard shell
- top tabs
- hooks/state wiring
- remaining unsplit panels
```

## What did not change

```text
No API route URL changed
No request payload changed
No Firestore field changed
No Sheet column changed
No Brevo behavior changed
No scheduled email hook behavior changed
No UI redesign was done
```

## Test commands

```bash
npm run build
npm run dev
```

## Manual test checklist

```text
Open dashboard
Go to Scheduled tab
Click Refresh
Open Edit on a scheduled email
Change subject/body/time
Save changes
Open Edit again
Click Send Soon
Cancel a scheduled email
Confirm other tabs still render
```

If build fails, send the exact terminal error and the latest file that error mentions.
