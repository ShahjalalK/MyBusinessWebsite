# TrackFlow Pro — MASTER PROJECT CONTEXT README

Version: v23.21-open-prefetch-fix-and-zip-handoff
Last updated: 2026-06-04
Purpose: Upload this single README in a new ChatGPT chat so the assistant/developer can quickly understand the full TrackFlow Pro project, where each file lives, which files are connected, and what to update for each problem.

---

## Current Critical Context — Read This First

This README is the main handoff document for TrackFlow Pro. When a new assistant/developer is asked to fix a bug, they should first identify the feature area, then request only the connected files listed here. Do not ask for the whole project unless the issue crosses many modules.

Current system priorities:

```text
1. Keep client-facing secure pages professional, English-only, evidence-safe, and non-accusatory.
2. Keep Firestore slim; do not store chat transcripts or full outreach copy in audit_reports.
3. Store secure-page chat activity in Supabase only when configured.
4. Dashboard Chat Insights should be simple for sales/follow-up decisions, not highly technical.
5. Secure report PDF preview/download should feel premium and should not navigate the client away during download.
6. Same secure-page visitor should stay as one visitor/session across multiple questions in the same browser.
7. Different browser/device without login/contact identity may be a different visitor.
8. Avoid touching the huge catch-all route unless the bug actually belongs there.
9. Email open/click/reply/follow-up state remains Firestore source-of-truth; Google Sheet is only pipeline/review/routing.
10. Self-hosted email open pixels are the primary source for open_count; Brevo opened webhooks are diagnostic unless intentionally enabled.
11. For email tracking bugs, first inspect public tracking URL, lead/message identity, provider image-proxy ignore rules, and dashboard cache separately.
12. Evidence videos are optional high-value lead assets; they must remain browser-visible, evidence-safe, and stored as YouTube/metadata links rather than video files in Firestore.
```

---


## Latest Critical Update — v23.21 Email Open Tracking 3-Second Brevo Prefetch Fix + ZIP Handoff Rule

This update documents the confirmed fix for false instant open counts caused by Brevo image-proxy prefetch shortly after manual email sends. It also records the required file-packaging style for future assistants.

### Confirmed open-tracking behavior after testing

Observed logs showed this false-open pattern:

```text
/api/trackflow/track/open
userAgent = Brevo/1.0 (redirection-images...)
leadFound = true
internalTestRecipient = false
secondsAfterSent = 3
currentOpenCount = 0
incrementedOpen = true
```

The email had not been opened by the operator, so this was treated as a fast Brevo image-proxy prefetch, not a meaningful recipient open. A separate Gmail test showed correct behavior: no open count immediately after send, then a later open was counted when the email was actually opened around 268 seconds after send.

Final intended rule:

```text
Brevo redirection-images hit at 0–3 seconds after send
→ ignore as fast provider prefetch and do not increment open_count.

Brevo redirection-images hit after 3 seconds
→ allow normal open counting, because real Gmail opens may also arrive through Brevo image proxy.

After one open is counted for the lead/message
→ keep the existing 4-hour dedupe window so repeat opens do not increase open_count repeatedly.
```

The existing dedupe value seen in logs is:

```text
dedupeWindowMs = 14400000
14400000 ms = 4 hours
```

### Stable env after this fix

Use this stable value:

```env
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
```

Do not use `30` as the stable value because it can hide real early recipient opens. Do not use `0` if fast Brevo prefetch is causing instant false opens.

Recommended stable email tracking env:

```env
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
TRACKFLOW_APP_URL=https://trackflowpro.com
BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=false
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
STORE_OPEN_TRACKING_DEBUG=true
TRACKFLOW_DEBUG_EMAIL_FLOW=false
STORE_LOW_VALUE_EMAIL_EVENTS=false
```

Temporary debug only:

```env
TRACKFLOW_DEBUG_EMAIL_FLOW=true
STORE_LOW_VALUE_EMAIL_EVENTS=true
COUNT_INTERNAL_TEST_OPENS=true
WEBHOOK_OPEN_DEDUPE_MINUTES=1
```

Do not leave `COUNT_INTERNAL_TEST_OPENS=true` enabled in production.

### Implementation notes for future assistants

The preferred implementation is in the Vercel/email automation catch-all route where the self-hosted open pixel is handled:

```text
app/api/trackflow/[...action]/route.ts
```

The helper behavior should be:

```text
isBrevoImageProxyOpenRequest(req)
→ true only when user-agent contains Brevo/1.0 and redirection-images/image.

providerImageProxyFastOpenWindowSeconds()
→ default 3 seconds, configurable with IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS.

shouldIgnoreProviderImageProxyOpen(req, secondsAfterSent)
→ ignore only when Brevo image proxy hit occurs inside the configured 0–3 second fast-prefetch window.
```

Do not modify the 4-hour open dedupe logic unless a separate bug proves it is wrong.

### Required ZIP handoff format for future code patches

When a future assistant/developer returns patched files, they must package the ZIP using exact project-relative paths so the user can extract/copy the folders into the project root and automatically replace the intended files.

Correct ZIP layout example:

```text
trackflow-some-fix.zip
└── app/
    └── api/
        └── trackflow/
            └── [...action]/
                └── route.ts
```

For multiple files, preserve every exact path:

```text
trackflow-some-fix.zip
├── app/api/trackflow/[...action]/route.ts
├── lib/trackflow-email/email-events.ts
└── app/admin/dashboard/LeadsPanel.tsx
```

Rules:

```text
1. Do not put replacement files only at ZIP root as route.updated.ts, LeadsPanel.updated.tsx, etc.
2. Use the real project filename, for example route.ts, not route.updated.ts.
3. Preserve dynamic route folder names exactly, including brackets: [...action].
4. Include only files that are intentionally changed.
5. Add a small README_FIX.txt in the ZIP listing changed files, env changes, and test steps.
6. Mention whether the patch targets Localhost/Python dashboard, Vercel/email automation, or both.
7. After copy/replace, run npm run lint and npm run build where possible.
```

For this v23.21 fix, the replacement ZIP should contain:

```text
app/api/trackflow/[...action]/route.ts
README_FIX.txt
```

If the README itself is updated, include it at the project root:

```text
PROJECT_CONTEXT_README.md
```

---


## Latest Critical Update — v23.10 Email Open Tracking Stabilization, Brevo Image Proxy, Dashboard Counts

This section documents the most recent email-open tracking debugging and should be read together with the v23.00 token/storage/source-handoff rules below.

### Current open tracking source-of-truth

Email open/click tracking now depends on the Vercel/email automation app and Firestore lead documents.

Correct flow:

```text
Send Email / scheduled send / Sheet-selected send
→ email HTML receives TrackFlow self-hosted open pixel
→ pixel URL points to public app base URL
→ /api/trackflow/track/open resolves lead/message/tracking identity
→ Firestore outreach lead updates open_count, firstOpenedAt, lastOpenedAt, lastEngagedAt, nextFollowup*
→ dashboard reads cached/refreshed Firestore lead state
```

Important rule:

```text
Self-hosted TrackFlow pixel is the primary source for open_count.
Brevo "opened" webhooks are provider diagnostics by default.
Do not turn Brevo webhook opens into automation counts unless intentionally testing that behavior.
```

Recommended default:

```env
BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=false
```

Only set this to `true` if you intentionally want provider-level Brevo opens to increment `open_count`, knowing that provider image proxy behavior can be noisy.

### Public app URL rule

The email open pixel is generated from the app base URL. The URL must be public, not localhost.

Required production/stable env:

```env
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
TRACKFLOW_APP_URL=https://trackflowpro.com
```

Localhost warning:

```text
If NEXT_PUBLIC_APP_URL=http://localhost:3000, Gmail/Brevo/prospect browsers cannot hit the tracking route.
Old emails keep the old pixel URL already embedded in their HTML.
After changing env, redeploy and send a new email before testing.
```

### Brevo image proxy fast-prefetch rule

Recent bug found:

```text
Email sent successfully.
Tracking pixel route was hit.
leadFound=true and internalTestRecipient=false.
But open_count stayed 0.
Logs showed:
ignoredReason = brevo_redirection_image_proxy_fast_prefetch
userAgent = Brevo/1.0 (redirection-images...)
secondsAfterSent = 21
fastOpenWindowSeconds = 30
```

Cause:

```text
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=30 caused a real first open to be ignored when the email was opened quickly after sending.
After that, image caching can prevent another useful open request from reaching the route.
```

Current recommended stable env:

```env
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
```

Confirmed refined behavior after June 4, 2026 testing:

```text
Brevo/1.0 redirection-images hit within 0–3 seconds after send
→ treat as fast provider image prefetch and do not increment open_count.

Brevo/1.0 redirection-images hit after 3 seconds
→ allow normal open handling, because real Gmail/recipient opens can also pass through Brevo image proxy.

After one meaningful open is counted
→ the existing 4-hour open dedupe window prevents repeat open_count increments for the same lead/message.
```

Important: do not ignore all Brevo image-proxy requests. Only ignore the first 0–3 second fast-prefetch hit when `currentOpenCount=0`. A later Brevo image-proxy request can be a real recipient open.

### Duplicate open / meaningful open rule

The system is not designed to count every image request as a new open.

Correct behavior:

```text
Same lead/message opened once
→ open_count increments.

Same lead/message opened again inside the open dedupe window
→ duplicate open is ignored to protect Firestore writes.

Same recipient receives a new email with a new leadId/messageId/trackingId
→ should still be able to count a new open if it is not ignored by provider proxy/internal-test rules.
```

Do not diagnose "same email address was blocked forever" unless the logs prove a suppression/cooldown rule. Same recipient email alone should not prevent a later lead/message from being counted.

Useful log interpretation:

```text
self_hosted_open_resolved + leadFound=true
→ route and identity resolution worked.

self_hosted_open_received + internalTestRecipient=true
→ internal/test recipient rule blocked the count.

self_hosted_open_ignored_provider_image_proxy
→ provider proxy fast-prefetch rule blocked the count.

self_hosted_open_before_increment
→ open is about to update Firestore.

self_hosted_engagement_after_firestore_update + incrementedOpen=true
→ Firestore update worked; if dashboard does not show it, check dashboard cache/refresh/display.

No self_hosted_open_resolved log at all
→ pixel route was not hit; check NEXT_PUBLIC_APP_URL, old sent email HTML, image blocking, or deployment.
```

### Debug env policy

Production/stable defaults:

```env
TRACKFLOW_DEBUG_EMAIL_FLOW=false
STORE_LOW_VALUE_EMAIL_EVENTS=false
STORE_OPEN_TRACKING_DEBUG=true
BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=false
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
```

Temporary debug only:

```env
TRACKFLOW_DEBUG_EMAIL_FLOW=true
STORE_LOW_VALUE_EMAIL_EVENTS=true
COUNT_INTERNAL_TEST_OPENS=true
WEBHOOK_OPEN_DEDUPE_MINUTES=1
```

Important decisions:

```text
TRACKFLOW_DEBUG_EMAIL_FLOW=false only disables server console debug logs. It does not stop open_count/click_count.
STORE_LOW_VALUE_EMAIL_EVENTS=false reduces Firestore writes/storage. It should not stop lead-level open_count/click_count updates.
COUNT_INTERNAL_TEST_OPENS=true is only for testing; do not leave it enabled in production if sender/main inbox opens should not count.
```

### Files recently inspected/connected for email open tracking

Primary files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-email/email-events.ts
lib/firebase-admin.ts
app/admin/dashboard/page.tsx
app/admin/dashboard/OverviewPanel.tsx
app/admin/dashboard/LeadsPanel.tsx
app/admin/dashboard/types.ts
app/stores/useLeadStore.ts
```

If tracking pixel injection, composer send payload, or sheet-selected send context is suspected, also ask for:

```text
app/admin/dashboard/OutreachPanel.tsx
app/admin/dashboard/utils.ts
app/admin/dashboard/SheetQueuePanel.tsx
app/admin/dashboard/sheet-readiness.ts
lib/senders.ts
```

Use these files for:

```text
email open count not increasing
same recipient receives another email but open_count stays 0
self_hosted_open_resolved appears but open_count does not increment
Brevo redirection-images user-agent is seen in open logs
dashboard open count does not update after Firestore increment
manual send works but Sheet-selected send does not
trackingId / leadId / messageId mapping looks wrong
```

---


---


## Latest Planned Update — v23.20 Evidence Video Walkthrough, YouTube Unlisted Hosting, Secure Page Preview

This section documents the next planned premium feature: optional browser-side evidence videos for high-quality/problem-heavy prospects.

### Product goal

Evidence video is a visual trust layer on top of the existing PDF and secure report page.

Correct positioning:

```text
PDF report
→ written browser-visible tracking review

Secure page
→ premium client experience, PDF preview/download, chatbot, CTA, and tracking analytics

Evidence video
→ short visual browser-side walkthrough showing what was reviewed and what may need verification
```

Important rule:

```text
The evidence video is NOT 100% account-level proof.
It follows the same evidence-safety rule as the PDF:
browser-visible evidence can show tags, requests, screenshots, CTA/form/phone/booking paths, and visible tracking signals.
Final confirmation still requires GA4/GTM/Google Ads/CRM/server/call-tracking account access.
```

Do not say in video or page copy:

```text
Your tracking is broken.
Your ads are wasting money.
Your conversions are not working.
This proves Google Ads is not recording leads.
```

Safe wording:

```text
This short browser-side walkthrough shows what was visible from the outside during the review.
Some signals were visible, and some paths may be worth verifying inside GA4, GTM, Google Ads, or the relevant platform.
Final confirmation requires account/server access.
```

### When to create evidence videos

Do NOT generate a video for every audit by default.

Recommended workflow:

```text
Python search
→ Google Ads Transparency check
→ normal Python audit
→ Gemini-polished PDF/email/report
→ secure page created
→ operator selects only high-quality/problem-heavy leads
→ Create/Add Evidence Video
→ YouTube Unlisted URL saved to Firestore report metadata
→ secure page shows a premium video preview card
```

Use video only when:

```text
Ads appear to be running
Business looks legitimate and high-value
Audit/report quality is strong
There is a clear browser-visible verification opportunity
The secure page and PDF are already professional
Decision maker/contact path exists
```

Avoid video when:

```text
Audit evidence is weak or generic
Screenshot/path quality is poor
Report copy feels too uncertain
Prospect is low value
Video would require risky form submission or sensitive user data
```

### Recommended video format

First version should be simple and fast:

```text
Duration: 30–60 seconds
Best target: 30–45 seconds
Resolution: 1280×720
FPS: 15–24 fps
Target size if locally created: under 15 MB before YouTube upload
Voice: optional; first version can be no-voice with clear on-screen labels
Style: browser view + clean evidence panel + safe final disclaimer
```

Suggested sequence:

```text
1. Open the prospect website.
2. Show the main conversion path: phone, form, booking, quote, cart/checkout, or contact CTA.
3. Show a clean custom evidence panel, not necessarily real Chrome DevTools.
4. Highlight visible signals:
   ✅ GTM container visible
   ✅ GA4 request visible
   ✅ Meta Pixel pageview visible
   ⚠️ Google Ads conversion request not clearly observed from this browser-side review
   ⚠️ Final confirmation requires account access
5. End with a safe verification next step.
```

Recommended video page title/label:

```text
Short browser-side evidence walkthrough
```

Recommended secure page helper copy:

```text
This short video shows what was visible from the outside during the tracking review. It is not an account-level audit, but it can help you quickly understand what may need verification inside GA4, GTM, Google Ads, or the relevant tracking platform.
```

### YouTube hosting decision

Use YouTube to avoid storing/streaming video files from TrackFlow.

Important privacy rule:

```text
Use YouTube Unlisted, not YouTube Private.
Private videos usually cannot be embedded for normal prospects unless they are invited.
Unlisted videos are not public on the channel/search in the normal way, but anyone with the link can view them.
```

Recommended YouTube settings:

```text
Visibility: Unlisted
Embedding: Allowed
Comments: Disabled if possible
Title: Browser-side tracking review walkthrough for {Company}
Description: Keep short and evidence-safe
Do not include sensitive claims, credentials, private client data, or raw account screenshots
```

Secure page should embed with privacy-enhanced domain when possible:

```text
https://www.youtube-nocookie.com/embed/{VIDEO_ID}
```

Do not send the raw YouTube link as the primary outreach link. Send the secure report page link and mention that a short evidence walkthrough is included inside the page.

### Firestore storage rule

Do not store video files in Firestore.

Save only small metadata on:

```text
audit_reports/{reportToken}
```

Recommended fields:

```ts
evidenceVideoProvider: "youtube"
evidenceVideoUrl: "https://youtu.be/VIDEO_ID"
evidenceVideoId: "VIDEO_ID"
evidenceVideoEmbedUrl: "https://www.youtube-nocookie.com/embed/VIDEO_ID"
evidenceVideoVisibility: "unlisted"
evidenceVideoTitle: "Short browser-side evidence walkthrough"
evidenceVideoStatus: "active"
evidenceVideoAddedAt: serverTimestamp()
evidenceVideoUpdatedAt: serverTimestamp()
```

Optional fields:

```ts
evidenceVideoThumbnailUrl
evidenceVideoDurationSeconds
evidenceVideoNotes
evidenceVideoAddedBy
evidenceVideoSource: "manual_youtube_url" | "python_generated" | "external"
```

Remove/disable behavior:

```text
Remove Evidence Video
→ do not delete the YouTube video automatically
→ remove or mark inactive in Firestore:
   evidenceVideoStatus = "removed"
   evidenceVideoRemovedAt = serverTimestamp()
