import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { google } from "googleapis";
import { z } from "zod";
import {
  BRAND_WEBSITE,
  BRAND_WEBSITE_LABEL,
  MAIN_INBOX_EMAIL,
  MAIN_INBOX_NAME,
  getDefaultSender,
  getSenderByEmail,
  getSenderById,
  toApiSenderConfig,
} from "@/lib/senders";

/**
 * TrackFlowPro Single API Route
 * File path:
 *   app/api/trackflow/[...action]/route.ts
 *
 * This one catch-all route replaces these separate API routes:
 *   POST   /api/send-email                         -> POST   /api/trackflow/send-email
 *   DELETE /api/send-email                         -> DELETE /api/trackflow/send-email
 *   GET    /api/cron/scheduled-initials            -> GET    /api/trackflow/cron/scheduled-initials
 *   GET    /api/cron/followups                     -> GET    /api/trackflow/cron/followups
 *   POST   /api/webhooks/brevo                     -> POST   /api/trackflow/webhooks/brevo
 *   POST   /api/webhooks/reply                     -> POST   /api/trackflow/webhooks/reply
 *   GET    /api/unsubscribe                        -> GET    /api/trackflow/unsubscribe
 *   POST   /api/unsubscribe                        -> POST   /api/trackflow/unsubscribe
 *
 * Required ENV:
 *   BREVO_API_KEY=
 *   CRON_SECRET=
 *   BREVO_WEBHOOK_SECRET=
 *   REPLY_WEBHOOK_SECRET=
 *   UNSUBSCRIBE_SECRET=
 *   NEXT_PUBLIC_APP_URL=https://trackflowpro.com
 *   ALLOWED_ADMIN_EMAILS=your@email.com,another@email.com
 *
 * Optional ENV:
 *   ALLOW_UNAUTHENTICATED_ADMIN_API=false
 *
 * Free-limit friendly architecture note:
 * - Sender list/config stays in lib/senders.ts, not Firestore.
 * - Google Sheet is used as a lead queue/staging area, not as the realtime automation database.
 * - Follow-up timing remains Firestore-based so open/click scheduling stays accurate.
 * - Sheet queue locking uses Sheet columns, not an extra Firestore lock collection.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params?: { action?: string[] } | Promise<{ action?: string[] }>;
};

type SenderConfig = {
  id?: string;
  name: string;
  email: string;
  replyToEmail?: string;
  replyToName?: string;
  dailyLimit: number;
};

type BrevoSendInput = {
  sender: SenderConfig;
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  tag: string;
  customMessageId: string;
};

type LeadData = {
  id?: string;
  email?: string;
  emailLower?: string;
  name?: string;
  company_name?: string;
  website?: string;
  business_type?: string;
  service?: string;
  sender_email?: string;
  sender_name?: string;
  sender_id?: string;
  senderId?: string;
  subject?: string;
  message?: string;
  trackingId?: string;
  status?: string;
  stopAutomation?: boolean;
  follow_up_count?: number;
  open_count?: number;
  click_count?: number;
  sentAt?: any;
  lastFollowUp?: any;
  lastOpenedAt?: any;
  lastClickedAt?: any;
  lastEngagedAt?: any;
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  lastFollowupEvaluatedAt?: any;
  retryCount?: number;
  lastFollowupError?: string;
  scheduledAt?: any;
  automationLock?: any;
  include_signature?: boolean;
  reportUrl?: string;
  reportButtonText?: string;
  reportToken?: string;
  pdfFileId?: string;
  pdfViewUrl?: string;
  pdfDownloadUrl?: string;
  pdfExpiresAt?: any;
  sheetRowNumber?: number;
  sheetWebsiteUrl?: string;
  sheetFinalEmail?: string;
  source?: string;
  [key: string]: any;
};


/**
 * Lightweight Firestore snapshot aliases.
 * বাংলা ব্যাখ্যা: কিছু project-এ FirebaseFirestore namespace type missing দেখাতে পারে।
 * তাই route file-এর ভিতরে local aliases রাখা হয়েছে, runtime behavior পরিবর্তন হয় না।
 */
type FirestoreDocRef = any;
type FirestoreQueryRef = any;
type FirestoreDocSnap = any;
type FirestoreQueryDocSnap = any;

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Sender is verified server-side from app/config/senders.ts.
 * Frontend only sends senderId; API never trusts raw sender email/name from the browser.
 */
const DEFAULT_SENDER_NAME = MAIN_INBOX_NAME;
const DEFAULT_REPLY_TO_EMAIL = MAIN_INBOX_EMAIL;
const DEFAULT_REPLY_TO_NAME = MAIN_INBOX_NAME;
const DEFAULT_DAILY_LIMIT = 50;

const SERVICES = new Set(["Email Signature", "Google Ads", "Server Side Tracking"]);
const PROTECTED_STATUSES = new Set(["opened", "clicked", "replied", "bounced", "spam", "unsubscribed", "cancelled", "finished"]);
const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "interested", "active"]);
const HARD_STOP_STATUSES = new Set(["replied", "bounced", "spam", "unsubscribed", "not_interested", "cancelled", "finished", "blocked_suppressed"]);
const FOLLOWUP_MAX_WORDS = 120;
const FOLLOWUP_MAX_LINKS = 1;
const FOLLOWUP_CANDIDATE_LIMIT = 300; // legacy fallback / dry-run safety cap
const NEXT_FOLLOWUP_QUERY_LIMIT = 100;
const DEFAULT_FOLLOWUP_BATCH_PER_RUN = 5;
const MAX_FOLLOWUP_BATCH_PER_RUN = 20;
const MAX_FOLLOWUP_RETRIES = 3;
const STALE_LOCK_MINUTES = 30;

// Serious cold-outreach safety policy:
// - Never auto follow-up leads with zero open/click engagement.
// - When engagement exists, send follow-ups 1 hour before the lead's last engagement time + configured delay.
const REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP = true;
const FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES = 60;

const ServiceSchema = z.enum(["Email Signature", "Google Ads", "Server Side Tracking"]);

