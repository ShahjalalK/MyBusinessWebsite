// ============================================================
// FILE: app/api/trackflow/report-chat/route.ts
// Purpose: Streaming Gemini assistant for private tracking-review pages.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  buildGeminiPrompt,
  buildSafeFallbackAnswer,
  cleanQuestion,
  extractReportChatContext,
  filterUnsafeAnswer,
  isQuotaLikeError,
  normalizeChatHistory,
  normalizeSlug,
  normalizeToken,
  streamGeminiChunks,
  type AnyRecord,
} from "@/lib/trackflow-ai/report-chat";
import {
  createChatSessionId,
  logReportChatMessages,
  logReportChatSession,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

function makeTextStream(text: string, onDone?: () => Promise<void>) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const paragraphs = String(text || "")
          .split(/(\n\n)/g)
          .filter(Boolean);

        for (const part of paragraphs) {
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

export async function POST(req: NextRequest) {
  let body: AnyRecord = {};

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid chat request.", 400);
  }

  const token = normalizeToken(body.token || body.reportToken || body.report_token);
  const domainSlug = normalizeSlug(body.domainSlug || body.domain_slug);
  const question = cleanQuestion(body.question);
  const history = normalizeChatHistory(body.history);
  const sessionId = createChatSessionId(body.sessionId || body.session_id);

  if (!token) {
    return jsonError("Missing report token.", 400, { disableChat: true });
  }

  if (!question || question.length < 2) {
    return jsonError("Please ask a short question about this tracking review.", 400);
  }

  let report: AnyRecord | null = null;

  try {
    const snap = await adminDb.collection("audit_reports").doc(token).get();
    if (snap.exists) report = snap.data() || {};
  } catch {
    return jsonError("This report could not be loaded right now.", 503);
  }

  if (!report || report.active === false) {
    return jsonError("This private tracking review could not be found.", 404, { disableChat: true });
  }

  const context = extractReportChatContext(report, token);

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
    });
  } catch {
    // Optional logging only.
  }

  if (!GEMINI_API_KEY) {
    const fallback = buildSafeFallbackAnswer(context, question);
    const safeFallback = filterUnsafeAnswer(fallback, context);

    return streamResponse(
      makeTextStream(safeFallback, async () => {
        await logReportChatMessages({
          sessionId,
          reportToken: token,
          question,
          answer: safeFallback,
          mode: "smart_fallback",
          status: "missing_gemini_api_key",
        });
      }),
      "smart_fallback",
    );
  }

  const prompt = buildGeminiPrompt({ context, question, history });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const chunks: string[] = [];
      let mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error" = "gemini_stream";
      let status = "ok";

      try {
        for await (const chunk of streamGeminiChunks({
          prompt,
          apiKey: GEMINI_API_KEY,
          model: GEMINI_MODEL,
        })) {
          chunks.push(chunk);
          controller.enqueue(encoder.encode(chunk));
        }

        const joined = chunks.join("").trim();
        const safe = filterUnsafeAnswer(joined, context);

        if (joined && safe !== joined) {
          chunks.length = 0;
          chunks.push(safe);
          // The unsafe text was already streamed, so add a final correction.
          controller.enqueue(
            encoder.encode(
              "\n\nImportant correction: this review is based on browser-visible evidence only. Final confirmation requires GA4, GTM, Google Ads, CRM, or server/server-side access.",
            ),
          );
        }

        if (!chunks.join("").trim()) {
          mode = "smart_fallback";
          status = "empty_gemini_stream";
          const fallback = buildSafeFallbackAnswer(context, question);
          chunks.push(fallback);
          controller.enqueue(encoder.encode(fallback));
        }
      } catch (error) {
        if (isQuotaLikeError(error)) {
          mode = "quota_disabled";
          status = "quota_or_rate_limit";
          const message =
            "The AI review assistant is temporarily unavailable because the usage limit was reached. You can still request a manual tracking verification review from TrackFlow Pro.";
          chunks.push(message);
          controller.enqueue(encoder.encode(message));
        } else {
          mode = "smart_fallback";
          status = "gemini_stream_error";
          const fallback = buildSafeFallbackAnswer(context, question);
          chunks.push(fallback);
          controller.enqueue(encoder.encode(fallback));
        }
      } finally {
        controller.close();

        const answer = filterUnsafeAnswer(chunks.join("").trim(), context);

        try {
          await logReportChatMessages({
            sessionId,
            reportToken: token,
            question,
            answer,
            mode,
            status,
          });
        } catch {
          // Optional logging only.
        }
      }
    },
  });

  return streamResponse(stream, "gemini_stream");
}
