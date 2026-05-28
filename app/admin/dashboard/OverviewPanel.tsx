"use client";

import React, { type ReactNode, useMemo } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Flame,
  Mail,
  MessageSquare,
  MousePointer2,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";

import { ACTIVE_SENDERS } from "../../../lib/senders";
import type { FirebaseUsageState, FollowupSummaryState, Lead, MainTab, SheetLead } from "./types";
import { ACTIVE_STATUSES } from "./constants";
import { leadScore } from "./followup-utils";
import { formatDate, toMillis } from "./utils";
import { getSheetOutreachChannel, getSheetReadiness, isSheetReportReady } from "./sheet-readiness";

type OverviewAnalytics = {
  total: number;
  hot: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
};

type OverviewPanelProps = {
  analytics: OverviewAnalytics;
  followupSummary: FollowupSummaryState;
  firebaseUsage: FirebaseUsageState;
  cleanupLoading: boolean;
  dailyFollowupLimit: number;
  leads: Lead[];
  sortedHotLeads: Lead[];
  filteredLeadCount: number;
  loadingMoreLeads: boolean;
  hasMoreLeads: boolean;
  sheetLeads: SheetLead[];
  sheetLoading: boolean;
  sheetStatus: string;
  sheetLoadedAt: number | null;
  senderCounts: Record<string, number>;
  loadFollowupSummary: (force?: boolean) => Promise<void>;
  loadFirebaseUsage: (force?: boolean) => Promise<void>;
  loadSheetLeads: (force?: boolean) => Promise<void>;
  runSystemCleanup: (action: string, days?: number) => Promise<void>;
  setActiveTab: (tab: MainTab) => void;
  setSelectedLead: (lead: Lead | null) => void;
  fetchMoreLeads: () => Promise<void> | void;
};

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "slate";

function toneClasses(tone: Tone) {
  if (tone === "green") return "bg-green-50 text-green-600 border-green-100";
  if (tone === "orange") return "bg-orange-50 text-orange-600 border-orange-100";
  if (tone === "red") return "bg-red-50 text-red-600 border-red-100";
  if (tone === "purple") return "bg-purple-50 text-purple-600 border-purple-100";
  if (tone === "slate") return "bg-slate-50 text-slate-600 border-slate-100";
  return "bg-blue-50 text-blue-600 border-blue-100";
}

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  note,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: Tone;
  note?: string;
}) {
  return (
    <div className="bg-white rounded-[30px] border border-gray-100 p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl border ${toneClasses(tone)} flex items-center justify-center mb-5`}>{icon}</div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
      {note ? <p className="mt-2 text-[10px] font-bold text-gray-400 leading-relaxed">{note}</p> : null}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = "slate",
  note,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
  note?: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <p className={`text-xl font-black ${toneClasses(tone).split(" ")[1]}`}>{value}</p>
      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{label}</p>
      {note ? <p className="mt-1 text-[9px] font-bold text-gray-400 leading-relaxed">{note}</p> : null}
    </div>
  );
}

function ProgressLine({
  label,
  value,
  max,
  percent,
  tone = "blue",
}: {
  label: string;
  value: string;
  max?: string;
  percent: number;
  tone?: Tone;
}) {
  const safePercent = Math.max(0, Math.min(Math.round(percent || 0), 100));
  const barColor =
    safePercent >= 90
      ? "bg-red-500"
      : safePercent >= 70
        ? "bg-orange-500"
        : tone === "green"
          ? "bg-green-500"
          : tone === "purple"
            ? "bg-purple-500"
            : "bg-blue-500";

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
          <p className="text-sm font-black text-gray-900 mt-1">{value}</p>
          {max ? <p className="text-[9px] font-bold text-gray-400">{max}</p> : null}
        </div>
        <p className="text-xs font-black text-gray-500">{safePercent}%</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}

