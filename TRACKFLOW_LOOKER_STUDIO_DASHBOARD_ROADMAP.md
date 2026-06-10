# TrackFlow Pro — Looker Studio Secure Page Dashboard Roadmap

**Version:** v1.1-secure-duration-ga4-params  
**Last updated:** 2026-06-10  
**Purpose:** এই markdown file যেকোনো ChatGPT / developer / analytics helper-কে দিলে সে TrackFlow Pro secure page tracking system এবং Looker Studio dashboard goal বুঝতে পারবে—আলাদা করে code file না দিলেও।


---

## Latest Update — v1.1 Secure Report Duration + GA4 Parameter Handoff

This update documents exactly which secure-report data is passed from the website to GA4 and how a future assistant should help when the owner asks:

```text
এই data আমার secure page-এর dashboard-এ দেখতে চাই
```

Important rule for future assistants:

```text
First solve from GA4 + Looker Studio setup.
Do not ask for code files immediately unless GA4 DebugView does not receive the event, the parameter is missing from fresh events, or `/api/report-event` / `/api/server-track` is failing.
```

Current secure-report behavior events are sent from the browser through:

```text
SecureReportAnalytics
→ /api/report-event
→ GA4 Measurement Protocol
```

Fallback/general tracking can use:

```text
/api/server-track
```

The secure page can now send custom active-duration parameters:

```text
time_on_report_seconds
time_on_report_milliseconds
time_on_report_delta_seconds
time_on_report_delta_milliseconds
duration_event_type
```

Recommended GA4 custom metrics:

| GA4 custom metric name | Event parameter | Type | Best Looker Studio use |
|---|---|---|---|
| Time on Report Seconds | `time_on_report_seconds` | Number | Use `MAX()` per visitor/session |
| Time on Report Delta Seconds | `time_on_report_delta_seconds` | Number | Use `SUM()` per visitor/session |
| Time on Report Milliseconds | `time_on_report_milliseconds` | Number | Optional/debug |
| Time on Report Delta Milliseconds | `time_on_report_delta_milliseconds` | Number | Optional/debug |

Recommended GA4 custom dimension:

| GA4 custom dimension name | Event parameter | Why needed |
|---|---|---|
| Duration Event Type | `duration_event_type` | Shows whether the duration event was heartbeat, hidden, unload, or final-style send |

Recommended duration event name:

```text
secure_report_duration
```

Expected behavior:

```text
Visitor opens secure report
→ secure_report_view fires

Visitor keeps page visible
→ active time counts only while the page is visible

Every 30 seconds while active
→ secure_report_duration fires with cumulative and delta time

Visitor switches tab / hides page / closes page
→ secure_report_duration fires again with latest time where browser allows sendBeacon/fetch
```

Dashboard interpretation:

```text
Use MAX(time_on_report_seconds) to answer:
“How long did this visitor actively keep the secure report open?”

Use SUM(time_on_report_delta_seconds) to answer:
“How many active seconds were collected across duration heartbeat events?”
```

If Looker Studio does not allow changing aggregation directly on the GA4 metric, create calculated fields:

```text
Max Time on Report Seconds = MAX(time_on_report_seconds)
Total Time on Report Seconds = SUM(time_on_report_delta_seconds)
Time on Report Minutes = MAX(time_on_report_seconds) / 60
```

Important data freshness rule:

```text
GA4 custom definitions only populate for fresh events after the definitions are created.
Old secure-report events will not backfill the new duration metrics.
```


---

## 0. এই file পড়া assistant-এর জন্য নির্দেশনা

এই document-এর goal হলো **Looker Studio dashboard design + GA4 reporting setup** বুঝানো।  
এটি code patch request না। প্রথমে code চাইবেন না।

যদি user বলে:

> “আমি Looker Studio dashboard বানাতে চাই”  
> “Client secure page-এ কী করছে এক নজরে দেখতে চাই”  
> “GA4 event দিয়ে dashboard design করতে চাই”

তাহলে এই document অনুযায়ী dashboard structure, GA4 custom definitions, calculated fields, tables, charts, filters, and beginner setup steps explain করুন।

Code file শুধু তখন চাইবেন যখন:

1. GA4 DebugView / Realtime-এ fresh event আসছে না।
2. Fresh event-এ expected event parameter missing।
3. secure page click/PDF/chat/video/duration tracking কাজ করছে না।
4. `/api/report-event` বা `/api/server-track` response fail করছে।
5. GA4-তে event parameter আছে কিন্তু Looker Studio data source refresh করার পরও field দেখা যাচ্ছে না।
6. User confirms deploy হয়েছে, new test traffic পাঠানো হয়েছে, তবুও parameter blank/zero।

---

## 1. Project context

Project name: **TrackFlow Pro**

TrackFlow Pro একটি tracking audit + secure report + outreach analytics system.

Main flow:

```text
Local/Python audit
→ client-friendly tracking audit PDF
→ private secure report page
→ client opens secure page
→ page behavior is tracked
→ GA4 receives first-party secure-report events
→ Looker Studio dashboard shows what the client did
```

Secure page URL pattern:

```text
/tracking-review/{domainSlug}/{token}
```

Main dashboard goal:

```text
একজন prospect/client secure report page খুলে কী করেছে তা এক নজরে দেখা:
- page open করেছে কি না
- কতটা পড়েছে
- PDF open/download করেছে কি না
- chatbot খুলেছে কি না
- chatbot-এ question করেছে কি না
- evidence video দেখেছে কি না
- booking/email/LinkedIn CTA click করেছে কি না
- client কতটা interested / hot
```

Dashboard should be simple, sales/follow-up friendly, not highly technical.

---

## 2. Tracking architecture summary

Current secure page behavior tracking has these layers:

### 2.1 Secure page component

Secure report page loads:

```text
ReportViewBeacon
ReportServedPixel
SecureReportAnalytics
ReportChatAssistant
PDF preview/download UI
Booking/email/LinkedIn redirect links
Optional YouTube evidence video iframe
```

### 2.2 Main analytics component

`SecureReportAnalytics` sends first-party behavior events.

Important behavior:

```text
Browser event
→ /api/report-event
→ server normalizes payload
→ server forwards event to GA4 Measurement Protocol
→ fallback can use /api/server-track
```

Important privacy/security decision:

```text
Raw report token should not be exposed to GA4.
A hashed report_id is used instead.
```

Privacy behavior:

```text
Respect Global Privacy Control / Do Not Track when enabled.
Tracking should never break the client page experience.
```

### 2.3 Server-side routes

Primary route:

```text
/api/report-event
```

Purpose:

```text
Receives secure-report events
Normalizes event payload
Adds journey/intent metadata if needed
Forwards event to GA4 Measurement Protocol
GET route can also return transparent GIF for server-pixel style event
```

Fallback/general route:

```text
/api/server-track
```

Purpose:

```text
General page/click tracking
Captures page, UTM, device/browser style context
Can send via sendBeacon/fetch
Can support GA4 and optional Meta CAPI type tracking
```


### 2.4 Current website → GA4 parameter flow

Secure page browser-side events should carry these groups of data.

Identity/grouping parameters:

```text
report_id
domain_slug
company_name
visitor_id
report_visitor_id
report_session_id
ga_session_id
anonymous_id
```

Journey/intent parameters:

```text
visit_stage
journey_step
intent_level
intent_score
is_core_event
event_section
button_label
```

Content/action parameters:

```text
event_name
click_href
question_key
question_source
message_length
video_id
video_progress
scroll_percent
primary_action_label
primary_page_label
```

Duration parameters:

```text
time_on_report_seconds
time_on_report_milliseconds
time_on_report_delta_seconds
time_on_report_delta_milliseconds
duration_event_type
```

Environment/debug parameters:

```text
page_location
page_path
page_title
referrer
utm_source
utm_medium
utm_campaign
gclid
fbclid
msclkid
timezone
language
viewport
screen
device_type
visitor_country
visitor_region
visitor_city
transport
```

Do not expose raw `token` in GA4 reports. Use `report_id`, `domain_slug`, and `report_visitor_id` for reporting.

---

## 3. Main identity model

The dashboard should not depend on raw `token`.

Use these identifiers:

| Field | Meaning | Use in Looker Studio |
|---|---|---|
| `report_id` | Hashed report identifier generated from token | Safe report grouping |
| `domain_slug` | Website/report slug | Client website filter |
| `company_name` | Client/prospect display name | Human-friendly table |
| `visitor_id` | Anonymous browser visitor label | Visitor count |
| `report_visitor_id` | Same report + same anonymous visitor | Best visitor grouping field |
| `report_session_id` | One secure-report visit session | Session-level activity |
| `ga_session_id` | GA4-style session id | GA4 compatibility |
| `anonymous_id` | First-party anonymous id | Internal/fallback identity |

Recommended dashboard grouping:

```text
Primary table grouping:
company_name + domain_slug + report_visitor_id
```

Do not group by raw `token` in GA4/Looker Studio.

---

## 4. Important event names and business meaning

Use these events for dashboard logic.

### 4.1 Page/view events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_served` | Secure report HTML was served / server pixel loaded | Low |
| `secure_report_view` | Secure page viewed by visitor | Low |
| `page_view` | General page view from server-track | Low |

### 4.2 Reading / scroll events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_scroll_50` | Visitor read about halfway | Low/Medium |
| `secure_report_scroll_90` | Visitor reached deep page area | Medium |

### 4.3 PDF events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_pdf_preview_visible` | PDF preview area became visible | Medium |
| `secure_report_pdf_open_click` | Visitor opened PDF in new tab | Medium |
| `secure_report_pdf_download_click` | Visitor downloaded PDF | High |