const SendInitialBodySchema = z
  .object({
    email: z.string().email(),
    senderId: z.string().optional(),
    sender_id: z.string().optional(),
    sender: z.object({ id: z.string().optional() }).optional(),
    clientName: z.string().optional(),
    name: z.string().optional(),
    companyName: z.string().optional(),
    company_name: z.string().optional(),
    website: z.string().optional(),
    businessType: z.string().optional(),
    business_type: z.string().optional(),
    selectedService: ServiceSchema.optional(),
    service: ServiceSchema.optional(),
    subject: z.string().min(1),
    message: z.string().min(1),
    scheduledAt: z.any().optional(),
    includeSignature: z.boolean().optional(),
    signatureMode: z.enum(["full", "compact", "none"]).optional(),
    signature_mode: z.enum(["full", "compact", "none"]).optional(),
    reportUrl: z.string().optional(),
    reportButtonText: z.string().optional(),
    allowDuplicateSend: z.boolean().optional(),
    allowCooldownOverride: z.boolean().optional(),
    trackingId: z.string().optional(),
    reportToken: z.string().optional(),
    pdfFileId: z.string().optional(),
    pdfViewUrl: z.string().optional(),
    pdfDownloadUrl: z.string().optional(),
    pdfExpiresAt: z.any().optional(),
    sheetRowNumber: z.any().optional(),
    sheetWebsiteUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
    sheetFinalEmail: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough()
  .refine((value: any) => Boolean(value.senderId || value.sender_id || value.sender?.id), {
    message: "senderId is required",
    path: ["senderId"],
  })
  .refine((value: any) => Boolean(value.selectedService || value.service), {
    message: "selectedService is required",
    path: ["selectedService"],
  });

function json(payload: any, status = 200) {
  return NextResponse.json(payload, { status });
}

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function getAction(ctx: RouteContext): Promise<string> {
  const maybeParams: any = ctx?.params;
  const params = typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;
  return (params?.action || []).join("/").replace(/^\/+|\/+$/g, "").toLowerCase();
}

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function env(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) throw new ApiError(`Missing ENV: ${name}`, 500);
  return value || "";
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailDocId(emailLower: string): string {
  return encodeURIComponent(emailLower).replace(/\./g, "%2E");
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function timestampFromAny(value: any): any | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function getComplianceMailingAddress(): string {
  return String(
    process.env.TRACKFLOW_MAILING_ADDRESS ||
      process.env.BUSINESS_MAILING_ADDRESS ||
      process.env.COMPANY_MAILING_ADDRESS ||
      "",
  ).trim();
}

function buildComplianceAddressLine(prefix = "Mailing address: "): string {
  const address = escapeHtml(getComplianceMailingAddress());
  if (!address) return "";
  return `${prefix}${address}`;
}

function stripDangerousHtml(input: string): string {
  /**
   * EMAIL HTML SANITIZER
   * বাংলা ব্যাখ্যা: Compose preview frontend-এ দেখা যাবে, কিন্তু final send করার আগে backend এই function দিয়ে
   * unsafe HTML পরিষ্কার করে। এতে script/iframe/onClick/javascript link type ঝুঁকি কমে।
   */
  let html = String(input || "");

  // Remove high-risk tags with their content.
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  // Remove self-closing or standalone high-risk tags.
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)\b[^>]*\/?\s*>/gi, "");
  // Remove inline event handlers like onclick/onload.
  html = html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  // Remove unsafe URL protocols from attributes/content.
  html = html.replace(/javascript\s*:/gi, "");
  html = html.replace(/data\s*:\s*text\/html/gi, "");
  html = html.replace(/vbscript\s*:/gi, "");

  return html.trim();
}
function plainTextFromHtml(input: string): string {
  return String(input || "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWordsFromHtml(input: string): number {
  const text = plainTextFromHtml(input);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function countLinksFromHtml(input: string): number {
  return (String(input || "").match(/<a\s/gi) || []).length;
}

function validateFollowupContent(html: string): { ok: boolean; reasons: string[]; words: number; links: number } {
  const words = countWordsFromHtml(html);
  const links = countLinksFromHtml(html);
  const reasons: string[] = [];

  if (!words) reasons.push("Follow-up body is empty");
  if (words > FOLLOWUP_MAX_WORDS) reasons.push(`Follow-up is too long (${words}/${FOLLOWUP_MAX_WORDS} words)`);
  if (links > FOLLOWUP_MAX_LINKS) reasons.push(`Follow-up has too many links (${links}/${FOLLOWUP_MAX_LINKS})`);

  return { ok: reasons.length === 0, reasons, words, links };
}


function getEngagementMinuteOfDayUtc(ms: number): number {
  const date = new Date(ms);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function shiftMinuteOfDay(minuteOfDay: number, offsetMinutes: number): number {
  const total = 24 * 60;
  return ((Math.floor(minuteOfDay) + offsetMinutes) % total + total) % total;
}

function scheduleBeforeEngagementTime(anchorEngagedMs: number, delayMinutes: number): number {
  if (!anchorEngagedMs) return 0;
  const safeDelay = Number.isFinite(delayMinutes) && delayMinutes > 0 ? delayMinutes : 1440;
  return anchorEngagedMs + (safeDelay - FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES) * 60_000;
}

function mapSharedSender(sender: ReturnType<typeof getDefaultSender>): SenderConfig {
  if (!sender) throw new ApiError("No active sender configured", 500);
  const apiSender = toApiSenderConfig(sender);
  return {
    id: apiSender.id,
    name: apiSender.name,
    email: apiSender.email,
    replyToEmail: apiSender.replyToEmail,
    replyToName: apiSender.replyToName,
    dailyLimit: apiSender.dailyLimit,
  };
}

function getSenderFromBody(body: any): SenderConfig {
  const senderId = String(body.senderId || body.sender_id || body.sender?.id || "").trim();
  const sender = getSenderById(senderId);

  if (!sender) {
    throw new ApiError("Invalid sender selected. Choose an active sender from app/config/senders.ts", 400);
  }

  return mapSharedSender(sender);
}

function getSenderFromLead(lead: LeadData): SenderConfig {
  const senderById = getSenderById(String(lead.sender_id || lead.senderId || ""));
  const senderByEmail = getSenderByEmail(String(lead.sender_email || ""));
  const sender = senderById || senderByEmail || getDefaultSender();
  return mapSharedSender(sender);
}

async function requireAdmin(req: Request) {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (process.env.ALLOW_UNAUTHENTICATED_ADMIN_API === "true") {
    if (isProduction) {
      throw new ApiError("Unsafe config: unauthenticated admin API is not allowed in production", 500);
    }
    return { uid: "dev-mode", email: "dev@local" };
  }

  const allowed = (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((x: string) => normalizeEmail(x))
    .filter(Boolean);

  if (allowed.length === 0) {
    throw new ApiError("Server misconfigured: ALLOWED_ADMIN_EMAILS must contain at least one admin email", 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new ApiError("Unauthorized: missing Firebase ID token", 401);
  }

  const idToken = authHeader.slice(7).trim();
  const decoded = await admin.auth().verifyIdToken(idToken);
  const userEmail = normalizeEmail(decoded.email || "");

  if (!userEmail || !allowed.includes(userEmail)) {
    throw new ApiError("Forbidden: this user is not allowed to use outreach API", 403);
  }

  return decoded;
}

function requireCronSecret(req: Request) {
  const secret = req.headers.get("x-cron-auth") || "";
  const expected = env("CRON_SECRET");
  if (!secret || !safeEqual(secret, expected)) throw new ApiError("Unauthorized cron request", 401);
}

function requireWebhookSecret(req: Request, envName: "BREVO_WEBHOOK_SECRET" | "REPLY_WEBHOOK_SECRET") {
  const secret = req.headers.get("x-webhook-secret") || "";
  const expected = env(envName);
  if (!secret || !safeEqual(secret, expected)) throw new ApiError("Unauthorized webhook request", 401);
}



function hmacHex(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function unsubscribeToken(emailLower: string): string {
  return hmacHex(emailLower, env("UNSUBSCRIBE_SECRET")).slice(0, 40);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a || "");
  const bBuf = Buffer.from(b || "");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function unsubscribeUrl(emailLower: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://trackflowpro.com").replace(/\/+$/, "");
  const token = unsubscribeToken(emailLower);
  return `${base}/api/trackflow/unsubscribe?email=${encodeURIComponent(emailLower)}&token=${encodeURIComponent(token)}`;
}

async function isSuppressed(emailLower: string) {
  const snap = await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).get();
  return snap.exists ? snap.data() : null;
}

function serializeContactMemoryForWarning(memory: Record<string, any> = {}) {
  const cooldownMs = toMillis(memory.cooldownUntil);
  const memoryExpiresMs = toMillis(memory.memoryExpiresAt);
  const lastContactedMs = toMillis(memory.lastContactedAt);

  return {
    emailLower: memory.emailLower || "",
    lastOutcome: memory.lastOutcome || "previous_contact",
    lastContactedAt: lastContactedMs ? new Date(lastContactedMs).toISOString() : "",
    cooldownUntil: cooldownMs ? new Date(cooldownMs).toISOString() : "",
    memoryExpiresAt: memoryExpiresMs ? new Date(memoryExpiresMs).toISOString() : "",
    companyName: memory.companyName || "",
    website: memory.website || "",
    service: memory.service || "",
    openCount: Number(memory.openCount || 0),
    clickCount: Number(memory.clickCount || 0),
    sourceLeadId: memory.sourceLeadId || "",
  };
}

async function getActiveContactMemoryWarning(emailLower: string) {
  /**
   * CONTACT MEMORY COOLDOWN CHECK
   * বাংলা ব্যাখ্যা: Full lead delete হলেও contact_memory footprint থাকে।
   * একই email cooldown period-এর মধ্যে আবার Send Email tab থেকে পাঠাতে গেলে warning দেওয়া হবে।
   * suppression_list হলে আলাদা hard block হবে; contact_memory শুধু warning + override flow।
   */
  const memorySnap = await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).get();
  if (!memorySnap.exists) return null;

  const memory = memorySnap.data() || {};
  const cooldownMs = toMillis(memory.cooldownUntil);
  const memoryExpiresMs = toMillis(memory.memoryExpiresAt);
  const nowMs = Date.now();

  if (memoryExpiresMs && memoryExpiresMs <= nowMs) return null;
  if (!cooldownMs || cooldownMs <= nowMs) return null;

  return serializeContactMemoryForWarning(memory);
}

async function addSuppression(emailLower: string, reason: string, extra: Record<string, any> = {}) {
  if (!emailLower) return;
  await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).set(
    {
      emailLower,
      reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

async function addEmailEvent(leadId: string, event: string, payload: Record<string, any> = {}) {
  if (!leadId) return;
  await adminDb.collection("email_events").add({
    leadId,
    event,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...payload,
  });
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeOptionalUrl(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function buildReportLinkBlock(reportUrl?: string, buttonText = "View private audit note") {
  const safeUrl = sanitizePublicReportUrl(reportUrl || "");
  if (!safeUrl) return "";

  const safeText = escapeHtml(buttonText || "View private audit note").slice(0, 80);

  // Agency-style, Outlook-safe CTA. Keep it as a table so Brevo/Outlook render consistently.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:18px 0 2px 0;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;mso-line-height-rule:exactly;padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td bgcolor="#0f172a" style="border-radius:6px;background:#0f172a;mso-padding-alt:10px 14px;">
                <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#ffffff;text-decoration:none;font-weight:bold;">
                  ${safeText}
                </a>
              </td>
            </tr>
          </table>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#6b7280;margin-top:8px;">
            Private TrackFlow Pro audit note · PDF opens from the secure report page.
          </div>
        </td>
      </tr>
    </table>
  `;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || BRAND_WEBSITE || "https://trackflowpro.com").replace(/\/+$/, "");
}

function normalizeReportToken(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function createReportToken(): string {
  return randomUUID().replace(/-/g, "");
}

function buildPublicReportUrl(token: string): string {
  return `${appBaseUrl()}/r/${encodeURIComponent(token)}`;
}

function isLocalOrUnsafeReportUrl(value: string): boolean {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return true;
  if (raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("0.0.0.0")) return true;
  if (raw.includes("/audit/pdf/") || raw.includes(":8000/")) return true;
  // Email/report URL must be the branded TrackFlow /r/{token} page, not a direct PDF/Drive link.
  if (raw.includes("drive.google.com") || raw.includes("googleusercontent.com")) return true;
  if (/\.pdf(?:$|[?#])/.test(raw)) return true;
  return false;
}

function sanitizePublicReportUrl(value: any): string {
  const url = sanitizeOptionalUrl(String(value || ""));
  if (!url || isLocalOrUnsafeReportUrl(url)) return "";
  return url;
}

function sanitizeLocalRedirectTarget(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "/contact";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  const safe = sanitizeOptionalUrl(raw);
  if (!safe) return "/contact";
  try {
    const url = new URL(safe);
    const app = new URL(appBaseUrl());
    if (url.hostname === app.hostname) return `${url.pathname}${url.search}${url.hash}`;
  } catch {}
  return "/contact";
}

function firstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = cleanCell(value || "");
    if (text) return text;
  }
  return "";
}

function normalizeStringArray(value: any, maxItems = 8): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of rawItems) {
    const text = cleanCell(item || "");
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= maxItems) break;
  }
  return output;
}

async function requireReportRegisterAccess(req: Request) {
  const expected = process.env.REPORT_REGISTER_SECRET || "";
  if (expected) {
    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
    const secret = req.headers.get("x-report-register-secret") || bearer;
    if (secret && safeEqual(secret, expected)) return { uid: "report-register-secret", email: "python-export" };
  }
  return await requireAdmin(req);
}

function getReportTimestamp(value: any, fallbackDays = 30) {
  const parsed = timestampFromAny(value);
  if (parsed) return parsed;
  return admin.firestore.Timestamp.fromMillis(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

function normalizeReportPayload(body: AnyRecord = {}) {
  const token = normalizeReportToken(body.token || body.reportToken || body.report_token) || createReportToken();
  const pdfViewUrl = sanitizeOptionalUrl(body.pdfViewUrl || body.pdf_view_url || body.driveViewUrl || body.drive_view_url || body.pdfUrl || body.pdf_url || "");
  const pdfDownloadUrl = sanitizeOptionalUrl(body.pdfDownloadUrl || body.pdf_download_url || body.driveDownloadUrl || body.drive_download_url || "");
  const reportUrl = sanitizePublicReportUrl(body.reportUrl || body.report_url) || buildPublicReportUrl(token);
  const domain = firstCleanString(body.domain, body.websiteUrl, body.website_url, body.website, body.url);
  const companyName = firstCleanString(body.companyName, body.company_name, body.businessName, body.business_name, domain);
  const headline = firstCleanString(
    body.headline,
    body.clientMessageHeadline,
    body.client_message_headline,
    body.mainIssue,
    body.main_issue,
    "Private tracking audit note"
  );
  const mainFinding = firstCleanString(body.mainFinding, body.main_finding, body.mainIssue, body.main_issue, body.problemSummary, body.problem_summary);
  const businessImpact = firstCleanString(body.businessImpact, body.business_impact, body.impact, body.messageAngle, body.message_angle);
  const proofPoints = normalizeStringArray(body.proofPoints || body.proof_points || body.evidencePoints || body.evidence_points, 10);
  const recommendations = normalizeStringArray(body.recommendations || body.fixRecommendations || body.fix_recommendations, 8);
  const email = normalizeEmail(body.email || body.finalEmail || body.final_email || "");
  const leadId = firstCleanString(body.leadId, body.firestoreLeadId, body.firestore_lead_id);
  const sheetRowNumber = Number(body.sheetRowNumber || body.sheet_row_number || 0) || null;
  const pdfExpiresAt = getReportTimestamp(body.pdfExpiresAt || body.pdf_expires_at || body.expiresAt || body.expires_at, 45);

  return {
    token,
    reportUrl,
    domain,
    websiteUrl: firstCleanString(body.websiteUrl, body.website_url, body.website, domain ? `https://${domain}` : ""),
    companyName,
    email,
    headline,
    mainFinding,
    businessImpact,
    proofPoints,
    recommendations,
    pdfFileId: firstCleanString(body.pdfFileId, body.pdf_file_id, body.driveFileId, body.drive_file_id, body.googleDriveFileId),
    pdfViewUrl,
    pdfDownloadUrl,
    pdfExpiresAt,
    leadId,
    sheetRowNumber,
    source: firstCleanString(body.source, "python_drive_oauth_export"),
    auditId: firstCleanString(body.auditId, body.audit_id, body.sourceAuditId, body.source_audit_id),
    storageProvider: firstCleanString(body.storageProvider, body.storage_provider, "google_drive_oauth"),
    contactEmail: firstCleanString(body.contactEmail, body.contact_email, body.agencyEmail, body.agency_email, MAIN_INBOX_EMAIL),
    ctaUrl: firstCleanString(body.ctaUrl, body.cta_url, "/contact"),
    ctaText: firstCleanString(body.ctaText, body.cta_text, "Book a tracking review"),
  };
}

type SignatureMode = "full" | "compact" | "none";

function normalizeSignatureMode(value: any, fallback: SignatureMode = "full"): SignatureMode {
  const mode = String(value || "").toLowerCase().trim();
  if (mode === "compact" || mode === "none" || mode === "full") return mode as SignatureMode;
  return fallback;
}

function buildSignature(emailLower: string, tag: string, sender?: SenderConfig, mode: SignatureMode = "full") {
  if (mode === "none") return "";

  const unsub = unsubscribeUrl(emailLower);
  const senderName = escapeHtml(sender?.name || DEFAULT_SENDER_NAME);
  // Visible contact is always the real inbox. Sender aliases are used only as From addresses.
  const visibleEmail = escapeHtml(MAIN_INBOX_EMAIL);
  const websiteUrl = escapeHtml(BRAND_WEBSITE);
  const websiteLabel = escapeHtml(BRAND_WEBSITE_LABEL);
  const safeTag = escapeHtml(tag.toUpperCase());
  const mailingAddressLine = buildComplianceAddressLine();
  const mailingAddressHtml = mailingAddressLine
    ? `<div style="margin:4px 0 0 0;color:#9ca3af;font-size:10px;line-height:15px;mso-line-height-rule:exactly;">${mailingAddressLine}</div>`
    : "";

  if (mode === "compact") {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:18px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;mso-line-height-rule:exactly;padding:12px 0 0 0;border-top:1px solid #e5e7eb;">
            <div style="margin:0 0 2px 0;color:#111827;font-weight:bold;">${senderName}</div>
            <div style="margin:0;color:#6b7280;">TrackFlowPro · Conversion Tracking Audit</div>
            <div style="margin:6px 0 0 0;color:#6b7280;font-size:11px;line-height:17px;mso-line-height-rule:exactly;">
              <a href="mailto:${visibleEmail}" style="color:#374151;text-decoration:none;">${visibleEmail}</a>
              <span style="color:#d1d5db;"> | </span>
              <a href="${websiteUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:bold;">${websiteLabel}</a>
              <span style="color:#d1d5db;"> | </span>
              <a href="${unsub}" target="_blank" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            </div>
            ${mailingAddressHtml}
          </td>
        </tr>
      </table>
    `;
  }

  // Full signature is still text/table based. This renders more consistently in Outlook than image-heavy signatures.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:22px;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:560px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;padding:14px 0 0 0;border-top:1px solid #e5e7eb;mso-line-height-rule:exactly;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td width="4" style="width:4px;background:#2563eb;font-size:0;line-height:0;">&nbsp;</td>
              <td style="padding:0 0 0 14px;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:15px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#111827;margin:0;">${senderName}</div>
                <div style="font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:#4b5563;font-weight:bold;margin:0;">Founder, TrackFlowPro</div>
                <div style="font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#6b7280;margin:3px 0 0 0;">Google Ads Tracking · Server-Side Tracking · Conversion Audit</div>
                <div style="font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#374151;margin:8px 0 0 0;">
                  <a href="mailto:${visibleEmail}" style="color:#374151;text-decoration:none;">${visibleEmail}</a>
                  <span style="color:#d1d5db;"> | </span>
                  <a href="${websiteUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:bold;">${websiteLabel}</a>
                </div>
                <div style="font-size:10px;line-height:15px;mso-line-height-rule:exactly;color:#9ca3af;margin:8px 0 0 0;">
                  Ref: ${safeTag}
                  <span style="color:#d1d5db;"> | </span>
                  <a href="${unsub}" target="_blank" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                </div>
                ${mailingAddressHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function normalizeEmailBodyHtml(input: string): string {
  const cleanMessage = stripDangerousHtml(input || "").trim();
  if (!cleanMessage) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(cleanMessage);
  if (hasHtml) {
    return cleanMessage
      .replace(/<p(\s|>)/gi, '<p style="margin:0 0 12px 0;"$1')
      .replace(/<div(\s|>)/gi, '<div style="margin:0 0 12px 0;"$1')
      .replace(/<a\s/gi, '<a style="color:#2563eb;text-decoration:underline;font-weight:bold;" ');
  }

  return cleanMessage
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 12px 0;">${escapeHtml(part).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function buildEmailHtml(
  message: string,
  emailLower: string,
  tag: string,
  options: {
    includeSignature?: boolean;
    reportUrl?: string;
    reportButtonText?: string;
    sender?: SenderConfig;
    signatureMode?: SignatureMode;
    includeReportLink?: boolean;
  } = {}
) {
  const cleanMessage = normalizeEmailBodyHtml(message);
  const includeSignature = options.includeSignature !== false;
  const signatureMode = includeSignature ? normalizeSignatureMode(options.signatureMode, "full") : "none";
  const reportBlock = options.includeReportLink === false ? "" : buildReportLinkBlock(options.reportUrl, options.reportButtonText || "View short audit note");
  const signatureBlock = includeSignature ? buildSignature(emailLower, tag, options.sender, signatureMode) : "";

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#ffffff;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td align="left" style="padding:0;margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:620px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#1f2937;padding:0;margin:0;">
                ${cleanMessage}
                ${reportBlock}
                ${signatureBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function personalizeTemplate(content: string, lead: LeadData): string {
  const replacements: Record<string, string> = {
    "{name}": lead.name || "there",
    "{company}": lead.company_name || "your company",
    "{website}": lead.website || "your website",
    "{service}": lead.service || "our service",
  };

  let output = stripDangerousHtml(content);

  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(escapeHtml(value));
  }

  return output;
}

async function sendViaBrevo(input: BrevoSendInput) {
  const emailLower = normalizeEmail(input.toEmail);
  const unsub = unsubscribeUrl(emailLower);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env("BREVO_API_KEY"),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: input.sender.name, email: input.sender.email },
      to: [{ email: input.toEmail, name: input.toName || "" }],
      replyTo: {
        email: input.sender.replyToEmail || DEFAULT_REPLY_TO_EMAIL,
        name: input.sender.replyToName || input.sender.name || DEFAULT_REPLY_TO_NAME,
      },
      subject: input.subject,
      tags: [input.tag],
      htmlContent: input.htmlContent,
      headers: {
        "X-Mailin-Tag": input.tag,
        "Message-ID": input.customMessageId,
        "X-Entity-Ref-ID": input.tag.split("_step")[0],
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || "Brevo API Error", 400);
  }

  return data;
}

function deterministicVariantIndex(key: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

async function reserveDailySlot(limit: number, kind: "initial" | "followup", senderEmail?: string) {
  const key = todayKey();
  const id = senderEmail ? `${key}_${emailDocId(normalizeEmail(senderEmail))}` : key;
  const ref = adminDb.collection("daily_sending_stats").doc(id);

  const result = await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const field = kind === "followup" ? "followupSent" : "initialSent";
    const total = Number(data[field] || 0);
    if (total >= limit) return { ok: false, used: total, limit };
    tx.set(
      ref,
      {
        dateKey: key,
        senderEmail: senderEmail || "global",
        [field]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true, used: total + 1, limit };
  });

  return result;
}

async function releaseDailySlot(kind: "initial" | "followup", senderEmail?: string) {
  const key = todayKey();
  const id = senderEmail ? `${key}_${emailDocId(normalizeEmail(senderEmail))}` : key;
  const ref = adminDb.collection("daily_sending_stats").doc(id);
  const field = kind === "followup" ? "followupSent" : "initialSent";

  // Keep quota counters from going negative if a retry/error path calls release twice.
  await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const current = Math.max(0, Number(data[field] || 0));
    tx.set(
      ref,
      {
        dateKey: key,
        senderEmail: senderEmail || "global",
        [field]: Math.max(0, current - 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

async function writeCronStatus(cronName: string, payload: Record<string, any>) {
  /**
   * MINIMAL CRON MONITORING
   * বাংলা ব্যাখ্যা: Free limit বাঁচাতে প্রতি run-এ নতুন document বানানো হচ্ছে না।
   * একই system_status/cron document update হয়, তাই dashboard/health endpoint থেকে শেষ অবস্থা দেখা যায়।
   */
  try {
    await adminDb.collection("system_status").doc("cron").set(
      {
        [cronName]: {
          ...payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Cron status update failed:", error);
  }
}

type CronLock = {
  acquired: boolean;
  ref: FirestoreDocRef;
  runId: string;
  lockedBy?: string;
  lockedAt?: string;
};

async function acquireCronLock(lockName: string, maxAgeMinutes = 20): Promise<CronLock> {
  const ref = adminDb.collection("system_locks").doc(`cron_${lockName}`);
  const runId = randomUUID();
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.fromMillis(nowMs);

  return await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const lockedAtMs = toMillis(data.lockedAt);
    const isActive = Boolean(data.runId) && lockedAtMs && nowMs - lockedAtMs < maxAgeMinutes * 60_000;

    if (isActive) {
      return {
        acquired: false,
        ref,
        runId,
        lockedBy: data.runId || "unknown",
        lockedAt: new Date(lockedAtMs).toISOString(),
      };
    }

    tx.set(
      ref,
      {
        runId,
        lockName,
        lockedAt: nowTs,
        expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + maxAgeMinutes * 60_000),
        updatedAt: nowTs,
      },
      { merge: true }
    );

    return { acquired: true, ref, runId };
  });
}

async function releaseCronLock(lock: CronLock) {
  if (!lock?.acquired) return;

  await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(lock.ref);
    const data = snap.exists ? snap.data() || {} : {};
    if (data.runId === lock.runId) {
      tx.delete(lock.ref);
    }
  });
}

/** POST /api/trackflow/send-email */
async function handleSendInitial(req: Request) {
  await requireAdmin(req);
  const rawBody = await readJson(req);
  return await sendInitialFromBody(rawBody);
}

async function sendInitialFromBody(rawBody: any) {
  const parsedBody = SendInitialBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    const issues = parsedBody.error.issues.map((issue: any) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
    throw new ApiError(`Invalid send-email request: ${issues}`, 400);
  }
  const body = { ...rawBody, ...parsedBody.data };

  // Cloudflare Turnstile removed. Firebase admin auth now protects this internal agency API.

  const emailLower = normalizeEmail(body.email);
  if (!isValidEmail(emailLower)) throw new ApiError("Invalid target email", 400);

  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (!subject) throw new ApiError("Subject is required", 400);
  if (!plainTextFromHtml(message)) throw new ApiError("Message body cannot be empty", 400);

  const includeSignature = body.includeSignature !== false;
  const rawReportUrl = String(body.reportUrl || "").trim();
  const reportUrl = rawReportUrl ? sanitizePublicReportUrl(rawReportUrl) : "";
  if (rawReportUrl && !reportUrl) {
    throw new ApiError("Invalid or unsafe report URL. Use the secure TrackFlow /r/{token} report URL, not localhost or a direct PDF/Drive URL.", 400);
  }
  const reportButtonText = String(body.reportButtonText || "View short audit note").trim().slice(0, 80);
  const source = String(body.source || "").trim();
  const requiresReviewedReport = source === "google_sheet_queue" || source === "sheet_queue";

  if (requiresReviewedReport) {
    const reportToken = normalizeReportToken(body.reportToken || body.report_token || "");
    const pdfFileId = String(body.pdfFileId || body.pdf_file_id || "").trim();
    const pdfViewUrl = sanitizeOptionalUrl(body.pdfViewUrl || body.pdf_view_url || "");
    const pdfDownloadUrl = sanitizeOptionalUrl(body.pdfDownloadUrl || body.pdf_download_url || "");

    const blockers: string[] = [];
    if (!reportUrl) blockers.push("secure TrackFlow /r report URL is missing");
    if (!reportToken) blockers.push("report token is missing");
    if (!pdfFileId) blockers.push("PDF file ID is missing");
    if (!pdfViewUrl && !pdfDownloadUrl) blockers.push("PDF view/download URL is missing");

    if (blockers.length) {
      throw new ApiError(`Sheet queue send blocked before email: ${blockers.join("; ")}`, 400);
    }
  }

  const sender = getSenderFromBody(body);
  const selectedService = SERVICES.has(body.selectedService || body.service) ? body.selectedService || body.service : body.selectedService || body.service || "Google Ads";
  if (!SERVICES.has(selectedService)) throw new ApiError("Invalid service", 400);

  const suppressed = await isSuppressed(emailLower);
  if (suppressed) {
    return json({ success: false, error: `Email is suppressed: ${suppressed.reason || "blocked"}` }, 409);
  }

  const allowDuplicateSend = body.allowDuplicateSend === true;
  const allowCooldownOverride = body.allowCooldownOverride === true;
  const duplicateSnap = await adminDb
    .collection("outreach_leads")
    .where("emailLower", "==", emailLower)
    .limit(5)
    .get();

  if (!duplicateSnap.empty) {
    const existing = duplicateSnap.docs
      .map((item: any) => ({ id: item.id, ...(item.data() || {}) }))
      .find((item: any) => !["failed", "cancelled", "blocked_daily_limit"].includes(String(item.status || "")));

    if (existing) {
      const protectedDuplicate =
        PROTECTED_STATUSES.has(String((existing as any).status || "")) ||
        (existing as any).stopAutomation === true ||
        ["replied", "bounced", "spam", "unsubscribed", "not_interested"].includes(String((existing as any).status || ""));

      if (protectedDuplicate || !allowDuplicateSend) {
        return json(
          {
            success: false,
            error: protectedDuplicate
              ? `Duplicate blocked: existing lead is ${(existing as any).status || "protected"}`
              : "Duplicate email already exists in outreach leads.",
            duplicateLeadId: (existing as any).id,
            duplicateStatus: (existing as any).status || "unknown",
          },
          409,
        );
      }
    }
  }

  const contactMemoryWarning = await getActiveContactMemoryWarning(emailLower);
  if (contactMemoryWarning && !allowCooldownOverride) {
    return json(
      {
        success: false,
        warningOnly: true,
        code: "cooldown_active",
        allowOverride: true,
        error: `This email was contacted before. Cooldown is active until ${contactMemoryWarning.cooldownUntil || "a future date"}.`,
        contactMemory: contactMemoryWarning,
      },
      409,
    );
  }

  const trackingId = String(body.trackingId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const tag = `${trackingId}_step1`;
  const customMessageId = `<${Date.now()}.${trackingId}@mail.trackflowpro.com>`;
  const scheduledAt = timestampFromAny(body.scheduledAt);
  const nowMs = Date.now();
  const isFutureSchedule = scheduledAt && scheduledAt.toMillis() > nowMs + 30_000;

  const leadRef = adminDb.collection("outreach_leads").doc();
  const baseLead = {
    name: String(body.clientName || body.name || "").trim(),
    company_name: String(body.companyName || body.company_name || "").trim(),
    website: String(body.website || "").trim(),
    business_type: String(body.businessType || body.business_type || "").trim(),
    service: selectedService,
    email: String(body.email || "").trim(),
    emailLower,
    sender_email: sender.email,
    sender_name: sender.name,
    sender_id: sender.id || "",
    reply_to_email: sender.replyToEmail || DEFAULT_REPLY_TO_EMAIL,
    reply_to_name: sender.replyToName || sender.name || DEFAULT_REPLY_TO_NAME,
    sender_daily_limit: sender.dailyLimit || DEFAULT_DAILY_LIMIT,
    include_signature: includeSignature,
    signatureMode: normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full"),
    reportUrl,
    reportButtonText,
    reportToken: normalizeReportToken(body.reportToken || body.report_token || ""),
    pdfFileId: String(body.pdfFileId || body.pdf_file_id || "").trim(),
    pdfViewUrl: sanitizeOptionalUrl(body.pdfViewUrl || body.pdf_view_url || ""),
    pdfDownloadUrl: sanitizeOptionalUrl(body.pdfDownloadUrl || body.pdf_download_url || ""),
    pdfExpiresAt: body.pdfExpiresAt || body.pdf_expires_at || null,
    sheetRowNumber: Number(body.sheetRowNumber || 0) || null,
    sheetWebsiteUrl: String(body.sheetWebsiteUrl || body.websiteUrl || "").trim(),
    sheetFinalEmail: String(body.sheetFinalEmail || body.email || "").trim(),
    source: source || "dashboard",
    cooldownOverride: allowCooldownOverride === true,
    cooldownOverrideAt: allowCooldownOverride === true ? admin.firestore.FieldValue.serverTimestamp() : null,
    subject,
    message: stripDangerousHtml(message),
    trackingId,
    customMessageId,
    originalMessageId: "",
    status: isFutureSchedule ? "scheduled" : "processing_initial",
    stopAutomation: false,
    open_count: 0,
    click_count: 0,
    follow_up_count: 0,
    scheduledAt: scheduledAt || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    tracking_history: [],
    sent_messages: [],
    nextFollowupStatus: "waiting_for_first_open_or_click",
    nextFollowupReason: "initial_not_sent_yet",
    retryCount: 0,
  };

  await leadRef.set(baseLead);

  if (isFutureSchedule) {
    return json({
      success: true,
      scheduled: true,
      leadId: leadRef.id,
      trackingId,
      message: "Initial email saved in Firestore schedule. Cron will send it when due.",
    });
  }

  const quota = await reserveDailySlot(sender.dailyLimit, "initial", sender.email);
  if (!quota.ok) {
    await leadRef.update({ status: "blocked_daily_limit", error: `Sender daily limit reached ${quota.used}/${quota.limit}` });
    return json({ success: false, error: "Sender daily limit reached", quota }, 429);
  }

  let emailActuallySent = false;

  try {
    const personalizedInitialMessage = personalizeTemplate(message, {
      name: baseLead.name,
      company_name: baseLead.company_name,
      website: baseLead.website,
      service: selectedService,
    });

    const data = await sendViaBrevo({
      sender,
      toEmail: emailLower,
      toName: baseLead.name,
      subject,
      htmlContent: buildEmailHtml(personalizedInitialMessage, emailLower, tag, {
        includeSignature,
        reportUrl,
        reportButtonText,
        sender,
        signatureMode: normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full"),
        includeReportLink: true,
      }),
      tag,
      customMessageId,
    });
    emailActuallySent = true;

    const sentAt = admin.firestore.Timestamp.now();
    await leadRef.update({
      status: "sent",
      sentAt,
      lastFollowUp: sentAt,
      lastSentAt: sentAt,
      nextFollowupStatus: "waiting_for_first_open_or_click",
      nextFollowupReason: "initial_sent_waiting_for_engagement",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      retryCount: 0,
      lastFollowupError: admin.firestore.FieldValue.delete(),
      originalMessageId: data.messageId || "",
      brevoMessageId: data.messageId || "",
      sent_messages: admin.firestore.FieldValue.arrayUnion({
        step: 1,
        kind: "initial",
        subject,
        trackingTag: tag,
        messageId: data.messageId || "",
        includeSignature,
        reportUrl,
        sentAt,
      }),
    });

    await addEmailEvent(leadRef.id, "sent", { emailLower, step: 1, trackingTag: tag, messageId: data.messageId || "" });

    return json({ success: true, leadId: leadRef.id, messageId: data.messageId, trackingId });
  } catch (error: any) {
    const message = String(error?.message || error);

    // If Brevo already accepted the email, do NOT release the daily slot.
    // Otherwise the app may send more emails than the configured daily limit.
    if (!emailActuallySent) {
      await releaseDailySlot("initial", sender.email).catch(() => {});
      await leadRef.update({ status: "failed", error: message }).catch(() => {});
    } else {
      await leadRef
        .update({
          status: "processing_initial",
          error: `Email was accepted by Brevo, but Firestore post-send update failed: ${message}`,
          postSendUpdateFailed: true,
          postSendUpdateFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => {});
    }

    throw error;
  }
}

/** DELETE /api/trackflow/send-email?leadId=... */
async function handleCancelInitial(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId") || "";
  const trackingId = url.searchParams.get("trackingId") || "";

  let ref: FirestoreDocRef | null = null;

  if (leadId) {
    ref = adminDb.collection("outreach_leads").doc(leadId);
  } else if (trackingId) {
    const snap = await adminDb.collection("outreach_leads").where("trackingId", "==", trackingId).limit(1).get();
    if (!snap.empty) ref = snap.docs[0].ref;
  }

  if (!ref) throw new ApiError("leadId or trackingId required", 400);

  const doc = await ref.get();
  if (!doc.exists) throw new ApiError("Lead not found", 404);

  const lead = doc.data() || {};
  if (!["scheduled", "processing_initial"].includes(String(lead.status || ""))) {
    throw new ApiError("Only scheduled or processing initial emails can be cancelled safely", 400);
  }

  await ref.update({
    status: "cancelled",
    stopAutomation: true,
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return json({ success: true, message: "Scheduled email cancelled safely" });
}

/** GET /api/trackflow/cron/scheduled-initials */
async function handleCronScheduledInitials(req: Request) {
  requireCronSecret(req);

  const cronLock = await acquireCronLock("scheduled_initials", 10);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Scheduled initials cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("scheduledInitials", {
      success: true,
      locked: true,
      skipped: true,
      reason: "scheduled_initials_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const snap = await adminDb
      .collection("outreach_leads")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(20)
      .get();

    const runId = randomUUID();
    const sent: string[] = [];
    const skipped: any[] = [];

    for (const docSnap of snap.docs) {
      const leadRef = docSnap.ref;

      const locked = await adminDb.runTransaction(async (tx : any) => {
        const fresh = await tx.get(leadRef);
        if (!fresh.exists) return null;
        const lead = fresh.data() as LeadData;
        if (lead.status !== "scheduled" || lead.stopAutomation) return null;
        tx.update(leadRef, {
          status: "processing_initial",
          automationLock: { runId, lockedAt: admin.firestore.Timestamp.now() },
        });
        return { id: fresh.id, ...lead };
      });

      if (!locked) continue;

      const lead = locked as LeadData;
      const emailLower = lead.emailLower || normalizeEmail(lead.email || "");
      const sender = getSenderFromLead(lead);
      const tag = `${lead.trackingId || lead.id}_step1`;
      const customMessageId = `<${Date.now()}.${lead.trackingId || lead.id}@mail.trackflowpro.com>`;
      let emailActuallySent = false;

      try {
        const suppressed = await isSuppressed(emailLower);
        if (suppressed) {
          await leadRef.update({
            status: "blocked_suppressed",
            stopAutomation: true,
            nextFollowupStatus: "blocked",
            nextFollowupReason: `suppressed:${suppressed.reason || "blocked"}`,
            nextFollowupAt: admin.firestore.FieldValue.delete(),
            nextFollowupStep: admin.firestore.FieldValue.delete(),
            error: `Suppressed: ${suppressed.reason || "blocked"}`,
            automationLock: admin.firestore.FieldValue.delete(),
          });
          skipped.push({ email: emailLower, reason: "suppressed" });
          continue;
        }

        const legacySubject = String(lead.subject || "").trim();
        const legacyMessage = String(lead.message || "").trim();
        if (!legacySubject || !plainTextFromHtml(legacyMessage)) {
          await leadRef.update({
            status: "failed",
            stopAutomation: true,
            nextFollowupStatus: "blocked",
            nextFollowupReason: "scheduled_initial_missing_subject_or_message",
            automationLock: admin.firestore.FieldValue.delete(),
            error: "Scheduled initial blocked: subject/message missing. No fallback email was sent.",
          });
          skipped.push({ email: emailLower, reason: "missing_subject_or_message" });
          continue;
        }

        const quota = await reserveDailySlot(sender.dailyLimit, "initial", sender.email);
        if (!quota.ok) {
          await leadRef.update({
            status: "scheduled",
            automationLock: admin.firestore.FieldValue.delete(),
            error: "Sender daily limit reached; will retry on next cron.",
          });
          skipped.push({ email: emailLower, reason: "daily_limit" });
          continue;
        }

        const data = await sendViaBrevo({
          sender,
          toEmail: emailLower,
          toName: lead.name || "",
          subject: legacySubject,
          htmlContent: buildEmailHtml(personalizeTemplate(legacyMessage, lead), emailLower, tag, {
            includeSignature: lead.include_signature !== false,
            reportUrl: lead.reportUrl || lead.report_url || "",
            reportButtonText: lead.reportButtonText || lead.report_button_text || "View short audit note",
            sender,
            signatureMode: normalizeSignatureMode(lead.signatureMode || lead.signature_mode || "full", "full"),
            includeReportLink: true,
          }),
          tag,
          customMessageId,
        });
        emailActuallySent = true;

        const sentAt = admin.firestore.Timestamp.now();
        await leadRef.update({
          status: "sent",
          sentAt,
          lastFollowUp: sentAt,
          lastSentAt: sentAt,
          nextFollowupStatus: "waiting_for_first_open_or_click",
          nextFollowupReason: "initial_sent_waiting_for_engagement",
          nextFollowupAt: admin.firestore.FieldValue.delete(),
          nextFollowupStep: admin.firestore.FieldValue.delete(),
          retryCount: 0,
          lastFollowupError: admin.firestore.FieldValue.delete(),
          originalMessageId: data.messageId || "",
          brevoMessageId: data.messageId || "",
          automationLock: admin.firestore.FieldValue.delete(),
          sent_messages: admin.firestore.FieldValue.arrayUnion({
            step: 1,
            kind: "initial",
            subject: legacySubject,
            trackingTag: tag,
            messageId: data.messageId || "",
            includeSignature: lead.include_signature !== false,
            reportUrl: lead.reportUrl || "",
            sentAt,
          }),
        });

        await addEmailEvent(leadRef.id, "sent", { emailLower, step: 1, trackingTag: tag, messageId: data.messageId || "" });
        sent.push(emailLower);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        const message = String(error?.message || error);

        // Release quota only when the email was not accepted by Brevo.
        // If Brevo accepted it and Firestore update failed, keep the slot used to avoid limit overrun.
        if (!emailActuallySent) {
          await releaseDailySlot("initial", sender.email).catch(() => {});
          await leadRef
            .update({
              status: "scheduled",
              automationLock: admin.firestore.FieldValue.delete(),
              error: message,
            })
            .catch(() => {});
        } else {
          await leadRef
            .update({
              status: "processing_initial",
              automationLock: admin.firestore.FieldValue.delete(),
              error: `Email was accepted by Brevo, but Firestore post-send update failed: ${message}`,
              postSendUpdateFailed: true,
              postSendUpdateFailedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
            .catch(() => {});
        }

        skipped.push({ email: emailLower, reason: emailActuallySent ? "post_send_update_failed" : "send_error" });
      }
    }

    return json({ success: true, found: snap.size, sentCount: sent.length, sent, skipped });
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Scheduled initials cron lock release failed:", error));
  }
}


/** GET /api/trackflow/cron/followups */

type NextFollowupSchedule = {
  ok: boolean;
  blockers: string[];
  nextFollowupAt?: any;
  nextFollowupAtMs?: number;
  nextFollowupStep?: number;
  configStepKey?: string;
  delayMinutes?: number;
  reason?: string;
};

function getServiceId(value: any): string {
  const service = String(value || "").trim();
  return SERVICES.has(service) ? service : "Email Signature";
}

function getFollowupStepConfig(configData: any, service: string, nextFollowupNumber: number) {
  const configStepKey = `step${nextFollowupNumber}`;
  const stepConfig = configData?.[service]?.[configStepKey];
  return { configStepKey, stepConfig };
}

function hasSafeFollowupVariant(stepConfig: any): boolean {
  const variants = Array.isArray(stepConfig?.variants) ? stepConfig.variants : [];
  return variants.some((variant: any) => validateFollowupContent(variant?.content || "").ok);
}

function buildNextFollowupSchedule(
  lead: LeadData,
  configData: any,
  engagementMs: number,
  reason = "engagement_webhook"
): NextFollowupSchedule {
  const blockers: string[] = [];
  const emailLower = lead.emailLower || normalizeEmail(lead.email || "");

  if (!isValidEmail(emailLower)) blockers.push("invalid_email");
  if (lead.stopAutomation === true) blockers.push("automation_stopped");

  const status = String(lead.status || "").toLowerCase();
  if (HARD_STOP_STATUSES.has(status)) blockers.push(`hard_stop_status:${status}`);

  const followUpCount = Number(lead.follow_up_count || 0);
  if (!Number.isFinite(followUpCount) || followUpCount < 0) blockers.push("invalid_follow_up_count");
  if (followUpCount >= 5) blockers.push("max_followups_reached");

  const lastSentMs = toMillis(lead.lastFollowUp || lead.lastSentAt || lead.sentAt || lead.createdAt);
  if (!lastSentMs) blockers.push("missing_last_sent_time");
  if (lastSentMs && engagementMs <= lastSentMs) blockers.push("engagement_not_newer_than_last_send");

  const nextFollowupNumber = Math.max(0, followUpCount) + 1;
  const service = getServiceId(lead.service);
  const { configStepKey, stepConfig } = getFollowupStepConfig(configData, service, nextFollowupNumber);
  if (!stepConfig) blockers.push("missing_step_config");
  if (stepConfig && !hasSafeFollowupVariant(stepConfig)) blockers.push("no_safe_variant_for_step");

  const delayMinutesRaw = Number(lead[`${configStepKey}Delay`] || stepConfig?.delay || 1440);
  const delayMinutes = Number.isFinite(delayMinutesRaw) && delayMinutesRaw > 0 ? delayMinutesRaw : 1440;

  const scheduledMsRaw = scheduleBeforeEngagementTime(engagementMs, delayMinutes);
  const scheduledMs = Math.max(engagementMs, scheduledMsRaw || 0);
  if (!scheduledMs) blockers.push("schedule_calculation_failed");

  if (blockers.length > 0) {
    return {
      ok: false,
      blockers,
      nextFollowupStep: nextFollowupNumber,
      configStepKey,
      delayMinutes,
      reason,
    };
  }

  return {
    ok: true,
    blockers,
    nextFollowupAt: admin.firestore.Timestamp.fromMillis(scheduledMs),
    nextFollowupAtMs: scheduledMs,
    nextFollowupStep: nextFollowupNumber,
    configStepKey,
    delayMinutes,
    reason,
  };
}

function hasTemplateOrConfigBlocker(blockers: string[]) {
  return blockers.some((blocker) =>
    [
      "missing_step_config",
      "no_variants_configured",
      "all_variants_failed_safety_check",
      "no_safe_variant_for_step",
    ].includes(blocker)
  );
}

function blockedFollowupUpdate(blockers: string[], extra: Record<string, any> = {}) {
  const hardBlocked = blockers.some((blocker) =>
    blocker.startsWith("hard_stop_status") ||
    ["automation_stopped", "max_followups_reached", "invalid_email"].includes(blocker)
  );
  const templateBlocked = hasTemplateOrConfigBlocker(blockers);

  if (templateBlocked && !hardBlocked) {
    return {
      nextFollowupStatus: "template_blocked",
      nextFollowupReason: blockers.join(",") || "template_or_config_blocked",
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      automationLock: admin.firestore.FieldValue.delete(),
      ...extra,
    };
  }

  return {
    nextFollowupStatus: hardBlocked ? "blocked" : "waiting_for_new_engagement",
    nextFollowupReason: blockers.join(",") || "not_scheduled",
    nextFollowupAt: admin.firestore.FieldValue.delete(),
    nextFollowupStep: admin.firestore.FieldValue.delete(),
    lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    automationLock: admin.firestore.FieldValue.delete(),
    ...extra,
  };
}

type FollowupDecision = {
  eligible: boolean;
  blockers: string[];
  reasons: string[];
  emailLower?: string;
  service?: string;
  followUpCount?: number;
  nextFollowupNumber?: number;
  configStepKey?: string;
  trackingStepNumber?: number;
  delayMinutes?: number;
  scheduledMs?: number;
  scheduledAt?: string;
  variantCount?: number;
  validVariants?: any[];
  lastSentMs?: number;
  lastEngagedMs?: number;
};

function evaluateFollowupCandidate(
  lead: LeadData,
  configData: any,
  nowMs: number,
  options: { ignoreLock?: boolean } = {}
): FollowupDecision {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const emailLower = lead.emailLower || normalizeEmail(lead.email || "");

  if (!isValidEmail(emailLower)) blockers.push("invalid_email");
  if (lead.stopAutomation === true) blockers.push("automation_stopped");

  const status = String(lead.status || "").toLowerCase();
  if (HARD_STOP_STATUSES.has(status)) blockers.push(`hard_stop_status:${status}`);
  if (!ACTIVE_STATUSES.has(status)) blockers.push(`inactive_status:${status || "missing"}`);
  if (lead.repliedAt || lead.replyAt || lead.reply_at) blockers.push("reply_detected");

  const existingLock = lead.automationLock;
  const lockMs = toMillis(existingLock?.lockedAt);
  const lockStillActive = Boolean(lockMs && nowMs - lockMs < STALE_LOCK_MINUTES * 60_000);
  if (!options.ignoreLock && lockStillActive) blockers.push("active_automation_lock");

  const followUpCount = Number(lead.follow_up_count || 0);
  if (!Number.isFinite(followUpCount) || followUpCount < 0) blockers.push("invalid_follow_up_count");
  if (followUpCount >= 5) blockers.push("max_followups_reached");

  const nextFollowupNumber = Math.max(0, followUpCount) + 1;
  const configStepKey = `step${nextFollowupNumber}`;
  const trackingStepNumber = nextFollowupNumber + 1;

  const service = SERVICES.has(String(lead.service || "")) ? String(lead.service) : "Email Signature";
  const stepConfig = configData?.[service]?.[configStepKey];
  if (!stepConfig) blockers.push("missing_step_config");

  const variants = Array.isArray(stepConfig?.variants) ? stepConfig.variants : [];
  const validVariants = variants.filter((variant: any) => {
    const safety = validateFollowupContent(variant?.content || "");
    return safety.ok;
  });

  if (variants.length === 0) blockers.push("no_variants_configured");
  if (variants.length > 0 && validVariants.length === 0) blockers.push("all_variants_failed_safety_check");

  const delayMinutesRaw = Number(lead[`${configStepKey}Delay`] || stepConfig?.delay || 1440);
  const delayMinutes = Number.isFinite(delayMinutesRaw) && delayMinutesRaw > 0 ? delayMinutesRaw : 1440;
  const lastSentMs = toMillis(lead.lastFollowUp || lead.lastSentAt || lead.sentAt || lead.createdAt);
  const lastOpenedMs = toMillis(lead.lastOpenedAt || lead.last_opened);
  const lastClickedMs = toMillis(lead.lastClickedAt);
  const lastEngagedMs = Math.max(lastOpenedMs, lastClickedMs);
  const openCount = Number(lead.open_count || 0);
  const clickCount = Number(lead.click_count || 0);
  const hasAnyEngagement = openCount > 0 || clickCount > 0 || lastEngagedMs > 0;

  if (!lastSentMs) blockers.push("missing_last_sent_time");

  const triggerMode = String(configData.followup_trigger_mode || "open_required");

  // Hard safety rule requested for serious cold email:
  // if the lead never opened or clicked, one initial email is enough.
  if (REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP && !hasAnyEngagement) {
    blockers.push("no_open_or_click_no_automatic_followup");
  }

  // For every later follow-up, require a fresh open/click after the previous send.
  // This avoids blindly sending F2-F5 if F1 also did not get engagement.
  if (REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP && followUpCount >= 1 && lastEngagedMs <= lastSentMs) {
    blockers.push("waiting_for_new_open_or_click_after_last_send");
  }

  if (triggerMode === "open_required") {
    if (followUpCount === 0 && !hasAnyEngagement) {
      blockers.push("waiting_for_first_open_or_click");
    }
    if (followUpCount >= 1 && lastEngagedMs <= lastSentMs) {
      blockers.push("waiting_for_new_open_or_click_after_last_send");
    }
  }

  // Preferred timing: if a lead engaged at 10:45 and delay is 2 days,
  // schedule at roughly 09:45 two days later. Cron sends on the next run after this time.
  // nextFollowupAt is the source of truth once the Brevo webhook has scheduled it.
  const storedNextFollowupMs = toMillis(lead.nextFollowupAt);
  const calculatedScheduledMs = lastEngagedMs
    ? scheduleBeforeEngagementTime(lastEngagedMs, delayMinutes)
    : lastSentMs
      ? lastSentMs + delayMinutes * 60_000
      : 0;
  const scheduledMs = storedNextFollowupMs || calculatedScheduledMs;

  if (String(lead.nextFollowupStatus || "").toLowerCase() === "blocked") blockers.push("next_followup_blocked");
  if (String(lead.nextFollowupStatus || "").toLowerCase() === "processing") blockers.push("next_followup_processing");
  if (scheduledMs && nowMs < scheduledMs) blockers.push("delay_not_completed_or_preferred_window_not_reached");

  if (blockers.length === 0) {
    reasons.push("status_is_active");
    reasons.push("automation_not_stopped");
    reasons.push("no_reply_or_hard_stop_detected");
    reasons.push("followup_step_available");
    reasons.push("template_passed_safety_check");
    reasons.push("delay_completed");
    reasons.push("open_or_click_detected");
    reasons.push("scheduled_one_hour_before_last_engagement_time");
    if (triggerMode === "open_required") reasons.push("engagement_requirement_met");
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    reasons,
    emailLower,
    service,
    followUpCount,
    nextFollowupNumber,
    configStepKey,
    trackingStepNumber,
    delayMinutes,
    scheduledMs,
    scheduledAt: scheduledMs ? new Date(scheduledMs).toISOString() : undefined,
    variantCount: validVariants.length,
    validVariants,
    lastSentMs,
    lastEngagedMs,
  };
}

async function releaseStaleAutomationLocks(limit = 300) {
  const nowMs = Date.now();
  const snap = await adminDb
    .collection("outreach_leads")
    .where("status", "in", ["processing_initial", "processing_followup"])
    .limit(Math.max(1, Math.min(limit, 500)))
    .get();

  const released: any[] = [];
  const batch = adminDb.batch();

  for (const docSnap of snap.docs) {
    const lead = docSnap.data() as LeadData;
    const lockMs = toMillis(lead.automationLock?.lockedAt);
    if (!lockMs || nowMs - lockMs < STALE_LOCK_MINUTES * 60_000) continue;

    const previousStatus = String(lead.automationLock?.previousStatus || "").trim();
    const fallbackStatus = lead.status === "processing_initial" ? "scheduled" : "sent";
    const nextStatus = previousStatus && !previousStatus.startsWith("processing_") ? previousStatus : fallbackStatus;

    batch.update(docSnap.ref, {
      status: nextStatus,
      nextFollowupStatus: lead.status === "processing_followup" ? "scheduled" : lead.nextFollowupStatus || admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
      error: `Recovered stale automation lock older than ${STALE_LOCK_MINUTES} minutes`,
      recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    released.push({ leadId: docSnap.id, email: lead.emailLower || lead.email || "", restoredStatus: nextStatus });
  }

  if (released.length > 0) await batch.commit();
  return released;
}

async function handleCronRecoverLocks(req: Request) {
  requireCronSecret(req);
  const released = await releaseStaleAutomationLocks();
  return json({ success: true, releasedCount: released.length, released });
}

async function handleFollowupDryRun(req: Request) {
  await requireAdmin(req);

  const url = new URL(req.url);
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const includeBlocked = url.searchParams.get("includeBlocked") === "true";
  const mode = String(url.searchParams.get("mode") || "due").toLowerCase();

  const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
  if (!configDoc.exists) throw new ApiError("Follow-up config not found", 404);

  const configData = configDoc.data() || {};
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.now();

  const candidatesSnap =
    mode === "legacy"
      ? await adminDb.collection("outreach_leads").where("stopAutomation", "==", false).limit(FOLLOWUP_CANDIDATE_LIMIT).get()
      : await adminDb
          .collection("outreach_leads")
          .where("stopAutomation", "==", false)
          .where("nextFollowupStatus", "==", "scheduled")
          .where("nextFollowupAt", "<=", nowTs)
          .orderBy("nextFollowupAt", "asc")
          .limit(max)
          .get();

  const rows = candidatesSnap.docs
    .map((docSnap: any) => {
      const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
      const decision = evaluateFollowupCandidate(lead, configData, nowMs);
      return {
        leadId: docSnap.id,
        email: decision.emailLower || lead.email || "",
        name: lead.name || "",
        company: lead.company_name || "",
        service: decision.service || lead.service || "",
        status: lead.status || "",
        nextFollowupStatus: lead.nextFollowupStatus || "",
        followUpCount: lead.follow_up_count || 0,
        nextFollowupNumber: decision.nextFollowupNumber,
        scheduledAt: decision.scheduledAt,
        eligible: decision.eligible,
        reasons: decision.reasons,
        blockers: decision.blockers,
      };
    })
    .filter((row: any) => includeBlocked || row.eligible)
    .slice(0, max);

  return json({
    success: true,
    mode,
    checked: candidatesSnap.size,
    returned: rows.length,
    eligibleCount: rows.filter((row: any) => row.eligible).length,
    generatedAt: new Date(nowMs).toISOString(),
    rows,
  });
}
async function getCount(queryRef: FirestoreQueryRef): Promise<number> {
  const aggregateSnap = await queryRef.count().get();
  return Number(aggregateSnap.data().count || 0);
}

async function getStatusCount(status: string): Promise<number> {
  return getCount(adminDb.collection("outreach_leads").where("nextFollowupStatus", "==", status));
}

function getFollowupBatchPerRun(configData: any): number {
  return Math.max(
    1,
    Math.min(Number(configData?.followup_batch_per_run || DEFAULT_FOLLOWUP_BATCH_PER_RUN), MAX_FOLLOWUP_BATCH_PER_RUN)
  );
}

async function getFollowupSentTodayTotal(dateKey = todayKey()): Promise<number> {
  const statsSnap = await adminDb.collection("daily_sending_stats").where("dateKey", "==", dateKey).get();
  return statsSnap.docs.reduce((total: number, docSnap: any) => total + Number((docSnap.data() || {}).followupSent || 0), 0);
}

async function handleFollowupSummary(req: Request) {
  await requireAdmin(req);

  const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
  const configData = configDoc.exists ? configDoc.data() || {} : {};
  const dailyLimit = Math.max(1, Math.min(Number(configData.daily_followup_limit || 50), 500));
  const batchPerRun = getFollowupBatchPerRun(configData);
  const nowTs = admin.firestore.Timestamp.now();
  const key = todayKey();

  const dueQuery = adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", "<=", nowTs);

  const scheduledQuery = adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", ">", nowTs);

  const [dueNow, scheduled, waitingFirstOpen, waitingNewEngagement, templateBlocked, failedFinal, blocked, statsSnap] = await Promise.all([
    getCount(dueQuery),
    getCount(scheduledQuery),
    getStatusCount("waiting_for_first_open_or_click"),
    getStatusCount("waiting_for_new_engagement"),
    getStatusCount("template_blocked"),
    getStatusCount("failed_final"),
    getStatusCount("blocked"),
    adminDb.collection("daily_sending_stats").where("dateKey", "==", key).get(),
  ]);

  const sentToday = statsSnap.docs.reduce((total: number, docSnap: any) => total + Number((docSnap.data() || {}).followupSent || 0), 0);
  const remainingToday = Math.max(0, dailyLimit - sentToday);
  const maxThisRun = Math.min(batchPerRun, remainingToday);
  const failedRetry = dueNow > 0 ? 0 : 0;

  return json({
    success: true,
    generatedAt: new Date().toISOString(),
    dateKey: key,
    dailyLimit,
    batchPerRun,
    remainingToday,
    maxThisRun,
    sentToday,
    dueNow,
    scheduled,
    waitingFirstOpen,
    waitingNewEngagement,
    templateBlocked,
    failedRetry,
    failedFinal,
    blocked,
  });
}

/** GET /api/trackflow/cron/followups */
async function handleCronFollowups(req: Request) {
  requireCronSecret(req);

  const cronLock = await acquireCronLock("followups", 20);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Follow-up cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("followups", {
      success: true,
      locked: true,
      skipped: true,
      reason: "followups_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
  const recoveredLocks = await releaseStaleAutomationLocks(200).catch(() => []);

  const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
  if (!configDoc.exists) throw new ApiError("Follow-up config not found", 404);

  const configData = configDoc.data() || {};
  const globalDailyLimit = Math.max(1, Math.min(Number(configData.daily_followup_limit || 50), 500));
  const batchPerRun = getFollowupBatchPerRun(configData);
  const sentTodayBeforeRun = await getFollowupSentTodayTotal();
  const remainingDailyBeforeRun = Math.max(0, globalDailyLimit - sentTodayBeforeRun);
  const runSendLimit = Math.min(batchPerRun, remainingDailyBeforeRun);
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.now();
  const runId = randomUUID();
  const url = new URL(req.url);
  const includeLegacyBackfill = url.searchParams.get("legacy") !== "false";

  if (runSendLimit <= 0) {
    return json({
      success: true,
      message: "Daily follow-up limit reached. Due leads remain scheduled for the next cron/day.",
      recoveredLocks,
      checked: 0,
      dueChecked: 0,
      legacyChecked: 0,
      sentCount: 0,
      sent: [],
      skipped: [],
      dailyLimit: globalDailyLimit,
      batchPerRun,
      sentTodayBeforeRun,
      remainingDailyBeforeRun,
      runSendLimit,
    });
  }

  // Primary scheduler: read only leads whose nextFollowupAt is already due.
  // This keeps reads low and avoids missing the 1-hour-before preferred window.
  const dueSnap = await adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", "<=", nowTs)
    .orderBy("nextFollowupAt", "asc")
    .limit(NEXT_FOLLOWUP_QUERY_LIMIT)
    .get();

  const candidateDocs: FirestoreQueryDocSnap[] = [...dueSnap.docs];
  const seenIds = new Set(candidateDocs.map((docSnap) => docSnap.id));

  // Compatibility safety net for leads created before nextFollowupAt existed.
  // Keep it small. Once all active leads receive a new open/click or you run a backfill, this can be disabled with ?legacy=false.
  let legacyChecked = 0;
  if (includeLegacyBackfill && candidateDocs.length < 50) {
    const legacySnap = await adminDb
      .collection("outreach_leads")
      .where("stopAutomation", "==", false)
      .limit(Math.min(FOLLOWUP_CANDIDATE_LIMIT, 150))
      .get();

    legacyChecked = legacySnap.size;

    for (const docSnap of legacySnap.docs) {
      if (seenIds.has(docSnap.id)) continue;
      const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
      if (lead.nextFollowupAt && String(lead.nextFollowupStatus || "") === "scheduled") continue;

      const decision = evaluateFollowupCandidate(lead, configData, nowMs);
      if (!decision.eligible) continue;

      // Schedule it first so future cron runs use the indexed due-query path.
      await docSnap.ref.set(
        {
          nextFollowupAt: admin.firestore.Timestamp.fromMillis(decision.scheduledMs || nowMs),
          nextFollowupStep: decision.nextFollowupNumber || Number(lead.follow_up_count || 0) + 1,
          nextFollowupStatus: "scheduled",
          nextFollowupReason: "legacy_backfill_from_cron",
          lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      candidateDocs.push(docSnap);
      seenIds.add(docSnap.id);
      if (candidateDocs.length >= NEXT_FOLLOWUP_QUERY_LIMIT) break;
    }
  }

  const sent: string[] = [];
  const skipped: any[] = [];

  for (const docSnap of candidateDocs) {
    if (sent.length >= runSendLimit) break;

    const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
    const decision = evaluateFollowupCandidate(lead, configData, nowMs);

    if (!decision.eligible) {
      await docSnap.ref.set(blockedFollowupUpdate(decision.blockers), { merge: true }).catch(() => {});
      skipped.push({ email: decision.emailLower || lead.email || "", reason: decision.blockers.join(",") });
      continue;
    }

    const emailLower = decision.emailLower || "";
    const suppressed = await isSuppressed(emailLower);
    if (suppressed) {
      await docSnap.ref.update({
        status: "blocked_suppressed",
        stopAutomation: true,
        nextFollowupStatus: "blocked",
        nextFollowupReason: `suppressed:${suppressed.reason || "blocked"}`,
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        error: `Suppressed: ${suppressed.reason || "blocked"}`,
        automationLock: admin.firestore.FieldValue.delete(),
      });
      skipped.push({ email: emailLower, reason: "suppressed" });
      continue;
    }

    const sender = getSenderFromLead(lead);
    const effectiveLimit = Math.min(globalDailyLimit, sender.dailyLimit || globalDailyLimit);
    const quota = await reserveDailySlot(effectiveLimit, "followup", sender.email);
    if (!quota.ok) {
      skipped.push({
        email: emailLower,
        reason: "sender_followup_limit_reached",
        quota,
      });
      continue;
    }

    const lockResult = await adminDb.runTransaction(async (tx: any) => {
      const fresh = await tx.get(docSnap.ref);
      if (!fresh.exists) return { ok: false, reason: "lead_missing" };

      const freshLead = { id: docSnap.id, ...fresh.data() } as LeadData;
      const freshDecision = evaluateFollowupCandidate(freshLead, configData, Date.now());
      if (!freshDecision.eligible) return { ok: false, reason: freshDecision.blockers.join(",") };

      tx.update(docSnap.ref, {
        status: "processing_followup",
        nextFollowupStatus: "processing",
        lastFollowupEvaluatedAt: nowTs,
        automationLock: {
          runId,
          lockedAt: nowTs,
          step: freshDecision.nextFollowupNumber,
          previousStatus: freshLead.status || "sent",
          previousNextFollowupStatus: freshLead.nextFollowupStatus || "scheduled",
          eligibilityReasons: freshDecision.reasons,
          scheduledAt: freshDecision.scheduledAt || null,
        },
      });

      return { ok: true, lead: freshLead, decision: freshDecision };
    });

    if (!lockResult.ok) {
      await releaseDailySlot("followup", sender.email).catch(() => {});
      skipped.push({ email: emailLower, reason: lockResult.reason || "lock_failed" });
      continue;
    }

    const lockedLead = lockResult.lead as LeadData;
    const lockedDecision = lockResult.decision as FollowupDecision;
    let emailActuallySent = false;

    try {
      const variants = lockedDecision.validVariants || [];
      const assignedVariantId = lockedLead[`${lockedDecision.configStepKey}AssignedVariant`];
      const selectedVariant =
        variants.find((v: any) => v.id === assignedVariantId) ||
        variants[deterministicVariantIndex(`${lockedLead.id}-${lockedDecision.configStepKey}`, variants.length)];

      if (!selectedVariant?.content) throw new ApiError("No safe follow-up variant available", 400);

      const tag = `${lockedLead.trackingId || lockedLead.id}_step${lockedDecision.trackingStepNumber}`;
      const subject = `Re: ${lockedLead.subject || "Our Discussion"}`;
      const customMessageId = `<${Date.now()}.${lockedLead.trackingId || lockedLead.id}.${lockedDecision.configStepKey}@mail.trackflowpro.com>`;
      const htmlContent = buildEmailHtml(personalizeTemplate(selectedVariant.content, lockedLead), emailLower, tag, {
        includeSignature: lockedLead.include_signature !== false,
        reportUrl: "",
        reportButtonText: "",
        sender,
        signatureMode: "compact",
        includeReportLink: false,
      });

      const data = await sendViaBrevo({
        sender,
        toEmail: emailLower,
        toName: lockedLead.name || "",
        subject,
        htmlContent,
        tag,
        customMessageId,
      });
      emailActuallySent = true;

      const sentAt = admin.firestore.Timestamp.now();
      const nextFollowupNumber = Number(lockedDecision.nextFollowupNumber || 0);
      await docSnap.ref.update({
        status: nextFollowupNumber >= 5 ? "finished" : "sent",
        follow_up_count: nextFollowupNumber,
        lastFollowUp: sentAt,
        lastSentAt: sentAt,
        nextFollowupStatus: nextFollowupNumber >= 5 ? "finished" : "waiting_for_new_engagement",
        nextFollowupReason: nextFollowupNumber >= 5 ? "max_followups_sent" : "followup_sent_waiting_for_new_open_or_click",
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        retryCount: 0,
        lastFollowupError: admin.firestore.FieldValue.delete(),
        automationLock: admin.firestore.FieldValue.delete(),
        lastAutomationDecision: {
          runId,
          type: "followup_sent",
          reasons: lockedDecision.reasons,
          sentAt,
          nextFollowupNumber,
          configStepKey: lockedDecision.configStepKey,
        },
        sent_messages: admin.firestore.FieldValue.arrayUnion({
          step: lockedDecision.trackingStepNumber,
          followupNumber: nextFollowupNumber,
          configStepKey: lockedDecision.configStepKey,
          subject,
          trackingTag: tag,
          variantId: selectedVariant.id || "",
          messageId: data.messageId || "",
          eligibilityReasons: lockedDecision.reasons,
          sentAt,
        }),
      });

      await addEmailEvent(docSnap.id, "followup_sent", {
        emailLower,
        followupNumber: nextFollowupNumber,
        step: lockedDecision.trackingStepNumber,
        trackingTag: tag,
        messageId: data.messageId || "",
        eligibilityReasons: lockedDecision.reasons,
      });

      sent.push(emailLower);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      const message = String(error?.message || error);

      // Release quota only when the email was not accepted by Brevo.
      // If Brevo accepted it and Firestore update failed, keep the daily count used.
      if (!emailActuallySent) {
        await releaseDailySlot("followup", sender.email).catch(() => {});
      }

      const retryCount = Number(lockedLead.retryCount || 0) + 1;
      const canRetry = !emailActuallySent && retryCount < MAX_FOLLOWUP_RETRIES;
      await docSnap.ref.update({
        status: emailActuallySent
          ? "processing_followup"
          : String(lockedLead.status || "sent").startsWith("processing_")
            ? "sent"
            : lockedLead.status || "sent",
        nextFollowupStatus: emailActuallySent ? "processing" : canRetry ? "scheduled" : "failed_final",
        nextFollowupReason: emailActuallySent
          ? "post_send_update_failed_manual_review_needed"
          : canRetry
            ? "send_error_retry_scheduled"
            : "send_error_retry_limit_reached",
        nextFollowupAt: canRetry
          ? admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60_000)
          : admin.firestore.FieldValue.delete(),
        retryCount,
        lastFollowupError: message,
        automationLock: admin.firestore.FieldValue.delete(),
        error: emailActuallySent ? `Email was accepted by Brevo, but Firestore post-send update failed: ${message}` : message,
        postSendUpdateFailed: emailActuallySent || admin.firestore.FieldValue.delete(),
        postSendUpdateFailedAt: emailActuallySent ? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.delete(),
      });
      skipped.push({
        email: emailLower,
        reason: emailActuallySent ? "post_send_update_failed" : "send_error",
        retryCount,
        error: message,
      });
    }
  }

  return json({
    success: true,
    recoveredLocks,
    checked: candidateDocs.length,
    dueChecked: dueSnap.size,
    legacyChecked,
    dailyLimit: globalDailyLimit,
    batchPerRun,
    sentTodayBeforeRun,
    remainingDailyBeforeRun,
    runSendLimit,
    remainingDailyAfterRun: Math.max(0, remainingDailyBeforeRun - sent.length),
    sentCount: sent.length,
    sent,
    skipped,
  });
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Follow-up cron lock release failed:", error));
  }
}

/** POST /api/trackflow/webhooks/brevo */
async function applyNextFollowupScheduleFromEngagement(
  updatePayload: any,
  leadData: LeadData,
  eventTime: any,
  reason: "opened" | "clicked"
) {
  try {
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) {
      Object.assign(updatePayload, {
        nextFollowupStatus: "waiting_for_new_engagement",
        nextFollowupReason: "followup_config_missing",
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const effectiveLead = {
      ...leadData,
      status: updatePayload.status || leadData.status,
      lastEngagedAt: eventTime,
    } as LeadData;

    const schedule = buildNextFollowupSchedule(effectiveLead, configDoc.data() || {}, eventTime.toMillis(), reason);

    if (schedule.ok) {
      Object.assign(updatePayload, {
        nextFollowupAt: schedule.nextFollowupAt,
        nextFollowupStep: schedule.nextFollowupStep,
        nextFollowupStatus: "scheduled",
        nextFollowupReason: reason,
        nextFollowupDelayMinutes: schedule.delayMinutes || null,
        nextFollowupConfigStepKey: schedule.configStepKey || null,
        lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        retryCount: 0,
        lastFollowupError: admin.firestore.FieldValue.delete(),
      });
    } else {
      Object.assign(updatePayload, blockedFollowupUpdate(schedule.blockers, { nextFollowupReason: `${reason}:${schedule.blockers.join(",")}` }));
    }
  } catch (error: any) {
    Object.assign(updatePayload, {
      nextFollowupStatus: "waiting_for_new_engagement",
      nextFollowupReason: `schedule_error:${String(error?.message || error)}`,
      lastFollowupError: String(error?.message || error),
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function handleBrevoWebhook(req: Request) {
  requireWebhookSecret(req, "BREVO_WEBHOOK_SECRET");
  const body = await readJson(req);

  const event = String(body.event || "");
  const emailLower = normalizeEmail(body.email || "");
  const rawMessageId = String(body["message-id"] || body.messageId || "").replace(/[<>]/g, "");
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const receivedTag = tags.length > 0 ? String(tags[0]) : "";
  const timestamp = Number(body.ts_event || Math.floor(Date.now() / 1000));
  const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

  const outreachRef = adminDb.collection("outreach_leads");
  let leadDoc: FirestoreQueryDocSnap | null = null;

  if (receivedTag) {
    const originalTrackingId = receivedTag.split("_step")[0];
    const tagSnapshot = await outreachRef.where("trackingId", "==", originalTrackingId).limit(1).get();
    if (!tagSnapshot.empty) leadDoc = tagSnapshot.docs[0];
  }

  if (!leadDoc && rawMessageId) {
    const idSnapshot = await outreachRef.where("originalMessageId", "==", rawMessageId).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  if (!leadDoc && rawMessageId) {
    const idSnapshot = await outreachRef.where("brevoMessageId", "==", rawMessageId).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  if (!leadDoc) return json({ message: "Lead not found in database" }, 404);

  const leadData = leadDoc.data() as LeadData;
  const dbEmailLower = leadData.emailLower || normalizeEmail(leadData.email || "");
  if (dbEmailLower && emailLower && dbEmailLower !== emailLower) {
    return json({ message: "Lead identity mismatch" }, 403);
  }

  const docRef = outreachRef.doc(leadDoc.id);
  const updatePayload: any = {};
  const trackingEntryBase = {
    time: eventTime,
    step_tag: receivedTag || "unknown",
  };

  if (event === "request" || event === "delivered") {
    if (!PROTECTED_STATUSES.has(String(leadData.status || ""))) {
      updatePayload.status = "sent";
    }

    if (!leadData.sentAt && (!receivedTag || receivedTag.endsWith("_step1"))) {
      updatePayload.sentAt = eventTime;
    }

    updatePayload.lastSentAt = eventTime;
    updatePayload.followUpReady = false;

    if (receivedTag.includes("_step")) {
      const stepNumber = parseInt(receivedTag.split("_step")[1], 10);
      if (Number.isFinite(stepNumber)) {
        const targetFollowupCount = Math.max(0, stepNumber - 1);
        if (targetFollowupCount > Number(leadData.follow_up_count || 0)) {
          updatePayload.follow_up_count = targetFollowupCount;
        }
      }
    }
  }

  if (event === "hard_bounce" || event === "soft_bounce") {
    updatePayload.status = "bounced";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "bounced";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.bouncedAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "bounced", { source: "brevo_webhook", event });
  }

  if (event === "spam") {
    updatePayload.status = "spam";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "spam";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.spamAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "spam", { source: "brevo_webhook", event });
  }

  if (event === "unsubscribed") {
    updatePayload.status = "unsubscribed";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "unsubscribed";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.unsubscribedAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "unsubscribed", { source: "brevo_webhook", event });
  }

  if (event === "opened") {
    const lastOpened = toMillis(leadData.lastOpenedAt);
    const currentRequestTime = eventTime.toMillis();

    if (currentRequestTime - lastOpened > 20_000) {
      if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
        updatePayload.status = "opened";
      }

      const engagementMinuteUtc = getEngagementMinuteOfDayUtc(eventTime.toMillis());
      updatePayload.open_count = admin.firestore.FieldValue.increment(1);
      updatePayload.lastOpenedAt = eventTime;
      updatePayload.lastEngagedAt = eventTime;
      updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
      updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
      updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
      updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
      await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "opened");
      updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
        event: "opened",
        ...trackingEntryBase,
        ip: body.ip || "unknown",
        device: body["user-agent"] || "unknown",
      });
    }
  }

  if (event === "click") {
    if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
      updatePayload.status = "clicked";
    }

    const engagementMinuteUtc = getEngagementMinuteOfDayUtc(eventTime.toMillis());
    updatePayload.click_count = admin.firestore.FieldValue.increment(1);
    updatePayload.lastClickedAt = eventTime;
    updatePayload.lastEngagedAt = eventTime;
    updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
    updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
    updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
    updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
    await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "clicked");
    updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
      event: "clicked",
      ...trackingEntryBase,
      link: body.url || "unknown link",
    });
  }

  if (Object.keys(updatePayload).length > 0) {
    await docRef.update(updatePayload);
  }

  const sheetRowNumber = Number(leadData.sheetRowNumber || 0);
  if (sheetRowNumber > 1 && ["opened", "click", "hard_bounce", "soft_bounce", "spam", "unsubscribed", "delivered"].includes(event)) {
    const sheetUpdates: AnyRecord = {};
    if (event === "opened") {
      sheetUpdates.openCount = String(Number(leadData.open_count || 0) + 1);
    }
    if (event === "click") {
      sheetUpdates.clickCount = String(Number(leadData.click_count || 0) + 1);
    }
    if (event === "delivered") sheetUpdates.sendStatus = "Sent";
    if (event === "hard_bounce" || event === "soft_bounce") {
      sheetUpdates.sendStatus = "Bounced";
      sheetUpdates.replyStatus = "Bounced";
    }
    if (event === "spam") {
      sheetUpdates.sendStatus = "Spam";
      sheetUpdates.replyStatus = "Spam";
    }
    if (event === "unsubscribed") {
      sheetUpdates.sendStatus = "Unsubscribed";
      sheetUpdates.replyStatus = "Unsubscribed";
    }
    if (Object.keys(sheetUpdates).length) await patchSheetRowSafely(sheetRowNumber, sheetUpdates);
  }

  await addEmailEvent(leadDoc.id, event || "unknown", {
    emailLower: dbEmailLower || emailLower,
    trackingTag: receivedTag || "",
    rawMessageId: rawMessageId || "",
    url: body.url || "",
    ip: body.ip || "",
    userAgent: body["user-agent"] || "",
    eventTime,
  });

  return json({ message: "Webhook processed" });
}

/** POST /api/trackflow/webhooks/reply */
async function handleReplyWebhook(req: Request) {
  requireWebhookSecret(req, "REPLY_WEBHOOK_SECRET");
  const body = await readJson(req);
  const clientEmail = normalizeEmail(body.email || body.sender || body.from || "");

  if (!isValidEmail(clientEmail)) throw new ApiError("No valid email provided", 400);

  const snapshot = await adminDb.collection("outreach_leads").where("emailLower", "==", clientEmail).get();

  if (snapshot.empty) {
    const legacySnapshot = await adminDb.collection("outreach_leads").where("email", "==", clientEmail).get();
    if (legacySnapshot.empty) return json({ success: false, message: "Lead not found" });
    await markRepliesBatch(legacySnapshot.docs, clientEmail);
  } else {
    await markRepliesBatch(snapshot.docs, clientEmail);
  }

  await addSuppression(clientEmail, "replied", { source: "reply_webhook" });

  return json({ success: true, message: `Automation stopped for ${clientEmail}` });
}

async function markRepliesBatch(docs: FirestoreQueryDocSnap[], clientEmail: string) {
  const batch = adminDb.batch();

  docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      emailLower: clientEmail,
      status: "replied",
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "reply_detected",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
    });
  });

  await batch.commit();

  await Promise.all(
    docs.map((docSnap) =>
      addEmailEvent(docSnap.id, "replied", {
        emailLower: clientEmail,
        source: "reply_webhook",
      })
    )
  );
}

/** GET /api/trackflow/unsubscribe?email=...&token=... */
async function handleUnsubscribeGet(req: Request) {
  const url = new URL(req.url);
  const emailLower = normalizeEmail(url.searchParams.get("email") || "");
  const token = String(url.searchParams.get("token") || "");

  if (!isValidEmail(emailLower)) {
    return htmlResponse("<h2>Invalid unsubscribe request.</h2>", 400);
  }

  const expected = unsubscribeToken(emailLower);
  if (!safeEqual(token, expected)) {
    return htmlResponse("<h2>Invalid or expired unsubscribe link.</h2>", 403);
  }

  await unsubscribeEmail(emailLower, "unsubscribe_link");

  return htmlResponse(`
    <html>
      <body style="font-family:Arial,sans-serif;max-width:640px;margin:80px auto;padding:24px;line-height:1.6;color:#111;">
        <h1>You have been unsubscribed.</h1>
        <p>${emailLower} will no longer receive outreach or follow-up emails from TrackFlowPro.</p>
        <p style="color:#777;font-size:13px;">If this was a mistake, contact us at shahjalal@trackflowpro.com.</p>
      </body>
    </html>
  `);
}

/** POST /api/trackflow/unsubscribe */
async function handleUnsubscribePost(req: Request) {
  const body = await readJson(req);
  const emailLower = normalizeEmail(body.email || "");
  const token = String(body.token || "");

  if (!isValidEmail(emailLower)) throw new ApiError("Invalid email", 400);
  if (!safeEqual(token, unsubscribeToken(emailLower))) throw new ApiError("Invalid unsubscribe token", 403);

  await unsubscribeEmail(emailLower, "unsubscribe_post");
  return json({ success: true });
}

async function unsubscribeEmail(emailLower: string, source: string) {
  await addSuppression(emailLower, "unsubscribed", { source });

  const snap = await adminDb.collection("outreach_leads").where("emailLower", "==", emailLower).get();
  const batch = adminDb.batch();

  snap.docs.forEach((docSnap: any) => {
    batch.update(docSnap.ref, {
      status: "unsubscribed",
      stopAutomation: true,
      unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextFollowupStatus: "blocked",
      nextFollowupReason: "unsubscribed",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
    });
  });

  if (!snap.empty) await batch.commit();

  await Promise.all(
    snap.docs.map((docSnap: any) =>
      addEmailEvent(docSnap.id, "unsubscribed", {
        emailLower,
        source,
      })
    )
  );
}


// ============================================================
// Google Sheet Lead Staging Bridge (via /api/trackflow/sheets/leads)
// ============================================================
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

/**
 * TrackFlowPro Sheet Bridge API
 *
 * Purpose:
 * 1) POST  : Python/audit dashboard can add/update only verified hot leads.
 * 2) GET   : Email automation dashboard can read Sheet leads.
 * 3) PATCH : Email automation/tracking can update status back to Sheet.
 *
 * Important:
 * - This route is intentionally non-destructive. When a website already exists,
 *   audit/contact fields are refreshed, but send/tracking/manual status fields
 *   are preserved unless the incoming payload explicitly provides them.
 * - Website URL is the primary dedupe key. Final Email is a fallback key.
 */

const HEADERS = [
  'Export Date',
  'Business Name',
  'Website URL',
  'Final Email',
  'Email Source',
  'Social Platform',
  'Social Link',
  'WhatsApp',
  'ChatGPT Prompt',

  // Lead qualification / audit summary
  'Lead Status',
  'Approval Status',
  'Send Status',
  'Service Type',
  'Audit Score',
  'Lead Label',
  'Main Issue',
  'Proof Points',
  'Report Token',
  'Report URL',
  'PDF File ID',
  'PDF View URL',
  'PDF Download URL',
  'PDF Expires At',
  'Report Page Viewed',
  'PDF Downloaded',
  'CTA Clicked',
  'Last Report Viewed At',
  'Last PDF Downloaded At',
  'Last CTA Clicked At',
  'Email Subject',
  'Email Body',
  'Decision Maker',
  'Decision Maker Title',
  'Contact Quality',

  // Email automation / Firestore sync
  'Tracking ID',
  'Firestore Lead ID',
  'Open Count',
  'Click Count',
  'Reply Status',
  'Last Synced',
  'Archive Status',
  'Notes',
  'Sender ID',
  'Attempt Count',

  // Sheet queue locking / idempotency
  // বাংলা ব্যাখ্যা: Cron একসাথে চললেও একই row যেন দুইবার send না হয়, তাই Sheet-এর মধ্যেই lock রাখা হয়।
  'Queue Lock ID',
  'Queue Locked At',
  'Queue Attempt ID',
] as const;

type HeaderName = (typeof HEADERS)[number];
type AnyRecord = Record<string, any>;

type BestSocial = {
  platform: string;
  url: string;
};

const MAX_CELL_CHARS = 45000;

const CONTROL_HEADERS = new Set<HeaderName>([
  'Approval Status',
  'Send Status',
  'Tracking ID',
  'Firestore Lead ID',
  'Open Count',
  'Click Count',
  'Report Page Viewed',
  'PDF Downloaded',
  'CTA Clicked',
  'Last Report Viewed At',
  'Last PDF Downloaded At',
  'Last CTA Clicked At',
  'Reply Status',
  'Archive Status',
  'Notes',
  'Sender ID',
  'Attempt Count',
  'Queue Lock ID',
  'Queue Locked At',
  'Queue Attempt ID',
]);

const UPDATE_KEY_MAP: Record<string, HeaderName> = {
  exportDate: 'Export Date',
  businessName: 'Business Name',
  companyName: 'Business Name',
  websiteUrl: 'Website URL',
  website: 'Website URL',
  finalEmail: 'Final Email',
  email: 'Final Email',
  emailSource: 'Email Source',
  socialPlatform: 'Social Platform',
  socialLink: 'Social Link',
  whatsapp: 'WhatsApp',
  chatgptPrompt: 'ChatGPT Prompt',
  leadStatus: 'Lead Status',
  approvalStatus: 'Approval Status',
  approved: 'Approval Status',
  sendStatus: 'Send Status',
  serviceType: 'Service Type',
  service: 'Service Type',
  auditScore: 'Audit Score',
  leadLabel: 'Lead Label',
  mainIssue: 'Main Issue',
  proofPoints: 'Proof Points',
  reportToken: 'Report Token',
  report_token: 'Report Token',
  pdfFileId: 'PDF File ID',
  pdf_file_id: 'PDF File ID',
  pdfViewUrl: 'PDF View URL',
  pdf_view_url: 'PDF View URL',
  pdfDownloadUrl: 'PDF Download URL',
  pdf_download_url: 'PDF Download URL',
  pdfExpiresAt: 'PDF Expires At',
  pdf_expires_at: 'PDF Expires At',
  reportPageViewed: 'Report Page Viewed',
  report_page_viewed: 'Report Page Viewed',
  pdfDownloaded: 'PDF Downloaded',
  pdf_downloaded: 'PDF Downloaded',
  ctaClicked: 'CTA Clicked',
  cta_clicked: 'CTA Clicked',
  lastReportViewedAt: 'Last Report Viewed At',
  last_report_viewed_at: 'Last Report Viewed At',
  lastPdfDownloadedAt: 'Last PDF Downloaded At',
  last_pdf_downloaded_at: 'Last PDF Downloaded At',
  lastCtaClickedAt: 'Last CTA Clicked At',
  last_cta_clicked_at: 'Last CTA Clicked At',
  reportUrl: 'Report URL',
  reportURL: 'Report URL',
  emailSubject: 'Email Subject',
  subject: 'Email Subject',
  emailBody: 'Email Body',
  message: 'Email Body',
  decisionMaker: 'Decision Maker',
  decisionMakerTitle: 'Decision Maker Title',
  contactQuality: 'Contact Quality',
  trackingId: 'Tracking ID',
  firestoreLeadId: 'Firestore Lead ID',
  leadId: 'Firestore Lead ID',
  openCount: 'Open Count',
  clickCount: 'Click Count',
  replyStatus: 'Reply Status',
  lastSynced: 'Last Synced',
  archiveStatus: 'Archive Status',
  notes: 'Notes',
  senderId: 'Sender ID',
  senderID: 'Sender ID',
  sender_id: 'Sender ID',
  attemptCount: 'Attempt Count',
  attempts: 'Attempt Count',
  queueLockId: 'Queue Lock ID',
  queueLockedAt: 'Queue Locked At',
  queueAttemptId: 'Queue Attempt ID',
};

const COLUMN_WIDTHS: Partial<Record<HeaderName, number>> = {
  'Export Date': 130,
  'Business Name': 210,
  'Website URL': 260,
  'Final Email': 240,
  'Email Source': 170,
  'Social Platform': 135,
  'Social Link': 250,
  WhatsApp: 185,
  'ChatGPT Prompt': 380,
  'Lead Status': 135,
  'Approval Status': 145,
  'Send Status': 125,
  'Service Type': 160,
  'Audit Score': 110,
  'Lead Label': 130,
  'Main Issue': 300,
  'Proof Points': 360,
  'Report Token': 180,
  'Report URL': 280,
  'PDF File ID': 210,
  'PDF View URL': 280,
  'PDF Download URL': 280,
  'PDF Expires At': 150,
  'Report Page Viewed': 145,
  'PDF Downloaded': 135,
  'CTA Clicked': 125,
  'Last Report Viewed At': 175,
  'Last PDF Downloaded At': 185,
  'Last CTA Clicked At': 175,
  'Email Subject': 260,
  'Email Body': 420,
  'Decision Maker': 190,
  'Decision Maker Title': 190,
  'Contact Quality': 145,
  'Tracking ID': 210,
  'Firestore Lead ID': 210,
  'Open Count': 110,
  'Click Count': 110,
  'Reply Status': 135,
  'Last Synced': 170,
  'Archive Status': 135,
  Notes: 280,
  'Queue Lock ID': 190,
  'Queue Locked At': 190,
  'Queue Attempt ID': 190,
};

function clean(value: any, fallback = ''): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => clean(item)).join(', ');
  return String(value).trim();
}

function cleanCell(value: any, fallback = ''): string {
  const text = clean(value, fallback).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!text) return fallback;
  return text.length > MAX_CELL_CHARS ? `${text.slice(0, MAX_CELL_CHARS - 20)}\n...[trimmed]` : text;
}

function isValidValue(value: any): boolean {
  const text = clean(value).toLowerCase();
  return Boolean(
    text &&
      text !== 'not found' &&
      text !== 'n/a' &&
      text !== 'na' &&
      text !== 'none' &&
      text !== 'unknown' &&
      text !== 'পাওয়া যায়নি',
  );
}

function firstValid(items?: any[]): string {
  if (!Array.isArray(items)) return '';
  const found = items.find((item) => isValidValue(item));
  return clean(found, '');
}

function firstValidValue(...items: any[]): string {
  for (const item of items) {
    if (isValidValue(item)) return clean(item);
  }
  return '';
}

function normalizeUrlForSheet(value: any): string {
  const raw = clean(value, '');
  if (!raw) return '';

  let url = raw;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    const cleanPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.protocol}//${parsed.hostname.replace(/^www\./i, '').toLowerCase()}${cleanPath}`;
  } catch {
    return raw.replace(/\/$/, '').toLowerCase();
  }
}

// Sheet code uses the top-level normalizeEmail(email: string) helper defined earlier.

function normalizeServiceType(value: any): string {
  const text = clean(value).toLowerCase();

  if (text.includes('signature')) return 'Email Signature';
  if (
    text.includes('server') ||
    text.includes('sst') ||
    text.includes('server-side') ||
    text.includes('server side')
  ) {
    return 'Server Side Tracking';
  }

  if (
    text.includes('google') ||
    text.includes('ads') ||
    text.includes('ga4') ||
    text.includes('conversion') ||
    text.includes('tracking')
  ) {
    return 'Google Ads';
  }

  return 'Google Ads';
}

function nowDhaka(): string {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function todayDhaka(): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function columnLetter(indexOneBased: number): string {
  let index = indexOneBased;
  let letter = '';
  while (index > 0) {
    const mod = (index - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    index = Math.floor((index - mod) / 26);
  }
  return letter;
}

function lastColumnLetter(): string {
  return columnLetter(HEADERS.length);
}

function getManualUpdate(audit?: AnyRecord, lead?: AnyRecord): AnyRecord {
  return (
    audit?.manual_decision_maker_update ||
    audit?.manual_contact_update ||
    audit?.manual_update ||
    lead?.manual_decision_maker_update ||
    lead?.manualContact ||
    lead?.manual_contact_update ||
    {}
  );
}

function getBusinessName(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.business_name ||
      manual?.company_name ||
      audit?.company_name ||
      audit?.business_name ||
      audit?.email_intelligence?.company_name ||
      audit?.nextjs_payload?.lead?.['Company Name'] ||
      lead?.businessName ||
      lead?.companyName ||
      lead?.title ||
      audit?.domain,
    'N/A',
  );
}

function getWebsiteUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(lead?.websiteUrl || lead?.website || lead?.link || audit?.homepage_url || audit?.domain, 'N/A');
}

function getMainProblem(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.mainIssue ||
      audit?.dashboard_verdict?.main_opportunity ||
      audit?.top_opportunity?.problem ||
      audit?.client_dashboard_message?.headline ||
      audit?.client_dashboard_message?.problem_summary ||
      audit?.email_intelligence?.problem_title ||
      audit?.conversion_qa?.summary,
    'a website tracking or lead measurement item may be worth checking',
  );
}

function getProofPoints(audit?: AnyRecord, lead?: AnyRecord): string[] {
  const proofPoints =
    lead?.proofPoints ||
    audit?.proof_points ||
    audit?.top_opportunity?.proof_points ||
    audit?.client_dashboard_message?.proof_points ||
    audit?.email_intelligence?.evidence_points ||
    audit?.advanced_tracking?.issues ||
    [];

  if (Array.isArray(proofPoints)) {
    return proofPoints.filter(isValidValue).map((item) => clean(item)).slice(0, 5);
  }

  const text = clean(proofPoints);
  return text ? [text] : [];
}

function getFinalEmail(audit?: AnyRecord, lead?: AnyRecord): { email: string; source: string } {
  const manual = getManualUpdate(audit, lead);

  // 1) Manual email always wins because you verified/edited it before export.
  const manualEmail = clean(
    manual?.email ||
      manual?.verified_email ||
      manual?.web_email ||
      lead?.manualEmail ||
      lead?.finalEmail ||
      lead?.email,
  );

  if (isValidValue(manualEmail)) {
    return { email: manualEmail, source: clean(lead?.emailSource || 'Manual / verified by user') };
  }

  // 2) Public website/person email. Do not use guessed email by default.
  const personEmail = clean(audit?.person1?.web_email);
  if (isValidValue(personEmail)) {
    return { email: personEmail, source: 'Person / website email' };
  }

  const websiteEmail = firstValid(audit?.contact?.web_emails);
  if (websiteEmail) {
    return { email: websiteEmail, source: 'Website email' };
  }

  return { email: '', source: 'No reliable email found' };
}

function getBestSocial(audit?: AnyRecord, lead?: AnyRecord): BestSocial {
  const manual = getManualUpdate(audit, lead);
  const social = audit?.social_links || {};

  const candidates: BestSocial[] = [
    { platform: 'LinkedIn', url: manual?.linkedin || manual?.personal_linkedin || audit?.person1?.linkedin || social?.linkedin || lead?.linkedin },
    { platform: 'Facebook', url: manual?.facebook || social?.facebook || lead?.facebook },
    { platform: 'Instagram', url: manual?.instagram || social?.instagram || lead?.instagram },
    { platform: 'Twitter/X', url: manual?.twitter_x || manual?.twitter || social?.twitter_x || social?.twitter || lead?.twitter_x || lead?.twitter },
    { platform: 'YouTube', url: manual?.youtube || social?.youtube || lead?.youtube },
    { platform: 'TikTok', url: manual?.tiktok || social?.tiktok || lead?.tiktok },
    { platform: 'Pinterest', url: manual?.pinterest || social?.pinterest || lead?.pinterest },
  ];

  const best = candidates.find((item) => isValidValue(item.url));
  if (best) return { platform: best.platform, url: clean(best.url) };

  const fallback = Object.entries(social).find(([, value]) => isValidValue(value));
  if (fallback) return { platform: clean(fallback[0], 'Social'), url: clean(fallback[1]) };

  return { platform: '', url: '' };
}

function getWhatsApp(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(manual?.whatsapp || lead?.whatsapp || firstValid(audit?.contact?.whatsapp), '');
}

function getAuditScore(audit?: AnyRecord, lead?: AnyRecord): string {
  const score =
    lead?.auditScore ??
    audit?.opportunity_score?.overall_score ??
    audit?.lead_score?.score ??
    audit?.advanced_tracking?.confidence_score ??
    audit?.visitor_potential?.score ??
    '';

  return cleanCell(score);
}

function getLeadLabel(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.leadLabel ||
      audit?.opportunity_score?.label ||
      audit?.lead_score?.label ||
      audit?.dashboard_verdict?.label ||
      audit?.email_intelligence?.priority ||
      '',
  );
}

function getLeadStatus(audit?: AnyRecord, lead?: AnyRecord, existing?: AnyRecord): string {
  const explicit = firstValidValue(lead?.leadStatus, lead?.status, existing?.['Lead Status']);
  if (explicit) return explicit;

  const label = getLeadLabel(audit, lead).toLowerCase();
  if (label.includes('hot')) return 'Hot Lead';
  if (label.includes('good') || label.includes('warm')) return 'Good Lead';
  if (label.includes('low')) return 'Low Priority';

  return 'New';
}

function getServiceType(audit?: AnyRecord, lead?: AnyRecord): string {
  return normalizeServiceType(
    lead?.serviceType ||
      lead?.service ||
      audit?.outreach_playbook?.service_offer ||
      audit?.client_dashboard_message?.service_angle ||
      audit?.email_intelligence?.main_angle ||
      audit?.top_opportunity?.outreach_angle ||
      getMainProblem(audit, lead),
  );
}

function getReportUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  const candidates = [
    manual?.report_url,
    manual?.reportUrl,
    lead?.reportUrl,
    lead?.report_url,
    audit?.report_url,
    audit?.reportUrl,
    audit?.exports?.report_url,
    audit?.exports?.reportUrl,
    audit?.nextjs_payload?.report_url,
    audit?.nextjs_payload?.reportUrl,
  ];
  for (const candidate of candidates) {
    const safe = sanitizePublicReportUrl(candidate);
    if (safe) return cleanCell(safe);
  }
  return '';
}

function getReportToken(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.report_token ||
      manual?.reportToken ||
      lead?.reportToken ||
      lead?.report_token ||
      audit?.report_token ||
      audit?.reportToken ||
      audit?.exports?.report_token ||
      audit?.exports?.reportToken ||
      '',
  );
}

function getPdfFileId(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.pdf_file_id ||
      manual?.pdfFileId ||
      lead?.pdfFileId ||
      lead?.pdf_file_id ||
      audit?.pdf_file_id ||
      audit?.pdfFileId ||
      audit?.exports?.pdf_file_id ||
      audit?.exports?.pdfFileId ||
      '',
  );
}

function getPdfViewUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    sanitizeOptionalUrl(
      manual?.pdf_view_url ||
        manual?.pdfViewUrl ||
        lead?.pdfViewUrl ||
        lead?.pdf_view_url ||
        audit?.pdf_view_url ||
        audit?.pdfViewUrl ||
        audit?.exports?.pdf_view_url ||
        audit?.exports?.pdfViewUrl ||
        '',
    ),
  );
}

function getPdfDownloadUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    sanitizeOptionalUrl(
      manual?.pdf_download_url ||
        manual?.pdfDownloadUrl ||
        lead?.pdfDownloadUrl ||
        lead?.pdf_download_url ||
        audit?.pdf_download_url ||
        audit?.pdfDownloadUrl ||
        audit?.exports?.pdf_download_url ||
        audit?.exports?.pdfDownloadUrl ||
        '',
    ),
  );
}

