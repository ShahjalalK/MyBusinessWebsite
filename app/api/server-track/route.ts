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
  pageLabel: z.string().trim().max(180).optional().default(""),
  referrer: z.string().trim().max(1200).optional().default(""),
  landingPage: z.string().trim().max(1200).optional().default(""),
  landingPagePath: z.string().trim().max(500).optional().default(""),

  trafficSource: z.string().trim().max(200).optional().default(""),
  trafficMedium: z.string().trim().max(200).optional().default(""),

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
  gaSessionId: z.union([z.string(), z.number()]).optional().default(""),
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
  finalAction: z.string().trim().max(120).optional().default(""),
  actionType: z.string().trim().max(120).optional().default(""),
  actionTarget: z.string().trim().max(1200).optional().default(""),
  linkDomain: z.string().trim().max(200).optional().default(""),
  elementTag: z.string().trim().max(80).optional().default(""),
  elementId: z.string().trim().max(160).optional().default(""),
  formName: z.string().trim().max(180).optional().default(""),
  formId: z.string().trim().max(160).optional().default(""),
  formAction: z.string().trim().max(1200).optional().default(""),
  formMethod: z.string().trim().max(40).optional().default(""),

  reportId: z.string().trim().max(80).optional().default(""),
  domainSlug: z.string().trim().max(120).optional().default(""),
  companyName: z.string().trim().max(180).optional().default(""),
  primaryActionLabel: z.string().trim().max(180).optional().default(""),
  primaryPageLabel: z.string().trim().max(180).optional().default(""),
  eventSection: z.string().trim().max(120).optional().default(""),
  buttonLabel: z.string().trim().max(180).optional().default(""),
  videoId: z.string().trim().max(80).optional().default(""),
  videoProgress: z.coerce.number().min(0).max(100).optional(),
  scrollPercent: z.coerce.number().min(0).max(100).optional(),
  maxScrollPercent: z.coerce.number().min(0).max(100).optional(),
  deviceType: z.string().trim().max(80).optional().default(""),
  deviceCategory: z.string().trim().max(80).optional().default(""),
  pageViewIndex: z.coerce.number().min(0).max(10000).optional(),
  journeyIndex: z.coerce.number().min(0).max(10000).optional(),
  question_key: z.string().trim().max(180).optional().default(""),
  question_source: z.string().trim().max(80).optional().default(""),
  message_length: z.coerce.number().min(0).max(5000).optional(),
  timeOnPageSeconds: z.coerce.number().min(0).max(86400).optional(),
  timeOnPageMilliseconds: z.coerce.number().min(0).max(86400000).optional(),
  timeOnReportSeconds: z.coerce.number().min(0).max(86400).optional(),
  timeOnReportMilliseconds: z.coerce.number().min(0).max(86400000).optional(),
  timeOnReportDeltaSeconds: z.coerce.number().min(0).max(86400).optional(),
  timeOnReportDeltaMilliseconds: z.coerce.number().min(0).max(86400000).optional(),
  durationEventType: z.string().trim().max(80).optional().default(""),

  visitorId: z.string().trim().max(80).optional().default(""),
  reportVisitorId: z.string().trim().max(100).optional().default(""),
  reportSessionId: z.string().trim().max(100).optional().default(""),
  visitStage: z.string().trim().max(80).optional().default(""),
  journeyStep: z.string().trim().max(80).optional().default(""),
  intentLevel: z.string().trim().max(40).optional().default(""),
  intentScore: z.coerce.number().min(0).max(100).optional(),
  isCoreEvent: z.union([z.boolean(), z.string()]).optional().default(""),
  transport: z.string().trim().max(80).optional().default(""),
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
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function sanitizeEventName(value: string) {
  return (
    cleanText(value, "secure_report_event")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "secure_report_event"
  );
}

function cleanParams<T extends Record<string, unknown>>(params: T) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    output[key] = value;
  }

  return output;
}

function cleanClientId(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u001F\u007F\s]+/g, "")
    .slice(0, 200);
}

