"use client";

// ============================================================
// FILE: ChatInsightsPanel.tsx
// Purpose: Smart operator-friendly client chat insight tab.
// Notes:
// - Groups visitors by report/website so busy dashboards stay readable.
// - Shows client/user questions only; assistant answers stay hidden.
// ============================================================

import React, { useMemo } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe2,
  Loader2,
  MessageCircle,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { ChatInsightsState, ReportChatMessageRow, ReportChatSessionRow } from "./types";
import { formatDate } from "./utils";

type ChatInsightsPanelProps = {
  chatInsights: ChatInsightsState;
  setChatInsightsSearch: (value: string) => void;
  loadChatInsights: (force?: boolean) => Promise<void>;
  openChatInsightSession: (session: ReportChatSessionRow) => Promise<void>;
  markChatSessionReviewed: (session: ReportChatSessionRow) => Promise<void>;
};

type ChatInsightFilter = "attention" | "all" | "pdf" | "reviewed";
type IntentLevel = "High" | "Medium" | "Low";

type ChatInsightGroup = {
  key: string;
  label: string;
  subtitle: string;
  sessions: ReportChatSessionRow[];
  visitorCount: number;
  totalQuestions: number;
  pdfDownloads: number;
  latestPdfDownloadedAt: string;
  needsReview: number;
  latestActive: string;
  latestQuestion: string;
  intent: IntentLevel;
};

function safeText(value: unknown, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
}

function isUnknownLocationValue(value?: string) {
  const text = String(value || "").trim().toLowerCase();
  return !text || text === "unknown" || text === "xx" || text === "zz";
}

function getNetworkLocationLabel(session: ReportChatSessionRow) {
  const countryName = String(session.countryName || "").trim();
  const countryCode = String(session.countryCode || "").trim().toUpperCase();
  const region = String(session.region || "").trim();
  const city = String(session.city || "").trim();

  if (countryName.toLowerCase() === "local test") return "Local test";

  const country = !isUnknownLocationValue(countryName)
    ? countryName
    : !isUnknownLocationValue(countryCode)
      ? countryCode
      : "";

  const parts = [city, region, country]
    .filter((item) => !isUnknownLocationValue(item))
    .filter((item, index, array) => array.indexOf(item) === index);

  return parts.length ? parts.join(", ") : "Unknown";
}

function getNetworkLocationDisplay(session: ReportChatSessionRow) {
  const label = getNetworkLocationLabel(session);
  if (label === "Local test") return "Local test";
  if (label === "Unknown") return "Network unknown";
  return `Network: ${label}`;
}

function formatChatTime(value?: string) {
  return value ? formatDate(value) : "Not recorded";
}

function getLastActive(session: ReportChatSessionRow) {
  return session.lastSeenAt || session.updatedAt || session.firstSeenAt || "";
}

function getClientLabel(session: ReportChatSessionRow) {
  return session.companyName || session.domain || session.domainSlug || "Private report visitor";
}

function getReportKey(session: ReportChatSessionRow) {
  return session.reportToken || session.domainSlug || session.domain || session.id;
}

function getReportSubtitle(session: ReportChatSessionRow) {
  return session.domain || session.domainSlug || session.reportToken || "Secure report";
}

function getTimeValue(value?: string) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

function getPdfDownloadCount(session: ReportChatSessionRow) {
  return Math.max(0, Number(session.pdfDownloadCount || 0));
}

function getPdfDownloadedAt(session: ReportChatSessionRow) {
  return session.lastPdfDownloadedAt || session.pdfDownloadedAt || "";
}

function hasPdfDownload(session: ReportChatSessionRow) {
  return Boolean(getPdfDownloadedAt(session) || getPdfDownloadCount(session) > 0);
}

function getReportPdfDownloadCount(sessions: ReportChatSessionRow[]) {
  // PDF download activity is currently report-level. Some backend responses can repeat
  // the same report-level PDF count on every visitor row, so never sum it per visitor.
  return sessions.reduce((maxCount, session) => Math.max(maxCount, getPdfDownloadCount(session)), 0);
}

function getReportLatestPdfDownloadedAt(sessions: ReportChatSessionRow[]) {
  return sessions
    .map(getPdfDownloadedAt)
    .filter(Boolean)
    .sort((a, b) => getTimeValue(b) - getTimeValue(a))[0] || "";
}

