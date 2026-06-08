import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serverTrackSchema = z.object({
  eventName: z.string().trim().min(1).max(80).default("page_view"),
  eventId: z.string().trim().max(200).optional().default(""),

  pageTitle: z.string().trim().max(300).optional().default(""),
  pageLocation: z.string().trim().max(1200).optional().default(""),
  pagePath: z.string().trim().max(500).optional().default(""),
  pageSearch: z.string().trim().max(500).optional().default(""),
  referrer: z.string().trim().max(1200).optional().default(""),
  landingPage: z.string().trim().max(1200).optional().default(""),

  utm_source: z.string().trim().max(200).optional().default(""),
  utm_medium: z.string().trim().max(200).optional().default(""),
  utm_campaign: z.string().trim().max(300).optional().default(""),
  utm_term: z.string().trim().max(300).optional().default(""),
  utm_content: z.string().trim().max(300).optional().default(""),

  gclid: z.string().trim().max(300).optional().default(""),
  fbclid: z.string().trim().max(500).optional().default(""),
  msclkid: z.string().trim().max(300).optional().default(""),

  gaClientId: z.string().trim().max(200).optional().default(""),
  anonymousId: z.string().trim().max(200).optional().default(""),
  fbp: z.string().trim().max(300).optional().default(""),
  fbc: z.string().trim().max(500).optional().default(""),

  timezone: z.string().trim().max(120).optional().default(""),
  language: z.string().trim().max(80).optional().default(""),
  languages: z.string().trim().max(300).optional().default(""),
  platform: z.string().trim().max(120).optional().default(""),
  viewport: z.string().trim().max(80).optional().default(""),
  screen: z.string().trim().max(80).optional().default(""),
  devicePixelRatio: z.union([z.string(), z.number()]).optional().default(""),
  colorScheme: z.string().trim().max(40).optional().default(""),
  cookieEnabled: z.union([z.string(), z.boolean()]).optional().default(""),
  doNotTrack: z.string().trim().max(40).optional().default(""),

  clickText: z.string().trim().max(300).optional().default(""),
  clickHref: z.string().trim().max(1200).optional().default(""),
  clickLocation: z.string().trim().max(200).optional().default(""),

  report_id: z.string().trim().max(120).optional().default(""),
  report_type: z.string().trim().max(80).optional().default(""),
  domain_slug: z.string().trim().max(160).optional().default(""),
  primary_action_label: z.string().trim().max(180).optional().default(""),
  primary_page_label: z.string().trim().max(160).optional().default(""),
  primary_page_url: z.string().trim().max(700).optional().default(""),
  event_section: z.string().trim().max(120).optional().default(""),
  button_label: z.string().trim().max(180).optional().default(""),
  video_id: z.string().trim().max(120).optional().default(""),
  video_progress: z.union([z.string(), z.number()]).optional().default(""),
  scroll_percent: z.union([z.string(), z.number()]).optional().default(""),
  assistant_question_key: z.string().trim().max(180).optional().default(""),
  assistant_question_length: z.union([z.string(), z.number()]).optional().default(""),
  device_type: z.string().trim().max(40).optional().default(""),
});

function firstHeader(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value) return value;
  }

  return "";
}

function firstIp(value: string) {
  return (
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)[0] || ""
  );
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getRequestMeta(request: NextRequest) {
  const forwardedFor = firstHeader(request, [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
  ]);

  return {
    ip: firstIp(forwardedFor),
    userAgent: request.headers.get("user-agent") || "",
    acceptLanguage: request.headers.get("accept-language") || "",
    referer: request.headers.get("referer") || "",
    origin: request.headers.get("origin") || "",
    host: request.headers.get("host") || "",

    country: firstHeader(request, ["x-vercel-ip-country", "cf-ipcountry"]),
    region: firstHeader(request, ["x-vercel-ip-country-region"]),
    city: decodeURIComponent(firstHeader(request, ["x-vercel-ip-city"]) || ""),
    latitude: firstHeader(request, ["x-vercel-ip-latitude"]),
    longitude: firstHeader(request, ["x-vercel-ip-longitude"]),
    timezone: firstHeader(request, ["x-vercel-ip-timezone"]),
    postalCode: firstHeader(request, ["x-vercel-ip-postal-code"]),
  };
}

