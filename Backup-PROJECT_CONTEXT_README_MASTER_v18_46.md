# TrackFlow Pro — MASTER PROJECT CONTEXT README

Version: v18.46-master-project-context  
Last updated: 2026-05-25  
Purpose: Upload this single README in a new ChatGPT chat so the assistant/developer can quickly understand the full TrackFlow Pro project, where each file lives, which files are connected, and what to update for each problem.

---

## 1. Project Goal

TrackFlow Pro is a Google Ads, GA4, GTM, Meta Pixel, conversion tracking, and server-side tracking audit/outreach system.

The project helps a Google Ads / server-side tracking specialist create evidence-safe tracking reviews for prospects found from:

- Google/search-result lead lists
- LinkedIn accepted connections / manually pasted websites
- Selected/bulk lead audits

The system should produce:

1. A browser-visible website audit from the local Python FastAPI/Playwright backend.
2. A client-friendly PDF tracking audit.
3. A private/secure tracking-review page.
4. A professional Open Graph / LinkedIn preview image.
5. Optional LinkedIn/email outreach copy.
6. Slim Firestore storage with only the fields needed to render the secure report page.

The system must **not** claim final tracking truth unless account/server access is available. Public browser-visible evidence can show tags, requests, screenshots, forms, CTAs, and tracking signals, but it cannot prove final conversion recording inside Google Ads, GA4, GTM, CRM, call-tracking, or server logs.

---

## 2. High-Level Production Flow

```text
Local dashboard / lead list
→ Website URL + optional context
→ Python FastAPI audit backend
→ Playwright browser-visible scan
→ Network evidence + screenshot evidence
→ Client-friendly PDF generated locally
→ Optional Gemini polish / safe copy builder
→ Next.js Blob export route fetches PDF from Python
→ PDF + OG image + preview image uploaded to Vercel Blob
→ Vercel /api/trackflow/reports/register saves slim report data in Firestore
→ Client opens /tracking-review/{domainSlug}/{token}
→ LinkedIn/email outreach sends secure report URL, not direct PDF URL
```

---

## 3. Most Important Product Decisions

### 3.1 Evidence Safety

The report should say:

```text
Browser-visible evidence was reviewed.
Final confirmation requires account/server access.
```

Do **not** say:

```text
Your tracking is broken.
Google Ads is not working.
All conversions are confirmed.
Server-side tracking is confirmed.
You are losing money.
```

### 3.2 Manual Context Priority

Manual context should guide report focus but must not create fake evidence.

Priority rule:

```text
Manual Primary Conversion
→ Search keyword/category hint
→ Website auto-detect
```

Screenshot priority rule:

```text
Manual Visual Focus
→ Primary Conversion
→ Website auto-detect
```

Examples:

```text
Primary Conversion = Phone Call
→ Main report focus: phone calls / call-click tracking
→ Secondary paths: forms, booking, quote, etc. if detected

Primary Conversion = Booking / Appointment
→ Main report focus: booking / appointment tracking
→ Secondary paths: phone/contact/form if detected

Primary Conversion = Purchase / Checkout
→ Main report focus: product/cart/checkout/purchase tracking
```

### 3.3 Email/LinkedIn Copy Storage

Email copy, LinkedIn message copy, outreach copy, and raw Gemini copy should **not** be saved to Firestore by default.

Firestore should save:

```text
reportToken
reportUrl
pdfViewUrl
pdfDownloadUrl
blobPathname
ogImageUrl / previewImageUrl
homepageScreenshotUrl if needed
domain / domainSlug
headline / mainFinding / proofPoints / recommendations
secure page content needed for rendering
```

Firestore should not save:

```text
email_copy
linkedin_message_copy
outreach_copy
email_draft
rawGeminiResponse
raw network debug data
full audit JSON unless explicitly needed
```

### 3.4 PDF Pagination Rule

Do **not** force every PDF into exactly 6 pages.

Correct rule:

```text
Target: 6 pages when content fits cleanly.
7 pages is acceptable when content needs space.
Never cut sentences.
Never hide text.
Never make text too small.
Never leave a weak page with huge empty gap.
Avoid 8+ pages by deduplicating content.
```

In simple terms:

