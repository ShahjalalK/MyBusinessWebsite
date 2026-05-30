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
  domainSlug?: string;
  companyName?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  messageCount?: number;
  lastUserQuestion?: string;
  lastAssistantAnswerSnippet?: string;
  reviewedAt?: string;
  reportUrl?: string;
  pdfDownloadedAt?: string;
  lastPdfDownloadedAt?: string;
  pdfDownloadCount?: number;
};

export type ReportChatVisitInfo = {
  countryCode?: string;
  countryName?: string;
  region?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CHAT_SESSIONS_TABLE = process.env.TRACKFLOW_CHAT_SESSIONS_TABLE || "trackflow_report_chat_sessions";
const CHAT_MESSAGES_TABLE = process.env.TRACKFLOW_CHAT_MESSAGES_TABLE || "trackflow_report_chat_messages";

const CHAT_DEBUG = process.env.TRACKFLOW_CHAT_DEBUG === "1";

function debugLog(message: string, extra: Record<string, unknown> = {}) {
  if (!CHAT_DEBUG) return;
  console.log(`[trackflow-chat] ${message}`, extra);
}

function debugWarn(message: string, extra: Record<string, unknown> = {}) {
  if (!CHAT_DEBUG) return;
  console.warn(`[trackflow-chat] ${message}`, extra);
}

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

function cleanNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : fallback;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
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
}): Promise<boolean> {
  const rowCount = Array.isArray(rows) ? rows.length : 1;

  if (!isConfigured()) {
    debugWarn("Supabase POST skipped because env is not configured.", {
      table,
      rowCount,
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    });
    return false;
  }

  const cleanTable = safeTableName(table);
  if (!cleanTable) {
    debugWarn("Supabase POST skipped because table name is invalid.", { table });
    return false;
  }

  const url = `${getBaseUrl()}/rest/v1/${cleanTable}${upsert ? "?on_conflict=id" : ""}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: upsert ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      debugWarn("Supabase POST failed.", {
        table: cleanTable,
        status: response.status,
        statusText: response.statusText,
        upsert,
        rowCount,
        error: text.slice(0, 800),
      });
      return false;
    }

    debugLog("Supabase POST ok.", {
      table: cleanTable,
      upsert,
      rowCount,
      status: response.status,
    });

    return true;
  } catch (error: any) {
    debugWarn("Supabase POST crashed.", {
      table: cleanTable,
      upsert,
      rowCount,
      error: String(error?.message || error || "Unknown error"),
    });
    return false;
  }
}

async function getRows<T>({ table, query }: { table: string; query: string }): Promise<T[]> {
  if (!isConfigured()) {
    debugWarn("Supabase GET skipped because env is not configured.", {
      table,
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    });
    return [];
  }

  const cleanTable = safeTableName(table);
  if (!cleanTable) {
    debugWarn("Supabase GET skipped because table name is invalid.", { table });
    return [];
  }

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

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      debugWarn("Supabase GET failed.", {
        table: cleanTable,
        status: response.status,
        statusText: response.statusText,
        query,
        error: text.slice(0, 800),
      });
      return [];
    }

    const json = await response.json().catch(() => []);
    const rows = Array.isArray(json) ? (json as T[]) : [];

    debugLog("Supabase GET ok.", {
      table: cleanTable,
      query,
      rows: rows.length,
    });

    return rows;
  } catch (error: any) {
    debugWarn("Supabase GET crashed.", {
      table: cleanTable,
      query,
      error: String(error?.message || error || "Unknown error"),
    });
    return [];
  }
}

async function deleteRows({
  table,
  query,
}: {
  table: string;
  query: string;
}): Promise<{ attempted: boolean; ok: boolean; status?: number; error?: string }> {
  if (!isConfigured()) return { attempted: false, ok: true };

  const cleanTable = safeTableName(table);
  if (!cleanTable) return { attempted: false, ok: true, error: "invalid_table" };

  const url = `${getBaseUrl()}/rest/v1/${cleanTable}${query.startsWith("?") ? query : `?${query}`}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        attempted: true,
        ok: false,
        status: response.status,
        error: text.slice(0, 500) || `Supabase delete failed with HTTP ${response.status}`,
      };
    }

    return { attempted: true, ok: true, status: response.status };
  } catch (error: any) {
    return {
      attempted: true,
      ok: false,
      error: String(error?.message || error || "Supabase delete failed"),
    };
  }
}