function resolveGa4ClientId(payload: z.infer<typeof serverTrackSchema>) {
  return cleanClientId(payload.anonymousId || payload.gaClientId);
}

function normalizeGaSessionId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  const text = String(value).trim();
  if (!text) return undefined;

  const numeric = Number(text.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function sha256(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
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
  if (eventName === "navigation_click") return "ViewContent";
  if (eventName === "outbound_click") return "ViewContent";
  if (eventName === "free_audit_click") return "ViewContent";
  if (eventName === "contact_click") return "Contact";
  if (eventName === "phone_click") return "Contact";
  if (eventName === "direct_email_click") return "Contact";
  if (eventName === "whatsapp_click") return "Contact";
  if (eventName === "booking_click") return "Lead";
  if (eventName === "form_submit_attempt") return "Lead";
  if (eventName === "generate_lead") return "Lead";
  if (eventName === "secure_report_booking_click") return "Lead";
  if (eventName === "secure_report_email_click") return "Contact";
  if (eventName === "secure_report_assistant_message_sent") return "Contact";

  return "ViewContent";
}

async function sendGa4Event(
  payload: z.infer<typeof serverTrackSchema>,
  meta: ReturnType<typeof getRequestMeta>,
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true, reason: "missing_ga4_env" };
  }

  const clientId = resolveGa4ClientId(payload);

  if (!clientId) {
    return { skipped: true, reason: "missing_stable_client_id" };
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: payload.eventName,
        params: cleanParams({
          event_id: payload.eventId,
          engagement_time_msec:
            payload.timeOnPageMilliseconds ||
            payload.timeOnReportMilliseconds ||
            payload.timeOnReportDeltaMilliseconds ||
            1,
          session_id: normalizeGaSessionId(payload.gaSessionId),

          page_title: payload.pageTitle,
          page_location: payload.pageLocation,
          page_path: payload.pagePath,
          page_label: payload.pageLabel,
          page_referrer: payload.referrer,
          landing_page: payload.landingPage,
          landing_page_path: payload.landingPagePath,
          traffic_source: payload.trafficSource,
          traffic_medium: payload.trafficMedium,

          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_term: payload.utm_term,
          utm_content: payload.utm_content,

          gclid: payload.gclid,
          fbclid: payload.fbclid,
          msclkid: payload.msclkid,

          click_text: payload.clickText || payload.buttonLabel,
          click_href: payload.clickHref,
          click_location: payload.clickLocation || payload.eventSection,
          final_action: payload.finalAction,
          action_type: payload.actionType,
          action_target: payload.actionTarget,
          link_domain: payload.linkDomain,
          element_tag: payload.elementTag,
          element_id: payload.elementId,
          form_name: payload.formName,
          form_id: payload.formId,
          form_action: payload.formAction,
          form_method: payload.formMethod,

          report_id: payload.reportId,
          domain_slug: payload.domainSlug,
          company_name: payload.companyName,
          primary_action_label: payload.primaryActionLabel,
          primary_page_label: payload.primaryPageLabel,
          event_section: payload.eventSection,
          button_label: payload.buttonLabel,
          video_id: payload.videoId,
          video_progress: payload.videoProgress,
          scroll_percent: payload.scrollPercent,
          max_scroll_percent: payload.maxScrollPercent,
          device_type: payload.deviceType,
          device_category: payload.deviceCategory || payload.deviceType,
          page_view_index: payload.pageViewIndex,
          journey_index: payload.journeyIndex,
          question_key: payload.question_key,
          question_source: payload.question_source,
          message_length: payload.message_length,
          time_on_page_seconds: payload.timeOnPageSeconds,
          time_on_page_milliseconds: payload.timeOnPageMilliseconds,
          time_on_report_seconds: payload.timeOnReportSeconds,
          time_on_report_milliseconds: payload.timeOnReportMilliseconds,
          time_on_report_delta_seconds: payload.timeOnReportDeltaSeconds,
          time_on_report_delta_milliseconds: payload.timeOnReportDeltaMilliseconds,
          duration_event_type: payload.durationEventType,
          visitor_id: payload.visitorId,
          report_visitor_id: payload.reportVisitorId,
          report_session_id: payload.reportSessionId,
          visit_stage: payload.visitStage,
          journey_step: payload.journeyStep,
          intent_level: payload.intentLevel,
          intent_score: payload.intentScore,
          is_core_event: payload.isCoreEvent,
          transport: payload.transport,

          country: meta.country,
          region: meta.region,
          city: meta.city,
          visitor_country: meta.country,
          visitor_region: meta.region,
          visitor_city: meta.city,
          client_timezone: payload.timezone,
          server_timezone: meta.timezone,
          debug_mode: process.env.GA4_DEBUG_MODE === "true" ? true : undefined,

          traffic_type:
            process.env.NODE_ENV === "production" ? undefined : "internal_test",
        }),
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
  meta: ReturnType<typeof getRequestMeta>,
) {
  const pixelId = process.env.FB_PIXEL_ID || process.env.META_PIXEL_ID;
  const accessToken =
    process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

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
          payload.pageLocation ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://trackflowpro.com",
        user_data: userData,
        custom_data: cleanParams({
          page_title: payload.pageTitle,
          page_path: payload.pagePath,
          page_label: payload.pageLabel,
          referrer: payload.referrer,
          landing_page: payload.landingPage,
          landing_page_path: payload.landingPagePath,
          traffic_source: payload.trafficSource,
          traffic_medium: payload.trafficMedium,
          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_term: payload.utm_term,
          utm_content: payload.utm_content,
          click_text: payload.clickText || payload.buttonLabel,
          click_href: payload.clickHref,
          click_location: payload.clickLocation || payload.eventSection,
          final_action: payload.finalAction,
          action_type: payload.actionType,
          action_target: payload.actionTarget,
          link_domain: payload.linkDomain,
          form_name: payload.formName,
          form_id: payload.formId,
          report_id: payload.reportId,
          domain_slug: payload.domainSlug,
          event_section: payload.eventSection,
          button_label: payload.buttonLabel,
          video_id: payload.videoId,
          video_progress: payload.videoProgress,
          scroll_percent: payload.scrollPercent,
          max_scroll_percent: payload.maxScrollPercent,
          device_type: payload.deviceType,
          device_category: payload.deviceCategory || payload.deviceType,
          page_view_index: payload.pageViewIndex,
          journey_index: payload.journeyIndex,
          visitor_id: payload.visitorId,
          report_visitor_id: payload.reportVisitorId,
          visit_stage: payload.visitStage,
          journey_step: payload.journeyStep,
          intent_level: payload.intentLevel,
          intent_score: payload.intentScore,
          is_core_event: payload.isCoreEvent,
          transport: payload.transport,
        }),
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
      pixelId,
    )}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
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

