# TrackFlow Pro — Website Visitor Journey + Secure Report Dashboard Handoff

**Purpose:** Give a new ChatGPT/chat/developer enough context to understand the TrackFlow Pro GA4 + GTM + Looker Studio tracking/dashboard setup without re-explaining the project from zero.

**Owner preference:** Reply in Bengali letters / Bangla-script Banglish for TrackFlow Pro work unless the owner asks for English. Use practical, direct, careful guidance. The owner often says “boss”; replying with “বস” is acceptable.

---

## 1. Big Picture

TrackFlow Pro currently has **two separate analytics/dashboard concepts**:

### A. Existing Secure Report / Secure Page Visitor Intelligence

This tracks how prospects interact with a **private secure tracking review/report page**.

Main purpose:

- Did the client/prospect open the secure report?
- Did they view/download the PDF?
- Did they watch or engage with video?
- Did they send chat messages?
- Did they click booking/contact actions?
- What intent level did the report visitor show?

This dashboard already existed before.

### B. New Public Website Visitor Journey Dashboard

This tracks how users interact with the **public TrackFlow Pro website**.

Main purpose:

- Where did visitors come from?
- Which pages did they view?
- How much did they engage?
- How far did they scroll?
- Which buttons/CTAs did they click?
- Which pages/sources/devices produced lead actions?
- Can the client/business owner make decisions from the dashboard?

The new Looker Studio report name is:

```text
TrackFlow Pro — Website Visitor Journey Dashboard
```

---

## 2. Critical Separation Rule

Do **not** mix secure report tracking data with public website visitor journey data.

### Secure Report Dashboard

Use this for:

```text
/tracking-review/...
private report engagement
report_id
report_session_id
report_visitor_id
domain_slug
company_name
journey_step
intent_level
visit_stage
PDF / video / chat / booking tracking
```

### Public Website Journey Dashboard

Use this for:

```text
public website pages
traffic source
landing page
device
page engagement
scroll
CTA clicks
phone / WhatsApp / email / form / audit request
visitor journey overview
```

### Recommended Looker Studio filter for Public Website Only

Start with:

```text
Exclude → Page path → Contains → /tracking-review/
```

Optional stronger separation:

```text
AND
Include → report_id → Equal to → (not set)
```

Use the stronger condition only if it does not remove valid public website data.

---

## 3. Existing Secure Report Tracking Dashboard

The existing secure report dashboard is titled like:

```text
TrackFlow Pro — Secure Report Engagement Overview
```

It includes scorecards such as:

```text
Client Reached
Report Opens
PDF Views
PDF Downloads
Video Engagement
Chat Messages
Booking Clicks
Hot Intent Actions
High Intent Actions
```

It also includes a visitor summary table with fields like:

```text
company_name
domain_slug
report_visitor_id
visitor_country
device_type
User engagement
Time on Report
Event count
```

And a timeline table like:

```text
Date hour
Website
Visitor
Journey Step
Intent Level
Button Label
visitor_country
Event Count
```

Example secure report journey steps seen in the current dashboard:

```text
01_report_viewed
02_time_on_report
02_mid_scroll
03_pdf_viewed
03_video_engaged
03_deep_scroll
```

Example secure report button/action labels:

```text
Report HTML served
Secure report viewed
PDF preview visible
Evidence video visible
Active on report 20s
Active on report 38s
50% scroll
90% scroll
```

**Important:** This secure report dashboard is not the same as the public website visitor journey dashboard.

---

## 4. Existing GA4 Custom Dimensions Already Created

The owner already created these GA4 event-scoped custom dimensions. Do not delete/rename them unless intentionally migrating.

```text
button_label
click_href
company_name
device_type
domain_slug
event_section
intent_level
journey_step
primary_action_label
primary_page_label
question_key
question_source
report_id
report_session_id
report_visitor_id
transport
video_id
visit_stage
visitor_city
visitor_country
visitor_id
visitor_region
```

These were mostly for the secure report / private tracking review workflow.

---

## 5. Existing GA4 Custom Metrics Already Created

The owner already created these GA4 event-scoped custom metrics:

```text
intent_score
message_length
scroll_percent
time_on_report_delta_seconds
time_on_report_seconds
video_progress
```

Do not delete/rename them unless intentionally migrating.

---

## 6. New Public Website Tracking Events

The patched public website tracking foundation sends/should send events such as:

