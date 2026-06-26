// ============================================================
// FILE: app/api/trackflow/report-chat/route.ts
// Purpose: Validated Gemini assistant for private tracking-review pages.
// Also supports admin-only Chat Insights reads/actions.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import {
  buildDeterministicAnswer,
  buildGeminiPrompt,
  buildSafeFallbackAnswer,
  cleanQuestion,
  extractReportChatContext,
  isQuotaLikeError,
  normalizeChatHistory,
  normalizeSlug,
  normalizeToken,
  streamGeminiChunks,
  validateAssistantAnswer,
  type AnyRecord,
} from "@/lib/trackflow-ai/report-chat";
import {
  createChatSessionId,
  isReportChatLoggingConfigured,
  listReportChatSessions,
  loadReportChatMessages,
  loadReportChatQuestions,
  markReportPdfDownloaded,
  logReportChatMessages,
  logReportChatSession,
  markReportChatSessionReviewed,
  type ReportChatVisitInfo,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const TRACKFLOW_CONTACT_EMAIL = "shahjalal@trackflowpro.com";
const DEFAULT_TRACKFLOW_CALENDLY_URL = "https://calendly.com/trackflowpro/tracking-verification-call";

function normalizePublicHttpsUrl(value: unknown, fallback: string): string {
  const raw = String(value || "").trim();

  if (!raw) return fallback;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return fallback;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

const TRACKFLOW_CALENDLY_URL = normalizePublicHttpsUrl(
  process.env.TRACKFLOW_CALENDLY_URL || process.env.NEXT_PUBLIC_TRACKFLOW_CALENDLY_URL,
  DEFAULT_TRACKFLOW_CALENDLY_URL,
);

// Keep the enriched manual-evidence context compatible with the strict
// report-chat validator type without changing runtime behavior.
type ValidatedReportChatContext = Parameters<typeof validateAssistantAnswer>[1] & AnyRecord;

function asValidatedReportChatContext(context: AnyRecord): ValidatedReportChatContext {
  return context as ValidatedReportChatContext;
}

const PREMIUM_CHAT_FORMAT_INSTRUCTIONS = `
Premium chat formatting rules:
- Answer in polished English only.
- Write like a calm tracking specialist speaking to a client, not like a rigid template.
- Keep the answer short, human, and consultative.
- Use clear spacing with short section labels when helpful, but do not repeat the exact same labels in every answer.
- Good section labels include:
  Short answer:
  Why this matters:
  What this means:
  Business impact:
  What I would check next:
  What to verify next:
  Quick note:
  Important note:
- Prefer one short explanatory paragraph plus 3-5 practical bullets when a checklist is needed.
- Do not use Markdown bold markers, tables, code blocks, emojis, or long wall-of-text paragraphs.
- Do not invent evidence. Do not claim final account-level truth without approved access.
- When a finding affects reporting, leads, ads optimization, audience building, or business decisions, explain the practical business impact in safe language.
- Avoid robotic phrases such as “This review points to one practical question.” Start with the client’s business action and the safest interpretation.

Trust, access, security, and service-scope rules:
- Never ask the client to share passwords.
- Recommend adding TrackFlow Pro as a separate user with the lowest useful permission.
- Start with read-only/viewer access for diagnosis whenever possible.
- Only mention edit/publish access when implementation work is approved.
- Do not ask for billing access, payment access, owner access, campaign budget control, or unrelated account settings.
- Explain that account access has operational risk and should be limited, approved, documented, and removable.
- TrackFlow Pro can support tracking verification, Google Ads campaign setup, and ongoing Google Ads management when separately approved.
- Keep tracking verification and campaign setup/management as separate workstreams.
- Recommend confirming conversion tracking before campaign optimization decisions.
- Do not promise guaranteed leads, revenue, ROI, rankings, or ad performance.
- Do not suggest changing budgets, bids, campaigns, or payment settings without explicit approval and scope.
- If the client asks how to contact, book, hire, or continue, provide the official contact email and Calendly link calmly.
- Do not push Fiverr or Upwork unless the client asks about marketplace-based work.
- If marketplace work is discussed, keep it secondary to scope confirmation and remind the client not to share passwords.
`.trim();

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  BD: "Bangladesh",
  IN: "India",
  PK: "Pakistan",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  MY: "Malaysia",
  SG: "Singapore",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
};

function jsonError(message: string, status = 400, extra: AnyRecord = {}) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      message,
      error: message,
      ...extra,
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function jsonOk(payload: AnyRecord = {}) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...payload,
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function makeTextStream(text: string, onDone?: () => Promise<void>) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const parts = String(text || "")
          .split(/(\n\n|(?<=\.)\s+)/g)
          .filter(Boolean);

        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
        }
      } finally {
        controller.close();

        if (onDone) {
          try {
            await onDone();
          } catch {
            // Optional logging should never break the response.
          }
        }
      }
    },
  });
}

function streamResponse(
  stream: ReadableStream<Uint8Array>,
  mode: string,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
      "x-trackflow-chat-mode": mode,
      ...extraHeaders,
    },
  });
}