```text
Readable 7-page PDF is better than cramped/broken 6-page PDF.
```

---

## 4. Python Backend Map

Location: `python-backend/`

### 4.1 `python-backend/audit.py`

Main backend file.

Owns:

- FastAPI app
- CORS setup
- `/health`
- async audit job manager
- `/audit/start`
- `/audit/status/{audit_id}`
- `/audit/result/{audit_id}`
- `/audit/cancel/{audit_id}`
- `/audit/pdf/{audit_id}`
- Playwright browser pool
- website audit orchestration
- page scanning
- network request capture
- tracking/vendor detection
- GA4 / Google Ads / GTM / Meta / server-side signal detection
- safe form test / live form test mode
- click ID persistence test
- audit result assembly
- PDF generation trigger / PDF HTML wrapper
- final result cleanup wrappers

Use this file when:

- Python server fails to run
- audit start/status/result/cancel endpoint has an issue
- PDF endpoint is broken
- Playwright/browser/audit job freezes
- manual context is not being preserved
- PDF final wrapper is not applied
- audit result fields are missing

Important context fields preserved in this file:

```text
audit_source
source_context
search_keyword
search_category_hint
business_type
business_type_context
primary_conversion_action
conversion_action_context
visual_evidence_focus
screenshot_focus
market_country
market_context
manual_business_name
business_name
company_name
linkedin_website_url
linkedin_contact_name
linkedin_profile_url
linkedin_audit_notes
```

### 4.2 `python-backend/trackflow_modules/reports.py`

Client-facing PDF and report helper layer.

Owns:

- PDF wording helpers
- business context detection
- top findings
- business problem cards
- recommendations
- score label wording
- client-safe report text cleanup
- duplicate recommendation cleanup
- non-ecommerce/ecommerce wording guard
- report/PDF content helper functions

Use this file when:

- PDF wording is wrong
- wrong category language appears
- ecommerce wording appears in service business report
- “conversion action submissions” style robotic wording appears
- Top Findings / problem cards / recommendations are repetitive
- client-safe language needs improvement
- report text is too long/short
- business impact wording is poor

### 4.3 `python-backend/trackflow_modules/evidence_capture.py`

Visual evidence and screenshot strategy module.

Owns:

- screenshot selection strategy
- visual evidence focus
- screenshot captions
- popup/newsletter/modal cleanup
- ecommerce product/cart/checkout visual journey
- future lead-gen/local-service/SaaS visual journeys
- visual evidence fallback if screenshot is unsuitable

Use this file when:

- homepage/contact/booking/product/cart screenshot is wrong
- screenshot missing or blank
- screenshot caption is bad
- screenshot order is wrong
- popup/overlay blocks screenshot
- visual focus is not respected
- PDF visual evidence section looks unprofessional

Current desired caption style:

```text
Homepage visual context
Contact form before safe interaction
Contact form after safe interaction
Booking page visual context
Phone / header CTA visual context
Product page visual context
Cart visual context
Checkout visual context
Evidence summary used instead of visual screenshot
```

Do not use client-facing captions like:

```text
visual check - before interaction
Visual CTA/ context before interaction
debug screenshot
template fallback
```

### 4.4 `python-backend/trackflow_modules/gemini_client.py`

Gemini API and prompt-safety file.