```text
page_view
scroll_depth
page_engagement
phone_click
direct_email_click
whatsapp_click
booking_click
free_audit_click
contact_click
signature_tool_click
outbound_click
navigation_click
form_submit_attempt
```

Important note:

```text
email_click is not the likely event name.
Use direct_email_click for email link clicks.
```

---

## 7. New Public Website Event Parameters / Dimensions

The public website visitor journey dashboard should use these event parameters where available.

### High-priority public website dimensions

```text
page_label
landing_page
landing_page_path
traffic_source
traffic_medium
final_action
action_type
action_target
click_text
click_location
link_domain
form_name
form_id
```

### Already existing dimensions that can also be reused

```text
button_label
click_href
device_type
visitor_id
visitor_city
visitor_country
visitor_region
journey_step
visit_stage
```

### Important Looker Studio / GA4 built-in alternatives

If custom fields are `(not set)`, use GA4 built-in dimensions first:

```text
Session source / medium
Session source
Session medium
First user source / medium
Device category
Landing page + query string
Page path
Page title
Event name
```

This is important because the current dashboard shows many `(not set)` values for custom `traffic_source`, `landing_page_path`, `visitor_id`, etc.

---

## 8. New Public Website Custom Metrics to Add / Use

Recommended public website custom metrics:

```text
max_scroll_percent
time_on_page_seconds
page_view_index
journey_index
```

Existing metric already useful:

```text
scroll_percent
```

Possible built-in/fallback engagement metrics:

```text
User engagement
Average session duration
Engagement rate
Views
Sessions
Total users
Event count
Key events
Session key event rate
```

Important note:

```text
Average engagement time per session may not appear in Looker Studio field picker.
If not available, use User engagement or Average session duration.
For a scorecard, label it as “Avg. Active Time” only if it represents an average.
If using User engagement as total time, label it “Total Engaged Time.”
```

---

## 9. Key Events / Lead Actions

For website journey dashboard decisions, these events should be treated as lead/conversion actions:

```text
phone_click
whatsapp_click
direct_email_click
form_submit_attempt
booking_click
free_audit_click
contact_click
signature_tool_click
```

For a **Lead Actions** scorecard in Looker Studio:

```text
Metric: Event count
Filter: Event name IN phone_click, whatsapp_click, direct_email_click, form_submit_attempt, booking_click, free_audit_click, contact_click, signature_tool_click
```

If Looker Studio does not show an `IN` operator, use OR conditions.

For **Phone / WhatsApp Clicks** scorecard:

```text
Metric: Event count
Filter:
Event name = phone_click
OR
Event name = whatsapp_click
```

---

## 10. Current Public Website Dashboard First Page

The owner created the first page of:

```text
TrackFlow Pro — Website Visitor Journey Dashboard
```

The page currently contains:

### Top controls

```text
Date range
Traffic Source
Device category
Landing Page
Final Action
Action Type
```

### Scorecards

```text
Total Sessions
Total Users
Page Views
Avg. Active Time
Lead Actions
Conversion Rate
Avg Max Scroll
Phone / WhatsApp Clicks
```

### Tables / charts

```text
Main chart — Traffic Source Performance
Device Performance chart
Landing Page Performance table
CTA / Button Click Performance table
Recent Website Visitor Journey Timeline
Page Engagement table
```

The dashboard structure is good for learning and future client use. Current data quality is not yet client-ready because it is a new setup and many values are still `(not set)`.

---

## 11. Current Snapshot Observations From First Page

Latest sample dashboard data showed approximately:

```text
Total Sessions: 423
Total Users: 305
Page Views: 613
Avg. Active Time: 00:01:45
Lead Actions: 8
Conversion Rate: 0.00%
Avg Max Scroll: 26%
Phone / WhatsApp: 1
```

Interpretation:

- Tracking is firing because sessions, views, lead actions, clicks, and scroll data are appearing.
- Key events are not configured or not mapped correctly yet because `Lead Actions` is 8 but `Key events` and `Session key event rate` show 0.
- Avg max scroll 26% means many visitors are not scrolling far; important CTA/proof should appear higher on the page.
- Conversion Rate 0.00% is currently misleading and should be hidden or replaced with a custom Lead Action Rate until GA4 key events are configured.

---

## 12. Current Known Data Quality Issues

### Issue 1 — Many `(not set)` values

Current dashboard shows `(not set)` in:

```text
traffic_source
landing_page_path
visitor_id
device_type
page_label
final_action
button_label
click_text
click_location
```

Possible causes:

```text
new tracking setup
custom dimension created after events were already collected
GA4 processing delay
event parameters not sent on every event
Looker Studio field mapping issue
using custom fields where GA4 built-ins are more reliable
```

This is normal during learning/setup, but should be cleaned before client presentation.

### Issue 2 — Secure report `/tracking-review/` appears in recent website timeline

This is not a waiting issue. It is a filter issue.

Fix:

```text
Apply Public Website Only filter to every chart/table.
Especially the Recent Website Visitor Journey Timeline table.
Exclude Page path contains /tracking-review/
```

### Issue 3 — Traffic source table shows only `(not set)`

Current table using custom `traffic_source` shows:

```text
traffic_source = (not set)
```

Better fix:

Use built-in GA4 dimensions first:

```text
Session source / medium
Session source
Session medium
First user source / medium
```

Use custom `traffic_source` only after confirming the tracking code sends it consistently.

### Issue 4 — Landing page table dominated by `(not set)`

Better fix:

Use built-in GA4 dimension:

```text
Landing page + query string
```

Then optionally add:

```text
landing_page_path
page_label
```

### Issue 5 — Page Engagement table error

The current first page had:

```text
Data Set Configuration Error
Data Studio cannot connect to your data set.
```

Fix:

- Remove the broken Page Engagement table temporarily.
- Recreate it with stable fields:
  - Dimension: Page path or Page title
  - Metrics: Views, Total users, User engagement, Event count
  - Filter: Public Website Only
- Avoid unstable custom metrics until fields refresh.

---

## 13. Recommended First Page Final Layout

Use this as the client-facing first page structure.

### Title

```text
TrackFlow Pro — Website Visitor Journey Dashboard
```

### Subtitle

```text
See how visitors arrive, which pages they view, how deeply they engage, and what action they take before leaving.
```

### Filter row

```text
Date Range
Session source / medium
Device category
Landing page + query string
Action Type
Final Action
```

### Scorecards

```text
Total Sessions
Total Users
Page Views
Avg. Active Time
Lead Actions
Lead Action Rate
Avg Max Scroll
Phone / WhatsApp Clicks
```

### Main charts

```text
Traffic Source Performance
Device Performance
Landing Page Performance
CTA / Button Click Performance
Recent Website Visitor Journey Timeline
```

---

## 14. Recommended Chart-by-Chart Setup

### 14.1 Total Sessions scorecard

```text
Chart type: Scorecard
Metric: Sessions
Filter: Public Website Only
```

### 14.2 Total Users scorecard

```text
Metric: Total users
Filter: Public Website Only
```

### 14.3 Page Views scorecard

```text
Metric: Views
Filter: Public Website Only
```

### 14.4 Avg. Active Time scorecard

Best:

```text
Average engagement time per session
```

Fallback:

```text
Average session duration
```

If only `User engagement` is available, use it but label carefully.

### 14.5 Lead Actions scorecard

```text
Metric: Event count
Filter:
Public Website Only
AND
Event name IN phone_click, whatsapp_click, direct_email_click, form_submit_attempt, booking_click, free_audit_click, contact_click, signature_tool_click
```

### 14.6 Lead Action Rate scorecard

Use calculated field if possible:

```text
Lead Actions / Sessions
```

Format:

```text
Percent
```

Do not show GA4 `Session key event rate` until key events are properly configured.

### 14.7 Avg Max Scroll scorecard

```text
Metric: Average max_scroll_percent
Filter:
Public Website Only
AND
Event name = page_engagement OR scroll_depth
```

Fallback:

```text
Average scroll_percent
```

### 14.8 Phone / WhatsApp scorecard

```text
Metric: Event count
Filter:
Public Website Only
AND
Event name = phone_click OR whatsapp_click
```

---

## 15. Traffic Source Performance Table

Use built-in source dimension first.

```text
Dimension:
Session source / medium
```

Optional additional dimension:

```text
Session campaign
```

Metrics:

```text
Sessions
Total users
Views
Avg. Active Time
Event count
Lead Actions
Lead Action Rate
```

Decision logic:

```text
High sessions + high lead actions = invest more
High sessions + low lead actions = traffic quality or landing page issue
Low sessions + high lead rate = promising channel, scale carefully
```

---

## 16. Device Performance Table

