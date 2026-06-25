import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function sanitizeEventName(value: unknown) {
  return (
    cleanText(value, "secure_report_event")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "secure_report_event"
  );
}

function sanitizeParam(value: unknown, max = 160) {
  return cleanText(value, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, max);
}

function normalizeToken(value: unknown) {
  return (
    cleanText(value, "unknown")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96) || "unknown"
  );
}

function cleanClientId(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u001F\u007F\s]+/g, "")
    .slice(0, 200);
}

function normalizeGaSessionId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  const text = String(value).trim();
  if (!text) return undefined;

  const numeric = Number(text.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function hashReportId(token: unknown) {
  const normalized = normalizeToken(token);
  const hex = crypto
    .createHash("sha256")
    .update(`trackflow-report:${normalized}`)
    .digest("hex")
    .slice(0, 12);
  return `rpt_${hex}`;
}

function getCookie(request: NextRequest, name: string) {
  return request.cookies.get(name)?.value || "";
}

function getGaClientId(request: NextRequest) {
  const ga = getCookie(request, "_ga");
  const parts = ga.split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  return ga;
}


function firstHeader(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value) return value;
  }

  return "";
}

function decodeHeaderValue(value: string) {
  const cleaned = cleanText(value, "");
  if (!cleaned) return "";

  try {
    return decodeURIComponent(cleaned.replace(/\+/g, " "));
  } catch {
    return cleaned;
  }
}

function getRequestGeo(request: NextRequest) {
  return {
    visitorCountry: sanitizeParam(
      firstHeader(request, ["x-vercel-ip-country", "cf-ipcountry"]),
      16,
    ),
    visitorRegion: sanitizeParam(
      firstHeader(request, ["x-vercel-ip-country-region"]),
      80,
    ),
    visitorCity: sanitizeParam(
      decodeHeaderValue(firstHeader(request, ["x-vercel-ip-city"])),
      120,
    ),
  };
}

function visitorLabelFromAnonymousId(anonymousId: string) {
  if (!anonymousId) return "";
  const short = crypto
    .createHash("sha256")
    .update(anonymousId)
    .digest("hex")
    .slice(0, 12);
  return `vis_${short}`;
}

function reportVisitorLabel(reportId: string, anonymousId: string) {
  if (!reportId || !anonymousId) return "";
  const short = crypto
    .createHash("sha256")
    .update(`${reportId}:${anonymousId}`)
    .digest("hex")
    .slice(0, 12);
  return `${reportId}_v_${short}`.slice(0, 80);
}

function journeyMeta(eventName: string) {
  const name = sanitizeEventName(eventName);

  if (name.includes("booking_section")) {
    return {
      visitStage: "interest",
      journeyStep: "07_booking_section_clicked",
      intentLevel: "high",
      intentScore: 65,
      isCoreEvent: false,
    };
  }

  if (name.includes("booking")) {
    return {
      visitStage: "booking",
      journeyStep: "08_booking_clicked",
      intentLevel: "hot",
      intentScore: 95,
      isCoreEvent: true,
    };
  }
  if (name.includes("email") || name.includes("linkedin")) {
    return {
      visitStage: "contact",
      journeyStep: "07_contact_clicked",
      intentLevel: "high",
      intentScore: 85,
      isCoreEvent: true,
    };
  }
  if (name.includes("assistant_message_sent")) {
    return {
      visitStage: "chat",
      journeyStep: "06_chat_message_sent",
      intentLevel: "high",
      intentScore: 80,
      isCoreEvent: true,
    };
  }
  if (
    name.includes("assistant_question_click") ||
    name.includes("assistant_open")
  ) {
    return {
      visitStage: "chat",
      journeyStep: "05_chat_engaged",
      intentLevel: "medium",
      intentScore: 55,
      isCoreEvent: false,
    };
  }
  if (name.includes("pdf_download")) {
    return {
      visitStage: "pdf",
      journeyStep: "04_pdf_downloaded",
      intentLevel: "high",
      intentScore: 75,
      isCoreEvent: true,
    };
  }
  if (name.includes("pdf_open") || name.includes("pdf_preview")) {
    return {
      visitStage: "pdf",
      journeyStep: "03_pdf_viewed",
      intentLevel: "medium",
      intentScore: 45,
      isCoreEvent: true,
    };
  }
  if (name.includes("video_progress_75") || name.includes("video_complete")) {
    return {
      visitStage: "video",
      journeyStep: "04_video_deep_watch",
      intentLevel: "high",
      intentScore: 70,
      isCoreEvent: false,
    };
  }
  if (
    name.includes("video_start") ||
    name.includes("video_progress") ||
    name.includes("video_visible")
  ) {
    return {
      visitStage: "video",
      journeyStep: "03_video_engaged",
      intentLevel: "medium",
      intentScore: 50,
      isCoreEvent: false,
    };
  }
  if (name.includes("scroll_90")) {
    return {
      visitStage: "reading",
      journeyStep: "03_deep_scroll",
      intentLevel: "medium",
      intentScore: 40,
      isCoreEvent: false,
    };
  }
  if (name.includes("scroll_50")) {
    return {
      visitStage: "reading",
      journeyStep: "02_mid_scroll",
      intentLevel: "low",
      intentScore: 25,
      isCoreEvent: false,
    };
  }

  if (name.includes("duration")) {
    return {
      visitStage: "duration",
      journeyStep: "02_time_on_report",
      intentLevel: "low",
      intentScore: 20,
      isCoreEvent: false,
    };
  }

  return {
    visitStage: "view",
    journeyStep: "01_report_viewed",
    intentLevel: "low",
    intentScore: 10,
    isCoreEvent: true,
  };
}