function isStableUuid(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function getReportSessionCookieName(token: string): string {
  const cleanToken = normalizeToken(token || "unknown") || "unknown";
  return `tfp_chat_session_${cleanToken.slice(0, 64)}`;
}

function makeReportSessionCookie(token: string, sessionId: string): string {
  const name = getReportSessionCookieName(token);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAgeSeconds = 60 * 60 * 24 * 180;

  return `${encodeURIComponent(name)}=${encodeURIComponent(sessionId)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function getReportSessionCookieHeaders(token: string, sessionId: string): Record<string, string> {
  if (!token || !isStableUuid(sessionId)) return {};
  return { "set-cookie": makeReportSessionCookie(token, sessionId) };
}

function setReportSessionCookie(response: NextResponse, token: string, sessionId: string): NextResponse {
  if (!token || !isStableUuid(sessionId)) return response;

  response.cookies.set({
    name: getReportSessionCookieName(token),
    value: sessionId,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
  });

  return response;
}

function uuidFromHash(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 32);
  const variantNibble = ((parseInt(hex[16] || "8", 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variantNibble}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function getStableRequestFingerprint(req: NextRequest, token: string): string {
  return [
    normalizeToken(token || "unknown") || "unknown",
    req.headers.get("user-agent") || "",
    req.headers.get("accept-language") || "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    req.headers.get("x-real-ip") || "",
    req.headers.get("cf-connecting-ip") || "",
  ].join("|");
}

function resolveStableReportSessionId(req: NextRequest, token: string, rawSessionId?: unknown): string {
  const bodyValue = String(rawSessionId || "").trim();
  if (isStableUuid(bodyValue)) return bodyValue;

  const cookieValue = req.cookies.get(getReportSessionCookieName(token))?.value || "";
  if (isStableUuid(cookieValue)) return String(cookieValue).trim();

  return uuidFromHash(getStableRequestFingerprint(req, token));
}

function normalizeIntentText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isAccessSecurityQuestion(question: string): boolean {
  const text = normalizeIntentText(question);

  if (!text) return false;

  return /\b(access|permission|permissions|login|log in|credential|credentials|password|invite|add you|user role|admin|owner|viewer|read only|read-only|edit access|publish access|grant access|account access|risk|safe|safety|secure|security|trust|danger|privacy|control|billing|payment|budget|2fa|two factor|two-factor|what do you need|what will you need|what information|what details|required from us|need from us|need to fix|need to solve)\b/.test(text);
}

function isGoogleAdsServiceQuestion(question: string): boolean {
  const text = normalizeIntentText(question);

  if (!text) return false;

  const mentionsAds =
    /\b(google ads|adwords|paid ads|ppc|search ads|display ads|performance max|pmax|campaign|campaigns|ad group|ad groups|keywords?|bids?|bidding|negative keywords?|landing page|landing pages)\b/.test(text);

  const asksService =
    /\b(setup|set up|create|build|launch|manage|management|run ads|run campaigns|optimize|optimise|optimization|optimisation|improve|scale|audit|review campaigns?|campaign review|after tracking|ads management|campaign management|google ads management|google ads setup|ppc management|can you also|do you also|service|support)\b/.test(text);

  const asksTrackingFirst =
    /\b(should tracking|fix tracking first|tracking before|before campaign|before ads|after tracking is fixed|conversion tracking before)\b/.test(text);

  return (mentionsAds && asksService) || asksTrackingFirst;
}

function buildAccountAccessListAnswer(context: AnyRecord): string {
  const companyName = String(context.companyName || context.company_name || "your team").trim() || "your team";
  const domain = String(context.domain || "").trim();
  const target = companyName === "your team" ? "this review" : `${companyName}${domain ? ` (${domain})` : ""}`;

  return `
Short answer:
For ${target}, we should start with the minimum access needed. Read-only access is usually enough to diagnose the issue before any change is made.

Minimum access for diagnosis:
- GA4 Viewer or Analyst access to check events, conversions, DebugView, Realtime, and attribution signals.
- Google Ads read access to review conversion actions, diagnostics, tag status, and account-side settings.
- GTM read access to inspect tags, triggers, variables, and preview behavior.
- CRM, call-tracking, booking, or form-platform read access only if lead/call/booking records need to be matched.

Only if you approve implementation:
- GTM publish access may be needed to publish tracking fixes.
- Website/CMS/developer access may be needed if form, button, script, or theme code must be changed.
- Google Ads conversion settings access may be needed if the conversion setup must be corrected.

Not needed:
- Password sharing.
- Billing or payment access.
- Campaign budget control.
- Full owner access as the first step.

Best practice:
Add TrackFlow Pro as a separate user with the lowest useful permission. Keep owner access and 2FA with your team.
`.trim();
}

function buildAccessRiskAnswer(): string {
  return `
Short answer:
Yes, there is some operational risk whenever an outside specialist receives account access. The safe approach is limited access, read-only first, approved changes only, and access removal after the work is complete.

How we reduce risk:
- Add TrackFlow Pro as a separate user instead of sharing passwords.
- Start with Viewer or read-only access for diagnosis.
- Keep owner access, recovery options, and 2FA with your team.
- Confirm any implementation change before it is published.
- Remove or reduce access after the review or fix is complete.

What we do not need:
- Your password.
- Billing or payment access.
- Full owner access at the start.
- Campaign budget control or unrelated account settings.

Important note:
Read-only access lets us verify evidence without changing your setup. Edit or publish access should only be granted when you approve implementation work.
`.trim();
}

function buildAdminAccessAnswer(): string {
  return `
Short answer:
No. Admin or owner access is not usually needed at the start. For diagnosis, read-only or limited role access is safer and normally enough.

Recommended access order:
- Start with GA4 Viewer/Analyst, Google Ads read access, and GTM read access.
- Review the issue and confirm what needs to be changed.
- Grant edit or publish access only if you approve implementation.
- Remove or reduce access after the work is complete.

When higher access may be needed:
- GTM publish access may be needed if tags must be published.
- Website/CMS access may be needed if code or form tracking must be changed.
- Google Ads conversion settings access may be needed if conversion setup has to be corrected.

Not needed:
Passwords, billing access, payment access, owner access as the first step, or campaign budget control.
`.trim();
}

function buildPasswordSharingAnswer(): string {
  return `
Short answer:
No. Please do not share passwords.

Safer way:
- Add TrackFlow Pro as a separate user inside GA4, Google Ads, GTM, CMS, CRM, or the relevant platform.
- Use the lowest permission level needed.
- Keep 2FA, owner access, recovery email, and billing control with your team.
- Remove access after the work is complete.

Why this is safer:
A separate user invitation creates a clear access trail and can be revoked anytime. Password sharing is harder to control and should be avoided.
`.trim();
}

function buildBillingPaymentAnswer(): string {
  return `
Short answer:
No. Billing, payment methods, and campaign budget control are not needed for a tracking review.

What we may need instead:
- Read-only access to check conversion actions, analytics events, GTM setup, and diagnostics.
- Limited edit or publish access only if you approve a tracking implementation.
- CRM, call-tracking, or booking-platform read access only if lead matching must be verified.

Safety note:
TrackFlow Pro should not change budgets, payment methods, billing settings, or unrelated campaign settings as part of a tracking verification unless there is separate written approval.
`.trim();
}

function buildGoogleAdsServiceAnswer(context: AnyRecord, question: string): string {
  if (!isGoogleAdsServiceQuestion(question)) return "";

  const text = normalizeIntentText(question);
  const companyName = String(context.companyName || context.company_name || "your team").trim() || "your team";
  const domain = String(context.domain || "").trim();
  const target = companyName === "your team" ? "this account" : `${companyName}${domain ? ` (${domain})` : ""}`;

  const asksTrackingFirst =
    /\b(should tracking|fix tracking first|tracking before|before campaign|before ads|after tracking is fixed|conversion tracking before)\b/.test(text);
  const asksReviewOnly =
    /\b(review campaigns?|audit campaigns?|check campaigns?|without changing|read only|read-only|no changes)\b/.test(text);
  const asksAccess =
    /\b(access|permission|permissions|admin|edit access|manage access|standard access|what do you need|what access)\b/.test(text);
  const asksManagement =
    /\b(manage|management|ongoing|optimize|optimise|optimization|optimisation|improve|scale|run ads|run campaigns|ppc management|google ads management)\b/.test(text);

  if (asksTrackingFirst) {
    return `
Short answer:
Yes. Tracking should be verified before serious campaign optimization. If conversions are not recorded correctly, Google Ads decisions can be based on incomplete or misleading data.

Recommended order:
- Confirm GA4, GTM, Google Ads conversions, calls, forms, bookings, and lead-path events.
- Check whether Google Ads is receiving the right conversion signals.
- Fix or publish tracking updates only after approval.
- Then review campaign structure, keywords, ads, landing pages, budgets, and optimization priorities.

Why it matters:
Campaign management works best when the account can trust the conversion data. Otherwise, optimization may increase spend without clearly showing which leads or actions are actually valuable.
`.trim();
  }

  if (asksAccess) {
    return `
Short answer:
For Google Ads campaign setup or management, access depends on the scope. We can start with read-only access for review, then request limited edit access only if you approve campaign work.

For campaign review:
- Google Ads read access is usually enough.
- GA4 and GTM read access help confirm whether conversion signals are reliable.
- No billing or payment access is needed.

For campaign setup or management:
- Google Ads standard/edit access may be needed to create or adjust campaigns, keywords, ads, conversion settings, and tracking-related settings.
- GTM or website access may be needed only if tracking or landing-page changes are part of the approved scope.
- Any budget, bid, campaign, or conversion-setting change should be approved before it is made.

Important note:
Owner access, passwords, billing access, and payment methods are not needed as the first step.
`.trim();
  }

  if (asksReviewOnly) {
    return `
Short answer:
Yes. TrackFlow Pro can review Google Ads campaigns without changing anything if you provide read-only access.

What we can review safely:
- Campaign structure and conversion focus.
- Search terms, keywords, match types, negative keywords, and ad groups.
- Conversion actions and whether optimization is using the right goals.
- Landing-page alignment and tracking gaps.
- Budget distribution and wasted-spend signals.

What we will not do in read-only mode:
We will not change campaigns, budgets, bids, ads, conversion actions, billing, or account settings. Any implementation work should be approved separately.
`.trim();
  }

  if (asksManagement) {
    return `
Short answer:
Yes. TrackFlow Pro can support Google Ads campaign setup and ongoing management, but it should be treated as a separate approved workstream from this tracking review.

How we normally approach it:
- First verify conversion tracking so campaign decisions are based on reliable lead data.
- Then review the current campaign structure, keywords, ads, search terms, landing pages, and conversion goals.
- If approved, we can help with campaign setup, restructuring, optimization, negative keywords, ad copy direction, and ongoing performance management.
- Any budget, bid, campaign, or conversion-setting change should be approved under a clear scope.

Access safety:
For review, read-only access is usually enough. For active setup or management, limited edit access may be required, but billing/payment access and owner access are not needed as the first step.

Important note:
We can improve structure, measurement, and optimization discipline, but no agency should guarantee exact leads, revenue, or ROI from ads.
`.trim();
  }

  return `
Short answer:
Yes. TrackFlow Pro can support both conversion tracking verification and Google Ads campaign setup or management, but they should be handled as separate scopes.

For this review:
The first priority is to confirm whether leads, calls, forms, bookings, and other important actions are being tracked correctly.

If campaign work is approved:
We can help with Google Ads setup, campaign structure, keyword/ad group planning, ad direction, conversion-focused optimization, and ongoing management.

Access safety:
Read-only access is usually enough for review. Edit access is only needed if you approve campaign or tracking implementation. Billing access, payment access, passwords, and owner access are not needed as the first step.
`.trim();
}

function isSafestNextStepQuestion(question: string): boolean {
  const text = normalizeIntentText(question);

  if (!text) return false;

  return /\b(safest next step|safe next step|best next step|next step|what should we do next|what should we verify first|what to do next|how should we proceed)\b/.test(text);
}

function buildSafestNextStepAnswer(context: AnyRecord, question: string): string {
  if (!isSafestNextStepQuestion(question)) return "";

  const companyName = String(context.companyName || context.company_name || "this account").trim() || "this account";
  const domain = String(context.domain || "").trim();
  const target = companyName === "this account" ? "this tracking review" : `${companyName}${domain ? ` (${domain})` : ""}`;
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the selected customer action");
  const impact = defaultBusinessImpactForContext(context);

  if (isSetupFirstReportContext(context)) {
    return `
Short answer:
For ${target}, I would first confirm the GA4/GTM foundation. After that, test ${actionLabel} as one clean business action.

Why this matters:
${impact}

Recommended order:
- Confirm or install GTM / Google tag.
- Configure GA4 and confirm normal page_view activity.
- Define ${actionLabel} as the business event to test.
- Run one controlled test in GTM Preview and GA4 DebugView after setup.
- Match final recording inside GA4, GTM, Google Ads, CRM, form/booking records, call-tracking, ecommerce records, or server logs.

Important note:
Do not treat the selected action as a failed event before the tracking foundation is clearly installed and tested.
`.trim();
  }

  return `
Short answer:
For ${target}, the safest next step is one clean end-to-end test of the most important conversion path before making tracking or campaign decisions.

Why this matters:
${impact}

Recommended order:
- Choose one important action to test, such as a lead form, phone call, booking, or contact enquiry.
- Run one controlled test from the website or landing page.
- Check GTM Preview to confirm the right tag and trigger fired.
- Check GA4 DebugView or Realtime to confirm the event was received correctly.
- Check Google Ads conversion diagnostics or recent conversion activity if Google Ads is part of the setup.
- Match the same test against the CRM, call-tracking platform, booking tool, or server-side record where relevant.

Important note:
Avoid campaign optimization or budget decisions until the conversion path is confirmed with approved account-level access.
`.trim();
}
function isTrackingReviewIntentQuestion(question: string): boolean {
  const text = normalizeIntentText(question);

  if (!text) return false;

  const hasTrackingSubject = /\b(tracking|tracked|conversion|conversions|event|events|ga4|gtm|google ads|debugview|diagnostics|crm|server logs?|call-tracking|call tracking|evidence|signals?|visible|browser-side|browser visible|public review|reviewed safely|reviewed|main finding|lead reporting|attribution)\b/.test(text);
  const hasConversionPath = /\b(phone|phone call|call click|phone click|click[-\s]?to[-\s]?call|calls?|form|lead|enquiry|inquiry|contact form|booking|appointment|registration|event form|checkout|purchase|cart|demo|signup|sign up|customer action|lead path|journey)\b/.test(text);
  const asksAboutVerification = /\b(was|were|is|are|what|which|why|how|should|reviewed|verified|verify|confirmed|confirm|checked|check|observed|mean|means|properly|clearly|safely)\b/.test(text);

  // Examples that must stay in the tracking answer path, not the booking/contact path:
  // "Was the Phone call click journey reviewed safely on the Contact Us page?"
  // "Are phone calls being tracked properly?"
  // "How should contact form tracking be verified?"
  return Boolean((hasTrackingSubject && hasConversionPath) || (hasConversionPath && asksAboutVerification && /\b(review|reviewed|tracking|tracked|conversion|event|journey|signals?|evidence|verified|confirmed|observed)\b/.test(text)));
}

function isContactBookingQuestion(question: string): boolean {
  const text = normalizeIntentText(question);

  if (!text) return false;

  const asksMarketplace =
    /\b(fiverr|upwork|marketplace|freelance platform|platform-based|platform based)\b/.test(text);

  const asksHiring =
    /\b(hire|work with you|work together|get started|start working|continue with you|can you fix this for us|can you verify this for us|can trackflow pro verify this for us|want to proceed|next step to work)\b/.test(text);

  const asksDirectContact =
    /\b(contact trackflow|reach trackflow|reach you|email you|contact email|mail you|message you|talk to you|talk to someone|speak to you|speak with|human support|how can we contact|how do we contact|how to contact|contact you)\b/.test(text);

  const asksDirectBooking =
    /\b(book a|book the|book your|booking link|schedule a|schedule the|schedule your|calendly|calendar|meeting|consultation|consult|appointment|free consultation|verification call)\b/.test(text);

  // "call", "contact", and "booking" often appear in report evidence (phone call tracking,
  // contact form, booking path). Keep those in the tracking/review answer path unless the
  // visitor is clearly asking to contact, hire, or schedule TrackFlow Pro.
  if (isTrackingReviewIntentQuestion(question) && !asksDirectContact && !asksDirectBooking && !asksHiring && !asksMarketplace) {
    return false;
  }

  return asksDirectContact || asksDirectBooking || asksHiring || asksMarketplace;
}

function buildContactBookingAnswer(context: AnyRecord, question: string): string {
  if (!isContactBookingQuestion(question)) return "";

  const text = normalizeIntentText(question);
  const companyName = String(context.companyName || context.company_name || "your team").trim() || "your team";
  const domain = String(context.domain || "").trim();
  const target = companyName === "your team" ? "this tracking review" : `${companyName}${domain ? ` (${domain})` : ""}`;

  const asksMarketplace = /\b(fiverr|upwork|marketplace|freelance platform|platform-based|platform based)\b/.test(text);
  const asksEmail = /\b(email|mail|contact email|send you)\b/.test(text);
  const asksBooking = /\b(book|booking|schedule|calendly|calendar|call|meeting|consultation|consult|appointment|free consultation|verification call)\b/.test(text);
  const asksFixOrHire = /\b(hire|work with you|work together|get started|start working|continue with you|can you fix this for us|can you verify this for us|can trackflow pro verify this for us|want to proceed|next step to work)\b/.test(text);

  if (asksMarketplace) {
    return `
Short answer:
Yes. If your team prefers marketplace-based hiring, TrackFlow Pro can continue through Upwork or Fiverr where available.

Recommended first step:
For a technical tracking issue, the cleanest first step is to confirm the scope before opening any paid workstream. You can book a short verification call here:
${TRACKFLOW_CALENDLY_URL}

Direct contact:
You can also email:
${TRACKFLOW_CONTACT_EMAIL}

Marketplace option:
After the scope is clear, the work can continue directly or through your preferred marketplace process.

Important note:
Please do not share passwords through chat or marketplace messages. Add TrackFlow Pro as a separate user with the minimum required permission.
`.trim();
  }

  if (asksEmail && !asksBooking) {
    return `
Short answer:
You can contact TrackFlow Pro by email at:
${TRACKFLOW_CONTACT_EMAIL}

Best way to contact:
Send the secure review link, the website/domain, and what you want verified or fixed first.

Book a call:
If you prefer a quick discussion, you can book a free consultation here:
${TRACKFLOW_CALENDLY_URL}

Before sharing access:
Please do not send passwords. If account access is needed, add TrackFlow Pro as a separate user with the lowest useful permission.
`.trim();
  }

  if (asksBooking) {
    return `
Short answer:
Yes. You can book a short free consultation with TrackFlow Pro here:
${TRACKFLOW_CALENDLY_URL}

Best use of the call:
Use the call to confirm what the review found, what access is needed, and whether this is only a tracking fix or a wider Google Ads setup/management project.

What to prepare:
- The secure review link.
- The website or landing page being reviewed.
- Any GA4, GTM, Google Ads, CRM, call-tracking, or form-platform access questions.
- The main business goal, such as calls, forms, bookings, or qualified leads.

Important note:
No passwords are needed for the call. If access is required later, it should be added through separate user invitations.
`.trim();
  }

  if (asksFixOrHire) {
    return `
Short answer:
Yes. TrackFlow Pro can help verify the issue and, if approved, support the tracking fix or Google Ads setup/management work.

Recommended first step:
Book a short verification call here:
${TRACKFLOW_CALENDLY_URL}

Direct contact:
You can also email:
${TRACKFLOW_CONTACT_EMAIL}

How we would proceed:
- Confirm the tracking issue and business goal.
- Share the minimum access checklist.
- Start with read-only access where possible.
- Approve any implementation, campaign, budget, or conversion-setting change before it is made.

Important note:
Tracking verification and Google Ads campaign management should be treated as separate approved scopes.
`.trim();
  }

  return `
Short answer:
You can contact TrackFlow Pro by email or book a short verification call.

Contact email:
${TRACKFLOW_CONTACT_EMAIL}

Book a call:
${TRACKFLOW_CALENDLY_URL}

Recommended first step:
A short call is usually the fastest way to confirm the issue, explain what access is needed, and decide whether this is only a tracking fix or a wider Google Ads setup/management project for ${target}.

Important note:
Please do not share passwords. If access is needed, add TrackFlow Pro as a separate user with the minimum required permission.
`.trim();
}

function buildAccessSecurityAnswer(
  context: AnyRecord,
  question: string,
): string {
  if (!isAccessSecurityQuestion(question)) return "";

  const text = normalizeIntentText(question);

  const asksPassword = /\b(password|login|log in|credential|credentials|2fa|two factor|two-factor)\b/.test(text);
  const asksBilling = /\b(billing|payment|budget|campaign budget|payment method|card|invoice)\b/.test(text);
  const asksAdmin = /\b(admin|owner|full access|administrator|publish access|edit access|highest permission)\b/.test(text);
  const asksRisk = /\b(risk|safe|safety|secure|security|trust|danger|privacy|control|is it risky|any risk)\b/.test(text);
  const asksAccessList = /\b(what access|which access|what permission|which permission|what do you need|what will you need|what information|what details|required from us|need from us|need to fix|need to solve|grant access|account access)\b/.test(text);

  if (asksPassword) return buildPasswordSharingAnswer();
  if (asksBilling) return buildBillingPaymentAnswer();
  if (asksAdmin) return buildAdminAccessAnswer();
  if (asksRisk) return buildAccessRiskAnswer();
  if (asksAccessList) return buildAccountAccessListAnswer(context);

  return buildAccountAccessListAnswer(context);
}

async function loadReportByToken(token: string): Promise<AnyRecord | null> {
  try {
    const snap = await adminDb.collection("audit_reports").doc(token).get();
    if (snap.exists) return snap.data() || {};
  } catch {
    return null;
  }

  return null;
}


function getObjectCandidate(...values: unknown[]): AnyRecord {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as AnyRecord;
  }
  return {};
}

function cleanContextText(value: unknown, fallback = ""): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function reportModeFromContext(context: AnyRecord = {}): string {
  const trackingCase = getObjectCandidate(context.trackingCase, context.tracking_case);
  return cleanContextText(
    context.reportMode ||
      context.report_mode ||
      trackingCase.mode ||
      trackingCase.reportMode ||
      trackingCase.report_mode,
  ).toLowerCase();
}

function contextSearchText(context: AnyRecord = {}): string {
  const parts = [
    context.companyName,
    context.company_name,
    context.domain,
    context.headline,
    context.mainFinding,
    context.main_finding,
    context.businessImpact,
    context.business_impact,
    context.primaryConversionFocus,
    context.manualActionLabel,
    context.manualExpectedEvent,
    context.manualObservedEvent,
    context.manualGa4Status,
    context.manualGoogleAdsStatus,
    context.manualGtmStatus,
    context.manualVerificationMessage,
    context.manualEvidenceLine,
    context.reportMode,
    context.report_mode,
  ];

  for (const key of ["whatChecked", "proofPoints", "recommendations", "auditSnapshotQuestions"]) {
    const value = context[key];
    if (Array.isArray(value)) parts.push(...value);
  }

  return parts.map((item) => cleanContextText(item)).filter(Boolean).join(" ").toLowerCase();
}

function isSetupFirstReportContext(context: AnyRecord = {}): boolean {
  const mode = reportModeFromContext(context);
  if (context.isSetupFirst === true || context.is_setup_first === true) return true;
  if (mode === "tracking_foundation_setup" || mode === "ga4_setup_needed") return true;
  const text = contextSearchText(context);
  return /tracking foundation|setup readiness|ga4\/gtm tracking foundation|analytics foundation|ga4\/gtm setup first/.test(text);
}

function isPositiveEventContext(context: AnyRecord = {}): boolean {
  const mode = reportModeFromContext(context);
  if (mode === "event_positive_snapshot") return true;
  const expected = cleanContextText(context.manualExpectedEvent).toLowerCase();
  const observed = cleanContextText(context.manualObservedEvent).toLowerCase();
  const ga4Status = normalizeIntentText(context.manualGa4Status);
  if (expected && observed && observed.includes(expected)) return true;
  return /\b(yes|observed|appears|clearly observed|event observed|received)\b/.test(ga4Status) && !/\b(no|not|unclear|missing)\b/.test(ga4Status);
}

function defaultBusinessImpactForContext(context: AnyRecord = {}): string {
  const existing = cleanContextText(context.manualBusinessImpact || context.businessImpact || context.business_impact);
  if (existing) return existing;

  if (isSetupFirstReportContext(context)) {
    return "If the analytics foundation is not clear, the team may see website visits but still not know which visits became real enquiries, calls, bookings, or sales. That can weaken lead reporting, remarketing audiences, and future Google Ads decisions.";
  }

  if (isPositiveEventContext(context)) {
    return "A visible event signal is a good sign, but the business still needs to know whether that same action is counted correctly inside GA4, GTM, Google Ads, and the final lead or sale record before relying on it for decisions.";
  }

  return "If the main customer action is not recorded clearly, the business may have traffic data without a reliable view of which enquiries, calls, bookings, or purchases actually happened. That can make lead reporting, attribution, and Google Ads optimization less reliable.";
}
function manualEventSearchText(context: AnyRecord = {}): string {
  return [
    context.manualActionLabel,
    context.primaryConversionFocus,
    context.manualExpectedEvent,
    context.manualObservedEvent,
    context.manualGa4Status,
    context.manualGoogleAdsStatus,
    context.manualGtmStatus,
    context.manualVerificationMessage,
    context.manualOperatorNote,
    context.manualEvidenceLine,
  ]
    .map((item) => cleanContextText(item))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasManualEventEvidence(context: AnyRecord = {}): boolean {
  return Boolean(
    cleanContextText(context.manualActionLabel || context.primaryConversionFocus) ||
      cleanContextText(context.manualExpectedEvent) ||
      cleanContextText(context.manualObservedEvent) ||
      cleanContextText(context.manualGa4Status) ||
      cleanContextText(context.manualGoogleAdsStatus) ||
      cleanContextText(context.manualGtmStatus),
  );
}

function isManualPhoneAction(context: AnyRecord = {}): boolean {
  return /\b(phone|call|phone_call|phone click|call click|click_to_call|click-to-call|tel:|call-tracking|call tracking)\b/.test(
    manualEventSearchText(context),
  );
}

function isManualFormAction(context: AnyRecord = {}): boolean {
  return /\b(form|lead form|contact|enquir|inquir|submit|submission|generate_lead|form_submit)\b/.test(manualEventSearchText(context));
}

function isManualBookingAction(context: AnyRecord = {}): boolean {
  return /\b(booking|appointment|schedule|reservation|calendar)\b/.test(manualEventSearchText(context));
}

function isManualEcommerceAction(context: AnyRecord = {}): boolean {
  return /\b(checkout|purchase|order|cart|transaction|ecommerce|e-commerce|add_to_cart|begin_checkout)\b/.test(
    manualEventSearchText(context),
  );
}

function manualFinalRecordTargets(context: AnyRecord = {}): string {
  if (isManualPhoneAction(context)) return "call-tracking platform, CRM, Google Ads call conversion, or server logs";
  if (isManualFormAction(context)) return "CRM, form inbox, marketing automation platform, or server logs";
  if (isManualBookingAction(context)) return "booking platform, CRM, calendar/appointment record, or server logs";
  if (isManualEcommerceAction(context)) return "ecommerce order record, payment/order system, Google Ads, or server logs";
  return "CRM, form inbox, booking system, call-tracking platform, ecommerce record, or server logs";
}

function observedLooksLikePageViewOnly(context: AnyRecord = {}): boolean {
  const observed = normalizeIntentText(context.manualObservedEvent);
  const expected = normalizeIntentText(context.manualExpectedEvent);
  return /\bpage[_\s-]?view\b/.test(observed) && (!expected || !observed.includes(expected));
}

function observedComparisonLabel(value: unknown): string {
  const text = cleanContextText(value);
  if (/^page[_\s-]?view\s+only$/i.test(text) || /^only\s+page[_\s-]?view$/i.test(text)) return "page_view";
  return text;
}

function manualExpectedVsObservedLine(context: AnyRecord = {}): string {
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the selected customer action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent, "the expected business event");
  const observedEvent = cleanContextText(context.manualObservedEvent, "not clearly observed");

  if (observedLooksLikePageViewOnly(context)) {
    return `For ${actionLabel}, GA4/page activity was visible as ${observedEvent}, but the expected ${expectedEvent} event was not clearly observed from the browser-side review.`;
  }

  return `For ${actionLabel}, the expected event was ${expectedEvent}. The browser-visible observed result was ${observedEvent}.`;
}

function manualActionBusinessImpact(context: AnyRecord = {}): string {
  const existing = cleanContextText(context.manualBusinessImpact || context.businessImpact || context.business_impact);
  if (existing) return existing;

  if (isManualPhoneAction(context)) {
    return "If phone calls are a real lead source, page_view alone is not enough to understand call performance. GA4 and Google Ads need a clear phone-click or call-tracking signal before the data can be trusted for reporting or optimization.";
  }

  if (isManualFormAction(context)) {
    return "If forms create real enquiries, the business needs more than page activity. The form action should create a clear event that can be matched with the final lead record.";
  }

  if (isManualBookingAction(context)) {
    return "If bookings matter to the business, the booking action should be tracked as a clear event and matched with the actual booking record before reporting or ads decisions rely on it.";
  }

  if (isManualEcommerceAction(context)) {
    return "If purchases or checkout actions matter, the business needs reliable event and order matching before using the data for revenue reporting or ad optimization.";
  }

  return defaultBusinessImpactForContext(context);
}

function manualActionSpecificLeadPathAnswer(context: AnyRecord): string {
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the main lead action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent);
  const observedEvent = cleanContextText(context.manualObservedEvent);
  const finalTargets = manualFinalRecordTargets(context);
  const impact = manualActionBusinessImpact(context);
  const observedLine = manualExpectedVsObservedLine(context);

  const actionType = isManualPhoneAction(context)
    ? "phone/call path"
    : isManualFormAction(context)
      ? "form/enquiry path"
      : isManualBookingAction(context)
        ? "booking path"
        : isManualEcommerceAction(context)
          ? "checkout or purchase path"
          : "lead path";

  return `
Short answer:
For this report, I would test ${actionLabel} first because that is the ${actionType} already reviewed. ${observedLine}

Why this matters:
${impact}

What I would check next:
- Repeat one clean ${actionLabel} test.
- In GA4 DebugView or Realtime, confirm whether ${expectedEvent || "the expected business event"} appears instead of just ${observedComparisonLabel(observedEvent) || "a generic page event"}.
- In GTM Preview, confirm the matching trigger and tag fire once for the real action.
- If Google Ads is active, check whether the same action maps to the intended conversion action.
- Match the same test interaction with the ${finalTargets}.

Quick note:
This is not a setup-first answer. It is a GA4/event-verification answer: page activity can be visible while the actual business event still needs confirmation.
`.trim();
}


function isSetupFirstQuestion(question: string): boolean {
  const text = normalizeIntentText(question);
  return /\b(install|installed|setup|set up|foundation|before event|before conversion|event testing|conversion testing|configured after setup|after setup|ga4\/gtm|google tag|tracking foundation|analytics foundation|not clearly detected|not clearly observed|clearly visible|visible from|public browser|customer action|which action|what action|lead reporting|lead path|lead journey|business impact|why does this matter|why it matters)\b/.test(text);
}

function isSetupFoundationVisibilityQuestion(question: string): boolean {
  const text = normalizeIntentText(question);
  const mentionsFoundation = /\b(ga4|gtm|google tag|tracking foundation|analytics foundation)\b/.test(text);
  const asksVisibility = /\b(was|were|is|are|visible|clearly visible|detected|observed|found|seen|public browser|browser-side|review)\b/.test(text);
  return mentionsFoundation && asksVisibility;
}

function isSetupActionSelectionQuestion(question: string): boolean {
  const text = normalizeIntentText(question);
  const mentionsAction = /\b(customer action|business action|selected action|which action|what action|action should|configured after setup|tested after|test after|after ga4\/gtm setup|after setup)\b/.test(text);
  const asksSelection = /\b(which|what|how should|should be|define|configured|tested|test)\b/.test(text);
  return mentionsAction && asksSelection;
}

function buildSetupFirstAnswer(context: AnyRecord, question: string): string {
  if (!isSetupFirstReportContext(context) || !isSetupFirstQuestion(question)) return "";

  const companyName = cleanContextText(context.companyName || context.company_name, "this website");
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the selected customer action");
  const hasSpecificAction = Boolean(cleanContextText(context.manualActionLabel || context.primaryConversionFocus));
  const impact = defaultBusinessImpactForContext(context);
  const q = normalizeIntentText(question);

  if (isLeadPathQuestion(question)) {
    return buildLeadPathAnswer(context, question);
  }

  if (isSetupFoundationVisibilityQuestion(question)) {
    return `
Short answer:
Not clearly. From the public browser-side review, I would treat ${companyName} as a setup-first case: confirm or install GTM / Google tag and GA4 before judging any conversion event.

Why this matters:
${impact}

Evidence to review:
- Google tag / GTM was not clearly observed from the public browser-visible review.
- GA4 was not clearly observed as a reliable base setup from this review.
- Other browser-visible requests can exist, but they do not prove GA4/GTM foundation or final event recording.

What I would check next:
- Confirm whether GTM or Google tag is installed on the website.
- Confirm GA4 is configured and receiving normal page_view activity.
- After that, define ${actionLabel} and run one controlled test.
- Match final recording inside GA4, GTM, Google Ads, CRM, form/booking records, call-tracking, ecommerce records, or server logs.

Quick note:
This is a setup-readiness finding, not a verdict that ${actionLabel} failed.
`.trim();
  }

  if (isSetupActionSelectionQuestion(question)) {
    return `
Short answer:
${hasSpecificAction ? `Start with ${actionLabel}, because that appears to be the main business action to confirm after GA4/GTM setup.` : `Start with the action that matters most to the business — usually a lead form, booking request, phone call, enquiry, checkout, purchase, signup, or demo request.`}

Why this matters:
The goal is not to track every click first. The goal is to confirm whether the website records the action that could actually become a lead, booking, call, or sale.

What I would check next:
- First confirm GTM / Google tag and GA4 page_view activity.
- Choose one primary customer action for the first controlled test.
- Define the expected GA4 event for that action.
- Test it in GTM Preview and GA4 DebugView after setup.
- If Google Ads is active, confirm whether the same action maps to the intended conversion action.

Quick note:
This keeps the review focused on business value instead of random website activity.
`.trim();
  }

  if (/\b(where|final recording|confirmed|confirm|account|server|crm|google ads|debugview|gtm preview)\b/.test(q)) {
    return `
Short answer:
For ${companyName}, the final answer should come from the actual tracking and business systems — not only from the public browser view.

Why this matters:
${impact}

What I would check next:
- Confirm GTM or Google tag is installed correctly.
- Confirm GA4 is configured and normal page_view activity is visible.
- Configure ${actionLabel} as the business action to test after setup.
- Verify the same test in GTM Preview, GA4 DebugView, Google Ads conversion diagnostics if ads are used, and the CRM, form inbox, booking system, call-tracking platform, ecommerce records, or server logs.

Quick note:
This setup-first review should not be treated as a failed-event claim. Event testing comes after the tracking foundation is installed and visible.
`.trim();
  }

  if (/\b(why|before|business impact|lead reporting|matter|affect|risk)\b/.test(q)) {
    return `
Short answer:
Setup should come before conversion testing because the tracking foundation needs to exist before a form, call, booking, or purchase event can be judged fairly.

Why this matters:
${impact}

What this means:
If GA4/GTM is not clearly visible yet, the safe next step is not to say ${actionLabel} failed. The safe next step is to confirm the foundation first, then test the selected action.

What I would check next:
- Set up or confirm GTM / Google tag first.
- Configure GA4 and confirm normal page_view activity.
- Define ${actionLabel} as the business action to test.
- Test the action in GTM Preview and GA4 DebugView.
- Confirm final recording inside GA4, GTM, Google Ads, CRM, form or booking records, call-tracking, ecommerce records, or server logs.
`.trim();
  }

  return `
Short answer:
Before event testing, ${companyName} should first have GTM / Google tag installed and GA4 configured with normal page_view activity.

Why this matters:
${impact}

What I would check next:
- Install or confirm GTM / Google tag on the website.
- Configure GA4 and confirm the base page_view signal.
- Define ${actionLabel} as the business action to test after setup.
- Run one controlled test only after the foundation is in place.
- Confirm the result inside GA4, GTM, Google Ads, CRM, form or booking records, call-tracking, ecommerce records, or server logs.

Quick note:
This does not mean ${actionLabel} failed. It means event testing should happen after the GA4/GTM foundation is installed and confirmed.
`.trim();
}

function isLeadPathQuestion(question: string): boolean {
  const text = normalizeIntentText(question);
  return /\b(lead path|lead journey|lead flow|lead funnel|enquiry path|inquiry path|form path|customer journey|test on the lead|test the lead|what should we test on the lead|which lead path|main lead action)\b/.test(text);
}

function buildLeadPathAnswer(context: AnyRecord, question: string): string {
  if (!isLeadPathQuestion(question)) return "";

  const companyName = cleanContextText(context.companyName || context.company_name, "this website");
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the main lead action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent);
  const observedEvent = cleanContextText(context.manualObservedEvent);
  const impact = defaultBusinessImpactForContext(context);

  if (isSetupFirstReportContext(context)) {
    return `
Short answer:
For ${companyName}, test one main lead path first — but only after GTM / Google tag and GA4 page_view activity are confirmed.

Why this matters:
The lead path is usually the action closest to real business value. If it is not measured clearly, the team may see website traffic but still not know which visits became real enquiries.

What I would check next:
- Confirm GTM / Google tag is installed.
- Confirm GA4 is receiving normal page_view activity.
- Choose the main lead action to test, such as a form, enquiry, booking request, phone click, signup, or demo request.
- Define the expected GA4 event for that action.
- After setup, test it in GTM Preview and GA4 DebugView.
- Match the same test with the CRM, form inbox, booking system, call-tracking platform, or server logs.

Quick note:
For this setup-first report, I would not call the lead path failed yet. I would confirm the foundation first, then test the lead path properly.
`.trim();
  }

  if (isPositiveEventContext(context)) {
    return `
Short answer:
Use the main lead path as a confirmation test. The visible event signal is useful, but the same action still needs to be matched inside the actual accounts and lead records.

Why this matters:
${impact}

What I would check next:
- Repeat one clean test on ${actionLabel}.
- Confirm the expected event${expectedEvent ? ` (${expectedEvent})` : ""} inside GA4 DebugView or Realtime.
- Confirm the matching GTM trigger and tag.
- If Google Ads is active, confirm the conversion action receives the same test.
- Match the same test interaction with the ${manualFinalRecordTargets(context)}.

Quick note:
A positive event signal is a good sign, but the business still needs account-side confirmation before relying on it for reporting or ads optimization.
`.trim();
  }

  if (hasManualEventEvidence(context) && (expectedEvent || observedEvent)) {
    return manualActionSpecificLeadPathAnswer(context);
  }

  return `
Short answer:
Test the lead path that matters most to the business — usually the form, call, booking, enquiry, signup, demo request, checkout, or purchase path that could become a real lead or sale.

Why this matters:
${impact}

What I would check next:
- Choose one primary lead action instead of testing random clicks.
- Confirm the expected event${expectedEvent ? ` (${expectedEvent})` : ""} in GA4 DebugView or Realtime.
- Confirm the matching trigger and tag in GTM Preview.
- If Google Ads is active, check whether the same action maps to the intended conversion action.
- Match the test with the CRM, form inbox, booking system, call-tracking platform, ecommerce record, or server logs.

Quick note:
${observedEvent ? `The browser-visible observed result was ${observedEvent}. ` : ""}That does not prove final account-side failure; it means the lead path should be verified end to end with approved access.
`.trim();
}

function isBusinessImpactQuestion(question: string): boolean {
  const text = normalizeIntentText(question);
  return /\b(business impact|impact|why it matters|why does this matter|affect lead|lead reporting|reporting|attribution|optimization|optimisation|campaign decisions|ads decisions|business risk|risk to business|future campaigns|audience|audiences|remarketing|retargeting)\b/.test(text);
}

function buildBusinessImpactAnswer(context: AnyRecord, question: string): string {
  if (!isBusinessImpactQuestion(question)) return "";

  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the main customer action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent);
  const observedEvent = cleanContextText(context.manualObservedEvent);
  const impact = defaultBusinessImpactForContext(context);

  if (isSetupFirstReportContext(context)) {
    return `
Short answer:
Yes. If GA4/GTM is not clearly set up, the business may have traffic but not a reliable way to connect that traffic with leads, calls, bookings, or sales.

Why this matters:
${impact}

What this means:
Until GA4/GTM setup is confirmed, the business should avoid judging whether ${actionLabel} is working as a conversion event. The foundation should be installed or confirmed first, then the selected action should be tested.

What to verify next:
- GTM or Google tag installation.
- GA4 configuration and page_view activity.
- ${actionLabel} setup after the foundation is ready.
- Final recording in GA4, GTM, Google Ads, CRM, form/booking records, call-tracking, or server logs.
`.trim();
  }

  if (hasManualEventEvidence(context) && (expectedEvent || observedEvent) && !isPositiveEventContext(context)) {
    return `
Short answer:
Yes. For this report, the key point is not whether GA4 loaded at all; it is whether ${actionLabel} created the expected ${expectedEvent || "business event"} signal. The browser-visible result was ${observedEvent || "not clearly observed"}.

Why this matters:
${manualActionBusinessImpact(context)}

What this means:
Page activity can be visible while the actual lead or conversion event still needs confirmation. If the final account data does not match the real customer action, reporting and campaign decisions may be based on incomplete conversion data.

What to verify next:
- Check the event in GA4 DebugView or Realtime.
- Check the matching trigger and tag in GTM Preview.
- Check Google Ads conversion diagnostics if ads are active.
- Match the same test interaction with the ${manualFinalRecordTargets(context)}.
`.trim();
  }

  if (isPositiveEventContext(context)) {
    return `
Short answer:
Yes. A visible event signal is encouraging, but I would still confirm that it is counted correctly inside the actual accounts before using it for reporting or ads optimization.

Why this matters:
${impact}

What this means:
The browser-visible/manual review suggests ${actionLabel} may be measurable. The next business question is whether the same event is correctly counted once, mapped to the right conversion action, and connected to the final lead or sale record.

What to verify next:
- Confirm the event inside GA4 DebugView or Realtime.
- Confirm the GTM trigger and tag conditions.
- Confirm Google Ads conversion diagnostics if ads are active.
- Match the same test with the CRM, booking tool, form inbox, call-tracking platform, ecommerce record, or server logs.
`.trim();
  }

  return `
Short answer:
Yes. If ${actionLabel} is a real lead, booking, call, signup, checkout, or purchase action, unclear tracking can affect the way the business reads performance.

Why this matters:
${impact}

What this means:
${expectedEvent ? `The expected event was ${expectedEvent}. ` : ""}${observedEvent ? `The observed result was ${observedEvent}. ` : ""}If the final account-side data does not match the real customer action, the business may make decisions from incomplete or misleading conversion data.

What to verify next:
- Check the event in GA4 DebugView or Realtime.
- Check the trigger and tag in GTM Preview.
- Check Google Ads conversion diagnostics if ads are active.
- Match the same test with the CRM, form inbox, booking system, call-tracking platform, ecommerce record, or server logs.
`.trim();
}


function getManualEvidenceChatContext(report: AnyRecord = {}): AnyRecord {
  const auditCore = getObjectCandidate(report.auditCore, report.audit_core);
  const auditCoreManual = getObjectCandidate(auditCore.manualEvidence, auditCore.manual_evidence);
  const trackingCase = getObjectCandidate(report.trackingCase, report.tracking_case);
  const manualHero = getObjectCandidate(
    report.manualEvidenceHero,
    report.manual_evidence_hero,
    auditCoreManual,
  );
  const manual = getObjectCandidate(report.manualConversionEvidence, report.manual_conversion_evidence);
  const primary = getObjectCandidate(
    manual.primaryAction,
    manual.primary_action,
    manual.primary,
    auditCoreManual,
    manualHero,
    trackingCase,
  );

  const actionLabel = cleanContextText(
    manualHero.actionLabel ||
      manualHero.action_label ||
      manualHero.label ||
      primary.label ||
      primary.actionLabel ||
      primary.action_label,
  );
  const expectedEvent = cleanContextText(
    manualHero.expectedEvent ||
      manualHero.expected_event ||
      primary.expectedEvent ||
      primary.expected_event,
  );
  const observedEvent = cleanContextText(
    manualHero.observedEvent ||
      manualHero.observed_event ||
      primary.observedEventName ||
      primary.observed_event_name ||
      primary.observedEvent ||
      primary.observed_event,
  );
  const tool = cleanContextText(manualHero.tool || manualHero.toolUsed || manualHero.tool_used || primary.tool || primary.toolUsed || primary.tool_used);
  const ga4Status = cleanContextText(
    manualHero.ga4Status ||
      manualHero.ga4_status ||
      manualHero.ga4EventAfterActionObserved ||
      manualHero.ga4_event_after_action_observed ||
      primary.ga4EventObserved ||
      primary.ga4_event_observed ||
      primary.ga4Event ||
      primary.ga4_event,
  );
  const googleAdsStatus = cleanContextText(
    manualHero.googleAdsStatus ||
      manualHero.google_ads_status ||
      manualHero.googleAdsConversionAfterActionObserved ||
      manualHero.google_ads_conversion_after_action_observed ||
      primary.googleAdsConversionObserved ||
      primary.google_ads_conversion_observed ||
      primary.googleAdsConversion ||
      primary.google_ads_conversion,
  );
  const gtmStatus = cleanContextText(
    manualHero.gtmStatus ||
      manualHero.gtm_status ||
      manualHero.gtmTriggerAfterActionObserved ||
      manualHero.gtm_trigger_after_action_observed ||
      primary.gtmTriggerObserved ||
      primary.gtm_trigger_observed ||
      primary.gtmTrigger ||
      primary.gtm_trigger,
  );

  if (!actionLabel && !expectedEvent && !observedEvent && !manualHero.summary && !manualHero.verificationMessage) {
    return {};
  }

  return {
    manualActionLabel: actionLabel,
    manualExpectedEvent: expectedEvent,
    manualObservedEvent: observedEvent,
    manualTool: tool,
    manualGa4Status: ga4Status,
    manualGoogleAdsStatus: googleAdsStatus,
    manualGtmStatus: gtmStatus,
    manualSummary: cleanContextText(manualHero.summary),
    manualBusinessImpact: cleanContextText(manualHero.businessImpact || manualHero.business_impact || report.businessImpact),
    manualVerificationMessage: cleanContextText(manualHero.verificationMessage || manualHero.verification_message),
    manualDisclaimer: cleanContextText(manualHero.disclaimer),
    manualOperatorNote: cleanContextText(
      manualHero.operatorNote ||
        manualHero.operator_note ||
        primary.evidenceNote ||
        primary.evidence_note ||
        primary.operatorNote ||
        primary.operator_note,
    ),
  };
}

function enhanceReportChatContextWithManualEvidence(context: AnyRecord, report: AnyRecord = {}): AnyRecord {
  const manual = getManualEvidenceChatContext(report);
  if (!Object.keys(manual).length) return context;

  const actionLabel = cleanContextText(manual.manualActionLabel);
  const expectedEvent = cleanContextText(manual.manualExpectedEvent);
  const observedEvent = cleanContextText(manual.manualObservedEvent);
  const snapshotQuestions = Array.isArray(report.auditSnapshotQuestions)
    ? report.auditSnapshotQuestions
    : Array.isArray(report.audit_snapshot_questions)
      ? report.audit_snapshot_questions
      : [];

  return {
    ...context,
    ...manual,
    primaryConversionFocus: actionLabel || context.primaryConversionFocus,
    mainFinding: cleanContextText(report.mainFinding || report.main_finding || context.mainFinding),
    businessImpact: cleanContextText(manual.manualBusinessImpact || context.businessImpact),
    auditSnapshotQuestions: snapshotQuestions.slice(0, 4),
    manualEvidenceLine: [
      actionLabel ? `Action reviewed: ${actionLabel}.` : "",
      expectedEvent ? `Expected event: ${expectedEvent}.` : "",
      observedEvent ? `Observed result: ${observedEvent}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function manualStatusNeedsVerification(value: unknown): boolean {
  const text = normalizeIntentText(value);
  if (!text) return true;
  return /\b(no|not|unclear|needs|verify|verification|not clearly|not observed)\b/.test(text);
}

function buildManualEvidenceAnswer(context: AnyRecord, question: string): string {
  if (isSetupFirstReportContext(context)) return "";

  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the selected customer action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent);
  const observedEvent = cleanContextText(context.manualObservedEvent);
  const businessImpact = manualActionBusinessImpact(context);
  const verificationMessage = cleanContextText(context.manualVerificationMessage);
  const tool = cleanContextText(context.manualTool, "manual browser-side review");
  const ga4Status = cleanContextText(context.manualGa4Status, "Unclear / needs verification");
  const googleAdsStatus = cleanContextText(context.manualGoogleAdsStatus, "Unclear / needs verification");
  const gtmStatus = cleanContextText(context.manualGtmStatus, "Unclear / needs verification");
  const operatorNote = cleanContextText(context.manualOperatorNote);
  const finalTargets = manualFinalRecordTargets(context);
  const observedLine = manualExpectedVsObservedLine(context);
  const q = normalizeIntentText(question);

  if (!expectedEvent && !observedEvent && !context.manualEvidenceLine) return "";

  const asksObserved =
    /\b(was|did|observed|found|show|appear|fire|fired|event|seen)\b/.test(q) ||
    (expectedEvent && q.includes(expectedEvent.toLowerCase())) ||
    (observedEvent && q.includes(observedEvent.toLowerCase()));
  const asksMatchNext = /\b(where|match|matched|matching|lead record|form inbox|crm|final record|same test)\b/.test(q);
  const asksObservedMeaning = /\b(page[_\s-]?view|observed result|why does|why it matters|matter|reporting|optimization|optimisation)\b/.test(q);
  const asksGa4 = /\b(ga4|google analytics|debugview|debug view|realtime|real time|inside ga4)\b/.test(q);
  const asksGtm = /\b(gtm|tag manager|preview|gtm preview|trigger|tag fires|tag firing)\b/.test(q);
  const asksGoogleAds =
    /\b(google ads|ads reporting|ad reporting|optimization|optimisation|optimize|optimise|campaign|conversion diagnostics)\b/.test(q);
  const asksVerification =
    /\b(what should|check|verify|verified|confirm|inside ga4|inside gtm|gtm preview|ga4 debugview|next step|first)\b/.test(q);

  if (!asksObserved && !asksMatchNext && !asksObservedMeaning && !asksGa4 && !asksGtm && !asksGoogleAds && !asksVerification) return "";

  if (isPositiveEventContext(context)) {
    return `
Short answer:
The visible review suggests ${actionLabel} may be sending the expected event signal. That is a good sign, but I would still confirm it inside the approved tracking tools and final business record.

Why this matters:
${businessImpact}

What to verify next:
- Confirm the event appears correctly in GA4 DebugView or Realtime.
- Confirm the GTM trigger and tag conditions match ${actionLabel}.
- Confirm Google Ads conversion diagnostics if this action is used for ads optimization.
- Match the same test interaction with the ${finalTargets}.

Important note:
A positive browser-visible signal is helpful, but it should still be checked for correct counting, deduplication, and conversion mapping.
`.trim();
  }

  if (asksMatchNext) {
    return `
Short answer:
Match the same ${actionLabel} test in the places that should all describe one real action: GA4, GTM, Google Ads if relevant, and the final business record.

What to verify next:
- GA4 DebugView or Realtime: confirm whether ${expectedEvent || "the expected event"} appears.
- GTM Preview: confirm the right trigger and tag fired once for ${actionLabel}.
- Google Ads: check the matching conversion action if this event is used for ads optimization.
- Final record: match the same test with the ${finalTargets}.

Why this matters:
The goal is a clean chain: visitor action → tracking event → final lead or business record. If one part is missing, reporting and optimization can become unreliable.
`.trim();
  }

  if (asksObservedMeaning && observedEvent) {
    return `
Short answer:
${observedComparisonLabel(observedEvent)} matters because it can show page activity, but it does not prove that ${actionLabel} was counted as ${expectedEvent || "the expected business event"}.

What this means:
${observedLine}

Why this matters:
${businessImpact}

What I would check next:
Repeat one clean ${actionLabel} test, watch GA4 DebugView and GTM Preview, then match the same test with Google Ads if relevant and the ${finalTargets}.
`.trim();
  }

  if (asksGa4) {
    return `
Short answer:
Inside GA4, I would check whether the expected ${expectedEvent || "business event"} appears for ${actionLabel}. ${observedLine}

Why this matters:
${businessImpact}

What I would check next:
- Open GA4 DebugView or Realtime during one clean ${actionLabel} test.
- Confirm whether ${expectedEvent || "the expected event"} appears, not just ${observedComparisonLabel(observedEvent) || "a generic page event"}.
- Check the event parameters, source/medium, and conversion/key-event setting.
- Check whether the event is duplicated, renamed, or filtered by consent or configuration.

Quick note:
A visible page_view can show that GA4 page activity exists, but it does not confirm the actual business action event.
`.trim();
  }

  if (asksGtm) {
    return `
Short answer:
In GTM Preview, I would check whether the tag and trigger for ${actionLabel} fire when the real action happens. The key question is whether the expected ${expectedEvent || "business event"} is sent, not just whether the page loads.

Why this matters:
${businessImpact}

What I would check next:
- Start GTM Preview on the reviewed page.
- Repeat one clean ${actionLabel} interaction.
- Confirm the matching trigger fires once.
- Confirm the GA4 event tag sends ${expectedEvent || "the expected event"} with the right parameters.
- Then match the same test in GA4 and the ${finalTargets}.

Quick note:
If the review only saw ${observedComparisonLabel(observedEvent) || "a page-level signal"}, GTM Preview should show exactly where the business-event signal is missing, blocked, renamed, or not firing.
`.trim();
  }

  if (asksObserved && !asksVerification && !asksGoogleAds) {
    return `
Short answer:
No clear ${expectedEvent || "matching conversion event"} signal was seen for ${actionLabel} in this browser-side review. ${observedLine}

What this means:
The visitor-side action may still work. The issue is measurement: the review saw page activity, but not a clear business-event signal for this action.

Why this matters:
${businessImpact}

Evidence to review:
- Tool/source: ${tool}.
- Expected event: ${expectedEvent || "A matching business event"}.
- Observed browser-visible result: ${observedEvent || "Not clearly observed"}.
- GA4 status note: ${ga4Status}.
- Google Ads conversion: ${googleAdsStatus}.
- GTM trigger: ${gtmStatus}.${operatorNote ? `\n- Operator note: ${operatorNote}` : ""}

Important note:
This should be matched inside approved tracking tools and the ${finalTargets}. No billing or payment access is needed for that verification.
`.trim();
  }

  if (asksGoogleAds) {
    return `
Short answer:
Yes. If ${actionLabel} is used for Google Ads reporting or optimization, this is worth checking carefully.

What this means:
The review expected ${expectedEvent || "a matching conversion event"}, but the browser-visible observed result was ${observedEvent || "not clearly observed"}. If Google Ads depends on this action, reporting and optimization may be less reliable until the conversion action is confirmed inside the approved tools.

Why it matters:
${businessImpact || "Google Ads optimization works best when the selected conversion action is recorded clearly and consistently."}

Important note:
This is not a final claim that Google Ads is missing conversions. It is a browser-visible and operator-provided signal that should be verified inside Google Ads conversion diagnostics, GA4, GTM, and the relevant business records.
`.trim();
  }

  if (asksVerification || manualStatusNeedsVerification(ga4Status) || manualStatusNeedsVerification(googleAdsStatus) || manualStatusNeedsVerification(gtmStatus)) {
    return `
Short answer:
The safest next step is to repeat one controlled ${actionLabel} test and compare the same action across GA4, GTM, Google Ads if relevant, and the final business record.

Why this matters:
${businessImpact}

What to verify next:
- In GTM Preview, confirm whether a matching trigger fires for ${actionLabel}.
- In GA4 DebugView, confirm whether ${expectedEvent || "the expected conversion event"} appears, not just ${observedComparisonLabel(observedEvent) || "a generic page event"}.
- In Google Ads, check whether a matching conversion action receives the same test if ads are active.
- Match the same test interaction with the ${finalTargets}.

Important note:
${verificationMessage || "Browser-visible evidence is useful context, but final recording still requires approved tracking-tool or final-record access."}
`.trim();
  }

  return "";
}

function clampIntentScore(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, numeric));
}

