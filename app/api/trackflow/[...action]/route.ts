// ============================================================
// FILE: app/api/trackflow/report-chat/route.ts
// Purpose: Validated Gemini assistant for private tracking-review pages.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as firebaseAdmin from "@/lib/firebase-admin";
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
  logReportChatMessages,
  logReportChatSession,
  markReportChatSessionReviewed,
  type ReportChatVisitInfo,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const adminDb = firebaseAdmin.adminDb;
const adminAuth = (firebaseAdmin as unknown as AnyRecord).adminAuth || (firebaseAdmin as unknown as AnyRecord).auth;

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

function jsonError(message: string, status = 400, extra: AnyRecord = {}) {
  return NextResponse.json(
    {
      ok: false,
      message,
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

function streamResponse(stream: ReadableStream<Uint8Array>, mode: string) {
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
      "x-trackflow-chat-mode": mode,
    },
  });
}

function cleanHeader(value: string | null, maxLength = 140): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function countryNameFromCode(code: string): string {
  const cleanCode = cleanHeader(code, 2).toUpperCase();
  if (!cleanCode || cleanCode === "XX" || cleanCode === "T1") return "";

  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" }).of(cleanCode);
    return display || cleanCode;
  } catch {
    return cleanCode;
  }
}

function parseUserAgent(userAgent: string): Pick<ReportChatVisitInfo, "deviceType" | "browser" | "os"> {
  const ua = String(userAgent || "");
  const lower = ua.toLowerCase();

  let deviceType = "Desktop";
  if (/ipad|tablet|kindle|silk|playbook/.test(lower)) {
    deviceType = "Tablet";
  } else if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(lower)) {
    deviceType = "Mobile";
  } else if (!ua) {
    deviceType = "Unknown";
  }

  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { deviceType, browser, os };
}

function buildVisitInfo(req: NextRequest): ReportChatVisitInfo {
  const countryCode =
    cleanHeader(req.headers.get("x-vercel-ip-country"), 12) ||
    cleanHeader(req.headers.get("cf-ipcountry"), 12);
  const region = cleanHeader(req.headers.get("x-vercel-ip-country-region"), 120);
  const city = cleanHeader(req.headers.get("x-vercel-ip-city"), 120);
  const userAgent = cleanHeader(req.headers.get("user-agent"), 800);
  const parsedUserAgent = parseUserAgent(userAgent);

  return {
    countryCode: countryCode.toUpperCase(),
    countryName: countryNameFromCode(countryCode),
    region,
    city,
    ...parsedUserAgent,
  };
}

async function verifyAdminRequest(req: NextRequest): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1] || "";

  if (!token) {
    return {
      ok: false,
      response: jsonError("Admin login is required to view client chats.", 401),
    };
  }

  if (!adminAuth || typeof adminAuth.verifyIdToken !== "function") {
    return {
      ok: false,
      response: jsonError("Admin verification is not configured on this server.", 503),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = String(decoded?.email || "").trim().toLowerCase();
    const allowedAdmins = String(process.env.ALLOWED_ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (allowedAdmins.length > 0 && !allowedAdmins.includes(email)) {
      return {
        ok: false,
        response: jsonError("This admin account is not allowed to view client chats.", 403),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      response: jsonError("Admin login could not be verified.", 401),
    };
  }
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

async function handleAdminGet(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (admin.ok !== true) return admin.response;

  const token = normalizeToken(req.nextUrl.searchParams.get("token"));
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();
  const search = String(req.nextUrl.searchParams.get("search") || "").trim();
  const limit = Math.max(1, Math.min(250, Number(req.nextUrl.searchParams.get("limit") || 100)));

  if (rawSessionId && token) {
    const sessionId = createChatSessionId(rawSessionId);
    const messages = await loadReportChatMessages({
      sessionId,
      reportToken: token,
      limit: 100,
    });

    const sessions = await listReportChatSessions({
      reportToken: token,
      limit: 250,
    });

    return jsonOk({
      sessionId,
      messages,
      session: sessions.find((item) => item.id === sessionId) || null,
      loggingConfigured: isReportChatLoggingConfigured(),
    });
  }

  const sessions = await listReportChatSessions({
    reportToken: token,
    search,
    limit,
  });

  return jsonOk({
    sessions,
    loggingConfigured: isReportChatLoggingConfigured(),
  });
}

async function handleAdminPost(req: NextRequest, body: AnyRecord) {
  const admin = await verifyAdminRequest(req);
  if (admin.ok !== true) return admin.response;

  const action = String(body.adminAction || body.action || "").trim();
  const token = normalizeToken(body.token || body.reportToken || body.report_token);
  const rawSessionId = String(body.sessionId || body.session_id || "").trim();

  if (action === "mark_reviewed") {
    if (!token || !rawSessionId) {
      return jsonError("Missing chat session details.", 400);
    }

    await markReportChatSessionReviewed({
      sessionId: createChatSessionId(rawSessionId),
      reportToken: token,
    });

    return jsonOk({
      reviewedAt: new Date().toISOString(),
    });
  }

  return jsonError("Unsupported chat admin action.", 400);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("admin") === "1") {
    return handleAdminGet(req);
  }

  const token = normalizeToken(req.nextUrl.searchParams.get("token"));
  const domainSlug = normalizeSlug(req.nextUrl.searchParams.get("domainSlug"));
  const rawSessionId = String(req.nextUrl.searchParams.get("sessionId") || "").trim();

  if (!token) {
    return jsonError("Missing report token.", 400, { messages: [], disableChat: true });
  }

  if (!rawSessionId) {
    return jsonOk({
      messages: [],
      loggingConfigured: isReportChatLoggingConfigured(),
      note: "No chat session was provided.",
    });
  }

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

  const sessionId = createChatSessionId(rawSessionId);
  const messages = await loadReportChatMessages({
    sessionId,
    reportToken: token,
    limit: 60,
  });

  return jsonOk({
    messages,
    sessionId,
    loggingConfigured: isReportChatLoggingConfigured(),
  });
}

export async function POST(req: NextRequest) {
  let body: AnyRecord = {};

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid chat request.", 400);
  }

  if (body.adminAction || body.action === "mark_reviewed") {
    return handleAdminPost(req, body);
  }

  const token = normalizeToken(body.token || body.reportToken || body.report_token);
  const domainSlug = normalizeSlug(body.domainSlug || body.domain_slug);
  const question = cleanQuestion(body.question);
  const history = normalizeChatHistory(body.history);
  const sessionId = createChatSessionId(body.sessionId || body.session_id);
  const visit = buildVisitInfo(req);

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
  const reportUrl = String(report.reportUrl || report.report_url || "").trim();

  if (domainSlug && context.domainSlug && domainSlug !== context.domainSlug) {
    // The token is still the main private key, but this protects against obviously mismatched URLs.
    return jsonError("This chat request does not match the private report URL.", 403, { disableChat: true });
  }

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

        // Buffer the Gemini stream first, then stream the validated answer to the browser.
        // This avoids client-facing half-sentences while still keeping the Vercel response streaming-safe.
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

  return streamResponse(stream, "validated_gemini_stream");
}