PDF download is a strong signal because the visitor wanted to keep/review the audit.

### 4.4 Chat assistant events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_assistant_open` | Visitor opened the report chatbot | Medium |
| `secure_report_assistant_question_click` | Visitor clicked a suggested question | Medium |
| `secure_report_assistant_message_sent` | Visitor sent a question/message | High |

Chat message sent is a strong signal because the visitor is actively trying to understand the report.

### 4.5 Evidence video events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_evidence_video_visible` | Video area visible | Medium |
| `secure_report_evidence_video_start` | Visitor started evidence video | Medium |
| `secure_report_evidence_video_progress_25` | Watched 25% | Medium |
| `secure_report_evidence_video_progress_50` | Watched 50% | Medium |
| `secure_report_evidence_video_progress_75` | Watched 75% | High |
| `secure_report_evidence_video_complete` | Completed video | High |

### 4.6 CTA/contact events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_booking_section_click` | Visitor clicked/visited booking section | High |
| `secure_report_booking_click` | Visitor clicked booking/Calendly CTA | Hot |
| `secure_report_email_click` | Visitor clicked email reply CTA | High |
| `secure_report_linkedin_click` | Visitor clicked LinkedIn CTA | High |
| `secure_report_cta_click` | Generic CTA click | High |

Booking click is the hottest signal.


### 4.7 Duration / active-time events

| Event name | Meaning | Intent |
|---|---|---|
| `secure_report_duration` | Visitor actively kept the secure report visible/open for a measurable period | Reading/engagement signal |

Duration parameters:

| Parameter | Meaning | Recommended use |
|---|---|---|
| `time_on_report_seconds` | Cumulative active visible time for that visitor/session/report | Use `MAX()` in visitor summary |
| `time_on_report_milliseconds` | Same as above in milliseconds | Optional/debug |
| `time_on_report_delta_seconds` | Active seconds since the last duration send | Use `SUM()` if MAX is not available |
| `time_on_report_delta_milliseconds` | Same as above in milliseconds | Optional/debug |
| `duration_event_type` | Why the duration event was sent, for example heartbeat/hidden/unload | Debugging and timeline context |

Business meaning:

```text
A visitor who only opens the page for a few seconds is softer interest.
A visitor who stays 60–180+ active seconds is likely reading.
A visitor who stays longer and also downloads PDF / asks chatbot / clicks booking is stronger follow-up priority.
```

---

## 5. Journey metadata model

The tracking system sends or derives journey metadata.

Important fields:

| Field | Example | Meaning |
|---|---|---|
| `visit_stage` | `view`, `reading`, `pdf`, `chat`, `video`, `contact`, `booking` | Visitor journey stage |
| `journey_step` | `01_report_viewed`, `04_pdf_downloaded`, `08_booking_clicked` | Ordered activity step |
| `intent_level` | `low`, `medium`, `high`, `hot` | Sales intent label |
| `intent_score` | `10`, `25`, `75`, `80`, `95` | Numeric priority score |
| `is_core_event` | `true` / `false` | Whether this action matters strongly |

Recommended business interpretation:

| Activity | Intent score | Intent level |
|---|---:|---|
| Page viewed | 10 | Low |
| 50% scroll | 25 | Low |
| 90% scroll | 40 | Medium |
| PDF open / PDF preview | 45 | Medium |
| Assistant open / suggested question | 55 | Medium |
| Evidence video start/progress | 50 | Medium |
| PDF download | 75 | High |
| Chat message sent | 80 | High |
| Email/LinkedIn click | 85 | High |
| Booking click | 95 | Hot |

---

## 6. Event parameters / data dictionary

These are the main parameters that should be registered in GA4 and used in Looker Studio.

### 6.1 Event-scoped custom dimensions

Create these in GA4:

| GA4 custom dimension name | Event parameter | Why needed |
|---|---|---|
| Report ID | `report_id` | Report-level grouping |
| Domain Slug | `domain_slug` | Website/client grouping |
| Company Name | `company_name` | Human-readable client name |
| Visitor ID | `visitor_id` | Anonymous visitor grouping |
| Report Visitor ID | `report_visitor_id` | Best field for “same visitor on same report” |
| Report Session ID | `report_session_id` | Session-level journey |
| Visit Stage | `visit_stage` | Funnel stage |
| Journey Step | `journey_step` | Ordered step |
| Intent Level | `intent_level` | Low/medium/high/hot |
| Event Section | `event_section` | page/pdf/chat/video/booking |
| Button Label | `button_label` | Which button/question was clicked |
| Question Key | `question_key` | Chat question category |
| Question Source | `question_source` | manual/suggested |
| Device Type | `device_type` | Desktop/mobile/tablet if available |
| Video ID | `video_id` | Evidence video grouping |
| Primary Action Label | `primary_action_label` | CTA/report context |
| Primary Page Label | `primary_page_label` | Usually Secure tracking review |
| Duration Event Type | `duration_event_type` | Why active-duration event was sent |