function intentLabelForScore(score: number): string {
  if (score >= 85) return "Hot";
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  if (score > 0) return "Low";
  return "Not tracked";
}

async function markReportChatQuestionEngagement(input: {
  sessionId: string;
  reportToken: string;
  status?: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
  visit?: ReportChatVisitInfo;
}) {
  const token = normalizeToken(input.reportToken);
  if (!token) return { skipped: true, reason: "missing_token" };

  const reportRef = adminDb.collection("audit_reports").doc(token);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const increment = admin.firestore.FieldValue.increment;
  const eventScore = 80;

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(reportRef);
    if (!snap.exists) return { skipped: true, reason: "report_not_found" };

    const current = snap.data() || {};
    const currentScore = clampIntentScore(current.intentScore, 0);
    const nextScore = Math.max(currentScore, eventScore);
    const countryCode = cleanCountryCode(input.visit?.countryCode || "");
    const countryName = cleanHeader(input.visit?.countryName || "", 120);

    const update: AnyRecord = {
      chatOpened: true,
      chatEngaged: true,
      chatQuestionCount: increment(1),
      lastChatQuestionAt: timestamp,
      lastChatSessionId: input.sessionId,
      lastChatStatus: cleanHeader(input.status || "answered", 80),
      lastActivityAt: timestamp,
      lastReportActivityAt: timestamp,
      lastEngagementEventName: "secure_report_chat_question_answered",
      reportPageViewed: true,
      lastSeenAt: timestamp,
      updatedAt: timestamp,
    };

    if (countryCode) {
      update.visitorCountry = countryCode;
      update.lastVisitorCountry = countryCode;
    }
    if (countryName && countryName !== "Unknown") update.lastVisitorCountryName = countryName;
    if (input.domainSlug) update.domainSlug = input.domainSlug;
    if (input.domain) update.domain = input.domain;
    if (input.companyName) update.companyName = input.companyName;
    if (input.reportUrl) update.reportUrl = input.reportUrl;

    if (nextScore > currentScore) {
      update.intentScore = nextScore;
      update.intentLabel = intentLabelForScore(nextScore);
    } else if (!current.intentLabel && currentScore > 0) {
      update.intentLabel = intentLabelForScore(currentScore);
    }

    transaction.set(reportRef, update, { merge: true });
    return { skipped: false, token };
  });
}

type AdminCheckResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

function cleanHeader(value: string | null, maxLength = 120): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanCountryCode(value: string | null): string {
  const code = cleanHeader(value, 8).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  if (code === "XX" || code === "ZZ") return "";
  return code;
}

function decodeLocationHeader(value: string | null, maxLength = 120): string {
  const cleaned = cleanHeader(value, maxLength);
  if (!cleaned) return "";

  try {
    return decodeURIComponent(cleaned.replace(/\+/g, " ")).slice(0, maxLength);
  } catch {
    return cleaned;
  }
}

function getCountryName(countryCode: string): string {
  const code = cleanCountryCode(countryCode);
  if (!code) return "";

  return COUNTRY_NAMES[code] || code;
}

function isLocalHostname(value: string): boolean {
  const host = String(value || "").toLowerCase().trim();

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  );
}

function getHeaderHostname(value: string | null): string {
  const raw = cleanHeader(value, 500);
  if (!raw) return "";

  try {
    return new URL(raw).hostname;
  } catch {
    return "";
  }
}

function isLocalDashboardRequest(req: NextRequest): boolean {
  // Local development can accidentally call the deployed API if an app URL env points
  // to production. In that case the request host is production, but Origin/Referer
  // still reveals localhost. Treat it as local test data instead of saving a
  // misleading edge-network country.
  const requestHost = String(req.nextUrl.hostname || "").toLowerCase();
  const originHost = getHeaderHostname(req.headers.get("origin"));
  const refererHost = getHeaderHostname(req.headers.get("referer"));

  return isLocalHostname(requestHost) || isLocalHostname(originHost) || isLocalHostname(refererHost);
}

