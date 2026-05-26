// ============================================================
// FILE: lib/supabase-admin.ts
// Purpose: Optional server-side Supabase REST logging and reading for secure report chat.
// Notes:
// - No Supabase package dependency required.
// - If env vars or tables are missing, logging/reading fails silently and the chatbot still works.
// - Never expose SUPABASE_SERVICE_ROLE_KEY to client components.
// ============================================================

import { randomUUID } from "crypto";

type AnyRecord = Record<string, any>;

export type StoredReportChatMessage = {
  sessionId: string;
  reportToken: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  quotaStatus?: string;
  createdAt?: string;
};

export type StoredReportChatSession = {
  id: string;
  reportToken: string;
  domain?: string;
  updatedAt?: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CHAT_SESSIONS_TABLE = process.env.TRACKFLOW_CHAT_SESSIONS_TABLE || "trackflow_report_chat_sessions";
const CHAT_MESSAGES_TABLE = process.env.TRACKFLOW_CHAT_MESSAGES_TABLE || "trackflow_report_chat_messages";

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function isReportChatLoggingConfigured(): boolean {
  return isConfigured();
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeTableName(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 80);
}

function getBaseUrl(): string {
  return SUPABASE_URL.replace(/\/+$/, "");
}

async function postRows({
  table,
  rows,
  upsert = false,
}: {
  table: string;
  rows: AnyRecord | AnyRecord[];
  upsert?: boolean;
}): Promise<void> {
  if (!isConfigured()) return;

  const cleanTable = safeTableName(table);
  if (!cleanTable) return;

  const url = `${getBaseUrl()}/rest/v1/${cleanTable}${upsert ? "?on_conflict=id" : ""}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: upsert ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
      },
      body: JSON.stringify(rows),
    });
  } catch {
    // Logging is optional. Never break the client-facing secure report chatbot.
  }
}

async function getRows<T>({ table, query }: { table: string; query: string }): Promise<T[]> {
  if (!isConfigured()) return [];

  const cleanTable = safeTableName(table);
  if (!cleanTable) return [];

  const url = `${getBaseUrl()}/rest/v1/${cleanTable}${query.startsWith("?") ? query : `?${query}`}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
      },
    });

    if (!response.ok) return [];

    const json = await response.json().catch(() => []);
    return Array.isArray(json) ? (json as T[]) : [];
  } catch {
    return [];
  }
}

export function createChatSessionId(value?: unknown): string {
  const raw = String(value || "").trim();
  return isUuid(raw) ? raw : randomUUID();
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

  // Keep this payload compatible with the simple SQL table shared in setup instructions.
  // Extra values like companyName/domainSlug are intentionally omitted so logging does not fail
  // on projects that have only the base columns.
  await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows: {
      id: sessionId,
      report_token: cleanId(input.reportToken),
      domain: cleanText(input.domain, 180),
      updated_at: new Date().toISOString(),
    },
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

  // Match the base messages table: session_id, report_token, role, content, source, quota_status, created_at.
  await postRows({
    table: CHAT_MESSAGES_TABLE,
    rows: [
      {
        session_id: sessionId,
        report_token: cleanId(input.reportToken),
        role: "user",
        content: cleanText(input.question, 1400),
        source: cleanText(input.mode, 80),
        quota_status: cleanText(input.status || "ok", 80),
        created_at: now,
      },
      {
        session_id: sessionId,
        report_token: cleanId(input.reportToken),
        role: "assistant",
        content: cleanText(input.answer, 5000),
        source: cleanText(input.mode, 80),
        quota_status: cleanText(input.status || "ok", 80),
        created_at: now,
      },
    ],
  });
}

export async function loadReportChatMessages(input: {
  sessionId: string;
  reportToken: string;
  limit?: number;
}): Promise<StoredReportChatMessage[]> {
  const sessionId = createChatSessionId(input.sessionId);
  const reportToken = cleanId(input.reportToken);
  const limit = Math.max(1, Math.min(100, Number(input.limit || 60)));

  if (!reportToken) return [];

  const rows = await getRows<{
    session_id?: string;
    report_token?: string;
    role?: string;
    content?: string;
    source?: string;
    quota_status?: string;
    created_at?: string;
  }>({
    table: CHAT_MESSAGES_TABLE,
    query: [
      "select=session_id,report_token,role,content,source,quota_status,created_at",
      `session_id=eq.${encodeURIComponent(sessionId)}`,
      `report_token=eq.${encodeURIComponent(reportToken)}`,
      "order=created_at.asc",
      `limit=${limit}`,
    ].join("&"),
  });

  const messages: StoredReportChatMessage[] = [];

  for (const row of rows) {
    const role: StoredReportChatMessage["role"] | null =
      row.role === "assistant" ? "assistant" : row.role === "user" ? "user" : null;
    const content = cleanText(row.content, 5000);

    if (!role || !content) continue;

    messages.push({
      sessionId: cleanId(row.session_id || sessionId),
      reportToken: cleanId(row.report_token || reportToken),
      role,
      content,
      source: cleanText(row.source, 80),
      quotaStatus: cleanText(row.quota_status, 80),
      createdAt: cleanText(row.created_at, 80),
    });
  }

  return messages;
}

export async function listReportChatSessions(input: {
  reportToken?: string;
  limit?: number;
} = {}): Promise<StoredReportChatSession[]> {
  const reportToken = cleanId(input.reportToken);
  const limit = Math.max(1, Math.min(200, Number(input.limit || 80)));

  const queryParts = [
    "select=id,report_token,domain,updated_at",
    "order=updated_at.desc",
    `limit=${limit}`,
  ];

  if (reportToken) {
    queryParts.splice(1, 0, `report_token=eq.${encodeURIComponent(reportToken)}`);
  }

  const rows = await getRows<{
    id?: string;
    report_token?: string;
    domain?: string;
    updated_at?: string;
  }>({
    table: CHAT_SESSIONS_TABLE,
    query: queryParts.join("&"),
  });

  const sessions: StoredReportChatSession[] = [];

  for (const row of rows) {
    const id = cleanId(row.id);
    const token = cleanId(row.report_token);

    if (!id || !token) continue;

    sessions.push({
      id,
      reportToken: token,
      domain: cleanText(row.domain, 180),
      updatedAt: cleanText(row.updated_at, 80),
    });
  }

  return sessions;
}
