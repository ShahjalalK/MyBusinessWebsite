// ============================================================
// FILE: lib/supabase-admin.ts
// Purpose: Optional server-side Supabase REST logging for secure report chat.
// Notes:
// - No Supabase package dependency required.
// - If env vars or tables are missing, logging fails silently and the chatbot still works.
// - Never expose SUPABASE_SERVICE_ROLE_KEY to client components.
// ============================================================

import { randomUUID } from "crypto";

type AnyRecord = Record<string, any>;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CHAT_SESSIONS_TABLE = process.env.TRACKFLOW_CHAT_SESSIONS_TABLE || "trackflow_report_chat_sessions";
const CHAT_MESSAGES_TABLE = process.env.TRACKFLOW_CHAT_MESSAGES_TABLE || "trackflow_report_chat_messages";

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function cleanId(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function cleanText(value: unknown, maxLength = 3000): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function insertRows(table: string, rows: AnyRecord | AnyRecord[]): Promise<void> {
  if (!isConfigured()) return;

  const baseUrl = SUPABASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/rest/v1/${encodeURIComponent(table)}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
  } catch {
    // Logging is optional. Never break the client-facing secure report chatbot.
  }
}

export function createChatSessionId(value?: unknown): string {
  const cleaned = cleanId(value);
  return cleaned || randomUUID().replace(/-/g, "");
}

export async function logReportChatSession(input: {
  sessionId: string;
  reportToken: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  source?: string;
}): Promise<void> {
  const sessionId = createChatSessionId(input.sessionId);

  await insertRows(CHAT_SESSIONS_TABLE, {
    id: sessionId,
    report_token: cleanId(input.reportToken),
    domain_slug: cleanText(input.domainSlug, 120),
    domain: cleanText(input.domain, 180),
    company_name: cleanText(input.companyName, 180),
    source: cleanText(input.source || "secure_report_chat", 80),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function logReportChatMessages(input: {
  sessionId: string;
  reportToken: string;
  question: string;
  answer: string;
  mode: "gemini_stream" | "smart_fallback" | "quota_disabled" | "error";
  status?: string;
}): Promise<void> {
  const sessionId = createChatSessionId(input.sessionId);
  const now = new Date().toISOString();

  await insertRows(CHAT_MESSAGES_TABLE, [
    {
      session_id: sessionId,
      report_token: cleanId(input.reportToken),
      role: "user",
      content: cleanText(input.question, 1400),
      mode: input.mode,
      status: cleanText(input.status || "ok", 80),
      created_at: now,
    },
    {
      session_id: sessionId,
      report_token: cleanId(input.reportToken),
      role: "assistant",
      content: cleanText(input.answer, 5000),
      mode: input.mode,
      status: cleanText(input.status || "ok", 80),
      created_at: now,
    },
  ]);
}