function getTrustedEdgeCountryCode(req: NextRequest): string {
  // Use trusted edge-provider headers only. Avoid generic x-country-code because it
  // can be client/proxy supplied and can make the dashboard look more certain than it is.
  return cleanCountryCode(req.headers.get("x-vercel-ip-country")) || cleanCountryCode(req.headers.get("cf-ipcountry"));
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("crios/")) return "Chrome iOS";
  if (ua.includes("chrome/") || ua.includes("chromium/")) return "Chrome";
  if (ua.includes("safari/")) return "Safari";

  return "Unknown";
}

function detectOs(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  return "Unknown";
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile";

  return "Desktop";
}

function getVisitInfo(req: NextRequest): ReportChatVisitInfo {
  const userAgent = cleanHeader(req.headers.get("user-agent"), 600);

  if (isLocalDashboardRequest(req)) {
    return {
      countryCode: "",
      countryName: "Local test",
      region: "",
      city: "",
      deviceType: detectDeviceType(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOs(userAgent),
    };
  }

  const countryCode = getTrustedEdgeCountryCode(req);
  const countryName = getCountryName(countryCode);

  return {
    countryCode,
    countryName: countryName || "Unknown",
    region: decodeLocationHeader(req.headers.get("x-vercel-ip-country-region"), 120),
    city: decodeLocationHeader(req.headers.get("x-vercel-ip-city"), 120),
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
  };
}

function buildSecureReportUrl(
  req: NextRequest,
  context: {
    reportUrl?: unknown;
    domainSlug?: unknown;
  },
  token: string,
): string {
  const existingReportUrl = String(context.reportUrl || "").trim();
  const domainSlug = String(context.domainSlug || "").trim();

  if (existingReportUrl) return existingReportUrl;
  if (!domainSlug || !token) return "";

  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.TRACKFLOW_APP_URL ||
    process.env.APP_URL ||
    req.nextUrl.origin;

  const base = String(envBase || "").replace(/\/+$/, "");
  return `${base}/tracking-review/${domainSlug}/${token}`;
}

async function handlePdfDownloadRedirect(req: NextRequest) {
  const token = normalizeToken(req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("reportToken"));
  const fallbackUrl = new URL("/", req.nextUrl.origin);

  if (!token) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  const report = await loadReportByToken(token);

  if (!report || report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, {
      disableChat: true,
    });
  }

  const context = asValidatedReportChatContext(
    enhanceReportChatContextWithManualEvidence(extractReportChatContext(report, token), report),
  );

  try {
    await markReportPdfDownloaded({
      reportToken: token,
      domainSlug: context.domainSlug,
      domain: context.domain,
      companyName: context.companyName,
      reportUrl: buildSecureReportUrl(req, context, token),
    });
  } catch {
    // Activity tracking must never block the secure PDF download.
  }

  const downloadUrl = new URL(`/api/trackflow/reports/download?token=${encodeURIComponent(token)}`, req.nextUrl.origin);
  return NextResponse.redirect(downloadUrl, { status: 302 });
}