```

### Secure page UX

If a report has an active evidence video, show a premium card on the secure report page.

Preferred placement:

```text
Hero / review summary
→ Evidence video card
→ PDF preview/download
→ findings/recommendations
→ chatbot
→ booking/contact CTA
```

Do not make video replace the PDF. Video is a visual helper; PDF remains the detailed report.

Suggested UI elements:

```text
Card title: Watch a short browser-side evidence walkthrough
Subtext: This video shows what was visible from the outside during the review. Final confirmation requires account access.
Button/fallback: Open video
Embed: YouTube iframe using youtube-nocookie.com
Mobile: show a responsive embed or a lightweight preview/open button
```

### Engagement tracking rule

First version only needs simple TrackFlow events:

```text
video_card_viewed
video_open_clicked
video_embed_visible
```

Do not over-engineer YouTube watch-time tracking in the first version.

If advanced tracking is needed later, use the YouTube IFrame Player API to detect play/pause/progress, but keep it optional because third-party iframe behavior can be blocked by browsers.

### Implementation approach

There are two separate possible implementation paths.

#### Path A — Manual YouTube link first, fastest

Operator creates video manually or using a separate tool, uploads to YouTube Unlisted, then adds the URL in TrackFlow dashboard.

Dashboard flow:

```text
Open report/lead/secure page record
→ Add Evidence Video
→ paste YouTube URL
→ validate/extract video ID
→ save metadata to Firestore audit_reports/{token}
→ secure page refresh shows the video card
```

This is the recommended first implementation.

#### Path B — Python-generated video later

Python/Playwright can generate a browser-side evidence video later, but it should be optional and only for selected leads.

Recommended architecture:

```text
python-backend/trackflow_modules/video_evidence.py
→ optional selected-lead video generation
→ uses existing audit/evidence data
→ records browser walkthrough or builds report-based evidence video
→ operator uploads final video to YouTube Unlisted manually first
```

Do not make Python generate videos for every audit by default. It will slow audits, increase CPU/storage usage, and create operational pressure.

### File request matrix for evidence video feature

#### Manual YouTube URL add/update/remove

Ask for:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-api/reports.ts
lib/trackflow-api/report-normalizers.ts
lib/firebase-admin.ts
app/admin/dashboard/page.tsx
app/admin/dashboard/types.ts
```

Ask additionally depending on where the button is placed:

```text
app/admin/dashboard/LeadsPanel.tsx
app/admin/dashboard/SheetQueuePanel.tsx
app/admin/dashboard/CleanupPanel.tsx
app/stores/useLeadStore.ts
```

Use this for:

```text
Add Evidence Video button
Save YouTube URL to report
Remove Evidence Video
Validate/extract YouTube video ID
Dashboard preview/open video link
```

#### Secure page video preview/embed

Ask for:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
lib/trackflow-api/reports.ts
lib/trackflow-api/report-normalizers.ts
```

Ask for route only if report metadata is not loading:

```text
app/api/trackflow/[...action]/route.ts
```

Use this for:

```text
secure page does not show video
YouTube embed not responsive
Open video fallback missing
video copy is not evidence-safe
mobile layout problem
```

#### Python-generated video later

Ask for Python/local audit files:

```text
python-backend/audit.py
python-backend/trackflow_modules/evidence_capture.py
python-backend/trackflow_modules/reports.py
python-backend/trackflow_modules/gemini_client.py
python-backend/trackflow_modules/video_evidence.py
```

If local dashboard starts the video job, also ask for:

```text
app/components/LeadList.tsx
app/components/LeadList/reportHelpers.ts
app/types/audit.ts
app/api/export/blob-reports/route.ts
```

Use this for:

```text
Create Evidence Video from audit data
browser walkthrough recording
custom evidence panel generation
video job status
attach generated video to secure report
```

### Future assistant rules for this feature

```text
1. Do not use YouTube Private for secure page preview; use Unlisted.
2. Do not store video bytes in Firestore.
3. Do not replace PDF with video; video is an additional trust layer.
4. Do not claim account-level proof from the video.
5. Do not create videos for every audit by default.
6. Start with manual YouTube URL input before building Python video generation.
7. Secure page should use the report URL as the primary outreach link, not the raw YouTube URL.
8. Keep all client-facing video labels and copy professional, English-only, evidence-safe, and non-accusatory.
```

---

## Latest Critical Update — v23.00 Token-Based Cleanup, B2 PDF Re-upload, Sheet Source Management

This section is the current highest-priority handoff. It overrides older notes below where they conflict.

### Current architecture split: Localhost project vs Vercel project

TrackFlow Pro now has two connected Next.js environments that must not be mixed:

```text
A) Localhost / Python audit dashboard project
→ runs beside the Python FastAPI audit backend
→ creates audits, polishes with Gemini, fetches reviewed PDFs from Python
→ uploads PDFs to private Backblaze B2
→ uploads OG/LinkedIn preview images to Vercel Blob
→ registers secure reports on the Vercel report-hosting app
→ updates Google Sheet pipeline rows

B) Vercel / email automation + report hosting project
→ hosts /tracking-review/{domainSlug}/{token}
→ streams PDF preview/download from private B2 through internal routes
→ tracks report views, PDF downloads, CTA clicks
→ manages email outreach, follow-up, cleanup, contact memory, suppression
→ uses Firestore as source-of-truth for tracking/follow-up state
```

Important rule:

```text
Do not blindly replace the same-named b2.ts file in both projects.
Localhost b2.ts and Vercel b2.ts may be different.
Localhost b2.ts focuses on upload/re-upload from the audit dashboard.
Vercel b2.ts may include stronger read/retry logic for secure-page PDF preview/download.
```

When asking for files, always ask first:

```text
Is this issue happening in:
1. Localhost audit dashboard / Python export flow?
2. Vercel email automation / secure report hosting flow?
3. Both?
```

### Token model: reportToken is the master key

The system should be token-based, not email-based.

Intended behavior:

```text
Same website/domain audited again
→ reuse the same report token if possible
→ update/re-register the secure report
→ upload the latest PDF under the same token path
→ update the Google Sheet row if Sheet sync is enabled

If no prior token/domain index is found
→ create a new stable token from the normalized domain when possible
→ random token only as last fallback
```

Token priority:

```text
1. Explicit reportToken from request/body/lead/audit
2. Existing report token saved on lead/audit/report metadata
3. Vercel Firestore domain index / audit_report_domains
4. Domain-stable token generated from normalized domain + secret
5. Random token only when domain is missing or unsafe
```

Stable token warning:

```text
Do not change BLOB_REPORT_TOKEN_SECRET / REPORT_REGISTER_SECRET after production use.
Changing the secret can make the same domain generate a different stable token.
```

### Hybrid storage rule

Current storage is:

```text
PDF report files
→ private Backblaze B2

OG / LinkedIn preview image
→ public Vercel Blob

Secure report metadata
→ Firestore audit_reports/{token}

Domain lookup index
→ Firestore audit_report_domains/{normalizedDomain or domainSlug}

Google Sheet
→ pipeline/review/source routing only

Email open/click/reply/follow-up state
→ Firestore outreach leads/events

Secure-page chat history
→ Supabase when configured
```

Client-facing links must use internal routes:

```text
Preview:
 /api/trackflow/reports/preview?token=...

Download:
 /api/trackflow/reports/download?token=...

Secure page:
 /tracking-review/{domainSlug}/{token}
```

Never expose private B2 object URLs to prospects.

### B2 PDF re-upload and file-size rule

Recent issue fixed:

```text
Local PDF download was around 800 KB
B2 showed around 4.9 MB and audit-report.pdf (7)
```

Important understanding:

```text
Backblaze UI showing audit-report.pdf (7) usually means multiple versions of the same object key.
It does not necessarily mean B2 merged 7 PDFs into one file.
If B2 upload size is large, first check the source PDF bytes fetched from Python.
```

Current intended local Create Secure Page flow:

```text
Create Secure Page
→ fetch fresh reviewed PDF from Python
→ use regenerate/fresh parameters
→ log source_pdf_fetched with sourcePdfBytes
→ purge previous B2 versions for the same key when enabled
→ upload one fresh PDF to B2
→ log b2_pdf_uploaded with uploaded size/key
→ upload OG card to Vercel Blob
→ register secure report on Vercel
→ optionally sync Google Sheet
```

Fresh PDF URL rule:

```text
Create Secure Page should fetch:
 /audit/pdf/{auditId}?regenerate=true&fresh=1&secure_page_upload=1&ai=1
```

Debug log rule:

```text
Look for:
source_pdf_fetched
b2_pdf_uploaded
preview_blob_uploaded
register_response
sheet_sync_result or sheetUpdated
```

If `source_pdf_fetched` already shows a large PDF, the issue is Python PDF generation/cache/assets, not B2.

Relevant ENV:

```env
B2_PURGE_PDF_VERSIONS_BEFORE_UPLOAD=true
B2_REQUIRE_VERSION_PURGE_BEFORE_UPLOAD=false
```

If `B2_REQUIRE_VERSION_PURGE_BEFORE_UPLOAD=true`, the B2 application key must be allowed to list/delete file versions.

### Cleanup rule: best-effort, token-first, no persistent cleanup_jobs by default

Cleanup must be token-first and best-effort.

Correct behavior:

```text
Google Sheet row missing
→ continue B2/Blob/Supabase/Firestore/email/lead cleanup

B2 PDF missing
→ treat as already removed and continue other cleanup

Vercel Blob preview missing
→ treat as already removed and continue other cleanup

Firestore audit_reports document missing
→ use token/domain/sheet/url hints where possible and continue cleanup

Everything missing
→ return already-cleaned / nothing-found response, not a crash
```

Current cleanup services:

```text
Backblaze B2 PDF
Vercel Blob OG/preview image
Supabase report chat rows
Firestore audit_reports/{token}
Firestore audit_report_domains index
Firestore report-linked email events
Google Sheet row by Report Token
Linked outreach leads depending on leadMode
Contact memory / footprint only when intentionally kept
```

Google Sheet cleanup rule:

```text
Delete All Data
→ Sheet row should be deleted/cleaned too
→ Keep Footprint does not mean keep the Google Sheet row
→ Keep Footprint only means keep a tiny contact-safety memory if requested
```

`cleanup_jobs` rule:

```text
By default, do NOT write cleanup_jobs documents to Firestore.
Firebase limits are small, and the operator can manually inspect cleanup responses/logs.
```

Persistent cleanup logs can be enabled only intentionally:

```env
TRACKFLOW_WRITE_CLEANUP_JOBS=true
# or
ENABLE_CLEANUP_JOBS=true
```

If these ENV values are not set, cleanup should run and return steps to the dashboard/API response, but should not create a `cleanup_jobs` collection.

If an old README section says `cleanup_jobs/{jobId}` always records real cleanup runs, that is outdated. Current default is disabled.

### Google Sheet source management

Google Sheet is not the automation source-of-truth. It is a pipeline/review/routing layer.

Explicit source columns now matter:

```text
Source Type
Outreach Channel
Lead Source
Audit Source
Source Context
Email Outreach Allowed
LinkedIn Outreach Allowed
```

Routing examples:

```text
Source Type = search
Outreach Channel = email
Lead Source = python_search
→ Email workflow

Source Type = linkedin
Outreach Channel = linkedin
Lead Source = linkedin_audit
→ LinkedIn workflow
```

Do not classify a row as manual just because:

```text
Email Source = Manual / verified by user
```

That means the email address was manually verified, not that the audit source is manual.

### Sheet → Send Email relation model

A Sheet audit/report can be used to send to multiple recipients.

Composer rule:

```text
When opening from Sheet row:
☑ Keep under this Sheet audit/report should be auto-checked.
```

If checked:

```text
Original Sheet email
→ Sheet Primary

Changed recipient email
→ Sheet Additional
```

If unchecked:

```text
Manual + Report
→ can use the same report URL/token
→ should not be deleted automatically by Sheet/report cleanup
```

Lead tab source roles:

```text
Manual
Manual + Report
Sheet Primary
Sheet Additional
Test
```

Delete rule:

```text
Sheet Primary / Sheet Additional
→ manage/delete through Cleanup/report token flow

Manual / Manual + Report
→ can be managed from Lead tab
```

### Email copy source-of-truth

For audit outreach email copy:

```text
Python/Gemini polished email = source of truth
Next.js fallback email = should not be exported/sent by default
```

Sheet export should prefer Python fields such as:

```text
audit.emailCopy
audit.email_copy
audit.emailDraft
audit.email_draft
audit.outreachCopy.emailCopy
audit.private_report_copy.emailCopy
audit.privateReportCopy.emailCopy
audit.report_overrides.emailCopy
```

Avoid using old/fallback sources as primary:

```text
lead.subject
lead.emailSubject
lead.message
audit.nextjs_payload.email_brief
old Next.js generated fallback body
```

Emergency fallback should only be enabled intentionally:

```env
ALLOW_LEGACY_NEXTJS_EMAIL_FALLBACK_FOR_SHEET=true
```

### Known local Sheet route bug

If secure page registration succeeds but final export fails with:

```text
ReferenceError: lowerSheetText is not defined
at getSourceMetadata (app/api/export/sheet/route.ts)
```

Then update local:

```text
app/api/export/sheet/route.ts
```

It must include helper functions used by source metadata logic:

```text
lowerSheetText(...)
isValidEmailAddress(...)
sourceBooleanCell(...)
```

After replacing this route, restart Next.js dev server:

```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

### Future assistant operating rules

When a future assistant receives this README:

```text
1. First identify whether the issue is Localhost/Python dashboard, Vercel/report hosting, or both.
2. Ask for only the connected files listed in the file request matrix.
3. Do not ask for the entire project unless the issue crosses multiple systems.
4. Do not replace Vercel b2.ts with localhost b2.ts unless explicitly proven they are the same target file.
5. Do not save full email copy, LinkedIn copy, or raw Gemini output to Firestore.
6. Do not re-enable cleanup_jobs unless the user explicitly wants persistent cleanup logs.
7. Always preserve evidence-safe client language.
8. Always avoid TypeScript errors; if patching TS/TSX, check imports, missing helpers, and type aliases.
```

---

## Updated File Request Matrix — v23.00

### A) Localhost Create Secure Page / B2 upload / Sheet sync issue

Ask for:

```text
app/api/export/blob-reports/route.ts
app/api/export/sheet/route.ts
app/components/LeadList.tsx
app/components/LeadList/reportHelpers.ts
app/components/LeadList/types.ts
app/types/audit.ts
lib/trackflow-storage/b2.ts
```

If PDF source size, regeneration, or PDF content is wrong, also ask for Python files:

```text
python-backend/audit.py
python-backend/trackflow_modules/reports.py
python-backend/trackflow_modules/evidence_capture.py
python-backend/trackflow_modules/gemini_client.py
python-backend/trackflow_modules/email_copy.py
```

Use this for:

```text
Create Secure Page fails
B2 PDF not uploaded
B2 PDF size is too large
audit-report.pdf has many versions
Google Sheet sync fails after secure page register
lowerSheetText error
Python-polished email not saved to Sheet
same website creates a new token unexpectedly
```

### B) Vercel secure report preview/download issue

Ask for:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-storage/b2.ts
lib/trackflow-api/reports.ts
lib/trackflow-api/report-normalizers.ts
```

Use this for:

```text
secure page loads but PDF preview/download fails
B2 read timeout
502 from preview/download
report metadata exists but PDF does not stream
PDF download route shows JSON or error
```

### C) Cleanup issue

Ask for Vercel/email automation files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
lib/trackflow-cleanup/sheet-cleanup.ts
lib/trackflow-storage/b2.ts
lib/supabase-admin.ts
lib/firebase-admin.ts
lib/trackflow-email/email-events.ts
lib/trackflow-email/contact-memory.ts
```

Ask for dashboard files if UI/payload is involved:

```text
app/admin/dashboard/page.tsx
app/admin/dashboard/CleanupPanel.tsx
app/admin/dashboard/types.ts
```

Use this for:

```text
cleanup does not delete Google Sheet row
cleanup deletes Firestore but leaves B2/Blob
cleanup fails when one storage object is missing
cleanup creates cleanup_jobs unexpectedly
keep footprint/no footprint behavior is wrong
report cleanup deletes manual+report leads incorrectly
```


### D) Email send / open tracking / dashboard open-count issue

Ask for Vercel/email automation files first:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-email/email-events.ts
lib/firebase-admin.ts
app/admin/dashboard/page.tsx
app/admin/dashboard/OverviewPanel.tsx
app/admin/dashboard/LeadsPanel.tsx
app/admin/dashboard/types.ts
app/stores/useLeadStore.ts
```

Ask additionally if the issue starts from the Send Email composer, Sheet-selected send, or tracking-pixel injection:

```text
app/admin/dashboard/OutreachPanel.tsx
app/admin/dashboard/utils.ts
app/admin/dashboard/SheetQueuePanel.tsx
app/admin/dashboard/sheet-readiness.ts
lib/senders.ts
```

Use this for:

```text
email open count does not increase
click count does not increase
manual send open count works but Sheet-selected send does not
same recipient gets a new email but the new open does not count
self_hosted_open_resolved appears in logs but open_count stays 0
self_hosted_open_ignored_provider_image_proxy appears
ignoredReason = brevo_redirection_image_proxy_fast_prefetch
dashboard does not refresh after incrementedOpen=true
leadFound=false or trackingId/messageId/leadId mismatch
```

First checks:

```text
1. Confirm NEXT_PUBLIC_APP_URL / TRACKFLOW_APP_URL is the public Vercel/custom domain, not localhost.
2. Confirm this is a newly sent email after env changes.
3. Confirm self_hosted_open_resolved appears in logs.
4. If leadFound=true and internalTestRecipient=false but ignoredReason=brevo_redirection_image_proxy_fast_prefetch, confirm the hit happened within the 0–3 second Brevo prefetch window. Keep IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3 unless testing proves a smaller window is safer.
5. If incrementedOpen=true but dashboard still shows 0, refresh lead cache and inspect LeadsPanel/OverviewPanel/useLeadStore.
6. If no open log appears, inspect pixel injection, email HTML, appBaseUrl, deployment, and image blocking.
```

Recommended stable env:

```env
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
TRACKFLOW_APP_URL=https://trackflowpro.com
BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=false
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
STORE_OPEN_TRACKING_DEBUG=true
TRACKFLOW_DEBUG_EMAIL_FLOW=false
STORE_LOW_VALUE_EMAIL_EVENTS=false
```

Temporary debug env:

```env
TRACKFLOW_DEBUG_EMAIL_FLOW=true
STORE_LOW_VALUE_EMAIL_EVENTS=true
COUNT_INTERNAL_TEST_OPENS=true
WEBHOOK_OPEN_DEDUPE_MINUTES=1
```

Important interpretation:

```text
The system should not block future opens only because the same email address received a previous email.
Each new send should have its own lead/message/tracking identity.
The most recent confirmed false-open cause was a Brevo redirection-images hit within 0–3 seconds after send. The most recent missed-open cause was the old 30-second Brevo image proxy ignore rule.
```


### E) Sheet tab / Send Email / lead source relation issue

Ask for dashboard/email automation files:

```text
app/admin/dashboard/page.tsx
app/admin/dashboard/SheetQueuePanel.tsx
app/admin/dashboard/sheet-readiness.ts
app/admin/dashboard/OutreachPanel.tsx
app/admin/dashboard/LeadsPanel.tsx
app/admin/dashboard/types.ts
app/stores/useLeadStore.ts
```

Ask for local sheet/export files if source fields are missing in Google Sheet:

```text
app/api/export/sheet/route.ts
app/api/export/blob-reports/route.ts
app/components/LeadList.tsx
app/components/LeadList/types.ts
```

Use this for:

```text
Python Search vs LinkedIn Audit classification wrong
Source Unknown appears for new rows
same report sent to changed email is classified wrong
Sheet Primary / Sheet Additional / Manual + Report behavior wrong
Send Email composer checkbox behavior wrong
```

### F) Python/Gemini email/report copy issue

Ask for:

```text
python-backend/trackflow_modules/email_copy.py
python-backend/trackflow_modules/gemini_client.py
python-backend/trackflow_modules/reports.py
python-backend/audit.py
app/components/LeadDetailsModal/emailHelpers.ts
app/components/LeadList/reportHelpers.ts
app/api/export/sheet/route.ts
app/api/export/blob-reports/route.ts
```

Use this for:

```text
email copy is old Next.js fallback
generated email is too aggressive
email copy is not saved to Sheet
PDF wording is wrong
secure page wording mismatches PDF
Gemini invents evidence
```

### G) Manual/LinkedIn audit UI issue

Ask for:

```text
app/components/LeadList.tsx
app/components/LeadList/LinkedInAuditPanel.tsx
app/components/LeadList/LeadRow.tsx
app/components/LeadList/linkedinAuditOptions.ts
app/components/LeadList/leadHelpers.ts
app/components/LeadList/types.ts
```

Use this for:

```text
manual audit panel broken
primary goal / suggested focus wrong
LinkedIn audit source metadata missing
Create Secure Page button missing after manual audit
```

---

## Quick Debug Commands / Checks

### Localhost dashboard

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### Build checks

```powershell
npm run lint
npm run build
```

### Python backend

```powershell
python audit.py
```


### Email open tracking logs to check

```text
self_hosted_open_resolved
self_hosted_open_received
self_hosted_open_ignored_provider_image_proxy
self_hosted_open_before_increment
self_hosted_engagement_before_firestore_update
self_hosted_engagement_after_firestore_update
```

### Email open tracking env expectation

```env
NEXT_PUBLIC_APP_URL=https://trackflowpro.com
TRACKFLOW_APP_URL=https://trackflowpro.com
BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=false
IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3
STORE_OPEN_TRACKING_DEBUG=true
TRACKFLOW_DEBUG_EMAIL_FLOW=false
STORE_LOW_VALUE_EMAIL_EVENTS=false
```

Debug only:

```env
TRACKFLOW_DEBUG_EMAIL_FLOW=true
STORE_LOW_VALUE_EMAIL_EVENTS=true
COUNT_INTERNAL_TEST_OPENS=true
WEBHOOK_OPEN_DEDUPE_MINUTES=1
```

### Email open tracking decision tree

```text
No self_hosted_open_resolved log
→ pixel did not hit the public Vercel route
→ check NEXT_PUBLIC_APP_URL, appBaseUrl, deployment, old email HTML, image blocking

self_hosted_open_resolved but leadFound=false
→ route was hit but tracking identity did not resolve
→ check lid/trackingId/messageId/reportToken mapping and lead cleanup state

internalTestRecipient=true
→ sender/main inbox/test recipient was ignored
→ use a real external recipient or temporarily set COUNT_INTERNAL_TEST_OPENS=true

ignoredReason=brevo_redirection_image_proxy_fast_prefetch
→ Brevo image proxy fast-prefetch window ignored the open
→ keep IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS=3 and confirm it is only ignoring 0–3 second Brevo image-proxy hits

incrementedOpen=true
→ Firestore updated successfully
→ if dashboard still shows 0, refresh lead cache or inspect dashboard display/cache files
```




### Evidence video / YouTube secure page checks

```text
Manual first-version expectation:
→ Evidence video is uploaded to YouTube as Unlisted
→ TrackFlow stores only YouTube metadata in Firestore
→ Secure report page embeds youtube-nocookie.com iframe when active
→ Email/LinkedIn outreach sends the secure report link, not the raw YouTube link
```

Recommended Firestore report fields:

```text
evidenceVideoProvider
evidenceVideoUrl
evidenceVideoId
evidenceVideoEmbedUrl
evidenceVideoVisibility
evidenceVideoTitle
evidenceVideoStatus
evidenceVideoAddedAt
evidenceVideoUpdatedAt
```

Debug decision tree:

```text
Video does not show on secure page
→ check audit_reports/{token} evidenceVideoStatus="active" and evidenceVideoId exists

YouTube iframe fails
→ check video is Unlisted, not Private, and embedding is allowed

Dashboard saves URL but page does not update
→ check report normalizer passes evidenceVideo* fields to the secure page

Client cannot access video
→ check it is not Private and do not require Google account permission

Firestore size concern
→ confirm only metadata is stored, not video bytes
```


### Create Secure Page logs to check

```text
source_pdf_fetched
b2_pdf_uploaded
preview_blob_uploaded
register_outgoing_payload
register_response
sheetUpdated
sheetError
```

### B2 path pattern

```text
reports/{domainSlug}/{reportToken}/pdf/audit-report.pdf
```

### Vercel Blob OG image path pattern

```text
reports/{domainSlug}/{reportToken}/preview/og-card.jpg
```

### Google Sheet row delete expectation

```text
Cleanup with Delete All Data
→ Sheet row matching Report Token should be deleted
→ Preview/response should show google_sheet step
```

### cleanup_jobs expectation

```text
Default:
→ cleanup_jobs should NOT be created

Only when explicitly enabled:
TRACKFLOW_WRITE_CLEANUP_JOBS=true
or
ENABLE_CLEANUP_JOBS=true
```


## Latest Update — v22.00 Secure Report PDF Download Feedback + Chat Insights Stability

This update documents the recent secure-page chatbot, Chat Insights dashboard, Supabase, visitor/session, and PDF UX fixes.

Changed or recently connected files:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts
app/admin/dashboard/ChatInsightsPanel.tsx
app/admin/dashboard/page.tsx
app/admin/dashboard/types.ts
lib/trackflow-storage/b2.ts
app/api/trackflow/[...action]/route.ts
```

### Secure report PDF experience

Current intended behavior:

```text
PDF preview:
→ embedded inside the secure report page
→ premium card-style section
→ mobile shows a lighter note instead of forcing heavy iframe preview

Open PDF:
→ opens PDF in a new tab for users who want full browser PDF controls

Download PDF:
→ should NOT navigate the visitor away from the secure page
→ uses client-side fetch/blob download from the internal download route
→ button immediately shows a spinner and “Preparing secure PDF...”
→ status box tells the user the file is being prepared
→ after download starts, status says “Download started”
→ if automatic download fails, user sees a clear fallback message to use Open PDF
```

Important implementation note:

```text
The secure page should still use internal routes:
previewHref  = /api/trackflow/reports/preview?token=...
downloadHref = /api/trackflow/reports/download?token=...

Do not expose private B2 object URLs to the browser.
Do not replace the internal preview/download routes with /api/trackflow/report-chat.
```

When PDF download opens a new page/tab or shows JSON:

```text
First file to inspect:
app/tracking-review/[domainSlug]/[token]/page.tsx

Check:
- previewHref must be /api/trackflow/reports/preview?token=...
- downloadHref must be /api/trackflow/reports/download?token=...
- Download PDF should be handled on-page if using the premium download UX script
```

When PDF preview/download returns 502 or timeout:

```text
Ask for:
lib/trackflow-storage/b2.ts
app/api/trackflow/[...action]/route.ts

Reason:
The issue is usually B2 read/download timeout, retry behavior, or report PDF buffer resolution.
```

### Chat Insights dashboard

Current intended behavior:

```text
Admin Dashboard → Chat Insights
→ groups activity by website/report
→ each report group is collapsible/toggleable
→ each group contains visitor sessions
→ each visitor row shows country/device/browser/questions/PDF/review status
→ right panel shows only that selected visitor’s questions
→ assistant answers are hidden from the dashboard
→ Open report is available if the operator needs to review the full secure-page chat
→ filters: Needs attention, All visitors, PDF downloaded, Reviewed
→ intent badges: High / Medium / Low based on questions, PDF downloads, and follow-up intent
```

Professional dashboard structure:

```text
Website / report group
→ Visitor 1
   → Question 1
   → Question 2
→ Visitor 2
   → Question 1
```

Important rule:

```text
Do not mix questions from another visitor/session as a fallback.
If selected visitor has no messages, show selectedSession.lastUserQuestion only.
Do not load all reportToken questions into the selected visitor panel unless explicitly requested for debugging.
```

When Chat Insights questions do not show:

```text
Ask for:
app/admin/dashboard/ChatInsightsPanel.tsx
app/admin/dashboard/page.tsx
app/admin/dashboard/types.ts
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts

Then check:
- API response from /api/trackflow/report-chat?admin=1...
- Supabase trackflow_report_chat_messages has role='user' rows
- route admin transcript endpoint returns only user questions for the selected session
- right panel clientQuestions filter only displays role='user'
```

When dashboard becomes visually messy:

```text
Usually update only:
app/admin/dashboard/ChatInsightsPanel.tsx

Do not touch:
route.ts
supabase-admin.ts
page.tsx

unless the data loading itself is broken.
```

### Visitor/session stability

Current intended behavior:

```text
Same reportToken + same browser = same visitor/session
Refreshing the page keeps the same visitor
Returning the next day from the same browser keeps the same visitor
Multiple questions in the same browser should appear under one visitor
Different browser/device generally becomes a different visitor unless a future contact identity system is added
```

Current visitor storage strategy:

```text
ReportChatAssistant.tsx
→ stores chat session id using localStorage/sessionStorage/cookie where available
→ sends sessionId in POST /api/trackflow/report-chat

report-chat/route.ts
→ should respect the incoming stable sessionId
→ may use cookie/request fallback only if the body sessionId is missing or invalid

lib/supabase-admin.ts
→ createChatSessionId() must preserve valid UUIDs
→ if isUuid() is wrong, Supabase will create a new random session every message
```

Critical historical bug:

```text
If the dashboard creates a new visitor after every message even though browser storage has the same session id, check lib/supabase-admin.ts.

Bad UUID regex example:
^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$

Correct UUID regex:
^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$

The bad regex misses the final hyphen group and makes valid UUIDs fail validation.
Then createChatSessionId() falls back to randomUUID(), creating one visitor per message.
```

When “new visitor every message” happens:

```text
Ask for:
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts

Check:
1. Browser storage contains trackflow_report_chat_session_{token}
2. POST body includes the same sessionId every message
3. route.ts does not replace a valid body sessionId
4. supabase-admin.ts isUuid() validates normal UUIDs correctly
5. logReportChatSession() and logReportChatMessages() use the same sessionId
```

### Supabase chat logging and dashboard activity

Current Supabase intent:

```text
trackflow_report_chat_sessions
→ one row per visitor/session per report
→ stores report token, website, country/device/browser, latest question, message count, PDF activity, reviewed status

trackflow_report_chat_messages
→ stores chat messages
→ dashboard displays only role='user' rows by default
```

Important fields for sessions:

```text
id
report_token
domain
domain_slug
company_name
country_code
country_name
region
city
device_type
browser
os
first_seen_at
last_seen_at
updated_at
message_count
last_user_question
last_assistant_answer_snippet
reviewed_at
report_url
pdf_downloaded_at
last_pdf_downloaded_at
pdf_download_count
```

Important fields for messages:

```text
session_id
report_token
role
content
source
quota_status
created_at
```

If Supabase returns missing column errors:

```text
Run a schema/column query in Supabase SQL Editor and compare against the fields above.
Typical missing columns:
domain_slug
company_name
country_code
last_user_question
last_assistant_answer_snippet
reviewed_at
report_url
pdf_downloaded_at
last_pdf_downloaded_at
pdf_download_count
```

If Supabase returns permission denied:

```text
Grant service_role privileges for both tables.
The server uses SUPABASE_SERVICE_ROLE_KEY, never client public anon access.
```

Recommended debug env:

```env
TRACKFLOW_CHAT_DEBUG=1
```

### Localhost behavior

Expected localhost limitations:

```text
Country/location may show Unknown on localhost.
Vercel production usually provides x-vercel-ip-country.
Localhost will not automatically include real geo headers.
Device/browser/OS can still be detected from user-agent.
```

Localhost testing tips:

```text
Use exactly one origin:
http://localhost:3000

Do not mix:
http://localhost:3000
http://127.0.0.1:3000

Those are different browser storage/cookie origins.
Incognito/private window also creates a separate visitor.
```

To test location locally with API clients, send headers:

```text
x-vercel-ip-country: US
x-vercel-ip-country-region: FL
x-vercel-ip-city: Miami
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124
```

---

## File Request Protocol for Future Assistants

When the user reports a problem, do not ask for random files. Ask for the minimum connected set below.

### Secure page UI / PDF UX

Ask first:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
```

Ask additionally only if backend fails:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-storage/b2.ts
```

Use this for:

```text
PDF preview looks bad
Download PDF navigates away
Download button has no feedback
Secure page layout is not professional
Open PDF/download route shows wrong content
```

### Secure page chatbot UI/session

Ask first:

```text
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts
```

Use this for:

```text
new visitor every message
chat history not restoring
same visitor questions not grouped
chat does not send sessionId
chat UI issue
quota fallback behavior
```

### Chat Insights dashboard

Ask first:

```text
app/admin/dashboard/ChatInsightsPanel.tsx
app/admin/dashboard/page.tsx
app/admin/dashboard/types.ts
```

Ask additionally if data/API is wrong:

```text
app/api/trackflow/report-chat/route.ts
lib/supabase-admin.ts
Supabase schema/query output
```

Use this for:

```text
questions not showing
right panel cuts messages
visitor rows messy
group toggle/collapse issue
PDF activity not showing
reviewed status issue
dashboard TypeScript error
```

### Supabase chat data issue

Ask first:

```text
lib/supabase-admin.ts
app/api/trackflow/report-chat/route.ts
```

Also ask for Supabase SQL output:

```sql
select column_name, data_type
from information_schema.columns
where table_name in (
  'trackflow_report_chat_sessions',
  'trackflow_report_chat_messages'
)
order by table_name, ordinal_position;
```

Useful test queries:

```sql
select
  session_id,
  report_token,
  role,
  content,
  created_at
from public.trackflow_report_chat_messages
where report_token = 'REPORT_TOKEN'
order by created_at desc
limit 20;
```

```sql
select
  id,
  report_token,
  last_user_question,
  message_count,
  pdf_download_count,
  last_pdf_downloaded_at,
  updated_at
from public.trackflow_report_chat_sessions
where report_token = 'REPORT_TOKEN'
order by updated_at desc;
```

### B2 PDF download issue

Ask first:

```text
lib/trackflow-storage/b2.ts
app/api/trackflow/[...action]/route.ts
```

Use this for:

```text
B2 timeout
PDF preview/download 502
readB2Object fetch failed
Backblaze endpoint timeout
download works sometimes but not always
```

### Catch-all TrackFlow route safety

Do not touch this file unless necessary:

```text
app/api/trackflow/[...action]/route.ts
```

Only touch it when:

```text
report preview/download/CTA route fails
B2 streaming fails
main TrackFlow API dispatcher fails
email/follow-up/cleanup backend behavior fails
```

Do not use it for pure Chat Insights UI issues.

---

## Known Stable Test Checklist After Recent Fixes

After replacing files, always run:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

Then test:

```text
1. Open secure report page.
2. Ask 3 chatbot questions in the same browser.
3. Confirm browser storage has trackflow_report_chat_session_{token}.
4. Refresh admin dashboard Chat Insights.
5. Confirm one visitor/session contains all 3 questions.
6. Confirm right panel shows only client/user questions, not assistant answers.
7. Click Download PDF.
8. Confirm page does not navigate away.
9. Confirm download button shows preparing/download started status.
10. Confirm PDF download count updates after refresh.
```

---


## Latest Update — v19.05 Secure Page Booking CTA

This patch adds a professional booking/contact conversion path to the client-facing secure tracking review page while keeping the chatbot as the main first interaction.

Changed files:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Secure report page
→ hero primary actions remain View findings and Ask about this review
→ hero adds a Book a verification call action that scrolls to the booking section
→ bottom CTA becomes a dedicated Verification call section
→ booking button uses report/private copy bookingUrl or calendlyUrl when present
→ fallback booking URL can come from NEXT_PUBLIC_TRACKFLOW_CALENDLY_URL or NEXT_PUBLIC_CALENDLY_URL
→ if no booking URL is configured, the button falls back to the existing tracked report CTA
→ email reply remains available as a secondary contact path
```

Important decisions:

```text
Do not embed a large Calendly iframe by default.
Do not make the page feel like a sales page before the client reads the review.
Keep the chatbot focused: the booking section explicitly suggests asking the assistant first when the client wants a plain-English explanation.
Do not change Python-generated secure page content, report storage, PDF preview/download, Gemini server route, Firestore fields, or chatbot answer logic.
```

---

## Latest Update — v19.04 Secure Page Chat-Focused UX Polish

This patch improves the client-facing secure tracking review page without changing report storage, Python-generated content, Gemini server prompts, or PDF/report backend behavior.

Changed files:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
app/components/trackflow/ReportChatAssistant.tsx
app/components/trackflow/reportChatQuestions.ts
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Secure report page
→ keeps dynamic report content but makes the first screen easier for clients to understand
→ adds a compact review-focus summary in the hero area
→ makes Ask about this review a primary hero action
→ changes the right hero card into a question/assistant bridge
→ keeps the PDF available but makes it less dominant than findings and assistant questions
→ shows recommended next steps as a clearer numbered verification plan
→ removes large closed-state quick-question chips from the floating chat button so it does not cover hero content
→ keeps the floating chat assistant report-aware, evidence-safe, and focused on saved report context
```

Important decisions:

```text
Do not change Python-generated report wording in this patch.
Do not change Firestore report shape, report register, PDF preview/download routes, tracking beacons, or Gemini answer-generation route.
The secure page should guide the client through: understand the review → ask the assistant → read findings → request verification.
The chatbot remains a central feature, but it must not visually overlap or hide important page content.
```

## Latest Update — v19.00 Overview Command Center

Stage 15E upgrades the Overview tab into a clearer command-center dashboard.

Changed files:

```text
OverviewPanel.tsx
page.tsx
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Overview tab
→ separates Firestore tracking from Google Sheet pipeline data
→ shows sent/opened/clicked/replied/bounce/unsubscribe from Firestore lead cache and server summaries
→ shows Email-ready, LinkedIn-ready, Report-ready, and Needs-review counts from Google Sheet cache
→ shows follow-up queue status in a smaller, clearer summary
→ shows Firestore free-tier safety with reads, writes, storage, and sender usage progress bars
→ keeps manual refresh buttons; no realtime listener is added
```

Important decisions:

```text
Open/click/reply/follow-up status remains Firestore source-of-truth.
Google Sheet is used for pipeline review only: email-ready, LinkedIn-ready, report-ready, needs-review.
Overview should make the data source clear so the operator does not confuse Sheet snapshot values with real tracking state.
Firestore usage shown here is still an estimate; Firebase Console remains the final quota source.
```

---
## Latest Update — v18.99 Sheet Lead Source Overview

Stage 15D changes the Sheet tab from an old Sheet-based sending queue into a user-friendly Sheet data review and source overview area.

Changed files:

```text
SheetQueuePanel.tsx
sheet-readiness.ts
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Sheet tab
→ shows Email leads, LinkedIn leads, Report Ready, and Needs Review counts
→ classifies each row as Email / LinkedIn / Needs Review from Sheet source fields and report context
→ row click opens a large audit detail panel for easier review
→ Email rows can be opened directly in the Send Email composer for final review/send
→ LinkedIn rows stay LinkedIn-first and show LinkedIn link copy/report actions
→ old Queue Selected / Queue Send actions are removed from the visible UI
```

Important decisions:

```text
Sheet tab is now for data review, source understanding, and routing.
Send Email tab remains the place for final email compose/send/schedule.
Leads tab remains the place for tracking and follow-up state.
LinkedIn-first rows should not accidentally enter the Send Email composer unless explicitly email-sourced.
```

---

## Latest Update — v18.98.1 Sender Stats API Fix

This patch fixes Send Email tab sender cards when direct Firestore reads for `daily_sending_stats` are blocked by security rules or stale client cache.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
page.tsx
OutreachPanel.tsx
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Send Email tab
→ sender cards load today's sent count through the admin API /api/trackflow/sender-stats
→ each sender card shows sender email, Sent today, Left today, and 50-email limit progress
→ after a direct Send Now succeeds, the selected sender count updates locally without page reload
→ scheduled emails do not increment the daily counter until the cron actually sends them
```

Important decisions:

```text
Frontend should not rely on direct client Firestore reads for daily_sending_stats.
The backend already reserves sender daily slots in daily_sending_stats when an email is actually sent.
The admin API reads those stats server-side and returns safe per-sender counts to the dashboard.
```

---
## Latest Update — v18.97 Lead Drawer Engagement + Follow-up Summary

Stage 15C makes the Lead tab drawer easier to understand before deciding whether to follow up, archive, or delete a lead.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
page.tsx
LeadsPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Lead drawer
→ shows Engagement Summary with meaningful open/click counts
→ shows first opened / last opened and first clicked / last clicked
→ shows Follow-up Status with current step, next action time, last follow-up, automation status, and reason
→ shows Recent Activity capped to the latest 5 useful events
```

Important decisions:

```text
Do not store a huge open/click event array by default.
Store firstOpenedAt, lastOpenedAt, firstClickedAt, lastClickedAt, counts, and lastClickedUrl.
Full low-value tracking history remains optional behind STORE_LOW_VALUE_TRACKING_HISTORY.
Managed lead API returns only capped recent tracking/sent message rows for the drawer.
Open/click dedupe still protects Firestore write limits.
```

---

## Latest Update — v18.95 Send Email Drawer Stage 15A

Stage 15A adds a focused one-by-one email review drawer inside the Send Email tab. This is intentionally not a bulk-send workflow.

Changed files:

```text
page.tsx
OutreachPanel.tsx
sheet-readiness.ts
types.ts
utils.ts
PROJECT_CONTEXT_README.md
```

Behavior:

```text
Send Email tab
→ right-side fixed Ready Leads button only
→ click opens a slide-out Ready Email Leads drawer
→ drawer loads Google Sheet email-ready rows
→ clicking one row fills the composer
→ operator reviews/edits the subject/body
→ Send Now or Schedule uses the composer
→ after send/schedule, the Sheet row is marked Sent/Scheduled and disappears from Ready leads
```

Important decisions:

```text
No bulk email send in this tab.
Email copy remains sourced from Google Sheet.
Firestore still stores only send/tracking metadata, not full email copy.
LinkedIn-first rows stay out of the Send Email drawer unless explicitly marked as email sourced.
The drawer is isolated as a fixed right-side UI so the existing email composer layout stays stable.
```


## Latest Update — v18.95.1 Send Email Drawer UI / Load Fix

This patch fixes the first Send Email drawer UX test.

Changed files:

```text
page.tsx
OutreachPanel.tsx
sheet-readiness.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The Ready Leads button is now a small floating button, not a large vertical side tab.
The drawer is a compact fixed right panel below the navbar with its own internal scroll.
The drawer no longer uses a full-screen backdrop on desktop, so the dashboard is not locked behind a grey overlay.
Send Email drawer loading is independent from Sheet tab filters, so approval/send/status filters in Sheet Queue cannot hide email-ready leads.
The drawer force-refreshes when opened.
If the API-level hasEmail filter returns no rows but the Sheet has rows, the drawer falls back to loading plain Sheet rows and validates them locally.
Secure report readiness now accepts both /r/{token} and /tracking-review/{domainSlug}/{token}.
For Send Email review, Report URL + token is enough; PDF fields no longer hide a lead from the drawer because PDF access is handled by the secure report backend.
```

---

## Latest Update — v18.95.2 Send Email Composer Field Normalization

Stage 15A patch follow-up fixes Sheet-to-composer field placement for the Send Email drawer.

Changed files:

```text
page.tsx
OutreachPanel.tsx
utils.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
When a Sheet row is opened in the Send Email composer, Email Subject must always become plain subject text.
Email Body must always become editor-ready HTML.
If the Google Sheet row has shifted fields, escaped HTML, or a full generated email inside the subject column, the dashboard normalizes it before filling the composer.
Subject inputs strip HTML tags and common Subject:/Body: labels.
Body inputs decode escaped HTML and render it in the WYSIWYG editor instead of showing raw tags.
Full email body remains in Google Sheet, not Firestore.
```

Test checklist:

```text
Open Send Email tab
Open Ready Leads drawer
Select a row with HTML email body
Confirm subject field contains only a short plain subject
Confirm body editor renders formatted email content without visible HTML tags
Edit and Send/Schedule a test row
Confirm Sheet Subject/Body update correctly
```

---

## Latest Update — v18.94 Outreach Channel Save Stage 14G

Stage 14G makes secure report registration save a small, explicit outreach workflow identity for each report so the dashboard does not have to guess whether a report belongs to email outreach or LinkedIn outreach.

Changed files:

```text
app/api/export/blob-reports/route.ts
lib/trackflow-api/report-normalizers.ts
lib/trackflow-api/reports.ts
app/components/LeadList.tsx
app/components/LeadList/types.ts
PROJECT_CONTEXT_README.md
```

Saved report fields:

```text
sourceType: search | linkedin | manual | unknown
outreachChannel: email | linkedin | manual | unknown
leadSource: python_search | linkedin_audit | manual_audit | unknown
emailValid
emailOutreachAllowed
linkedinOutreachAllowed
auditSource
sourceContext
linkedinProfileUrl
linkedinCompanyUrl
linkedinContactName
```

Routing rule:

```text
Search/Python report → Send Email workflow
LinkedIn/manual report → LinkedIn Outreach workflow
```

Important decisions:

```text
Do not save full email copy or LinkedIn message copy in Firestore.
Google Sheet remains the source for email copy and review status.
Firestore only stores tiny workflow/channel flags needed to route reports safely.
LinkedIn reports stay LinkedIn-first even if a valid email is later found, unless the operator manually moves the lead to email outreach.
```


## Latest Update — v18.93 Bulk Secure Report Cleanup

Stage 14F-B adds manual bulk cleanup from the dashboard:

```text
Cleanup tab
→ select multiple secure reports with checkboxes
→ Preview selected
→ Archive selected reports / Remove files from selected / Delete selected test data
```

Backend endpoint:

```text
POST /api/trackflow/cleanup/reports/bulk
```

Safety rules:

```text
Preview can run for selected reports without changing data.
Confirmed bulk cleanup processes reports one by one.
One missing PDF/image/Sheet row does not stop the remaining selected reports.
Hard/test delete still requires DELETE_REPORT_ASSETS.
No-memory contact delete remains blocked when outreach history is detected.
```


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
→ Next.js export route fetches PDF from Python
→ PDF uploaded to private Backblaze B2 through the Next.js storage helper
→ OG / LinkedIn preview image stays on Vercel Blob
→ Vercel /api/trackflow/reports/register saves slim report data, B2 PDF keys, and Blob image URLs in Firestore
→ Client opens /tracking-review/{domainSlug}/{token}
→ Optional report-aware Gemini assistant answers secure-page questions from saved report context
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
pdfStorageProvider / storageProvider
pdfB2Key / b2Key / pdfObjectKey
pdfBucket if needed for debugging
pdfExpiresAt
blobPathname for compatibility or OG/preview image pathname
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
Backblaze B2 credentials
private B2 direct signed URLs unless intentionally short-lived
```


### 3.5 Secure Report Chat Assistant

Secure report pages may include a Gemini-powered “Ask about this review” assistant. This assistant must be **report-aware and evidence-safe**, not a general unrestricted chatbot.

Correct scope:

```text
Secure page only: /tracking-review/{domainSlug}/{token}
Answer from saved report context + general tracking explanations
Explain findings, proof points, recommendations, verification plan, access needs, and next steps
Use Gemini 2.5 Flash by default
Disable input and show CTA when quota/rate limit is reached
Optionally save chat history to Supabase, not Firestore
```

The assistant must not:

```text
Invent evidence
Claim account-level truth
Claim tracking is broken
Claim revenue loss is proven
Confirm Google Ads/GA4/CRM/server-side results without access
Run as a generic full-site chatbot by default
Save chat messages inside audit_reports
```

Storage rule:

```text
Firestore remains slim for secure report rendering.
Supabase may store chat sessions/messages for review and follow-up.
If Supabase is not configured, the chatbot should still answer but silently skip chat-history logging.
```


### 3.11 Floating Secure Report Chat UX Rule

The secure report chatbot should feel like a premium Messenger-style assistant, not a large inline page section.

Required behavior:

```text
Closed state:
bottom-right floating chat button only
green online/active indicator
clear label: Ask about this review
no large chat panel taking page space