function getQuestionCount(session: ReportChatSessionRow) {
  const rawCount = Math.max(0, Number(session.messageCount || 0));
  const estimatedQuestions = rawCount > 1 ? Math.ceil(rawCount / 2) : rawCount;
  const hasQuestion = Boolean(String(session.lastUserQuestion || "").trim());
  return Math.max(estimatedQuestions, hasQuestion ? 1 : 0);
}

function getQuestionTopic(question?: string) {
  const text = String(question || "").toLowerCase();

  if (/\b(google ads|ads reporting|conversion action|diagnostic)\b/.test(text)) return "Google Ads";
  if (/\bga4|google analytics|debugview\b/.test(text)) return "GA4";
  if (/\bgtm|tag manager|preview\b/.test(text)) return "GTM";
  if (/\b(phone|call|call tracking|click[-\s]?to[-\s]?call)\b/.test(text)) return "Phone calls";
  if (/\b(form|lead|enquiry|inquiry|submit)\b/.test(text)) return "Lead form";
  if (/\b(booking|appointment|schedule|reservation)\b/.test(text)) return "Booking";
  if (/\b(server|crm|offline|capi)\b/.test(text)) return "Server-side";
  if (/\b(meta|facebook|pixel)\b/.test(text)) return "Meta Pixel";

  return "General review";
}

