import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackingContext = Record<string, unknown>;
type UploadAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

const freeAuditSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(180),
  website: z.string().trim().min(4, "Website URL is required").max(300),
  company: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(80).optional().default(""),
  issue: z.string().trim().min(2, "Main tracking concern is required").max(180),
  platforms: z.string().trim().max(180).optional().default(""),
  adSpend: z.string().trim().max(120).optional().default(""),
  documentLink: z.string().trim().max(700).optional().default(""),
  message: z.string().trim().min(10, "Message is required").max(4000),
  consent: z.boolean().refine((value) => value, "Consent is required"),
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

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      "Free audit SMTP is not configured. Set CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER, and CONTACT_SMTP_PASS.",
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
    throw new Error("Missing free audit email identity. Set CONTACT_SMTP_FROM_EMAIL and CONTACT_TO_EMAIL.");
  }

  return {
    fromEmail,
    toEmail,
    businessReplyEmail,
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

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseTrackingContext(value: string): TrackingContext {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as TrackingContext) : {};
  } catch {
    return {};
  }
}

function getBooleanField(formData: FormData, name: string) {
  const value = getStringField(formData, name).toLowerCase();
  return ["1", "true", "yes", "on"].includes(value);
}

function hasAllowedAttachmentName(filename: string) {
  const lower = filename.toLowerCase();
  return allowedExtensions.some((extension) => lower.endsWith(extension));
}

function getSafeAttachmentName(filename: string) {
  const fallback = "trackflow-audit-attachment";
  const clean = filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return clean || fallback;
}

async function getAttachment(formData: FormData): Promise<UploadAttachment | null> {
  const value = formData.get("attachment");

  if (!value || typeof value === "string") return null;

  const file = value as File;
  const filename = getSafeAttachmentName(file.name || "trackflow-audit-attachment");
  const contentType = file.type || "application/octet-stream";

  if (!file.size) return null;

  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("The attachment is too large. Please upload one file under 2 MB.");
  }

  if (!allowedMimeTypes.has(contentType) && !hasAllowedAttachmentName(filename)) {
    throw new Error("Only JPG, PNG, WEBP, or PDF attachments are allowed.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    filename,
    content: buffer,
    contentType,
  };
}

function formatRows(items: Array<[string, unknown]>) {
  return items
    .map(
      ([label, value]) => `
        <tr class="tfp-row">
          <td class="tfp-label" valign="top" style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:800;width:34%;max-width:220px;vertical-align:top;line-height:1.45;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box;">${escapeHtml(label)}</td>
          <td class="tfp-value" valign="top" style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;vertical-align:top;line-height:1.65;word-break:break-word;overflow-wrap:anywhere;white-space:normal;box-sizing:border-box;">${escapeHtml(cleanText(value))}</td>
        </tr>`,
    )
    .join("");
}

