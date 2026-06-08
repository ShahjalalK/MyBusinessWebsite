import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RedirectKind = "booking" | "email" | "linkedin" | "cta";

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
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

function sanitizeKind(value: unknown): RedirectKind {
  const text = cleanText(value, "cta").toLowerCase();
  if (text === "booking" || text === "email" || text === "linkedin" || text === "cta") return text;
  return "cta";
}

function eventNameForKind(kind: RedirectKind) {
  if (kind === "booking") return "secure_report_booking_click";
  if (kind === "email") return "secure_report_email_click";
  if (kind === "linkedin") return "secure_report_linkedin_click";
  return "secure_report_cta_click";
}

function metaForKind(kind: RedirectKind) {
  if (kind === "booking") {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }
  return { visitStage: "contact", journeyStep: "07_contact_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
}

function safeDestination(value: string, request: NextRequest) {
  const raw = cleanText(value, "");
  if (!raw) return "/";

  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (/^mailto:/i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    try {
      const relative = new URL(raw, request.nextUrl.origin);
      if (relative.origin === request.nextUrl.origin) return `${relative.pathname}${relative.search}${relative.hash}`;
    } catch {}
  }

  return "/";
}

function cleanParams(params: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    output[key] = value;
  }

  return output;
}

function isAnalyticsDebugEnabled() {
  return process.env.TRACKFLOW_ANALYTICS_DEBUG === "true" || process.env.TRACKFLOW_ANALYTICS_DEBUG === "1";
}

async function sendGa4RedirectEvent(payload: Record<string, unknown>) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true, reason: "missing_ga4_env" };
  }

  const eventName = cleanText(payload.eventName, "secure_report_cta_click")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "secure_report_cta_click";

  const clientId =
    sanitizeParam(payload.gaClientId || payload.anonymousId, 200) ||
    crypto.randomUUID();

  const params = cleanParams({
    event_id: sanitizeParam(payload.eventId, 200),
    engagement_time_msec: 1,
    debug_mode: process.env.GA4_DEBUG_MODE === "true" || process.env.GA4_DEBUG_MODE === "1" ? true : undefined,

    page_title: sanitizeParam(payload.pageTitle, 300),
    page_location: sanitizeParam(payload.pageLocation, 1200),
    page_path: sanitizeParam(payload.pagePath, 500),
    page_referrer: sanitizeParam(payload.referrer, 1200),

    report_id: sanitizeParam(payload.reportId, 80),
    domain_slug: sanitizeParam(payload.domainSlug, 120),
    primary_action_label: sanitizeParam(payload.primaryActionLabel, 180),
    primary_page_label: sanitizeParam(payload.primaryPageLabel, 180),
    event_section: sanitizeParam(payload.eventSection, 120),
    button_label: sanitizeParam(payload.buttonLabel, 180),

    visitor_id: sanitizeParam(payload.visitorId, 80),
    report_visitor_id: sanitizeParam(payload.reportVisitorId, 100),
    visit_stage: sanitizeParam(payload.visitStage, 80),
    journey_step: sanitizeParam(payload.journeyStep, 80),
    intent_level: sanitizeParam(payload.intentLevel, 40),
    intent_score: Number(payload.intentScore),
    is_core_event: Boolean(payload.isCoreEvent),
    transport: sanitizeParam(payload.transport || "server_redirect", 80),

    click_text: sanitizeParam(payload.clickText, 300),
    click_href: sanitizeParam(payload.clickHref, 1200),
    click_location: sanitizeParam(payload.clickLocation, 200),

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

async function forwardClickEvent(request: NextRequest, destination: string) {
  const params = request.nextUrl.searchParams;
  const token = params.get("token") || "";
  const kind = sanitizeKind(params.get("kind"));
  const eventName = eventNameForKind(kind);
  const reportId = hashReportId(token);
  const anonymousId = sanitizeParam(getCookie(request, "tfp_aid"), 200);
  const meta = metaForKind(kind);
  const label = sanitizeParam(params.get("label") || eventName, 180);
  const eventSection = sanitizeParam(params.get("eventSection") || kind, 120);
  const domainSlug = sanitizeParam(params.get("domainSlug") || params.get("domain_slug") || "", 120);

  const payload = {
    eventName,
    eventId: `${reportId}_${eventName}_${Date.now()}`,
    pageTitle: "Private Tracking Review",
    pageLocation: sanitizeParam(request.headers.get("referer") || request.nextUrl.href, 1200),
    pagePath: request.nextUrl.pathname,
    referrer: request.headers.get("referer") || "",
    gaClientId: getGaClientId(request),
    anonymousId,
    reportId,
    domainSlug,
    primaryActionLabel: sanitizeParam(params.get("primaryActionLabel") || label, 180),
    primaryPageLabel: sanitizeParam(params.get("primaryPageLabel") || "Secure tracking review", 180),
    eventSection,
    buttonLabel: label,
    visitorId: visitorLabelFromAnonymousId(anonymousId),
    reportVisitorId: reportVisitorLabel(reportId, anonymousId),
    visitStage: meta.visitStage,
    journeyStep: meta.journeyStep,
    intentLevel: meta.intentLevel,
    intentScore: meta.intentScore,
    isCoreEvent: meta.isCoreEvent,
    transport: "server_redirect",
    clickText: label,
    clickHref: sanitizeParam(destination, 1200),
    clickLocation: eventSection,
  };

  const ga4 = await sendGa4RedirectEvent(payload);

  if (isAnalyticsDebugEnabled()) {
    console.info("[trackflow-analytics] report_redirect", {
      eventName,
      reportId,
      domainSlug,
      destination,
      ga4,
    });
  }
}

export async function GET(request: NextRequest) {
  const destination = safeDestination(request.nextUrl.searchParams.get("url") || "", request);

  try {
    await forwardClickEvent(request, destination);
  } catch (error) {
    console.error("Report redirect tracking failed:", error);
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: destination,
      "cache-control": "no-store, max-age=0",
    },
  });
}