Owns:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`, usually `gemini-2.5-flash`
- max output token config
- `GEMINI_SYSTEM_PROMPT`
- banned phrases
- rules for evidence-safe polish

Gemini should:

- polish wording only
- summarize provided evidence
- generate safe client copy
- keep LinkedIn/email copy short and non-accusatory

Gemini must not:

- invent evidence
- invent screenshots
- claim final account-level truth
- say tracking is broken
- say revenue loss is proven
- override deterministic primary conversion context

Use this file when:

- Gemini is writing scary copy
- Gemini invents findings
- Gemini uses banned phrases
- Gemini writes wrong business category copy
- Gemini creates too-long PDF/email copy

### 4.5 `python-backend/trackflow_modules/secure_page.py`

Secure/private page content helper.

Owns:

- private/secure report page copy
- headline/subheadline
- business impact
- proof points
- verification plan
- CTA/trust notes
- client-safe disclaimer
- secure page payload shaping from audit result

Use this file when:

- secure page headline/content is poor
- secure page proof points/recommendations are wrong
- secure page business wording mismatches PDF
- secure page CTA needs improvement
- secure page needs more/less content

### 4.6 `python-backend/trackflow_modules/email_copy.py`

Client copy and outreach copy engine.

Owns:

- `client_copy_context`
- secure page copy package
- LinkedIn message copy
- email subject/body copy
- outreach copy package

Important: this file may generate copy for dashboard use, but that copy should not automatically be saved to Firestore unless explicitly requested.

Use this file when:

- LinkedIn/email message copy is poor
- outreach copy should change
- secure page/email/LinkedIn copy should align with primary conversion
- generated copy is too aggressive or too long

### 4.7 `python-backend/trackflow_modules/config.py`

Owns:

- app name/version
- CORS helpers
- audit parameter defaults

Use this file when:

- CORS/origin config breaks
- audit defaults need changing

### 4.8 `python-backend/trackflow_modules/keywords.py`

Owns:

- tracking/vendor patterns
- GA4/Ads/Meta/server-side keywords
- CMS/contact/social/lead/thank-you/consent/click-ID keywords

Use this file when:

- vendor detection is wrong
- GA4/Ads/Meta/SST requests are missed
- false positives/false negatives need tuning

### 4.9 `python-backend/trackflow_modules/search.py`

Placeholder/future split for search/lead discovery backend logic.

### 4.10 `python-backend/trackflow_modules/audit_engine.py`

Placeholder/future split for Playwright audit-engine logic. The main engine is still mostly in `audit.py`.

---

## 5. Next.js Dashboard / Lead List Map

Location: Next.js app, mainly `app/components/LeadList*`

### 5.1 `app/components/LeadList.tsx`

Main dashboard state and audit workflow file.

Owns:

- search-result lead list
- filters/stats
- selected leads
- bulk audit flow
- single search lead audit flow
- LinkedIn/manual website audit flow
- Python health check
- audit progress polling
- cancel audit
- PDF download
- Gemini/client copy polish
- secure report export/create flow
- manual `manualAuditLead`
- manual secure page creation after LinkedIn audit

Use this file when:

- audit button does not work
- bulk audit does not run
- LinkedIn/manual audit does not run
- manual/LinkedIn audit result is not stored
- Create Secure Page button is missing or broken
- secure report export from dashboard is broken
- progress/polling UI is wrong
- PDF download/polish button logic is wrong

### 5.2 `app/components/LeadList/LinkedInAuditPanel.tsx`

UI panel for LinkedIn/manual website audit.

Owns:

- website URL input
- business name
- business type/category
- primary conversion
- visual evidence focus
- market
- notes
- run audit button
- cancel button
- open last report
- download PDF
- polish report
- Create Secure Page / Update Secure Page / Open Secure Page buttons

Use this file when:

- LinkedIn/manual audit UI field missing
- Create Secure Page button missing after manual audit
- Open Secure Page button missing
- panel layout is poor
- primary conversion/visual focus dropdown is wrong

### 5.3 `app/components/LeadList/LeadRow.tsx`

Row UI for search-result leads.

Owns:

- per-lead audit controls
- row-level primary tracking goal
- row-level visual evidence focus
- per-lead form mode
- per-lead ads transparency
- audit/run/cancel buttons for rows

Use this file when:

- bulk/search lead row controls are missing
- row-level primary goal/visual focus does not display
- row-level audit controls break
- row-level UI is too crowded

### 5.4 `app/components/LeadList/linkedinAuditOptions.ts`

Owns dropdown options:

- business type/category list
- primary conversion options
- visual evidence focus options
- market options
- helper tips

Use this file when:

- category list needs changes
- primary conversion list needs changes
- visual focus option list needs changes
- market list needs changes

Important current options include:

```text
Business Type:
Auto, Ecommerce, Local Service, Lead Generation, SaaS, Professional Service, Healthcare, Education, Real Estate, Travel/Hospitality, Restaurant, Finance/Insurance, Automotive, Nonprofit, Media/Blog, Marketplace/Directory, Other

