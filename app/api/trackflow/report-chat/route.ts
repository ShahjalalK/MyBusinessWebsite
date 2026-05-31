// ============================================================
// FILE: app/api/trackflow/report-chat/route.ts
// Purpose: Validated Gemini assistant for private tracking-review pages.
// Also supports admin-only Chat Insights reads/actions.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import {
  buildDeterministicAnswer,
  buildGeminiPrompt,
  buildSafeFallbackAnswer,
  cleanQuestion,
  extractReportChatContext,
  isQuotaLikeError,
  normalizeChatHistory,
  normalizeSlug,
  normalizeToken,
  streamGeminiChunks,
  validateAssistantAnswer,
  type AnyRecord,
} from "@/lib/trackflow-ai/report-chat";
import {
  createChatSessionId,
  isReportChatLoggingConfigured,
  listReportChatSessions,
  loadReportChatMessages,
  loadReportChatQuestions,
  markReportPdfDownloaded,
  logReportChatMessages,
  logReportChatSession,
  markReportChatSessionReviewed,
  type ReportChatVisitInfo,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PREMIUM_CHAT_FORMAT_INSTRUCTIONS = `
Premium chat formatting rules:
- Answer in polished English only.
- Keep the answer short, calm, and client-friendly.
- Use clear spacing with short section labels when helpful:
  Short answer:
  What this means:
  What to verify next:
  Important note:
- Use simple hyphen bullets or numbered steps when listing items.
- Do not use Markdown bold markers, tables, code blocks, emojis, or long wall-of-text paragraphs.
- Do not invent evidence. Do not claim final account-level truth without approved access.
`.trim();

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  BD: "Bangladesh",
  IN: "India",
  PK: "Pakistan",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  MY: "Malaysia",
  SG: "Singapore",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
};

function jsonError(message: string, status = 400, extra: AnyRecord = {}) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      message,
      error: message,
      ...extra,
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function jsonOk(payload: AnyRecord = {}) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...payload,
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function makeTextStream(text: string, onDone?: () => Promise<void>) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const parts = String(text || "")
          .split(/(\n\n|(?<=\.)\s+)/g)
          .filter(Boolean);

        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
        }
      } finally {
        controller.close();

        if (onDone) {
          try {
            await onDone();
          } catch {
            // Optional logging should never break the response.
          }
        }
      }
    },
  });
}

function streamResponse(
  stream: ReadableStream<Uint8Array>,
  mode: string,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
      "x-trackflow-chat-mode": mode,
      ...extraHeaders,
    },
  });
}