Use built-in GA4 field:

```text
Dimension: Device category
```

Metrics:

```text
Sessions
Views
Avg. Active Time
Lead Actions
Lead Action Rate
```

Decision logic:

```text
Mobile traffic high + lead low = mobile UX/CTA problem
Desktop active time high + lead high = desktop users have stronger intent
Mobile scroll low = move CTA/proof higher
```

Avoid relying only on custom `device_type` until it becomes clean.

---

## 17. Landing Page Performance Table

Use built-in field first:

```text
Dimension: Landing page + query string
```

Optional fields:

```text
landing_page_path
page_label
```

Metrics:

```text
Sessions
Total users
Views
Avg. Active Time
User engagement
Event count
Lead Actions
Lead Action Rate
Avg Max Scroll
```

Decision logic:

```text
High views + low lead = CTA/copy issue
High scroll + low lead = offer not persuasive
Low scroll + low lead = hero/top section weak
High active time + high lead = winning landing page
```

---

## 18. CTA / Button Click Performance Table

Dimensions:

```text
action_type
button_label
click_text
click_location
click_href
```

Metrics:

```text
Event count
Total users
```

Filter:

```text
Public Website Only
AND
Event name IN phone_click, whatsapp_click, direct_email_click, booking_click, free_audit_click, contact_click, signature_tool_click, outbound_click, navigation_click
```

Decision logic:

```text
Which CTA is clicked most?
Header CTA vs hero CTA vs footer CTA?
Is Contact clicked?
Is Free Audit clicked?
Are phone/WhatsApp clicks too low?
```

If many values are `(not set)`, improve tracking code to send:

```text
button_label
click_text
click_location
click_href
action_type
```

---

## 19. Recent Website Visitor Journey Timeline

This is the “wow factor” table, but GA4 + Looker Studio has limitations. It is not a perfect full replay unless using BigQuery/custom session database.

Recommended dimensions:

```text
Date hour and minute
visitor_id
Session source / medium
Device category
page_label
Page path
Event name
action_type
button_label
click_text
final_action
```

Recommended metrics:

```text
Event count
journey_index
time_on_page_seconds
scroll_percent
max_scroll_percent
```

Filters:

```text
Public Website Only
Exclude Page path contains /tracking-review/
```

Sort:

```text
Date hour and minute descending
journey_index ascending
```

Use this table to approximate:

```text
Visitor arrives
→ page_view
→ scroll_depth
→ button click
→ lead action
```

If it shows many `(not set)` values now, do not panic. It likely needs more data, custom dimension refresh, and cleaner event parameters.

---

## 20. Looker Studio Filter Rules

### Chart-level filters

Every public website chart should have:

```text
Public Website Only
```

Do not accidentally apply unrelated filters to the wrong scorecard.

Example: Lead Actions should only have:

```text
Public Website Only
Lead Actions
```

Remove accidental filters like:

```text
Avg Max Scroll
Phone / WhatsApp Clicks
Average PageScroll
CTA table filter
```

### Managing filters

- Chart-level filter pills can usually be removed from the chart setup panel.
- Resource → Manage filters can edit/delete filters globally.
- Be careful: deleting a shared filter globally may affect other charts.

---

## 21. Meaning of Main Metrics for Client Decisions

### Total Sessions

How many visits happened.

Decision:

```text
Traffic volume trend
```

### Total Users

How many unique users visited.

Decision:

```text
Audience reach
```

### Page Views

How many pages were viewed.

Decision:

```text
Depth of browsing
```

### Pages per Session

Formula:

```text
Views / Sessions
```

Decision:

```text
Low pages/session = improve internal linking and CTA flow
```

### Avg. Active Time

How long users were actively engaged.

Decision:

```text
Low time = weak content/hero/offer
High time but low lead = CTA or offer problem
```

### Lead Actions

Count of meaningful contact/conversion actions.

Decision:

```text
Main business outcome indicator
```

### Lead Action Rate

Formula:

```text
Lead Actions / Sessions
```

Decision:

```text
Best simple conversion indicator before GA4 key event setup is clean
```

### Avg Max Scroll

How far users scroll on average.

Decision:

```text
Low scroll = important CTA/proof should move higher
```

### Phone / WhatsApp Clicks

High-intent contact actions.

Decision:

```text
If low, improve sticky contact buttons and above-the-fold CTA
```

---

## 22. Current Learning Stage Notes