Primary Conversion:
Auto/Not sure, Purchase/Checkout, Add to Cart, Booking/Appointment, Phone Call, Lead Form, Contact/Quote, Demo Request, Signup/Trial, Newsletter, Donation, Application/Enrollment, Reservation, Download, Directions/Store Visit

Visual Focus:
Auto, Homepage + Main CTA, Phone CTA/Header, Contact/Lead Form, Booking/Appointment, Product + Cart, Checkout Journey, Pricing/Demo, Evidence Summary Only
```

### 5.5 `app/components/LeadList/reportHelpers.ts`

Owns:

- Python asset URL normalization
- audit ID resolution
- AI report copy merge
- PDF URL generation
- PDF download
- hosted secure report URL detection
- merge secure report export data back into audit/lead

Use this file when:

- PDF URL is wrong
- AI polished copy does not attach to audit result
- secure report URL is not detected
- export result is not merged into lead/audit
- “Open Secure Page” cannot find URL

### 5.6 `app/components/LeadList/auditApi.ts`

Owns:

- `fetchJsonWithTimeout`
- audit start
- audit status polling
- audit result fetching
- cancel audit
- timeout/retry behavior

Use this file when:

- status polling times out too quickly
- frontend says Python server may still be working
- start/status/result request fails
- cancel audit does not work

### 5.7 `app/components/LeadList/leadHelpers.ts`

Owns:

- lead URL/domain extraction
- manual lead from audit
- audit score helper
- hot/good/manual review/SST status helpers
- normalize audit target input

Use this file when:

- wrong domain is used
- manual audit lead title/domain is wrong
- score label/filter is wrong

### 5.8 `app/components/LeadList/types.ts`

Owns:

- TypeScript types for LeadList system:
  - `LinkedInAuditContext`
  - `AuditProgressInfo`
  - `AuditStartResponse`
  - `AuditStatusResponse`
  - `AuditResultResponse`
  - `AiReportCopyResponse`
  - `DriveReportExportResult`
  - `LeadRowProps`

Use this file when:

- TypeScript complains about missing props/fields
- new UI props need type definitions
- audit response shape changes

### 5.9 `app/components/LeadList/constants.ts`

Owns:

- `NEXT_PUBLIC_AUDIT_API_URL`
- `DRIVE_REPORT_EXPORT_ENDPOINT` / Blob report export endpoint
- SST keywords
- audit defaults
- polling interval

Use this file when:

- dashboard calls wrong Python URL
- Blob export endpoint is wrong
- local/Vercel environment URL mismatch
- audit default settings need changing

---

## 6. Email Automation / Report Hosting / Storage Map

### 6.1 `app/api/export/blob-reports/route.ts`

Local dashboard export route.

Owns:

- fetching PDF from Python
- uploading PDF to Vercel Blob
- creating/using OG card / preview image
- optionally uploading homepage screenshot
- registering secure report payload
- optional Google Sheet update

Use this file when:

- PDF upload to Blob fails
- preview/OG image is missing
- secure page register payload is wrong
- LinkedIn/Facebook preview image is wrong
- Blob path/file naming is wrong
- local export route cannot call production register URL

### 6.2 `lib/trackflow-api/report-normalizers.ts`

Report payload sanitizer/normalizer.

Owns:

- token generation / normalization
- domain slug generation
- safe report URL creation
- Firestore-safe payload shape
- PDF field aliases
- Blob/Drive field aliases
- slim storage whitelist
- remove/block raw email/LinkedIn/Gemini/debug fields

Use this file when:

- Firestore stores too much data
- secure page data shape is wrong
- `ogImageUrl`, `homepageScreenshotUrl`, `previewImageUrl`, `ogImagePathname` missing
- PDF URL aliases missing
- email/LinkedIn copy leaks into Firestore
- wrong token/domain slug/report URL

### 6.3 `lib/trackflow-api/reports.ts`

Firestore report register/lookup/tracking logic.

Owns:

- register report handler
- health handler
- report view beacon
- PDF preview/download tracking
- CTA click tracking
- writes to:
  - `audit_reports/{token}`
  - `audit_report_domains/{domainSlug or normalized domain}`
- update/merge behavior for existing report tokens

Use this file when:

- secure page register fails
- Firestore report data missing
- report URL exists but secure page cannot load
- `audit_reports` / `audit_report_domains` mismatch
- view/download/CTA tracking has issue
- health endpoint missing expected debug info

### 6.4 `app/api/trackflow/[...action]/route.ts`

Main catch-all API dispatcher.

Owns:

- dispatching `/api/trackflow/...` actions
- email automation actions
- followups
- webhooks
- unsubscribe
- report register catch-all
- cleanup
- health
- legacy logic not yet split

Use this file when:

- email send/follow-up breaks
- webhook breaks
- unsubscribe breaks
- report register action not routed
- catch-all route returns wrong action
- health endpoint is wrong

### 6.5 `app/tracking-review/[domainSlug]/[token]/page.tsx`

Client-facing secure report page.

Owns:

- secure tracking-review page UI
- loading Firestore report by token/domain
- SEO/OG metadata
- PDF preview/download area
- report content display
- CTA area

Use this file when:

- secure page UI is ugly or missing sections
- OG metadata wrong
- secure page does not show PDF
- secure page content is not displayed correctly
- public page returns 404/500
- LinkedIn preview uses wrong metadata

### 6.6 `app/api/export/sheet/route.ts`

Google Sheet queue/staging bridge.

Owns:

- lead queue export/status
- Sheet rows
- outreach staging

Use this file when:

- Google Sheet export is wrong
- leads are missing from sheet
- Sheet row/status columns are wrong

Google Sheet is **not** the client-facing report database. Firestore is the client report database.

---

## 7. Firestore Collections and Storage

Known current collections:

```text
audit_reports/{token}
audit_report_domains/{domainSlug or normalized domain}
```

Expected saved fields include:

```text
token / reportToken
reportUrl
domain
domainSlug
normalizedDomain
pdfViewUrl
pdfDownloadUrl
pdfFileId
blobPathname
ogImageUrl
openGraphImageUrl
previewImageUrl
homepageScreenshotUrl if needed
ogImagePathname
headline
mainFinding
businessImpact
proofPoints
recommendations
verificationPlan
problemCards
updatedAt
createdAt
source
```

Do not save unless explicitly intended:

```text
email_copy
linkedin_message_copy
outreach_copy
email_draft
client_copy_context
rawGeminiResponse
raw audit JSON
full observed network logs
internal debug payloads
```

Storage policy:

```text
PDF + OG image + secure page minimum fields are enough.
Homepage screenshot should only be stored when needed for OG card/PDF/secure page.
Email/LinkedIn text can be generated in dashboard but does not need Firestore.
```

---

## 8. Environment Variables

### 8.1 Python backend `.env`

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_OUTPUT_TOKENS=4096
GEMINI_RETRY_MAX_OUTPUT_TOKENS=6144

AUDIT_BROWSER_POOL=true
AUDIT_MAX_CONCURRENT_AUDITS=2
```