### 6.2 Event-scoped custom metrics

Create these in GA4:

| GA4 custom metric name | Event parameter | Type |
|---|---|---|
| Intent Score | `intent_score` | Number |
| Scroll Percent | `scroll_percent` | Number |
| Video Progress | `video_progress` | Number |
| Message Length | `message_length` | Number |
| Time on Report Seconds | `time_on_report_seconds` | Number |
| Time on Report Delta Seconds | `time_on_report_delta_seconds` | Number |
| Time on Report Milliseconds | `time_on_report_milliseconds` | Number |
| Time on Report Delta Milliseconds | `time_on_report_delta_milliseconds` | Number |

### 6.3 Optional/debug parameters

Use carefully. These can be high-cardinality.

| Parameter | Use |
|---|---|
| `click_href` | Debug which link was clicked |
| `page_location` | Full page URL |
| `page_path` | Path only |
| `utm_source` | Campaign/source |
| `utm_medium` | Campaign medium |
| `utm_campaign` | Campaign name |
| `gclid`, `fbclid`, `msclkid` | Ad click attribution |
| `timezone`, `language`, `viewport`, `screen` | Device/browser context |

Do not overuse full URL fields in main dashboard tables because they can make reports messy.


### 6.4 Practical GA4 parameter dictionary by dashboard question

Use this table when the owner asks “এই data secure page dashboard-এ দেখতে চাই”.

| Dashboard question | Primary dimensions | Primary metrics | Filter/event logic |
|---|---|---|---|
| Which client opened the secure report? | `company_name`, `domain_slug`, `report_visitor_id` | Event count | Event name = `secure_report_view` |
| Which visitor stayed longest? | `company_name`, `domain_slug`, `report_visitor_id`, `report_session_id` | `MAX(time_on_report_seconds)` | Event name = `secure_report_duration` |
| How many active seconds did a visitor spend? | `report_visitor_id`, `report_session_id` | `SUM(time_on_report_delta_seconds)` | Event name = `secure_report_duration` |
| Which visitors downloaded PDF? | `company_name`, `report_visitor_id` | Event count | Event name = `secure_report_pdf_download_click` |
| Which visitors asked chatbot questions? | `company_name`, `report_visitor_id`, `question_key`, `question_source` | Event count, `message_length` | Event name = `secure_report_assistant_message_sent` |
| Which visitors watched evidence video? | `company_name`, `report_visitor_id`, `video_id` | `video_progress`, Event count | Event name contains `secure_report_evidence_video` |
| Which visitors clicked booking? | `company_name`, `report_visitor_id` | Event count, `intent_score` | Event name = `secure_report_booking_click` |
| Which visitor is hottest? | `company_name`, `domain_slug`, `report_visitor_id` | `MAX(intent_score)`, Event count | Use intent + core event fields |
| Which page/source campaign produced activity? | `domain_slug`, `utm_source`, `utm_medium`, `utm_campaign` | Event count | Use UTM parameters if present |
| Which device/country engaged? | `device_type`, `visitor_country`, `visitor_region`, `visitor_city` | Event count, duration metrics | Use geo/device fields |

Recommended table grouping for most reports:

```text
company_name
domain_slug
report_visitor_id
report_session_id
visitor_country
device_type
```

Recommended metrics for most reports:

```text
Event count
MAX(intent_score)
MAX(time_on_report_seconds)
SUM(time_on_report_delta_seconds)
```

---

## 7. GA4 setup checklist

Before Looker Studio dashboard:

1. Open GA4 property used by TrackFlow Pro.
2. Go to:
   ```text
   Admin → Data display → Custom definitions
   ```
3. Create event-scoped custom dimensions from section 6.1.
4. Create event-scoped custom metrics from section 6.2.
5. Wait for new data to appear. Custom definitions usually need fresh events after creation.
6. Test in GA4 DebugView / Realtime:
   ```text
   secure_report_view
   secure_report_pdf_download_click
   secure_report_assistant_message_sent
   secure_report_booking_click
   ```
7. After events are visible, connect GA4 property to Looker Studio.

Important:

```text
If old events happened before custom definitions were created, they may not populate custom fields historically.
Send new test traffic after custom definitions are added.
```

---

## 8. Looker Studio dashboard goal

Dashboard name:

```text
TrackFlow Pro — Secure Page Client Activity Dashboard
```

Main user:

```text
TrackFlow Pro operator / sales / follow-up person
```

Main question answered:

```text
Which client/prospect looked interested after opening the secure tracking review?
```

This dashboard should be:

```text
Simple
Fast to scan
Client-by-client
Intent-focused
Follow-up friendly
```