function normalizePayload(
  input: Record<string, unknown>,
  request: NextRequest,
) {
  const token = input.token || input.reportToken || "";
  const eventName = sanitizeEventName(input.eventName || "secure_report_event");
  const reportId = sanitizeParam(
    input.reportId || input.report_id || (token ? hashReportId(token) : ""),
    80,
  );
  const anonymousId = sanitizeParam(
    input.anonymousId || getCookie(request, "tfp_aid") || "",
    200,
  );
  const meta = journeyMeta(eventName);
  const geo = getRequestGeo(request);

  return {
    ...input,
    eventName,
    eventId: sanitizeParam(
      input.eventId || `${reportId || "rpt"}_${eventName}_${Date.now()}`,
      200,
    ),
    pageTitle: sanitizeParam(
      input.pageTitle || input.page_title || "Private Tracking Review",
      300,
    ),
    pageLocation: sanitizeParam(
      input.pageLocation ||
        input.page_location ||
        request.headers.get("referer") ||
        request.nextUrl.href,
      1200,
    ),
    pagePath: sanitizeParam(
      input.pagePath || input.page_path || request.nextUrl.pathname,
      500,
    ),
    referrer: sanitizeParam(
      input.referrer ||
        input.page_referrer ||
        request.headers.get("referer") ||
        "",
      1200,
    ),
    gaClientId: sanitizeParam(
      input.gaClientId || input.ga_client_id || getGaClientId(request),
      200,
    ),
    anonymousId,
    gaSessionId: sanitizeParam(
      input.gaSessionId || input.ga_session_id || input.session_id,
      80,
    ),
    reportId,
    domainSlug: sanitizeParam(input.domainSlug || input.domain_slug, 120),
    companyName: sanitizeParam(input.companyName || input.company_name, 180),
    primaryActionLabel: sanitizeParam(
      input.primaryActionLabel || input.primary_action_label,
      180,
    ),
    primaryPageLabel: sanitizeParam(
      input.primaryPageLabel ||
        input.primary_page_label ||
        "Secure tracking review",
      180,
    ),
    eventSection: sanitizeParam(
      input.eventSection || input.event_section || "secure_report",
      120,
    ),
    buttonLabel: sanitizeParam(
      input.buttonLabel || input.button_label || input.clickText || eventName,
      180,
    ),
    videoId: sanitizeParam(input.videoId || input.video_id, 80),
    videoProgress: input.videoProgress ?? input.video_progress,
    scrollPercent: input.scrollPercent ?? input.scroll_percent,
    deviceType: sanitizeParam(input.deviceType || input.device_type, 80),
    visitorId: sanitizeParam(
      input.visitorId ||
        input.visitor_id ||
        visitorLabelFromAnonymousId(anonymousId),
      80,
    ),
    reportVisitorId: sanitizeParam(
      input.reportVisitorId ||
        input.report_visitor_id ||
        reportVisitorLabel(reportId, anonymousId),
      100,
    ),
    reportSessionId: sanitizeParam(
      input.reportSessionId || input.report_session_id,
      100,
    ),
    visitStage: sanitizeParam(
      input.visitStage || input.visit_stage || meta.visitStage,
      80,
    ),
    journeyStep: sanitizeParam(
      input.journeyStep || input.journey_step || meta.journeyStep,
      80,
    ),
    intentLevel: sanitizeParam(
      input.intentLevel || input.intent_level || meta.intentLevel,
      40,
    ),
    intentScore: input.intentScore ?? input.intent_score ?? meta.intentScore,
    isCoreEvent: input.isCoreEvent ?? input.is_core_event ?? meta.isCoreEvent,
    transport: sanitizeParam(input.transport || "report_event_route", 80),
    visitorCountry: sanitizeParam(
      input.visitorCountry || input.visitor_country || geo.visitorCountry,
      16,
    ),
    visitorRegion: sanitizeParam(
      input.visitorRegion || input.visitor_region || geo.visitorRegion,
      80,
    ),
    visitorCity: sanitizeParam(
      input.visitorCity || input.visitor_city || geo.visitorCity,
      120,
    ),
    clickText: sanitizeParam(
      input.clickText || input.buttonLabel || input.button_label,
      300,
    ),
    clickHref: sanitizeParam(input.clickHref || input.click_href, 1200),
    clickLocation: sanitizeParam(
      input.clickLocation ||
        input.click_location ||
        input.eventSection ||
        input.event_section,
      200,
    ),
    timeOnReportSeconds: input.timeOnReportSeconds ?? input.time_on_report_seconds,
    timeOnReportMilliseconds:
      input.timeOnReportMilliseconds ?? input.time_on_report_milliseconds,
    timeOnReportDeltaSeconds:
      input.timeOnReportDeltaSeconds ?? input.time_on_report_delta_seconds,
    timeOnReportDeltaMilliseconds:
      input.timeOnReportDeltaMilliseconds ??
      input.time_on_report_delta_milliseconds,
    durationEventType: sanitizeParam(
      input.durationEventType || input.duration_event_type,
      80,
    ),
  };
}

