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
- Keep the answer short, calm, and client-friendly.
- Use clear spacing with short section labels when helpful:
  Short answer:
  What this means:
  What to verify next:
  Important note:
- Use simple hyphen bullets or numbered steps when listing items.
- Do not use Markdown bold markers, tables, code blocks, emojis, or long wall-of-text paragraphs.
- Do not invent evidence. Do not claim final account-level truth without approved access.

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

  return `
Short answer:
The safest next step for ${target} is to verify one high-priority conversion path end to end before making final tracking or campaign decisions.

Recommended order:
- Choose one important action to test, such as a lead form, phone call, booking, or contact enquiry.
- Run one controlled test from the website or landing page.
- Check GTM Preview to confirm the right tag and trigger fired.
- Check GA4 DebugView or Realtime to confirm the event was received correctly.
- Check Google Ads conversion diagnostics or recent conversion activity if Google Ads is part of the setup.
- Match the same test against the CRM, call-tracking platform, booking tool, or server-side record where relevant.

Why it matters:
A public page review can show visible tracking evidence, but final confirmation should happen inside GA4, GTM, Google Ads, CRM, call-tracking, or server-side logs.

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

function getManualEvidenceChatContext(report: AnyRecord = {}): AnyRecord {
  const manualHero = getObjectCandidate(report.manualEvidenceHero, report.manual_evidence_hero);
  const manual = getObjectCandidate(report.manualConversionEvidence, report.manual_conversion_evidence);
  const primary = getObjectCandidate(
    manual.primaryAction,
    manual.primary_action,
    manual.primary,
    manualHero,
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
  const tool = cleanContextText(manualHero.tool || primary.tool || primary.toolUsed || primary.tool_used);
  const ga4Status = cleanContextText(
    manualHero.ga4Status ||
      manualHero.ga4_status ||
      primary.ga4EventObserved ||
      primary.ga4_event_observed ||
      primary.ga4Event ||
      primary.ga4_event,
  );
  const googleAdsStatus = cleanContextText(
    manualHero.googleAdsStatus ||
      manualHero.google_ads_status ||
      primary.googleAdsConversionObserved ||
      primary.google_ads_conversion_observed ||
      primary.googleAdsConversion ||
      primary.google_ads_conversion,
  );
  const gtmStatus = cleanContextText(
    manualHero.gtmStatus ||
      manualHero.gtm_status ||
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
  const actionLabel = cleanContextText(context.manualActionLabel || context.primaryConversionFocus, "the selected customer action");
  const expectedEvent = cleanContextText(context.manualExpectedEvent);
  const observedEvent = cleanContextText(context.manualObservedEvent);
  const businessImpact = cleanContextText(context.manualBusinessImpact || context.businessImpact);
  const verificationMessage = cleanContextText(context.manualVerificationMessage);
  const tool = cleanContextText(context.manualTool, "manual browser-side review");
  const ga4Status = cleanContextText(context.manualGa4Status, "Unclear / needs verification");
  const googleAdsStatus = cleanContextText(context.manualGoogleAdsStatus, "Unclear / needs verification");
  const gtmStatus = cleanContextText(context.manualGtmStatus, "Unclear / needs verification");
  const operatorNote = cleanContextText(context.manualOperatorNote);
  const q = normalizeIntentText(question);

  if (!expectedEvent && !observedEvent && !context.manualEvidenceLine) return "";

  const asksObserved =
    /\b(was|did|observed|found|show|appear|fire|fired|event)\b/.test(q) ||
    (expectedEvent && q.includes(expectedEvent.toLowerCase())) ||
    (observedEvent && q.includes(observedEvent.toLowerCase()));

  const asksGoogleAds =
    /\bgoogle ads|ads reporting|ad reporting|optimization|optimisation|optimize|optimise|campaign|conversion diagnostics\b/.test(q);
  const asksVerification =
    /\bwhat should|check|verify|verified|confirm|inside ga4|inside gtm|gtm preview|ga4 debugview|next step|first\b/.test(q);

  if (!asksObserved && !asksGoogleAds && !asksVerification) return "";

  if (asksObserved && !asksVerification && !asksGoogleAds) {
    return `
Short answer:
During the manual ${actionLabel} review, ${expectedEvent ? `${expectedEvent} was the expected event.` : "a matching conversion event was expected."} The browser-visible observed result was ${observedEvent || "not clearly confirmed"}.

What this means:
This does not prove final account-side tracking failure. It means the expected conversion signal was not clearly visible from the manual browser-side review.

Evidence to review:
- Tool/source: ${tool}.
- GA4 event: ${ga4Status}.
- Google Ads conversion: ${googleAdsStatus}.
- GTM trigger: ${gtmStatus}.${operatorNote ? `\n- Operator note: ${operatorNote}` : ""}

Important note:
Final confirmation still requires GA4, GTM, Google Ads, CRM, call-tracking, booking engine, or server-side records.
`.trim();
  }

  if (asksGoogleAds) {
    return `
Short answer:
Yes, this can matter if ${actionLabel} is used as a Google Ads lead or conversion action.

What this means:
The review expected ${expectedEvent || "a matching conversion event"}, but the browser-visible observed result was ${observedEvent || "not clearly confirmed"}. If Google Ads depends on this action, reporting and optimization may be less reliable until the final conversion action is confirmed inside the actual accounts.

Why it matters:
${businessImpact || "Google Ads optimization works best when the selected conversion action is recorded clearly and consistently."}

Important note:
This is not a final claim that Google Ads is missing conversions. It is a browser-visible and operator-provided signal that should be verified inside Google Ads conversion diagnostics, GA4, GTM, and the relevant backend lead records.
`.trim();
  }

  if (asksVerification || manualStatusNeedsVerification(ga4Status) || manualStatusNeedsVerification(googleAdsStatus) || manualStatusNeedsVerification(gtmStatus)) {
    return `
Short answer:
The safest next step is to repeat one controlled ${actionLabel} test and compare the same action across GA4, GTM, Google Ads, and the backend lead record.

What to verify next:
- In GTM Preview, confirm whether a matching trigger fires for ${actionLabel}.
- In GA4 DebugView, confirm whether ${expectedEvent || "the expected conversion event"} appears, not only ${observedEvent || "a generic page event"}.
- In Google Ads, check whether a matching conversion action receives the same test.
- In the CRM, form inbox, booking system, call-tracking platform, or server logs, match the submitted test lead.

Important note:
${verificationMessage || "Browser-visible evidence is useful context, but final recording still requires account/server access."}
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