### 8.2 Local Next.js dashboard/export app

```env
NEXT_PUBLIC_AUDIT_API_URL=http://127.0.0.1:8000
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...
TRACKFLOW_REPORT_REGISTER_URL=https://trackflowpro.com/api/trackflow/reports/register
TRACKFLOW_REPORT_REGISTER_SECRET=same-value-as-vercel-REPORT_REGISTER_SECRET
TRACKFLOW_APP_URL=https://trackflowpro.com
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
```

Important URL rule:

```text
Use one canonical app URL, preferably https://trackflowpro.com or https://www.trackflowpro.com consistently.
Avoid mixed www/non-www unless intentionally handled.
```

### 8.3 Vercel email automation app

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

### 8.4 Google Sheet / Service Account

If `invalid_grant: Invalid JWT` appears, check:

- computer/server clock time
- service account private key formatting
- token iat/exp reasonable time
- local environment loaded correctly

---

## 9. Current User Workflows

### 9.1 Search Result / Bulk Audit Workflow

```text
Search leads
→ optionally set row-level Primary Goal / Visual Focus
→ run audit per row or bulk selected leads
→ review PDF
→ polish copy if needed
→ export/create secure report
→ send secure page link
```

Bulk audit should use:

```text
Row Primary Goal > Search Keyword Hint > Website Auto-detect
```

### 9.2 LinkedIn Manual Website Audit Workflow