function cleanParams(params: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    output[key] = value;
  }

  return output;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toGa4Boolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return undefined;
  if (["1", "true", "yes", "y"].includes(text)) return true;
  if (["0", "false", "no", "n"].includes(text)) return false;
  return undefined;
}


function clampNumber(value: unknown, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(min, Math.min(max, numeric));
}

function intentLabelFromScore(score: number): "low" | "medium" | "high" | "hot" {
  if (score >= 90) return "hot";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function scoreForSummaryEvent(eventName: string): number {
  const name = sanitizeEventName(eventName);
  if (name.includes("booking")) return 95;
  if (name.includes("whatsapp") || name.includes("email") || name.includes("linkedin") || name.includes("cta_click")) return 85;
  if (name.includes("assistant_message_sent")) return 80;
  if (name.includes("video_watched_60")) return 80;
  if (name.includes("pdf_download_success") || name.includes("pdf_downloaded")) return 75;
  if (name.includes("assistant_open")) return 55;
  if (name.includes("pdf_open")) return 45;
  return 10;
}

function ctaTypeFromEventName(eventName: string): "booking" | "whatsapp" | "email" | "linkedin" | "cta" {
  const name = sanitizeEventName(eventName);
  if (name.includes("booking")) return "booking";
  if (name.includes("whatsapp")) return "whatsapp";
  if (name.includes("email") || name.includes("gmail")) return "email";
  if (name.includes("linkedin")) return "linkedin";
  return "cta";
}

const DURATION_MIN_INCREMENT_SECONDS = 1;
const DURATION_MAX_SINGLE_INCREMENT_SECONDS = 30 * 60;
const DURATION_MAX_SESSION_SECONDS = 24 * 60 * 60;

function roundedDurationSeconds(...values: unknown[]): number {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) return Math.round(numeric);
  }
  return 0;
}