function getSessionIntent(session: ReportChatSessionRow): IntentLevel {
  const question = String(session.lastUserQuestion || "").toLowerCase();
  let score = 0;

  if (String(session.lastUserQuestion || "").trim()) score += 1;
  if (getQuestionCount(session) >= 2) score += 2;
  if (!session.reviewedAt) score += 1;

  if (/\b(cost|price|pricing|quote|proposal|fix|setup|install|access|call|meeting|book|hire|next step|how soon)\b/.test(question)) {
    score += 3;
  }

  if (score >= 5) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

function getIntentWeight(intent: IntentLevel) {
  if (intent === "High") return 3;
  if (intent === "Medium") return 2;
  return 1;
}

function getIntentClass(intent: IntentLevel) {
  if (intent === "High") return "border-red-100 bg-red-50 text-red-700";
  if (intent === "Medium") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-white text-slate-500";
}

function sessionNeedsAttention(session: ReportChatSessionRow) {
  return !session.reviewedAt && Boolean(String(session.lastUserQuestion || "").trim());
}

function buildGroups(rows: ReportChatSessionRow[]): ChatInsightGroup[] {
  const grouped = new Map<string, ReportChatSessionRow[]>();

  rows.forEach((session) => {
    const key = getReportKey(session);
    const current = grouped.get(key) || [];
    current.push(session);
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([key, sessions]) => {
      const sortedSessions = [...sessions].sort((a, b) => getTimeValue(getLastActive(b)) - getTimeValue(getLastActive(a)));
      const primary = sortedSessions[0];
      const totalQuestions = sortedSessions.reduce((total, session) => total + getQuestionCount(session), 0);
      const pdfDownloads = getReportPdfDownloadCount(sortedSessions);
      const latestPdfDownloadedAt = getReportLatestPdfDownloadedAt(sortedSessions);
      const needsReview = sortedSessions.filter((session) => !session.reviewedAt).length;
      const latestQuestion =
        sortedSessions.find((session) => String(session.lastUserQuestion || "").trim())?.lastUserQuestion || "";
      const intent = sortedSessions
        .map(getSessionIntent)
        .sort((a, b) => getIntentWeight(b) - getIntentWeight(a))[0] || "Low";

      return {
        key,
        label: getClientLabel(primary),
        subtitle: getReportSubtitle(primary),
        sessions: sortedSessions,
        visitorCount: sortedSessions.length,
        totalQuestions,
        pdfDownloads,
        latestPdfDownloadedAt,
        needsReview,
        latestActive: getLastActive(primary),
        latestQuestion,
        intent,
      };
    })
    .sort((a, b) => {
      const intentDiff = getIntentWeight(b.intent) - getIntentWeight(a.intent);
      if (intentDiff) return intentDiff;

      const reviewDiff = b.needsReview - a.needsReview;
      if (reviewDiff) return reviewDiff;

      return getTimeValue(b.latestActive) - getTimeValue(a.latestActive);
    });
}

export default function ChatInsightsPanel({
  chatInsights,
  setChatInsightsSearch,
  loadChatInsights,
  openChatInsightSession,
  markChatSessionReviewed,
}: ChatInsightsPanelProps) {
  const [activeFilter, setActiveFilter] = React.useState<ChatInsightFilter>("attention");
  const [toggledGroupKeys, setToggledGroupKeys] = React.useState<Set<string>>(() => new Set());

  const searchedRows = useMemo(() => {
    const search = chatInsights.search.trim().toLowerCase();
    if (!search) return chatInsights.rows;

    return chatInsights.rows.filter((session) => {
      const haystack = [
        session.companyName,
        session.domain,
        session.domainSlug,
        session.reportToken,
        session.countryName,
        session.countryCode,
        session.region,
        session.city,
        session.deviceType,
        session.browser,
        session.os,
        session.lastUserQuestion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [chatInsights.rows, chatInsights.search]);

  const attentionRows = useMemo(
    () => searchedRows.filter(sessionNeedsAttention),
    [searchedRows],
  );

  const visibleRows = useMemo(() => {
    if (activeFilter === "pdf") return searchedRows.filter(hasPdfDownload);
    if (activeFilter === "reviewed") return searchedRows.filter((session) => Boolean(session.reviewedAt));
    if (activeFilter === "attention") return attentionRows.length ? attentionRows : searchedRows;
    return searchedRows;
  }, [activeFilter, attentionRows, searchedRows]);

  const groupedRows = useMemo(() => buildGroups(visibleRows), [visibleRows]);
  const searchedGroups = useMemo(() => buildGroups(searchedRows), [searchedRows]);
  const allGroups = useMemo(() => buildGroups(chatInsights.rows), [chatInsights.rows]);

  const defaultExpandedGroupKeys = useMemo(() => {
    const priorityGroups = groupedRows.filter((group) => group.intent === "High" || group.needsReview > 0);
    const groupsToOpen = priorityGroups.length ? priorityGroups : groupedRows.slice(0, 1);

    return new Set(groupsToOpen.slice(0, 6).map((group) => group.key));
  }, [groupedRows]);

  const toggleGroup = React.useCallback((groupKey: string) => {
    setToggledGroupKeys((current) => {
      const next = new Set(current);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  }, []);

  const isGroupExpanded = React.useCallback(
    (group: ChatInsightGroup) => defaultExpandedGroupKeys.has(group.key) !== toggledGroupKeys.has(group.key),
    [defaultExpandedGroupKeys, toggledGroupKeys],
  );

  const totalConversations = chatInsights.rows.length;
  const needsReview = chatInsights.rows.filter((session) => !session.reviewedAt).length;
  const pdfDownloads = allGroups.reduce((total, group) => total + group.pdfDownloads, 0);
  const totalQuestions = chatInsights.rows.reduce((total, session) => total + getQuestionCount(session), 0);
  const selectedSession = chatInsights.selectedSession;
  const selectedReportGroup = useMemo(
    () => (selectedSession ? allGroups.find((group) => group.key === getReportKey(selectedSession)) || null : null),
    [allGroups, selectedSession],
  );

  const clientQuestions = useMemo<ReportChatMessageRow[]>(() => {
    const transcriptQuestions = chatInsights.messages.filter(
      (message) => message.role === "user" && String(message.content || "").trim(),
    );

    if (transcriptQuestions.length) return transcriptQuestions;

    if (!selectedSession) return [];

    const fallbackQuestion = String(selectedSession.lastUserQuestion || "").trim();
    if (!fallbackQuestion) return [];

    return [
      {
        sessionId: selectedSession.id,
        reportToken: selectedSession.reportToken,
        role: "user",
        content: fallbackQuestion,
        createdAt: getLastActive(selectedSession),
      },
    ];
  }, [chatInsights.messages, selectedSession]);

  const filterItems: Array<{ id: ChatInsightFilter; label: string; count: number }> = [
    { id: "attention", label: "Needs attention", count: attentionRows.length },
    { id: "all", label: "All visitors", count: searchedRows.length },
    { id: "pdf", label: "PDF downloaded", count: searchedGroups.filter((group) => group.pdfDownloads > 0).length },
    { id: "reviewed", label: "Reviewed", count: searchedRows.filter((session) => Boolean(session.reviewedAt)).length },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_500px] 2xl:grid-cols-[minmax(0,1fr)_560px]">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                <MessageCircle size={14} />
                Chat Insights
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Client intent dashboard</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Grouped by website/report, then separated by visitor session. Network location is approximate, just like large SaaS analytics tools; use it as context, not final identity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadChatInsights(true)}
              disabled={chatInsights.loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {chatInsights.loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Visitors</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{totalConversations}</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Needs review</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{needsReview}</p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Questions</p>
              <p className="mt-2 text-3xl font-black text-blue-700">{totalQuestions}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">PDF downloads</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{pdfDownloads}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={chatInsights.search}
                onChange={(event) => setChatInsightsSearch(event.target.value)}
                placeholder="Search website, network location, device, or question..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <p className="text-xs font-bold text-slate-400">
              {chatInsights.loadedAt ? `Last loaded: ${formatDate(chatInsights.loadedAt)}` : "Load conversations to begin."}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterItems.map((item) => {
              const active = item.id === activeFilter;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFilter(item.id)}
                  className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                      : "border border-slate-100 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.label} · {item.count}
                </button>
              );
            })}
          </div>

          {chatInsights.error ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
              {chatInsights.error}
            </div>
          ) : null}

          {chatInsights.status ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-700">
              {chatInsights.status}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Website / report groups
            </p>
          </div>

          {chatInsights.loading && !chatInsights.rows.length ? (
            <div className="flex items-center justify-center gap-3 p-10 text-sm font-bold text-blue-600">
              <Loader2 size={18} className="animate-spin" />
              Loading client chats...
            </div>
          ) : groupedRows.length ? (
            <div className="divide-y divide-slate-100">
              {groupedRows.map((group) => {
                const expanded = isGroupExpanded(group);

                return (
                  <section key={group.key} className="bg-white">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      aria-expanded={expanded}
                      className="block w-full border-b border-slate-100 bg-slate-50/70 px-5 py-4 text-left transition hover:bg-blue-50/70"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-white text-slate-500 shadow-sm">
                              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                            <p className="truncate text-base font-black text-slate-950">{group.label}</p>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getIntentClass(group.intent)}`}>
                              {group.intent} intent
                            </span>
                            {group.needsReview ? (
                              <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">
                                {group.needsReview} needs review
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                Reviewed
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-bold text-slate-400">{group.subtitle}</p>
                          {group.latestQuestion ? (
                            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                              Latest question: {group.latestQuestion}
                            </p>
                          ) : null}
                          {group.pdfDownloads ? (
                            <p className="mt-2 text-xs font-bold text-emerald-700">
                              Report-level PDF activity{group.latestPdfDownloadedAt ? ` · Last download: ${formatChatTime(group.latestPdfDownloadedAt)}` : ""}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid shrink-0 grid-cols-2 gap-2 text-xs font-bold text-slate-500 lg:min-w-[280px]">
                          <span className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                            {group.visitorCount} visitor{group.visitorCount === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                            {group.totalQuestions} question{group.totalQuestions === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                            {group.pdfDownloads} report PDF download{group.pdfDownloads === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                            Last: {formatChatTime(group.latestActive)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {expanded ? "Click to collapse visitors" : "Click to show visitors"}
                      </p>
                    </button>

                    {expanded ? (
                      <div className="divide-y divide-slate-100">
                        {group.sessions.map((session, index) => {
                      const isSelected = selectedSession?.id === session.id && selectedSession.reportToken === session.reportToken;
                      const reviewed = Boolean(session.reviewedAt);
                      const topic = getQuestionTopic(session.lastUserQuestion);
                      const intent = getSessionIntent(session);
                      const questionCount = getQuestionCount(session);
                      const visitorName = group.visitorCount > 1 ? `Visitor ${index + 1}` : getClientLabel(session);

                      return (
                        <button
                          key={`${session.reportToken}-${session.id}`}
                          type="button"
                          onClick={() => void openChatInsightSession(session)}
                          className={`block w-full px-5 py-4 text-left transition hover:bg-blue-50/50 ${
                            isSelected ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-black text-slate-950">{visitorName}</p>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                                  {topic}
                                </span>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getIntentClass(intent)}`}>
                                  {intent}
                                </span>
                                {reviewed ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                    <CheckCircle2 size={12} />
                                    Reviewed
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">
                                    New
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs font-bold text-slate-400">
                                {safeText(session.deviceType)} · {safeText(session.browser)} · {safeText(session.os)}
                              </p>

                              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                                {session.lastUserQuestion || "No client question saved for this visitor yet."}
                              </p>

                            </div>

                            <div className="grid shrink-0 grid-cols-2 gap-2 text-xs font-bold text-slate-500 lg:min-w-[260px]">
                              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <Globe2 size={14} />
                                {getNetworkLocationDisplay(session)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <MonitorSmartphone size={14} />
                                {safeText(session.deviceType)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <MessageCircle size={14} />
                                {questionCount} question{questionCount === 1 ? "" : "s"}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <Clock size={14} />
                                {formatChatTime(getLastActive(session))}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
                <MessageCircle size={22} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-900">No matching client activity found.</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Try another filter, or send a test question from a secure report and click Refresh.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm xl:sticky xl:top-20 xl:flex xl:h-[calc(100vh-5.5rem)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
        {selectedSession ? (
          <div className="flex h-full min-h-[520px] flex-col xl:min-h-0">
            <div className="shrink-0 border-b border-slate-100 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected visitor</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{getClientLabel(selectedSession)}</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">
                Session: {selectedSession.id.slice(0, 8)} · {getQuestionCount(selectedSession)} question{getQuestionCount(selectedSession) === 1 ? "" : "s"}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  {getNetworkLocationDisplay(selectedSession)}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  {selectedSession.deviceType || "Device unknown"}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  {selectedSession.browser || "Browser unknown"}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  {selectedSession.os || "OS unknown"}
                </span>
              </div>

              <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-400">
                Network location is approximate, not GPS. VPN/proxy/ISP routing can change it.
              </p>

              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Report PDF activity</p>
                <p className="mt-1">
                  {selectedReportGroup?.pdfDownloads
                    ? `This report was downloaded ${selectedReportGroup.pdfDownloads > 1 ? `${selectedReportGroup.pdfDownloads} times` : "once"}${selectedReportGroup.latestPdfDownloadedAt ? ` · Last: ${formatChatTime(selectedReportGroup.latestPdfDownloadedAt)}` : ""}`
                    : "PDF not downloaded for this report yet."}
                </p>
                <p className="mt-1.5 text-[10px] font-semibold leading-4 text-emerald-700/80">
                  Report-level activity, not assigned to every visitor.
                </p>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {selectedSession.reportUrl ? (
                  <a
                    href={selectedSession.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
                  >
                    Open report
                    <ExternalLink size={14} />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => void markChatSessionReviewed(selectedSession)}
                  disabled={chatInsights.actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatInsights.actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  Mark reviewed
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pr-1.5 pb-10">
              {chatInsights.transcriptLoading ? (
                <div className="flex items-center justify-center gap-3 p-8 text-sm font-bold text-blue-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading client questions...
                </div>
              ) : clientQuestions.length ? (
                <div className="space-y-3">
                  <div className="sticky top-0 z-10 rounded-2xl border border-blue-100 bg-blue-50/95 px-3.5 py-2.5 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                        Visitor questions
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700 shadow-sm">
                        {clientQuestions.length}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-blue-700/80">
                      Assistant answers stay hidden here. Open report only when full chat review is needed.
                    </p>
                  </div>

                  {clientQuestions.map((message, index) => (
                    <div
                      key={`${message.createdAt || index}-${message.content}`}
                      className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Question {index + 1}
                        </p>
                        <p className="shrink-0 text-[10px] font-bold text-slate-400">
                          {formatChatTime(message.createdAt)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] font-bold leading-7 text-slate-900">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
                  No client questions were found for this visitor yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center xl:min-h-0">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-blue-600 shadow-sm">
              <MessageCircle size={26} />
            </div>
            <h3 className="mt-5 text-lg font-black text-slate-950">Select a visitor</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Click a visitor session under a website group to see only that visitor's questions and follow-up details.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
