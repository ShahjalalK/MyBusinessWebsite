"use client";

import React, { type ReactNode } from "react";
import {
  AlertCircle,
  ChevronDown,
  Flame,
  Mail,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import type { FirebaseUsageState, FollowupSummaryState, Lead, MainTab } from "./types";
import { ACTIVE_STATUSES } from "./constants";
import { leadScore } from "./followup-utils";

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
  loadFollowupSummary: (force?: boolean) => Promise<void>;
  loadFirebaseUsage: (force?: boolean) => Promise<void>;
  runSystemCleanup: (action: string, days?: number) => Promise<void>;
  setActiveTab: (tab: MainTab) => void;
  setSelectedLead: (lead: Lead | null) => void;
  fetchMoreLeads: () => Promise<void> | void;
};

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "blue" | "green" | "orange" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-600"
      : tone === "orange"
        ? "bg-orange-50 text-orange-600"
        : tone === "red"
          ? "bg-red-50 text-red-600"
          : "bg-blue-50 text-blue-600";

  return (
    <div className="bg-white rounded-[30px] border border-gray-100 p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${toneClass} flex items-center justify-center mb-5`}>{icon}</div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
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
  loadFollowupSummary,
  loadFirebaseUsage,
  runSystemCleanup,
  setActiveTab,
  setSelectedLead,
  fetchMoreLeads,
}: OverviewPanelProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cached Leads" value={analytics.total} icon={<Mail size={22} />} />
        <StatCard label="Hot Leads" value={analytics.hot} icon={<Flame size={22} />} tone="orange" />
        <StatCard label="Replies" value={analytics.replied} icon={<MessageSquare size={22} />} tone="green" />
        <StatCard label="Bounces" value={analytics.bounced} icon={<AlertCircle size={22} />} tone="red" />
      </div>

      <div className="bg-white rounded-[30px] border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Follow-up Today</p>
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">One-glance follow-up report</h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1">
              {followupSummary.loadedAt
                ? `Last refreshed ${new Date(followupSummary.loadedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}`
                : "Not refreshed yet"}
              {followupSummary.error ? ` · ${followupSummary.error}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadFollowupSummary(true)}
            disabled={followupSummary.loading}
            className="px-5 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
          >
            <RefreshCw size={14} className={followupSummary.loading ? "animate-spin" : ""} /> Refresh Report
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3 mt-5">
          {[
            ["Due now", followupSummary.dueNow, "text-green-600"],
            ["Scheduled", followupSummary.scheduled, "text-blue-600"],
            ["Sent today", `${followupSummary.sentToday}/${followupSummary.dailyLimit}`, "text-gray-900"],
            ["Remaining", followupSummary.remainingToday, "text-blue-600"],
            ["Per run", followupSummary.batchPerRun, "text-purple-600"],
            ["Wait 1st open", followupSummary.waitingFirstOpen, "text-orange-500"],
            ["Wait new open", followupSummary.waitingNewEngagement, "text-orange-500"],
            ["Template block", followupSummary.templateBlocked, "text-red-500"],
            ["Retry/fail", followupSummary.failedRetry + followupSummary.failedFinal, "text-red-600"],
            ["Blocked", followupSummary.blocked, "text-gray-500"],
          ].map(([label, value, tone]) => (
            <div key={String(label)} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className={`text-lg font-black ${tone}`}>{value}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[30px] border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Firebase Usage Monitor</p>
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">Free-tier safety overview</h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1">
              {firebaseUsage.loadedAt
                ? `Last refreshed ${new Date(firebaseUsage.loadedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}`
                : "Not refreshed yet"}
              {firebaseUsage.error ? ` · ${firebaseUsage.error}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadFirebaseUsage(true)}
            disabled={firebaseUsage.loading}
            className="px-5 py-3 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
          >
            <RefreshCw size={14} className={firebaseUsage.loading ? "animate-spin" : ""} /> Refresh Usage
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            ["Reads", `${firebaseUsage.usage.estimatedReadsToday}/${firebaseUsage.quota.readsPerDay}`, `${firebaseUsage.usage.readPercent}%`],
            ["Writes", `${firebaseUsage.usage.estimatedWritesToday}/${firebaseUsage.quota.writesPerDay}`, `${firebaseUsage.usage.writePercent}%`],
            ["Storage", `${firebaseUsage.usage.estimatedStorageMb} MB/${firebaseUsage.quota.storageMb} MB`, `${firebaseUsage.usage.storagePercent}%`],
            ["Deletes", `${firebaseUsage.usage.estimatedDeletesToday}/${firebaseUsage.quota.deletesPerDay}`, `${firebaseUsage.usage.deletePercent}%`],
          ].map(([label, value, percent]) => (
            <div key={String(label)} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-black text-gray-900">{value}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">
                {label} · {percent}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
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
            <div key={String(label)} className="px-3 py-3 rounded-2xl bg-white border border-gray-100">
              <p className="text-base font-black text-gray-900">{value}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
        <p className="text-[9px] font-bold text-gray-400 mt-3">
          {firebaseUsage.note || "Values are practical estimates. Firebase Console remains the final quota source."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Hot Lead Priority</h2>
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
                <span>{leads.filter((lead) => !lead.stopAutomation && ACTIVE_STATUSES.has(String(lead.status || ""))).length}</span>
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
        <div className="p-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
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