function normalizeDurationSessionId(value: unknown): string {
  return sanitizeParam(value, 100).replace(/[^a-zA-Z0-9_:-]/g, "").slice(0, 100);
}

function normalizeDurationEventId(value: unknown): string {
  return sanitizeParam(value, 200).replace(/[\r\n]/g, "").slice(0, 200);
}

async function buildDurationSummaryPatch(input: {
  token: string;
  payload: Record<string, unknown>;
  now: any;
  FieldValue: typeof admin.firestore.FieldValue;
}): Promise<{ shouldWrite: boolean; update: Record<string, unknown>; incrementSeconds: number; reason?: string }> {
  const payload = input.payload;
  const FieldValue = input.FieldValue;
  const eventId = normalizeDurationEventId(payload.eventId || payload.event_id);
  const reportSessionId = normalizeDurationSessionId(
    payload.reportSessionId || payload.report_session_id || payload.gaSessionId || payload.ga_session_id,
  );
  const durationEventType = sanitizeParam(payload.durationEventType || payload.duration_event_type, 80);

  const rawDeltaSeconds = roundedDurationSeconds(
    payload.timeOnReportDeltaSeconds,
    payload.time_on_report_delta_seconds,
    Number((payload.timeOnReportDeltaMilliseconds ?? payload.time_on_report_delta_milliseconds) || 0) / 1000,
  );
  const totalSeconds = Math.min(
    DURATION_MAX_SESSION_SECONDS,
    roundedDurationSeconds(
      payload.timeOnReportSeconds,
      payload.time_on_report_seconds,
      Number((payload.timeOnReportMilliseconds ?? payload.time_on_report_milliseconds) || 0) / 1000,
    ),
  );

  if (totalSeconds < 3 && rawDeltaSeconds < DURATION_MIN_INCREMENT_SECONDS) {
    return { shouldWrite: false, update: {}, incrementSeconds: 0, reason: "duration_too_small" };
  }

  let previous: Record<string, any> = {};
  try {
    const snapshot = await adminDb.collection("audit_reports").doc(input.token).get();
    previous = snapshot.exists ? (snapshot.data() || {}) : {};
  } catch {
    previous = {};
  }

  const previousEventId = normalizeDurationEventId(previous.lastActiveDurationEventId || previous.last_active_duration_event_id);
  if (eventId && previousEventId && eventId === previousEventId) {
    return { shouldWrite: false, update: {}, incrementSeconds: 0, reason: "duplicate_duration_event" };
  }

  const previousSessionId = normalizeDurationSessionId(previous.lastActiveReportSessionId || previous.last_active_report_session_id);
  const previousSessionTotal = Math.max(0, Number(previous.lastActiveSessionTotalSeconds || previous.last_active_session_total_seconds || 0));

  let incrementSeconds = 0;

  if (reportSessionId && previousSessionId && reportSessionId === previousSessionId && totalSeconds > 0) {
    // Same browser report session: use the monotonic total to avoid double-counting
    // ping + final events that repeat the same elapsed time.
    incrementSeconds = Math.max(0, totalSeconds - previousSessionTotal);
  } else if (totalSeconds > 0 && rawDeltaSeconds <= 0) {
    // New session with only a total value.
    incrementSeconds = totalSeconds;
  } else {
    incrementSeconds = rawDeltaSeconds;
    if (totalSeconds > 0) incrementSeconds = Math.min(incrementSeconds, totalSeconds);
  }

  incrementSeconds = Math.max(0, Math.min(DURATION_MAX_SINGLE_INCREMENT_SECONDS, Math.round(incrementSeconds)));

  if (incrementSeconds < DURATION_MIN_INCREMENT_SECONDS && totalSeconds < 60) {
    return { shouldWrite: false, update: {}, incrementSeconds: 0, reason: "no_new_active_seconds" };
  }

  const sameSession = Boolean(reportSessionId && previousSessionId && reportSessionId === previousSessionId);
  const nextSessionTotalSeconds = sameSession
    ? Math.max(totalSeconds, previousSessionTotal + incrementSeconds, previousSessionTotal)
    : Math.max(totalSeconds, incrementSeconds);

  const update: Record<string, unknown> = {
    lastSeenAt: input.now,
    lastActiveDurationAt: input.now,
    last_active_duration_at: input.now,
    lastReportedActiveSeconds: nextSessionTotalSeconds,
    last_reported_active_seconds: nextSessionTotalSeconds,
    lastActiveSessionTotalSeconds: nextSessionTotalSeconds,
    last_active_session_total_seconds: nextSessionTotalSeconds,
    lastDurationEventType: durationEventType,
    last_duration_event_type: durationEventType,
  };

  if (reportSessionId) {
    update.lastActiveReportSessionId = reportSessionId;
    update.last_active_report_session_id = reportSessionId;
  }
  if (eventId) {
    update.lastActiveDurationEventId = eventId;
    update.last_active_duration_event_id = eventId;
  }
  if (incrementSeconds > 0) {
    update.estimatedActiveSeconds = FieldValue.increment(incrementSeconds);
    update.estimated_active_seconds = FieldValue.increment(incrementSeconds);
  }

  return { shouldWrite: true, update, incrementSeconds };
}