It should not be:

```text
Overly technical
GA4-expert only
Raw event dump only
Full of every possible parameter
```

---

## 9. Recommended dashboard pages

Create 4 pages.

---

# Page 1 — Overview / Command Center

Purpose:

```text
এক নজরে দেখা: কতজন secure page দেখেছে, কারা hot, কারা follow-up দরকার।
```

### Top controls

Add these filters at the top:

| Control | Field |
|---|---|
| Date range | Date |
| Company filter | `company_name` |
| Domain filter | `domain_slug` |
| Intent level filter | `intent_level` |
| Event section filter | `event_section` |

### Scorecards

Create scorecards:

| Scorecard title | Metric logic |
|---|---|
| Secure Page Views | Event count where event name = `secure_report_view` |
| Unique Report Visitors | Count distinct `report_visitor_id` |
| PDF Downloads | Event count where event name = `secure_report_pdf_download_click` |
| Chat Questions | Event count where event name = `secure_report_assistant_message_sent` |
| Booking Clicks | Event count where event name = `secure_report_booking_click` |
| Contact Clicks | Email + LinkedIn click events |
| Hot Visitors | Visitors where max `intent_score >= 90` |
| Average Intent Score | Average `intent_score` |
| Longest Active Time | Max `time_on_report_seconds` |
| Total Active Time | Sum `time_on_report_delta_seconds` |

### Main table: Client Activity Summary

Recommended columns:

```text
Company Name
Domain Slug
Report Visitor ID
Last Event Date/Time
Max Intent Score
Intent Level
Latest Journey Step
PDF Downloaded?
Chat Asked?
Booking Clicked?
Email/LinkedIn Clicked?
Max Time on Report Seconds
Total Time on Report Seconds
Device Type
```

Business interpretation:

```text
If PDF Downloaded + Chat Asked + Booking Clicked → follow up immediately.
If only page view → soft interest.
If PDF downloaded but no booking → follow up with helpful message.
If chatbot question sent → reply/follow up based on question topic.
```

---

# Page 2 — Client Journey Timeline

Purpose:

```text
একজন visitor secure page-এ step-by-step কী করেছে দেখা।
```

Use a table.

Dimensions:

```text
Date + Hour / Minute
Company Name
Domain Slug
Report Visitor ID
Event name
Journey Step
Visit Stage
Event Section
Button Label
Question Key
Question Source
```

Metrics:

```text
Event count
Intent Score
Time on Report Seconds
Time on Report Delta Seconds
```

Sort:

```text
Date/time ascending
```

Example journey:

```text
10:01 — secure_report_view — report viewed — score 10
10:02 — secure_report_scroll_50 — mid read — score 25
10:03 — secure_report_pdf_download_click — PDF downloaded — score 75
10:04 — secure_report_assistant_message_sent — chatbot question — score 80
10:06 — secure_report_booking_click — booking clicked — score 95
```

This page should answer:

```text
Did the client only open the page, or did they seriously engage?
```

---

# Page 3 — Engagement Details

Purpose:

```text
PDF, chatbot, video, and CTA actions আলাদা করে দেখা।
```

## 3.1 PDF section

Scorecards:

```text
PDF preview visible
PDF open clicks
PDF downloads
```

Table:

```text
Company Name
Report Visitor ID
Event name
Button Label
Date/time
Intent Score
```

## 3.2 Chat section

Scorecards:

```text
Assistant opened
Suggested question clicked
Manual/suggested messages sent
Total chat questions
```

Table:

```text
Company Name
Report Visitor ID
Question Key
Question Source
Message Length
Intent Score
Date/time
```

Business meaning:

```text
Chat question = strong buying/clarity intent.
Manual question is usually stronger than suggested-chip click.
```

## 3.3 Evidence video section

Scorecards:

```text
Video visible
Video start
Video 25%
Video 50%
Video 75%
Video complete
```

Table:

```text
Company Name
Video ID
Report Visitor ID
Video Progress
Event name
Date/time
```

Business meaning:

```text
Video 75% or complete = serious interest.
```

## 3.4 CTA/contact section

Scorecards:

```text
Booking clicks
Email clicks
LinkedIn clicks
Generic CTA clicks
```

Table:

```text
Company Name
Report Visitor ID
Event name
Button Label
Event Section
Intent Score
Date/time
```

Business meaning:

```text
Booking click = hottest intent.
Email/LinkedIn click = high intent.
```

---

# Page 4 — Hot Leads / Follow-up Priority

Purpose:

```text
কাকে আগে follow-up করবেন তা decide করা।
```

Main table columns:

```text
Lead Priority
Company Name
Domain Slug
Report Visitor ID
Max Intent Score
Highest Intent Level
Last Journey Step
PDF Downloaded?
Chat Asked?
Booking Clicked?
Last Activity Time
Recommended Follow-up
```