function isStableUuid(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function getReportSessionCookieName(token: string): string {
  const cleanToken = normalizeToken(token || "unknown") || "unknown";
  return `tfp_chat_session_${cleanToken.slice(0, 64)}`;
}

function makeReportSessionCookie(token: string, sessionId: string): string {
  const name = getReportSessionCookieName(token);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAgeSeconds = 60 * 60 * 24 * 180;

  return `${encodeURIComponent(name)}=${encodeURIComponent(sessionId)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function getReportSessionCookieHeaders(token: string, sessionId: string): Record<string, string> {
  if (!token || !isStableUuid(sessionId)) return {};
  return { "set-cookie": makeReportSessionCookie(token, sessionId) };
}

function setReportSessionCookie(response: NextResponse, token: string, sessionId: string): NextResponse {
  if (!token || !isStableUuid(sessionId)) return response;

  response.cookies.set({
    name: getReportSessionCookieName(token),
    value: sessionId,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
  });

  return response;
}

function uuidFromHash(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 32);
  const variantNibble = ((parseInt(hex[16] || "8", 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variantNibble}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function getStableRequestFingerprint(req: NextRequest, token: string): string {
  return [
    normalizeToken(token || "unknown") || "unknown",
    req.headers.get("user-agent") || "",
    req.headers.get("accept-language") || "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    req.headers.get("x-real-ip") || "",
    req.headers.get("cf-connecting-ip") || "",
  ].join("|");
}

function resolveStableReportSessionId(req: NextRequest, token: string, rawSessionId?: unknown): string {
  const bodyValue = String(rawSessionId || "").trim();
  if (isStableUuid(bodyValue)) return bodyValue;

  const cookieValue = req.cookies.get(getReportSessionCookieName(token))?.value || "";
  if (isStableUuid(cookieValue)) return String(cookieValue).trim();

  return uuidFromHash(getStableRequestFingerprint(req, token));
}


async function loadReportByToken(token: string): Promise<AnyRecord | null> {
  try {
    const snap = await adminDb.collection("audit_reports").doc(token).get();
    if (snap.exists) return snap.data() || {};
  } catch {
    return null;
  }

  return null;
}

type AdminCheckResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

function cleanHeader(value: string | null, maxLength = 120): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanCountryCode(value: string | null): string {
  const code = cleanHeader(value, 8).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  if (code === "XX" || code === "ZZ") return "";
  return code;
}

function decodeLocationHeader(value: string | null, maxLength = 120): string {
  const cleaned = cleanHeader(value, maxLength);
  if (!cleaned) return "";

  try {
    return decodeURIComponent(cleaned.replace(/\+/g, " ")).slice(0, maxLength);
  } catch {
    return cleaned;
  }
}

function getCountryName(countryCode: string): string {
  const code = cleanCountryCode(countryCode);
  if (!code) return "";

  return COUNTRY_NAMES[code] || code;
}

function isLocalHostname(value: string): boolean {
  const host = String(value || "").toLowerCase().trim();

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  );
}

function getHeaderHostname(value: string | null): string {
  const raw = cleanHeader(value, 500);
  if (!raw) return "";

  try {
    return new URL(raw).hostname;
  } catch {
    return "";
  }
}

function isLocalDashboardRequest(req: NextRequest): boolean {
  // Local development can accidentally call the deployed API if an app URL env points
  // to production. In that case the request host is production, but Origin/Referer
  // still reveals localhost. Treat it as local test data instead of saving a
  // misleading edge-network country.
  const requestHost = String(req.nextUrl.hostname || "").toLowerCase();
  const originHost = getHeaderHostname(req.headers.get("origin"));
  const refererHost = getHeaderHostname(req.headers.get("referer"));

  return isLocalHostname(requestHost) || isLocalHostname(originHost) || isLocalHostname(refererHost);
}

function getTrustedEdgeCountryCode(req: NextRequest): string {
  // Use trusted edge-provider headers only. Avoid generic x-country-code because it
  // can be client/proxy supplied and can make the dashboard look more certain than it is.
  return cleanCountryCode(req.headers.get("x-vercel-ip-country")) || cleanCountryCode(req.headers.get("cf-ipcountry"));
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("crios/")) return "Chrome iOS";
  if (ua.includes("chrome/") || ua.includes("chromium/")) return "Chrome";
  if (ua.includes("safari/")) return "Safari";

  return "Unknown";
}

function detectOs(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  return "Unknown";
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile";

  return "Desktop";
}

function getVisitInfo(req: NextRequest): ReportChatVisitInfo {
  const userAgent = cleanHeader(req.headers.get("user-agent"), 600);

  if (isLocalDashboardRequest(req)) {
    return {
      countryCode: "",
      countryName: "Local test",
      region: "",
      city: "",
      deviceType: detectDeviceType(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOs(userAgent),
    };
  }

  const countryCode = getTrustedEdgeCountryCode(req);
  const countryName = getCountryName(countryCode);

  return {
    countryCode,
    countryName: countryName || "Unknown",
    region: decodeLocationHeader(req.headers.get("x-vercel-ip-country-region"), 120),
    city: decodeLocationHeader(req.headers.get("x-vercel-ip-city"), 120),
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
  };
}

function buildSecureReportUrl(
  req: NextRequest,
  context: {
    reportUrl?: unknown;
    domainSlug?: unknown;
  },
  token: string,
): string {
  const existingReportUrl = String(context.reportUrl || "").trim();
  const domainSlug = String(context.domainSlug || "").trim();

  if (existingReportUrl) return existingReportUrl;
  if (!domainSlug || !token) return "";

  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.TRACKFLOW_APP_URL ||
    process.env.APP_URL ||
    req.nextUrl.origin;

  const base = String(envBase || "").replace(/\/+$/, "");
  return `${base}/tracking-review/${domainSlug}/${token}`;
}

async function handlePdfDownloadRedirect(req: NextRequest) {
  const token = normalizeToken(req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("reportToken"));
  const fallbackUrl = new URL("/", req.nextUrl.origin);

  if (!token) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  const report = await loadReportByToken(token);

  if (!report || report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, {
      disableChat: true,
    });
  }

  const context = extractReportChatContext(report, token);

  try {
    await markReportPdfDownloaded({
      reportToken: token,
      domainSlug: context.domainSlug,
      domain: context.domain,
      companyName: context.companyName,
      reportUrl: buildSecureReportUrl(req, context, token),
    });
  } catch {
    // Activity tracking must never block the secure PDF download.
  }

  const downloadUrl = new URL(`/api/trackflow/reports/download?token=${encodeURIComponent(token)}`, req.nextUrl.origin);
  return NextResponse.redirect(downloadUrl, { status: 302 });
}

async function requireChatInsightsAdmin(req: NextRequest): Promise<AdminCheckResult> {
  const header = req.headers.get("authorization") || "";
  const idToken = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

  if (!idToken) {
    return { ok: false, message: "Admin login required." };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = String(decoded.email || "").trim().toLowerCase();
    const allowedEmails = String(process.env.ALLOWED_ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!email || !allowedEmails.includes(email)) {
      return { ok: false, message: "Admin access required." };
    }

    return { ok: true, email };
  } catch {
    return { ok: false, message: "Please login again." };
  }
}

async function handleAdminGet(req: NextRequest) {
  const adminCheck = await requireChatInsightsAdmin(req);

  if (!adminCheck.ok) {
    return jsonError(adminCheck.message, 401, {
      sessions: [],
      messages: [],
      disableChat: true,
    });
  }

  const limit = Math.max(1, Math.min(250, Number(req.nextUrl.searchParams.get("limit") || 100)));
  const search = String(req.nextUrl.searchParams.get("search") || "").trim();
  const reportToken = normalizeToken(
    req.nextUrl.searchParams.get("reportToken") || req.nextUrl.searchParams.get("token"),
  );
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();

  if (rawSessionId && reportToken) {
    const transcriptLimit = Math.min(limit, 100);

    let messages = await loadReportChatQuestions({
      sessionId: rawSessionId,
      reportToken,
      limit: transcriptLimit,
    });

    if (!messages.length) {
      messages = await loadReportChatQuestions({
        reportToken,
        limit: transcriptLimit,
      });
    }

    return jsonOk({
      messages,
      sessionId: rawSessionId,
      reportToken,
      transcriptMode: "questions_only",
      loggingConfigured: isReportChatLoggingConfigured(),
    });
  }

  const sessions = await listReportChatSessions({
    reportToken: reportToken || undefined,
    search,
    limit,
  });

  return jsonOk({
    sessions,
    loggingConfigured: isReportChatLoggingConfigured(),
  });
}

async function handleAdminPost(req: NextRequest, body: AnyRecord) {
  const adminCheck = await requireChatInsightsAdmin(req);

  if (!adminCheck.ok) {
    return jsonError(adminCheck.message, 401, {
      disableChat: true,
    });
  }

  const action = String(body.action || body.adminAction || "").trim().toLowerCase();

  if (action === "mark_reviewed" || action === "mark-reviewed" || action === "reviewed") {
    const rawSessionId = String(body.sessionId || body.session_id || "").trim();
    const reportToken = normalizeToken(body.reportToken || body.report_token || body.token);

    if (!rawSessionId || !reportToken) {
      return jsonError("Missing chat session or report token.", 400);
    }

    const sessionId = createChatSessionId(rawSessionId);
    const reviewedAt = new Date().toISOString();

    await markReportChatSessionReviewed({
      sessionId,
      reportToken,
    });

    return jsonOk({
      status: "Conversation marked as reviewed.",
      sessionId,
      reportToken,
      reviewedAt,
    });
  }

  return jsonError("Unsupported Chat Insights admin action.", 400);
}

async function logSafely(input: {
  sessionId: string;
  reportToken: string;
  question: string;
  answer: string;
  mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error";
  status?: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
  visit?: ReportChatVisitInfo;
}) {
  try {
    await logReportChatMessages(input);
  } catch {
    // Optional logging only.
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("activity") === "pdf_download") {
    return handlePdfDownloadRedirect(req);
  }

  if (req.nextUrl.searchParams.get("admin") === "1") {
    return handleAdminGet(req);
  }

  const token = normalizeToken(req.nextUrl.searchParams.get("token"));
  const domainSlug = normalizeSlug(req.nextUrl.searchParams.get("domainSlug"));
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();

  if (!token) {
    return jsonError("Missing report token.", 400, { messages: [], disableChat: true });
  }

  const stableSessionId = resolveStableReportSessionId(req, token, rawSessionId);

  const report = await loadReportByToken(token);

  if (!report || report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, {
      messages: [],
      disableChat: true,
    });
  }

  const context = extractReportChatContext(report, token);

  if (domainSlug && context.domainSlug && domainSlug !== context.domainSlug) {
    return jsonError("This chat request does not match the private report URL.", 403, {
      messages: [],
      disableChat: true,
    });
  }

  const sessionId = stableSessionId;
  const messages = await loadReportChatMessages({
    sessionId,
    reportToken: token,
    limit: 60,
  });

  return setReportSessionCookie(
    jsonOk({
      messages,
      sessionId,
      loggingConfigured: isReportChatLoggingConfigured(),
    }),
    token,
    sessionId,
  );
}

export async function POST(req: NextRequest) {
  let body: AnyRecord = {};

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid chat request.", 400);
  }

  if (
    req.nextUrl.searchParams.get("admin") === "1" ||
    body.admin === true ||
    body.adminMode === true ||
    Boolean(body.adminAction) ||
    Boolean(body.action)
  ) {
    return handleAdminPost(req, body);
  }

  const token = normalizeToken(body.token || body.reportToken || body.report_token);
  const domainSlug = normalizeSlug(body.domainSlug || body.domain_slug);
  const question = cleanQuestion(body.question);
  const history = normalizeChatHistory(body.history);
  const rawSessionId = String(body.sessionId || body.session_id || "").trim();
  const sessionId = token ? resolveStableReportSessionId(req, token, rawSessionId) : createChatSessionId(rawSessionId);
  const sessionCookieHeaders = getReportSessionCookieHeaders(token, sessionId);

  if (!token) {
    return jsonError("Missing report token.", 400, { disableChat: true });
  }

  if (!question || question.length < 2) {
    return jsonError("Please ask a short question about this tracking review.", 400);
  }

  const report = await loadReportByToken(token);

  if (!report) {
    return jsonError("This report could not be loaded right now.", 503);
  }

  if (report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, { disableChat: true });
  }

  const context = extractReportChatContext(report, token);

  if (domainSlug && context.domainSlug && domainSlug !== context.domainSlug) {
    return jsonError("This chat request does not match the private report URL.", 403, { disableChat: true });
  }

  const visit = getVisitInfo(req);
  const reportUrl = buildSecureReportUrl(req, context, token);

  try {
    await logReportChatSession({
      sessionId,
      reportToken: token,
      domainSlug: context.domainSlug,
      domain: context.domain,
      companyName: context.companyName,
      reportUrl,
      visit,
    });
  } catch {
    // Optional logging only.
  }

  const deterministic = buildDeterministicAnswer(context, question);

  if (deterministic) {
    const answer = validateAssistantAnswer(deterministic, context, question);

    return streamResponse(
      makeTextStream(answer, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode: "smart_fallback",
          status: "deterministic_answer",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "deterministic_answer",
      sessionCookieHeaders,
    );
  }

  if (!GEMINI_API_KEY) {
    const fallback = validateAssistantAnswer(buildSafeFallbackAnswer(context, question), context, question);

    return streamResponse(
      makeTextStream(fallback, async () => {
        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer: fallback,
          mode: "smart_fallback",
          status: "missing_gemini_api_key",
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }),
      "smart_fallback",
      sessionCookieHeaders,
    );
  }

  const prompt = `${buildGeminiPrompt({ context, question, history })}\n\n${PREMIUM_CHAT_FORMAT_INSTRUCTIONS}`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error" = "gemini_stream";
      let status = "ok";
      let answer = "";

      try {
        const chunks: string[] = [];

        for await (const chunk of streamGeminiChunks({
          prompt,
          apiKey: GEMINI_API_KEY,
          model: GEMINI_MODEL,
        })) {
          chunks.push(chunk);
        }

        const joined = chunks.join("").trim();
        answer = validateAssistantAnswer(joined, context, question);

        if (!joined || answer !== joined.trim()) {
          status = !joined ? "empty_gemini_stream" : "validated_or_repaired_answer";
        }
      } catch (error) {
        if (isQuotaLikeError(error)) {
          mode = "quota_disabled";
          status = "quota_or_rate_limit";
          answer =
            "The AI review assistant is temporarily unavailable because the usage limit was reached. You can still request a manual tracking verification review from TrackFlow Pro.";
        } else {
          mode = "smart_fallback";
          status = "gemini_stream_error";
          answer = validateAssistantAnswer(buildSafeFallbackAnswer(context, question), context, question);
        }
      }

      try {
        const parts = answer.split(/(\n\n|(?<=\.)\s+)/g).filter(Boolean);

        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
        }
      } finally {
        controller.close();

        await logSafely({
          sessionId,
          reportToken: token,
          question,
          answer,
          mode,
          status,
          domainSlug: context.domainSlug,
          domain: context.domain,
          companyName: context.companyName,
          reportUrl,
          visit,
        });
      }
    },
  });

  return streamResponse(stream, "validated_gemini_stream", sessionCookieHeaders);
}