async function updateSecureReportLightweightSummary(payload: Record<string, unknown>) {
  const token = normalizeToken(payload.token || payload.reportToken || payload.report_token || "");
  if (!token || token === "unknown") return { skipped: true, reason: "missing_report_token" };

  const eventName = sanitizeEventName(payload.eventName || payload.event_name || "secure_report_event");
  const FieldValue = admin.firestore.FieldValue;
  const now = FieldValue.serverTimestamp();
  const update: Record<string, unknown> = {
    updatedAt: now,
  };
  let shouldWrite = false;
  let touchActivity = false;

  const country = sanitizeParam(payload.visitorCountry || payload.visitor_country, 16);
  if (country) {
    update.visitorCountry = country;
    update.lastVisitorCountry = country;
  }

  const region = sanitizeParam(payload.visitorRegion || payload.visitor_region, 80);
  if (region) update.lastVisitorRegion = region;

  const city = sanitizeParam(payload.visitorCity || payload.visitor_city, 120);
  if (city) update.lastVisitorCity = city;

  if (eventName === "secure_report_view") {
    update.reportPageViewed = true;
    update.lastViewedAt = now;
    update.viewedAt = now;
    update.viewCount = FieldValue.increment(1);
    update.viewedCount = FieldValue.increment(1);
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("duration")) {
    const durationPatch = await buildDurationSummaryPatch({ token, payload, now, FieldValue });
    if (durationPatch.shouldWrite) {
      Object.assign(update, durationPatch.update);
      shouldWrite = true;
      touchActivity = true;
    }
  }

  if (eventName.includes("pdf_open")) {
    update.pdfOpened = true;
    update.lastPdfOpenedAt = now;
    update.pdfOpenCount = FieldValue.increment(1);
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("pdf_download_success") || eventName.includes("pdf_downloaded")) {
    update.pdfDownloaded = true;
    update.lastDownloadedAt = now;
    update.lastPdfDownloadedAt = now;
    update.downloadCount = FieldValue.increment(1);
    update.pdfDownloadCount = FieldValue.increment(1);
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("video_play_click") || eventName.includes("evidence_video_play_click")) {
    update.videoPlayClicked = true;
    update.videoPlayClickCount = FieldValue.increment(1);
    update.lastVideoPlayClickedAt = now;
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("video_watched_60")) {
    update.videoWatched = true;
    update.videoWatchedThreshold = 60;
    update.lastVideoWatchedAt = now;
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("assistant_open")) {
    update.chatboxOpened = true;
    update.chatboxOpenCount = FieldValue.increment(1);
    update.lastChatboxOpenedAt = now;
    shouldWrite = true;
    touchActivity = true;
  }

  if (eventName.includes("assistant_message_sent")) {
    update.chatQuestionAsked = true;
    update.chatQuestionCount = FieldValue.increment(1);
    update.lastChatQuestionAt = now;
    shouldWrite = true;
    touchActivity = true;
  }

  const isCtaEvent =
    eventName.includes("booking") ||
    eventName.includes("whatsapp") ||
    eventName.includes("email") ||
    eventName.includes("gmail") ||
    eventName.includes("linkedin") ||
    eventName === "secure_report_cta_click";

  if (isCtaEvent) {
    const ctaType = ctaTypeFromEventName(eventName);
    update.ctaClicked = true;
    update.ctaClickCount = FieldValue.increment(1);
    update.lastCtaClickedAt = now;
    update.lastCtaType = ctaType;

    if (ctaType === "booking") update.bookingClicked = true;
    if (ctaType === "whatsapp") update.whatsappClicked = true;
    if (ctaType === "email") {
      update.emailClicked = true;
      update.gmailClicked = true;
    }
    if (ctaType === "linkedin") update.linkedinClicked = true;

    shouldWrite = true;
    touchActivity = true;
  }

  if (!shouldWrite) return { skipped: true, reason: "non_summary_event" };

  if (touchActivity) {
    const score = scoreForSummaryEvent(eventName);
    update.lastActivityAt = now;
    update.lastActivityEvent = eventName;
    update.lastIntentScore = score;
    update.lastIntentLabel = intentLabelFromScore(score);
  }

  await adminDb.collection("audit_reports").doc(token).set(update, { merge: true });
  return { ok: true };
}