async function requireChatInsightsAdmin(req: NextRequest): Promise<AdminCheckResult> {
  const header = req.headers.get("authorization") || "";
  const idToken = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

  if (!idToken) {
    return { ok: false, message: "Admin login required." };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = String(decoded.email || "").trim().toLowerCase();
    const allowedEmails = String(process.env.ALLOWED_ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!email || !allowedEmails.includes(email)) {
      return { ok: false, message: "Admin access required." };
    }

    return { ok: true, email };
  } catch {
    return { ok: false, message: "Please login again." };
  }
}

async function handleAdminGet(req: NextRequest) {
  const adminCheck = await requireChatInsightsAdmin(req);

  if (!adminCheck.ok) {
    return jsonError(adminCheck.message, 401, {
      sessions: [],
      messages: [],
      disableChat: true,
    });
  }

  const limit = Math.max(1, Math.min(250, Number(req.nextUrl.searchParams.get("limit") || 100)));
  const search = String(req.nextUrl.searchParams.get("search") || "").trim();
  const reportToken = normalizeToken(
    req.nextUrl.searchParams.get("reportToken") || req.nextUrl.searchParams.get("token"),
  );
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();

  if (rawSessionId && reportToken) {
    const transcriptLimit = Math.min(limit, 100);
    const sessionId = createChatSessionId(rawSessionId);

    let transcriptMode = "full_qa";
    let messages = await loadReportChatMessages({
      sessionId,
      reportToken,
      limit: transcriptLimit,
    });

    // Backward-compatible fallback for old/partial rows where only user questions
    // were saved or where an old endpoint only queried questions.
    if (!messages.length) {
      transcriptMode = "questions_only";
      messages = await loadReportChatQuestions({
        sessionId,
        reportToken,
        limit: transcriptLimit,
      });
    }

    if (!messages.length) {
      transcriptMode = "questions_only_report_fallback";
      messages = await loadReportChatQuestions({
        reportToken,
        limit: transcriptLimit,
      });
    }

    return jsonOk({
      messages,
      sessionId,
      reportToken,
      transcriptMode,
      assistantMessages: messages.filter((message) => message.role === "assistant").length,
      userMessages: messages.filter((message) => message.role === "user").length,
      loggingConfigured: isReportChatLoggingConfigured(),
    });
  }

  const sessions = await listReportChatSessions({
    reportToken: reportToken || undefined,
    search,
    limit,
  });

  return jsonOk({
    sessions,
    loggingConfigured: isReportChatLoggingConfigured(),
  });
}

