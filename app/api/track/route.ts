import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackProviderResult = {
  provider: "facebook" | "ga4";
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

function normalizeOrigin(value: string) {
  return String(value || "").replace(/\/$/, "");
}

function isDashboardOrInternalUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase();

    return (
      path.includes("/admin") ||
      path.includes("/dashboard") ||
      path.includes("/trackflow") ||
      path.includes("/command-center")
    );
  } catch {
    const path = String(value || "").toLowerCase();
    return (
      path.includes("/admin") ||
      path.includes("/dashboard") ||
      path.includes("/trackflow") ||
      path.includes("/command-center")
    );
  }
}

async function postJsonWithTimeout(url: string, payload: any, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const responseText = await response.text().catch(() => "");
    let data: any = null;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error?.name === "AbortError" ? "Provider request timed out" : error?.message || "Provider request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin") || "";
    const referer = request.headers.get("referer") || "";
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
    const isAllowed = !allowedOrigin || normalizeOrigin(origin) === normalizeOrigin(allowedOrigin);

    if (process.env.NODE_ENV === "production" && !isAllowed) {
      console.log("❌ Unauthorized Origin Attempt:", origin);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      eventName,
      clientId,
      sessionId,
      pageTitle,
      pageLocation,
      eventParams = {},
      testEventCode,
    } = body;

    // Dashboard/admin/internal traffic should never be sent to GA4 or Meta CAPI.
    // This keeps your internal button clicks, Postmaster refreshes, and outreach work out of ad/analytics data.
    if (
      body?.skipTracking === true ||
      request.headers.get("x-skip-track") === "1" ||
      isDashboardOrInternalUrl(String(pageLocation || "")) ||
      isDashboardOrInternalUrl(referer)
    ) {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "Dashboard/internal tracking skipped",
        },
        { status: 200 }
      );
    }

    if (!eventName) {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "Missing eventName",
        },
        { status: 200 }
      );
    }

    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;
    const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

    const userIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const tasks: Promise<TrackProviderResult>[] = [];
    let gaStatus: number | "skipped" = "skipped";
    let fbStatus: number | "skipped" = "skipped";

    if (FB_PIXEL_ID && FB_ACCESS_TOKEN) {
      const fbPayload: any = {
        data: [
          {
            event_name: eventName === "page_view" ? "PageView" : eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: pageLocation,
            user_data: {
              client_ip_address: userIp,
              client_user_agent: userAgent,
            },
            custom_data: {
              ...eventParams,
            },
          },
        ],
      };

      if (testEventCode) {
        fbPayload.test_event_code = testEventCode;
      }

      const FB_URL = `https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;

      tasks.push(
        postJsonWithTimeout(FB_URL, fbPayload).then((result) => {
          fbStatus = result.status;
          return { provider: "facebook", ...result } as TrackProviderResult;
        })
      );
    }

    if (GA4_MEASUREMENT_ID && GA4_API_SECRET && clientId) {
      const ga4Payload = {
        client_id: clientId,
        events: [
          {
            name: eventName || "page_view",
            params: {
              session_id: sessionId,
              page_title: pageTitle,
              page_location: pageLocation,
              ip_override: userIp,
              user_agent: userAgent,
              engagement_time_msec: 100,
              ...eventParams,
            },
          },
        ],
      };

      const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

      tasks.push(
        postJsonWithTimeout(GA4_URL, ga4Payload).then((result) => {
          gaStatus = result.status;
          return { provider: "ga4", ...result } as TrackProviderResult;
        })
      );
    }

    if (tasks.length === 0) {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "Tracking provider env vars missing or GA4 clientId missing",
          gaStatus,
          fbStatus,
        },
        { status: 200 }
      );
    }

    const results = await Promise.all(tasks);

    console.log(`📡 Event: ${eventName} | GA Status: ${gaStatus} | FB Status: ${fbStatus}`);

    // Do not return 500 for provider problems. Tracking should not break the website/dashboard UX.
    return NextResponse.json(
      {
        success: true,
        gaStatus,
        fbStatus,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("🔥 Server Side Tracking Failed:", error?.message || error);

    // Tracking is non-critical, so fail softly instead of hanging/breaking UI actions.
    return NextResponse.json(
      {
        success: true,
        skipped: true,
        error: error?.message || "Tracking failed silently",
      },
      { status: 200 }
    );
  }
}