function mapMetaEventName(eventName: string) {
  if (eventName === "page_view") return "PageView";
  if (eventName === "cta_click") return "ViewContent";
  if (eventName === "free_audit_click") return "ViewContent";
  if (eventName === "contact_click") return "Contact";
  if (eventName === "generate_lead") return "Lead";
  if (eventName === "secure_report_booking_click") return "Lead";
  if (eventName === "secure_report_email_click") return "Contact";
  if (eventName === "secure_report_linkedin_click") return "Contact";

  return "ViewContent";
}

async function sendGa4Event(
  payload: z.infer<typeof serverTrackSchema>,
  meta: ReturnType<typeof getRequestMeta>
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true, reason: "missing_ga4_env" };
  }

  const clientId = payload.gaClientId || payload.anonymousId || crypto.randomUUID();

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: payload.eventName,
        params: {
          event_id: payload.eventId,
          engagement_time_msec: 1,

          page_title: payload.pageTitle,
          page_location: payload.pageLocation,
          page_path: payload.pagePath,
          page_referrer: payload.referrer,

          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_term: payload.utm_term,
          utm_content: payload.utm_content,

          gclid: payload.gclid,
          fbclid: payload.fbclid,
          msclkid: payload.msclkid,

          click_text: payload.clickText,
          click_href: payload.clickHref,
          click_location: payload.clickLocation,

          report_id: payload.report_id,
          report_type: payload.report_type,
          domain_slug: payload.domain_slug,
          primary_action_label: payload.primary_action_label,
          primary_page_label: payload.primary_page_label,
          primary_page_url: payload.primary_page_url,
          event_section: payload.event_section,
          button_label: payload.button_label,
          video_id: payload.video_id,
          video_progress: payload.video_progress,
          scroll_percent: payload.scroll_percent,
          assistant_question_key: payload.assistant_question_key,
          assistant_question_length: payload.assistant_question_length,
          device_type: payload.device_type,

          country: meta.country,
          region: meta.region,
          city: meta.city,
          client_timezone: payload.timezone,
          server_timezone: meta.timezone,

          traffic_type: process.env.NODE_ENV === "production" ? undefined : "internal_test",
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
  };
}

async function sendMetaEvent(
  payload: z.infer<typeof serverTrackSchema>,
  meta: ReturnType<typeof getRequestMeta>
) {
  const pixelId = process.env.FB_PIXEL_ID || process.env.META_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { skipped: true, reason: "missing_meta_env" };
  }

  const graphVersion = process.env.META_GRAPH_VERSION || "v20.0";
  const eventName = mapMetaEventName(payload.eventName);

  const userData: Record<string, unknown> = {
    client_ip_address: meta.ip || undefined,
    client_user_agent: meta.userAgent || undefined,
  };

  if (payload.fbp) userData.fbp = payload.fbp;
  if (payload.fbc) userData.fbc = payload.fbc;

  if (payload.gclid) {
    userData.external_id = [sha256(payload.gclid)];
  } else if (payload.anonymousId) {
    userData.external_id = [sha256(payload.anonymousId)];
  }

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId || `${eventName}_${Date.now()}`,
        action_source: "website",
        event_source_url:
          payload.pageLocation || process.env.NEXT_PUBLIC_SITE_URL || "https://trackflowpro.com",
        user_data: userData,
        custom_data: {
          page_title: payload.pageTitle,
          page_path: payload.pagePath,
          referrer: payload.referrer,
          landing_page: payload.landingPage,
          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_term: payload.utm_term,
          utm_content: payload.utm_content,
          click_text: payload.clickText,
          click_location: payload.clickLocation,
          report_id: payload.report_id,
          report_type: payload.report_type,
          domain_slug: payload.domain_slug,
          primary_action_label: payload.primary_action_label,
          primary_page_label: payload.primary_page_label,
          event_section: payload.event_section,
          button_label: payload.button_label,
          video_progress: payload.video_progress,
          scroll_percent: payload.scroll_percent,
          device_type: payload.device_type,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
      pixelId
    )}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    result,
  };
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = serverTrackSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tracking payload.",
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const meta = getRequestMeta(request);

    const results = await Promise.allSettled([
      sendGa4Event(payload, meta),
      sendMetaEvent(payload, meta),
    ]);

    return NextResponse.json({
      success: true,
      eventName: payload.eventName,
      eventId: payload.eventId,
      tracking: results.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : { ok: false, error: "tracking_failed" }
      ),
    });
  } catch (error) {
    console.error("Server tracking error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Tracking request failed.",
      },
      { status: 500 }
    );
  }
}