function getPdfExpiresAt(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.pdf_expires_at ||
      manual?.pdfExpiresAt ||
      lead?.pdfExpiresAt ||
      lead?.pdf_expires_at ||
      audit?.pdf_expires_at ||
      audit?.pdfExpiresAt ||
      audit?.exports?.pdf_expires_at ||
      audit?.exports?.pdfExpiresAt ||
      '',
  );
}

function getEmailSubject(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_subject ||
      lead?.emailSubject ||
      lead?.subject ||
      audit?.outreach_email_brief?.subject ||
      audit?.nextjs_payload?.email_brief?.subject ||
      audit?.email_draft?.subject ||
      audit?.outreach_playbook?.first_email_subjects?.[0] ||
      '',
  );
}

function getEmailBody(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_body ||
      lead?.emailBody ||
      lead?.message ||
      audit?.outreach_email_brief?.ready_email ||
      audit?.outreach_email_brief?.copy_ready_email ||
      audit?.nextjs_payload?.email_brief?.ready_email ||
      audit?.nextjs_payload?.email_brief?.copy_ready_email ||
      audit?.outreach_playbook?.first_email ||
      audit?.email_draft?.body ||
      '',
  );
}

function buildFallbackChatGptPrompt(audit?: AnyRecord, lead?: AnyRecord): string {
  const businessName = getBusinessName(audit, lead);
  const websiteUrl = getWebsiteUrl(audit, lead);
  const problem = getMainProblem(audit, lead);
  const proofPoints = getProofPoints(audit, lead);
  const finalEmail = getFinalEmail(audit, lead);
  const social = getBestSocial(audit, lead);
  const whatsapp = getWhatsApp(audit, lead);

  return [
    'Write a short, natural English cold outreach email based only on the website audit evidence below.',
    '',
    `Business name: ${businessName}`,
    `Website URL: ${websiteUrl}`,
    `Main issue/opportunity: ${problem}`,
    `Email/contact found: ${finalEmail.email || 'No reliable email found'}`,
    social.url ? `Best social profile: ${social.platform} - ${social.url}` : '',
    whatsapp ? `WhatsApp: ${whatsapp}` : '',
    proofPoints.length ? `Proof points: ${proofPoints.join(' | ')}` : '',
    '',
    'Rules:',
    '- Write 3 email versions under 120 words each.',
    '- Give 2 subject line options.',
    '- Sound human, calm, and helpful.',
    '- Do not mention AI, automation, scraper, audit tool, or bot.',
    '- Do not say the website is broken.',
    '- Do not claim Google Ads/GA4 account-level conversion recording without access.',
    '- Use cautious phrases like “I noticed”, “may be worth checking”, and “could be harder to measure”.',
    '- End with a soft question, not a hard sales pitch.',
  ]
    .filter(Boolean)
    .join('\n');
}

