"use client";

import React, { type ReactNode, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Loader2,
  MessageSquare,
  MousePointer2,
  RefreshCw,
} from "lucide-react";
import { ACTIVE_SENDERS } from "../../../lib/senders";

import type { Lead } from "./types";

type AnalyticsSummary = {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  hot: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
};

type AnalyticsPanelProps = {
  analytics: AnalyticsSummary;
  leads: Lead[];
  postmasterStatus: string;
  postmasterLoading: boolean;
  postmasterHealth: any;
  loadPostmasterHealth: () => Promise<void>;
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

export default function AnalyticsPanel({
  analytics,
  leads,
  postmasterStatus,
  postmasterLoading,
  postmasterHealth,
  loadPostmasterHealth,
}: AnalyticsPanelProps) {
  const senderPerformance = useMemo(() => {
    return ACTIVE_SENDERS.map((sender) => {
      const senderLeads = leads.filter((lead) => lead.sender_email === sender.email);
      const replied = senderLeads.filter((lead) => lead.status === "replied").length;
      const opened = senderLeads.filter((lead) => Number(lead.open_count || 0) > 0).length;
      const clicked = senderLeads.filter((lead) => Number(lead.click_count || 0) > 0).length;

      return {
        ...sender,
        total: senderLeads.length,
        replied,
        opened,
        clicked,
      };
    });
  }, [leads]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Rate" value={`${analytics.openRate}%`} icon={<Activity size={22} />} />
        <StatCard label="Click Rate" value={`${analytics.clickRate}%`} icon={<MousePointer2 size={22} />} tone="orange" />
        <StatCard label="Reply Rate" value={`${analytics.replyRate}%`} icon={<MessageSquare size={22} />} tone="green" />
        <StatCard label="Bounce Rate" value={`${analytics.bounceRate}%`} icon={<AlertCircle size={22} />} tone="red" />
      </div>

      <div className="bg-slate-950 rounded-[35px] border border-slate-800 p-6 shadow-sm text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">Google Postmaster Tools</p>
            <p className="text-[11px] text-slate-300 mt-2 font-bold">
              Domain-level Gmail health: spam rate, reputation, authentication, and delivery errors.
            </p>
            {postmasterStatus && <p className="text-[10px] text-blue-200 mt-2 font-black uppercase">{postmasterStatus}</p>}
          </div>
          <button
            type="button"
            data-no-track="true"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              loadPostmasterHealth();
            }}
            disabled={postmasterLoading}
            className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {postmasterLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Load Postmaster
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <p className="text-[8px] text-slate-400 font-black uppercase">Domain</p>
            <p className="text-xs font-black mt-1">{postmasterHealth?.domain || "trackflowpro.com"}</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <p className="text-[8px] text-slate-400 font-black uppercase">Spam Rate</p>
            <p className="text-xs font-black mt-1">
              {postmasterHealth?.spamRate != null ? `${(Number(postmasterHealth.spamRate) * 100).toFixed(3)}%` : "N/A"}
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <p className="text-[8px] text-slate-400 font-black uppercase">Domain Reputation</p>
            <p className="text-xs font-black mt-1">{postmasterHealth?.domainReputation || "N/A"}</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <p className="text-[8px] text-slate-400 font-black uppercase">DMARC Pass</p>
            <p className="text-xs font-black mt-1">
              {postmasterHealth?.dmarcSuccessRatio != null ? `${(Number(postmasterHealth.dmarcSuccessRatio) * 100).toFixed(1)}%` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-5">Sender Performance</h2>

        <div className="space-y-3">
          {senderPerformance.map((sender) => (
            <div key={sender.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-black text-gray-900">{sender.name}</p>
                  <p className="text-[10px] font-bold text-gray-400">{sender.email}</p>
                </div>
                <p className="text-xs font-black text-blue-600">{sender.total} leads</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-sm font-black text-gray-900">{sender.opened}</p>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Opened</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-sm font-black text-gray-900">{sender.clicked}</p>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Clicked</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-sm font-black text-gray-900">{sender.replied}</p>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Replied</p>
                </div>
              </div>
            </div>
          ))}

          {senderPerformance.length === 0 && (
            <p className="text-xs font-bold text-gray-400 text-center py-6">No active senders are configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
