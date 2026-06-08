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

async function forwardToServerTrack(request: NextRequest, payload: Record<string, unknown>) {
  const url = new URL("/api/server-track", request.nextUrl.origin);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
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
    const forwarded = await forwardToServerTrack(request, payload);

    if (process.env.TRACKFLOW_ANALYTICS_DEBUG === "true") {
      console.info("[trackflow-analytics] report_event_post", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        forwarded,
      });
    }

    return NextResponse.json({ success: true, forwarded });
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
    const forwarded = await forwardToServerTrack(request, payload);

    if (process.env.TRACKFLOW_ANALYTICS_DEBUG === "true") {
      console.info("[trackflow-analytics] report_event_get", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        forwarded,
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
