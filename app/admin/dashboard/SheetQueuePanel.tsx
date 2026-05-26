"use client";

import React, { type ReactNode } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MousePointer2,
  RefreshCw,
  Send,
} from "lucide-react";
import type { SenderAccount } from "../../../lib/senders";

import type { SheetLead } from "./types";
import { normalizeOptionalUrl } from "./utils";
import {
  getSheetReadiness,
  getSheetReportStatus,
  isSheetReportReady,
  sheetValue,
} from "./sheet-readiness";

type SheetQueuePanelProps = {
  sheetLeads: SheetLead[];
  sheetStatus: string;
  sheetLeadFilter: string;
  sheetApprovalFilter: string;
  sheetSendFilter: string;
  sheetLoading: boolean;
  selectedSheetRows: number[];
  sending: boolean;
  activeSender?: SenderAccount;
  hasCachedLeads: boolean;
  setSheetLeadFilter: (value: string) => void;
  setSheetApprovalFilter: (value: string) => void;
  setSheetSendFilter: (value: string) => void;
  setSending: (value: boolean) => void;
  setSheetStatus: (value: string) => void;
  loadSheetLeads: (force?: boolean) => Promise<void>;
  sendSelectedSheetLeads: () => Promise<void>;
  syncSheetTrackingFromFirestore: () => Promise<void>;
  toggleAllVisibleSheetRows: () => void;
  toggleSheetRow: (rowNumber: number) => void;
  fillOutreachFromSheet: (lead: SheetLead) => void;
  queueSheetLead: (lead: SheetLead) => Promise<void>;
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

export default function SheetQueuePanel({
  sheetLeads,
  sheetStatus,
  sheetLeadFilter,
  sheetApprovalFilter,
  sheetSendFilter,
  sheetLoading,
  selectedSheetRows,
  sending,
  activeSender,
  hasCachedLeads,
  setSheetLeadFilter,
  setSheetApprovalFilter,
  setSheetSendFilter,
  setSending,
  setSheetStatus,
  loadSheetLeads,
  sendSelectedSheetLeads,
  syncSheetTrackingFromFirestore,
  toggleAllVisibleSheetRows,
  toggleSheetRow,
  fillOutreachFromSheet,
  queueSheetLead,
}: SheetQueuePanelProps) {
  const approvedReady = sheetLeads.filter((lead) => getSheetReadiness(lead).ready).length;
  const selectedReady = sheetLeads.filter((lead) => selectedSheetRows.includes(Number(lead.rowNumber)) && getSheetReadiness(lead).ready).length;
  const allReadyRowsSelected =
    sheetLeads.length > 0 &&
    sheetLeads
      .filter((lead) => getSheetReadiness(lead).ready)
      .every((lead) => selectedSheetRows.includes(Number(lead.rowNumber)));

  const handleQueueSingleLead = async (lead: SheetLead, rowNumber: number) => {
    if (!window.confirm(`Queue row ${rowNumber} for cron sending?`)) return;

    setSending(true);
    try {
      await queueSheetLead(lead);
      setSheetStatus(`Row ${rowNumber} queued. Cron will send it.`);
      await loadSheetLeads(true);
    } catch (error: any) {
      window.alert(error.message || "Queue failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sheet Leads" value={sheetLeads.length} icon={<FileText size={22} />} />
        <StatCard label="Qualified Ready" value={approvedReady} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="Selected" value={selectedReady} icon={<MousePointer2 size={22} />} tone="orange" />
        <StatCard label="Active Sender" value={activeSender ? activeSender.email.split("@")[0] : "N/A"} icon={<Mail size={22} />} />
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Google Sheet Hot Leads</h2>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              System-scored Hot/Good leads from your Python audit engine. Approval is optional; Send Status controls outreach.
            </p>
            {sheetStatus && <p className="text-xs font-bold text-blue-600 mt-2">{sheetStatus}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={sheetLeadFilter}
              onChange={(e) => setSheetLeadFilter(e.target.value)}
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
              onChange={(e) => setSheetApprovalFilter(e.target.value)}
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
              onChange={(e) => setSheetSendFilter(e.target.value)}
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
              onClick={sendSelectedSheetLeads}
              disabled={sending || selectedSheetRows.length === 0 || !activeSender}
              className="px-4 py-3 rounded-2xl bg-green-600 text-white text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Queue Selected
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
      </div>

      <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4">
                  <input type="checkbox" checked={allReadyRowsSelected} onChange={toggleAllVisibleSheetRows} />
                </th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {sheetLeads.map((lead) => {
                const rowNumber = Number(lead.rowNumber);
                const isSelected = selectedSheetRows.includes(rowNumber);
                const readiness = getSheetReadiness(lead);
                const reportReady = isSheetReportReady(lead);
                const reportStatus = getSheetReportStatus(lead);

                return (
                  <tr key={rowNumber} className={isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/50"}>
                    <td className="p-4 align-top">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!readiness.ready}
                        onChange={() => toggleSheetRow(rowNumber)}
                      />
                    </td>

                    <td className="p-4 align-top min-w-[280px]">
                      <p className="font-black text-gray-900">{sheetValue(lead, "Business Name") || "Unnamed Lead"}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-1">{sheetValue(lead, "Final Email") || "No email"}</p>
                      <a
                        href={normalizeOptionalUrl(sheetValue(lead, "Website URL")) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 font-bold inline-flex items-center gap-1 mt-1"
                      >
                        {sheetValue(lead, "Website URL") || "No website"} <ExternalLink size={12} />
                      </a>
                      <div className={`mt-3 rounded-2xl border px-3 py-2 ${reportStatus.tone}`}>
                        {reportReady ? (
                          <a
                            href={normalizeOptionalUrl(sheetValue(lead, "Report URL")) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-xs font-black"
                          >
                            {reportStatus.label} <ExternalLink size={12} className="inline" />
                          </a>
                        ) : (
                          <p className="text-xs font-black">{reportStatus.label}</p>
                        )}
                        <p className="mt-1 text-[10px] font-bold opacity-80">{reportStatus.note}</p>
                      </div>
                    </td>

                    <td className="p-4 align-top min-w-[320px]">
                      <p className="text-sm font-bold text-gray-700 line-clamp-2">
                        {sheetValue(lead, "Main Issue") || "No issue summary"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{sheetValue(lead, "Proof Points")}</p>
                    </td>

                    <td className="p-4 align-top">
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-black">
                        {sheetValue(lead, "Audit Score") || "N/A"}
                      </span>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-2">{sheetValue(lead, "Lead Label")}</p>
                    </td>

                    <td className="p-4 align-top">
                      <p className="text-xs font-black text-green-600 uppercase">{sheetValue(lead, "Approval Status") || "Pending"}</p>
                      <p className="text-xs font-black text-blue-600 uppercase mt-1">{sheetValue(lead, "Send Status") || "Not Sent"}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">
                        Open {sheetValue(lead, "Open Count") || "0"} / Click {sheetValue(lead, "Click Count") || "0"}
                      </p>
                      <p
                        className={`mt-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase leading-4 ${
                          readiness.ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {readiness.ready ? "Ready to queue" : readiness.note}
                      </p>
                    </td>

                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <button
                          type="button"
                          onClick={() => fillOutreachFromSheet(lead)}
                          className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase"
                        >
                          Load Editor
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQueueSingleLead(lead, rowNumber)}
                          disabled={sending || !readiness.ready || !activeSender}
                          className="px-3 py-2 rounded-xl bg-green-50 text-green-700 text-[10px] font-black uppercase disabled:opacity-50"
                        >
                          Queue Send
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sheetLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    No Sheet leads found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
