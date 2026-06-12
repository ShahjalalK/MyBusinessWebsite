import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RedirectKind = "booking" | "email" | "linkedin" | "whatsapp" | "cta";

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
  if (text === "booking" || text === "email" || text === "linkedin" || text === "whatsapp" || text === "cta") return text;
  return "cta";
}

function eventNameForKind(kind: RedirectKind) {
  if (kind === "booking") return "secure_report_booking_click";
  if (kind === "email") return "secure_report_email_click";
  if (kind === "linkedin") return "secure_report_linkedin_click";
  if (kind === "whatsapp") return "secure_report_whatsapp_click";
  return "secure_report_cta_click";
}

function metaForKind(kind: RedirectKind) {
  if (kind === "booking") {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }
  if (kind === "whatsapp") {
    return { visitStage: "contact", journeyStep: "07_whatsapp_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
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

  const clientId = sanitizeParam(
    payload.anonymousId || payload.gaClientId,
    200,
  );

  if (!clientId) {
    return { skipped: true, reason: "missing_stable_client_id" };
  }

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
    visitor_country: sanitizeParam(payload.visitorCountry, 16),
    visitor_region: sanitizeParam(payload.visitorRegion, 80),
    visitor_city: sanitizeParam(payload.visitorCity, 120),

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


function intentLabelFromScore(score: number): "low" | "medium" | "high" | "hot" {
  if (score >= 90) return "hot";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

async function updateRedirectLightweightSummary(payload: Record<string, unknown>, kind: RedirectKind) {
  const token = normalizeToken(payload.token || "");
  if (!token || token === "unknown") return { skipped: true, reason: "missing_report_token" };

  const FieldValue = admin.firestore.FieldValue;
  const now = FieldValue.serverTimestamp();
  const score = Number(payload.intentScore || (kind === "booking" ? 95 : 85));
  const update: Record<string, unknown> = {
    updatedAt: now,
    lastActivityAt: now,
    ctaClicked: true,
    ctaClickCount: FieldValue.increment(1),
    lastCtaClickedAt: now,
    lastCtaType: kind,
    lastActivityEvent: String(payload.eventName || "secure_report_cta_click").slice(0, 100),
    lastIntentScore: score,
    lastIntentLabel: intentLabelFromScore(score),
  };

  const country = sanitizeParam(payload.visitorCountry || payload.visitor_country, 16);
  if (country) {
    update.visitorCountry = country;
    update.lastVisitorCountry = country;
  }

  const region = sanitizeParam(payload.visitorRegion || payload.visitor_region, 80);
  if (region) update.lastVisitorRegion = region;

  const city = sanitizeParam(payload.visitorCity || payload.visitor_city, 120);
  if (city) update.lastVisitorCity = city;

  if (kind === "booking") update.bookingClicked = true;
  if (kind === "whatsapp") update.whatsappClicked = true;
  if (kind === "email") {
    update.emailClicked = true;
    update.gmailClicked = true;
  }
  if (kind === "linkedin") update.linkedinClicked = true;

  await adminDb.collection("audit_reports").doc(token).set(update, { merge: true });
  return { ok: true };
}


function isMailtoDestination(value: string) {
  return /^mailto:/i.test(cleanText(value, ""));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMailtoAddress(destination: string) {
  const withoutProtocol = destination.replace(/^mailto:/i, "");
  const address = withoutProtocol.split("?")[0] || "";

  try {
    return decodeURIComponent(address).replace(/[\r\n]/g, "").slice(0, 180);
  } catch {
    return address.replace(/[\r\n]/g, "").slice(0, 180);
  }
}

function mailtoFallbackResponse(destination: string) {
  const mailtoHref = escapeHtml(destination);
  const emailAddress = escapeHtml(getMailtoAddress(destination));

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>Open email app | TrackFlow Pro</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; font-family: Arial, Helvetica, sans-serif; padding: 24px; }
    .card { width: min(100%, 460px); border: 1px solid #e2e8f0; border-radius: 28px; background: #fff; padding: 28px; box-shadow: 0 24px 70px rgba(15, 23, 42, .10); }
    .eyebrow { margin: 0 0 10px; color: #2563eb; font-size: 11px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(26px, 6vw, 34px); line-height: 1.05; letter-spacing: -.045em; }
    p { color: #475569; font-size: 15px; font-weight: 700; line-height: 1.7; }
    .button { display: inline-flex; width: 100%; min-height: 52px; align-items: center; justify-content: center; border-radius: 18px; background: #2563eb; color: #fff; text-decoration: none; font-size: 14px; font-weight: 900; box-shadow: 0 18px 38px rgba(37, 99, 235, .24); }
    .fallback { margin-top: 16px; padding: 14px; border-radius: 18px; background: #f1f5f9; color: #334155; word-break: break-word; font-size: 13px; font-weight: 800; }
    .note { margin-bottom: 0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">TrackFlow Pro</p>
    <h1>Opening your email app</h1>
    <p>If your email app does not open automatically, use the button below or copy the email address.</p>
    <a class="button" href="${mailtoHref}" rel="nofollow">Open email app</a>
    <div class="fallback">${emailAddress}</div>
    <p class="note">This page only helps open your default email app. The secure report remains available in the original tab.</p>
  </main>
  <script>
    (function () {
      try {
        var href = ${JSON.stringify(destination)};
        window.setTimeout(function () { window.location.href = href; }, 120);
      } catch (error) {}
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
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
  const geo = getRequestGeo(request);

  const payload = {
    token,
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
    visitorCountry: geo.visitorCountry,
    visitorRegion: geo.visitorRegion,
    visitorCity: geo.visitorCity,
    clickText: label,
    clickHref: sanitizeParam(destination, 1200),
    clickLocation: eventSection,
  };

  const summary = await updateRedirectLightweightSummary(payload, kind).catch((error) => ({
    ok: false,
    error: String(error?.message || error || "summary_update_failed").slice(0, 300),
  }));
  const ga4 = await sendGa4RedirectEvent(payload);

  if (isAnalyticsDebugEnabled()) {
    console.info("[trackflow-analytics] report_redirect", {
      eventName,
      reportId,
      domainSlug,
      destination,
      summary,
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

  if (isMailtoDestination(destination)) {
    return mailtoFallbackResponse(destination);
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: destination,
      "cache-control": "no-store, max-age=0",
    },
  });
}
