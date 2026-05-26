# TrackFlow Pro v18.74 Dashboard Helper Split Stage 1

## What changed

This patch keeps the dashboard UI and behavior the same, but moves non-UI helper logic out of the giant dashboard page file.

## Files to replace/add

Put these files in the same folder as your current email automation dashboard `page.tsx`:

```text
page.tsx
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
```

Also replace the project README:

```text
PROJECT_CONTEXT_README.md
```

## Important

The updated `page.tsx` imports helpers with relative imports:

```ts
import type { ... } from "./types";
import { ... } from "./utils";
```

So the helper files must be beside `page.tsx`.

## Test

After replacing files:

```bash
npm run build
npm run dev
```

Then check:

```text
1. Dashboard opens
2. Overview tab loads
3. Sheet queue tab loads
4. Outreach composer opens and draft restore works
5. Scheduled emails tab loads
6. Leads tab filters work
7. Cleanup tab loads candidates
8. Automation tab loads follow-up config/summary
9. Analytics tab loads usage
```

## Notes

No API route, Firestore field, Sheet column, Brevo behavior, or dashboard panel layout was intentionally changed in this stage.