function getChatGptPrompt(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  const prompt =
    manual?.chatgpt_prompt ||
    lead?.chatgptPrompt ||
    lead?.chatgpt_prompt ||
    lead?.chatgptEmailPrompt ||
    audit?.outreach_email_brief?.chatgpt_email_prompt ||
    audit?.nextjs_payload?.email_brief?.chatgpt_email_prompt ||
    audit?.email_brief?.chatgpt_email_prompt ||
    audit?.outreach_playbook?.chatgpt_prompt ||
    '';

  return cleanCell(prompt || buildFallbackChatGptPrompt(audit, lead));
}

function getDecisionMaker(audit?: AnyRecord, lead?: AnyRecord): { name: string; title: string } {
  const manual = getManualUpdate(audit, lead);

  const safeName =
    audit?.decision_maker_safety?.selected_name ||
    audit?.nextjs_payload?.decision_maker_safety?.selected_name ||
    '';

  const safeTitle =
    audit?.decision_maker_safety?.selected_title ||
    audit?.nextjs_payload?.decision_maker_safety?.selected_title ||
    '';

  return {
    name: cleanCell(
      manual?.name ||
        manual?.decision_maker_name ||
        lead?.decisionMaker ||
        lead?.founder ||
        safeName ||
        audit?.person1?.name ||
        audit?.decision_makers?.best_match?.name ||
        '',
    ),
    title: cleanCell(
      manual?.title ||
        manual?.decision_maker_title ||
        lead?.decisionMakerTitle ||
        lead?.personTitle ||
        safeTitle ||
        audit?.person1?.title ||
        audit?.decision_makers?.best_match?.title ||
        '',
    ),
  };
}