async function handleAdminPost(req: NextRequest, body: AnyRecord) {
  const adminCheck = await requireChatInsightsAdmin(req);

  if (!adminCheck.ok) {
    return jsonError(adminCheck.message, 401, {
      disableChat: true,
    });
  }

  const action = String(body.action || body.adminAction || "").trim().toLowerCase();

  if (action === "mark_reviewed" || action === "mark-reviewed" || action === "reviewed") {
    const rawSessionId = String(body.sessionId || body.session_id || "").trim();
    const reportToken = normalizeToken(body.reportToken || body.report_token || body.token);

    if (!rawSessionId || !reportToken) {
      return jsonError("Missing chat session or report token.", 400);
    }

    const sessionId = createChatSessionId(rawSessionId);
    const reviewedAt = new Date().toISOString();

    await markReportChatSessionReviewed({
      sessionId,
      reportToken,
    });

    return jsonOk({
      status: "Conversation marked as reviewed.",
      sessionId,
      reportToken,
      reviewedAt,
    });
  }

  return jsonError("Unsupported Chat Insights admin action.", 400);
}

async function logSafely(input: {
  sessionId: string;
  reportToken: string;
  question: string;
  answer: string;
  mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error";
  status?: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
  visit?: ReportChatVisitInfo;
}) {
  try {
    await logReportChatMessages(input);
  } catch {
    // Optional transcript logging only.
  }

  try {
    await markReportChatQuestionEngagement(input);
  } catch {
    // Firestore engagement summary must never break the chat response.
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("activity") === "pdf_download") {
    return handlePdfDownloadRedirect(req);
  }

  if (req.nextUrl.searchParams.get("admin") === "1") {
    return handleAdminGet(req);
  }

  const token = normalizeToken(req.nextUrl.searchParams.get("token"));
  const domainSlug = normalizeSlug(req.nextUrl.searchParams.get("domainSlug"));
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();

  if (!token) {
    return jsonError("Missing report token.", 400, { messages: [], disableChat: true });
  }

  const stableSessionId = resolveStableReportSessionId(req, token, rawSessionId);

  const report = await loadReportByToken(token);

  if (!report || report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, {
      messages: [],
      disableChat: true,
    });
  }

  const context = asValidatedReportChatContext(
    enhanceReportChatContextWithManualEvidence(extractReportChatContext(report, token), report),
  );

  if (domainSlug && context.domainSlug && domainSlug !== context.domainSlug) {
    return jsonError("This chat request does not match the private report URL.", 403, {
      messages: [],
      disableChat: true,
    });
  }

  const sessionId = stableSessionId;
  const messages = await loadReportChatMessages({
    sessionId,
    reportToken: token,
    limit: 60,
  });

  return setReportSessionCookie(
    jsonOk({
      messages,
      sessionId,
      loggingConfigured: isReportChatLoggingConfigured(),
    }),
    token,
    sessionId,
  );
}