function buildAdminEmail(
  payload: z.infer<typeof freeAuditSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string,
  attachment: UploadAttachment | null,
) {
  const client = intel.client as Record<string, unknown>;
  const server = intel.server;

  const rows = formatRows([
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company],
    ["Website", payload.website],
    ["Phone", payload.phone],
    ["Main Tracking Concern", payload.issue],
    ["Platforms Used", payload.platforms],
    ["Monthly Ad Spend", payload.adSpend],
    ["Document Link", payload.documentLink],
    ["Message", payload.message],
    ["Attachment", attachment ? `${attachment.filename} (${formatBytes(attachment.content.length)})` : "No file attached"],
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
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @media only screen and (max-width: 620px) {
          .tfp-shell { padding: 12px !important; }
          .tfp-card { width: 100% !important; border-radius: 18px !important; }
          .tfp-header, .tfp-body { padding: 18px !important; }
          .tfp-title { font-size: 22px !important; line-height: 1.25 !important; }
          .tfp-table, .tfp-table tbody, .tfp-row, .tfp-label, .tfp-value { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
          .tfp-label { padding: 12px 12px 4px !important; border-bottom: 0 !important; background: #f8fafc !important; }
          .tfp-value { padding: 0 12px 12px !important; border-bottom: 1px solid #e2e8f0 !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
      <div class="tfp-shell" style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;width:100%;box-sizing:border-box;">
        <div class="tfp-card" style="width:100%;max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-sizing:border-box;">
          <div class="tfp-header" style="background:#020617;color:#ffffff;padding:24px;box-sizing:border-box;">
            <p style="margin:0 0 8px;color:#93c5fd;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;">TrackFlow Pro Free Audit Request</p>
            <h1 class="tfp-title" style="margin:0;font-size:26px;line-height:1.2;word-break:break-word;overflow-wrap:anywhere;">New free tracking audit request from ${escapeHtml(payload.name)}</h1>
          </div>
          <div class="tfp-body" style="padding:24px;box-sizing:border-box;">
            <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;word-break:break-word;overflow-wrap:anywhere;">
              Reply directly to this email to respond to <strong>${escapeHtml(payload.email)}</strong>. Any uploaded screenshot or PDF is attached to this admin email only.
            </p>
            <table class="tfp-table" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;width:100%;max-width:100%;table-layout:fixed;font-size:14px;box-sizing:border-box;">${rows}</table>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function buildUserConfirmationEmail(name: string) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @media only screen and (max-width: 620px) {
          .tfp-shell { padding: 12px !important; }
          .tfp-card { width: 100% !important; border-radius: 18px !important; }
          .tfp-header, .tfp-body { padding: 18px !important; }
          .tfp-title { font-size: 22px !important; line-height: 1.25 !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
      <div class="tfp-shell" style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;width:100%;box-sizing:border-box;">
        <div class="tfp-card" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-sizing:border-box;">
          <div class="tfp-header" style="background:#020617;color:#ffffff;padding:24px;box-sizing:border-box;">
            <p style="margin:0 0 8px;color:#93c5fd;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;">TrackFlow Pro</p>
            <h1 class="tfp-title" style="margin:0;font-size:24px;line-height:1.2;word-break:break-word;overflow-wrap:anywhere;">Your free audit request has been received</h1>
          </div>
          <div class="tfp-body" style="padding:24px;color:#334155;font-size:15px;line-height:1.8;box-sizing:border-box;word-break:break-word;overflow-wrap:anywhere;">
            <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 16px;">Thanks for requesting a free TrackFlow Pro tracking review. I received your website details and will review the tracking issue you shared.</p>
            <p style="margin:0 0 16px;">The first review starts with public browser-visible evidence. Final confirmation may require approved access to GA4, GTM, Google Ads, Meta, CRM, or server-side logs.</p>
            <p style="margin:24px 0 0;">Best,<br><strong>Shahjalal Khan</strong><br>TrackFlow Pro</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

async function sendGa4LeadEvent(
  payload: z.infer<typeof freeAuditSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string,
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
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: "generate_lead",
        params: {
          event_id: eventId,
          engagement_time_msec: 1,
          form_name: "free_tracking_audit_form",
          service_interest: "Free Tracking Audit",
          main_tracking_concern: payload.issue,
          platforms_used: payload.platforms,
          monthly_ad_spend: payload.adSpend,
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
  payload: z.infer<typeof freeAuditSchema>,
  intel: ReturnType<typeof getRequestIntelligence>,
  eventId: string,
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
          process.env.NEXT_PUBLIC_SITE_URL || "https://trackflowpro.com/free-tracking-audit",
        ),
        user_data: userData,
        custom_data: {
          content_name: "TrackFlow Pro Free Tracking Audit Form",
          service_interest: "Free Tracking Audit",
          main_tracking_concern: payload.issue,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
      pixelId,
    )}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
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

  return { ok: response.ok, status: response.status, result };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawPayload = {
      name: getStringField(formData, "name"),
      email: getStringField(formData, "email"),
      website: getStringField(formData, "website"),
      company: getStringField(formData, "company"),
      phone: getStringField(formData, "phone"),
      issue: getStringField(formData, "issue"),
      platforms: getStringField(formData, "platforms"),
      adSpend: getStringField(formData, "adSpend"),
      documentLink: getStringField(formData, "documentLink"),
      message: getStringField(formData, "message"),
      consent: getBooleanField(formData, "consent"),
      honeypot: getStringField(formData, "honeypot"),
      turnstileToken: getStringField(formData, "turnstileToken"),
      trackingContext: parseTrackingContext(getStringField(formData, "trackingContext")),
    };

    const parsed = freeAuditSchema.safeParse(rawPayload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the free audit request fields.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.honeypot) {
      return NextResponse.json({
        success: true,
        message: "Thanks. Your free audit request has been received.",
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
        { status: 403 },
      );
    }

    let attachment: UploadAttachment | null = null;

    try {
      attachment = await getAttachment(formData);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "The attachment could not be processed.",
        },
        { status: 400 },
      );
    }

    const transporter = getTransporter();
    const { fromEmail, toEmail, businessReplyEmail } = getMailIdentity();

    const eventId = `free_audit_${Date.now()}_${crypto.randomUUID()}`;
    const safeWebsite = normalizeUrl(payload.website);
    const mailPayload = { ...payload, website: safeWebsite };

    await transporter.sendMail({
      from: `"TrackFlow Pro" <${fromEmail}>`,
      to: toEmail,
      replyTo: payload.email,
      subject: `New Free Tracking Audit Request: ${payload.name}${safeWebsite ? ` (${safeWebsite})` : ""}`,
      html: buildAdminEmail(mailPayload, intelligence, eventId, attachment),
      attachments: attachment ? [attachment] : [],
    });

    await transporter.sendMail({
      from: `"TrackFlow Pro" <${fromEmail}>`,
      to: payload.email,
      replyTo: businessReplyEmail,
      subject: "TrackFlow Pro received your free audit request",
      html: buildUserConfirmationEmail(payload.name),
    });

    const trackingResults = await Promise.allSettled([
      sendGa4LeadEvent(mailPayload, intelligence, eventId),
      sendMetaLeadEvent(mailPayload, intelligence, eventId),
    ]);

    return NextResponse.json({
      success: true,
      message:
        "Thanks. Your free tracking audit request has been received. I will review the details and contact you with the next step.",
      eventId,
      attachmentReceived: Boolean(attachment),
      tracking: trackingResults.map((result) =>
        result.status === "fulfilled" ? result.value : { ok: false, error: "tracking_failed" },
      ),
    });
  } catch (error) {
    console.error("Free audit request error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again or email us directly.",
      },
      { status: 500 },
    );
  }
}