Open state:
floating chat window opens above the page content
closed-state button is hidden while the window is open
large readable message area
input stays visible at the bottom
assistant answer appears progressively/typing-style
header close button closes the window
saved conversation reloads after refresh when Supabase is configured
```

Hero CTA rule:

```text
The secure page "Ask about this review" hero button should open the floating chatbox.
It should not scroll the user into a large inline chat section.
```

The chat UI should keep all answers evidence-safe and report-aware.


### 3.12 Premium Chat Readability and Input Rule

The secure report chatbot should make answers easy to read inside a compact messenger window.

Required behavior:

```text
Assistant answers should not appear as one plain text wall.
Client-facing answers should render as readable paragraphs, short section blocks, bullet lists, and numbered steps when applicable.
Important notes should be visually separated from the main explanation.
Suggested questions should appear in a helpful, non-cluttered way.
Already-asked questions should not be repeated in starter, closed-state, or follow-up chips.
Closed chat state may show 1-2 compact smart question chips above the floating button, but it should not show a large background card that covers important page text.
Open chat state should show starter questions before the first user question and contextual follow-up chips after assistant answers.
Follow-up chips should prioritize the next useful verification question for the client, such as GA4, GTM, Google Ads, lead-path testing, account access, or the safest next step.
The chat input should auto-grow while the visitor types longer questions.
Enter sends the message; Shift + Enter creates a new line.
The input must stop growing at a comfortable max height and then scroll internally.
```

Design goal:

```text
The chatbot should feel like a premium report-aware assistant, not a plain support textarea.
The UI should invite the client to ask the next useful tracking-review question without covering the report content.
```


### 3.13 Dynamic Report-Aware Chat Questions Rule

Chat suggestion chips should be generated from the saved report context instead of hardcoded for one audit.

Required behavior:

```text
Do not hardcode a specific score such as 83/100 into chatbot questions.
Build questions from report context: score, main finding, primary conversion focus, proof points, recommendations, observed signals, manual ads context, and business type.
Phone-call reports should prioritize phone/call-tracking questions.
Lead-form reports should prioritize form-submission questions.
Booking reports should prioritize appointment/booking tracking questions.
Ecommerce reports should prioritize cart, checkout, and purchase tracking questions.
GA4/GTM/Google Ads/server-side evidence should create the matching verification questions.
Already-asked questions should be hidden from closed-state, starter, and follow-up chips.
Question-building rules should live outside the UI component when possible.
```

Current structure:

```text
app/components/trackflow/reportChatQuestions.ts
→ pure dynamic question builder, report context types, de-dupe, asked-question filtering

app/components/trackflow/ReportChatAssistant.tsx
→ UI, chat state, history, message rendering, auto-grow input, uses question builder

app/tracking-review/[domainSlug]/[token]/page.tsx
→ extracts compact report context and passes it to the chatbot
```


### 3.14 Intent-Safe Chat Answer Rule

Suggested questions and assistant answers must stay aligned. If the client asks about phone calls, the assistant must answer phone-call tracking. If the client asks about forms, it must answer form tracking. The assistant must not reuse one generic lead-form answer for every question.

Required behavior:

```text
Phone/call questions → answer phone-call tracking and call-click verification.
Form/enquiry questions → answer form submission / enquiry-path verification.
Booking questions → answer booking/appointment verification.
GA4 questions → explain GA4 event/property checks.
GTM questions → explain container visibility versus tag firing.
Google Ads questions → explain conversion diagnostics and account-side confirmation.
No-clear-event questions → explain what was not clearly observed without claiming failure.
Score questions → explain opportunity/review priority, not tracking health.
Server-side questions → explain why browser evidence cannot prove server forwarding.
Meta questions → explain Pixel/CAPI verification separately.
```

Safety rule:

```text
Never answer a phone-call question with a form-answer fallback.
Never answer a form question with a phone-call answer.
Never claim tracking is broken, conversions are missing, or final recording is confirmed from public browser evidence alone.
```

Current structure:

```text
lib/trackflow-ai/report-chat.ts
→ deterministic intent-specific answer builders before Gemini
→ safe fallback answer only after exact intent matching
→ validation still blocks unsafe or incomplete AI output

app/api/trackflow/report-chat/route.ts
→ still uses deterministic answers first, then Gemini if needed
```


### 3.15 Hybrid PDF / OG Storage Rule

The current report-storage architecture is hybrid:

```text
PDF report files
→ private Backblaze B2 bucket

OG / LinkedIn preview images
→ Vercel Blob public URL

Secure report metadata
→ Firestore audit_reports/{token}

Secure report chatbot history
→ Supabase when configured
```

Important decisions:

```text
PDF files should no longer be stored in Vercel Blob by default.
PDF files are uploaded from the local Next.js export route to a private Backblaze B2 bucket.
The B2 object key is saved in Firestore; B2 credentials are never saved in Firestore or exposed to clients.
The secure page still uses /api/trackflow/reports/preview?token=... and /api/trackflow/reports/download?token=...
The preview/download routes stream the PDF server-side from B2, so the client never sees the private B2 object URL.
OG/preview images remain on Vercel Blob because LinkedIn/Facebook crawlers need a public image URL.
The secure page page.tsx does not need to know whether the PDF is stored in B2 or Blob because it already uses internal preview/download routes.
```

Local/production placement rule:

```text
lib/trackflow-storage/b2.ts must exist inside the Next.js project root.
Do not place this helper inside python-backend/.
The local dashboard Next.js app needs B2 env values to upload PDFs.
The Vercel production app needs the same B2 env values to preview/download PDFs from the secure page.
```

Future cleanup rule:

```text
Cron cleanup is intentionally separate and should not be required for normal manual testing.
A future cron should delete expired B2 PDFs, optionally delete Vercel Blob preview images, optionally delete Supabase chat logs, and then mark cleanup status in Firestore.
```


### 3.16 TrackFlow API Modularization Rule

The catch-all TrackFlow API route is being split gradually so email automation, cleanup, report hosting, storage, and shared helpers do not remain in one giant file.

Current stage-1 structure:

```text
app/api/trackflow/[...action]/route.ts
→ still owns request dispatch and existing route behavior

lib/trackflow-api/core.ts
→ ApiError, json/html responses, env/readJson helpers, time/url/html helpers, follow-up content validation

lib/trackflow-api/security.ts
→ requireAdmin, requireCronSecret, requireWebhookSecret, unsubscribe token/url helpers

lib/trackflow-email/sender-selection.ts
→ verified sender selection and sender normalization

lib/trackflow-email/contact-memory.ts
→ contact cooldown/memory warning lookup

lib/trackflow-email/suppression.ts
→ suppression-list read/write helpers

lib/trackflow-email/email-events.ts
→ lightweight raw email event logging policy

lib/trackflow-storage/b2.ts
→ private Backblaze B2 PDF upload/read helpers
```

Important decisions:

```text
Keep route behavior and response shape unchanged while splitting helpers.
Do not split dashboard page.tsx until backend route helpers are stable.
Do not create one giant database-manager file; use small modules by responsibility.
The route should become a thin dispatcher over time, but only in safe small patches.
```


### 3.17 Dashboard Helper Modularization Rule

The email automation dashboard is now being split gradually so the main `page.tsx` does not keep every type, helper, readiness rule, and follow-up utility inline.

Current stage-1 structure:

```text
page.tsx
→ still owns the main dashboard component, state wiring, tab rendering, and existing UI behavior

types.ts
→ MainTab, Lead, SheetLead, follow-up config types, scheduled edit types, cleanup types, and shared dashboard state types

constants.ts
→ service names, follow-up step IDs, active automation statuses, and outreach draft localStorage key

utils.ts
→ HTML stripping/sanitizing helpers, email/URL helpers, date/time helpers, sender stats doc ID helper, sheet service normalization, and simple merge-tag helper

sheet-readiness.ts
→ Google Sheet queue readiness checks, secure report URL check, report status label helper, and sheet value helper

followup-utils.ts
→ default follow-up config, config merge helper, hot lead scoring, next follow-up status helper, and step eligibility helper
```

Important decisions:

```text
Stage 1 should not redesign dashboard UI.
Keep `page.tsx` as the shell until helper extraction is stable.
New helper files should live in the same folder as the dashboard `page.tsx` and be imported with relative paths such as `./types`.
Do not change API routes, Firestore fields, Sheet columns, Brevo behavior, or stored dashboard state as part of this helper split.
Split visual panels later, one panel at a time, only after helper files build cleanly.
```




### 3.18 Dashboard Action Hook Modularization Rule

The email automation dashboard action logic is being split after the helper extraction stage.

Current stage-2 structure:

```text
page.tsx
→ still owns the main dashboard component, UI rendering, tab layout, local compose state, and existing behavior

hooks/useScheduledEmails.ts
→ scheduled-email loading, edit modal population, scheduled edit save, scheduled cancel, and send-soon actions

hooks/useSystemStatus.ts
→ Firebase usage summary loading, TrackFlow API health loading, and system cleanup actions

hooks/useFollowupAdmin.ts
→ follow-up summary loading, follow-up dry-run preview, and Google Postmaster health loading
```

Important decisions:

```text
Do not redesign UI while extracting action hooks.
Do not change API route URLs, request payloads, response handling, Firestore fields, Sheet columns, or Brevo behavior.
Keep hooks in the dashboard folder under hooks/ and import them from page.tsx with relative paths.
Each hook should receive existing Zustand state/setters from page.tsx so stored dashboard behavior remains unchanged.
Split visual panels later, one panel at a time, after action hooks build cleanly.
```



### 3.19 Dashboard Scheduled Panel Modularization Rule

The email automation dashboard visual panel split has started after helper and action-hook extraction.

Current stage-3 structure:

```text
page.tsx
→ still owns the main dashboard shell, top tabs, local outreach compose state, lead drawer, and remaining unsplit tab renderers

ScheduledPanel.tsx
→ owns the scheduled-email tab UI, scheduled email table, scheduled edit drawer, scheduled WYSIWYG editor, and scheduled edit action buttons

hooks/useScheduledEmails.ts
→ still owns scheduled-email loading, edit modal population, scheduled edit save, scheduled cancel, and send-soon actions
```

Important decisions:

```text
Split visual panels one at a time.
Do not redesign the tab UI during panel extraction.
Do not change scheduled-email API URLs, request payloads, response handling, Firestore fields, Sheet columns, or Brevo behavior.
Keep ScheduledPanel.tsx in the same dashboard folder as page.tsx and import it with ./ScheduledPanel.
The ScheduledPanel should receive existing state/actions from page.tsx as props so Zustand state and behavior remain unchanged.
Next safe visual split can be a small overview/system panel before larger Outreach, Automation, Cleanup, Sheet, or Leads panels.
```


### 3.19 Dashboard Overview Panel Modularization Rule

The dashboard visual split should continue one panel at a time after helper extraction and action hook extraction are stable.

Current stage-4 structure:

```text
page.tsx
→ still owns the dashboard shell, tab routing, local compose state, lead/sheet/cleanup/automation/outreach rendering, and shared drawer behavior

ScheduledPanel.tsx
→ scheduled-email visual panel and scheduled edit drawer

OverviewPanel.tsx
→ overview tab visual panel, including top summary cards, follow-up report cards, Firebase usage cards, hot lead preview, and automation health card
```

Important decisions:

```text
Do not move sensitive outreach composer, cleanup table, automation editor, sheet queue, or lead table in the same patch.
OverviewPanel should receive existing state/actions from page.tsx as props.
Do not change API route URLs, request payloads, response handling, Firestore fields, Sheet columns, Brevo behavior, or Zustand stored dashboard state.
Continue splitting visual panels one at a time only after the previous panel builds and works locally.
```


### 3.20 Dashboard Analytics Panel Modularization Rule

The dashboard visual split has now moved one low-risk display tab into its own component after the scheduled and overview panels were stable.

Current stage-5 structure:

```text
page.tsx
→ still owns the dashboard shell, tab routing, local outreach compose state, lead/sheet/cleanup/automation/outreach rendering, and shared lead drawer behavior

ScheduledPanel.tsx
→ scheduled-email visual panel and scheduled edit drawer

OverviewPanel.tsx
→ overview tab visual panel

AnalyticsPanel.tsx
→ analytics tab visual panel, including open/click/reply/bounce rate cards, Google Postmaster summary card, and sender performance cards
```

Important decisions:

```text
AnalyticsPanel is display-focused and receives existing state/actions from page.tsx as props.
Google Postmaster loading still uses the existing useFollowupAdmin hook through page.tsx.
Sender performance still uses ACTIVE_SENDERS and cached leads; no Firestore/API behavior should change.
Do not split Outreach, Automation, Cleanup, Sheet, or Leads in the same patch.
Continue visual panel extraction one panel at a time only after the previous patch builds and works locally.
```


### 3.21 Dashboard Cleanup Panel Modularization Rule

The dashboard cleanup tab has been split into its own visual panel after the scheduled, overview, and analytics panel splits.

Current stage-6 structure:

```text
page.tsx
→ still owns cleanup API actions, auth headers, Zustand state wiring, and existing cleanup behavior

CleanupPanel.tsx
→ cleanup bucket tabs, candidate summary cards, cleanup action buttons, policy/status display, candidate table, selection UI, and source/safety display helpers
```

Important decisions:

```text
Do not change cleanup API route URLs while extracting the panel.
Do not change delete/skip/protect behavior, sheetMode behavior, selectedCleanupIds state, leadCleanup Zustand state, or refreshLeads behavior.
Keep destructive cleanup actions owned by page.tsx for now and pass them into CleanupPanel as props.
CleanupPanel should live beside page.tsx and be imported with ./CleanupPanel.
```


### 3.22 Dashboard Automation Panel Modularization Rule

The dashboard automation/follow-up editor tab has been split into its own visual panel after the scheduled, overview, analytics, and cleanup panel splits were stable.

Current stage-7 structure:

```text
page.tsx
→ still owns dashboard shell, tab routing, local outreach compose state, Firestore config loading/saving, follow-up state wiring, and existing automation behavior

AutomationPanel.tsx
→ automation/follow-up visual panel, service tabs, follow-up step tabs, delay/limit controls, dry-run preview display, variant editor cards, variant lead preview, and save button UI

hooks/useFollowupAdmin.ts
→ still owns follow-up summary loading, dry-run action, and Postmaster health action
```

Important decisions:

```text
Do not redesign the automation UI while extracting the panel.
Do not change follow-up config Firestore document shape, API route URLs, cron behavior, dry-run behavior, variant distribution logic, or safety policy.
Keep load/save logic and state wiring in page.tsx for now, and pass current values/actions into AutomationPanel as props.
AutomationPanel should live beside page.tsx and be imported with ./AutomationPanel.
Outreach composer, Sheet queue, and Leads table should remain unsplit until the automation panel builds and works locally.
```


### 3.23 Dashboard Sheet Queue Panel Modularization Rule

The dashboard Google Sheet queue tab has been split into its own visual panel after the scheduled, overview, analytics, cleanup, and automation panel splits were stable.

Current stage-8 structure:

```text
page.tsx
→ still owns dashboard shell, tab routing, local outreach compose state, Sheet loading/updating/queueing/sync action logic, and existing Sheet behavior

SheetQueuePanel.tsx
→ Google Sheet queue visual panel, Sheet lead summary cards, filter controls, ready/select UI, report readiness display, queue buttons, and Sheet lead table
```

Important decisions:

```text
Do not redesign the Sheet queue UI while extracting the panel.
Do not change Sheet API route URLs, request payloads, Google Sheet column names, readiness rules, queue behavior, or tracking sync behavior.
Keep Sheet load/update/queue/sync action logic and state wiring in page.tsx for now, and pass current values/actions into SheetQueuePanel as props.
SheetQueuePanel should live beside page.tsx and be imported with ./SheetQueuePanel.
Outreach composer and Leads table should remain unsplit until the Sheet queue panel builds and works locally.
```


### 3.24 Dashboard Outreach Panel Modularization Rule

The dashboard outreach composer tab has been split into its own visual panel after the Sheet queue panel built and worked locally.

Current stage-9 structure:

```text
page.tsx
→ still owns dashboard shell, tab routing, local outreach compose state, duplicate/cooldown checks, draft persistence, sender/template handoff, validation, and send/schedule action logic

OutreachPanel.tsx
→ outreach visual panel, sender account cards, report link box, duplicate/cooldown/draft warnings, professional email composer, WYSIWYG editor, merge-tag/link buttons, signature toggle, schedule/send controls, live preview, and quality checklist
```

Important decisions:

```text
Do not redesign the outreach composer while extracting the panel.
Do not change Brevo/API route URLs, request payloads, sender selection behavior, duplicate/cooldown safety, report-link validation, draft localStorage behavior, or schedule/send behavior.
Keep send/validate/template/draft/state logic in page.tsx for now, and pass current values/actions into OutreachPanel as props.
OutreachPanel should live beside page.tsx and be imported with ./OutreachPanel.
The dashboard copy inside OutreachPanel must stay English-only.
Leads table should remain unsplit until the outreach panel builds and works locally.
```


### 3.25 Dashboard Leads Panel Modularization Rule

The dashboard lead management tab has been split into its own visual panel after the outreach composer panel built and worked locally.

Current stage-10 structure:

```text
page.tsx
→ still owns dashboard shell, tab routing, lead cache/store wiring, bulk action handlers, archive/trash/restore/permanent-delete action logic, selected lead drawer, and existing lead behavior

LeadsPanel.tsx
→ lead management visual panel, lead view/month/status/service/search filters, bulk action bar, select-all row selection, lead table, engagement summary cells, and row action buttons
```

Important decisions:

```text
Do not redesign the Leads tab while extracting the panel.
Do not change lead API route URLs, request payloads, Firestore fields, cache behavior, archive/trash/restore/permanent-delete behavior, or selectedLeadIds state.
Keep bulk action logic, destructive lead actions, selected lead drawer, and Zustand state wiring in page.tsx for now, and pass current values/actions into LeadsPanel as props.
LeadsPanel should live beside page.tsx and be imported with ./LeadsPanel.
The lead drawer can be split later as a separate safer step after LeadsPanel builds and works locally.
```



### 3.26 Report Cleanup Foundation Rule

The report cleanup system must be staged and safe because TrackFlow stores related data across several services.

Current stage-11 structure:

```text
lib/trackflow-cleanup/report-cleanup.ts
→ report cleanup manifest builder, dry-run preview, manual confirmed cleanup, optional cleanup_jobs logging only when enabled, B2/Blob/Supabase/Firestore/Sheet/lead cleanup orchestration

