import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
export { POST } from "../server-track/route";

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
  return cleanText(value, "secure_report_served")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "secure_report_served";
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

function getEventJourneyMeta(eventName: string) {
  const name = sanitizeEventName(eventName);

  if (name.includes("booking")) {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }
  if (name.includes("email") || name.includes("linkedin")) {
    return { visitStage: "contact", journeyStep: "07_contact_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
  }
  if (name.includes("chat") || name.includes("assistant_message")) {
    return { visitStage: "chat", journeyStep: "06_chat_message_sent", intentLevel: "high", intentScore: 80, isCoreEvent: true };
  }
  if (name.includes("pdf_download")) {
    return { visitStage: "pdf", journeyStep: "04_pdf_downloaded", intentLevel: "high", intentScore: 75, isCoreEvent: true };
  }
  if (name.includes("pdf")) {
    return { visitStage: "pdf", journeyStep: "03_pdf_viewed", intentLevel: "medium", intentScore: 45, isCoreEvent: true };
  }
  if (name.includes("video")) {
    return { visitStage: "video", journeyStep: "03_video_engaged", intentLevel: "medium", intentScore: 50, isCoreEvent: false };
  }

  return { visitStage: "view", journeyStep: "00_report_served", intentLevel: "low", intentScore: 5, isCoreEvent: true };
}

function getDeviceType(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android.*mobile/i.test(userAgent)) return "mobile";
  if (!userAgent) return "unknown";
  return "desktop";
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
    console.warn("Report event forward failed:", error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = normalizeToken(searchParams.get("token"));
  const reportId = hashReportId(token);
  const eventName = sanitizeEventName(searchParams.get("eventName"));
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";
  const journey = getEventJourneyMeta(eventName);

  await forwardToServerTrack(request, {
    eventName,
    eventId: `${reportId}_${eventName}_${Date.now()}`,
    pageTitle: cleanText(searchParams.get("pageTitle"), "Secure tracking review"),
    pageLocation: referer || cleanText(searchParams.get("pageLocation"), ""),
    pagePath: cleanText(searchParams.get("pagePath"), ""),
    referrer: referer,
    reportId,
    domainSlug: cleanText(searchParams.get("domainSlug"), "").slice(0, 120),
    primaryActionLabel: cleanText(searchParams.get("primaryActionLabel"), "Secure report engagement").slice(0, 180),
    primaryPageLabel: cleanText(searchParams.get("primaryPageLabel"), "Secure tracking review").slice(0, 180),
    eventSection: cleanText(searchParams.get("eventSection"), "server_pixel"),
    buttonLabel: cleanText(searchParams.get("buttonLabel"), "Report served"),
    deviceType: getDeviceType(userAgent),
    visitStage: journey.visitStage,
    journeyStep: journey.journeyStep,
    intentLevel: journey.intentLevel,
    intentScore: journey.intentScore,
    isCoreEvent: journey.isCoreEvent,
    transport: cleanText(searchParams.get("transport"), "server_pixel"),
  });

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "content-type": "image/gif",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
    },
  });
}
