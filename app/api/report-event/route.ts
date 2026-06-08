import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function sanitizeEventName(value: unknown) {
  return cleanText(value, "secure_report_event")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "secure_report_event";
}

function sanitizeParam(value: unknown, max = 160) {
  return cleanText(value, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, max);
}

function normalizeToken(value: unknown) {
  return cleanText(value, "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96) || "unknown";
}

function hashReportId(token: unknown) {
  const normalized = normalizeToken(token);
  const hex = crypto.createHash("sha256").update(`trackflow-report:${normalized}`).digest("hex").slice(0, 12);
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

function visitorLabelFromAnonymousId(anonymousId: string) {
  if (!anonymousId) return "";
  const short = crypto.createHash("sha256").update(anonymousId).digest("hex").slice(0, 12);
  return `vis_${short}`;
}

function reportVisitorLabel(reportId: string, anonymousId: string) {
  if (!reportId || !anonymousId) return "";
  const short = crypto.createHash("sha256").update(`${reportId}:${anonymousId}`).digest("hex").slice(0, 12);
  return `${reportId}_v_${short}`.slice(0, 80);
}

function journeyMeta(eventName: string) {
  const name = sanitizeEventName(eventName);

  if (name.includes("booking")) {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }
  if (name.includes("email") || name.includes("linkedin")) {
    return { visitStage: "contact", journeyStep: "07_contact_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
  }
  if (name.includes("assistant_message_sent")) {
    return { visitStage: "chat", journeyStep: "06_chat_message_sent", intentLevel: "high", intentScore: 80, isCoreEvent: true };
  }
  if (name.includes("assistant_question_click") || name.includes("assistant_open")) {
    return { visitStage: "chat", journeyStep: "05_chat_engaged", intentLevel: "medium", intentScore: 55, isCoreEvent: false };
  }
  if (name.includes("pdf_download")) {
    return { visitStage: "pdf", journeyStep: "04_pdf_downloaded", intentLevel: "high", intentScore: 75, isCoreEvent: true };
  }
  if (name.includes("pdf_open") || name.includes("pdf_preview")) {
    return { visitStage: "pdf", journeyStep: "03_pdf_viewed", intentLevel: "medium", intentScore: 45, isCoreEvent: true };
  }
  if (name.includes("video_progress_75") || name.includes("video_complete")) {
    return { visitStage: "video", journeyStep: "04_video_deep_watch", intentLevel: "high", intentScore: 70, isCoreEvent: false };
  }
  if (name.includes("video_start") || name.includes("video_progress") || name.includes("video_visible")) {
    return { visitStage: "video", journeyStep: "03_video_engaged", intentLevel: "medium", intentScore: 50, isCoreEvent: false };
  }
  if (name.includes("scroll_90")) {
    return { visitStage: "reading", journeyStep: "03_deep_scroll", intentLevel: "medium", intentScore: 40, isCoreEvent: false };
  }
  if (name.includes("scroll_50")) {
    return { visitStage: "reading", journeyStep: "02_mid_scroll", intentLevel: "low", intentScore: 25, isCoreEvent: false };
  }

  return { visitStage: "view", journeyStep: "01_report_viewed", intentLevel: "low", intentScore: 10, isCoreEvent: true };
}

function normalizePayload(input: Record<string, unknown>, request: NextRequest) {
  const token = input.token || input.reportToken || "";
  const eventName = sanitizeEventName(input.eventName || "secure_report_event");
  const reportId = sanitizeParam(input.reportId || input.report_id || (token ? hashReportId(token) : ""), 80);
  const anonymousId = sanitizeParam(input.anonymousId || getCookie(request, "tfp_aid") || "", 200);
  const meta = journeyMeta(eventName);

  return {
    ...input,
    eventName,
    eventId: sanitizeParam(input.eventId || `${reportId || "rpt"}_${eventName}_${Date.now()}`, 200),
    pageTitle: sanitizeParam(input.pageTitle || input.page_title || "Private Tracking Review", 300),
    pageLocation: sanitizeParam(input.pageLocation || input.page_location || request.headers.get("referer") || request.nextUrl.href, 1200),
    pagePath: sanitizeParam(input.pagePath || input.page_path || request.nextUrl.pathname, 500),
    referrer: sanitizeParam(input.referrer || input.page_referrer || request.headers.get("referer") || "", 1200),
    gaClientId: sanitizeParam(input.gaClientId || getGaClientId(request), 200),
    anonymousId,
    reportId,
    domainSlug: sanitizeParam(input.domainSlug || input.domain_slug, 120),
    companyName: sanitizeParam(input.companyName || input.company_name, 180),
    primaryActionLabel: sanitizeParam(input.primaryActionLabel || input.primary_action_label, 180),
    primaryPageLabel: sanitizeParam(input.primaryPageLabel || input.primary_page_label || "Secure tracking review", 180),
    eventSection: sanitizeParam(input.eventSection || input.event_section || "secure_report", 120),
    buttonLabel: sanitizeParam(input.buttonLabel || input.button_label || input.clickText || eventName, 180),
    videoId: sanitizeParam(input.videoId || input.video_id, 80),
    videoProgress: input.videoProgress ?? input.video_progress,
    scrollPercent: input.scrollPercent ?? input.scroll_percent,
    deviceType: sanitizeParam(input.deviceType || input.device_type, 80),
    visitorId: sanitizeParam(input.visitorId || input.visitor_id || visitorLabelFromAnonymousId(anonymousId), 80),
    reportVisitorId: sanitizeParam(input.reportVisitorId || input.report_visitor_id || reportVisitorLabel(reportId, anonymousId), 100),
    reportSessionId: sanitizeParam(input.reportSessionId || input.report_session_id, 100),
    visitStage: sanitizeParam(input.visitStage || input.visit_stage || meta.visitStage, 80),
    journeyStep: sanitizeParam(input.journeyStep || input.journey_step || meta.journeyStep, 80),
    intentLevel: sanitizeParam(input.intentLevel || input.intent_level || meta.intentLevel, 40),
    intentScore: input.intentScore ?? input.intent_score ?? meta.intentScore,
    isCoreEvent: input.isCoreEvent ?? input.is_core_event ?? meta.isCoreEvent,
    transport: sanitizeParam(input.transport || "report_event_route", 80),
    clickText: sanitizeParam(input.clickText || input.buttonLabel || input.button_label, 300),
    clickHref: sanitizeParam(input.clickHref || input.click_href, 1200),
    clickLocation: sanitizeParam(input.clickLocation || input.click_location || input.eventSection || input.event_section, 200),
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
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return undefined;
  if (["1", "true", "yes", "y"].includes(text)) return true;
  if (["0", "false", "no", "n"].includes(text)) return false;
  return undefined;
}

function isAnalyticsDebugEnabled(): boolean {
  return process.env.TRACKFLOW_ANALYTICS_DEBUG === "true" || process.env.TRACKFLOW_ANALYTICS_DEBUG === "1";
}

async function sendGa4SecureReportEvent(payload: Record<string, unknown>) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true, reason: "missing_ga4_env" };
  }

  const eventName = sanitizeEventName(payload.eventName);
  const clientId =
    sanitizeParam(payload.gaClientId || payload.ga_client_id || payload.anonymousId || payload.anonymous_id, 200) ||
    crypto.randomUUID();

  const params = cleanParams({
    event_id: sanitizeParam(payload.eventId || payload.event_id, 200),
    engagement_time_msec: 1,
    debug_mode: process.env.GA4_DEBUG_MODE === "true" || process.env.GA4_DEBUG_MODE === "1" ? true : undefined,

    page_title: sanitizeParam(payload.pageTitle || payload.page_title, 300),
    page_location: sanitizeParam(payload.pageLocation || payload.page_location, 1200),
    page_path: sanitizeParam(payload.pagePath || payload.page_path, 500),
    page_referrer: sanitizeParam(payload.referrer || payload.page_referrer, 1200),

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
    company_name: sanitizeParam(payload.companyName || payload.company_name, 180),
    primary_action_label: sanitizeParam(payload.primaryActionLabel || payload.primary_action_label, 180),
    primary_page_label: sanitizeParam(payload.primaryPageLabel || payload.primary_page_label, 180),
    event_section: sanitizeParam(payload.eventSection || payload.event_section, 120),
    button_label: sanitizeParam(payload.buttonLabel || payload.button_label, 180),
    video_id: sanitizeParam(payload.videoId || payload.video_id, 80),
    video_progress: toNumber(payload.videoProgress ?? payload.video_progress),
    scroll_percent: toNumber(payload.scrollPercent ?? payload.scroll_percent),
    device_type: sanitizeParam(payload.deviceType || payload.device_type, 80),

    visitor_id: sanitizeParam(payload.visitorId || payload.visitor_id, 80),
    report_visitor_id: sanitizeParam(payload.reportVisitorId || payload.report_visitor_id, 100),
    report_session_id: sanitizeParam(payload.reportSessionId || payload.report_session_id, 100),
    visit_stage: sanitizeParam(payload.visitStage || payload.visit_stage, 80),
    journey_step: sanitizeParam(payload.journeyStep || payload.journey_step, 80),
    intent_level: sanitizeParam(payload.intentLevel || payload.intent_level, 40),
    intent_score: toNumber(payload.intentScore ?? payload.intent_score),
    is_core_event: toGa4Boolean(payload.isCoreEvent ?? payload.is_core_event),
    transport: sanitizeParam(payload.transport || "report_event_route", 80),

    question_key: sanitizeParam(payload.question_key || payload.questionKey, 180),
    question_source: sanitizeParam(payload.question_source || payload.questionSource, 80),
    message_length: toNumber(payload.message_length ?? payload.messageLength),

    click_text: sanitizeParam(payload.clickText || payload.click_text || payload.buttonLabel || payload.button_label, 300),
    click_href: sanitizeParam(payload.clickHref || payload.click_href, 1200),
    click_location: sanitizeParam(payload.clickLocation || payload.click_location || payload.eventSection || payload.event_section, 200),

    traffic_type: process.env.NODE_ENV === "production" ? undefined : "internal_test",
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
    const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const payload = normalizePayload(input, request);
    const ga4 = await sendGa4SecureReportEvent(payload);

    if (isAnalyticsDebugEnabled()) {
      console.info("[trackflow-analytics] report_event_post", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        ga4,
      });
    }

    return NextResponse.json({ success: true, ga4 });
  } catch (error) {
    console.error("Report event forward failed:", error);
    return NextResponse.json({ success: false, message: "Report event failed." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const queryPayload: Record<string, unknown> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryPayload[key] = value;
    });

    const payload = normalizePayload(queryPayload, request);
    const ga4 = await sendGa4SecureReportEvent(payload);

    if (isAnalyticsDebugEnabled()) {
      console.info("[trackflow-analytics] report_event_get", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
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