function startOfTodayMillis() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function lastRefreshLabel(value: number | null) {
  if (!value) return "Not refreshed yet";
  return `Last refreshed ${new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

export default function OverviewPanel({
  analytics,
  followupSummary,
  firebaseUsage,
  cleanupLoading,
  dailyFollowupLimit,
  leads,
  sortedHotLeads,
  filteredLeadCount,
  loadingMoreLeads,
  hasMoreLeads,
  sheetLeads,
  sheetLoading,
  sheetStatus,
  sheetLoadedAt,
  senderCounts,
  loadFollowupSummary,
  loadFirebaseUsage,
  loadSheetLeads,
  runSystemCleanup,
  setActiveTab,
  setSelectedLead,
  fetchMoreLeads,
}: OverviewPanelProps) {
  const todayStart = startOfTodayMillis();

  const firestoreTracking = useMemo(() => {
    const sentLikeStatuses = new Set(["sent", "opened", "clicked", "replied", "finished", "scheduled"]);
    const sent = leads.filter((lead) => sentLikeStatuses.has(String(lead.status || "")) || toMillis(lead.sentAt) > 0).length;
    const opened = leads.filter((lead) => Number(lead.open_count || 0) > 0 || ["opened", "clicked", "replied"].includes(String(lead.status || ""))).length;
    const clicked = leads.filter((lead) => Number(lead.click_count || 0) > 0 || ["clicked", "replied"].includes(String(lead.status || ""))).length;
    const openedToday = leads.filter((lead) => toMillis(lead.lastOpenedAt) >= todayStart).length;
    const clickedToday = leads.filter((lead) => toMillis(lead.lastClickedAt) >= todayStart).length;
    const activeAutomation = leads.filter((lead) => !lead.stopAutomation && ACTIVE_STATUSES.has(String(lead.status || ""))).length;

    return {
      sent,
      opened,
      clicked,
      openedToday,
      clickedToday,
      activeAutomation,
    };
  }, [leads, todayStart]);

  const sheetPipeline = useMemo(() => {
    const emailRows = sheetLeads.filter((lead) => getSheetOutreachChannel(lead) === "email");
    const linkedinRows = sheetLeads.filter((lead) => getSheetOutreachChannel(lead) === "linkedin");
    const reportReady = sheetLeads.filter(isSheetReportReady).length;
    const needsReview = sheetLeads.filter((lead) => !getSheetReadiness(lead).ready).length;
    const emailReady = emailRows.filter((lead) => getSheetReadiness(lead).ready).length;
    const linkedinReady = linkedinRows.filter((lead) => getSheetReadiness(lead).ready).length;

    return {
      total: sheetLeads.length,
      email: emailRows.length,
      linkedin: linkedinRows.length,
      emailReady,
      linkedinReady,
      reportReady,
      needsReview,
    };
  }, [sheetLeads]);

  const senderUsage = useMemo(() => {
    const rows = ACTIVE_SENDERS.map((sender) => {
      const sent = Number(senderCounts[sender.email] || 0);
      const limit = Math.max(Number(sender.limit || 50), 1);
      return {
        id: sender.id,
        email: sender.email,
        name: sender.name,
        sent,
        limit,
        left: Math.max(limit - sent, 0),
        percent: Math.min(Math.round((sent / limit) * 100), 100),
      };
    });

    const sent = rows.reduce((total, row) => total + row.sent, 0);
    const limit = rows.reduce((total, row) => total + row.limit, 0);
    const left = Math.max(limit - sent, 0);
    const percent = limit ? Math.min(Math.round((sent / limit) * 100), 100) : 0;

    return { rows, sent, limit, left, percent };
  }, [senderCounts]);

  const firestoreUsageNote = firebaseUsage.loadedAt
    ? `${lastRefreshLabel(firebaseUsage.loadedAt)}${firebaseUsage.error ? ` · ${firebaseUsage.error}` : ""}`
    : "Click Refresh Usage to check the latest Firestore safety estimate.";

  return (
    <div className="space-y-8">
      <div className="rounded-[35px] bg-slate-950 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Command Center</p>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tighter mt-1">Today&apos;s outreach snapshot</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-white/60 leading-relaxed">
              Tracking and follow-up numbers come from Firestore. Sheet numbers are only pipeline/review counts, so open/click decisions stay accurate.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => loadFollowupSummary(true)}
              disabled={followupSummary.loading}
              className="rounded-2xl bg-white/10 px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-white/15 disabled:opacity-50"
            >
              {followupSummary.loading ? "Refreshing..." : "Refresh FUP"}
            </button>
            <button
              type="button"
              onClick={() => loadFirebaseUsage(true)}
              disabled={firebaseUsage.loading}
              className="rounded-2xl bg-white/10 px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-white/15 disabled:opacity-50"
            >
              {firebaseUsage.loading ? "Checking..." : "Usage"}
            </button>
            <button
              type="button"
              onClick={() => loadSheetLeads(true)}
              disabled={sheetLoading}
              className="rounded-2xl bg-white/10 px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-white/15 disabled:opacity-50"
            >
              {sheetLoading ? "Loading..." : "Sheet"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className="rounded-2xl bg-blue-500 px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-blue-400"
            >
              Leads
            </button>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Firestore Leads" value={analytics.total} icon={<Database size={22} />} note="Cached outreach records" />
        <StatCard label="Opened Leads" value={firestoreTracking.opened} icon={<Mail size={22} />} tone="green" note={`${firestoreTracking.openedToday} opened today in cached data`} />
        <StatCard label="Clicked Leads" value={firestoreTracking.clicked} icon={<MousePointer2 size={22} />} tone="orange" note={`${firestoreTracking.clickedToday} clicked today in cached data`} />
        <StatCard label="Hot Leads" value={analytics.hot} icon={<Flame size={22} />} tone="orange" note="Open/click/reply weighted" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Firestore Tracking</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">Outreach status that drives automation</h2>
              <p className="mt-1 text-xs font-bold text-gray-400">
                Open, click, reply, and follow-up state should be trusted from Firestore, not Google Sheet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-[10px] font-black uppercase text-white"
            >
              Open Leads
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <MiniMetric label="Sent / Scheduled" value={firestoreTracking.sent} tone="blue" />
            <MiniMetric label="Replies" value={analytics.replied} tone="green" />
            <MiniMetric label="Bounces" value={analytics.bounced} tone="red" />
            <MiniMetric label="Unsubscribed" value={analytics.unsubscribed} tone="red" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <MiniMetric label="Initial sent today" value={firebaseUsage.counts.initialSentToday} tone="slate" note="Server estimate" />
            <MiniMetric label="Follow-ups today" value={firebaseUsage.counts.followupSentToday} tone="slate" note="Server estimate" />
            <MiniMetric label="Email events today" value={firebaseUsage.counts.eventsToday} tone="purple" note="Open/click/reply events" />
            <MiniMetric label="Automation active" value={firestoreTracking.activeAutomation} tone="green" />
          </div>
        </div>

        <div className="bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sheet Pipeline</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">Review queue</h2>
              <p className="mt-1 text-xs font-bold text-gray-400">
                {sheetLoadedAt ? lastRefreshLabel(sheetLoadedAt) : "Sheet not loaded yet"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadSheetLeads(true)}
              disabled={sheetLoading}
              className="rounded-2xl border border-gray-100 px-4 py-3 text-[10px] font-black uppercase text-gray-600 disabled:opacity-50"
            >
              <RefreshCw size={14} className={sheetLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <MiniMetric label="Email ready" value={`${sheetPipeline.emailReady}/${sheetPipeline.email}`} tone="blue" />
            <MiniMetric label="LinkedIn ready" value={`${sheetPipeline.linkedinReady}/${sheetPipeline.linkedin}`} tone="purple" />
            <MiniMetric label="Report ready" value={`${sheetPipeline.reportReady}/${sheetPipeline.total}`} tone="green" />
            <MiniMetric label="Needs review" value={sheetPipeline.needsReview} tone={sheetPipeline.needsReview ? "orange" : "green"} />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("sheet")}
            className="mt-5 w-full rounded-2xl bg-indigo-50 px-5 py-3 text-[10px] font-black uppercase text-indigo-700"
          >
            Review Sheet Leads
          </button>
          {sheetStatus ? <p className="mt-3 text-[10px] font-bold text-gray-400 leading-relaxed">{sheetStatus}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Follow-up Queue</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">Who needs attention next</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">
                {followupSummary.loadedAt ? lastRefreshLabel(followupSummary.loadedAt) : "Not refreshed yet"}
                {followupSummary.error ? ` · ${followupSummary.error}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadFollowupSummary(true)}
              disabled={followupSummary.loading}
              className="px-5 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
            >
              <RefreshCw size={14} className={followupSummary.loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <MiniMetric label="Due now" value={followupSummary.dueNow} tone="green" />
            <MiniMetric label="Scheduled" value={followupSummary.scheduled} tone="blue" />
            <MiniMetric label="Sent today" value={`${followupSummary.sentToday}/${followupSummary.dailyLimit}`} tone="slate" />
            <MiniMetric label="Remaining" value={followupSummary.remainingToday} tone="blue" />
            <MiniMetric label="Per run" value={followupSummary.batchPerRun} tone="purple" />
            <MiniMetric label="Wait 1st open" value={followupSummary.waitingFirstOpen} tone="orange" />
            <MiniMetric label="Wait new open" value={followupSummary.waitingNewEngagement} tone="orange" />
            <MiniMetric label="Blocked/failed" value={followupSummary.blocked + followupSummary.failedRetry + followupSummary.failedFinal} tone="red" />
          </div>
        </div>

        <div className="bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">System Safety</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">Firestore + sender limits</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">{firestoreUsageNote}</p>
            </div>
            <button
              type="button"
              onClick={() => loadFirebaseUsage(true)}
              disabled={firebaseUsage.loading}
              className="px-5 py-3 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
            >
              <RefreshCw size={14} className={firebaseUsage.loading ? "animate-spin" : ""} /> Usage
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            <ProgressLine
              label="Firestore reads"
              value={`${firebaseUsage.usage.estimatedReadsToday}/${firebaseUsage.quota.readsPerDay}`}
              percent={firebaseUsage.usage.readPercent}
            />
            <ProgressLine
              label="Firestore writes"
              value={`${firebaseUsage.usage.estimatedWritesToday}/${firebaseUsage.quota.writesPerDay}`}
              percent={firebaseUsage.usage.writePercent}
              tone="green"
            />
            <ProgressLine
              label="Storage"
              value={`${firebaseUsage.usage.estimatedStorageMb} MB/${firebaseUsage.quota.storageMb} MB`}
              percent={firebaseUsage.usage.storagePercent}
              tone="purple"
            />
            <ProgressLine
              label="Sender daily usage"
              value={`${senderUsage.sent}/${senderUsage.limit}`}
              max={`${senderUsage.left} left today`}
              percent={senderUsage.percent}
              tone="green"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {senderUsage.rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] font-black text-gray-700">{row.email}</p>
                  <p className="text-[10px] font-black text-gray-400">{row.sent}/{row.limit}</p>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.percent >= 90 ? "bg-red-500" : row.percent >= 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9px] font-bold text-gray-400 mt-3">
            {firebaseUsage.note || "Values are practical estimates. Firebase Console remains the final quota source."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[30px] border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Free-tier Usage Details</p>
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">Database footprint by collection</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={cleanupLoading}
              onClick={() => runSystemCleanup("archive_replied", 30)}
              className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-[9px] font-black uppercase disabled:opacity-40"
            >
              Archive replied 30d+
            </button>
            <button
              type="button"
              disabled={cleanupLoading}
              onClick={() => runSystemCleanup("archive_finished", 30)}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[9px] font-black uppercase disabled:opacity-40"
            >
              Archive finished 30d+
            </button>
            <button
              type="button"
              disabled={cleanupLoading}
              onClick={() => runSystemCleanup("trash_test_leads", 1)}
              className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[9px] font-black uppercase disabled:opacity-40"
            >
              Trash test leads
            </button>
            <button
              type="button"
              disabled={cleanupLoading}
              onClick={() => runSystemCleanup("delete_old_events", 90)}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase disabled:opacity-40"
            >
              Delete events 90d+
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-5">
          {[
            ["Total leads", firebaseUsage.counts.leadCount],
            ["Active", firebaseUsage.counts.activeLeadCount],
            ["Archived", firebaseUsage.counts.archivedLeadCount],
            ["Trash", firebaseUsage.counts.trashedLeadCount],
            ["Events", firebaseUsage.counts.emailEventCount],
            ["Suppressed", firebaseUsage.counts.suppressionCount],
            ["Initial today", firebaseUsage.counts.initialSentToday],
            ["FUP today", firebaseUsage.counts.followupSentToday],
          ].map(([label, value]) => (
            <div key={String(label)} className="px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-base font-black text-gray-900">{value}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Hot Lead Priority</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">Best leads based on meaningful open/click/reply signals.</p>
            </div>
            <button type="button" onClick={() => setActiveTab("leads")} className="text-[10px] font-black text-blue-600 uppercase">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {sortedHotLeads.length === 0 ? (
              <p className="text-xs font-bold text-gray-400">No hot leads yet.</p>
            ) : (
              sortedHotLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLead(lead)}
                  className="w-full p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-gray-100 text-left transition-all"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-gray-900 truncate">
                        {lead.name || "Unknown"} / {lead.company_name || "No Company"}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 truncate">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-orange-600">Score {leadScore(lead)}</p>
                      <p className="text-[9px] font-black text-gray-400">
                        O:{lead.open_count || 0} C:{lead.click_count || 0}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-black text-white rounded-[35px] p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-black uppercase tracking-tighter mb-6">Automation Health</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black">
                <span className="text-white/50">Trigger Mode</span>
                <span>Open/Click</span>
              </div>
              <div className="flex justify-between text-xs font-black">
                <span className="text-white/50">Daily Follow-up Limit</span>
                <span>{dailyFollowupLimit}</span>
              </div>
              <div className="flex justify-between text-xs font-black">
                <span className="text-white/50">Active Leads</span>
                <span>{firestoreTracking.activeAutomation}</span>
              </div>
              <div className="flex justify-between text-xs font-black">
                <span className="text-white/50">Suppressed</span>
                <span>{analytics.bounced + analytics.unsubscribed}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("automation")}
              className="w-full mt-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase"
            >
              Manage Automation
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/30 blur-[80px] rounded-full" />
        </div>

        <div className="lg:col-span-3 p-5 border border-gray-100 rounded-[30px] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            {filteredLeadCount} filtered from {leads.length} cached lead(s)
          </p>
          <button
            type="button"
            onClick={fetchMoreLeads}
            disabled={loadingMoreLeads || !hasMoreLeads}
            className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-2"
          >
            <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading more..." : "See more leads") : "No more leads"}
          </button>
        </div>
      </div>
    </div>
  );
}