function normalizeTrackingInput(json: Record<string, unknown>) {
  return {
    ...json,
    pageLabel: json.pageLabel ?? json.page_label,
    landingPagePath: json.landingPagePath ?? json.landing_page_path,
    trafficSource: json.trafficSource ?? json.traffic_source,
    trafficMedium: json.trafficMedium ?? json.traffic_medium,
    reportId: json.reportId ?? json.report_id,
    domainSlug: json.domainSlug ?? json.domain_slug,
    companyName: json.companyName ?? json.company_name,
    primaryActionLabel: json.primaryActionLabel ?? json.primary_action_label,
    primaryPageLabel: json.primaryPageLabel ?? json.primary_page_label,
    eventSection: json.eventSection ?? json.event_section,
    buttonLabel: json.buttonLabel ?? json.button_label,
    finalAction: json.finalAction ?? json.final_action,
    actionType: json.actionType ?? json.action_type,
    actionTarget: json.actionTarget ?? json.action_target,
    linkDomain: json.linkDomain ?? json.link_domain,
    elementTag: json.elementTag ?? json.element_tag,
    elementId: json.elementId ?? json.element_id,
    formName: json.formName ?? json.form_name,
    formId: json.formId ?? json.form_id,
    formAction: json.formAction ?? json.form_action,
    formMethod: json.formMethod ?? json.form_method,
    videoId: json.videoId ?? json.video_id,
    videoProgress: json.videoProgress ?? json.video_progress,
    scrollPercent: json.scrollPercent ?? json.scroll_percent,
    maxScrollPercent: json.maxScrollPercent ?? json.max_scroll_percent,
    deviceType: json.deviceType ?? json.device_type,
    deviceCategory: json.deviceCategory ?? json.device_category,
    pageViewIndex: json.pageViewIndex ?? json.page_view_index,
    journeyIndex: json.journeyIndex ?? json.journey_index,
    gaSessionId: json.gaSessionId ?? json.ga_session_id ?? json.session_id,
    visitorId: json.visitorId ?? json.visitor_id,
    reportVisitorId: json.reportVisitorId ?? json.report_visitor_id,
    reportSessionId: json.reportSessionId ?? json.report_session_id,
    visitStage: json.visitStage ?? json.visit_stage,
    journeyStep: json.journeyStep ?? json.journey_step,
    intentLevel: json.intentLevel ?? json.intent_level,
    intentScore: json.intentScore ?? json.intent_score,
    isCoreEvent: json.isCoreEvent ?? json.is_core_event,
    question_key: json.question_key ?? json.questionKey,
    question_source: json.question_source ?? json.questionSource,
    message_length: json.message_length ?? json.messageLength,
    timeOnPageSeconds: json.timeOnPageSeconds ?? json.time_on_page_seconds,
    timeOnPageMilliseconds:
      json.timeOnPageMilliseconds ?? json.time_on_page_milliseconds,
    timeOnReportSeconds:
      json.timeOnReportSeconds ?? json.time_on_report_seconds,
    timeOnReportMilliseconds:
      json.timeOnReportMilliseconds ?? json.time_on_report_milliseconds,
    timeOnReportDeltaSeconds:
      json.timeOnReportDeltaSeconds ?? json.time_on_report_delta_seconds,
    timeOnReportDeltaMilliseconds:
      json.timeOnReportDeltaMilliseconds ??
      json.time_on_report_delta_milliseconds,
    durationEventType: json.durationEventType ?? json.duration_event_type,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawJson = await request.json();
    const json =
      rawJson && typeof rawJson === "object" && !Array.isArray(rawJson)
        ? normalizeTrackingInput(rawJson as Record<string, unknown>)
        : rawJson;
    const parsed = serverTrackSchema.safeParse(json);

    if (!parsed.success) {
      if (process.env.TRACKFLOW_ANALYTICS_DEBUG === "true") {
        console.warn(
          "[trackflow-analytics] invalid_payload",
          parsed.error.flatten(),
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Invalid tracking payload.",
          issues:
            process.env.TRACKFLOW_ANALYTICS_DEBUG === "true"
              ? parsed.error.flatten()
              : undefined,
        },
        { status: 400 },
      );
    }

    const payload = {
      ...parsed.data,
      eventName: sanitizeEventName(parsed.data.eventName),
    };
    const meta = getRequestMeta(request);

    const results = await Promise.allSettled([
      sendGa4Event(payload, meta),
      sendMetaEvent(payload, meta),
    ]);

    const tracking = results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { ok: false, error: "tracking_failed" },
    );

    if (process.env.TRACKFLOW_ANALYTICS_DEBUG === "true") {
      console.info("[trackflow-analytics] server_track", {
        eventName: payload.eventName,
        reportId: payload.reportId,
        domainSlug: payload.domainSlug,
        journeyStep: payload.journeyStep,
        intentLevel: payload.intentLevel,
        tracking,
      });
    }

    return NextResponse.json({
      success: true,
      eventName: payload.eventName,
      eventId: payload.eventId,
      tracking,
    });
  } catch (error) {
    console.error("Server tracking error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Tracking request failed.",
      },
      { status: 500 },
    );
  }
}