```text
Paste LinkedIn prospect website URL
→ set business type/category
→ set primary conversion
→ set visual focus
→ run LinkedIn Tracking Review
→ review PDF
→ polish client copy if needed
→ Create Secure Page
→ Open Secure Page
→ send secure page link to LinkedIn connection
```

As of v18.45, LinkedIn/manual audit has its own Create Secure Page button and should not require the lead to be selected in the search lead list.

### 9.3 PDF/Report Review Workflow

Before sending to a client:

1. Open PDF.
2. Check business name/category.
3. Check primary conversion focus.
4. Check screenshot relevance.
5. Check wording is not accusatory.
6. Confirm no text is cut.
7. Confirm no white/invisible text.
8. Confirm PDF URL and secure page URL work.
9. Confirm LinkedIn preview image works if sharing link.

---

## 10. Feature-to-File Troubleshooting Guide

| Problem | Send/Update These Files First |
|---|---|
| PDF text invisible/white, colors wrong | `python-backend/audit.py`, `python-backend/trackflow_modules/reports.py`, sample PDF screenshot |
| PDF sentence cut/truncated | `audit.py`, `reports.py`, sample PDF |
| PDF too many/too few pages | `audit.py`, `reports.py`, sample PDF |
| PDF wording/category wrong | `reports.py`, `gemini_client.py`, sample PDF |
| PDF recommendations repetitive | `reports.py`, `gemini_client.py`, sample PDF |
| Screenshot missing/wrong/caption bad | `evidence_capture.py`, `audit.py`, sample PDF/screenshot |
| Secure page content wrong | `secure_page.py`, `reports.ts`, `report-normalizers.ts`, secure page screenshot |
| Secure page does not open | `reports.ts`, `report-normalizers.ts`, `[domainSlug]/[token]/page.tsx`, Firestore document screenshot |
| Secure page register fails | `app/api/export/blob-reports/route.ts`, `lib/trackflow-api/reports.ts`, `app/api/trackflow/[...action]/route.ts` |
| Firestore stores too much data | `report-normalizers.ts`, `reports.ts` |
| Blob PDF/OG upload fails | `app/api/export/blob-reports/route.ts`, env variables |
| LinkedIn preview image missing | `page.tsx` metadata, `reports.ts`, `report-normalizers.ts`, Blob preview fields |
| LinkedIn/manual audit button missing | `LeadList.tsx`, `LinkedInAuditPanel.tsx` |
| Row-level primary goal/visual focus issue | `LeadRow.tsx`, `LeadList.tsx`, `linkedinAuditOptions.ts`, `types.ts` |
| Audit polling timeout | `auditApi.ts`, `audit.py` terminal logs |
| Python server / Playwright crash | `audit.py`, terminal error |
| Gemini wrong/unsafe copy | `gemini_client.py`, `email_copy.py`, sample output |
| Email send/followup issue | `app/api/trackflow/[...action]/route.ts`, sender config, Brevo/webhook logs |
| Google Sheet export issue | `app/api/export/sheet/route.ts`, Sheet screenshot |
| TypeScript build error | exact file in error + related type file |

---

## 11. Version History Summary

### Early modularization

- **v18.3** — compact 6-page PDF direction.
- **v18.4** — ecommerce visual journey.
- **v18.5** — modular `evidence_capture.py`.
- **v18.6** — evidence capture fix.
- **v18.7** — PDF structure polish.
- **v18.8** — modular `secure_page.py`.
- **v18.9** — Blob reports routes.

### Secure report / Blob / Firestore

- **v18.10** — tracking review route.
- **v18.11** — Blob endpoint constant.
- **v18.12** — modular TrackFlow reports.
- **v18.13** — stable Blob storage.
- **v18.14** — Blob reports TypeScript fix.
- **v18.15** — domain reuse fix.
- **v18.16** — report domain index final.
- **v18.17** — `reports.ts` resolved type fix.
- **v18.18** — domain stable token fallback.

### Audit stability / OG preview