lib/trackflow-storage/b2.ts
→ existing Backblaze B2 read/upload helpers plus deletePdfFromB2/deleteB2Object

lib/supabase-admin.ts
→ optional report-chat logging plus deleteReportChatHistory for report cleanup

app/api/trackflow/[...action]/route.ts
→ dispatches:
   GET  /api/trackflow/cleanup/report?token=...
   POST /api/trackflow/cleanup/report
   GET  /api/trackflow/cron/cleanup-expired-reports
```

Important safety decisions:

```text
Dry run is the default. POST cleanup does not delete anything unless dryRun:false is sent.
Real cleanup requires an explicit confirmation string:
- soft/assets cleanup: CLEANUP_REPORT_ASSETS
- hard cleanup: DELETE_REPORT_ASSETS

Firestore audit_reports/{token} is read first and not deleted until B2/Blob/Supabase references are collected.
cleanup_jobs/{jobId} is disabled by default to protect Firebase limits. Only enable persistent cleanup logs with TRACKFLOW_WRITE_CLEANUP_JOBS=true or ENABLE_CLEANUP_JOBS=true.
B2 and Blob cleanup is idempotent: missing objects are treated as already cleaned when possible.
Supabase chat cleanup is optional and skipped when Supabase server env is not configured.
Sheet cleanup can mark or clear report-related fields.
Lead cleanup is opt-in through leadMode: none/archive/trash/delete.
When leadMode:"delete" is used, a tiny contact_memory footprint is saved before the lead document is removed.
Cron cleanup is foundation-only and returns a dry-run list first; confirmed delete mode should be enabled later after manual report cleanup works safely.
```

Recommended manual cleanup request:

```json
{
  "token": "REPORT_TOKEN",
  "mode": "soft",
  "leadMode": "archive",
  "sheetMode": "mark",
  "dryRun": true
}
```

Confirmed cleanup request:

```json
{
  "token": "REPORT_TOKEN",
  "mode": "soft",
  "leadMode": "archive",
  "sheetMode": "mark",
  "dryRun": false,
  "confirm": "CLEANUP_REPORT_ASSETS"
}
```

Hard cleanup request:

```json
{
  "token": "REPORT_TOKEN",
  "mode": "hard",
  "leadMode": "trash",
  "sheetMode": "clear",
  "dryRun": false,
  "confirm": "DELETE_REPORT_ASSETS"
}
```

Do not run hard cleanup on real client reports until dry-run output has been reviewed.

### 3.27 Dashboard Cleanup UI Simplification Rule

The cleanup backend can manage B2 PDFs, Vercel Blob preview images, Supabase chat history, Firestore report records, Google Sheet rows, and linked outreach leads, but the dashboard UI should present this in simple operator language.

Current stage-14A structure:

```text
CleanupPanel.tsx
→ simplified operator-facing cleanup UI labels, friendly report cleanup summary, human-readable step result cards, and technical details hidden behind a collapsible section

page.tsx
→ keeps existing cleanup endpoint calls, but uses clearer status/confirmation text for Preview, Archive Report, Remove Files Only, and Delete Test Data

types.ts
→ existing report cleanup state/types remain unchanged
```

Important decisions:

```text
Do not show technical terms like B2, Blob, Supabase, Firestore, manifest, soft, hard, or assets_only as the primary operator language.
Use simple labels:
- Preview
- Archive Report
- Remove Files Only
- Delete Test Data

Archive Report is the recommended default for expired or unused secure reports.
Delete Test Data remains locked behind DELETE_REPORT_ASSETS and should be used only for fake/test records or carefully reviewed delete requests.
Technical cleanup details remain available inside "Show technical details" for debugging, but the main UI should stay easy to understand.
Do not change backend cleanup behavior, API URLs, Firestore fields, Sheet fields, or cron behavior as part of UI simplification.
```


### 3.6 Secure Report Responsive UX Rule

The secure tracking-review page must remain clear and easy to use on desktop, laptop, tablet, and mobile.

Correct UX priorities:

```text
Mobile-first readability
No horizontal overflow
Clear primary actions near the top
PDF preview should not make mobile pages heavy or confusing
Chat assistant should be visible, easy to type into, and not dominate the page before the findings
CTA buttons should be full-width on small screens
Sticky sidebars only on large desktop widths
```

For the secure report assistant:

```text
Desktop/laptop: assistant intro and chat can sit side-by-side.
Tablet/mobile: assistant intro and chat should stack cleanly.
Suggested questions should wrap or stack without overflow.
Chat history area should have a controlled height.
Input should remain comfortable on small screens.
```


### 3.7 English-Only Client and Dashboard Copy Rule

All client-facing and operator-facing outreach/report copy must be written in professional English for US/UK clients.

This applies to:

```text
PDF report text
Secure report page text
Secure report chatbot answers
Dashboard problem cards
Dashboard email readiness messages
Dashboard generated email copy
Gemini email/report prompts
LinkedIn/email outreach draft text
```

Do not write Bengali or mixed Bengali-English text in active project files, client emails, secure pages, chatbot answers, PDF copy, or dashboard helper messages.

If raw audit evidence or older stored data contains non-English text:

```text
Rewrite it into polished English before showing it to the client or using it inside an AI prompt.
If it cannot be safely rewritten, omit it and use a generic evidence-safe fallback.
```

Important dashboard email source files:

```text
app/components/LeadDetailsModal/problemDetails.ts
app/components/LeadDetailsModal/emailHelpers.ts
app/components/LeadDetailsModal/utils.ts
app/components/LeadDetailsModal.tsx
```

These files must keep email prompts, ready email copy, modal helper text, and problem summaries English-only.


### 3.9 Manual Audit Modal Stability Rule

Manual / LinkedIn Website Audit should open as a focused overlay from the Audit Dashboard.

Required behavior:

```text
Open Website Panel / + Manual Website Audit
→ fixed full-screen overlay opens
→ background dashboard is dimmed and locked
→ modal content is independently scrollable
→ Escape closes the panel
→ backdrop click closes the panel
→ no Form Submit Test / Ads Transparency section should appear above or inside the modal by accident
```

Avoid fragile implementations that depend on parent stacking context. Prefer a simple fixed overlay with inline critical positioning styles when debugging z-index/portal conflicts.



### 3.10 KeywordMagic Priority Rule

KeywordMagic should not mark every generated keyword as equally urgent. The operator needs one clear starting keyword, then a short capped list of secondary keywords.

Correct keyword priority behavior:

```text
Best Pick = the first keyword to test today
Use Now = capped shortlist only, not every good-looking keyword
Use Later = promising but secondary
Skip = weak buyer intent, weak tracking opportunity, or poor direct-business likelihood
```

Default caps:

```text
Free mode: maximum 3 Use Now keywords
Balanced mode: maximum 5 Use Now keywords
Deep mode: maximum 7 Use Now keywords
```

Priority should combine:

```text
tracking_hunter_score
tracking_problem_chance
business_site_chance
ads_likely_score
smart_score
market_priority
buyer/action intent
weak research-intent penalty
```

The UI should clearly explain why a keyword matters and what the next action is. Backend `/keyword-ideas-smart` should also enforce the Use Now cap, so the dashboard and Python response stay aligned.

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


### 5.10 `app/components/KeywordMagic.tsx`

Keyword research and prioritization UI.

Owns:

- market pack selection
- location suggestions
- niche/custom-service keyword generation
- credit mode guidance
- Best Pick / Use Now / Use Later / Skip display
- keyword selection into the main lead search store
- capped Use Now UX so the operator can see the most important keyword first

Use this file when:

- every keyword appears as Use Now
- the best keyword is unclear
- keyword cards are too confusing
- credit-saving guidance needs improvement
- frontend ranking should align with backend `/keyword-ideas-smart`

Related backend files:

```text
python-backend/audit.py — `/keyword-ideas-smart` scoring and final Use Now cap
python-backend/trackflow_modules/keywords.py — tracking/vendor/business keyword constants
```

---

## 6. Email Automation / Report Hosting / Storage Map

### 6.1 `app/api/export/blob-reports/route.ts`

Local dashboard export route.

Owns:

- fetching PDF from Python
- uploading PDF to private Backblaze B2
- creating/using OG card / preview image
- uploading OG/LinkedIn preview image to Vercel Blob
- optionally using homepage screenshot as OG card source
- registering secure report payload with B2 PDF keys and Blob preview URLs
- optional Google Sheet update

Use this file when:

- PDF upload to Backblaze B2 fails
- B2 env values are missing in the local Next.js dashboard app
- preview/OG image upload to Vercel Blob fails
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
- Backblaze B2 PDF key aliases
- Blob/Drive legacy field aliases
- slim storage whitelist
- remove/block raw email/LinkedIn/Gemini/debug fields

Use this file when:

- Firestore stores too much data
- secure page data shape is wrong
- B2 PDF key/provider fields are missing
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
- B2-backed PDF preview/download streaming when report storage provider is Backblaze B2
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
- keeping existing public API paths stable
- calling email automation handlers
- calling followup/cron handlers
- calling webhook/unsubscribe handlers
- calling report register/preview/download handlers
- calling cleanup/health handlers

Stage-1 extracted helper modules:

```text
lib/trackflow-api/core.ts
lib/trackflow-api/security.ts
lib/trackflow-email/sender-selection.ts
lib/trackflow-email/contact-memory.ts
lib/trackflow-email/suppression.ts
lib/trackflow-email/email-events.ts
```

Long-term direction:

```text
route.ts should become a thin dispatcher.
Email send/followups/webhooks/sheet/cleanup/report handlers should move out in small safe patches.
```

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


### 6.7 `app/api/trackflow/report-chat/route.ts`

Secure report chat API route.

Owns:

- receiving secure-page client questions
- loading the report by `audit_reports/{token}` from Firestore
- calling the report-aware Gemini helper
- returning quota-safe/fallback responses
- optionally logging questions and answers to Supabase

Use this file when:

- secure page chat does not answer
- Gemini quota fallback does not disable the input
- Supabase chat logs are missing
- report-specific chat answers are not evidence-safe

### 6.8 `app/components/trackflow/ReportChatAssistant.tsx`

Client-side secure page chat UI component.

Owns:

- bottom-right Messenger-style floating chat widget
- hero "Ask about this review" trigger handling
- client-side session/visitor IDs
- Supabase/localStorage history restore on refresh
- progressive typing-style answer display
- formatted assistant answer rendering with readable paragraphs, bullet lists, numbered steps, and important-note blocks
- smart starter/follow-up question chips inside the chat
- closed-state smart question chips above the floating button
- dynamic report-aware question suggestions provided by `reportChatQuestions.ts`
- already-asked question filtering
- auto-growing textarea input with Enter-to-send and Shift+Enter new line
- disabled-input fallback UI
- CTA handoff when AI is unavailable or limited

Use this file when:

- chat UI is missing/broken
- floating bubble/window layout needs improvement
- hero Ask button does not open chat
- saved conversation does not restore after refresh
- typing-style answer display feels too fast/instant
- input does not disable after quota/session limit
- CTA fallback wording/layout needs improvement
- secure page chat UX needs changes

### 6.8.1 `app/components/trackflow/reportChatQuestions.ts`

Dynamic secure report chatbot question builder.

Owns:

- report-aware question generation from compact secure report context
- score/main-finding/primary-conversion/signal based question rules
- phone, lead form, booking, ecommerce, GA4, GTM, Google Ads, Meta, server-side, and speed question patterns
- de-duplication and already-asked question filtering
- closed-state, starter, and follow-up question sets

Use this file when:

- chatbot questions feel too generic
- questions repeat after the client already asked them
- a new business category needs smarter question suggestions
- a report type needs better suggested questions


### 6.9 `lib/trackflow-ai/report-chat.ts`

Server-side Gemini report-chat helper.

Owns:

- building a slim report context from Firestore report fields
- strict evidence-safe Gemini prompt
- Gemini API call using `GEMINI_MODEL`, default `gemini-2.5-flash`
- short client-friendly answer generation
- quota/rate-limit error propagation

Use this file when:

- chat answers are too long/aggressive
- Gemini invents evidence
- evidence-safe wording needs tightening
- Gemini model/config needs changing

### 6.10 `lib/supabase-admin.ts`

Server-only Supabase REST helper for optional chat logging.

Owns:

- checking Supabase server logging config
- inserting chat rows via service-role key from server routes only

Use this file when:

- Supabase chat logs are not saving
- Supabase table name or REST insert behavior changes

### 6.11 `supabase/trackflow_report_chat.sql`

Optional Supabase schema for secure report chat history.

Owns:

- `trackflow_report_chat_messages` table
- indexes for report token and session lookup
- RLS enabled; inserts should use server-side service role only

### 6.12 `lib/trackflow-storage/b2.ts`

Next.js server-side Backblaze B2 helper.

Owns:

- reading B2 env values from the Next.js runtime
- creating stable report PDF object keys
- uploading PDF buffers to private Backblaze B2 through the S3-compatible API
- returning the B2 key, bucket, size, and ETag used by the export/register flow

Use this file when:

- Next.js cannot resolve `@/lib/trackflow-storage/b2`
- PDF upload to B2 fails
- B2 endpoint/bucket/key/application key env values are missing
- report PDF object key/path format needs changing

Important placement rule:

```text
This helper belongs in the Next.js project root at lib/trackflow-storage/b2.ts.
It does not belong inside python-backend/.
```


### 6.13 Email Automation Dashboard Helper Files

These helper files should live in the same folder as the email automation dashboard `page.tsx`.

```text
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
```

Use these files when:

```text
Dashboard TypeScript types need updating
Sheet queue readiness rules need changing
Follow-up status/eligibility logic needs changing
Email/URL/date/HTML helper behavior needs changing
The dashboard page is becoming too crowded but UI panels should not be split yet
```

Important rule:

```text
Do not move JSX-heavy panels until the helper split is stable.
Keep imports relative to the page folder, for example `./types`, so the helper files work even if the dashboard route folder name changes.
```

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

Known current Firestore collections:

```text
audit_reports/{token}
audit_report_domains/{domainSlug or normalized domain}
```

Optional Supabase table for chat history:

```text
trackflow_report_chat_messages
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
pdfStorageProvider / storageProvider
pdfB2Key / b2Key / pdfObjectKey
pdfBucket if needed
pdfExpiresAt
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
secure page chatbot messages inside audit_reports
```

Chat history policy:

```text
Save full client questions/assistant answers to Supabase only when explicitly configured.
Do not store chatbot history in audit_reports.
If Gemini quota/rate limit is reached, disable chat input and show manual verification CTA.
```

Storage policy:

```text
PDF files should be stored in private Backblaze B2.
OG / LinkedIn preview images should stay in Vercel Blob unless a future public-image strategy replaces it.
Firestore should store only secure report metadata, B2 keys, and public preview image URLs.
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

# Vercel Blob is still used for public OG / LinkedIn preview images.
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...

# Backblaze B2 is used for private PDF report storage.
B2_ENDPOINT=https://s3.<region>.backblazeb2.com
B2_BUCKET_NAME=trackflow-reports
B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_REPORT_RETENTION_DAYS=45

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

# Secure report chat assistant
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Private PDF preview/download from Backblaze B2
B2_ENDPOINT=https://s3.<region>.backblazeb2.com
B2_BUCKET_NAME=trackflow-reports
B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_REPORT_RETENTION_DAYS=45
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


## 9.5 Recent Chat Insights / PDF Troubleshooting Addendum