function getContactQuality(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.contactQuality ||
      audit?.contact_quality?.level ||
      audit?.contact_quality?.best_contact_method ||
      '',
  );
}

function getExistingOrDefault(
  existing: AnyRecord | undefined,
  header: HeaderName,
  fallback: string,
  incoming?: any,
): string {
  if (incoming !== undefined && incoming !== null && clean(incoming) !== '') return cleanCell(incoming);
  const oldValue = existing?.[header];
  if (oldValue !== undefined && oldValue !== null && clean(oldValue) !== '') return cleanCell(oldValue);
  return fallback;
}

function buildLeadObject(lead: AnyRecord, existing?: AnyRecord): Record<HeaderName, string> {
  const audit = lead?.audit || {};
  const finalEmail = getFinalEmail(audit, lead);
  const social = getBestSocial(audit, lead);
  const decisionMaker = getDecisionMaker(audit, lead);

  const generated: Record<HeaderName, string> = {
    'Export Date': todayDhaka(),
    'Business Name': getBusinessName(audit, lead),
    'Website URL': getWebsiteUrl(audit, lead),
    'Final Email': cleanCell(finalEmail.email),
    'Email Source': cleanCell(finalEmail.source),
    'Social Platform': cleanCell(social.platform),
    'Social Link': cleanCell(social.url),
    WhatsApp: getWhatsApp(audit, lead),
    'ChatGPT Prompt': getChatGptPrompt(audit, lead),

    'Lead Status': getLeadStatus(audit, lead, existing),
    'Approval Status': getExistingOrDefault(existing, 'Approval Status', 'System Qualified', lead?.approvalStatus),
    'Send Status': getExistingOrDefault(existing, 'Send Status', 'Not Sent', lead?.sendStatus),
    'Service Type': getServiceType(audit, lead),
    'Audit Score': getAuditScore(audit, lead),
    'Lead Label': getLeadLabel(audit, lead),
    'Main Issue': getMainProblem(audit, lead),
    'Proof Points': cleanCell(getProofPoints(audit, lead).join(' | ')),
    'Report Token': getReportToken(audit, lead),
    'Report URL': getReportUrl(audit, lead),
    'PDF File ID': getPdfFileId(audit, lead),
    'PDF View URL': getPdfViewUrl(audit, lead),
    'PDF Download URL': getPdfDownloadUrl(audit, lead),
    'PDF Expires At': getPdfExpiresAt(audit, lead),
    'Report Page Viewed': getExistingOrDefault(existing, 'Report Page Viewed', 'No', lead?.reportPageViewed),
    'PDF Downloaded': getExistingOrDefault(existing, 'PDF Downloaded', 'No', lead?.pdfDownloaded),
    'CTA Clicked': getExistingOrDefault(existing, 'CTA Clicked', 'No', lead?.ctaClicked),
    'Last Report Viewed At': getExistingOrDefault(existing, 'Last Report Viewed At', '', lead?.lastReportViewedAt),
    'Last PDF Downloaded At': getExistingOrDefault(existing, 'Last PDF Downloaded At', '', lead?.lastPdfDownloadedAt),
    'Last CTA Clicked At': getExistingOrDefault(existing, 'Last CTA Clicked At', '', lead?.lastCtaClickedAt),
    'Email Subject': getEmailSubject(audit, lead),
    'Email Body': getEmailBody(audit, lead),
    'Decision Maker': decisionMaker.name,
    'Decision Maker Title': decisionMaker.title,
    'Contact Quality': getContactQuality(audit, lead),

    'Tracking ID': getExistingOrDefault(existing, 'Tracking ID', '', lead?.trackingId),
    'Firestore Lead ID': getExistingOrDefault(existing, 'Firestore Lead ID', '', lead?.firestoreLeadId || lead?.leadId),
    'Open Count': getExistingOrDefault(existing, 'Open Count', '0', lead?.openCount),
    'Click Count': getExistingOrDefault(existing, 'Click Count', '0', lead?.clickCount),
    'Reply Status': getExistingOrDefault(existing, 'Reply Status', 'No Reply', lead?.replyStatus),
    'Last Synced': nowDhaka(),
    'Archive Status': getExistingOrDefault(existing, 'Archive Status', 'Active', lead?.archiveStatus),
    Notes: getExistingOrDefault(existing, 'Notes', '', lead?.notes),
    'Sender ID': getExistingOrDefault(existing, 'Sender ID', '', lead?.senderId || lead?.sender_id),
    'Attempt Count': getExistingOrDefault(existing, 'Attempt Count', '0', lead?.attemptCount || lead?.attempts),
    'Queue Lock ID': getExistingOrDefault(existing, 'Queue Lock ID', '', lead?.queueLockId),
    'Queue Locked At': getExistingOrDefault(existing, 'Queue Locked At', '', lead?.queueLockedAt),
    'Queue Attempt ID': getExistingOrDefault(existing, 'Queue Attempt ID', '', lead?.queueAttemptId),
  };

  // Preserve control fields if the incoming lead did not explicitly send them.
  if (existing) {
    for (const header of CONTROL_HEADERS) {
      const camel = Object.entries(UPDATE_KEY_MAP).find(([, mapped]) => mapped === header)?.[0];
      const hasIncoming =
        lead?.[header] !== undefined ||
        (camel && lead?.[camel] !== undefined) ||
        (header === 'Firestore Lead ID' && lead?.leadId !== undefined);

      if (!hasIncoming && isValidValue(existing[header])) {
        generated[header] = cleanCell(existing[header]);
      }
    }
  }

  generated['Last Synced'] = nowDhaka();

  return generated;
}

function rowToObject(row: any[] = [], rowNumber?: number): AnyRecord {
  const record: AnyRecord = {};
  HEADERS.forEach((header, index) => {
    record[header] = clean(row[index], '');
  });
  if (rowNumber) record.rowNumber = rowNumber;
  return record;
}

function normalizeSheetRowForDashboard(row: AnyRecord): AnyRecord {
  const next = { ...row };
  if (!clean(next['Lead Status'])) next['Lead Status'] = clean(next['Lead Label']) || 'Maybe Check';
  if (!clean(next['Approval Status'])) next['Approval Status'] = 'System Qualified';
  if (!clean(next['Send Status'])) next['Send Status'] = 'Not Sent';
  if (!clean(next['Archive Status'])) next['Archive Status'] = 'Active';
  if (!clean(next['Reply Status'])) next['Reply Status'] = 'No Reply';
  if (!clean(next['Open Count'])) next['Open Count'] = '0';
  if (!clean(next['Click Count'])) next['Click Count'] = '0';
  return next;
}

function rowObjectToArray(row: AnyRecord): string[] {
  return HEADERS.map((header) => cleanCell(row[header], ''));
}

const SHEET_PROCESSING_LOCK_MAX_AGE_MINUTES = 30;

function sheetLockTimestamp(): string {
  // ISO timestamp is used because it can be parsed reliably by cron in any timezone.
  return new Date().toISOString();
}

function sheetLockAgeMs(value: any): number {
  const text = clean(value);
  if (!text) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Date.now() - parsed;
}

function isSheetProcessingLockStale(row: AnyRecord): boolean {
  return sheetLockAgeMs(row['Queue Locked At']) > SHEET_PROCESSING_LOCK_MAX_AGE_MINUTES * 60_000;
}

function isRetryableDailyLimitError(error: any): boolean {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("daily limit") || message.includes("limit reached") || message.includes("blocked_daily_limit");
}

async function updateSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number, rowObj: AnyRecord) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowObjectToArray({ ...rowObj, 'Last Synced': nowDhaka() })] },
  });
}

async function readSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number): Promise<AnyRecord> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
  });
  const row = response.data.values?.[0] || [];
  return rowToObject(row, rowNumber);
}

function getLeadUrlKey(lead: AnyRecord): string {
  const audit = lead?.audit || {};
  return normalizeUrlForSheet(lead?.websiteUrl || lead?.website || lead?.link || audit?.homepage_url || audit?.domain);
}

function normalizeUpdateObject(input: AnyRecord): AnyRecord {
  const output: AnyRecord = {};
  const blocked = new Set(['rowNumber', 'websiteUrl', 'website', 'finalEmail', 'email', 'updates', 'items']);

  for (const [rawKey, rawValue] of Object.entries(input || {})) {
    if (blocked.has(rawKey)) continue;
    if (rawValue === undefined) continue;

    const mapped = (HEADERS as readonly string[]).includes(rawKey) ? rawKey : UPDATE_KEY_MAP[rawKey];

    if (mapped) {
      output[mapped] = cleanCell(rawValue);
    }
  }

  return output;
}

async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID is missing.');
  if (!clientEmail) throw new Error('GOOGLE_CLIENT_EMAIL is missing.');
  if (!privateKey) throw new Error('GOOGLE_PRIVATE_KEY is missing.');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId,
  };
}

async function requireSheetAccess(req: Request) {
  const expected = process.env.SHEET_API_SECRET || "";
  const received = req.headers.get("x-sheet-secret") || "";

  // Local audit/bridge tools should send x-sheet-secret in a header, not in the URL.
  if (expected && received && safeEqual(received, expected)) {
    return { uid: "sheet-secret", email: "sheet-bridge@local" };
  }

  // Dashboard/browser requests should use Firebase ID token, same as the other TrackFlow APIs.
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return await requireAdmin(req);
  }

  throw new ApiError("Unauthorized sheet request: missing Firebase ID token or valid x-sheet-secret header", 401);
}

async function ensureHeaderRow(sheets: any, spreadsheetId: string) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${lastColumnLetter()}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
}