export type DeleteReportChatHistoryResult = {
  configured: boolean;
  dryRun: boolean;
  reportToken: string;
  messages: { attempted: boolean; ok: boolean; status?: number; error?: string };
  sessions: { attempted: boolean; ok: boolean; status?: number; error?: string };
};

export async function deleteReportChatHistory(input: {
  reportToken: string;
  dryRun?: boolean;
}): Promise<DeleteReportChatHistoryResult> {
  const reportToken = cleanId(input.reportToken);
  const dryRun = input.dryRun !== false;

  const skipped = { attempted: false, ok: true };

  if (!reportToken) {
    return {
      configured: isConfigured(),
      dryRun,
      reportToken: "",
      messages: { ...skipped, error: "missing_report_token" },
      sessions: { ...skipped, error: "missing_report_token" },
    };
  }

  if (!isConfigured()) {
    return {
      configured: false,
      dryRun,
      reportToken,
      messages: skipped,
      sessions: skipped,
    };
  }

  if (dryRun) {
    return {
      configured: true,
      dryRun: true,
      reportToken,
      messages: skipped,
      sessions: skipped,
    };
  }

  const encodedToken = encodeURIComponent(reportToken);

  const messages = await deleteRows({
    table: CHAT_MESSAGES_TABLE,
    query: `report_token=eq.${encodedToken}`,
  });

  const sessions = await deleteRows({
    table: CHAT_SESSIONS_TABLE,
    query: `report_token=eq.${encodedToken}`,
  });

  return {
    configured: true,
    dryRun: false,
    reportToken,
    messages,
    sessions,
  };
}

export function createChatSessionId(value?: unknown): string {
  const raw = String(value || "").trim();
  return isUuid(raw) ? raw : randomUUID();
}

async function readSessionCounter({
  sessionId,
  reportToken,
}: {
  sessionId: string;
  reportToken: string;
}): Promise<{ firstSeenAt: string; messageCount: number }> {
  const rows = await getRows<{
    first_seen_at?: string;
    message_count?: number | string;
  }>({
    table: CHAT_SESSIONS_TABLE,
    query: [
      "select=first_seen_at,message_count",
      `id=eq.${encodeURIComponent(sessionId)}`,
      `report_token=eq.${encodeURIComponent(reportToken)}`,
      "limit=1",
    ].join("&"),
  });

  const first = rows[0];

  return {
    firstSeenAt: cleanText(first?.first_seen_at, 80),
    messageCount: cleanNumber(first?.message_count, 0),
  };
}