### Lead priority rules

| Priority | Rule |
|---|---|
| 🔥 Hot | Booking click OR max intent score >= 90 |
| High | Chat message sent OR PDF download OR email/LinkedIn click |
| Medium | PDF open OR assistant open OR deep video/scroll |
| Low | Only served/viewed/soft scroll |

Recommended follow-up examples:

| Visitor action | Suggested follow-up |
|---|---|
| Booking click | Confirm meeting / send calendar follow-up |
| Chat question | Reply around the exact question topic |
| PDF download | Ask if they want help verifying the issue live |
| Evidence video 75%+ | Mention the visual walkthrough and offer verification |
| Page view only | Light follow-up, no pressure |

---

## 10. Looker Studio calculated fields

These fields make the dashboard easier to read.

### 10.1 Lead Priority

```text
CASE
  WHEN Intent Score >= 90 THEN "🔥 Hot"
  WHEN Intent Score >= 75 THEN "High"
  WHEN Intent Score >= 55 THEN "Medium"
  ELSE "Low"
END
```

If Looker Studio requires aggregated logic, use Max Intent Score in the chart/table.

### 10.2 Journey Label

```text
CASE
  WHEN Event name = "secure_report_booking_click" THEN "Booked / clicked call"
  WHEN Event name = "secure_report_email_click" THEN "Clicked email reply"
  WHEN Event name = "secure_report_linkedin_click" THEN "Clicked LinkedIn"
  WHEN Event name = "secure_report_assistant_message_sent" THEN "Asked chatbot"
  WHEN Event name = "secure_report_pdf_download_click" THEN "Downloaded PDF"
  WHEN Event name = "secure_report_pdf_open_click" THEN "Opened PDF"
  WHEN Event name = "secure_report_scroll_90" THEN "Deep read"
  WHEN Event name = "secure_report_scroll_50" THEN "Mid read"
  WHEN Event name = "secure_report_view" THEN "Viewed report"
  ELSE "Other activity"
END
```

### 10.3 Core Action Flag

```text
CASE
  WHEN Event name IN (
    "secure_report_pdf_download_click",
    "secure_report_assistant_message_sent",
    "secure_report_booking_click",
    "secure_report_email_click",
    "secure_report_linkedin_click"
  ) THEN "Core action"
  ELSE "Soft signal"
END
```


### 10.5 Secure report duration calculated fields

Use these if Looker Studio does not let you change aggregation directly on GA4 custom metrics.

```text
Max Time on Report Seconds
```

Formula:

```text
MAX(time_on_report_seconds)
```

Use this in visitor/session summary tables.

```text
Total Time on Report Seconds
```

Formula:

```text
SUM(time_on_report_delta_seconds)
```

Use this when you want to total all duration heartbeat deltas.

```text
Time on Report Minutes
```

Formula:

```text
MAX(time_on_report_seconds) / 60
```

Use this for a more readable duration column.

```text
Time Quality
```

Formula:

```text
CASE
  WHEN MAX(time_on_report_seconds) >= 180 THEN "Strong read"
  WHEN MAX(time_on_report_seconds) >= 60 THEN "Meaningful read"
  WHEN MAX(time_on_report_seconds) >= 15 THEN "Short read"
  ELSE "Very short visit"
END
```

If Looker Studio rejects aggregate functions inside a calculated dimension, create the `MAX(time_on_report_seconds)` metric first, then use that metric in the chart/table rather than trying to classify it globally.


### 10.4 Follow-up Recommendation

```text
CASE
  WHEN Event name = "secure_report_booking_click" THEN "Follow up immediately: booking intent"
  WHEN Event name = "secure_report_assistant_message_sent" THEN "Follow up around chatbot question"
  WHEN Event name = "secure_report_pdf_download_click" THEN "Follow up: PDF downloaded"
  WHEN Event name = "secure_report_email_click" THEN "Follow up: email contact clicked"
  WHEN Event name = "secure_report_linkedin_click" THEN "Follow up on LinkedIn"
  ELSE "Monitor / light follow-up"
END
```

---

## 11. Suggested visual design

Use a clean dashboard style.

### Header

```text
TrackFlow Pro — Secure Page Activity
Subtitle: See what each prospect did after opening their private tracking review.
```

### Colors

Recommended meaning:

```text
Hot = red/orange
High = amber
Medium = blue
Low = gray
```

### Layout idea

```text
[Date Range] [Company] [Domain] [Intent Level]

[Secure Views] [Unique Visitors] [PDF Downloads] [Chat Questions] [Booking Clicks]

Hot Leads Table

Journey Funnel / Bar Chart

Recent Activity Table
```

Keep the first page very simple.

---

## 12. Beginner setup steps

### Step 1 — Confirm events are arriving

In GA4:

```text
Reports → Realtime
or
Admin/DebugView if using debug mode
```