export async function POST(req: NextRequest) {
  let body: AnyRecord = {};

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid chat request.", 400);
  }

  if (
    req.nextUrl.searchParams.get("admin") === "1" ||
    body.admin === true ||
    body.adminMode === true ||
    Boolean(body.adminAction) ||
    Boolean(body.action)
  ) {
    return handleAdminPost(req, body);
  }

  const token = normalizeToken(body.token || body.reportToken || body.report_token);
  const domainSlug = normalizeSlug(body.domainSlug || body.domain_slug);
  const question = cleanQuestion(body.question);
  const history = normalizeChatHistory(body.history);
  const rawSessionId = String(body.sessionId || body.session_id || "").trim();
  const sessionId = token ? resolveStableReportSessionId(req, token, rawSessionId) : createChatSessionId(rawSessionId);
  const sessionCookieHeaders = getReportSessionCookieHeaders(token, sessionId);

  if (!token) {
    return jsonError("Missing report token.", 400, { disableChat: true });
  }

  if (!question || question.length < 2) {
    return jsonError("Please ask a short question about this tracking review.", 400);
  }

  const report = await loadReportByToken(token);

  if (!report) {
    return jsonError("This report could not be loaded right now.", 503);
  }

  if (report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, { disableChat: true });
  }

  const context = asValidatedReportChatContext(
    enhanceReportChatContextWithManualEvidence(extractReportChatContext(report, token), report),
  );

  if (domainSlug && context.domainSlug && domainSlug !== context.domainSlug) {
    return jsonError("This chat request does not match the private report URL.", 403, { disableChat: true });
  }

  const visit = getVisitInfo(req);
  const reportUrl = buildSecureReportUrl(req, context, token);

  try {
    await logReportChatSession({
      sessionId,
      reportToken: token,
      domainSlug: context.domainSlug,
      domain: context.domain,
      companyName: context.companyName,
      reportUrl,
      visit,
    });
  } catch {
    // Optional logging only.
  }

  const contactBookingAnswer = buildContactBookingAnswer(context, question);

  if (contactBookingAnswer) {
    const answer = validateAssistantAnswer(contactBookingAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "contact_booking_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "contact_booking_answer",
      sessionCookieHeaders,
    );
  }

  const googleAdsServiceAnswer = buildGoogleAdsServiceAnswer(context, question);

  if (googleAdsServiceAnswer) {
    const answer = validateAssistantAnswer(googleAdsServiceAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "google_ads_service_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "google_ads_service_answer",
      sessionCookieHeaders,
    );
  }

  const accessSecurityAnswer = buildAccessSecurityAnswer(context, question);

  if (accessSecurityAnswer) {
    const answer = validateAssistantAnswer(accessSecurityAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "access_security_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "access_security_answer",
      sessionCookieHeaders,
    );
  }

  const setupFirstAnswer = buildSetupFirstAnswer(context, question);

  if (setupFirstAnswer) {
    const answer = validateAssistantAnswer(setupFirstAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "setup_first_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "setup_first_answer",
      sessionCookieHeaders,
    );
  }


  const manualEvidenceAnswer = buildManualEvidenceAnswer(context, question);

  if (manualEvidenceAnswer) {
    const answer = validateAssistantAnswer(manualEvidenceAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "manual_evidence_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "manual_evidence_answer",
      sessionCookieHeaders,
    );
  }

  const leadPathAnswer = buildLeadPathAnswer(context, question);

  if (leadPathAnswer) {
    const answer = validateAssistantAnswer(leadPathAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "lead_path_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "lead_path_answer",
      sessionCookieHeaders,
    );
  }

  const businessImpactAnswer = buildBusinessImpactAnswer(context, question);

  if (businessImpactAnswer) {
    const answer = validateAssistantAnswer(businessImpactAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "business_impact_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "business_impact_answer",
      sessionCookieHeaders,
    );
  }

  const safestNextStepAnswer = buildSafestNextStepAnswer(context, question);

  if (safestNextStepAnswer) {
    const answer = validateAssistantAnswer(safestNextStepAnswer, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "safest_next_step_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "safest_next_step_answer",
      sessionCookieHeaders,
    );
  }

  const deterministic = buildDeterministicAnswer(context, question);

  if (deterministic) {
    const answer = validateAssistantAnswer(deterministic, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "deterministic_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "deterministic_answer",
      sessionCookieHeaders,
    );
  }

  if (!GEMINI_API_KEY) {
    const fallback = validateAssistantAnswer(buildSafeFallbackAnswer(context, question), context, question);

    return streamResponse(
      makeTextStream(fallback, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer: fallback,
          mode: "smart_fallback",
          status: "missing_gemini_api_key",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "smart_fallback",
      sessionCookieHeaders,
    );
  }

  const prompt = `${buildGeminiPrompt({ context, question, history })}\n\n${PREMIUM_CHAT_FORMAT_INSTRUCTIONS}`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error" = "gemini_stream";
      let status = "ok";
      let answer = "";

      try {
        const chunks: string[] = [];

        for await (const chunk of streamGeminiChunks({
          prompt,
          apiKey: GEMINI_API_KEY,
          model: GEMINI_MODEL,
        })) {
          chunks.push(chunk);
        }

        const joined = chunks.join("").trim();
        answer = validateAssistantAnswer(joined, context, question);

        if (!joined || answer !== joined.trim()) {
          status = !joined ? "empty_gemini_stream" : "validated_or_repaired_answer";
        }
      } catch (error) {
        if (isQuotaLikeError(error)) {
          mode = "quota_disabled";
          status = "quota_or_rate_limit";
          answer =
            "The AI review assistant is temporarily unavailable because the usage limit was reached. You can still request a manual tracking verification review from TrackFlow Pro.";
        } else {
          mode = "smart_fallback";
          status = "gemini_stream_error";
          answer = validateAssistantAnswer(buildSafeFallbackAnswer(context, question), context, question);
        }
      }

      try {
        const parts = answer.split(/(\n\n|(?<=\.)\s+)/g).filter(Boolean);

        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
        }
      } finally {
        controller.close();

        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode,
          status,
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }
    },
  });

  return streamResponse(stream, "validated_gemini_stream", sessionCookieHeaders);
}
