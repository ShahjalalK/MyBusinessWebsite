# TrackFlow Pro v18.51 — Secure Report Chat English Client Output Patch

## Replace files

Copy these files into the matching project paths:

```text
lib/trackflow-ai/report-chat.ts
PROJECT_CONTEXT_README.md
```

This patch does not change the secure page UI, Gemini API route, Firebase Admin, Firestore report storage, or Supabase table schema.

## Why this patch exists

It prevents client-facing chatbot answers from showing mixed Bengali/internal evidence notes such as:

```text
GA4 signal পাওয়া গেছে
```

The assistant now rewrites common mixed-language tracking notes into polished English, for example:

```text
GA4 signal was noted in the browser-visible review.
```

## Test checklist

Run:

```bash
npm run build
npm run dev
```

Then open a secure report page and test:

```text
What does this finding mean?
What is the main point?
What should we verify first?
Can this affect Google Ads reporting?
Who prepared this review?
What is CEO name of this company?
```

Expected behavior:

- No Bengali/raw internal evidence phrases appear in client answers.
- Common questions get complete professional answers.
- TrackFlow Pro identity questions mention Shahjalal Khan, Founder & Tracking Architect.
- Reviewed-business leadership questions remain out of scope unless the report explicitly contains that information.
- Evidence-safe wording is preserved.