| Problem | Ask For These Files First | Notes |
|---|---|---|
| Every chatbot message creates a new visitor | `ReportChatAssistant.tsx`, `app/api/trackflow/report-chat/route.ts`, `lib/supabase-admin.ts` | First check `isUuid()` in `supabase-admin.ts`; a bad regex can force `randomUUID()` every message. |
| Browser storage has session id but dashboard still creates many visitors | `lib/supabase-admin.ts`, `report-chat/route.ts` | Backend is likely replacing the valid body `sessionId`. |
| Chat Insights right panel shows no questions | `ChatInsightsPanel.tsx`, dashboard `page.tsx`, `report-chat/route.ts`, `supabase-admin.ts` | Check whether `trackflow_report_chat_messages` has role=`user` rows. |
| Chat Insights right panel cuts off question cards | `ChatInsightsPanel.tsx` | Usually UI-only sticky/flex/overflow fix; no backend needed. |
| Chat Insights is visually messy with many websites | `ChatInsightsPanel.tsx` | Use collapsible website/report groups and filters. |
| PDF download leaves the secure page | `app/tracking-review/[domainSlug]/[token]/page.tsx` | Use on-page fetch/blob download; keep Open PDF as new-tab action. |
| Download button gives no feedback | `app/tracking-review/[domainSlug]/[token]/page.tsx` | Add visible status box, spinner, preparing/download-started states. |
| PDF preview shows JSON from report-chat | `app/tracking-review/[domainSlug]/[token]/page.tsx` | `previewHref` is wrong; it must use `/api/trackflow/reports/preview?token=...`. |
| PDF route 502 / Backblaze timeout | `lib/trackflow-storage/b2.ts`, `app/api/trackflow/[...action]/route.ts` | Add/increase retry and timeout around B2 reads. |
| Location/country unknown on localhost | Usually no file needed | Localhost lacks Vercel/Cloudflare geo headers; test in production or send custom headers. |

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
| Secure page responsive UX/chatbot layout issue | `app/tracking-review/[domainSlug]/[token]/page.tsx`, `app/components/trackflow/ReportChatAssistant.tsx`, mobile/tablet/desktop screenshots |
| Secure page does not open | `reports.ts`, `report-normalizers.ts`, `[domainSlug]/[token]/page.tsx`, Firestore document screenshot |
| Secure page register fails | `app/api/export/blob-reports/route.ts`, `lib/trackflow-api/reports.ts`, `app/api/trackflow/[...action]/route.ts` |
| Firestore stores too much data | `report-normalizers.ts`, `reports.ts` |
| B2 PDF upload or Blob OG upload fails | `app/api/export/blob-reports/route.ts`, `lib/trackflow-storage/b2.ts`, env variables |
| LinkedIn preview image missing | `page.tsx` metadata, `reports.ts`, `report-normalizers.ts`, Blob preview fields |
| LinkedIn/manual audit button missing | `LeadList.tsx`, `LinkedInAuditPanel.tsx` |
| Row-level primary goal/visual focus issue | `LeadRow.tsx`, `LeadList.tsx`, `linkedinAuditOptions.ts`, `types.ts` |
| Audit polling timeout | `auditApi.ts`, `audit.py` terminal logs |
| Python server / Playwright crash | `audit.py`, terminal error |
| Gemini wrong/unsafe copy | `gemini_client.py`, `email_copy.py`, sample output |
| Email send/followup issue | `app/api/trackflow/[...action]/route.ts`, sender config, Brevo/webhook logs |
| Google Sheet export issue | `app/api/export/sheet/route.ts`, Sheet screenshot |
| Dashboard email copy includes Bengali/mixed language | `app/components/LeadDetailsModal/problemDetails.ts`, `app/components/LeadDetailsModal/emailHelpers.ts`, `app/components/LeadDetailsModal/utils.ts`, `app/components/LeadDetailsModal.tsx` |
| TypeScript build error | exact file in error + related type file |

---


### v18.51 Secure Report Chat English Client Output Patch

Secure report chatbot client output was tightened so internal/mixed-language evidence notes do not appear in client-facing answers. This patch is focused on `lib/trackflow-ai/report-chat.ts` and preserves the existing Node.js route, Supabase optional logging, Firestore slim storage, and secure page UI.

Changed files:

```text
lib/trackflow-ai/report-chat.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Chatbot answers must be English-only on client secure pages.
If saved report evidence contains Bengali or mixed-language internal notes, rewrite common tracking signals into polished English or omit them.
Never show raw internal or mixed-language phrases to clients.
Default fallback answers should avoid robotic labels like "The main point is" / "A useful evidence point is" when a more professional explanation is possible.
Common finding/explain/main-point questions should route to deterministic professional answers.
```

Example improvement:

```text
Before: A useful evidence point is: GA4 signal found [raw/internal wording]
After: Evidence to review: GA4 signal was noted in the browser-visible review.
```


### v18.50 Secure Report Chat Answer Quality Patch

Secure report chatbot answer quality was tightened without changing Firestore report storage or the secure page report-register flow.

Changed files:

```text
app/api/trackflow/report-chat/route.ts
lib/trackflow-ai/report-chat.ts
app/components/trackflow/ReportChatAssistant.tsx
lib/supabase-admin.ts
```

Important decisions:

```text
Node.js runtime remains required for Firebase Admin compatibility.
The chatbot validates Gemini output before showing it to clients, so incomplete half-sentences are replaced with a safe report-based answer.
Common report questions use deterministic professional answers before Gemini when appropriate.
TrackFlow Pro identity questions may answer: Shahjalal Khan, Founder & Tracking Architect.
Reviewed-business CEO/founder questions remain outside scope unless that information is explicitly saved in the report.
Answers should be concise, calm, non-accusatory, and evidence-safe.
Supabase logging uses UUID session IDs and base table columns only, so it works with the simple setup SQL.
```

The chatbot must continue to avoid:

```text
Invented evidence
Account-level truth claims
Revenue-loss claims
Claims that tracking is broken
Long generic AI answers
Markdown-heavy formatting with visible **bold markers**
```

---


### v18.53 Dashboard Email English-Only Patch

Dashboard-generated email copy and LeadDetailsModal helper text were made English-only. The earlier Python English-only patch fixed future audit/report generation, but dashboard email copy was still pulling mixed-language strings from Next.js problem helpers.

Changed files:

```text
app/components/LeadDetailsModal/problemDetails.ts
app/components/LeadDetailsModal/emailHelpers.ts
app/components/LeadDetailsModal/utils.ts
app/components/LeadDetailsModal.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The master context must stay in one PROJECT_CONTEXT_README.md file.
Do not maintain separate Bengali README context files for active development.
Dashboard email copy must be English-only before it reaches Gemini prompts or ready-email copy.
Problem details must use US/UK-friendly English wording.
If older/raw evidence contains non-English text, sanitize or fall back before showing it in outreach copy.
```

Example improvement:

```text
Before: One thing that may be worth confirming: mixed-language enquiry/action wording.
After: One thing that may be worth confirming: It is not clear from the public scan whether the enquiry/action is being counted correctly in analytics or ad platforms.
```


### v18.56 Manual Audit Drawer Overlay Fix

The Manual / LinkedIn Website Audit workflow stays as a right-side drawer, but the drawer must be rendered above the whole dashboard shell so the main page sticky tab navigation never appears inside or over the drawer.

Changed files:

```text
app/components/LeadList.tsx
app/page.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Manual audit drawer renders through React portal into document.body.
Drawer overlay uses an isolated high z-index layer.
Body scrolling is locked while the drawer is open.
Backdrop click and Escape key still close the drawer.
The main page tab bar z-index is intentionally lower than modal/drawer layers.
No manual audit, row audit, bulk audit, PDF, polish, secure report, or export logic was changed.
```

Use this fix when:

```text
Keyword Magic / Search Discovery / Audit Dashboard / Data Maintenance tabs appear under or over the manual audit drawer.
The background page scrolls while the manual audit drawer is open.
The drawer feels like it is part of the page instead of a true side modal.
```

## 11. Version History Summary



### v18.90 Delete Test Contact With No Memory Stage 14D

The cleanup system now supports deleting an uncontacted test lead/contact without creating a `contact_memory` footprint.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
New lead/contact cleanup mode:
delete_no_memory

Dashboard label:
Delete test contact, no memory

Use this only when the contact was never emailed or messaged.
If the linked contact has outreach history, the backend blocks no-memory delete and tells the operator to use the keep-safety-memory option instead.
Archive/trash cleanup only writes contact_memory when outreach history exists.
The keep-safety-memory delete option still writes a tiny contact_memory footprint before removing the lead/contact document.
```

Simple rule:

```text
Not contacted = delete fully, no footprint needed.
Contacted by email or LinkedIn = delete/cleanup only with tiny safety memory.
```


### v18.89 Admin API Secure Reports List Stage 14C

The dashboard secure report list no longer reads `audit_reports` directly from the client-side Firebase SDK. This fixes Firestore `Missing or insufficient permissions` errors without weakening security rules.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Do not loosen Firestore security rules for audit_reports.
The dashboard calls GET /api/trackflow/cleanup/reports with the signed-in admin ID token.
The deployed TrackFlow API uses requireAdmin and Firebase Admin SDK to read audit_reports.
The API returns only safe list fields needed by the dashboard, not private B2 credentials or raw audit payloads.
The existing cleanup actions still use GET /api/trackflow/cleanup/report and POST /api/trackflow/cleanup/report.
CleanupPanel UI behavior stays simple: Refresh Reports, Select, Preview, Archive Report, Remove Files Only, Delete Test Data.
```

Test checklist:

```text
npm run build
npm run dev
Cleanup tab → Refresh Reports
Confirm the secure report list loads without Firestore permission errors
Select a test report
Preview cleanup
Archive Report only after preview output looks correct
```





### v18.88 Dashboard Secure Reports List Cleanup Stage 14B

The Cleanup tab can now load saved secure report records from Firestore `audit_reports` so the operator no longer has to manually search for a report token before cleanup.

Changed files:

```text
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The cleanup backend endpoints were not changed in this stage.
Dashboard loads secure report rows client-side from audit_reports with a safe fallback query if ordered loading is unavailable.
The Secure Report Cleanup card now shows a searchable/filterable saved report list.
Selecting a saved report automatically fills the cleanup URL/token field.
Preview remains the first step before any cleanup action.
Archive Report remains the recommended normal action.
Delete Test Data remains reserved for fake/test records or carefully reviewed delete requests.
If Firestore security rules block client-side audit_reports reads, add a small admin-only backend list endpoint later instead of weakening public Firestore rules.
```

Test checklist:

```text
npm run build
npm run dev
Open Cleanup tab
Click Refresh Reports
Confirm Firestore audit_reports rows appear
Search/filter reports
Select one report
Click Preview
Confirm the cleanup summary appears
Run Archive Report only on test data first
```


### v18.87 Dashboard Cleanup UI Simplification Stage 14A

The cleanup dashboard was simplified so the operator does not need to understand storage/database internals before cleaning old test reports or no-reply leads.

Changed files:

```text
page.tsx
CleanupPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Backend cleanup behavior did not change.
The UI now uses simple labels: Preview, Archive Report, Remove Files Only, and Delete Test Data.
Technical labels such as soft/hard/assets_only, B2, Blob, Supabase, Firestore, and manifest are hidden from the main workflow.
Cleanup result steps are shown as human-readable cards: PDF file, Preview image, Chat history, Secure report, Sheet row, Linked lead.
Technical step details remain available under "Show technical details" for debugging.
Old lead cleanup was renamed and simplified so it is clearly separate from secure report file cleanup.
```

Test checklist:

```text
npm run build
npm run dev
Open Cleanup tab
Paste a test secure report URL/token
Click Preview
Confirm the summary is easy to understand
Run Archive Report only on test data first
Use Delete Test Data only with fake/test reports
```


### v18.86 Dashboard Manual Report Cleanup Controls Stage 13

The dashboard cleanup tab now includes a manual Report Asset Cleanup control so individual secure reports can be previewed and cleaned without waiting for cron.

Changed files:

```text
page.tsx
CleanupPanel.tsx
types.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Manual report cleanup lives in the existing Cleanup tab, beside the lead cleanup manager.
The first button is always Preview Cleanup, which calls GET /api/trackflow/cleanup/report and does not delete anything.
Confirmed cleanup calls POST /api/trackflow/cleanup/report with dryRun:false and the required confirmation string.
Soft cleanup remains the recommended default: mode=soft, leadMode=archive, sheetMode=mark.
Hard cleanup is locked behind the typed confirmation DELETE_REPORT_ASSETS and should be used only for test data or carefully reviewed cases.
The UI shows the cleanup manifest and per-service step results for B2, Blob, Supabase, Firestore, Google Sheet, and lead cleanup.
Existing lead cleanup candidate actions were not changed.
No local-only export routes are used by this manual cleanup UI; it calls deployed TrackFlow cleanup endpoints.
```



### v18.85 Deployed Cron Cleanup Stage 12

Cleanup was adjusted so Cronjob.org and production cleanup never depend on local-only routes such as `app/api/export/blob-reports/route.ts` or `app/api/export/sheet/route.ts`. The deployed Vercel `/api/trackflow/...` route now owns cleanup execution with server-side helpers.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
lib/trackflow-cleanup/sheet-cleanup.ts
lib/supabase-admin.ts
lib/trackflow-storage/b2.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Cronjob.org should call only the deployed Vercel endpoint: /api/trackflow/cron/cleanup-expired-reports.
Cron cleanup must not call localhost, app/api/export/blob-reports/route.ts, or app/api/export/sheet/route.ts.
B2 PDF deletion uses the deployed B2 helper and deployed B2 ENV values.
Vercel Blob OG/preview deletion uses deployed BLOB_READ_WRITE_TOKEN when configured; otherwise it safely skips image deletion.
Supabase chat cleanup uses deployed SUPABASE_SERVICE_ROLE_KEY when configured; otherwise it safely skips chat cleanup.
Google Sheet cleanup uses direct deployed Google Sheets service-account ENV through lib/trackflow-cleanup/sheet-cleanup.ts; it does not call the local Sheet export route.
Cron real cleanup requires dryRun=false plus confirm=CLEANUP_EXPIRED_REPORTS and does not allow hard cleanup.
Hard cleanup remains manual-only through POST /api/trackflow/cleanup/report with confirm=DELETE_REPORT_ASSETS.
```

Test checklist:

```text
npm run build
GET /api/trackflow/cleanup/report?token=TEST_TOKEN
GET /api/trackflow/cron/cleanup-expired-reports?dryRun=true&limit=5 with CRON_SECRET
GET /api/trackflow/cron/cleanup-expired-reports?dryRun=false&confirm=CLEANUP_EXPIRED_REPORTS&limit=1 with CRON_SECRET only after dry-run output is checked
Confirm no localhost route is required for cleanup.
```


### v18.84 Report Cleanup Foundation Stage 11

A staged cleanup foundation was added so TrackFlow report data can be safely cleaned across B2, Vercel Blob, Supabase, Firestore, Sheet rows, and linked outreach leads.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-cleanup/report-cleanup.ts
lib/supabase-admin.ts
lib/trackflow-storage/b2.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Default cleanup mode is dry-run; no delete/update happens unless dryRun:false is explicitly sent.
Confirmed cleanup requires a clear confirmation string so accidental destructive requests are blocked.
The cleanup manifest is built before deleting anything, so B2 keys, Blob image targets, report token, domain indexes, Sheet row, and lead references are captured first.
Real cleanup writes cleanup_jobs/{jobId} with each service step and status.
B2 PDF deletion uses the existing private Backblaze B2 helper.
Vercel Blob cleanup targets only likely Blob preview/OG image URLs or pathnames, not arbitrary URLs.
Supabase chat cleanup is optional and skipped cleanly when Supabase server env is not configured.
Lead cleanup remains opt-in through leadMode and saves contact_memory before full lead delete.
Cron cleanup is dry-run/foundation-only in this stage.
```

Test checklist:

```text
npm run build
npm run dev
GET /api/trackflow/cleanup/report?token=TEST_TOKEN
POST /api/trackflow/cleanup/report with dryRun:true
Review the returned manifest and planned steps
Use only a fake/test report for dryRun:false
Confirm cleanup_jobs entry appears after confirmed cleanup
Confirm secure report is marked cleaned/deleted as expected
Confirm B2/Blob/Supabase steps report skipped/ok/error clearly
```




### v18.83 Dashboard Leads Panel Split Stage 10

The lead management tab UI was moved out of `page.tsx` into `LeadsPanel.tsx` without changing lead cache, filtering, selection, archive/trash/restore, or permanent-delete behavior.

Changed files:

```text
page.tsx
LeadsPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
LeadsPanel owns only the visual UI: lead filters, summary cards, bulk action bar, lead table, selection checkboxes, engagement cells, and row action buttons.
`page.tsx` still owns lead-store wiring, refresh/fetch-more calls, selectedLeadIds state, bulk action handlers, destructive lead action handlers, and the selected lead drawer.
No API URLs, Firestore fields, request payloads, Zustand state shape, archive/trash/restore/permanent-delete behavior, or lead drawer behavior should change.
The lead drawer remains in page.tsx and can be split later in a separate patch if needed.
```


### v18.82 Dashboard Outreach Panel Split Stage 9

The outreach composer tab UI was moved out of `page.tsx` into `OutreachPanel.tsx` without changing send, schedule, duplicate, cooldown, or draft behavior.

Changed files:

```text
page.tsx
OutreachPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
OutreachPanel owns only the visual UI: sender cards, report link inputs, duplicate/cooldown/draft warnings, composer fields, WYSIWYG editor, signature toggle, schedule/send controls, live preview, and quality checklist.
`page.tsx` still owns local outreach state, draft restore/save, duplicate/contact-memory checks, template selection, merge-tag insertion, validation, and send/schedule action handlers.
No Brevo/API URLs, request payloads, sender config, report-link validation, duplicate/cooldown safety, Firestore fields, Sheet behavior, or stored dashboard state should change.
The visible draft auto-save helper text is now English-only.
```