function isAnalyticsDebugEnabled(): boolean {
  return (
    process.env.TRACKFLOW_ANALYTICS_DEBUG === "true" ||
    process.env.TRACKFLOW_ANALYTICS_DEBUG === "1"
  );
}

async function sendGa4SecureReportEvent(payload: Record<string, unknown>) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true, reason: "missing_ga4_env" };
  }

  const eventName = sanitizeEventName(payload.eventName);
  const clientId = cleanClientId(
    payload.anonymousId ||
      payload.anonymous_id ||
      payload.gaClientId ||
      payload.ga_client_id,
  );

  if (!clientId) {
    return { skipped: true, reason: "missing_stable_client_id" };
  }

  const params = cleanParams({
    event_id: sanitizeParam(payload.eventId || payload.event_id, 200),
    engagement_time_msec: 1,
    session_id: normalizeGaSessionId(
      payload.gaSessionId || payload.ga_session_id || payload.session_id,
    ),
    debug_mode:
      process.env.GA4_DEBUG_MODE === "true" ||
      process.env.GA4_DEBUG_MODE === "1"
        ? true
        : undefined,

    page_title: sanitizeParam(payload.pageTitle || payload.page_title, 300),
    page_location: sanitizeParam(
      payload.pageLocation || payload.page_location,
      1200,
    ),
    page_path: sanitizeParam(payload.pagePath || payload.page_path, 500),
    page_referrer: sanitizeParam(
      payload.referrer || payload.page_referrer,
      1200,
    ),

    utm_source: sanitizeParam(payload.utm_source, 200),
    utm_medium: sanitizeParam(payload.utm_medium, 200),
    utm_campaign: sanitizeParam(payload.utm_campaign, 300),
    utm_term: sanitizeParam(payload.utm_term, 300),
    utm_content: sanitizeParam(payload.utm_content, 300),
    gclid: sanitizeParam(payload.gclid, 300),
    fbclid: sanitizeParam(payload.fbclid, 500),
    msclkid: sanitizeParam(payload.msclkid, 300),

    report_id: sanitizeParam(payload.reportId || payload.report_id, 80),
    domain_slug: sanitizeParam(payload.domainSlug || payload.domain_slug, 120),
    company_name: sanitizeParam(
      payload.companyName || payload.company_name,
      180,
    ),
    primary_action_label: sanitizeParam(
      payload.primaryActionLabel || payload.primary_action_label,
      180,
    ),
    primary_page_label: sanitizeParam(
      payload.primaryPageLabel || payload.primary_page_label,
      180,
    ),
    event_section: sanitizeParam(
      payload.eventSection || payload.event_section,
      120,
    ),
    button_label: sanitizeParam(
      payload.buttonLabel || payload.button_label,
      180,
    ),
    video_id: sanitizeParam(payload.videoId || payload.video_id, 80),
    video_progress: toNumber(payload.videoProgress ?? payload.video_progress),
    scroll_percent: toNumber(payload.scrollPercent ?? payload.scroll_percent),
    device_type: sanitizeParam(payload.deviceType || payload.device_type, 80),

    visitor_id: sanitizeParam(payload.visitorId || payload.visitor_id, 80),
    report_visitor_id: sanitizeParam(
      payload.reportVisitorId || payload.report_visitor_id,
      100,
    ),
    report_session_id: sanitizeParam(
      payload.reportSessionId || payload.report_session_id,
      100,
    ),
    visit_stage: sanitizeParam(payload.visitStage || payload.visit_stage, 80),
    journey_step: sanitizeParam(
      payload.journeyStep || payload.journey_step,
      80,
    ),
    intent_level: sanitizeParam(
      payload.intentLevel || payload.intent_level,
      40,
    ),
    intent_score: toNumber(payload.intentScore ?? payload.intent_score),
    is_core_event: toGa4Boolean(payload.isCoreEvent ?? payload.is_core_event),
    transport: sanitizeParam(payload.transport || "report_event_route", 80),
    visitor_country: sanitizeParam(
      payload.visitorCountry || payload.visitor_country,
      16,
    ),
    visitor_region: sanitizeParam(
      payload.visitorRegion || payload.visitor_region,
      80,
    ),
    visitor_city: sanitizeParam(payload.visitorCity || payload.visitor_city, 120),

    question_key: sanitizeParam(
      payload.question_key || payload.questionKey,
      180,
    ),
    question_source: sanitizeParam(
      payload.question_source || payload.questionSource,
      80,
    ),
    message_length: toNumber(payload.message_length ?? payload.messageLength),

    time_on_report_seconds: toNumber(
      payload.timeOnReportSeconds ?? payload.time_on_report_seconds,
    ),
    time_on_report_milliseconds: toNumber(
      payload.timeOnReportMilliseconds ?? payload.time_on_report_milliseconds,
    ),
    time_on_report_delta_seconds: toNumber(
      payload.timeOnReportDeltaSeconds ?? payload.time_on_report_delta_seconds,
    ),
    time_on_report_delta_milliseconds: toNumber(
      payload.timeOnReportDeltaMilliseconds ??
        payload.time_on_report_delta_milliseconds,
    ),
    duration_event_type: sanitizeParam(
      payload.durationEventType || payload.duration_event_type,
      80,
    ),

    click_text: sanitizeParam(
      payload.clickText ||
        payload.click_text ||
        payload.buttonLabel ||
        payload.button_label,
      300,
    ),
    click_href: sanitizeParam(payload.clickHref || payload.click_href, 1200),
    click_location: sanitizeParam(
      payload.clickLocation ||
        payload.click_location ||
        payload.eventSection ||
        payload.event_section,
      200,
    ),

    traffic_type:
      process.env.NODE_ENV === "production" ? undefined : "internal_test",
  });

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      events: [{ name: eventName, params }],
    }),
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const input =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const payload = normalizePayload(input, request);
    const summary = await updateSecureReportLightweightSummary(payload).catch((error) => ({
      ok: false,
      error: String(error?.message || error || "summary_update_failed").slice(0, 300),
    }));
    const ga4 = await sendGa4SecureReportEvent(payload);

    if (isAnalyticsDebugEnabled()) {
      console.info("[trackflow-analytics] report_event_post", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        summary,
        ga4,
      });
    }

    return NextResponse.json({ success: true, ga4, summary });
  } catch (error) {
    console.error("Report event forward failed:", error);
    return NextResponse.json(
      { success: false, message: "Report event failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const queryPayload: Record<string, unknown> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryPayload[key] = value;
    });

    const payload = normalizePayload(queryPayload, request);
    const summary = await updateSecureReportLightweightSummary(payload).catch((error) => ({
      ok: false,
      error: String(error?.message || error || "summary_update_failed").slice(0, 300),
    }));
    const ga4 = await sendGa4SecureReportEvent(payload);

    if (isAnalyticsDebugEnabled()) {
      console.info("[trackflow-analytics] report_event_get", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        summary,
        ga4,
      });
    }

    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "content-type": "image/gif",
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Report event pixel failed:", error);

    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "content-type": "image/gif",
        "cache-control": "no-store, max-age=0",
      },
    });
  }
}