The current dashboard is **not intended for client presentation yet**. It is in learning/building/testing stage.

Current status:

```text
Tracking fires: yes
Sessions/views/clicks appear: yes
Lead actions appear: yes
Many custom dimensions are (not set): yes
Secure report data still appears in public timeline: needs filter fix
Key events show 0: needs GA4 key event setup or custom Lead Action Rate
Page Engagement table error: remove/rebuild
```

This does not mean the tracking failed. It means data modeling and dashboard field choices need cleanup.

---

## 23. Recommended Next Actions

### Immediate

```text
1. Apply Public Website Only filter to every public website chart.
2. Remove /tracking-review/ from Recent Website Visitor Journey Timeline.
3. Replace custom traffic_source with Session source / medium.
4. Replace custom landing_page_path with Landing page + query string.
5. Replace Conversion Rate 0.00% with custom Lead Action Rate.
6. Rebuild or remove broken Page Engagement table.
7. Use Device category instead of custom device_type until clean.
```

### After 24–48 hours of data

```text
1. Refresh Looker Studio data source fields.
2. Check GA4 DebugView/Realtime for each event.
3. Confirm custom dimensions are receiving values.
4. Check whether traffic_source, landing_page_path, visitor_id, final_action, action_type become cleaner.
5. Mark important lead events as GA4 key events if desired.
```

### Before client presentation

```text
1. Hide all broken charts.
2. Remove misleading 0% conversion rate if key events are not configured.
3. Ensure public and secure report data are separated.
4. Rename technical labels into client-friendly labels.
5. Add short explanation text under each chart.
```

---

## 24. Safe Naming / Labeling for Client Dashboard

Use client-friendly labels:

```text
Total Sessions → Website Visits
Total Users → Visitors
Page Views → Pages Viewed
Avg. Active Time → Avg. Active Time
Lead Actions → Contact / Lead Actions
Lead Action Rate → Lead Action Rate
Avg Max Scroll → Avg. Scroll Depth
Phone / WhatsApp → Direct Contact Clicks
Traffic Source Performance → Which traffic sources bring visitors and leads?
Landing Page Performance → Which entry pages perform best?
CTA Performance → Which buttons people click
Recent Journey Timeline → Recent visitor actions
```

---

## 25. What a Client Should Be Able to Decide

A useful dashboard should answer these questions:

```text
1. Which traffic source brings the most visitors?
2. Which traffic source brings the most lead actions?
3. Which landing pages attract visitors?
4. Which landing pages convert?
5. Are mobile users converting or dropping?
6. Which CTA/button gets clicked most?
7. Are visitors scrolling far enough to see key content?
8. Are contact actions low compared to total sessions?
9. Which pages need stronger CTA/copy?
10. Which channels/pages should receive more marketing focus?
```

If the dashboard answers these, the client will feel it is useful.

---

## 26. Implementation Safety Rules

Never break the old secure page tracking.

Do not delete or rename secure page dimensions:

```text
report_id
report_session_id
report_visitor_id
domain_slug
company_name
primary_action_label
primary_page_label
journey_step
visit_stage
intent_level
```

Do not mix public website dashboard with:

```text
PDF views
Report opens
Secure report visitor intent
Private tracking review tokens
Secure page proof/video/chat events
```

Use separate dashboard pages or separate reports.

Recommended:

```text
Dashboard 1: Secure Report Visitor Intelligence
Dashboard 2: Website Visitor Journey Dashboard
```

---

## 27. If a New ChatGPT Continues This Work

Start by asking for:

```text
Current Looker Studio screenshot/export PDF
Current GA4 custom definitions list
Current event names visible in GA4 Events report
Current data source field list if available
Current tracking code files only if code changes are needed
```

Do not assume all custom fields are clean. Always check whether a field is custom or GA4 built-in.

Default advice:

```text
Use GA4 built-ins for source/device/landing page first.
Use custom parameters for CTA/action/journey details.
Keep secure report tracking separate from public website tracking.
```

---

## 28. Best Current Strategy

For now, complete the first page with stable fields:

```text
Sessions
Users
Views
User engagement / Average session duration
Lead Actions
Lead Action Rate
Avg Max Scroll
Phone / WhatsApp Clicks
Session source / medium
Device category
Landing page + query string
CTA/button click table
Recent journey timeline with /tracking-review/ excluded
```

Then wait 24–48 hours for cleaner data and field availability.
