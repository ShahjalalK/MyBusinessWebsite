# TrackFlow Pro v18.71 — Intent-Safe Chat Answer Engine Patch

## Replace these files

```text
lib/trackflow-ai/report-chat.ts
PROJECT_CONTEXT_README.md
```

## What this patch fixes

- Phone-call questions now receive phone-call tracking answers.
- Form/enquiry questions now receive form-submission verification answers.
- Booking, ecommerce, GA4, GTM, Google Ads, Meta, server-side, score, evidence, and no-clear-event questions now have their own deterministic answer paths.
- The assistant no longer falls back to the same generic lead-form answer for unrelated question intents.
- If a topic is not proven in the saved report, the assistant says what can and cannot be confirmed and gives the correct verification test.
- Unsafe claims remain blocked: no invented evidence, no account-level truth claims, no “tracking is broken” claims.

## Test commands

```bash
npm run build
npm run dev
```

## Manual test questions

Ask these on a secure report page and confirm the answers are different and topic-specific:

```text
Are phone calls being tracked properly?
How should phone call tracking be tested?
Are form submissions being tracked properly?
What does no clear conversion event mean?
If GTM is found, why verify again?
What should we check inside GA4?
Can this affect Google Ads reporting?
What does the score mean?
Why does this need account access?
```

## Expected behavior

The assistant should answer the exact question topic, stay evidence-safe, and never claim final conversion recording without GA4, GTM, Google Ads, CRM, call-tracking, or server access.
