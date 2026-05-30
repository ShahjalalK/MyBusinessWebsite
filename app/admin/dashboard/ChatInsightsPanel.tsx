"use client";

// ============================================================
// FILE: ChatInsightsPanel.tsx
// Purpose: Operator-friendly client chat insight tab for admin dashboard.
// ============================================================

import React, { useMemo } from "react";
import {
  CheckCircle2,
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
import type { ChatInsightsState, ReportChatSessionRow } from "./types";
import { formatDate } from "./utils";

type ChatInsightsPanelProps = {
  chatInsights: ChatInsightsState;
  setChatInsightsSearch: (value: string) => void;
  loadChatInsights: (force?: boolean) => Promise<void>;
  openChatInsightSession: (session: ReportChatSessionRow) => Promise<void>;
  markChatSessionReviewed: (session: ReportChatSessionRow) => Promise<void>;
};

function safeText(value: unknown, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
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

function getQuestionTopic(question?: string) {
  const text = String(question || "").toLowerCase();

  if (/\b(google ads|ads reporting|conversion action|diagnostic)\b/.test(text)) return "Google Ads";
  if (/\bga4|google analytics|debugview\b/.test(text)) return "GA4";
  if (/\bgtm|tag manager|preview\b/.test(text)) return "GTM";
  if (/\bphone|call|call tracking|click[-\s]?to[-\s]?call\b/.test(text)) return "Phone calls";
  if (/\bform|lead|enquiry|inquiry|submit\b/.test(text)) return "Lead form";
  if (/\bbooking|appointment|schedule|reservation\b/.test(text)) return "Booking";
  if (/\bserver|crm|offline|capi\b/.test(text)) return "Server-side";
  if (/\bmeta|facebook|pixel\b/.test(text)) return "Meta Pixel";

  return "General review";
}

export default function ChatInsightsPanel({
  chatInsights,
  setChatInsightsSearch,
  loadChatInsights,
  openChatInsightSession,
  markChatSessionReviewed,
}: ChatInsightsPanelProps) {
  const visibleRows = useMemo(() => {
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

  const totalConversations = chatInsights.rows.length;
  const needsReview = chatInsights.rows.filter((session) => !session.reviewedAt).length;
  const mobileCount = chatInsights.rows.filter((session) => String(session.deviceType || "").toLowerCase() === "mobile").length;
  const countries = new Set(chatInsights.rows.map((session) => session.countryCode || session.countryName).filter(Boolean));
  const selectedSession = chatInsights.selectedSession;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                <MessageCircle size={14} />
                Chat Insights
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Client chat activity</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                See what report visitors ask, where they are from, and which device they used. This view stays simple for follow-up decisions.
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
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Conversations</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{totalConversations}</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Needs review</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{needsReview}</p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Countries</p>
              <p className="mt-2 text-3xl font-black text-blue-700">{countries.size}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Mobile visitors</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{mobileCount}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={chatInsights.search}
                onChange={(event) => setChatInsightsSearch(event.target.value)}
                placeholder="Search client, country, device, or question..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <p className="text-xs font-bold text-slate-400">
              {chatInsights.loadedAt ? `Last loaded: ${formatDate(chatInsights.loadedAt)}` : "Load conversations to begin."}
            </p>
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
              Client conversations
            </p>
          </div>

          {chatInsights.loading && !chatInsights.rows.length ? (
            <div className="flex items-center justify-center gap-3 p-10 text-sm font-bold text-blue-600">
              <Loader2 size={18} className="animate-spin" />
              Loading client chats...
            </div>
          ) : visibleRows.length ? (
            <div className="divide-y divide-slate-100">
              {visibleRows.map((session) => {
                const isSelected = selectedSession?.id === session.id;
                const reviewed = Boolean(session.reviewedAt);
                const topic = getQuestionTopic(session.lastUserQuestion);

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
                          <p className="truncate text-base font-black text-slate-950">{getClientLabel(session)}</p>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {topic}
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
                          {session.domain || session.domainSlug || session.reportToken}
                        </p>

                        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                          {session.lastUserQuestion || "No client question saved yet."}
                        </p>
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 text-xs font-bold text-slate-500 lg:min-w-[260px]">
                        <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <Globe2 size={14} />
                          {session.countryName || session.countryCode || "Unknown"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <MonitorSmartphone size={14} />
                          {safeText(session.deviceType)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <MessageCircle size={14} />
                          {Number(session.messageCount || 0)} messages
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
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
                <MessageCircle size={22} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-900">No client chats found yet.</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                New secure-page conversations will appear here after Supabase chat logging is configured.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
        {selectedSession ? (
          <div className="flex h-full min-h-[520px] flex-col">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Conversation</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{getClientLabel(selectedSession)}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {selectedSession.countryName || selectedSession.countryCode || "Country unknown"}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {selectedSession.deviceType || "Device unknown"}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {selectedSession.browser || "Browser unknown"}
                </span>
                <span className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {selectedSession.os || "OS unknown"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSession.reportUrl ? (
                  <a
                    href={selectedSession.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
                  >
                    Open report
                    <ExternalLink size={14} />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => void markChatSessionReviewed(selectedSession)}
                  disabled={chatInsights.actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatInsights.actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  Mark reviewed
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              {chatInsights.transcriptLoading ? (
                <div className="flex items-center justify-center gap-3 p-8 text-sm font-bold text-blue-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading transcript...
                </div>
              ) : chatInsights.messages.length ? (
                <div className="space-y-3">
                  {chatInsights.messages.map((message, index) => {
                    const isUser = message.role === "user";

                    return (
                      <div key={`${message.createdAt || index}-${message.role}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                            isUser
                              ? "rounded-br-md bg-blue-600 text-white shadow-blue-900/10"
                              : "rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`mt-2 text-[10px] font-bold ${isUser ? "text-blue-100" : "text-slate-400"}`}>
                            {formatChatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  No transcript messages were found for this session.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-blue-600 shadow-sm">
              <MessageCircle size={26} />
            </div>
            <h3 className="mt-5 text-lg font-black text-slate-950">Select a conversation</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Click a client chat from the list to see the full conversation and follow-up details.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
