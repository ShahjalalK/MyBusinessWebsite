import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackingContext = Record<string, unknown>;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(180),
  website: z.string().trim().max(300).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(80).optional().default(""),
  serviceInterest: z.string().trim().max(160).optional().default("Tracking review"),
  message: z.string().trim().min(10, "Message is required").max(4000),
  consent: z.boolean().optional().default(false),
  honeypot: z.string().trim().optional().default(""),
  turnstileToken: z.string().trim().optional().default(""),
  trackingContext: z.record(z.string(), z.unknown()).optional().default({}),
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

function cleanText(value: unknown, fallback = "N/A") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeUrl(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getRequestIntelligence(request: NextRequest, trackingContext: TrackingContext) {
  const forwardedFor = firstHeader(request, [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
  ]);

  const ip = firstIp(forwardedFor);

  const city = decodeURIComponent(firstHeader(request, ["x-vercel-ip-city"]) || "");
  const region = firstHeader(request, ["x-vercel-ip-country-region"]);
  const country = firstHeader(request, ["x-vercel-ip-country", "cf-ipcountry"]);
  const latitude = firstHeader(request, ["x-vercel-ip-latitude"]);
  const longitude = firstHeader(request, ["x-vercel-ip-longitude"]);
  const timezone = firstHeader(request, ["x-vercel-ip-timezone"]);
  const postalCode = firstHeader(request, ["x-vercel-ip-postal-code"]);

  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const referer = request.headers.get("referer") || "";
  const origin = request.headers.get("origin") || "";
  const host = request.headers.get("host") || "";
  const protocol = request.headers.get("x-forwarded-proto") || "https";

  return {
    server: {
      ip,
      country,
      region,
      city,
      latitude,
      longitude,
      timezone,
      postalCode,
      userAgent,
      acceptLanguage,
      referer,
      origin,
      host,
      protocol,
      submittedAt: new Date().toISOString(),
    },
    client: trackingContext || {},
  };
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    console.error("Turnstile failed: missing token");
    return { ok: false, skipped: false, reason: "Missing Turnstile token" };
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });

    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
      "error-codes"?: string[];
      [key: string]: unknown;
    };

    if (!result.success) {
      console.error("Turnstile verification failed:", {
        errorCodes: result["error-codes"],
        hostname: result.hostname,
        action: result.action,
      });
    }

    return { ok: Boolean(result.success), skipped: false, raw: result };
  } catch (error) {
    console.error("Turnstile verification request failed:", error);
    return { ok: false, skipped: false, reason: "Turnstile verification failed" };
  }
}

function getTransporter() {
  const host = process.env.CONTACT_SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.CONTACT_SMTP_PORT || process.env.SMTP_PORT || 587);

  const user =
    process.env.CONTACT_SMTP_USER ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;

  const pass =
    process.env.CONTACT_SMTP_PASS ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Contact SMTP is not configured. Set CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER, and CONTACT_SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getMailIdentity() {
  const fromEmail =
    process.env.CONTACT_SMTP_FROM_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    process.env.CONTACT_SMTP_USER ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;

  const toEmail =
    process.env.CONTACT_TO_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ALLOWED_ADMIN_EMAILS?.split(",")[0]?.trim() ||
    fromEmail;

  const businessReplyEmail =
    process.env.CONTACT_REPLY_TO_EMAIL ||
    process.env.CONTACT_TO_EMAIL ||
    fromEmail;

  if (!fromEmail || !toEmail) {
    throw new Error(
      "Missing contact email identity. Set CONTACT_SMTP_FROM_EMAIL and CONTACT_TO_EMAIL."
    );
  }

  return {
    fromEmail,
    toEmail,
    businessReplyEmail,
  };
}

function formatRows(items: Array<[string, unknown]>) {
  return items
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;width:210px;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(cleanText(value))}</td>
        </tr>`
    )
    .join("");
}

function buildAdminEmail(
  payload: z.infer<typeof contactSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string
) {
  const client = intel.client as Record<string, unknown>;
  const server = intel.server;

  const rows = formatRows([
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company],
    ["Website", payload.website],
    ["Phone", payload.phone],
    ["Service Interest", payload.serviceInterest],
    ["Message", payload.message],
    ["Consent", payload.consent ? "Yes" : "No"],
    ["Event ID", eventId],
    ["Submitted At", server.submittedAt],

    ["IP", server.ip],
    ["Country", server.country],
    ["Region", server.region],
    ["City", server.city],
    ["Postal Code", server.postalCode],
    ["Latitude", server.latitude],
    ["Longitude", server.longitude],
    ["Server Timezone", server.timezone],
    ["User Agent", server.userAgent],
    ["Accept Language", server.acceptLanguage],
    ["Referrer Header", server.referer],
    ["Origin", server.origin],

    ["Current URL", client.currentUrl],
    ["Landing Page", client.landingPage],
    ["Document Referrer", client.referrer],
    ["UTM Source", client.utm_source],
    ["UTM Medium", client.utm_medium],
    ["UTM Campaign", client.utm_campaign],
    ["UTM Term", client.utm_term],
    ["UTM Content", client.utm_content],
    ["GCLID", client.gclid],
    ["FBCLID", client.fbclid],
    ["MSCLKID", client.msclkid],
    ["Client Timezone", client.timezone],
    ["Client Local Time", client.localTime],
    ["Browser Language", client.language],
    ["Screen", client.screen],
    ["Viewport", client.viewport],
    ["Device Pixel Ratio", client.devicePixelRatio],
    ["Color Scheme", client.colorScheme],
    ["Cookie Enabled", client.cookieEnabled],
    ["Do Not Track", client.doNotTrack],
    ["GA Client ID", client.gaClientId],
    ["FBP", client.fbp],
    ["FBC", client.fbc],
  ]);

  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
      <div style="background:#020617;color:#ffffff;padding:24px;">
        <p style="margin:0 0 8px;color:#93c5fd;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">TrackFlow Pro Contact Lead</p>
        <h1 style="margin:0;font-size:26px;line-height:1.2;">New contact request from ${escapeHtml(payload.name)}</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">
          Reply directly to this email to respond to <strong>${escapeHtml(payload.email)}</strong>.
        </p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
      </div>
    </div>
  </div>`;
}