async function loadRows(sheets: any, spreadsheetId: string): Promise<any[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:${lastColumnLetter()}`,
  });

  const values = response?.data?.values;
  return Array.isArray(values) ? (values as any[][]) : [];
}

function buildIndexes(rows: any[][]) {
  const urlToRowNumber = new Map<string, number>();
  const emailToRowNumber = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const obj = rowToObject(row, rowNumber);

    const urlKey = normalizeUrlForSheet(obj['Website URL']);
    if (urlKey) urlToRowNumber.set(urlKey, rowNumber);

    const emailKey = normalizeEmail(obj['Final Email']);
    if (emailKey) emailToRowNumber.set(emailKey, rowNumber);
  });

  return { urlToRowNumber, emailToRowNumber };
}

async function applySheetFormatting(sheets: any, spreadsheetId: string) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = sheetMeta.data.sheets?.find((item: any) => item.properties?.title === SHEET_NAME);

  const sheetId = sheet?.properties?.sheetId;
  const rowCount = sheet?.properties?.gridProperties?.rowCount || 1000;

  if (sheetId === undefined || sheetId === null) return;

  const widthRequests = HEADERS.map((header, index) => ({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 },
      properties: { pixelSize: COLUMN_WIDTHS[header] || 160 },
      fields: 'pixelSize',
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: Math.max(rowCount, 2),
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
            },
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: HEADERS.length,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.08, green: 0.1, blue: 0.18 } },
                backgroundColor: { red: 0.9, green: 0.92, blue: 0.96 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'CLIP',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              endRowIndex: Math.max(rowCount, 2),
              startColumnIndex: 0,
              endColumnIndex: HEADERS.length,
            },
            cell: {
              userEnteredFormat: {
                verticalAlignment: 'MIDDLE',
                horizontalAlignment: 'LEFT',
                wrapStrategy: 'CLIP',
              },
            },
            fields: 'userEnteredFormat(verticalAlignment,horizontalAlignment,wrapStrategy)',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 42 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: Math.max(rowCount, 2) },
            properties: { pixelSize: 34 },
            fields: 'pixelSize',
          },
        },
        ...widthRequests,
      ],
    },
  });
}

/**
 * GET /api/sheets/leads
 *
 * Query examples:
 * - ?approvalStatus=Approved
 * - ?sendStatus=Not%20Sent
 * - ?hasEmail=true
 * - ?includeArchived=true
 * - ?limit=100
 */
async function handleSheetLeadsGet(req: Request) {
  try {
    await requireSheetAccess(req);

    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const leads = rows.map((row: any[], index: number) => normalizeSheetRowForDashboard(rowToObject(row, index + 2)));

    const url = new URL(req.url);
    const approvalStatus = clean(url.searchParams.get('approvalStatus'));
    const sendStatus = clean(url.searchParams.get('sendStatus'));
    const leadStatus = clean(url.searchParams.get('leadStatus'));
    const archiveStatus = clean(url.searchParams.get('archiveStatus'));
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const hasEmail = url.searchParams.get('hasEmail') === 'true';
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const max = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 500;

    let filtered = leads.filter((lead: AnyRecord) => {
      if (!includeArchived) {
        const status = clean(lead['Archive Status']).toLowerCase();
        if (status === 'archived' || status === 'deleted') return false;
      }

      if (approvalStatus && clean(lead['Approval Status']).toLowerCase() !== approvalStatus.toLowerCase()) return false;
      if (sendStatus && clean(lead['Send Status']).toLowerCase() !== sendStatus.toLowerCase()) return false;
      if (leadStatus) {
        const rowLeadStatus = clean(lead['Lead Status']).toLowerCase();
        const requestedLeadStatus = leadStatus.toLowerCase();
        const isQualifiedRequest = requestedLeadStatus === 'qualified' || requestedLeadStatus === 'hot_good' || requestedLeadStatus === 'hot+good';
        if (isQualifiedRequest) {
          if (!rowLeadStatus.includes('hot') && !rowLeadStatus.includes('good')) return false;
        } else if (rowLeadStatus !== requestedLeadStatus) {
          return false;
        }
      }
      if (archiveStatus && clean(lead['Archive Status']).toLowerCase() !== archiveStatus.toLowerCase()) return false;
      if (hasEmail && !isValidValue(lead['Final Email'])) return false;

      return true;
    });

    filtered = filtered.slice(0, max);

    return NextResponse.json({
      success: true,
      count: filtered.length,
      totalRows: leads.length,
      headers: HEADERS,
      leads: filtered,
    });
  } catch (error: any) {
    console.error('Sheet GET Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * POST /api/sheets/leads
 *
 * Existing Python/audit flow can keep sending:
 * { "leads": [{ title, link, audit: {...} }] }
 *
 * Also supports:
 * { "lead": {...} }
 */
async function handleSheetLeadsPost(req: Request) {
  try {
    await requireSheetAccess(req);

    const body = await req.json();
    const leads = Array.isArray(body?.leads) ? body.leads : body?.lead ? [body.lead] : [];

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ success: false, message: 'No leads received.' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getSheetsClient();

    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const { urlToRowNumber, emailToRowNumber } = buildIndexes(rows);

    const rowsToAppend: string[][] = [];
    const rowsToUpdate: Array<{ rowNumber: number; row: string[] }> = [];
    const skipped: string[] = [];

    leads.forEach((lead: AnyRecord) => {
      const urlKey = getLeadUrlKey(lead);
      const finalEmail = getFinalEmail(lead?.audit || {}, lead).email;
      const emailKey = normalizeEmail(finalEmail);

      if (!urlKey && !emailKey) {
        skipped.push(clean(lead?.title || lead?.link || 'Unknown lead'));
        return;
      }

      const existingRowNumber = (urlKey && urlToRowNumber.get(urlKey)) || (emailKey && emailToRowNumber.get(emailKey));
      const existingObj = existingRowNumber ? rowToObject(rows[existingRowNumber - 2], existingRowNumber) : undefined;
      const rowObj = buildLeadObject(lead, existingObj);
      const row = rowObjectToArray(rowObj);

      if (existingRowNumber) {
        rowsToUpdate.push({ rowNumber: existingRowNumber, row });
      } else {
        rowsToAppend.push(row);
      }
    });

    if (rowsToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: rowsToUpdate.map(({ rowNumber, row }) => ({
            range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
            values: [row],
          })),
        },
      });
    }

    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rowsToAppend },
      });
    }

    if (body?.applyFormatting === true) {
      await applySheetFormatting(sheets, spreadsheetId);
    }

    return NextResponse.json({
      success: true,
      addedCount: rowsToAppend.length,
      updatedCount: rowsToUpdate.length,
      skippedCount: skipped.length,
      skipped,
      message: `Added ${rowsToAppend.length} new lead(s), updated ${rowsToUpdate.length} existing lead(s).`,
    });
  } catch (error: any) {
    console.error('Sheet POST Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * PATCH /api/sheets/leads
 *
 * Single update:
 * {
 *   "rowNumber": 5,
 *   "updates": {
 *     "Approval Status": "Approved",
 *     "Send Status": "Sent",
 *     "Firestore Lead ID": "...",
 *     "Tracking ID": "..."
 *   }
 * }
 *
 * Or by website/email:
 * {
 *   "websiteUrl": "https://example.com",
 *   "updates": { "approvalStatus": "Approved" }
 * }
 *
 * Bulk:
 * { "items": [ { "rowNumber": 5, "updates": {...} }, ... ] }
 */
async function handleSheetLeadsPatch(req: Request) {
  try {
    await requireSheetAccess(req);

    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [body];

    if (!items.length) {
      return NextResponse.json({ success: false, message: 'No update items received.' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getSheetsClient();

    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const { urlToRowNumber, emailToRowNumber } = buildIndexes(rows);

    const updatesForSheet: Array<{ rowNumber: number; row: string[] }> = [];
    const missing: AnyRecord[] = [];

    for (const item of items) {
      const rowNumberFromBody = Number(item?.rowNumber || 0);
      const websiteKey = normalizeUrlForSheet(item?.websiteUrl || item?.website);
      const emailKey = normalizeEmail(item?.finalEmail || item?.email);

      const rowNumber =
        rowNumberFromBody > 1
          ? rowNumberFromBody
          : (websiteKey && urlToRowNumber.get(websiteKey)) || (emailKey && emailToRowNumber.get(emailKey)) || 0;

      if (!rowNumber || !rows[rowNumber - 2]) {
        missing.push({
          rowNumber: item?.rowNumber || '',
          websiteUrl: item?.websiteUrl || item?.website || '',
          finalEmail: item?.finalEmail || item?.email || '',
        });
        continue;
      }

      const existingObj = rowToObject(rows[rowNumber - 2], rowNumber);
      const normalizedUpdates = normalizeUpdateObject(item?.updates || item);

      const nextObj: AnyRecord = {
        ...existingObj,
        ...normalizedUpdates,
        'Last Synced': nowDhaka(),
      };

      updatesForSheet.push({ rowNumber, row: rowObjectToArray(nextObj) });
    }

    if (updatesForSheet.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesForSheet.map(({ rowNumber, row }) => ({
            range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
            values: [row],
          })),
        },
      });
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatesForSheet.length,
      missingCount: missing.length,
      missing,
    });
  } catch (error: any) {
    console.error('Sheet PATCH Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}


async function patchSheetRowSafely(rowNumber: number, updates: AnyRecord) {
  if (!rowNumber || rowNumber <= 1) return;
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);
    const existing = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
    if (!existing || !Object.keys(existing).length) return;
    const normalized = normalizeUpdateObject(updates || {});
    await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, { ...existing, ...normalized });
  } catch (error) {
    console.warn("Sheet patch skipped:", error);
  }
}

async function handleReportRegister(req: Request) {
  await requireReportRegisterAccess(req);
  const rawBody = await readJson(req);
  const body = rawBody?.report || rawBody;
  const report = normalizeReportPayload(body || {});

  if (!report.domain && !report.websiteUrl) {
    throw new ApiError("domain or websiteUrl is required for report registration", 400);
  }
  if (!report.companyName) {
    throw new ApiError("companyName or businessName is required for report registration", 400);
  }
  if (!report.pdfViewUrl && !report.pdfDownloadUrl) {
    throw new ApiError("pdfViewUrl or pdfDownloadUrl is required", 400);
  }
  if (!report.reportUrl || isLocalOrUnsafeReportUrl(report.reportUrl)) {
    throw new ApiError("A secure public reportUrl is required. Use NEXT_PUBLIC_APP_URL/r/{token}, not localhost or a direct PDF URL.", 400);
  }

  const reportRef = adminDb.collection("audit_reports").doc(report.token);
  const existing = await reportRef.get();
  const existingData = existing.exists ? existing.data() || {} : {};

  const payload: AnyRecord = {
    token: report.token,
    reportUrl: report.reportUrl,
    domain: report.domain,
    websiteUrl: report.websiteUrl,
    companyName: report.companyName,
    email: report.email,
    headline: report.headline,
    mainFinding: report.mainFinding,
    businessImpact: report.businessImpact,
    proofPoints: report.proofPoints,
    recommendations: report.recommendations,
    pdfFileId: report.pdfFileId,
    pdfViewUrl: report.pdfViewUrl,
    pdfDownloadUrl: report.pdfDownloadUrl,
    pdfExpiresAt: report.pdfExpiresAt,
    leadId: report.leadId,
    sheetRowNumber: report.sheetRowNumber,
    source: report.source,
    sourceAuditId: report.auditId,
    storageProvider: report.storageProvider,
    contactEmail: report.contactEmail,
    ctaUrl: report.ctaUrl,
    ctaText: report.ctaText,
    active: body?.active === false ? false : true,
    reportReady: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRegisteredAt: admin.firestore.FieldValue.serverTimestamp(),
    viewCount: Number(existingData.viewCount || 0),
    downloadCount: Number(existingData.downloadCount || 0),
    ctaClickCount: Number(existingData.ctaClickCount || 0),
  };

  if (!existing.exists) {
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await reportRef.set(payload, { merge: true });

  if (report.leadId) {
    await adminDb.collection("outreach_leads").doc(report.leadId).set(
      {
        reportToken: report.token,
        reportUrl: report.reportUrl,
        pdfFileId: report.pdfFileId,
        pdfViewUrl: report.pdfViewUrl,
        pdfDownloadUrl: report.pdfDownloadUrl,
        pdfExpiresAt: report.pdfExpiresAt,
        reportReady: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        tracking_history: admin.firestore.FieldValue.arrayUnion({
          event: "report_registered",
          reportToken: report.token,
          time: admin.firestore.Timestamp.now(),
        }),
      },
      { merge: true },
    );
  }

  let sheetUpdated = false;
  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      reportToken: report.token,
      reportUrl: report.reportUrl,
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      pdfExpiresAt: report.pdfExpiresAt,
      reportPageViewed: "No",
      pdfDownloaded: "No",
      ctaClicked: "No",
      notes: "Secure report registered and PDF uploaded.",
    });
    sheetUpdated = true;
  }

  return json({
    success: true,
    message: "Secure report registered successfully.",
    token: report.token,
    reportToken: report.token,
    reportUrl: report.reportUrl,
    pdfFileId: report.pdfFileId,
    pdfViewUrl: report.pdfViewUrl,
    pdfDownloadUrl: report.pdfDownloadUrl,
    pdfExpiresAt: report.pdfExpiresAt,
    leadId: report.leadId,
    sheetRowNumber: report.sheetRowNumber,
    sheetUpdated,
    storageProvider: report.storageProvider,
  });
}

async function getActiveReportByToken(tokenRaw: any) {
  const token = normalizeReportToken(tokenRaw);
  if (!token) throw new ApiError("Report token is required", 400);

  const snap = await adminDb.collection("audit_reports").doc(token).get();
  if (!snap.exists) throw new ApiError("Report not found", 404);
  const report = snap.data() || {};

  if (report.active === false) throw new ApiError("Report is no longer available", 410);
  const expiresAtMs = toMillis(report.pdfExpiresAt || report.expiresAt);
  if (expiresAtMs && Date.now() > expiresAtMs) throw new ApiError("Report has expired", 410);

  return { token, ref: snap.ref, report };
}

async function getReportTokenFromRequest(req: Request): Promise<string> {
  const url = new URL(req.url);
  const queryToken = normalizeReportToken(url.searchParams.get("token"));
  if (queryToken) return queryToken;

  if (req.method.toUpperCase() === "POST") {
    const body = await readJson(req);
    return normalizeReportToken(body?.token || body?.reportToken || body?.report_token || "");
  }

  return "";
}

function getReportPdfRedirectTarget(report: AnyRecord, preferDownload = false): string {
  const first = preferDownload ? report.pdfDownloadUrl : report.pdfViewUrl;
  const second = preferDownload ? report.pdfViewUrl : report.pdfDownloadUrl;
  return sanitizeOptionalUrl(first || second || "");
}

function getGoogleDriveOAuthClient() {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const refreshToken = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "").trim();

  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth });
}

function extractGoogleDriveFileId(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    if (fileMatch?.[1]) return fileMatch[1];

    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {}

  return "";
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.byteLength > 4 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

async function fetchPdfBufferFromDriveApi(fileId: string): Promise<Buffer | null> {
  const drive = getGoogleDriveOAuthClient();
  if (!drive || !fileId) return null;

  const response = await (drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  ) as Promise<{ data: ArrayBuffer | Buffer | Uint8Array | string }>);

  const data: any = response.data;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data === "string") return Buffer.from(data, "binary");

  return null;
}

async function fetchPdfBufferFromPublicUrl(rawTarget: string): Promise<Buffer> {
  const target = sanitizeOptionalUrl(rawTarget);
  if (!target) throw new ApiError("PDF URL is missing", 404);

  const driveFileId = extractGoogleDriveFileId(target);
  const downloadTarget = driveFileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}`
    : target;

  const response = await fetch(downloadTarget, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
      "user-agent": "TrackFlowPro-PDF-Preview/1.0",
    },
  });

  if (!response.ok) {
    throw new ApiError(`PDF fetch failed from storage (${response.status}).`, response.status >= 500 ? 502 : 400);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function resolveReportPdfBuffer(report: AnyRecord, preferDownload = false): Promise<Buffer> {
  const target = getReportPdfRedirectTarget(report, preferDownload);
  const fileId = String(report.pdfFileId || report.driveFileId || extractGoogleDriveFileId(target) || "").trim();

  const viaDriveApi = await fetchPdfBufferFromDriveApi(fileId);
  if (viaDriveApi && isPdfBuffer(viaDriveApi)) return viaDriveApi;

  const viaPublicUrl = await fetchPdfBufferFromPublicUrl(target);
  if (!isPdfBuffer(viaPublicUrl)) {
    throw new ApiError("Stored PDF could not be streamed. Check Google Drive sharing or OAuth credentials.", 502);
  }

  return viaPublicUrl;
}

function pdfErrorHtml(message: string) {
  const safeMessage = escapeHtml(message || "The PDF preview is temporarily unavailable.");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PDF preview unavailable</title>
    <style>
      body{margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;}
      .wrap{min-height:460px;display:flex;align-items:center;justify-content:center;padding:28px;}
      .card{max-width:520px;border:1px solid #e2e8f0;border-radius:22px;background:#fff;box-shadow:0 18px 60px rgba(15,23,42,.08);padding:26px;}
      .eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;color:#2563eb;margin:0 0 12px;}
      h1{font-size:22px;line-height:1.2;margin:0 0 12px;font-weight:900;letter-spacing:-.03em;}
      p{font-size:14px;line-height:1.7;margin:0;color:#475569;font-weight:600;}
      .note{margin-top:14px;border-radius:16px;background:#eff6ff;color:#1e3a8a;padding:12px;font-size:12px;line-height:1.6;}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <p class="eyebrow">TrackFlow Pro PDF preview</p>
        <h1>PDF preview is temporarily unavailable</h1>
        <p>${safeMessage}</p>
        <p class="note">Use the Open PDF or Download PDF button below this preview area. If the issue continues, reply to the email and I will resend the report.</p>
      </div>
    </div>
  </body>
</html>`;
}

function pdfStreamResponse(buffer: Buffer, filename: string, disposition: "inline" | "attachment") {
  const safeFilename = String(filename || "trackflow-report.pdf")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "trackflow-report.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(buffer.byteLength),
      "content-disposition": `${disposition}; filename=\"${safeFilename}\"`,
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

function reportPdfFilename(report: AnyRecord, token: string) {
  const company = String(report.companyName || report.businessName || report.domain || "client")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "client";

  return `TrackFlow-Pro-${company}-${token.slice(0, 10)}.pdf`;
}

async function handleReportPreview(req: Request) {
  try {
    const token = await getReportTokenFromRequest(req);
    const { report } = await getActiveReportByToken(token);
    const buffer = await resolveReportPdfBuffer(report, false);
    return pdfStreamResponse(buffer, reportPdfFilename(report, token), "inline");
  } catch (error: any) {
    console.error("Report PDF preview failed:", error);
    const message = error?.message || "The PDF could not be loaded from storage right now.";
    return htmlResponse(pdfErrorHtml(message), 200);
  }
}

async function handleReportView(req: Request) {
  const token = await getReportTokenFromRequest(req);
  const { ref, report } = await getActiveReportByToken(token);

  // Free-limit friendly + scanner-resistant:
  // the report page should call this from a client-side beacon after a short delay.
  // We only write the first verified view to Firestore/Sheet. Later page loads return success without extra writes.
  const alreadyViewed = Boolean(report.lastViewedAt || report.firstViewedAt || report.reportPageViewedAt);
  if (alreadyViewed) {
    return json({ success: true, viewed: true, alreadyRecorded: true });
  }

  const nowTs = admin.firestore.Timestamp.now();
  await ref.set(
    {
      viewCount: admin.firestore.FieldValue.increment(1),
      firstViewedAt: nowTs,
      lastViewedAt: nowTs,
      reportPageViewedAt: nowTs,
    },
    { merge: true },
  );

  if (report.leadId) {
    await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
      {
        reportPageViewed: true,
        reportViewedAt: nowTs,
        lastReportViewedAt: nowTs,
        tracking_history: admin.firestore.FieldValue.arrayUnion({
          event: "report_page_viewed",
          reportToken: normalizeReportToken(report.token || token),
          time: nowTs,
        }),
      },
      { merge: true },
    );
  }

  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      reportPageViewed: "Yes",
      lastReportViewedAt: nowDhaka(),
    });
  }

  return json({ success: true, viewed: true, alreadyRecorded: false });
}

async function handleReportDownload(req: Request) {
  const token = await getReportTokenFromRequest(req);
  const { ref, report } = await getActiveReportByToken(token);
  const target = getReportPdfRedirectTarget(report, true);
  if (!target) throw new ApiError("PDF download link is missing", 404);

  const nowTs = admin.firestore.Timestamp.now();
  await ref.set(
    {
      downloadCount: admin.firestore.FieldValue.increment(1),
      lastDownloadedAt: nowTs,
    },
    { merge: true },
  );

  if (report.leadId) {
    await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
      {
        pdfDownloadedAt: nowTs,
        tracking_history: admin.firestore.FieldValue.arrayUnion({
          event: "pdf_downloaded",
          reportToken: normalizeReportToken(report.token || token),
          time: nowTs,
        }),
      },
      { merge: true },
    );
  }

  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      pdfDownloaded: "Yes",
      lastPdfDownloadedAt: nowDhaka(),
    });
  }

  try {
    const buffer = await resolveReportPdfBuffer(report, true);
    return pdfStreamResponse(buffer, reportPdfFilename(report, token), "attachment");
  } catch (error: any) {
    console.error("Report PDF download failed:", error);
    throw new ApiError(error?.message || "PDF download failed", 502);
  }
}

async function handleReportCta(req: Request) {
  const url = new URL(req.url);
  const { token, ref, report } = await getActiveReportByToken(url.searchParams.get("token"));
  const target = sanitizeLocalRedirectTarget(url.searchParams.get("target") || "/contact");

  await ref.set(
    {
      ctaClickCount: admin.firestore.FieldValue.increment(1),
      lastCtaClickedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (report.leadId) {
    await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
      {
        reportCtaClickedAt: admin.firestore.FieldValue.serverTimestamp(),
        tracking_history: admin.firestore.FieldValue.arrayUnion({
          event: "report_cta_clicked",
          reportToken: token,
          target,
          time: admin.firestore.Timestamp.now(),
        }),
      },
      { merge: true },
    );
  }

  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      ctaClicked: "Yes",
      lastCtaClickedAt: nowDhaka(),
    });
  }

  return NextResponse.redirect(new URL(target, appBaseUrl()).toString());
}



function formatPostmasterDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function getPostmasterPolicy() {
  return {
    spamRateWarning: "0.10%",
    spamRatePause: "0.30%",
    lowReputationAction: "Pause cold follow-ups and reduce new sends",
  };
}

function getGoogleApiErrorInfo(error: any) {
  const status = Number(error?.code || error?.response?.status || error?.status || 500);
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.errors?.[0]?.message ||
    error?.message ||
    "Google Postmaster API request failed";

  return {
    status: Number.isFinite(status) ? status : 500,
    message: String(message),
  };
}


async function withPostmasterTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Google Postmaster API request timed out");
      (error as any).code = 504;
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isPostmasterNoDataError(error: any) {
  const info = getGoogleApiErrorInfo(error);
  const message = info.message.toLowerCase();

  return (
    info.status === 404 ||
    message.includes("not found") ||
    message.includes("requested entity was not found") ||
    message.includes("trafficstats") ||
    message.includes("traffic stats")
  );
}

function isPostmasterAuthError(error: any) {
  const info = getGoogleApiErrorInfo(error);
  const message = info.message.toLowerCase();

  return (
    info.status === 400 ||
    info.status === 401 ||
    info.status === 403 ||
    message.includes("unauthorized_client") ||
    message.includes("invalid_grant") ||
    message.includes("invalid_client") ||
    message.includes("invalid_scope") ||
    message.includes("access_denied") ||
    message.includes("insufficient") ||
    message.includes("permission") ||
    message.includes("forbidden")
  );
}

function postmasterAuthErrorPayload(options: {
  domain: string;
  date?: string;
  daysBack?: number;
  checkedDates?: string[];
  googleStatus?: number;
  googleMessage?: string;
}) {
  const googleMessage = options.googleMessage || "Google Postmaster OAuth authorization failed";

  return {
    success: true,
    configured: true,
    noData: true,
    authError: true,
    needsCredentialRefresh: true,
    domain: options.domain,
    date: options.date || null,
    daysBack: options.daysBack ?? null,
    checkedDates: options.checkedDates || [],
    googleStatus: options.googleStatus || null,
    googleMessage,
    message:
      "Postmaster API route is working, but Google rejected the OAuth credentials. Generate a fresh Client ID/Client Secret/Refresh Token with the Postmaster readonly scope and use the Google account that has access to this verified domain.",
    spamRate: null,
    domainReputation: null,
    ipReputations: [],
    spfSuccessRatio: null,
    dkimSuccessRatio: null,
    dmarcSuccessRatio: null,
    deliveryErrors: [],
    raw: null,
    policy: getPostmasterPolicy(),
  };
}

type PostmasterTrafficStatsResponse = {
  data?: {
    userReportedSpamRatio?: number | string | null;
    domainReputation?: string | null;
    spfSuccessRatio?: number | string | null;
    dkimSuccessRatio?: number | string | null;
    dmarcSuccessRatio?: number | string | null;
    ipReputations?: any[];
    deliveryErrors?: any[];
    [key: string]: any;
  } | null;
  [key: string]: any;
};

function emptyPostmasterStatsPayload(options: {
  domain: string;
  date?: string;
  daysBack?: number;
  checkedDates?: string[];
  message: string;
}) {
  return {
    success: true,
    configured: true,
    noData: true,
    domain: options.domain,
    date: options.date || null,
    daysBack: options.daysBack ?? null,
    checkedDates: options.checkedDates || [],
    message: options.message,
    spamRate: null,
    domainReputation: null,
    ipReputations: [],
    spfSuccessRatio: null,
    dkimSuccessRatio: null,
    dmarcSuccessRatio: null,
    deliveryErrors: [],
    raw: null,
    policy: getPostmasterPolicy(),
  };
}

async function handlePostmasterHealth(req: Request) {
  await requireAdmin(req);

  const domain = String(process.env.POSTMASTER_DOMAIN || "trackflowpro.com").trim();
  const clientId = process.env.GOOGLE_POSTMASTER_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_POSTMASTER_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_POSTMASTER_REFRESH_TOKEN || "";

  if (!clientId || !clientSecret || !refreshToken) {
    return json({
      success: true,
      configured: false,
      noData: true,
      domain,
      message: "Postmaster API credentials are not configured yet. Verify the domain in Google Postmaster Tools and add OAuth refresh-token env vars to enable live dashboard data.",
      policy: getPostmasterPolicy(),
    });
  }

  const url = new URL(req.url);
  const requestedDaysBackRaw = Number(url.searchParams.get("daysBack") || 1);
  const requestedDaysBack = Math.max(
    0,
    Math.min(Number.isFinite(requestedDaysBackRaw) ? requestedDaysBackRaw : 1, 14)
  );
 const maxLookbackRaw = Number(url.searchParams.get("maxLookback") || 3);
const maxLookback = Math.max(
  requestedDaysBack,
  Math.min(Number.isFinite(maxLookbackRaw) ? Math.floor(maxLookbackRaw) : 3, 14)
);

  // Postmaster data often appears late and fresh domains may have no stats yet.
  // Try the requested day first, then walk backward so "no data" never becomes a 500.
  const daysToTry = Array.from(
    new Set([requestedDaysBack, ...Array.from({ length: maxLookback + 1 }, (_, index) => index)])
  ).filter((daysBack) => daysBack >= 0 && daysBack <= maxLookback);

  const checkedDates: string[] = [];

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  if (typeof (google as any).gmailpostmastertools !== "function") {
    return json(
      {
        success: false,
        configured: true,
        domain,
        error: "Google Postmaster Tools client is not available in the installed googleapis package. Update the googleapis package or migrate this route to the latest Postmaster Tools API client.",
        policy: getPostmasterPolicy(),
      },
      500
    );
  }

  const postmaster = (google as any).gmailpostmastertools({ version: "v1beta1", auth });

  for (const daysBack of daysToTry) {
    const date = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const trafficStatsId = formatPostmasterDate(date);
    checkedDates.push(trafficStatsId);

    try {
      const name = `domains/${domain}/trafficStats/${trafficStatsId}`;
      const response = await withPostmasterTimeout<PostmasterTrafficStatsResponse>(
        postmaster.domains.trafficStats.get({ name }) as Promise<PostmasterTrafficStatsResponse>,
        12000
      );
      const stats = response?.data || {};

      const hasStats = Boolean(
        stats.userReportedSpamRatio != null ||
          stats.domainReputation != null ||
          stats.spfSuccessRatio != null ||
          stats.dkimSuccessRatio != null ||
          stats.dmarcSuccessRatio != null ||
          (Array.isArray(stats.ipReputations) && stats.ipReputations.length > 0) ||
          (Array.isArray(stats.deliveryErrors) && stats.deliveryErrors.length > 0)
      );

      if (!hasStats) {
        return json(
          emptyPostmasterStatsPayload({
            domain,
            date: trafficStatsId,
            daysBack,
            checkedDates,
            message: "Postmaster API connected, but Google returned an empty stats object for this date. This is normal for a newly verified domain or low Gmail traffic.",
          })
        );
      }

      return json({
        success: true,
        configured: true,
        noData: false,
        domain,
        date: trafficStatsId,
        daysBack,
        checkedDates,
        message: "Postmaster health loaded.",
        spamRate: stats.userReportedSpamRatio ?? null,
        domainReputation: stats.domainReputation ?? null,
        ipReputations: stats.ipReputations ?? [],
        spfSuccessRatio: stats.spfSuccessRatio ?? null,
        dkimSuccessRatio: stats.dkimSuccessRatio ?? null,
        dmarcSuccessRatio: stats.dmarcSuccessRatio ?? null,
        deliveryErrors: stats.deliveryErrors ?? [],
        raw: stats,
        policy: getPostmasterPolicy(),
      });
    } catch (error: any) {
      const info = getGoogleApiErrorInfo(error);

      if (isPostmasterNoDataError(error)) {
        console.info("No Postmaster traffic stats for date:", {
          domain,
          trafficStatsId,
          daysBack,
          status: info.status,
          message: info.message,
        });
        continue;
      }

      if (isPostmasterAuthError(error)) {
        console.warn("Google Postmaster OAuth/config error:", {
          domain,
          trafficStatsId,
          daysBack,
          status: info.status,
          message: info.message,
        });

        // This is not an application crash. Keep the dashboard stable and show a clear setup message.
        return json(
          postmasterAuthErrorPayload({
            domain,
            date: trafficStatsId,
            daysBack,
            checkedDates,
            googleStatus: info.status,
            googleMessage: info.message,
          }),
          200
        );
      }

      console.error("Google Postmaster API Error:", {
        domain,
        trafficStatsId,
        daysBack,
        status: info.status,
        message: info.message,
      });

      return json(
        {
          success: false,
          configured: true,
          noData: false,
          domain,
          date: trafficStatsId,
          daysBack,
          checkedDates,
          error: info.message,
          policy: getPostmasterPolicy(),
        },
        info.status >= 400 && info.status < 600 ? info.status : 500
      );
    }
  }

  return json(
    emptyPostmasterStatsPayload({
      domain,
      date: checkedDates[0],
      daysBack: requestedDaysBack,
      checkedDates,
      message: "Postmaster domain/API is connected, but no traffic stats are available yet. Send some Gmail traffic and check again after Google has processed the data.",
    })
  );
}

function normalizeSheetServiceForSend(value: string): string {
  const text = String(value || "").toLowerCase();
  if (text.includes("signature")) return "Email Signature";
  if (text.includes("server") || text.includes("sst")) return "Server Side Tracking";
  return "Google Ads";
}

async function handleReleaseTemplateBlockedFollowups(req: Request) {
  await requireAdmin(req);

  const nowTs = admin.firestore.Timestamp.now();
  const snap = await adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "template_blocked")
    .limit(200)
    .get();

  const batch = adminDb.batch();
  snap.docs.forEach((docSnap: any) => {
    batch.update(docSnap.ref, {
      nextFollowupStatus: "scheduled",
      nextFollowupReason: "template_settings_updated_requeued",
      lastFollowupEvaluatedAt: nowTs,
      automationLock: admin.firestore.FieldValue.delete(),
    });
  });

  if (!snap.empty) await batch.commit();
  return json({ success: true, requeuedCount: snap.size });
}

function validateSheetQueuedSendReadiness(row: AnyRecord): string[] {
  const blockers: string[] = [];
  const approvalStatus = clean(row["Approval Status"]).toLowerCase();
  const finalEmail = clean(row["Final Email"]);
  const subject = clean(row["Email Subject"]);
  const emailBody = clean(row["Email Body"]);
  const mainIssue = clean(row["Main Issue"]);
  const reportUrl = sanitizePublicReportUrl(clean(row["Report URL"]));
  const reportToken = normalizeReportToken(row["Report Token"]);
  const pdfFileId = clean(row["PDF File ID"]);
  const pdfViewUrl = sanitizeOptionalUrl(clean(row["PDF View URL"]));
  const pdfDownloadUrl = sanitizeOptionalUrl(clean(row["PDF Download URL"]));

  if (!isValidEmail(finalEmail)) blockers.push("Final Email is invalid or missing");
  if (!["approved", "send ready"].includes(approvalStatus)) blockers.push("Approval Status must be Approved or Send Ready");
  if (!subject) blockers.push("Email Subject is missing");
  if (!plainTextFromHtml(emailBody)) blockers.push("Email Body is missing");
  if (!mainIssue) blockers.push("Main Issue is missing");
  if (!reportUrl) blockers.push("secure TrackFlow /r report URL is missing");
  if (!reportToken) blockers.push("Report Token is missing");
  if (!pdfFileId) blockers.push("PDF File ID is missing");
  if (!pdfViewUrl && !pdfDownloadUrl) blockers.push("PDF View URL or PDF Download URL is missing");

  return blockers;
}

