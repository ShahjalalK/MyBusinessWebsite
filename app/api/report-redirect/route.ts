import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeToken(value: unknown) {
  return cleanText(value, "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96) || "unknown";
}

function hashReportId(token: string) {
  const digest = crypto.createHash("sha256").update(`trackflow-report:${normalizeToken(token)}`).digest("hex");
  return `rpt_${digest.slice(0, 12)}`;
}

function sanitizeKind(value: unknown) {
  const kind = cleanText(value, "cta").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 40);
  if (["booking", "email", "linkedin", "cta"].includes(kind)) return kind;
  return "cta";
}

function eventNameForKind(kind: string) {
  if (kind === "booking") return "secure_report_booking_click";
  if (kind === "email") return "secure_report_email_click";
  if (kind === "linkedin") return "secure_report_linkedin_click";
  return "secure_report_cta_click";
}

function journeyForKind(kind: string) {
  if (kind === "booking") {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }
  if (kind === "email" || kind === "linkedin") {
    return { visitStage: "contact", journeyStep: "07_contact_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
  }
  return { visitStage: "cta", journeyStep: "07_cta_clicked", intentLevel: "high", intentScore: 80, isCoreEvent: true };
}

function getDeviceType(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android.*mobile/i.test(userAgent)) return "mobile";
  if (!userAgent) return "unknown";
  return "desktop";
}

function cleanDestination(rawValue: string, request: NextRequest) {
  const raw = cleanText(rawValue, "/").slice(0, 1400);

  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return new URL(raw, request.url).toString();
  }

  try {
    const url = new URL(raw);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.toString();
  } catch {
    // Fall through to safe default.
  }

  return new URL("/contact", request.url).toString();
}

async function forwardToServerTrack(request: NextRequest, payload: Record<string, unknown>) {
  const endpoint = new URL("/api/server-track", request.url);

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.warn("Report redirect tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = normalizeToken(searchParams.get("token"));
  const reportId = hashReportId(token);
  const kind = sanitizeKind(searchParams.get("kind"));
  const destination = cleanDestination(searchParams.get("url") || "", request);
  const eventName = eventNameForKind(kind);
  const journey = journeyForKind(kind);
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  await forwardToServerTrack(request, {
    eventName,
    eventId: `${reportId}_${eventName}_${Date.now()}`,
    pageTitle: cleanText(searchParams.get("pageTitle"), "Secure tracking review"),
    pageLocation: referer,
    referrer: referer,
    reportId,
    domainSlug: cleanText(searchParams.get("domainSlug"), "").slice(0, 120),
    primaryActionLabel: cleanText(searchParams.get("primaryActionLabel"), "Secure report engagement").slice(0, 180),
    primaryPageLabel: cleanText(searchParams.get("primaryPageLabel"), "Secure tracking review").slice(0, 180),
    eventSection: cleanText(searchParams.get("eventSection"), kind).slice(0, 120),
    buttonLabel: cleanText(searchParams.get("label"), kind).slice(0, 180),
    clickText: cleanText(searchParams.get("label"), kind).slice(0, 300),
    clickHref: destination.slice(0, 1200),
    clickLocation: cleanText(searchParams.get("eventSection"), kind).slice(0, 200),
    deviceType: getDeviceType(userAgent),
    visitStage: journey.visitStage,
    journeyStep: journey.journeyStep,
    intentLevel: journey.intentLevel,
    intentScore: journey.intentScore,
    isCoreEvent: journey.isCoreEvent,
    transport: "server_redirect",
  });

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: destination,
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
