# TrackFlow Pro Email Automation + Secure Report System

This project is the Vercel-hosted TrackFlow Pro email automation and secure report website.

The local Python audit system creates the audit result and PDF. This Next.js app stores the client-facing report data in Firestore, stores PDF files through Vercel Blob, shows the secure tracking-review page, and sends/follows up cold outreach emails.

## Main production flow

```text
Local Python audit system
→ reviewed PDF + private report copy
→ local Next.js export route uploads PDF to Vercel Blob
→ Vercel /api/trackflow/reports/register saves report data in Firestore
→ client opens /tracking-review/{domainSlug}/{token}
→ email automation sends the secure page URL, not the direct PDF URL
```

## Important routes

| Area | Path | Purpose |
|---|---|---|
| Blob PDF export | `app/api/export/blob-reports/route.ts` | Local dashboard route. Fetches PDF from Python, uploads to Vercel Blob, registers secure report, updates Sheet if requested. |
| Sheet bridge | `app/api/export/sheet/route.ts` | Google Sheet lead queue/staging. Sheet is not the client-facing database. |
| TrackFlow API dispatcher | `app/api/trackflow/[...action]/route.ts` | Catch-all API dispatcher for email, followups, webhooks, unsubscribe, reports, cleanup, and health. |
| Secure report page | `app/tracking-review/[domainSlug]/[token]/page.tsx` | Client-facing private tracking review page. Reads report data from Firestore by token. |

## Modular API files

| File | Owns | Send this file when... |
|---|---|---|
| `lib/trackflow-api/report-normalizers.ts` | Report token/slug generation, safe report URL creation, Firestore-safe report payload normalization, Blob/Drive PDF field aliases. | Report content is saved wrongly, report URL is wrong, PDF URL fields are missing, or secure page data shape is wrong. |
| `lib/trackflow-api/reports.ts` | Report register, report view beacon, PDF preview/download, CTA click tracking, and report health handlers. | Secure page register/view/download/CTA tracking has an issue. |
| `app/api/trackflow/[...action]/route.ts` | Main dispatcher plus email, followup, webhook, sheet queue, cleanup, and legacy logic that has not yet been split. | API action routing, send email, followups, webhook, unsubscribe, or cleanup has an issue. |

## Current report collections and storage

```text
Firestore collection: audit_reports/{token}
PDF storage: Vercel Blob
Client URL: https://trackflowpro.com/tracking-review/{domainSlug}/{token}
Google Sheet: lead queue + outreach status only
```

## Required environment variables

### Local audit dashboard / export app

```env
NEXT_PUBLIC_AUDIT_API_URL=http://127.0.0.1:8000
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...
TRACKFLOW_REPORT_REGISTER_URL=https://trackflowpro.com/api/trackflow/reports/register
TRACKFLOW_REPORT_REGISTER_SECRET=same-value-as-vercel-REPORT_REGISTER_SECRET
TRACKFLOW_APP_URL=https://trackflowpro.com
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
```

### Vercel email automation app

```env
REPORT_REGISTER_SECRET=same-value-as-local-TRACKFLOW_REPORT_REGISTER_SECRET
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
BREVO_API_KEY=...
CRON_SECRET=...
BREVO_WEBHOOK_SECRET=...
REPLY_WEBHOOK_SECRET=...
UNSUBSCRIBE_SECRET=...
ALLOWED_ADMIN_EMAILS=you@example.com
```

## What to send ChatGPT for future fixes

| Problem | Send these files first |
|---|---|
| Secure report URL, report register, PDF preview/download, report view/CTA tracking | `lib/trackflow-api/reports.ts`, `lib/trackflow-api/report-normalizers.ts`, `app/api/trackflow/[...action]/route.ts` |
| Blob upload/export from local dashboard | `app/api/export/blob-reports/route.ts`, `app/components/LeadList/constants.ts`, `app/components/LeadList.tsx` |
| Google Sheet queue/export/status | `app/api/export/sheet/route.ts`, sample Sheet row/screenshot |
| Client secure page UI/content | `app/tracking-review/[domainSlug]/[token]/page.tsx`, sample report document from Firestore |
| Email sending / Brevo / unsubscribe | `app/api/trackflow/[...action]/route.ts`, `lib/senders.ts`, sender config file |
| Follow-up timing or cron | `app/api/trackflow/[...action]/route.ts`, Firestore followup config screenshot/document |

## Safe modularization status

- Step 1 complete: report registration and secure report tracking handlers are now in `lib/trackflow-api/reports.ts`.
- Step 1 complete: report payload normalization is now in `lib/trackflow-api/report-normalizers.ts`.
- The public API URLs are unchanged. The catch-all route still dispatches actions.
- Next safe steps can split email, followups, webhooks, unsubscribe, and cleanup into their own modules later.