Open a test secure report page and do:

```text
Open page
Scroll
Open PDF
Download PDF
Open chatbot
Send one question
Click booking/email
```

Confirm events appear.

### Step 2 — Create GA4 custom definitions

Create dimensions and metrics from section 6.

### Step 3 — Wait for fresh data

Send new test traffic after custom definitions are created.

### Step 4 — Connect Looker Studio

```text
Looker Studio
→ Blank report
→ Add data
→ Google Analytics
→ Select TrackFlow Pro GA4 property
→ Add to report
```


### Step 4.1 — Refresh fields in Looker Studio after adding GA4 custom definitions

After creating new GA4 custom dimensions or custom metrics, refresh the Looker Studio data source.

```text
Looker Studio
→ Resource
→ Manage added data sources
→ Edit your GA4 data source
→ Refresh fields
→ Apply / Done
```

Then add the new fields to the chart/table.

If a custom metric appears but aggregation cannot be changed directly, create a calculated field:

```text
Max Time on Report Seconds = MAX(time_on_report_seconds)
Total Time on Report Seconds = SUM(time_on_report_delta_seconds)
Time on Report Minutes = MAX(time_on_report_seconds) / 60
```

Use `Max Time on Report Seconds` in visitor summary tables.
Use `Total Time on Report Seconds` only when you want to sum heartbeat deltas.


### Step 5 — Create Page 1 first

Do not build all pages at once.

Start with:

```text
Scorecards
Hot leads table
Recent activity table
```

### Step 6 — Add journey page

Build the timeline table.

### Step 7 — Add engagement details

PDF/chat/video/CTA sections.

### Step 8 — Add follow-up priority page

Create lead priority and recommended follow-up fields.

---

## 13. Testing checklist

Use one test secure report.

Open page in browser and perform:

```text
1. Open secure report page.
2. Wait at least 35 seconds to generate a duration heartbeat event.
3. Scroll 50%.
4. Scroll near bottom.
5. Open PDF.
6. Download PDF.
7. Open chatbot.
8. Click a suggested question.
9. Send one manual question.
10. Start evidence video if available.
11. Watch to 25%, 50%, 75% if possible.
12. Click booking CTA.
13. Click email/LinkedIn CTA if safe.
```

Expected GA4/Looker signals:

```text
secure_report_view
secure_report_scroll_50
secure_report_scroll_90
secure_report_pdf_open_click
secure_report_pdf_download_click
secure_report_assistant_open
secure_report_assistant_question_click
secure_report_assistant_message_sent
secure_report_evidence_video_start
secure_report_evidence_video_progress_25/50/75
secure_report_booking_click
secure_report_email_click / secure_report_linkedin_click
secure_report_duration
```

---

## 14. Common problems and likely causes