### v18.81 Dashboard Sheet Queue Panel Split Stage 8

The Google Sheet queue tab UI was moved out of `page.tsx` into `SheetQueuePanel.tsx` without changing Sheet loading, queueing, or tracking-sync behavior.

Changed files:

```text
page.tsx
SheetQueuePanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
SheetQueuePanel owns only the Google Sheet visual UI: summary cards, filters, refresh/queue/sync buttons, readiness status, report link display, and lead table.
`page.tsx` still owns Sheet API calls, auth headers, local outreach form handoff, selected row state, queue/sync action handlers, and Zustand state wiring.
No Sheet API URLs, request payloads, Google Sheet columns, readiness rules, queue behavior, Firestore tracking sync behavior, or stored dashboard state should change.
The split is intentionally small because Sheet queue sends can affect real outreach.
```

### v18.79 Dashboard Cleanup Panel Split Stage 6

The cleanup tab UI was moved out of `page.tsx` into `CleanupPanel.tsx` without changing cleanup action behavior.

Changed files:

```text
page.tsx
CleanupPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
CleanupPanel owns only the cleanup visual UI: bucket tabs, summary cards, action buttons, policy/status display, and cleanup candidate table.
`page.tsx` still owns auth headers, cleanup API calls, delete/skip/protect action handlers, Zustand state wiring, and lead refresh behavior.
No cleanup API URLs, request payloads, Firestore fields, Sheet behavior, or contact_memory footprint behavior changed.
The split is intentionally small because cleanup actions are destructive and should remain stable while the dashboard is being modularized.
```

### v18.78 Dashboard Analytics Panel Split Stage 5

The analytics tab was split into a dedicated visual component after the overview panel worked locally. The main dashboard page remains the shell and continues to own state wiring and tab routing.

Changed files:

```text
page.tsx
AnalyticsPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Only the analytics visual panel was extracted.
AnalyticsPanel owns open/click/reply/bounce cards, Google Postmaster display, and sender performance display.
Google Postmaster loading still comes from the existing useFollowupAdmin hook through page.tsx.
No API route URLs, request payloads, Firestore fields, Sheet columns, Brevo behavior, sender config, or stored dashboard state should change.
Do not split the outreach composer, automation editor, cleanup manager, sheet queue, or lead table in the same patch.
```

### v18.77 Dashboard Overview Panel Split Stage 4

The second visual dashboard panel was split after the scheduled panel worked locally. The overview tab now lives in a dedicated component while the main dashboard page remains the shell.

Changed files:

```text
page.tsx
OverviewPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Only the overview visual panel was extracted.
The overview panel receives existing dashboard state and action functions from page.tsx.
Follow-up summary, Firebase usage, system cleanup, hot lead selection, and tab navigation behavior should remain unchanged.
No API route URLs, request payloads, Firestore fields, Sheet columns, Brevo behavior, or stored dashboard state should change.
Do not split the outreach composer, automation editor, cleanup manager, sheet queue, or lead table in the same patch.
```

### v18.76 Dashboard Scheduled Panel Split Stage 3

The first visual dashboard panel was split after helpers and action hooks were stable. The scheduled email tab UI now lives in a dedicated component while the main dashboard page remains the shell.

Changed files:

```text
page.tsx
ScheduledPanel.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Only the scheduled email visual panel was extracted.
Scheduled-email behavior still comes from hooks/useScheduledEmails.ts.
The scheduled table, edit drawer, WYSIWYG editor, cancel, send-soon, save, and refresh controls should behave the same.
No API route URLs, request payloads, Firestore fields, Sheet columns, Brevo behavior, or stored dashboard state should change.
Do not split all remaining panels at once; continue one visual panel at a time.
```

### v18.74 Dashboard Helper Split Stage 1

The email automation dashboard `page.tsx` was split safely by moving non-UI types and helper logic into local helper files while keeping the existing dashboard UI and route behavior unchanged.

Changed files:

```text
page.tsx
types.ts
constants.ts
utils.ts
sheet-readiness.ts
followup-utils.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Only non-UI helpers/types/constants were moved in this stage.
The dashboard component, tabs, state wiring, API calls, Firestore reads, Sheet behavior, Brevo behavior, and cleanup actions should behave the same.
The new helper files should be placed in the same folder as the dashboard page.tsx.
The updated page uses relative imports like ./types and ./utils to avoid depending on the exact route folder name.
Panel/component splitting is intentionally deferred to a later patch after this helper split builds cleanly.
```

Test checklist:

```text
npm run build
npm run dev
Open the email automation dashboard
Check Overview, Sheet Queue, Outreach, Scheduled, Leads, Cleanup, Automation, and Analytics tabs
Send/save a test draft only if safe
Load scheduled emails
Load follow-up summary
Load cleanup candidates
Confirm Sheet readiness labels still appear
Confirm no TypeScript import errors from the new helper files
```


### v18.75 Dashboard Action Hook Split Stage 2

The dashboard was split further by moving scheduled-email actions, system health/usage actions, and follow-up admin actions into dedicated hooks without changing UI behavior.

Changed files:

```text
page.tsx
hooks/useScheduledEmails.ts
hooks/useSystemStatus.ts
hooks/useFollowupAdmin.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The dashboard visual layout was intentionally not redesigned in this stage.
Existing API URLs, request payloads, Firestore fields, Sheet columns, Brevo behavior, and stored Zustand state are preserved.
The main page.tsx still owns tab rendering and local compose state.
New hooks are responsible only for action/loading logic and receive the existing state/setters from page.tsx.
```

### v18.73 TrackFlow API Modularization Stage 1

The first backend modularization patch moved shared helper logic out of the giant `app/api/trackflow/[...action]/route.ts` file without changing route behavior or dashboard UI.

Changed files:

```text
app/api/trackflow/[...action]/route.ts
lib/trackflow-api/core.ts
lib/trackflow-api/security.ts
lib/trackflow-email/sender-selection.ts
lib/trackflow-email/contact-memory.ts
lib/trackflow-email/suppression.ts
lib/trackflow-email/email-events.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The catch-all route still owns dispatch and existing route paths.
Shared response/env/time/url/html helpers now live in lib/trackflow-api/core.ts.
Admin/cron/webhook/unsubscribe security helpers now live in lib/trackflow-api/security.ts.
Sender selection, contact memory, suppression, and email event logging are separated under lib/trackflow-email/.
Dashboard UI was intentionally not touched in this patch.
No email automation behavior, Firestore field shape, Sheet column shape, Brevo behavior, report register behavior, or B2/Blob storage behavior should change.
```

### v18.72 Backblaze B2 Private PDF + Vercel Blob OG Hybrid Patch

PDF storage was moved from Vercel Blob to private Backblaze B2 while keeping OG/LinkedIn preview images on Vercel Blob.

Changed files:

```text
app/api/export/blob-reports/route.ts
lib/trackflow-storage/b2.ts
lib/trackflow-api/report-normalizers.ts
lib/trackflow-api/reports.ts
app/api/trackflow/[...action]/route.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
PDF reports are uploaded to private Backblaze B2 from the local Next.js export route.
OG/LinkedIn preview images remain on Vercel Blob because social crawlers need public image URLs.
Firestore stores the B2 object key/provider metadata and public Blob preview URLs, not B2 credentials.
The secure report page continues to use internal preview/download routes, so page.tsx does not need direct B2 knowledge.
The B2 helper file must live in the Next.js app root at lib/trackflow-storage/b2.ts, not inside python-backend/.
The local Next.js dashboard app and the Vercel production app both need B2 env values.
Cron cleanup was intentionally deferred for a later patch.
```

Test checklist:

```text
npm run build
npm run dev
Create a test secure report
Confirm PDF uploads to B2
Confirm OG/preview image uploads to Vercel Blob
Confirm secure page PDF iframe preview works
Confirm Open PDF and Download PDF work
Confirm Firestore stores B2 key/provider fields and Blob preview URL fields
Confirm LinkedIn preview image still resolves from the public Blob URL
```

### v18.71 Intent-Safe Chat Answer Engine Patch

Secure report chatbot answer generation was tightened so suggested questions and answers stay aligned by intent.

Changed files:

```text
lib/trackflow-ai/report-chat.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
The answer engine must detect question intent before using a generic fallback.
Phone-call questions must receive phone-call tracking answers.
Form-submission questions must receive form/enquiry tracking answers.
Booking, ecommerce, GA4, GTM, Google Ads, Meta, server-side, no-clear-event, score, evidence, and account-access questions each have their own evidence-safe deterministic answer path.
If a topic is not clearly proven in the saved report, the assistant should say what can and cannot be confirmed and then give the correct verification test.
Do not answer every question with the same lead-form template.
```

### v18.69 Smart Chat Suggestions UX Patch

Secure report chatbot question suggestions were made smarter and less intrusive.

Changed files:

```text
app/components/trackflow/ReportChatAssistant.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Closed-state quick questions must be compact pill chips only, without a large card/background that blocks report content.
The chat should hide questions the visitor already asked.
Starter questions and follow-up questions should rotate to the next most helpful report-aware question.
Follow-up chips should be contextual to the assistant answer when possible, for example Google Ads, GA4/GTM, lead path, account access, or safest next step.
The bottom-right chat button still shows the online/active status, and the compact chips should invite conversation without making the page harder to read.
```

### v18.70 Dynamic Report-Aware Chat Questions Patch

Secure report chatbot question suggestions were moved into a dedicated dynamic builder so each secure report can show the most relevant next questions.

Changed files:

```text
app/components/trackflow/reportChatQuestions.ts
app/components/trackflow/ReportChatAssistant.tsx
app/tracking-review/[domainSlug]/[token]/page.tsx
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Question chips must be report-aware, not hardcoded for one PDF or one score.
The secure page passes compact report context into the chatbot.
The chatbot builder hides already-asked questions and returns closed, starter, and follow-up question sets.
No Zustand/global store is needed because this is local chatbot UI state plus report props.
Supabase history, localStorage fallback, typing animation, formatted answers, and auto-growing input are preserved.
```


### v18.68 Premium Chat Readability and Input Patch

Secure report chatbot UX was improved so the floating messenger feels more premium and easier to use.

Changed files:

```text
app/components/trackflow/ReportChatAssistant.tsx
app/api/trackflow/report-chat/route.ts
PROJECT_CONTEXT_README.md
```

Important decisions:

```text
Assistant answers should render as structured chat content instead of plain wall text.
The UI should support short section labels, bullets, numbered steps, and important-note style blocks.
Closed state may show smart quick-question chips above the main chat button.
Open state should show starter questions before the first user question and contextual follow-up questions after replies.
The text input should auto-grow while typing, support Shift+Enter for a new line, and Enter to send.
The route may add formatting guidance to Gemini, but evidence-safe validation and Supabase logging remain unchanged.
```



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
- **v18.47** — secure report Gemini assistant context and optional Supabase logging documented.
- **v18.48** — secure report streaming chatbot patch with Node.js runtime and quota fallback.
- **v18.49** — secure report responsive UI/UX polish for mobile, tablet, and desktop.
- **v18.50** — chatbot answer-quality patch: deterministic key answers, TrackFlow Pro identity handling, incomplete answer repair, and Supabase logging compatibility.
- **v18.51** — chatbot English client-output patch; mixed Bengali/internal evidence notes are rewritten/omitted before client display.
- **v18.47** — secure report Gemini assistant context; report-aware, evidence-safe, Supabase optional chat logging.
- **v18.48** — streaming secure report assistant route using Node.js runtime with Gemini fallback behavior.
- **v18.49** — secure report responsive UX polish for desktop, tablet, and mobile; PDF mobile compact card and clearer chatbot layout.
- **v18.47** — secure report Gemini chat assistant plan/files: report-aware assistant on private tracking-review pages, quota fallback, optional Supabase chat-history logging, Firestore remains slim.

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
   - optional report-aware chat assistant.
   - CTA.

5. Database should stay slim:
   - PDF/OG/secure page fields only.
   - no raw email/LinkedIn copy unless intentionally added.
   - no chatbot history in `audit_reports`; use Supabase for chat logs if needed.

6. README should be updated with every future patch.

7. Future cleanup should be added in a separate patch:
   - daily or scheduled cron route.
   - delete expired B2 PDFs after the configured retention window.
   - optionally delete Blob OG images.
   - optionally delete Supabase chat history.
   - mark cleanup status in Firestore instead of blindly deleting the report metadata.

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


### v18.54 LeadList Desktop UX Cleanup Patch

The LeadList dashboard remains desktop-first and keeps all existing features. The goal of this patch is not to remove functionality, but to make daily operator use less crowded.

Changed files:

```text
app/components/LeadList.tsx
app/components/LeadList/LeadRow.tsx
app/components/LeadList/LinkedInAuditPanel.tsx
app/components/LeadList/Badge.tsx
app/components/LeadList/rowHelpers.tsx
app/components/LeadList/types.ts
PROJECT_CONTEXT_README.md
```

Important UX decisions:

```text
No backend, audit API, report export, Firestore, or Python behavior changed.
All existing actions remain available: Run Audit, Cancel Audit, Safe/Live/Off form mode, Ads Transparency, Primary Conversion, Visual Focus, PDF, Polish Report, Details modal, Secure Report, manual LinkedIn audit, and bulk/export actions.
Default LeadRow view is cleaner: primary action buttons are visible first, while form mode, report focus, visual focus, and Ads Transparency live inside Advanced audit settings.
Manual LinkedIn audit panel is English-only and easier to follow: context, audit mode, optional notes, run audit, and result actions are grouped more clearly.
Dashboard copy should remain English-only for US/UK workflow use.
```

Use this file group when:

```text
LeadList feels too crowded
Row action area is hard to understand
Manual LinkedIn audit panel is confusing
Dashboard UX needs desktop polish without changing audit logic
```


### 3.30 Dashboard Resilient Report Cleanup Rule

The cleanup dashboard must not stop the whole delete/archive flow because one optional external file or log is already missing.

Required behavior:

```text
Dashboard report cleanup
→ tries every cleanup step independently
→ missing B2 PDF becomes Already removed / skipped safely
→ missing Vercel Blob preview image becomes Already removed / skipped safely
→ missing Supabase chat becomes Nothing to remove / skipped safely
→ missing Google Sheet row becomes Skipped safely
→ Firestore report/contact cleanup continues when optional storage cleanup fails
→ cleanup_jobs logging must not crash the cleanup response
```

Important decisions:

```text
A single missing optional asset must not return Internal Server Error.
All cleanup step results should be saved without undefined Firestore fields.
If cleanup_jobs logging fails, the cleanup action should still return the step results.
Not contacted = Delete test contact, no memory is allowed.
Contacted = no-memory delete is blocked; use Delete contact, keep safety memory.
```

Current stage-14E structure:

```text
lib/trackflow-cleanup/report-cleanup.ts
→ stripUndefinedDeep for Firestore-safe cleanup_jobs payloads
→ independent runCleanupStep wrapper for each external cleanup step
→ B2/Blob already-missing errors become completed cleanup steps
→ cleanup job create/finish failures are logged but do not crash the dashboard

page.tsx
→ cleanup API response parsing is more resilient when the server returns non-JSON error text

CleanupPanel.tsx
→ contact/sheet labels are simplified for operator-friendly dashboard use
```

### 3.31 Dashboard Cleanup Contact Badge Rule

The cleanup dashboard should not duplicate the full Leads tab, but it must show enough contact status to prevent unsafe delete decisions.

Required behavior:

```text
Cleanup tab secure report list
→ shows a small contact badge for each secure report
→ Not contacted means test/no outreach data is safe for no-memory cleanup
→ Email sent/opened/clicked/replied means safety memory should be kept
→ LinkedIn sent/manual contact should be visible without requiring the Leads tab
→ detailed tracking history remains in the Leads tab
→ View in Leads button opens the detailed lead view/filter
```

Important decisions:

```text
Cleanup tab = cleanup decision view
Leads tab = detailed email/open/click/reply tracking view
Do not show every tracking event in Cleanup tab.
Do show enough warning before Archive/Delete Test Data.
The secure reports list endpoint may enrich rows from linked outreach_leads when leadId is available.
```

Current stage-14F-A structure:

```text
lib/trackflow-cleanup/report-cleanup.ts
→ secure reports list rows include contactStatus, contactStatusLabel, contactReason, sent/open/click summary, and linkedLeadFound

page.tsx
→ Cleanup tab can jump to Leads tab with a matching search value via View in Leads

CleanupPanel.tsx
→ secure report rows show Contact badge and View in Leads action

types.ts
→ SecureReportContactStatus and contact summary fields added to SecureReportRow
```