function buildUserConfirmationEmail(name: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
      <div style="background:#020617;color:#ffffff;padding:24px;">
        <p style="margin:0 0 8px;color:#93c5fd;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">TrackFlow Pro</p>
        <h1 style="margin:0;font-size:24px;line-height:1.2;">Your message has been received</h1>
      </div>
      <div style="padding:24px;color:#334155;font-size:15px;line-height:1.8;">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for contacting TrackFlow Pro. I received your message and will review your tracking issue or service request.</p>
        <p>The first review can start with public browser-visible evidence. Final confirmation may require approved access to GA4, GTM, Google Ads, Meta, CRM, or server-side logs.</p>
        <p style="margin-top:24px;">Best,<br><strong>Shahjalal Khan</strong><br>TrackFlow Pro</p>
      </div>
    </div>
  </div>`;
}

async function sendGa4LeadEvent(
  payload: z.infer<typeof contactSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { skipped: true };
  }

  const client = intel.client as Record<string, unknown>;

  const clientId =
    typeof client.gaClientId === "string" && client.gaClientId
      ? client.gaClientId
      : crypto.randomUUID();

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: "generate_lead",
        params: {
          event_id: eventId,
          engagement_time_msec: 1,
          form_name: "contact_form",
          service_interest: payload.serviceInterest,
          website_submitted: payload.website ? "yes" : "no",
          page_location: cleanText(client.currentUrl, ""),
          page_referrer: cleanText(client.referrer, ""),
          utm_source: cleanText(client.utm_source, ""),
          utm_medium: cleanText(client.utm_medium, ""),
          utm_campaign: cleanText(client.utm_campaign, ""),
          traffic_type: process.env.NODE_ENV === "production" ? undefined : "internal_test",
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return { ok: response.ok, status: response.status };
}

async function sendMetaLeadEvent(
  payload: z.infer<typeof contactSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string
) {
  const pixelId = process.env.FB_PIXEL_ID || process.env.META_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { skipped: true };
  }

  const graphVersion = process.env.META_GRAPH_VERSION || "v20.0";
  const client = intel.client as Record<string, unknown>;
  const server = intel.server;

  const userData: Record<string, unknown> = {
    client_ip_address: server.ip || undefined,
    client_user_agent: server.userAgent || undefined,
    em: [sha256(payload.email)],
  };

  if (typeof client.fbp === "string" && client.fbp) userData.fbp = client.fbp;
  if (typeof client.fbc === "string" && client.fbc) userData.fbc = client.fbc;

  const body = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: cleanText(
          client.currentUrl,
          process.env.NEXT_PUBLIC_SITE_URL || "https://trackflowpro.com"
        ),
        user_data: userData,
        custom_data: {
          content_name: "TrackFlow Pro Contact Form",
          service_interest: payload.serviceInterest,
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
      headers: { "content-type": "application/json" },
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

  return { ok: response.ok, status: response.status, result };
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = contactSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the form fields.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.honeypot) {
      return NextResponse.json({
        success: true,
        message: "Thanks. Your message has been received.",
      });
    }

    const intelligence = getRequestIntelligence(request, payload.trackingContext);
    const turnstile = await verifyTurnstile(payload.turnstileToken, intelligence.server.ip);

    if (!turnstile.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Security check failed. Please refresh and try again.",
        },
        { status: 403 }
      );
    }

    const transporter = getTransporter();
    const { fromEmail, toEmail, businessReplyEmail } = getMailIdentity();

    const eventId = `contact_${Date.now()}_${crypto.randomUUID()}`;
    const safeWebsite = payload.website ? normalizeUrl(payload.website) : "";

    await transporter.sendMail({
      from: `"TrackFlow Pro" <${fromEmail}>`,
      to: toEmail,
      replyTo: payload.email,
      subject: `New TrackFlow Pro contact: ${payload.name}${safeWebsite ? ` (${safeWebsite})` : ""}`,
      html: buildAdminEmail({ ...payload, website: safeWebsite }, intelligence, eventId),
    });

    await transporter.sendMail({
      from: `"TrackFlow Pro" <${fromEmail}>`,
      to: payload.email,
      replyTo: businessReplyEmail,
      subject: "TrackFlow Pro received your message",
      html: buildUserConfirmationEmail(payload.name),
    });

    const trackingResults = await Promise.allSettled([
      sendGa4LeadEvent({ ...payload, website: safeWebsite }, intelligence, eventId),
      sendMetaLeadEvent({ ...payload, website: safeWebsite }, intelligence, eventId),
    ]);

    return NextResponse.json({
      success: true,
      message: "Thanks. Your message has been received.",
      eventId,
      tracking: trackingResults.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : { ok: false, error: "tracking_failed" }
      ),
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again or email us directly.",
      },
      { status: 500 }
    );
  }
}