| Problem | Likely cause | What to check |
|---|---|---|
| Events not showing in GA4 | Missing GA4 env or route fail | `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `/api/report-event` |
| Events show but custom fields blank | Custom definitions not created early enough | Create definitions and send new events |
| Visitor grouping looks wrong | `report_visitor_id` missing or privacy/storage issue | Check anonymous id/session id fields |
| Chat events missing | Chat custom event not forwarded | Check assistant event listener and `/api/report-event` |
| PDF download not tracked | Button data attributes or download script issue | Check PDF download CTA markup |
| Booking click not tracked | Redirect route not used | Check `/api/report-redirect` link |
| Video progress missing | YouTube iframe API not loaded or video not present | Check evidence video ID and iframe |
| Dashboard too messy | Too many raw event rows | Use priority table + filters |
| `time_on_report_seconds` not showing in Looker Studio | GA4 custom metric added but data source fields not refreshed | Resource → Manage added data sources → Edit → Refresh fields |
| Duration metric shows 0/blank | Old events or no fresh duration event after deploy/custom metric creation | Open secure page, keep tab visible for 35+ seconds, then check GA4 DebugView |
| Aggregation cannot be changed | GA4 connector locked metric aggregation | Create calculated fields: `MAX(time_on_report_seconds)` and `SUM(time_on_report_delta_seconds)` |
| Duration too high or confusing | Using SUM on cumulative `time_on_report_seconds` | Use MAX for cumulative seconds, SUM only for delta seconds |

---

## 15. When to use GA4 only vs BigQuery/Supabase later

### GA4 + Looker Studio is enough for Phase 1

Use GA4 + Looker Studio for:

```text
Overall secure page activity
Client interest dashboard
PDF/chat/video/CTA reporting
Follow-up priority view
```

### Add BigQuery/Supabase later if needed

Consider a dedicated event table if you need:

```text
Exact per-visitor raw timeline
No GA4 reporting delay
CRM-style operational dashboard
Long-term event retention
Combining GA4 events with Firestore/Supabase chat data
More reliable deduplication/control
```

Phase 1 should stay simple:

```text
Secure page events → GA4 → Looker Studio
```

---

## 16. Final dashboard success definition

The dashboard is successful when the operator can answer these in under 30 seconds:

```text
1. Which clients opened the secure report?
2. Which clients downloaded the PDF?
3. Which clients asked chatbot questions?
4. Which clients watched evidence video?
5. Which clients clicked booking/email/LinkedIn?
6. Which visitors are hot/high intent?
7. Who should be followed up first?
```

The main dashboard should not be a technical analytics report.  
It should be a **client-intent command center**.

---

## 17. Short summary for another ChatGPT

TrackFlow Pro has a secure report page at `/tracking-review/{domainSlug}/{token}`.  
The page tracks first-party client behavior and forwards events to GA4 through `/api/report-event`, with `/api/server-track` as fallback/general tracking.  
Do not expose raw report token in analytics; use hashed `report_id`.  
Important grouping fields are `company_name`, `domain_slug`, `report_visitor_id`, and `report_session_id`.  
Important intent fields are `visit_stage`, `journey_step`, `intent_level`, and `intent_score`.
Important active-duration fields are `time_on_report_seconds`, `time_on_report_delta_seconds`, and `duration_event_type`.

Build a Looker Studio dashboard with 4 pages:

```text
1. Overview / Command Center
2. Client Journey Timeline
3. Engagement Details: PDF, Chat, Video, CTA
4. Hot Leads / Follow-up Priority
```

Most important events:

```text
secure_report_view
secure_report_scroll_50
secure_report_scroll_90
secure_report_pdf_open_click
secure_report_pdf_download_click
secure_report_assistant_open
secure_report_assistant_question_click
secure_report_assistant_message_sent
secure_report_evidence_video_start
secure_report_evidence_video_progress_25
secure_report_evidence_video_progress_50
secure_report_evidence_video_progress_75
secure_report_evidence_video_complete
secure_report_booking_click
secure_report_email_click
secure_report_linkedin_click
secure_report_duration
```

Main business logic:

```text
Page view = low intent
Scroll = reading intent
PDF open = medium intent
PDF download = high intent
Chat question = high intent
Video 75%+ = high intent
Email/LinkedIn click = high intent
Booking click = hot intent
MAX(time_on_report_seconds) = how long the visitor actively stayed on the secure report
SUM(time_on_report_delta_seconds) = total collected active-time deltas
```

The dashboard should help the operator decide who needs follow-up first.

---

## 18. Future assistant support protocol for “I want to see this secure page data”

When the owner asks to show a data point in Looker Studio, follow this order.

### Step A — Identify the requested data

Map the request to the GA4 field.

Examples:

| Owner request | Use this GA4 field |
|---|---|
| “visitor kotokhon thakche” | `time_on_report_seconds` / `time_on_report_delta_seconds` |
| “ke PDF download korse” | Event name `secure_report_pdf_download_click` |
| “ke chatbot question korse” | Event name `secure_report_assistant_message_sent` + `question_key` |
| “ke booking click korse” | Event name `secure_report_booking_click` |
| “kon visitor hot” | `intent_score`, `intent_level`, `is_core_event` |
| “same visitor group korte chai” | `report_visitor_id` |
| “same visit/session group korte chai” | `report_session_id` |

### Step B — Check GA4 setup first

```text
Admin → Data display → Custom definitions
```

Confirm the dimension/metric exists with the correct parameter name.

For metrics, use event-scoped custom metrics.

### Step C — Confirm fresh event data

Open a test secure report and trigger the behavior.

For duration:

```text
Open secure page
Keep the tab visible for 35+ seconds
Then check GA4 DebugView / Realtime
```

### Step D — Refresh Looker Studio fields

```text
Resource
→ Manage added data sources
→ Edit
→ Refresh fields
→ Apply / Done
```

### Step E — Add to chart/table

For visitor summary:

```text
Dimensions:
company_name
domain_slug
report_visitor_id
report_session_id

Metrics:
Event count
MAX(intent_score)
MAX(time_on_report_seconds)
SUM(time_on_report_delta_seconds)
```

If aggregation is locked, create calculated fields.

### Step F — Ask for code only when setup is not enough

Ask for files only if:

```text
GA4 DebugView does not receive the event
GA4 event receives but parameter is missing
/api/report-event or /api/server-track fails
Looker Studio cannot see the field after data source refresh and fresh events
```

Minimum files for duration/secure behavior tracking:

```text
app/components/trackflow/SecureReportAnalytics.tsx
app/api/report-event/route.ts
app/api/server-track/route.ts
```

If secure page component mounting is suspected:

```text
app/tracking-review/[domainSlug]/[token]/page.tsx
```

Do not touch chatbot, PDF, B2, Firestore, Supabase, email, cleanup, or redirect logic for a Looker Studio field/aggregation issue.