/** GET /api/trackflow/cron/sheet-queued-sends */
async function handleCronSheetQueuedSends(req: Request) {
  /**
   * SHEET QUEUE CRON
   * বাংলা ব্যাখ্যা: Google Sheet realtime DB না। তাই send করার আগে row-কে Processing + Queue Lock ID দিয়ে
   * lock করা হয়। এরপর row আবার read করে নিজের lock confirm করা হয়। এতে duplicate email যাওয়ার risk কমে।
   */
  requireCronSecret(req);

  const cronLock = await acquireCronLock("sheet_queued_sends", 10);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Sheet queued sends cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("sheetQueuedSends", {
      success: true,
      locked: true,
      skipped: true,
      reason: "sheet_queued_sends_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
    const startedAtMs = Date.now();
    const url = new URL(req.url);
    const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 10), 25));
    const defaultSender = getDefaultSender();
    if (!defaultSender) throw new ApiError("No default sender configured", 500);

    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const candidates: Array<{ rowNumber: number; obj: AnyRecord }> = rows
      .map((row: any[], index: number): { rowNumber: number; obj: AnyRecord } => {
        const rowNumber = index + 2;
        return { rowNumber, obj: rowToObject(row, rowNumber) };
      })
      .filter((item: { rowNumber: number; obj: AnyRecord }) => {
        const status = clean(item.obj["Send Status"]).toLowerCase();
        if (status === "queued") return true;
        if (status === "processing") return isSheetProcessingLockStale(item.obj);
        return false;
      })
      .slice(0, max);

    const sent: any[] = [];
    const failed: any[] = [];
    const skipped: any[] = [];

    for (const { rowNumber, obj } of candidates) {
      const previousStatus = clean(obj["Send Status"]).toLowerCase();
      const previousAttempts = Number(obj["Attempt Count"] || 0);
      const attempts = previousAttempts + 1;
      const senderId = clean(obj["Sender ID"]) || defaultSender.id;
      const finalEmail = clean(obj["Final Email"]);
      const lockId = randomUUID();
      const attemptId = randomUUID();
      const lockedAt = sheetLockTimestamp();

      if (previousStatus === "processing" && !isSheetProcessingLockStale(obj)) {
        skipped.push({ rowNumber, email: finalEmail, reason: "fresh_processing_lock" });
        continue;
      }

      if (!isValidEmail(finalEmail)) {
        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...obj,
          "Send Status": "Failed",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: "Invalid email while processing queued send.",
        });
        failed.push({ rowNumber, email: finalEmail, error: "invalid_email" });
        continue;
      }

      // Lock first, then re-read. This is not a perfect database transaction, but it is much safer than batch-lock-after-send.
      await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
        ...obj,
        "Send Status": "Processing",
        "Attempt Count": String(attempts),
        "Queue Lock ID": lockId,
        "Queue Locked At": lockedAt,
        "Queue Attempt ID": attemptId,
        Notes: `Cron locked row at ${nowDhaka()}. Previous status: ${previousStatus || "queued"}.`,
      });

      const freshObj = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
      if (clean(freshObj["Queue Lock ID"]) !== lockId || clean(freshObj["Send Status"]).toLowerCase() !== "processing") {
        skipped.push({ rowNumber, email: finalEmail, reason: "lock_not_owned" });
        continue;
      }

      const readinessBlockers = validateSheetQueuedSendReadiness(freshObj);
      if (readinessBlockers.length) {
        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Send Status": "Needs Review",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: `Queue blocked before send: ${readinessBlockers.join("; ").slice(0, 450)}`,
        });

        failed.push({
          rowNumber,
          email: finalEmail,
          attempts,
          error: "readiness_blocked",
          reasons: readinessBlockers,
        });
        continue;
      }

      try {
        const response = await sendInitialFromBody({
          email: finalEmail,
          subject: clean(freshObj["Email Subject"]),
          message: clean(freshObj["Email Body"]),
          selectedService: normalizeSheetServiceForSend(freshObj["Service Type"]),
          senderId,
          clientName: clean(freshObj["Decision Maker"]),
          companyName: clean(freshObj["Business Name"]),
          website: clean(freshObj["Website URL"]),
          businessType: clean(freshObj["Lead Label"]) || clean(freshObj["Lead Status"]),
          includeSignature: true,
          signatureMode: "full",
          reportUrl: sanitizePublicReportUrl(clean(freshObj["Report URL"])),
          reportButtonText: "View short audit note",
          reportToken: clean(freshObj["Report Token"]),
          pdfFileId: clean(freshObj["PDF File ID"]),
          pdfViewUrl: clean(freshObj["PDF View URL"]),
          pdfDownloadUrl: clean(freshObj["PDF Download URL"]),
          pdfExpiresAt: clean(freshObj["PDF Expires At"]),
          sheetRowNumber: rowNumber,
          sheetWebsiteUrl: clean(freshObj["Website URL"]),
          sheetFinalEmail: finalEmail,
          source: "google_sheet_queue",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || `send-email failed with status ${response.status}`);
        }

        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Approval Status": "Approved",
          "Send Status": data.scheduled ? "Scheduled" : "Sent",
          "Firestore Lead ID": data.leadId || "",
          "Tracking ID": data.trackingId || "",
          "Reply Status": "No Reply",
          "Open Count": "0",
          "Click Count": "0",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: data.scheduled ? "Scheduled by sheet queue cron." : "Sent by sheet queue cron.",
        });
        sent.push({ rowNumber, email: finalEmail, leadId: data.leadId || "" });
      } catch (error: any) {
        const errorMessage = String(error?.message || error);
        const retryBecauseDailyLimit = isRetryableDailyLimitError(error);
        const finalAttempts = retryBecauseDailyLimit ? previousAttempts : attempts;
        const finalStatus = retryBecauseDailyLimit ? "Queued" : attempts >= 3 ? "Failed" : "Queued";

        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Send Status": finalStatus,
          "Attempt Count": String(finalAttempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: retryBecauseDailyLimit
            ? `Daily limit reached. Kept queued for next cron/day without increasing permanent attempts: ${errorMessage.slice(0, 220)}`
            : `Queue send failed${attempts >= 3 ? " permanently" : "; will retry"}: ${errorMessage.slice(0, 300)}`,
        });

        failed.push({
          rowNumber,
          email: finalEmail,
          attempts: finalAttempts,
          retryBecauseDailyLimit,
          error: errorMessage,
        });
      }
    }

    const result = {
      success: true,
      checked: candidates.length,
      sentCount: sent.length,
      failedCount: failed.length,
      skippedCount: skipped.length,
      durationMs: Date.now() - startedAtMs,
      sent,
      failed,
      skipped,
    };

    await writeCronStatus("sheetQueuedSends", {
      success: true,
      checked: result.checked,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      durationMs: result.durationMs,
    });

    return json(result);
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Sheet queued sends cron lock release failed:", error));
  }
}


function serializeApiMillis(value: any): number | null {
  const ms = toMillis(value);
  if (ms) return ms;
  if (typeof value?._seconds === "number") return value._seconds * 1000;
  return null;
}

function serializeScheduledLead(docSnap: FirestoreQueryDocSnap | FirestoreDocSnap) {
  const data: any = docSnap.data() || {};
  return {
    id: docSnap.id,
    email: data.email || "",
    emailLower: data.emailLower || "",
    name: data.name || "",
    company_name: data.company_name || "",
    website: data.website || "",
    business_type: data.business_type || "",
    service: data.service || "",
    sender_id: data.sender_id || data.senderId || "",
    sender_email: data.sender_email || "",
    sender_name: data.sender_name || "",
    subject: data.subject || "",
    message: data.message || "",
    status: data.status || "",
    scheduledAt: serializeApiMillis(data.scheduledAt),
    createdAt: serializeApiMillis(data.createdAt),
    updatedAt: serializeApiMillis(data.updatedAt),
    reportUrl: data.reportUrl || "",
    reportButtonText: data.reportButtonText || "View short audit note",
    include_signature: data.include_signature !== false,
    signatureMode: data.signatureMode || "full",
    sheetRowNumber: data.sheetRowNumber || null,
    source: data.source || "",
    error: data.error || "",
    automationLock: data.automationLock || null,
  };
}


type LeadManagementView = "active" | "archived" | "trash" | "all";

function serializeManagedLead(docSnap: FirestoreQueryDocSnap | FirestoreDocSnap) {
  const data: any = docSnap.data() || {};
  return {
    id: docSnap.id,
    email: data.email || "",
    emailLower: data.emailLower || "",
    name: data.name || "",
    company_name: data.company_name || "",
    website: data.website || "",
    business_type: data.business_type || "",
    service: data.service || "",
    sender_id: data.sender_id || data.senderId || "",
    sender_email: data.sender_email || "",
    sender_name: data.sender_name || "",
    subject: data.subject || "",
    message: data.message || "",
    status: data.status || "",
    stopAutomation: data.stopAutomation === true,
    follow_up_count: Number(data.follow_up_count || 0),
    open_count: Number(data.open_count || 0),
    click_count: Number(data.click_count || 0),
    createdAt: serializeApiMillis(data.createdAt),
    sentAt: serializeApiMillis(data.sentAt),
    lastOpenedAt: serializeApiMillis(data.lastOpenedAt),
    lastClickedAt: serializeApiMillis(data.lastClickedAt),
    lastEngagedAt: serializeApiMillis(data.lastEngagedAt),
    lastFollowUp: serializeApiMillis(data.lastFollowUp),
    nextFollowupAt: serializeApiMillis(data.nextFollowupAt),
    nextFollowupStep: Number(data.nextFollowupStep || 0) || null,
    nextFollowupStatus: data.nextFollowupStatus || "",
    nextFollowupReason: data.nextFollowupReason || "",
    archived: data.archived === true,
    archivedAt: serializeApiMillis(data.archivedAt),
    archiveReason: data.archiveReason || "",
    deleted: data.deleted === true,
    deletedAt: serializeApiMillis(data.deletedAt),
    deleteReason: data.deleteReason || "",
    source: data.source || "",
    sheetRowNumber: data.sheetRowNumber || null,
    reportUrl: data.reportUrl || "",
    trackingId: data.trackingId || "",
  };
}

function parseMonthRange(month: string) {
  const value = String(month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  return {
    start: admin.firestore.Timestamp.fromDate(start),
    end: admin.firestore.Timestamp.fromDate(end),
  };
}

function isLeadInManagementView(data: any, view: LeadManagementView) {
  const archived = data?.archived === true;
  const deleted = data?.deleted === true;
  if (view === "archived") return archived && !deleted;
  if (view === "trash") return deleted;
  if (view === "all") return true;
  return !archived && !deleted;
}

function isLikelyTestLead(data: any) {
  const text = [data.email, data.emailLower, data.name, data.company_name, data.source, data.subject]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /(^|[^a-z])(test|dummy|sample|fake|example)([^a-z]|$)/i.test(text) || text.includes("@example.") || text.includes("test@");
}

/** GET /api/trackflow/leads */
async function handleLeadsGet(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const limitParam = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 20), 50));
  const view = (String(url.searchParams.get("view") || "active").trim() || "active") as LeadManagementView;
  const status = String(url.searchParams.get("status") || "All").trim();
  const month = String(url.searchParams.get("month") || "").trim();
  const cursor = Number(url.searchParams.get("cursor") || 0);
  const fetchLimit = Math.min(Math.max(limitParam * 6, limitParam), 300);

  let baseQuery: FirestoreQueryRef = adminDb.collection("outreach_leads");
  const monthRange = parseMonthRange(month);
  if (monthRange) {
    baseQuery = baseQuery.where("createdAt", ">=", monthRange.start).where("createdAt", "<", monthRange.end);
  }
  if (Number.isFinite(cursor) && cursor > 0) {
    baseQuery = baseQuery.where("createdAt", "<", admin.firestore.Timestamp.fromMillis(cursor));
  }

  const snap = await baseQuery.orderBy("createdAt", "desc").limit(fetchLimit).get();
  const rows: any[] = [];
  let nextCursor: string | null = null;

  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    if (!isLeadInManagementView(data, view)) continue;
    if (status && status !== "All" && String(data.status || "") !== status) continue;
    rows.push(serializeManagedLead(docSnap));
    if (rows.length >= limitParam) break;
  }

  const lastDoc = snap.docs[snap.docs.length - 1];
  if (lastDoc) {
    const lastCreatedAt = serializeApiMillis((lastDoc.data() || {}).createdAt);
    nextCursor = lastCreatedAt ? String(lastCreatedAt) : null;
  }

  return json({
    success: true,
    count: rows.length,
    rows,
    view,
    status,
    month: month || "All",
    hasMore: snap.docs.length === fetchLimit && Boolean(nextCursor),
    nextCursor,
  });
}

async function updateLeadsInChunks(ids: string[], buildUpdate: (id: string) => Record<string, any>) {
  let updated = 0;
  for (let start = 0; start < ids.length; start += 450) {
    const chunk = ids.slice(start, start + 450);
    const batch = adminDb.batch();
    for (const id of chunk) {
      batch.set(adminDb.collection("outreach_leads").doc(id), buildUpdate(id), { merge: true });
      updated += 1;
    }
    await batch.commit();
  }
  return updated;
}

async function deleteLeadsInChunks(ids: string[]) {
  let deleted = 0;
  for (let start = 0; start < ids.length; start += 450) {
    const chunk = ids.slice(start, start + 450);
    const batch = adminDb.batch();
    for (const id of chunk) {
      batch.delete(adminDb.collection("outreach_leads").doc(id));
      deleted += 1;
    }
    await batch.commit();
  }
  return deleted;
}

/** POST /api/trackflow/leads/bulk-action */
async function handleLeadsBulkAction(req: Request) {
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const action = String(body.action || "").trim().toLowerCase();
  const ids: string[] = Array.isArray(body.ids)
    ? Array.from(new Set<string>(body.ids.map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 500)
    : [];

  if (!ids.length) throw new ApiError("Select at least one lead", 400);
  if (!["archive", "restore", "trash", "delete_permanent"].includes(action)) throw new ApiError("Invalid bulk action", 400);

  const actor = normalizeEmail(adminUser.email || "admin");

  if (action === "delete_permanent") {
    const deleted = await deleteLeadsInChunks(ids);
    return json({ success: true, action, count: deleted, message: `Permanently deleted ${deleted} lead(s).` });
  }

  const updated = await updateLeadsInChunks(ids, () => {
    const base: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === "archive") {
      return {
        ...base,
        archived: true,
        deleted: false,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        archivedBy: actor,
        archiveReason: String(body.reason || "archived_by_admin").slice(0, 120),
        stopAutomation: true,
        nextFollowupStatus: "blocked",
        nextFollowupReason: "archived_by_admin",
        automationLock: admin.firestore.FieldValue.delete(),
      };
    }

    if (action === "restore") {
      return {
        ...base,
        archived: false,
        deleted: false,
        restoredAt: admin.firestore.FieldValue.serverTimestamp(),
        restoredBy: actor,
        nextFollowupReason: "restored_by_admin_manual_review_required",
      };
    }

    return {
      ...base,
      archived: true,
      deleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: actor,
      deleteReason: String(body.reason || "moved_to_trash_by_admin").slice(0, 120),
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "deleted_by_admin",
      automationLock: admin.firestore.FieldValue.delete(),
    };
  });

  return json({ success: true, action, count: updated, message: `${action} applied to ${updated} lead(s).` });
}

async function countQuerySafe(queryRef: FirestoreQueryRef): Promise<number> {
  try {
    return await getCount(queryRef);
  } catch (error) {
    console.warn("Count query failed, returning 0:", error);
    return 0;
  }
}

/** GET /api/trackflow/system/usage-summary */
async function handleUsageSummary(req: Request) {
  await requireAdmin(req);
  const today = todayKey();
  const now = Date.now();
  const startOfToday = admin.firestore.Timestamp.fromDate(new Date(new Date().toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" })));

  const leadsRef = adminDb.collection("outreach_leads");
  const eventsRef = adminDb.collection("email_events");

  const [
    leadCount,
    archivedLeadCount,
    trashedLeadCount,
    emailEventCount,
    suppressionCount,
    eventsToday,
    dailyStatsSnap,
  ] = await Promise.all([
    countQuerySafe(leadsRef),
    countQuerySafe(leadsRef.where("archived", "==", true)),
    countQuerySafe(leadsRef.where("deleted", "==", true)),
    countQuerySafe(eventsRef),
    countQuerySafe(adminDb.collection("suppression_list")),
    countQuerySafe(eventsRef.where("createdAt", ">=", startOfToday)),
    adminDb.collection("daily_sending_stats").where("dateKey", "==", today).get(),
  ]);

  let initialSentToday = 0;
  let followupSentToday = 0;
  dailyStatsSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    initialSentToday += Number(data.initialSent || 0);
    followupSentToday += Number(data.followupSent || 0);
  });

  const activeLeadCount = Math.max(0, leadCount - archivedLeadCount - trashedLeadCount);
  const estimatedWritesToday = initialSentToday * 4 + followupSentToday * 5 + eventsToday * 2;
  const estimatedReadsToday = Math.max(0, Math.round((initialSentToday + followupSentToday) * 3 + eventsToday + 20));
  const estimatedDeletesToday = 0;
  const estimatedStorageMb = Math.round(((leadCount * 14 + emailEventCount * 1.5 + suppressionCount * 2) / 1024) * 10) / 10;

  return json({
    success: true,
    generatedAt: now,
    quota: {
      readsPerDay: 50_000,
      writesPerDay: 20_000,
      deletesPerDay: 20_000,
      storageMb: 1024,
    },
    usage: {
      estimatedReadsToday,
      estimatedWritesToday,
      estimatedDeletesToday,
      estimatedStorageMb,
      readPercent: Math.round((estimatedReadsToday / 50_000) * 1000) / 10,
      writePercent: Math.round((estimatedWritesToday / 20_000) * 1000) / 10,
      deletePercent: 0,
      storagePercent: Math.round((estimatedStorageMb / 1024) * 1000) / 10,
    },
    counts: {
      leadCount,
      activeLeadCount,
      archivedLeadCount,
      trashedLeadCount,
      emailEventCount,
      suppressionCount,
      initialSentToday,
      followupSentToday,
      eventsToday,
    },
    note: "Usage values are practical TrackFlowPro estimates. Firebase Console remains the final billing/quota source.",
  });
}

/** POST /api/trackflow/system/cleanup */
async function handleSystemCleanup(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const action = String(body.action || "").trim().toLowerCase();
  const days = Math.max(1, Math.min(Number(body.days || 30), 730));
  const threshold = admin.firestore.Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);

  if (!["archive_replied", "archive_finished", "trash_test_leads", "delete_old_events"].includes(action)) {
    throw new ApiError("Invalid cleanup action", 400);
  }

  if (action === "delete_old_events") {
    const snap = await adminDb.collection("email_events").where("createdAt", "<", threshold).limit(300).get();
    const batch = adminDb.batch();
    snap.docs.forEach((docSnap: any) => batch.delete(docSnap.ref));
    await batch.commit();
    return json({ success: true, action, count: snap.size, message: `Deleted ${snap.size} old email event(s).` });
  }

  const snap = await adminDb.collection("outreach_leads").where("createdAt", "<", threshold).orderBy("createdAt", "asc").limit(500).get();
  const ids: string[] = [];

  snap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    if (action === "archive_replied" && String(data.status || "") === "replied" && data.deleted !== true) ids.push(docSnap.id);
    if (action === "archive_finished" && ["finished", "cancelled", "bounced", "spam", "unsubscribed"].includes(String(data.status || "")) && data.deleted !== true) ids.push(docSnap.id);
    if (action === "trash_test_leads" && isLikelyTestLead(data)) ids.push(docSnap.id);
  });

  if (!ids.length) return json({ success: true, action, count: 0, message: "No matching records found." });

  if (action === "trash_test_leads") {
    const count = await updateLeadsInChunks(ids, () => ({
      archived: true,
      deleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deleteReason: "cleanup_test_leads",
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "cleanup_test_leads",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));
    return json({ success: true, action, count, message: `Moved ${count} test lead(s) to trash.` });
  }

  const count = await updateLeadsInChunks(ids, () => ({
    archived: true,
    deleted: false,
    archivedAt: admin.firestore.FieldValue.serverTimestamp(),
    archiveReason: action,
    stopAutomation: true,
    nextFollowupStatus: "blocked",
    nextFollowupReason: action,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, action, count, message: `Archived ${count} lead(s).` });
}



/**
 * LEAD CLEANUP + FOOTPRINT MEMORY SYSTEM
 * বাংলা ব্যাখ্যা:
 * - Full lead data 45/60/90 দিন পরে Firebase + Google Sheet থেকে clean করা যাবে।
 * - Delete করার আগে contact_memory বা suppression_list-এ ছোট footprint রাখা হয়।
 * - Queued/Processing lead কখনো hard delete করা হয় না, যাতে automation নষ্ট না হয়।
 */

type CleanupOutcome =
  | "cold_no_reply"
  | "warm_no_reply"
  | "replied_review"
  | "suppression_required"
  | "not_due"
  | "blocked";

type CleanupDecision = {
  eligible: boolean;
  outcome: CleanupOutcome;
  reason: string;
  daysOld: number;
  lastContactedMs: number;
  dueAtMs: number;
  cooldownMonths: number;
  memoryMonths: number;
  protectedLead: boolean;
  blockedReasons: string[];
};

const COLD_NO_REPLY_DELETE_DAYS = 45;
const WARM_NO_REPLY_DELETE_DAYS = 90;
const REPLIED_REVIEW_DAYS = 365;
const COLD_NO_REPLY_COOLDOWN_MONTHS = 6;
const WARM_NO_REPLY_COOLDOWN_MONTHS = 12;
const REPLIED_MEMORY_MONTHS = 36;

function addMonthsMs(anchorMs: number, months: number): number {
  const date = new Date(anchorMs || Date.now());
  date.setMonth(date.getMonth() + months);
  return date.getTime();
}

function getLeadLastContactedMs(lead: LeadData): number {
  return Math.max(
    toMillis(lead.lastFollowUp),
    toMillis(lead.lastSentAt),
    toMillis(lead.sentAt),
    toMillis(lead.createdAt)
  );
}

function getLeadLastEngagedMsForCleanup(lead: LeadData): number {
  return Math.max(toMillis(lead.lastEngagedAt), toMillis(lead.lastClickedAt), toMillis(lead.lastOpenedAt || lead.last_opened));
}

function leadHasEngagementForCleanup(lead: LeadData): boolean {
  return Number(lead.open_count || 0) > 0 || Number(lead.click_count || 0) > 0 || getLeadLastEngagedMsForCleanup(lead) > 0;
}

function isCleanupProcessingBlocked(lead: LeadData): string[] {
  const blockers: string[] = [];
  const status = String(lead.status || "").toLowerCase();
  const next = String(lead.nextFollowupStatus || "").toLowerCase();

  if (["processing_initial", "processing_followup"].includes(status)) blockers.push(`status:${status}`);
  if (next === "processing") blockers.push("next_followup_processing");
  if (lead.automationLock) blockers.push("automation_lock_present");

  return blockers;
}

function getLeadSourceKind(lead: LeadData): "sheet" | "cold" | "test" {
  const source = String(lead.source || "").toLowerCase();
  const email = normalizeEmail(lead.emailLower || lead.email || "");
  if (source.includes("test") || email.includes("test@") || email === normalizeEmail(MAIN_INBOX_EMAIL)) return "test";
  if (source.includes("google_sheet") || Number(lead.sheetRowNumber || 0) > 1 || lead.sheetFinalEmail || lead.sheetWebsiteUrl) return "sheet";
  return "cold";
}

function getCleanupDecision(lead: LeadData, nowMs = Date.now()): CleanupDecision {
  const blockedReasons = isCleanupProcessingBlocked(lead);
  const lastContactedMs = getLeadLastContactedMs(lead);
  const daysOld = lastContactedMs ? Math.floor((nowMs - lastContactedMs) / 86_400_000) : 0;
  const status = String(lead.status || "").toLowerCase();
  const hasEngagement = leadHasEngagementForCleanup(lead);
  const hardStop = ["unsubscribed", "spam", "bounced", "not_interested", "blocked_suppressed"].includes(status);

  if (blockedReasons.length > 0) {
    return {
      eligible: false,
      outcome: "blocked",
      reason: blockedReasons.join(","),
      daysOld,
      lastContactedMs,
      dueAtMs: 0,
      cooldownMonths: 0,
      memoryMonths: 0,
      protectedLead: true,
      blockedReasons,
    };
  }

  if (!lastContactedMs) {
    return {
      eligible: false,
      outcome: "not_due",
      reason: "missing_last_contacted_time",
      daysOld,
      lastContactedMs,
      dueAtMs: 0,
      cooldownMonths: 0,
      memoryMonths: 0,
      protectedLead: false,
      blockedReasons: ["missing_last_contacted_time"],
    };
  }

  if (hardStop) {
    return {
      eligible: true,
      outcome: "suppression_required",
      reason: `hard_stop:${status}`,
      daysOld,
      lastContactedMs,
      dueAtMs: lastContactedMs,
      cooldownMonths: 0,
      memoryMonths: 120,
      protectedLead: false,
      blockedReasons,
    };
  }

  if (status === "replied" || status === "interested") {
    const dueAtMs = lastContactedMs + REPLIED_REVIEW_DAYS * 86_400_000;
    return {
      eligible: nowMs >= dueAtMs,
      outcome: nowMs >= dueAtMs ? "replied_review" : "not_due",
      reason: nowMs >= dueAtMs ? "replied_one_year_review_due" : "replied_keep_until_one_year",
      daysOld,
      lastContactedMs,
      dueAtMs,
      cooldownMonths: 0,
      memoryMonths: REPLIED_MEMORY_MONTHS,
      protectedLead: true,
      blockedReasons,
    };
  }

  if (hasEngagement) {
    const dueAtMs = lastContactedMs + WARM_NO_REPLY_DELETE_DAYS * 86_400_000;
    return {
      eligible: nowMs >= dueAtMs,
      outcome: nowMs >= dueAtMs ? "warm_no_reply" : "not_due",
      reason: nowMs >= dueAtMs ? "warm_no_reply_cleanup_due" : "warm_no_reply_not_due",
      daysOld,
      lastContactedMs,
      dueAtMs,
      cooldownMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
      memoryMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
      protectedLead: false,
      blockedReasons,
    };
  }

  const dueAtMs = lastContactedMs + COLD_NO_REPLY_DELETE_DAYS * 86_400_000;
  return {
    eligible: nowMs >= dueAtMs,
    outcome: nowMs >= dueAtMs ? "cold_no_reply" : "not_due",
    reason: nowMs >= dueAtMs ? "cold_no_reply_cleanup_due" : "cold_no_reply_not_due",
    daysOld,
    lastContactedMs,
    dueAtMs,
    cooldownMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
    memoryMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
    protectedLead: false,
    blockedReasons,
  };
}

function serializeCleanupCandidate(docSnap: any, nowMs = Date.now()) {
  const lead = { id: docSnap.id, ...(docSnap.data() || {}) } as LeadData;
  const decision = getCleanupDecision(lead, nowMs);
  const sourceKind = getLeadSourceKind(lead);
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");

  return {
    leadId: docSnap.id,
    email: emailLower,
    name: lead.name || "",
    company: lead.company_name || "",
    website: lead.website || lead.sheetWebsiteUrl || "",
    service: lead.service || "",
    status: lead.status || "",
    source: lead.source || "",
    sourceKind,
    sheetLinked: sourceKind === "sheet",
    sheetRowNumber: Number(lead.sheetRowNumber || 0) || null,
    openCount: Number(lead.open_count || 0),
    clickCount: Number(lead.click_count || 0),
    followUpCount: Number(lead.follow_up_count || 0),
    lastContactedAt: decision.lastContactedMs ? new Date(decision.lastContactedMs).toISOString() : "",
    dueAt: decision.dueAtMs ? new Date(decision.dueAtMs).toISOString() : "",
    daysOld: decision.daysOld,
    eligible: decision.eligible,
    outcome: decision.outcome,
    reason: decision.reason,
    protectedLead: decision.protectedLead,
    cooldownMonths: decision.cooldownMonths,
    memoryMonths: decision.memoryMonths,
    blockedReasons: decision.blockedReasons,
  };
}

async function handleCleanupCandidates(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const bucket = String(url.searchParams.get("bucket") || "due").toLowerCase();
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 50), 100));
  const nowMs = Date.now();

  // Free-limit friendly: only read older leads that can realistically be near cleanup.
  const oldestNeededDays = bucket === "replied" ? REPLIED_REVIEW_DAYS : bucket === "warm" ? WARM_NO_REPLY_DELETE_DAYS : COLD_NO_REPLY_DELETE_DAYS;
  const threshold = admin.firestore.Timestamp.fromMillis(nowMs - oldestNeededDays * 86_400_000);

  const snap = await adminDb
    .collection("outreach_leads")
    .where("createdAt", "<=", threshold)
    .orderBy("createdAt", "asc")
    .limit(Math.min(max * 4, 300))
    .get();

  let rows = snap.docs.map((docSnap: any) => serializeCleanupCandidate(docSnap, nowMs));

  if (bucket === "due") rows = rows.filter((row: any) => row.eligible && !row.protectedLead);
  if (bucket === "cold") rows = rows.filter((row: any) => row.outcome === "cold_no_reply");
  if (bucket === "warm") rows = rows.filter((row: any) => row.outcome === "warm_no_reply");
  if (bucket === "replied") rows = rows.filter((row: any) => row.outcome === "replied_review");
  if (bucket === "protected") rows = rows.filter((row: any) => row.protectedLead || row.outcome === "suppression_required");
  if (bucket === "upcoming") rows = rows.filter((row: any) => !row.eligible && row.dueAt && row.outcome === "not_due");

  rows = rows.slice(0, max);

  return json({
    success: true,
    bucket,
    checked: snap.size,
    count: rows.length,
    generatedAt: new Date(nowMs).toISOString(),
    policy: {
      coldNoReplyDeleteDays: COLD_NO_REPLY_DELETE_DAYS,
      warmNoReplyDeleteDays: WARM_NO_REPLY_DELETE_DAYS,
      repliedReviewDays: REPLIED_REVIEW_DAYS,
      coldCooldownMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
      warmCooldownMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
    },
    rows,
  });
}