- **v18.19** — stable audit score.
- **v18.20** — audit NameError fix.
- **v18.21** — LinkedIn OG preview.
- **v18.22** — LinkedIn OG preview fix.
- **v18.23** — OG preview slim Firestore.
- **v18.24** — OG preview final debug/slim.
- **v18.25** — catch-all register OG slim fix.
- **v18.26** — OG debug logs.
- **v18.27** — OG debug health logs.
- **v18.28** — `savedData` build fix.
- **v18.29** — OG card download / professional OG card.
- **v18.30** — polished OG card.
- **v18.31** — English-only polished OG card.
- **v18.32** — premium social preview card.
- **v18.33** — OG card 80% visible.

### PDF/image optimization and audit context

- **v18.34** — PDF image optimizer.
- **v18.35** — screenshot reliability / OG fallback.
- **v18.36** — LinkedIn audit panel.
- **v18.37** — LinkedIn category options.
- **v18.38** — Primary Goal + Visual Focus system. Manual priority > auto-detect.
- **v18.39** — client copy engine for secure page, LinkedIn, and email copy.
- **v18.40** — secure page/PDF slim storage; email/LinkedIn copy excluded from Firestore.
- **v18.41** — client report cleanup; removed internal/debug wording.
- **v18.42** — PDF visual presentation cleanup.
- **v18.43** — PDF color safety fix.
- **v18.44** — PDF client presentation polish.
- **v18.45** — LinkedIn/manual audit Create Secure Page button.
- **v18.46** — this master context README consolidating Python, Next.js, secure report, Blob, Firestore, PDF, OG, LinkedIn, and email automation context.

---

## 12. Current Known Desired Improvements / Watch Items

1. PDF should use adaptive pagination:
   - 6 pages when clean.
   - 7 pages when needed.
   - no cut sentences.
   - no weak empty pages.

2. PDF must avoid:
   - white/invisible text.
   - debug/internal captions.
   - robotic phrases like “conversion action submissions”.
   - non-ecommerce reports showing prominent `ecommerce / cart` unless strong evidence.

3. Visual Evidence page should show:
   - clear screenshots when suitable.
   - evidence summary fallback when screenshot is unsuitable.
   - professional captions.
   - before screenshot before after screenshot.

4. Secure page should remain slim and professional:
   - headline.
   - main finding.
   - proof points.
   - business impact.
   - verification plan.
   - PDF preview/download.
   - CTA.

5. Database should stay slim:
   - PDF/OG/secure page fields only.
   - no raw email/LinkedIn copy unless intentionally added.

6. README should be updated with every future patch.

---

## 13. Safe Update Protocol for Future ChatGPT/Developers

When updating this project:

1. Read this README first.
2. Ask for or inspect only the files relevant to the problem.
3. Do not rewrite unrelated files.
4. Preserve existing behavior unless the user clearly asks for a change.
5. For Python:
   - run `python -m py_compile file.py` on changed files.
6. For Next.js/TypeScript:
   - run `npm run build` in the user project after replacing files.
7. Always include:
   - changed files.
   - README update.
   - replace instructions.
   - test checklist.
8. Do not claim full build success unless actually run in the project.
9. Be honest if only syntax-level checks were possible.
10. Never delete:
   - `.env`
   - `.venv`
   - `audits/`
   - `backup/`
   - `audit_original_backup.py`

---

## 14. Quick Start Commands

### Python backend

From `python-backend/`:

```bash
python audit.py
```

Alternative:

```bash
uvicorn audit:app --host 0.0.0.0 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

### Next.js dashboard

```bash
npm run dev
```

Build check:

```bash
npm run build
```

---

## 15. What a New ChatGPT Chat Should Do With This README

When this README is uploaded to a new chat:

1. Treat this README as the project map/history.
2. Ask for latest exact files related to the requested problem.
3. Do not guess hidden code.
4. Do not change unrelated systems.
5. Keep updates small and safe.
6. Return a zip/direct files plus updated `PROJECT_CONTEXT_README.md`.
7. Keep email/LinkedIn copy out of Firestore unless the user explicitly asks to save it.
8. Preserve evidence-safe wording.
9. Preserve adaptive PDF pagination.

---

## 16. Source Notes

This master README consolidates:
- the modular Python backend README,
- the email automation + secure report system README,
- the default Next.js README context,
- and version history/decisions from v18.3 through v18.45.

If this README conflicts with current source code, the current source code wins. Inspect the latest file before making code changes.