export async function logReportChatSession(input: {
  sessionId: string;
  reportToken: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
  source?: string;
  visit?: ReportChatVisitInfo;
  lastUserQuestion?: string;
  lastAssistantAnswerSnippet?: string;
  messageIncrement?: number;
}): Promise<void> {
  const sessionId = createChatSessionId(input.sessionId);
  const reportToken = cleanId(input.reportToken);
  const now = new Date().toISOString();

  if (!reportToken) return;

  const existing = await readSessionCounter({ sessionId, reportToken });
  const firstSeenAt = existing.firstSeenAt || now;
  const messageCount = existing.messageCount + cleanNumber(input.messageIncrement, 0);
  const visit = input.visit || {};

  const richRow = {
    id: sessionId,
    report_token: reportToken,
    domain_slug: cleanText(input.domainSlug, 180),
    domain: cleanText(input.domain, 180),
    company_name: cleanText(input.companyName, 180),
    country_code: cleanText(visit.countryCode, 12),
    country_name: cleanText(visit.countryName, 80),
    region: cleanText(visit.region, 120),
    city: cleanText(visit.city, 120),
    device_type: cleanText(visit.deviceType || "Unknown", 40),
    browser: cleanText(visit.browser || "Unknown", 80),
    os: cleanText(visit.os || "Unknown", 80),
    first_seen_at: firstSeenAt,
    last_seen_at: now,
    updated_at: now,
    message_count: messageCount,
    last_user_question: cleanText(input.lastUserQuestion, 700),
    last_assistant_answer_snippet: cleanText(input.lastAssistantAnswerSnippet, 900),
    report_url: cleanText(input.reportUrl, 500),
  };

  const savedRich = await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows: richRow,
  });

  if (savedRich) return;

  await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows: {
      id: sessionId,
      report_token: reportToken,
      domain: cleanText(input.domain, 180),
      updated_at: now,
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
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
  visit?: ReportChatVisitInfo;
}): Promise<void> {
  const sessionId = createChatSessionId(input.sessionId);
  const now = new Date().toISOString();
  const reportToken = cleanId(input.reportToken);

  if (!reportToken) return;

  await postRows({
    table: CHAT_MESSAGES_TABLE,
    rows: [
      {
        session_id: sessionId,
        report_token: reportToken,
        role: "user",
        content: cleanText(input.question, 1400),
        source: cleanText(input.mode, 80),
        quota_status: cleanText(input.status || "ok", 80),
        created_at: now,
      },
      {
        session_id: sessionId,
        report_token: reportToken,
        role: "assistant",
        content: cleanText(input.answer, 5000),
        source: cleanText(input.mode, 80),
        quota_status: cleanText(input.status || "ok", 80),
        created_at: now,
      },
    ],
  });

  await logReportChatSession({
    sessionId,
    reportToken,
    domainSlug: input.domainSlug,
    domain: input.domain,
    companyName: input.companyName,
    reportUrl: input.reportUrl,
    visit: input.visit,
    lastUserQuestion: input.question,
    lastAssistantAnswerSnippet: input.answer,
    messageIncrement: 2,
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


export async function loadReportChatQuestions(input: {
  reportToken: string;
  sessionId?: string;
  limit?: number;
}): Promise<StoredReportChatMessage[]> {
  const reportToken = cleanId(input.reportToken);
  const sessionId = cleanId(input.sessionId);
  const limit = Math.max(1, Math.min(100, Number(input.limit || 60)));

  if (!reportToken) return [];

  const queryParts = [
    "select=session_id,report_token,role,content,source,quota_status,created_at",
    `report_token=eq.${encodeURIComponent(reportToken)}`,
    "role=eq.user",
    "order=created_at.asc",
    `limit=${limit}`,
  ];

  if (sessionId) {
    queryParts.splice(2, 0, `session_id=eq.${encodeURIComponent(sessionId)}`);
  }

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
    query: queryParts.join("&"),
  });

  const messages: StoredReportChatMessage[] = [];

  for (const row of rows) {
    const content = cleanText(row.content, 5000);
    if (!content) continue;

    messages.push({
      sessionId: cleanId(row.session_id || sessionId),
      reportToken: cleanId(row.report_token || reportToken),
      role: "user",
      content,
      source: cleanText(row.source, 80),
      quotaStatus: cleanText(row.quota_status, 80),
      createdAt: cleanText(row.created_at, 80),
    });
  }

  return messages;
}


type SupabaseSessionRow = {
  id?: string;
  report_token?: string;
  domain?: string;
  domain_slug?: string;
  company_name?: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  updated_at?: string;
  message_count?: number | string;
  last_user_question?: string;
  last_assistant_answer_snippet?: string;
  reviewed_at?: string;
  report_url?: string;
  pdf_downloaded_at?: string;
  last_pdf_downloaded_at?: string;
  pdf_download_count?: number | string;
};

function normalizeSessionRow(row: SupabaseSessionRow): StoredReportChatSession | null {
  const id = cleanId(row.id);
  const token = cleanId(row.report_token);

  if (!id || !token) return null;

  return {
    id,
    reportToken: token,
    domain: cleanText(row.domain, 180),
    domainSlug: cleanText(row.domain_slug, 180),
    companyName: cleanText(row.company_name, 180),
    countryCode: cleanText(row.country_code, 12),
    countryName: cleanText(row.country_name, 80),
    region: cleanText(row.region, 120),
    city: cleanText(row.city, 120),
    deviceType: cleanText(row.device_type, 40),
    browser: cleanText(row.browser, 80),
    os: cleanText(row.os, 80),
    firstSeenAt: cleanText(row.first_seen_at, 80),
    lastSeenAt: cleanText(row.last_seen_at, 80),
    updatedAt: cleanText(row.updated_at, 80),
    messageCount: cleanNumber(row.message_count, 0),
    lastUserQuestion: cleanText(row.last_user_question, 700),
    lastAssistantAnswerSnippet: cleanText(row.last_assistant_answer_snippet, 900),
    reviewedAt: cleanText(row.reviewed_at, 80),
    reportUrl: cleanText(row.report_url, 500),
    pdfDownloadedAt: cleanText(row.pdf_downloaded_at, 80),
    lastPdfDownloadedAt: cleanText(row.last_pdf_downloaded_at, 80),
    pdfDownloadCount: cleanNumber(row.pdf_download_count, 0),
  };
}

async function listReportChatSessionsFromMessages(input: {
  reportToken?: string;
  limit?: number;
  search?: string;
} = {}): Promise<StoredReportChatSession[]> {
  const reportToken = cleanId(input.reportToken);
  const limit = Math.max(1, Math.min(250, Number(input.limit || 100)));

  const queryParts = [
    "select=session_id,report_token,role,content,created_at",
    "order=created_at.desc",
    `limit=${Math.min(limit * 8, 1000)}`,
  ];

  if (reportToken) {
    queryParts.splice(1, 0, `report_token=eq.${encodeURIComponent(reportToken)}`);
  }

  const rows = await getRows<{
    session_id?: string;
    report_token?: string;
    role?: string;
    content?: string;
    created_at?: string;
  }>({
    table: CHAT_MESSAGES_TABLE,
    query: queryParts.join("&"),
  });

  const grouped = new Map<
    string,
    {
      id: string;
      reportToken: string;
      firstSeenAt: string;
      lastSeenAt: string;
      updatedAt: string;
      messageCount: number;
      lastUserQuestion: string;
      lastAssistantAnswerSnippet: string;
    }
  >();

  for (const row of rows) {
    const id = cleanId(row.session_id);
    const token = cleanId(row.report_token);
    if (!id || !token) continue;

    const key = `${token}:${id}`;
    const createdAt = cleanText(row.created_at, 80) || new Date().toISOString();
    const role = String(row.role || "");
    const content = cleanText(row.content, role === "assistant" ? 900 : 700);

    const current =
      grouped.get(key) ||
      {
        id,
        reportToken: token,
        firstSeenAt: createdAt,
        lastSeenAt: createdAt,
        updatedAt: createdAt,
        messageCount: 0,
        lastUserQuestion: "",
        lastAssistantAnswerSnippet: "",
      };

    current.messageCount += 1;

    if (!current.firstSeenAt || createdAt < current.firstSeenAt) {
      current.firstSeenAt = createdAt;
    }

    if (!current.lastSeenAt || createdAt > current.lastSeenAt) {
      current.lastSeenAt = createdAt;
      current.updatedAt = createdAt;
    }

    if (role === "user" && content && !current.lastUserQuestion) {
      current.lastUserQuestion = content;
    }

    if (role === "assistant" && content && !current.lastAssistantAnswerSnippet) {
      current.lastAssistantAnswerSnippet = content;
    }

    grouped.set(key, current);
  }

  const search = cleanText(input.search, 120).toLowerCase();

  const sessions = Array.from(grouped.values())
    .map((item): StoredReportChatSession => ({
      id: item.id,
      reportToken: item.reportToken,
      firstSeenAt: item.firstSeenAt,
      lastSeenAt: item.lastSeenAt,
      updatedAt: item.updatedAt,
      messageCount: item.messageCount,
      lastUserQuestion: item.lastUserQuestion,
      lastAssistantAnswerSnippet: item.lastAssistantAnswerSnippet,
      deviceType: "Unknown",
      browser: "Unknown",
      os: "Unknown",
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, limit);

  if (!search) return sessions;

  return sessions.filter((session) => {
    const haystack = [
      session.reportToken,
      session.domain,
      session.domainSlug,
      session.companyName,
      session.countryCode,
      session.countryName,
      session.deviceType,
      session.browser,
      session.os,
      session.lastUserQuestion,
      session.lastAssistantAnswerSnippet,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export async function listReportChatSessions(input: {
  reportToken?: string;
  limit?: number;
  search?: string;
} = {}): Promise<StoredReportChatSession[]> {
  const reportToken = cleanId(input.reportToken);
  const limit = Math.max(1, Math.min(250, Number(input.limit || 100)));

  const queryParts = [
    "select=id,report_token,domain,domain_slug,company_name,country_code,country_name,region,city,device_type,browser,os,first_seen_at,last_seen_at,updated_at,message_count,last_user_question,last_assistant_answer_snippet,reviewed_at,report_url,pdf_downloaded_at,last_pdf_downloaded_at,pdf_download_count",
    "order=updated_at.desc",
    `limit=${limit}`,
  ];

  if (reportToken) {
    queryParts.splice(1, 0, `report_token=eq.${encodeURIComponent(reportToken)}`);
  }

  let rows = await getRows<SupabaseSessionRow>({
    table: CHAT_SESSIONS_TABLE,
    query: queryParts.join("&"),
  });

  if (!rows.length) {
    const fallbackParts = [
      "select=id,report_token,domain,updated_at",
      "order=updated_at.desc",
      `limit=${limit}`,
    ];

    if (reportToken) {
      fallbackParts.splice(1, 0, `report_token=eq.${encodeURIComponent(reportToken)}`);
    }

    rows = await getRows<SupabaseSessionRow>({
      table: CHAT_SESSIONS_TABLE,
      query: fallbackParts.join("&"),
    });
  }

  const search = cleanText(input.search, 120).toLowerCase();
  const sessions = rows.map(normalizeSessionRow).filter((item): item is StoredReportChatSession => Boolean(item));

  const filteredSessions = !search
    ? sessions
    : sessions.filter((session) => {
        const haystack = [
          session.reportToken,
          session.domain,
          session.domainSlug,
          session.companyName,
          session.countryCode,
          session.countryName,
          session.deviceType,
          session.browser,
          session.os,
          session.lastUserQuestion,
          session.lastAssistantAnswerSnippet,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });

  if (filteredSessions.length) return filteredSessions;

  return listReportChatSessionsFromMessages({
    reportToken: reportToken || undefined,
    search,
    limit,
  });
}

export async function markReportPdfDownloaded(input: {
  reportToken: string;
  domainSlug?: string;
  domain?: string;
  companyName?: string;
  reportUrl?: string;
}): Promise<void> {
  const reportToken = cleanId(input.reportToken);
  const now = new Date().toISOString();

  if (!reportToken) return;

  const existingRows = await getRows<{
    id?: string;
    report_token?: string;
    pdf_downloaded_at?: string;
    pdf_download_count?: number | string;
  }>({
    table: CHAT_SESSIONS_TABLE,
    query: [
      "select=id,report_token,pdf_downloaded_at,pdf_download_count",
      `report_token=eq.${encodeURIComponent(reportToken)}`,
      "limit=50",
    ].join("&"),
  });

  const rows: AnyRecord[] = existingRows.length
    ? existingRows.reduce<AnyRecord[]>((output, row) => {
        const id = cleanId(row.id);
        if (!id) return output;

        output.push({
          id,
          report_token: reportToken,
          domain_slug: cleanText(input.domainSlug, 180),
          domain: cleanText(input.domain, 180),
          company_name: cleanText(input.companyName, 180),
          report_url: cleanText(input.reportUrl, 500),
          pdf_downloaded_at: cleanText(row.pdf_downloaded_at, 80) || now,
          last_pdf_downloaded_at: now,
          pdf_download_count: cleanNumber(row.pdf_download_count, 0) + 1,
          updated_at: now,
        });

        return output;
      }, [])
    : [
        {
          id: `pdf_${reportToken}`.slice(0, 96),
          report_token: reportToken,
          domain_slug: cleanText(input.domainSlug, 180),
          domain: cleanText(input.domain, 180),
          company_name: cleanText(input.companyName, 180),
          report_url: cleanText(input.reportUrl, 500),
          pdf_downloaded_at: now,
          last_pdf_downloaded_at: now,
          pdf_download_count: 1,
          first_seen_at: now,
          last_seen_at: now,
          updated_at: now,
          message_count: 0,
          device_type: "Unknown",
          browser: "Unknown",
          os: "Unknown",
        },
      ];

  await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows,
  });
}

export async function markReportChatSessionReviewed(input: {
  sessionId: string;
  reportToken: string;
}): Promise<void> {
  const sessionId = createChatSessionId(input.sessionId);
  const reportToken = cleanId(input.reportToken);
  const now = new Date().toISOString();

  if (!reportToken) return;

  const savedRich = await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows: {
      id: sessionId,
      report_token: reportToken,
      reviewed_at: now,
      updated_at: now,
    },
  });

  if (savedRich) return;

  await postRows({
    table: CHAT_SESSIONS_TABLE,
    upsert: true,
    rows: {
      id: sessionId,
      report_token: reportToken,
      updated_at: now,
    },
  });
}