function buildContactMemoryPayload(lead: LeadData, decision: CleanupDecision, actor: string, nowMs = Date.now()) {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  const lastContactedMs = decision.lastContactedMs || getLeadLastContactedMs(lead) || nowMs;
  const cooldownUntilMs =
    decision.cooldownMonths > 0 ? addMonthsMs(lastContactedMs, decision.cooldownMonths) : addMonthsMs(nowMs, 120);
  const memoryExpiresAtMs =
    decision.memoryMonths > 0 ? addMonthsMs(lastContactedMs, decision.memoryMonths) : addMonthsMs(nowMs, 120);

  return {
    emailLower,
    sourceLeadId: lead.id || "",
    companyName: lead.company_name || "",
    website: lead.website || lead.sheetWebsiteUrl || "",
    service: lead.service || "",
    source: lead.source || "",
    lastOutcome: decision.outcome,
    lastContactedAt: admin.firestore.Timestamp.fromMillis(lastContactedMs),
    cooldownUntil: admin.firestore.Timestamp.fromMillis(cooldownUntilMs),
    memoryExpiresAt: admin.firestore.Timestamp.fromMillis(memoryExpiresAtMs),
    openCount: Number(lead.open_count || 0),
    clickCount: Number(lead.click_count || 0),
    followUpCount: Number(lead.follow_up_count || 0),
    cleanupReason: decision.reason,
    createdByCleanupActor: actor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function getSheetIdByTitle(sheets: any, spreadsheetId: string, title = SHEET_NAME): Promise<number | null> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const found = (meta.data.sheets || []).find((sheet: any) => sheet?.properties?.title === title);
  return typeof found?.properties?.sheetId === "number" ? found.properties.sheetId : null;
}

async function findSheetRowNumberForLead(sheets: any, spreadsheetId: string, lead: LeadData): Promise<number> {
  const rows = await loadRows(sheets, spreadsheetId);
  const targetLeadId = clean(lead.id);
  const targetTrackingId = clean(lead.trackingId);
  const targetEmail = normalizeEmail(lead.sheetFinalEmail || lead.emailLower || lead.email || "");
  const targetWebsite = normalizeUrlForSheet(lead.sheetWebsiteUrl || lead.website || "");

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const obj = rowToObject(row, rowNumber);

    if (targetLeadId && clean(obj["Firestore Lead ID"]) === targetLeadId) return rowNumber;
    if (targetTrackingId && clean(obj["Tracking ID"]) === targetTrackingId) return rowNumber;

    const rowEmail = normalizeEmail(obj["Final Email"]);
    const rowWebsite = normalizeUrlForSheet(obj["Website URL"]);
    if (targetEmail && targetWebsite && rowEmail === targetEmail && rowWebsite === targetWebsite) return rowNumber;
  }

  const fallbackRow = Number(lead.sheetRowNumber || 0);
  if (fallbackRow > 1 && rows[fallbackRow - 2]) return fallbackRow;
  return 0;
}

async function deleteOrMarkSheetRowForLead(
  lead: LeadData,
  options: { mode?: "delete" | "mark" | "skip"; actor?: string } = {}
): Promise<{ ok: boolean; mode: string; rowNumber?: number; reason?: string }> {
  const mode = options.mode || "delete";
  if (mode === "skip") return { ok: true, mode: "skip", reason: "sheet_skipped" };
  if (getLeadSourceKind(lead) !== "sheet") return { ok: true, mode: "not_linked", reason: "lead_not_linked_to_sheet" };

  const { sheets, spreadsheetId } = await getSheetsClient();
  await ensureHeaderRow(sheets, spreadsheetId);
  const rowNumber = await findSheetRowNumberForLead(sheets, spreadsheetId, lead);

  if (!rowNumber) return { ok: false, mode, reason: "sheet_row_not_found" };

  if (mode === "mark") {
    const existing = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
    await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
      ...existing,
      "Archive Status": "Deleted",
      "Send Status": "Deleted",
      "Queue Lock ID": "",
      "Queue Locked At": "",
      "Queue Attempt ID": "",
      Notes: `Deleted from Firebase with footprint memory by ${options.actor || "admin"} at ${nowDhaka()}`,
    });
    return { ok: true, mode: "mark", rowNumber };
  }

  const sheetId = await getSheetIdByTitle(sheets, spreadsheetId);
  if (sheetId === null) return { ok: false, mode, rowNumber, reason: "sheet_id_not_found" };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  return { ok: true, mode: "delete", rowNumber };
}

async function saveFootprintBeforeDelete(lead: LeadData, decision: CleanupDecision, actor: string) {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  if (!isValidEmail(emailLower)) throw new ApiError("Cannot save footprint: invalid email", 400);

  const status = String(lead.status || "").toLowerCase();
  if (["unsubscribed", "spam", "bounced", "not_interested", "blocked_suppressed"].includes(status)) {
    await addSuppression(emailLower, status || "suppressed_by_cleanup", {
      sourceLeadId: lead.id || "",
      cleanupReason: decision.reason,
      createdByCleanupActor: actor,
    });
  }

  await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).set(
    buildContactMemoryPayload(lead, decision, actor),
    { merge: true }
  );
}

async function handleCleanupDeleteFullKeepMemory(req: Request) {
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 50)
    : [];

  if (!ids.length) throw new ApiError("Select at least one cleanup candidate", 400);

  const actor = normalizeEmail(adminUser.email || "admin");
  const sheetMode = ["delete", "mark", "skip"].includes(String(body.sheetMode || "delete")) ? String(body.sheetMode || "delete") as "delete" | "mark" | "skip" : "delete";
  const force = body.force === true;
  const dryRun = body.dryRun === true;

  const results: any[] = [];

  for (const leadId of ids) {
    const ref = adminDb.collection("outreach_leads").doc(leadId);
    const snap = await ref.get();

    if (!snap.exists) {
      results.push({ leadId, ok: false, reason: "lead_not_found" });
      continue;
    }

    const lead = { id: snap.id, ...(snap.data() || {}) } as LeadData;
    const decision = getCleanupDecision(lead);
    if ((!decision.eligible || decision.protectedLead) && !force) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: decision.reason, decision });
      continue;
    }

    if (isCleanupProcessingBlocked(lead).length > 0) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: "processing_or_locked", blockers: isCleanupProcessingBlocked(lead) });
      continue;
    }

    if (dryRun) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: true, dryRun: true, decision });
      continue;
    }

    try {
      await saveFootprintBeforeDelete(lead, decision, actor);
      const sheetResult = await deleteOrMarkSheetRowForLead(lead, { mode: sheetMode, actor });
      await ref.delete();

      results.push({
        leadId,
        email: lead.emailLower || lead.email || "",
        ok: true,
        outcome: decision.outcome,
        sheet: sheetResult,
        message: "Full lead deleted after footprint memory was saved.",
      });
    } catch (error: any) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: error?.message || String(error) });
    }
  }

  const deletedCount = results.filter((item) => item.ok && !item.dryRun).length;
  await writeCronStatus("manualCleanup", {
    success: true,
    checked: ids.length,
    deletedCount,
    failedCount: results.filter((item) => !item.ok).length,
    lastError: "",
    source: "dashboard_manual_button",
  });

  return json({ success: true, count: results.length, deletedCount, results });
}

async function handleCleanupSkip(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 100)
    : [];
  const days = Math.max(1, Math.min(Number(body.days || 30), 365));
  if (!ids.length) throw new ApiError("Select at least one lead", 400);

  const skippedUntil = admin.firestore.Timestamp.fromMillis(Date.now() + days * 86_400_000);
  const count = await updateLeadsInChunks(ids, () => ({
    cleanupSkippedUntil: skippedUntil,
    cleanupReason: `skipped_${days}_days`,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, count, message: `Skipped ${count} lead(s) for ${days} days.` });
}

async function handleCleanupProtect(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 100)
    : [];
  const reason = String(body.reason || "protected_by_admin").slice(0, 120);
  if (!ids.length) throw new ApiError("Select at least one lead", 400);

  const count = await updateLeadsInChunks(ids, () => ({
    lifecycleStatus: "protected",
    cleanupProtected: true,
    cleanupReason: reason,
    stopAutomation: true,
    nextFollowupStatus: "blocked",
    nextFollowupReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, count, message: `Protected ${count} lead(s).` });
}

async function handleCleanupManualRun(req: Request) {
  // Manual button version of cleanup automation: returns candidates without deleting anything.
  // বাংলা ব্যাখ্যা: Cron deploy করার আগে dashboard থেকে এই button দিয়ে due list refresh করা যাবে।
  return await handleCleanupCandidates(req);
}

/** GET /api/trackflow/scheduled-emails */
async function handleScheduledEmailsGet(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const status = String(url.searchParams.get("status") || "scheduled").trim() || "scheduled";

  const snap = await adminDb
    .collection("outreach_leads")
    .where("status", "==", status)
    .limit(max)
    .get();

  const rows = snap.docs
    .map(serializeScheduledLead)
    .sort((a: any, b: any) => Number(a.scheduledAt || 0) - Number(b.scheduledAt || 0));

  return json({ success: true, status, count: rows.length, rows });
}

/** PATCH /api/trackflow/scheduled-emails */
async function handleScheduledEmailsPatch(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const leadId = String(body.leadId || body.id || "").trim();
  const action = String(body.action || "update").trim().toLowerCase();

  if (!leadId) throw new ApiError("leadId is required", 400);

  const ref = adminDb.collection("outreach_leads").doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError("Scheduled lead not found", 404);

  const current = snap.data() as LeadData;
  if (String(current.status || "") !== "scheduled") {
    throw new ApiError("Only scheduled emails can be edited or queued for immediate send", 400);
  }

  if (action === "send_soon" || action === "send_now") {
    await ref.update({
      scheduledAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(),
    });
    return json({ success: true, message: "Scheduled email moved to the immediate-send queue. The scheduled-initials cron will send it on the next run." });
  }

  const updates: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    error: admin.firestore.FieldValue.delete(),
  };

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const nextEmailLower = normalizeEmail(String(body.email || ""));
    if (!isValidEmail(nextEmailLower)) throw new ApiError("Invalid target email", 400);

    const suppressed = await isSuppressed(nextEmailLower);
    if (suppressed) throw new ApiError(`Email is suppressed: ${suppressed.reason || "blocked"}`, 409);

    if (nextEmailLower !== normalizeEmail(current.emailLower || current.email || "")) {
      const duplicateSnap = await adminDb.collection("outreach_leads").where("emailLower", "==", nextEmailLower).limit(5).get();
      const duplicate = duplicateSnap.docs.find((item: any) => item.id !== leadId && !["failed", "cancelled", "blocked_daily_limit"].includes(String((item.data() || {}).status || "")));
      if (duplicate) throw new ApiError("Duplicate email already exists in outreach leads.", 409);
    }

    updates.email = String(body.email || "").trim();
    updates.emailLower = nextEmailLower;
    updates.sheetFinalEmail = String(body.email || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "clientName") || Object.prototype.hasOwnProperty.call(body, "name")) {
    updates.name = String(body.clientName || body.name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "companyName") || Object.prototype.hasOwnProperty.call(body, "company_name")) {
    updates.company_name = String(body.companyName || body.company_name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "website")) {
    updates.website = String(body.website || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "businessType") || Object.prototype.hasOwnProperty.call(body, "business_type")) {
    updates.business_type = String(body.businessType || body.business_type || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "selectedService") || Object.prototype.hasOwnProperty.call(body, "service")) {
    const service = body.selectedService || body.service;
    if (!SERVICES.has(service)) throw new ApiError("Invalid service", 400);
    updates.service = service;
  }

  if (Object.prototype.hasOwnProperty.call(body, "senderId") || Object.prototype.hasOwnProperty.call(body, "sender_id")) {
    const sender = getSenderById(String(body.senderId || body.sender_id || ""));
    if (!sender) throw new ApiError("Invalid sender selected", 400);
    const apiSender = mapSharedSender(sender);
    updates.sender_id = apiSender.id || "";
    updates.sender_email = apiSender.email;
    updates.sender_name = apiSender.name;
    updates.reply_to_email = apiSender.replyToEmail || DEFAULT_REPLY_TO_EMAIL;
    updates.reply_to_name = apiSender.replyToName || apiSender.name || DEFAULT_REPLY_TO_NAME;
    updates.sender_daily_limit = apiSender.dailyLimit || DEFAULT_DAILY_LIMIT;
  }

  if (Object.prototype.hasOwnProperty.call(body, "subject")) {
    const subject = String(body.subject || "").trim();
    if (!subject) throw new ApiError("Subject is required", 400);
    updates.subject = subject;
  }

  if (Object.prototype.hasOwnProperty.call(body, "message")) {
    const message = String(body.message || "").trim();
    if (!plainTextFromHtml(message)) throw new ApiError("Message body cannot be empty", 400);
    updates.message = stripDangerousHtml(message);
  }

  if (Object.prototype.hasOwnProperty.call(body, "scheduledAt")) {
    const scheduledAt = timestampFromAny(body.scheduledAt);
    if (!scheduledAt) throw new ApiError("Invalid scheduledAt", 400);
    if (scheduledAt.toMillis() <= Date.now() + 30_000) {
      throw new ApiError("Scheduled time must be at least 30 seconds in the future. Use Send Soon for immediate sending.", 400);
    }
    updates.scheduledAt = scheduledAt;
  }

  if (Object.prototype.hasOwnProperty.call(body, "includeSignature")) {
    updates.include_signature = body.includeSignature !== false;
  }
  if (Object.prototype.hasOwnProperty.call(body, "signatureMode") || Object.prototype.hasOwnProperty.call(body, "signature_mode")) {
    updates.signatureMode = normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full");
  }

  if (Object.prototype.hasOwnProperty.call(body, "reportUrl")) {
    const rawReportUrl = String(body.reportUrl || "").trim();
    const reportUrl = sanitizeOptionalUrl(rawReportUrl);
    if (rawReportUrl && !reportUrl) throw new ApiError("Invalid report URL", 400);
    updates.reportUrl = reportUrl;
  }

  if (Object.prototype.hasOwnProperty.call(body, "reportButtonText")) {
    updates.reportButtonText = String(body.reportButtonText || "View short audit note").trim().slice(0, 80);
  }

  await ref.update(updates);
  const updated = await ref.get();
  return json({ success: true, message: "Scheduled email updated", lead: serializeScheduledLead(updated) });
}

async function handleAdminMarkLeadReplied(req: Request) {
  /**
   * ADMIN WRITE THROUGH BACKEND
   * বাংলা ব্যাখ্যা: Dashboard থেকে direct Firestore write না করে backend API দিয়ে lead replied করা হয়।
   * এতে admin auth/validation backend-এ থাকে, কিন্তু Firestore write count আগের মতোই প্রায় একই থাকে।
   */
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const leadId = String(body.leadId || body.id || "").trim();
  if (!leadId) throw new ApiError("leadId is required", 400);

  const ref = adminDb.collection("outreach_leads").doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError("Lead not found", 404);

  await ref.update({
    status: "replied",
    stopAutomation: true,
    repliedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextFollowupStatus: "blocked",
    nextFollowupReason: "manual_marked_replied",
    nextFollowupAt: admin.firestore.FieldValue.delete(),
    nextFollowupStep: admin.firestore.FieldValue.delete(),
    automationLock: admin.firestore.FieldValue.delete(),
    manualUpdatedBy: normalizeEmail(adminUser.email || "admin"),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return json({ success: true, leadId, status: "replied" });
}

function normalizeFollowupConfigForSave(body: any): Record<string, any> {
  const rawConfig = body?.config && typeof body.config === "object" ? body.config : body;
  const payload: Record<string, any> = {};

  for (const service of SERVICES) {
    const serviceConfig = rawConfig?.[service];
    if (!serviceConfig || typeof serviceConfig !== "object") continue;

    payload[service] = {};
    for (let stepNumber = 1; stepNumber <= 5; stepNumber += 1) {
      const stepKey = `step${stepNumber}`;
      const stepConfig = serviceConfig?.[stepKey] || {};
      const variantsRaw = Array.isArray(stepConfig.variants) ? stepConfig.variants : [];
      const variants = variantsRaw
        .map((variant: any, index: number) => ({
          id: String(variant?.id || `V${index + 1}`).slice(0, 50),
          content: stripDangerousHtml(String(variant?.content || "")).slice(0, 12000),
        }))
        .filter((variant: any) => plainTextFromHtml(variant.content));

      payload[service][stepKey] = {
        variants: variants.length > 0 ? variants : [{ id: "V1", content: "" }],
        delay: Math.max(1, Math.min(Number(stepConfig.delay || 1440), 60 * 24 * 30)),
      };
    }
  }

  payload.daily_followup_limit = Math.max(1, Math.min(Number(body?.daily_followup_limit || body?.dailyFollowupLimit || 50), 500));
  payload.followup_batch_per_run = Math.max(1, Math.min(Number(body?.followup_batch_per_run || body?.followupBatchPerRun || 5), MAX_FOLLOWUP_BATCH_PER_RUN));
  payload.followup_trigger_mode = "open_required";
  payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  return payload;
}

async function handleSaveFollowupConfig(req: Request) {
  /**
   * FOLLOW-UP SETTINGS SAVE
   * বাংলা ব্যাখ্যা: Follow-up template/settings frontend থেকে সরাসরি Firestore-এ না গিয়ে backend দিয়ে save হয়।
   * Sender config এখানে save হয় না; sender source সবসময় lib/senders.ts.
   */
  await requireAdmin(req);
  const body = await readJson(req);
  const payload = normalizeFollowupConfigForSave(body);

  await adminDb.collection("automation_settings").doc("followup_config").set(payload, { merge: true });

  return json({
    success: true,
    message: "Follow-up settings saved through backend API.",
    dailyFollowupLimit: payload.daily_followup_limit,
    batchPerRun: payload.followup_batch_per_run,
  });
}

async function handleAdminHealth(req: Request) {
  await requireAdmin(req);

  const cronSnap = await adminDb.collection("system_status").doc("cron").get().catch(() => null);
  const cronStatus = cronSnap?.exists ? cronSnap.data() || {} : {};

  const requiredEnv = [
    "BREVO_API_KEY",
    "CRON_SECRET",
    "BREVO_WEBHOOK_SECRET",
    "REPLY_WEBHOOK_SECRET",
    "UNSUBSCRIBE_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "ALLOWED_ADMIN_EMAILS",
    "GOOGLE_SHEET_ID",
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "REPORT_REGISTER_SECRET",
  ];

  return json({
    success: true,
    mode: "free_limit_friendly",
    senderSource: "lib/senders.ts",
    sheetRole: "lead_queue_and_status_mirror_only",
    automationSource: "Firestore outreach_leads",
    sheetLockMode: "google_sheet_columns",
    cronStatus,
    env: requiredEnv.reduce((acc: Record<string, boolean>, key) => {
      acc[key] = Boolean(process.env[key]);
      return acc;
    }, {}),
    notes: [
      "Sender emails are not loaded from Firebase.",
      "Sheet queue locks are stored in Google Sheet columns, not a Firestore lock collection.",
      "Follow-up timing remains based on Firestore open/click timestamps.",
    ],
  });
}


async function handleReportHealth(req: Request) {
  await requireReportRegisterAccess(req);
  return json({
    success: true,
    action: "reports/health",
    reportRegisterReady: true,
    appBaseUrl: appBaseUrl(),
    requiredLocalRegisterUrl: `${appBaseUrl()}/api/trackflow/reports/register`,
    env: {
      NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      REPORT_REGISTER_SECRET: Boolean(process.env.REPORT_REGISTER_SECRET),
      GOOGLE_SHEET_ID: Boolean(process.env.GOOGLE_SHEET_ID),
      GOOGLE_CLIENT_EMAIL: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
      GOOGLE_PRIVATE_KEY: Boolean(process.env.GOOGLE_PRIVATE_KEY),
    },
  });
}

async function handleError(error: any) {
  console.error("TrackFlow API Error:", error);
  if (error instanceof ApiError) return json({ success: false, error: error.message }, error.status);
  return json({ success: false, error: "Internal Server Error" }, 500);
}

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (["reports/register", "report/register", "reports/upsert", "reports/create"].includes(action)) return await handleReportRegister(req);
    if (action === "reports/view") return await handleReportView(req);
    if (action === "send-email") return await handleSendInitial(req);
    if (action === "sheets/leads") return await handleSheetLeadsPost(req);
    if (action === "webhooks/brevo") return await handleBrevoWebhook(req);
    if (action === "webhooks/reply") return await handleReplyWebhook(req);
    if (action === "automation/followups/config") return await handleSaveFollowupConfig(req);
    if (action === "automation/followups/release-template-blocked") return await handleReleaseTemplateBlockedFollowups(req);
    if (action === "admin/leads/mark-replied") return await handleAdminMarkLeadReplied(req);
    if (action === "scheduled-emails/send-now") return await handleScheduledEmailsPatch(req);
    if (action === "leads/bulk-action") return await handleLeadsBulkAction(req);
    if (action === "system/cleanup") return await handleSystemCleanup(req);
    if (action === "cleanup/delete-full-keep-memory") return await handleCleanupDeleteFullKeepMemory(req);
    if (action === "cleanup/skip") return await handleCleanupSkip(req);
    if (action === "cleanup/protect") return await handleCleanupProtect(req);
    if (action === "cleanup/manual-run") return await handleCleanupManualRun(req);
    if (action === "unsubscribe") return await handleUnsubscribePost(req);

    return json({ success: false, error: `Unknown POST action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function GET(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "reports/health") return await handleReportHealth(req);
    if (action === "reports/view") return await handleReportView(req);
    if (action === "reports/preview") return await handleReportPreview(req);
    if (action === "reports/download") return await handleReportDownload(req);
    if (action === "reports/cta") return await handleReportCta(req);
    if (action === "cron/scheduled-initials") return await handleCronScheduledInitials(req);
    if (action === "cron/sheet-queued-sends") return await handleCronSheetQueuedSends(req);
    if (action === "cron/followups") return await handleCronFollowups(req);
    if (action === "cron/recover-locks") return await handleCronRecoverLocks(req);
    if (action === "automation/followups/dry-run") return await handleFollowupDryRun(req);
    if (action === "automation/followups/summary") return await handleFollowupSummary(req);
    if (action === "postmaster/health") return await handlePostmasterHealth(req);
    if (action === "admin/health") return await handleAdminHealth(req);
    if (action === "unsubscribe") return await handleUnsubscribeGet(req);
    if (action === "sheets/leads") return await handleSheetLeadsGet(req);
    if (action === "scheduled-emails") return await handleScheduledEmailsGet(req);
    if (action === "leads") return await handleLeadsGet(req);
    if (action === "system/usage-summary") return await handleUsageSummary(req);
    if (action === "cleanup/candidates") return await handleCleanupCandidates(req);

    if (action === "health" || action === "") {
      if (isProductionEnv()) {
        return json({
          success: true,
          service: "TrackFlowPro API",
          status: "ok",
        });
      }

      return json({
        success: true,
        service: "TrackFlowPro Single API Route",
        actions: [
          "POST /api/trackflow/send-email",
          "POST /api/trackflow/reports/register",
          "GET /api/trackflow/reports/view?token=...",
          "GET /api/trackflow/reports/preview?token=...",
          "GET /api/trackflow/reports/download?token=...",
          "GET /api/trackflow/reports/cta?token=...&target=/contact",
          "GET /api/trackflow/sheets/leads",
          "POST /api/trackflow/sheets/leads",
          "PATCH /api/trackflow/sheets/leads",
          "GET /api/trackflow/scheduled-emails",
          "PATCH /api/trackflow/scheduled-emails",
          "POST /api/trackflow/scheduled-emails/send-now",
          "GET /api/trackflow/leads",
          "POST /api/trackflow/leads/bulk-action",
          "GET /api/trackflow/system/usage-summary",
          "POST /api/trackflow/system/cleanup",
          "GET /api/trackflow/cleanup/candidates",
          "POST /api/trackflow/cleanup/manual-run",
          "POST /api/trackflow/cleanup/delete-full-keep-memory",
          "POST /api/trackflow/cleanup/skip",
          "POST /api/trackflow/cleanup/protect",
          "DELETE /api/trackflow/send-email?leadId=...",
          "GET /api/trackflow/cron/scheduled-initials",
          "GET /api/trackflow/cron/sheet-queued-sends",
          "GET /api/trackflow/cron/followups",
          "GET /api/trackflow/cron/recover-locks",
          "GET /api/trackflow/automation/followups/dry-run",
          "GET /api/trackflow/automation/followups/summary",
          "POST /api/trackflow/automation/followups/config",
          "POST /api/trackflow/automation/followups/release-template-blocked",
          "POST /api/trackflow/admin/leads/mark-replied",
          "GET /api/trackflow/admin/health",
          "GET /api/trackflow/postmaster/health",
          "POST /api/trackflow/webhooks/brevo",
          "POST /api/trackflow/webhooks/reply",
          "GET /api/trackflow/unsubscribe",
          "POST /api/trackflow/unsubscribe",
        ],
      });
    }

    return json({ success: false, error: `Unknown GET action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}


export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "sheets/leads") return await handleSheetLeadsPatch(req);
    if (action === "scheduled-emails") return await handleScheduledEmailsPatch(req);

    return json({ success: false, error: `Unknown PATCH action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "send-email") return await handleCancelInitial(req);

    return json({ success: false, error: `Unknown DELETE action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}
