"use client";

import React, { type ReactNode, useMemo, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import type { SenderAccount } from "../../../lib/senders";

import type { SheetLead } from "./types";
import { normalizeOptionalUrl, stripHtml } from "./utils";
import {
  getSheetChannelStatus,
  getSheetOutreachChannel,
  getSheetReadiness,
  getSheetReportStatus,
  isSheetEmailOutreachCandidate,
  isSheetLinkedInOutreachCandidate,
  isSheetReportReady,
  sheetValue,
  type SheetOutreachChannel,
} from "./sheet-readiness";

type SheetSourceFilter = "all" | "email" | "linkedin" | "needs_review" | "report_ready" | "sent";

type SheetQueuePanelProps = {
  sheetLeads: SheetLead[];
  sheetStatus: string;
  sheetLeadFilter: string;
  sheetApprovalFilter: string;
  sheetSendFilter: string;
  sheetLoading: boolean;
  selectedSheetRows?: number[];
  sending?: boolean;
  activeSender?: SenderAccount;
  hasCachedLeads: boolean;
  setSheetLeadFilter: (value: string) => void;
  setSheetApprovalFilter: (value: string) => void;
  setSheetSendFilter: (value: string) => void;
  setSending?: (value: boolean) => void;
  setSheetStatus: (value: string) => void;
  loadSheetLeads: (force?: boolean) => Promise<void>;
  sendSelectedSheetLeads?: () => Promise<void>;
  syncSheetTrackingFromFirestore: () => Promise<void>;
  toggleAllVisibleSheetRows?: () => void;
  toggleSheetRow?: (rowNumber: number) => void;
  fillOutreachFromSheet: (lead: SheetLead) => void;
  queueSheetLead?: (lead: SheetLead) => Promise<void>;
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
  tone?: "blue" | "green" | "orange" | "red" | "indigo";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-600"
      : tone === "orange"
        ? "bg-orange-50 text-orange-600"
        : tone === "red"
          ? "bg-red-50 text-red-600"
          : tone === "indigo"
            ? "bg-indigo-50 text-indigo-600"
            : "bg-blue-50 text-blue-600";

  return (
    <div className="bg-white rounded-[30px] border border-gray-100 p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${toneClass} flex items-center justify-center mb-5`}>{icon}</div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function ChannelBadge({ channel, note }: { channel: SheetOutreachChannel; note?: string }) {
  const className =
    channel === "email"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : channel === "linkedin"
        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
        : "bg-slate-50 text-slate-600 border-slate-100";
  const label = channel === "email" ? "Email" : channel === "linkedin" ? "LinkedIn" : "Review";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${className}`} title={note || label}>
      {channel === "email" ? <Mail size={12} /> : channel === "linkedin" ? <MessageSquare size={12} /> : <AlertCircle size={12} />}
      {label}
    </span>
  );
}

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <div className="mt-1 text-sm font-bold text-gray-800 break-words">{value || "—"}</div>
    </div>
  );
}

function truncateText(value: string, limit = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

export default function SheetQueuePanel({
  sheetLeads,
  sheetStatus,
  sheetLeadFilter,
  sheetApprovalFilter,
  sheetSendFilter,
  sheetLoading,
  hasCachedLeads,
  setSheetLeadFilter,
  setSheetApprovalFilter,
  setSheetSendFilter,
  setSheetStatus,
  loadSheetLeads,
  syncSheetTrackingFromFirestore,
  fillOutreachFromSheet,
}: SheetQueuePanelProps) {
  const [sourceFilter, setSourceFilter] = useState<SheetSourceFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);

  const stats = useMemo(() => {
    const email = sheetLeads.filter((lead) => getSheetOutreachChannel(lead) === "email").length;
    const linkedin = sheetLeads.filter((lead) => getSheetOutreachChannel(lead) === "linkedin").length;
    const reportReady = sheetLeads.filter(isSheetReportReady).length;
    const needsReview = sheetLeads.filter((lead) => !getSheetReadiness(lead).ready).length;
    return { email, linkedin, reportReady, needsReview };
  }, [sheetLeads]);

  const visibleRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return sheetLeads.filter((lead) => {
      const channel = getSheetOutreachChannel(lead);
      const readiness = getSheetReadiness(lead);
      const sendStatus = sheetValue(lead, "Send Status").toLowerCase();

      if (sourceFilter === "email" && channel !== "email") return false;
      if (sourceFilter === "linkedin" && channel !== "linkedin") return false;
      if (sourceFilter === "needs_review" && readiness.ready) return false;
      if (sourceFilter === "report_ready" && !isSheetReportReady(lead)) return false;
      if (sourceFilter === "sent" && !["sent", "scheduled", "queued"].includes(sendStatus)) return false;

      if (!search) return true;
      const haystack = [
        sheetValue(lead, "Business Name"),
        sheetValue(lead, "Website URL"),
        sheetValue(lead, "Final Email"),
        sheetValue(lead, "Social Link"),
        sheetValue(lead, "Lead Status"),
        sheetValue(lead, "Lead Label"),
        sheetValue(lead, "Main Issue"),
        sheetValue(lead, "Proof Points"),
        String(lead.rowNumber || ""),
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }, [searchTerm, sheetLeads, sourceFilter]);

  const selectedLead = useMemo(() => {
    if (!visibleRows.length) return null;
    return visibleRows.find((lead) => Number(lead.rowNumber) === selectedRowNumber) || visibleRows[0];
  }, [selectedRowNumber, visibleRows]);

  const selectedChannel = selectedLead ? getSheetOutreachChannel(selectedLead) : "unknown";
  const selectedReadiness = selectedLead ? getSheetReadiness(selectedLead) : null;
  const selectedChannelStatus = selectedLead ? getSheetChannelStatus(selectedLead) : null;
  const selectedReportUrl = selectedLead ? normalizeOptionalUrl(sheetValue(selectedLead, "Report URL")) : "";
  const selectedWebsiteUrl = selectedLead ? normalizeOptionalUrl(sheetValue(selectedLead, "Website URL")) : "";
  const selectedLinkedInUrl = selectedLead ? normalizeOptionalUrl(sheetValue(selectedLead, "Social Link")) : "";
  const canOpenEmailComposer = selectedLead ? isSheetEmailOutreachCandidate(selectedLead) : false;
  const canUseLinkedIn = selectedLead ? isSheetLinkedInOutreachCandidate(selectedLead) : false;

  const openInSendEmail = (lead: SheetLead) => {
    fillOutreachFromSheet(lead);
  };

  const copyLinkedInLink = async () => {
    if (!selectedLinkedInUrl) {
      window.alert("No LinkedIn link found for this row.");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedLinkedInUrl);
      setSheetStatus(`LinkedIn link copied for row ${selectedLead?.rowNumber}.`);
    } catch {
      window.alert("Could not copy the LinkedIn link. Open it manually instead.");
    }
  };

  const filterButtons: { id: SheetSourceFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: sheetLeads.length },
    { id: "email", label: "Email", count: stats.email },
    { id: "linkedin", label: "LinkedIn", count: stats.linkedin },
    { id: "needs_review", label: "Needs Review", count: stats.needsReview },
    { id: "report_ready", label: "Report Ready", count: stats.reportReady },
    { id: "sent", label: "Sent/Scheduled" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Email Leads" value={stats.email} icon={<Mail size={22} />} />
        <StatCard label="LinkedIn Leads" value={stats.linkedin} icon={<MessageSquare size={22} />} tone="indigo" />
        <StatCard label="Report Ready" value={stats.reportReady} icon={<FileText size={22} />} tone="green" />
        <StatCard label="Needs Review" value={stats.needsReview} icon={<AlertCircle size={22} />} tone={stats.needsReview ? "orange" : "green"} />
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sheet Lead Source Overview</p>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-1">Review Sheet Leads Before Outreach</h2>
            <p className="text-sm text-gray-500 font-semibold mt-1 max-w-3xl">
              Use this tab to understand each audit row, confirm whether it belongs to Email or LinkedIn outreach, and open email-ready rows in the Send Email composer for final review.
            </p>
            {sheetStatus && <p className="text-xs font-bold text-blue-600 mt-2">{sheetStatus}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={sheetLeadFilter}
              onChange={(event) => setSheetLeadFilter(event.target.value)}
              className="px-4 py-3 rounded-2xl border border-gray-100 text-xs font-black uppercase"
            >
              <option value="Qualified">Hot + Good</option>
              <option value="Hot Lead">Hot Lead</option>
              <option value="Good Lead">Good Lead</option>
              <option value="Maybe Check">Maybe Check</option>
              <option value="Low Priority">Low Priority</option>
              <option value="All">All Lead Status</option>
            </select>

            <select
              value={sheetApprovalFilter}
              onChange={(event) => setSheetApprovalFilter(event.target.value)}
              className="px-4 py-3 rounded-2xl border border-gray-100 text-xs font-black uppercase"
            >
              <option value="All">All Approval</option>
              <option value="System Qualified">System Qualified</option>
              <option value="Manual Approved">Manual Approved</option>
              <option value="Approved">Approved</option>
              <option value="Pending Review">Pending Review</option>
            </select>

            <select
              value={sheetSendFilter}
              onChange={(event) => setSheetSendFilter(event.target.value)}
              className="px-4 py-3 rounded-2xl border border-gray-100 text-xs font-black uppercase"
            >
              <option value="Not Sent">Not Sent</option>
              <option value="Sent">Sent</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Failed">Failed</option>
              <option value="All">All Send Status</option>
            </select>

            <button
              type="button"
              onClick={() => loadSheetLeads(true)}
              disabled={sheetLoading}
              className="px-4 py-3 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50"
            >
              {sheetLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
            </button>

            <button
              type="button"
              onClick={syncSheetTrackingFromFirestore}
              disabled={sheetLoading || !hasCachedLeads}
              className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} /> Sync Tracking
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSourceFilter(filter.id)}
                className={`rounded-full px-4 py-2 text-[10px] font-black uppercase transition-all ${
                  sourceFilter === filter.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {filter.label}{typeof filter.count === "number" ? ` (${filter.count})` : ""}
              </button>
            ))}
          </div>

          <label className="relative block min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search business, email, website..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-9 pr-4 text-xs font-bold outline-none focus:border-blue-200 focus:bg-white"
            />
          </label>
        </div>
      </div>

      {selectedLead ? (
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
          <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sheet rows</p>
                <p className="text-sm font-bold text-gray-500">Showing {visibleRows.length} of {sheetLeads.length} loaded rows</p>
              </div>
              {sheetLoading ? <Loader2 size={18} className="animate-spin text-blue-600" /> : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Channel</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Details</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {visibleRows.map((lead) => {
                    const rowNumber = Number(lead.rowNumber);
                    const isSelected = rowNumber === Number(selectedLead.rowNumber);
                    const channel = getSheetOutreachChannel(lead);
                    const channelStatus = getSheetChannelStatus(lead);
                    const readiness = getSheetReadiness(lead);
                    const reportStatus = getSheetReportStatus(lead);
                    const rowCanOpenEmail = isSheetEmailOutreachCandidate(lead);

                    return (
                      <tr
                        key={rowNumber}
                        onClick={() => setSelectedRowNumber(rowNumber)}
                        className={`${isSelected ? "bg-blue-50/60" : "hover:bg-gray-50/70"} cursor-pointer transition-colors`}
                      >
                        <td className="p-4 align-top min-w-[250px]">
                          <p className="font-black text-gray-900">{sheetValue(lead, "Business Name") || "Unnamed Lead"}</p>
                          <p className="text-xs text-gray-500 font-semibold mt-1">{sheetValue(lead, "Final Email") || "No email"}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Row {rowNumber}</p>
                        </td>

                        <td className="p-4 align-top min-w-[150px]">
                          <ChannelBadge channel={channel} note={channelStatus.note} />
                          <p className="mt-2 text-[10px] font-bold text-gray-400 leading-4">{channelStatus.note}</p>
                        </td>

                        <td className="p-4 align-top min-w-[340px]">
                          <p className="text-sm font-bold text-gray-700 line-clamp-2">{sheetValue(lead, "Main Issue") || "No issue summary"}</p>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{sheetValue(lead, "Proof Points") || "No proof points saved"}</p>
                          <div className={`mt-3 inline-flex rounded-xl border px-3 py-2 text-[10px] font-black uppercase ${reportStatus.tone}`}>
                            {reportStatus.label}
                          </div>
                        </td>

                        <td className="p-4 align-top min-w-[180px]">
                          <p className="text-xs font-black text-green-600 uppercase">{sheetValue(lead, "Approval Status") || "Pending"}</p>
                          <p className="text-xs font-black text-blue-600 uppercase mt-1">{sheetValue(lead, "Send Status") || "Not Sent"}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            Open {sheetValue(lead, "Open Count") || "0"} / Click {sheetValue(lead, "Click Count") || "0"}
                          </p>
                          <p className={`mt-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase leading-4 ${readiness.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {readiness.ready ? "Ready" : readiness.note}
                          </p>
                        </td>

                        <td className="p-4 align-top min-w-[160px]">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openInSendEmail(lead);
                            }}
                            disabled={!rowCanOpenEmail}
                            className="w-full rounded-xl bg-gray-900 px-3 py-2 text-[10px] font-black uppercase text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            Open in Send Email
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden xl:sticky xl:top-24 self-start">
            <div className="bg-slate-950 p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Selected audit row</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">{sheetValue(selectedLead, "Business Name") || "Unnamed Lead"}</h3>
                <p className="mt-1 text-sm font-bold text-slate-300">{sheetValue(selectedLead, "Website URL") || "No website saved"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ChannelBadge channel={selectedChannel} note={selectedChannelStatus?.note} />
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white">
                    Score {sheetValue(selectedLead, "Audit Score") || "N/A"}
                  </span>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            </div>

            <div className="p-5 space-y-4">
              <div className={`rounded-3xl border p-4 ${selectedChannelStatus?.tone || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">{selectedChannelStatus?.label || "Needs review"}</p>
                <p className="mt-1 text-xs font-bold leading-relaxed opacity-80">{selectedChannelStatus?.note}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailLine label="Main issue" value={sheetValue(selectedLead, "Main Issue") || "No main issue saved"} />
                <DetailLine label="Proof points" value={truncateText(sheetValue(selectedLead, "Proof Points"), 320) || "No proof points saved"} />
                <DetailLine label="Email subject" value={sheetValue(selectedLead, "Email Subject") || "No subject saved"} />
                <DetailLine label="Email body preview" value={truncateText(stripHtml(sheetValue(selectedLead, "Email Body")), 260) || "No email body saved"} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailLine label="Email" value={sheetValue(selectedLead, "Final Email") || "No email"} />
                <DetailLine label="Send status" value={sheetValue(selectedLead, "Send Status") || "Not Sent"} />
                <DetailLine label="Approval" value={sheetValue(selectedLead, "Approval Status") || "Pending"} />
                <DetailLine label="Tracking" value={`Open ${sheetValue(selectedLead, "Open Count") || "0"} / Click ${sheetValue(selectedLead, "Click Count") || "0"}`} />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openInSendEmail(selectedLead)}
                  disabled={!canOpenEmailComposer}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase text-white shadow-sm disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Send size={14} /> Open in Send Email
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={selectedReportUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase ${
                      selectedReportUrl ? "bg-emerald-50 text-emerald-700" : "pointer-events-none bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Eye size={14} /> View Report
                  </a>

                  <a
                    href={selectedWebsiteUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase ${
                      selectedWebsiteUrl ? "bg-slate-100 text-slate-700" : "pointer-events-none bg-gray-100 text-gray-400"
                    }`}
                  >
                    <ExternalLink size={14} /> Website
                  </a>
                </div>

                <button
                  type="button"
                  onClick={copyLinkedInLink}
                  disabled={!canUseLinkedIn || !selectedLinkedInUrl}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-black uppercase text-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <MessageSquare size={14} /> Copy LinkedIn Link
                </button>
              </div>

              {selectedReadiness && !selectedReadiness.ready ? (
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-amber-800">
                  <p className="text-[10px] font-black uppercase tracking-widest">Needs review before action</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed">{selectedReadiness.note}</p>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[35px] p-10 text-center text-gray-400 font-bold shadow-sm">
          No Sheet leads found for this filter.
        </div>
      )}
    </div>
  );
}
