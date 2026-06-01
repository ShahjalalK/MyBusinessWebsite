"use client";

import React, { type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Loader2,
  MousePointer2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import type {
  FootprintMemoryRow,
  FootprintMemoryState,
  ReportAssetCleanupLeadMode,
  ReportAssetCleanupMode,
  ReportAssetCleanupState,
  ReportCleanupStep,
  SecureReportFilter,
  SecureReportListState,
  SecureReportRow,
} from "./types";
import { formatDate, normalizeOptionalUrl } from "./utils";


type CleanupPanelProps = {
  reportAssetCleanup: ReportAssetCleanupState;
  setReportAssetCleanup: (value: ReportAssetCleanupState | ((prev: ReportAssetCleanupState) => ReportAssetCleanupState)) => void;
  previewReportAssetCleanup: () => Promise<void>;
  runReportAssetCleanup: () => Promise<void>;
  secureReports: SecureReportListState;
  setSecureReports: (value: SecureReportListState | ((prev: SecureReportListState) => SecureReportListState)) => void;
  loadSecureReports: (force?: boolean) => Promise<void>;
  selectSecureReportForCleanup: (report: SecureReportRow) => void;
  viewSecureReportLead: (report: SecureReportRow) => void;
  toggleSecureReportSelection: (token: string) => void;
  runBulkReportCleanup: (dryRun?: boolean) => Promise<void>;
  footprintMemory: FootprintMemoryState;
  setFootprintMemory: (value: FootprintMemoryState | ((prev: FootprintMemoryState) => FootprintMemoryState)) => void;
  loadFootprintMemories: (force?: boolean) => Promise<void>;
  allowFootprintMemory: (email: string) => Promise<void>;
  forgetFootprintMemory: (email: string) => Promise<void>;
  forgetOldFootprintMemories: () => Promise<void>;
  deleteOldSuppressionFootprints: () => Promise<void>;
};

const REPORT_CLEANUP_MODES: Array<{ id: ReportAssetCleanupMode; label: string; note: string }> = [
  {
    id: "hard",
    label: "Delete All Data",
    note: "Deletes the secure report, PDF, preview image, chat history, Google Sheet row, and all email-send/event data linked to this report token. Choose whether to keep only a tiny footprint memory.",
  },
  {
    id: "assets_only",
    label: "Remove Files Only",
    note: "Removes only the PDF, preview image, and chat history. Saved report, Sheet row, and contact data stay unchanged.",
  },
];

const REPORT_LEAD_MODES: Array<{ id: ReportAssetCleanupLeadMode; label: string; note: string }> = [
  { id: "delete", label: "Delete All Data — Keep Footprint", note: "Best for contacted/no-reply leads. Deletes full report-linked data, including the Google Sheet row, but keeps tiny 45-day safety memory to avoid duplicate outreach." },
  { id: "delete_no_memory", label: "Delete All Data — No Footprint", note: "Only for test or never-contacted leads. Deletes full report-linked data, including the Google Sheet row. Backend blocks this when outreach history exists." },
];

const SECURE_REPORT_FILTERS: Array<{ id: SecureReportFilter; label: string }> = [
  { id: "all", label: "All reports" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired" },
  { id: "viewed", label: "Viewed" },
  { id: "no_view", label: "No view" },
  { id: "cleaned", label: "Cleaned" },
  { id: "test", label: "Test" },
];

function formatSourceLabel(sourceKind?: string, source?: string) {
  if (sourceKind === "sheet") return "Sheet Lead";
  if (sourceKind === "test") return "Test Email";
  if (String(source || "").includes("google_sheet")) return "Sheet Lead";
  return "Cold Email";
}

function reportStepTone(step: ReportCleanupStep): string {
  if (step.status === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (step.status === "warning") return "bg-amber-50 text-amber-700 border-amber-100";
  if (step.status === "error") return "bg-red-50 text-red-700 border-red-100";
  if (step.status === "planned") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function formatCleanupTarget(step: ReportCleanupStep): string {
  if (step.target) return step.target;
  const details = step.details || {};
  const targets = Array.isArray(details.targets) ? details.targets : [];
  const ids = Array.isArray(details.ids) ? details.ids : [];
  if (targets.length) return `${targets.length} target(s)`;
  if (ids.length) return `${ids.length} index id(s)`;
  return "—";
}

function reportStepLabel(step: ReportCleanupStep): string {
  const service = String(step.service || "").toLowerCase();
  const action = String(step.action || "").toLowerCase();

  if (service.includes("backblaze") || action.includes("pdf")) return "PDF file";
  if (service.includes("blob") || action.includes("preview")) return "Preview image";
  if (service.includes("supabase") || action.includes("chat")) return "Chat history";
  if (service.includes("google_sheet")) return "Spreadsheet row";
  if (action.includes("domain")) return "Report lookup";
  if (action.includes("lead")) return "Contact record";
  if (action.includes("report")) return "Secure report";
  if (service.includes("firestore")) return "Saved record";

  return step.service ? step.service.replace(/_/g, " ") : "Cleanup step";
}

function reportStepActionLabel(step: ReportCleanupStep): string {
  const action = String(step.action || "").toLowerCase();

  if (action.includes("delete_pdf")) return "Remove file";
  if (action.includes("delete_preview")) return "Remove image";
  if (action.includes("delete_report_chat")) return "Remove chat";
  if (action.includes("delete_report_email_events")) return "Remove email activity";
  if (action.includes("delete_report_document")) return "Delete record";
  if (action.includes("mark_report_cleaned")) return "Mark report cleaned";
  if (action.includes("cleanup_domain") || action.includes("delete_domain")) return "Update lookup";
  if (action.includes("delete_sheet_row")) return "Delete Sheet row";
  if (action.includes("clear_report_fields")) return "Clear Sheet fields";
  if (action.includes("mark_cleanup")) return "Mark cleaned";
  if (action.includes("archive_lead")) return "Archive lead";
  if (action.includes("trash_lead")) return "Move to trash";
  if (action.includes("delete_lead_no_memory")) return "Delete test contact";
  if (action.includes("delete_lead")) return "Delete contact";

  return step.action ? step.action.replace(/_/g, " ") : "Cleanup";
}

function reportStepStatusLabel(status: ReportCleanupStep["status"]): string {
  if (status === "planned") return "Will update";
  if (status === "ok") return "Done";
  if (status === "warning") return "Skipped";
  if (status === "error") return "Needs review";
  return "Not needed";
}

function reportStepMessage(step: ReportCleanupStep): string {
  if (step.error) return step.error;
  if (step.message) return step.message;

  if (step.status === "planned") return "This will run after you confirm.";
  if (step.status === "ok") return "Completed.";
  if (step.status === "skipped") return "Nothing needed for this item.";
  if (step.status === "warning") return "Skipped safely. Check details if needed.";
  if (step.status === "error") return "This item needs attention.";
  return "—";
}

function reportModeActionLabel(mode: ReportAssetCleanupMode): string {
  if (mode === "assets_only") return "Remove Files Only";
  return "Delete All Data";
}

function secureReportChannelLabel(channel?: SecureReportRow["channel"]): string {
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "email") return "Email";
  if (channel === "manual") return "Manual";
  return "Report";
}

function isSecureReportCleaned(report: SecureReportRow): boolean {
  const status = String(report.cleanupStatus || "").toLowerCase();
  return status.includes("clean") || status.includes("delete") || report.active === false;
}

function isSecureReportExpired(report: SecureReportRow): boolean {
  if (!report.pdfExpiresAt) return false;
  const ms = Date.parse(report.pdfExpiresAt);
  return Number.isFinite(ms) && ms <= Date.now();
}

function secureReportStatusLabel(report: SecureReportRow): string {
  if (isSecureReportCleaned(report)) return "Cleaned";
  if (report.ctaClicked || report.pdfDownloaded) return "High intent";
  if (report.reportPageViewed) return "Viewed";
  if (isSecureReportExpired(report)) return "Expired";
  return "Active";
}

function secureReportStatusTone(report: SecureReportRow): string {
  const status = secureReportStatusLabel(report);
  if (status === "High intent") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "Viewed") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "Expired") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "Cleaned") return "bg-gray-50 text-gray-500 border-gray-100";
  return "bg-violet-50 text-violet-700 border-violet-100";
}

function secureReportContactLabel(report: SecureReportRow): string {
  return report.contactStatusLabel || (report.contacted ? "Contacted" : "Not contacted");
}

function secureReportContactTone(report: SecureReportRow): string {
  const status = String(report.contactStatus || "").toLowerCase();
  if (["email_clicked", "replied"].includes(status)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "email_opened") return "bg-blue-50 text-blue-700 border-blue-100";
  if (["email_sent", "linkedin_sent", "contacted"].includes(status)) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (["bounced", "unsubscribed", "not_interested"].includes(status)) return "bg-amber-50 text-amber-700 border-amber-100";
  if (report.leadId && report.linkedLeadFound === false) return "bg-red-50 text-red-700 border-red-100";
  return "bg-gray-50 text-gray-500 border-gray-100";
}

function secureReportContactNote(report: SecureReportRow): string {
  if (report.leadId && report.linkedLeadFound === false) return "Lead not found";
  if (report.sentAt) return `Sent ${formatDate(report.sentAt)}`;
  if (report.lastEngagedAt) return `Engaged ${formatDate(report.lastEngagedAt)}`;
  if (Number(report.openCount || 0) || Number(report.clickCount || 0)) {
    return `${Number(report.openCount || 0)} open · ${Number(report.clickCount || 0)} click`;
  }
  if (report.contactReason) return String(report.contactReason).replace(/_/g, " ");
  return report.contacted ? "Outreach history found" : "Safe as test/no outreach";
}

function secureReportMatchesFilter(report: SecureReportRow, filter: SecureReportFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return !isSecureReportCleaned(report) && !isSecureReportExpired(report);
  if (filter === "expired") return isSecureReportExpired(report);
  if (filter === "viewed") return Boolean(report.reportPageViewed || report.pdfDownloaded || report.ctaClicked);
  if (filter === "no_view") return !report.reportPageViewed && !report.pdfDownloaded && !report.ctaClicked && !isSecureReportCleaned(report);
  if (filter === "cleaned") return isSecureReportCleaned(report);
  if (filter === "test") {
    const haystack = [report.source, report.companyName, report.domain, report.email, report.cleanupStatus].join(" ").toLowerCase();
    return haystack.includes("test") || haystack.includes("demo") || haystack.includes("fake");
  }
  return true;
}

function secureReportMatchesSearch(report: SecureReportRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [
    report.domain,
    report.domainSlug,
    report.companyName,
    report.email,
    report.token,
    report.reportUrl,
    report.source,
    report.cleanupStatus,
    report.contactStatus,
    report.contactStatusLabel,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

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


function formatFootprintReason(row: FootprintMemoryRow) {
  const reason = String(row.suppressionReason || row.reason || row.lastOutcome || "Safety memory").replace(/_/g, " ");
  return reason || "Safety memory";
}

function footprintStatusClass(status?: string) {
  if (status === "allowed_again") return "bg-emerald-50 text-emerald-700";
  if (status === "expired") return "bg-gray-100 text-gray-500";
  if (status === "requires_permission") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export default function CleanupPanel({
  reportAssetCleanup,
  setReportAssetCleanup,
  previewReportAssetCleanup,
  runReportAssetCleanup,
  secureReports,
  setSecureReports,
  loadSecureReports,
  selectSecureReportForCleanup,
  viewSecureReportLead,
  toggleSecureReportSelection,
  runBulkReportCleanup,
  footprintMemory,
  setFootprintMemory,
  loadFootprintMemories,
  allowFootprintMemory,
  forgetFootprintMemory,
  forgetOldFootprintMemories,
  deleteOldSuppressionFootprints,
}: CleanupPanelProps) {
  const reportCleanupInput = reportAssetCleanup.input.trim();
  const reportCleanupDisabled = reportAssetCleanup.loading || !reportCleanupInput;
  const deleteConfirmReady = reportAssetCleanup.mode === "assets_only" || reportAssetCleanup.confirmText.trim().toUpperCase() === "DELETE";
  const reportCleanupCanRun = !reportCleanupDisabled && deleteConfirmReady;
  const manifest = reportAssetCleanup.manifest;
  const activeReportMode = REPORT_CLEANUP_MODES.find((mode) => mode.id === reportAssetCleanup.mode) || REPORT_CLEANUP_MODES[0];
  const actionLabel = reportModeActionLabel(reportAssetCleanup.mode);
  const needsAttentionCount = reportAssetCleanup.steps.filter((step) => step.status === "warning" || step.status === "error").length;
  const doneCount = reportAssetCleanup.steps.filter((step) => step.status === "ok").length;
  const plannedCount = reportAssetCleanup.steps.filter((step) => step.status === "planned").length;
  const filteredSecureReports = secureReports.rows
    .filter((report) => secureReportMatchesFilter(report, secureReports.filter))
    .filter((report) => secureReportMatchesSearch(report, secureReports.search))
    .slice(0, 50);
  const selectedReportTokens = secureReports.selectedTokens || [];
  const selectedReportCount = selectedReportTokens.length;
  const allVisibleReportsSelected =
    filteredSecureReports.length > 0 && filteredSecureReports.every((report) => selectedReportTokens.includes(report.token));
  const bulkReportActionDisabled = Boolean(secureReports.bulkLoading || selectedReportCount === 0);
  const selectedReportActionLabel =
    reportAssetCleanup.mode === "assets_only" ? "Remove Files From Selected" : "Delete Selected Reports";
  const footprintRows = footprintMemory.rows.slice(0, 100);
  const blockedFootprintCount = footprintMemory.rows.filter(
    (row) => row.status !== "allowed_again" && row.source !== "suppression_list" && row.source !== "combined",
  ).length;
  const suppressionFootprintCount = footprintMemory.rows.filter((row) => row.source === "suppression_list" || row.source === "combined").length;
  const showingSuppressionFootprints = footprintMemory.filter === "suppression";
  const showingOldFootprints = footprintMemory.filter === "old";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} /> Cleanup Center
          </p>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Clean reports and manage footprint memory</h1>
          <p className="text-gray-500 text-sm font-semibold mt-2 max-w-3xl">
            Delete secure report data from every connected place, then manage the lightweight email memories that prevent accidental repeat outreach.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadSecureReports(true)}
            disabled={secureReports.loading}
            className="px-4 py-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw size={14} className={secureReports.loading ? "animate-spin" : ""} /> Refresh Reports
          </button>
          <button
            type="button"
            onClick={() => loadFootprintMemories(true)}
            disabled={footprintMemory.loading || footprintMemory.actionLoading}
            className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
          >
            <Database size={14} /> Refresh Memory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Secure reports" value={secureReports.rows.length} icon={<FileText size={22} />} />
        <StatCard label="Selected reports" value={selectedReportCount} icon={<MousePointer2 size={22} />} tone="orange" />
        <StatCard label="Footprints" value={footprintMemory.rows.length} icon={<Database size={22} />} tone="blue" />
        <StatCard label="Blocked" value={blockedFootprintCount} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="Protected" value={suppressionFootprintCount} icon={<ShieldCheck size={22} />} tone="orange" />
      </div>

      <div className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Secure Report Cleanup
            </p>
            <h2 className="text-2xl font-black tracking-tighter text-gray-900">Clean a report link or PDF</h2>
            <p className="text-sm text-gray-500 font-semibold mt-2 max-w-3xl">
              Paste a secure report URL or token. Preview shows exactly what will happen before any file or record changes.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} /> Preview first
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-4 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saved secure reports</p>
              <p className="text-sm font-bold text-gray-600 mt-1">Select a report from Firestore. Contact badges help you avoid deleting outreach history by mistake.</p>
            </div>
            <button
              type="button"
              onClick={() => loadSecureReports(true)}
              disabled={secureReports.loading}
              className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-gray-700 text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={14} className={secureReports.loading ? "animate-spin" : ""} /> Refresh Reports
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={secureReports.search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSecureReports((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search by domain, company, email, or token"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200"
              />
            </div>
            <select
              value={secureReports.filter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setSecureReports((prev) => ({ ...prev, filter: event.target.value as SecureReportFilter }))}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-700 outline-none"
            >
              {SECURE_REPORT_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-2xl bg-white border border-gray-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSecureReports((prev) => ({
                    ...prev,
                    selectedTokens: allVisibleReportsSelected
                      ? (prev.selectedTokens || []).filter((token) => !filteredSecureReports.some((report) => report.token === token))
                      : Array.from(new Set([...(prev.selectedTokens || []), ...filteredSecureReports.map((report) => report.token)])),
                    bulkError: "",
                    bulkStatus: "",
                  }))
                }
                disabled={!filteredSecureReports.length || secureReports.bulkLoading}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black uppercase disabled:opacity-50"
              >
                {allVisibleReportsSelected ? "Unselect visible" : "Select visible"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSecureReports((prev) => ({
                    ...prev,
                    selectedTokens: [],
                    selectedToken: "",
                    bulkError: "",
                    bulkStatus: "",
                    bulkRows: [],
                    bulkFailedCount: 0,
                    bulkCompletedCount: 0,
                  }))
                }
                disabled={!selectedReportCount || secureReports.bulkLoading}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black uppercase disabled:opacity-50"
              >
                Clear selected
              </button>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {selectedReportCount} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => runBulkReportCleanup(true)}
                disabled={bulkReportActionDisabled}
                className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-50 inline-flex items-center gap-1"
              >
                {secureReports.bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Preview selected
              </button>
              <button
                type="button"
                onClick={() => runBulkReportCleanup(false)}
                disabled={bulkReportActionDisabled || (reportAssetCleanup.mode !== "assets_only" && reportAssetCleanup.confirmText.trim().toUpperCase() !== "DELETE")}
                className="px-3 py-2 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:bg-gray-300 inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> {selectedReportActionLabel}
              </button>
            </div>
          </div>

          {(secureReports.bulkStatus || secureReports.bulkError) && (
            <div className={`rounded-2xl border p-3 text-xs font-bold ${secureReports.bulkError ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest">
                {secureReports.bulkError || secureReports.bulkStatus}
              </p>
              {secureReports.bulkRows?.length ? (
                <p className="mt-1 text-[10px] font-bold opacity-80">
                  {secureReports.bulkRows.length} report(s) processed · {secureReports.bulkFailedCount || 0} need review
                </p>
              ) : null}
            </div>
          )}

          {(secureReports.status || secureReports.error) && (
            <p className={`text-[10px] font-black uppercase tracking-widest ${secureReports.error ? "text-red-600" : "text-gray-400"}`}>
              {secureReports.error || secureReports.status}
            </p>
          )}

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {secureReports.loading && !secureReports.rows.length ? (
              <div className="rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading saved secure reports...
              </div>
            ) : filteredSecureReports.length ? (
              filteredSecureReports.map((report) => {
                const bulkSelected = selectedReportTokens.includes(report.token);
                const selected = bulkSelected || secureReports.selectedToken === report.token || reportAssetCleanup.input.includes(report.token);
                return (
                  <div
                    key={report.token}
                    className={`rounded-2xl border p-4 bg-white grid grid-cols-1 xl:grid-cols-[auto_1.35fr_0.75fr_0.75fr_0.75fr_auto] gap-3 items-center ${selected ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100"}`}
                  >
                    <label className="inline-flex items-center justify-start xl:justify-center">
                      <input
                        type="checkbox"
                        checked={bulkSelected}
                        onChange={() => toggleSecureReportSelection(report.token)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${report.companyName || report.domain || report.token}`}
                      />
                    </label>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-gray-900 truncate">{report.companyName || report.domain || "Untitled report"}</p>
                        <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-black text-gray-500 uppercase">
                          {secureReportChannelLabel(report.channel)}
                        </span>
                        <span className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase ${secureReportStatusTone(report)}`}>
                          {secureReportStatusLabel(report)}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 truncate mt-1">{report.domain || report.domainSlug || report.token}</p>
                      {report.email && <p className="text-[10px] font-bold text-gray-400 truncate mt-1">{report.email}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                      <span className={`inline-flex mt-1 px-2 py-1 rounded-full border text-[9px] font-black uppercase ${secureReportContactTone(report)}`}>
                        {secureReportContactLabel(report)}
                      </span>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 truncate">{secureReportContactNote(report)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity</p>
                      <p className="text-xs font-bold text-gray-700 mt-1">
                        {report.ctaClicked ? "CTA clicked" : report.pdfDownloaded ? "PDF downloaded" : report.reportPageViewed ? "Page viewed" : "No view yet"}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{report.lastActivityAt ? formatDate(report.lastActivityAt) : "No activity date"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</p>
                      <p className="text-xs font-bold text-gray-700 mt-1">{report.pdfExpiresAt ? formatDate(report.pdfExpiresAt) : "No expiry"}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{report.cleanupStatus || "Not cleaned"}</p>
                    </div>
                    <div className="flex flex-wrap xl:justify-end gap-2">
                      {report.reportUrl && normalizeOptionalUrl(report.reportUrl) && (
                        <a
                          href={normalizeOptionalUrl(report.reportUrl) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase inline-flex items-center gap-1"
                        >
                          Open <ExternalLink size={11} />
                        </a>
                      )}
                      {(report.leadId || report.email) && (
                        <button
                          type="button"
                          onClick={() => viewSecureReportLead(report)}
                          className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase"
                        >
                          View in Leads
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => selectSecureReportForCleanup(report)}
                        className="px-3 py-2 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-500">
                No saved secure reports match this filter. Try Refresh Reports or change the search/filter.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr_0.8fr] gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secure report URL or token</label>
            <input
              type="text"
              value={reportAssetCleanup.input}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setReportAssetCleanup((prev) => ({ ...prev, input: event.target.value, error: "", status: "" }))
              }
              placeholder="Paste secure report URL or token"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">What do you want to do?</label>
            <select
              value={reportAssetCleanup.mode}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setReportAssetCleanup((prev) => ({
                  ...prev,
                  mode: event.target.value as ReportAssetCleanupMode,
                  confirmText: "",
                  error: "",
                  status: "",
                }))
              }
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-700 outline-none"
            >
              {REPORT_CLEANUP_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Footprint memory</label>
            {reportAssetCleanup.mode === "assets_only" ? (
              <div className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-500">
                Contact unchanged
              </div>
            ) : (
              <select
                value={reportAssetCleanup.leadMode}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setReportAssetCleanup((prev) => ({ ...prev, leadMode: event.target.value as ReportAssetCleanupLeadMode, error: "", status: "" }))
                }
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-700 outline-none"
              >
                {REPORT_LEAD_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>

        <div className={`rounded-2xl border p-4 text-[12px] font-bold leading-relaxed ${reportAssetCleanup.mode === "assets_only" ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-100 text-red-700"}`}>
          <span className="font-black">{activeReportMode.label}:</span> {activeReportMode.note}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-[12px] text-gray-600 font-semibold leading-relaxed">
          <span className="font-black text-gray-900">Footprint rule:</span>{" "}
          Choose <span className="font-black">Keep Footprint</span> for contacted leads so they are not emailed again later.
          The Google Sheet row is still cleaned/deleted during Delete All Data; only the tiny email safety memory remains.
          Choose <span className="font-black">No Footprint</span> only for test or never-contacted leads; the backend blocks it if outreach history exists.
        </div>

        {reportAssetCleanup.mode !== "assets_only" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-2">
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest">Delete confirmation</label>
            <input
              type="text"
              value={reportAssetCleanup.confirmText}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setReportAssetCleanup((prev) => ({ ...prev, confirmText: event.target.value }))}
              placeholder="Type DELETE"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-red-100 text-sm font-black text-red-700 outline-none"
            />
            <p className="text-[11px] font-bold text-red-500">
              Type DELETE after preview. This removes the report, files, Sheet row, and selected contact data.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={reportCleanupDisabled}
            onClick={previewReportAssetCleanup}
            className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
          >
            {reportAssetCleanup.loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Preview
          </button>
          <button
            type="button"
            disabled={!reportCleanupCanRun}
            onClick={runReportAssetCleanup}
            className={`px-4 py-3 rounded-2xl text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2 ${reportAssetCleanup.mode === "assets_only" ? "bg-slate-950" : "bg-red-600"}`}
          >
            <Trash2 size={14} /> {actionLabel}
          </button>
          {reportAssetCleanup.jobId && (
            <span className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
              Cleanup saved
            </span>
          )}
        </div>

        {(reportAssetCleanup.status || reportAssetCleanup.error) && (
          <p className={`text-[11px] font-black uppercase tracking-widest ${reportAssetCleanup.error ? "text-red-600" : "text-gray-500"}`}>
            {reportAssetCleanup.error || reportAssetCleanup.status}
          </p>
        )}

        {manifest && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure report</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.reportFound ? "Found" : "Not found"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 break-all">{manifest.normalizedDomain || manifest.domainSlug || manifest.reportToken || "No domain found"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PDF file</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.b2PdfKey ? "Ready to remove" : "No PDF file found"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">{manifest.pdfExpiresAt ? `Expires: ${formatDate(manifest.pdfExpiresAt)}` : "No expiry date"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview image</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.blobImageTargets?.length || 0} item(s)</p>
              {manifest.reportUrl && normalizeOptionalUrl(manifest.reportUrl || "") && (
                <a href={normalizeOptionalUrl(manifest.reportUrl || "") || "#"} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 inline-flex items-center gap-1 mt-1">
                  Open report <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact record</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.leadFound ? "Found" : "No lead linked"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">Spreadsheet row: {manifest.sheetRowNumber || "—"}</p>
            </div>
          </div>
        )}

        {reportAssetCleanup.steps.length > 0 && (
          <div className="border border-gray-100 rounded-[28px] overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cleanup summary</p>
                <p className="text-sm font-bold text-gray-700">
                  {plannedCount > 0 ? `${plannedCount} item(s) ready after confirmation` : `${doneCount} item(s) completed`}
                  {needsAttentionCount > 0 ? ` · ${needsAttentionCount} item(s) need review` : ""}
                </p>
              </div>
              <details className="text-[10px] font-black text-gray-500 uppercase">
                <summary className="cursor-pointer">Show technical details</summary>
                <div className="mt-3 max-w-full overflow-x-auto rounded-2xl bg-white border border-gray-100 p-3 text-left normal-case font-mono text-[10px] text-gray-500">
                  {reportAssetCleanup.steps.map((step, index) => (
                    <div key={`${step.service}-${step.action}-technical-${index}`} className="py-1 border-b border-gray-50 last:border-0">
                      {step.service} · {step.action} · {step.status} · {formatCleanupTarget(step)}
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="divide-y divide-gray-50">
              {reportAssetCleanup.steps.map((step, index) => (
                <div key={`${step.service}-${step.action}-${index}`} className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_0.7fr_0.7fr_1.6fr] gap-3 items-start">
                  <div>
                    <p className="text-xs font-black text-gray-900">{reportStepLabel(step)}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">{reportStepActionLabel(step)}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase ${reportStepTone(step)}`}>
                      {reportStepStatusLabel(step.status)}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 truncate" title={formatCleanupTarget(step)}>
                    {formatCleanupTarget(step)}
                  </p>
                  <p className="text-[11px] font-bold text-gray-500">{reportStepMessage(step)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} /> Footprint Memory
            </p>
            <h2 className="text-2xl font-black tracking-tighter text-gray-900">Manage email safety memories</h2>
            <p className="text-sm text-gray-500 font-semibold mt-2 max-w-3xl">
              These lightweight records stay after cleanup, unsubscribe, bounce, or manual block so TrackFlow does not email the same contact again by mistake.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={footprintMemory.loading || footprintMemory.actionLoading}
              onClick={() => loadFootprintMemories(true)}
              className="px-4 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
            >
              <RefreshCw size={14} className={footprintMemory.loading || footprintMemory.actionLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search email or domain</label>
            <div className="mt-2 relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={footprintMemory.search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, search: event.target.value }))}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") loadFootprintMemories(true);
                }}
                placeholder="Search by email, company, or website"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["blocked", "Blocked Emails"],
              ["old", "Old Footprints"],
              ["suppression", "Suppression"],
              ["allowed", "Allowed"],
              ["all", "All"],
            ] as const).map(([filter, label]) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setFootprintMemory((prev: FootprintMemoryState) => ({
                    ...prev,
                    filter,
                    olderThanDays: filter === "suppression" && Number(prev.olderThanDays || 0) < 180 ? 365 : prev.olderThanDays,
                  }));
                }}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase ${footprintMemory.filter === filter ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-[11px] font-bold text-blue-700 leading-relaxed">
          Keep this simple: Blocked Emails are for search + Allow again. Old Footprints removes old contact-memory records by age. Suppression/Unsubscribe is protected and only deletes after typing DELETE SUPPRESSION.
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {showingSuppressionFootprints ? "Protected suppression cleanup" : "Date-based footprint cleanup"}
            </p>
            <p className="text-xs font-bold text-gray-500 mt-1">
              {showingSuppressionFootprints
                ? "Deletes old suppression/unsubscribe/bounce/spam records only after the DELETE SUPPRESSION confirmation. Use this only for very old records."
                : "Deletes only old contact-memory footprints. It does not touch reports, PDFs, outreach leads, Sheet rows, or tracking history."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={footprintMemory.olderThanDays}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, olderThanDays: Number(event.target.value) }))}
              className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[10px] font-black uppercase text-gray-600 outline-none"
            >
              {showingSuppressionFootprints ? (
                <>
                  <option value={180}>Older than 180 days</option>
                  <option value={365}>Older than 365 days</option>
                  <option value={730}>Older than 730 days</option>
                </>
              ) : (
                <>
                  <option value={45}>Older than 45 days</option>
                  <option value={90}>Older than 90 days</option>
                  <option value={180}>Older than 180 days</option>
                  <option value={365}>Older than 365 days</option>
                </>
              )}
            </select>
            <button
              type="button"
              disabled={footprintMemory.actionLoading || (!showingOldFootprints && !showingSuppressionFootprints)}
              onClick={showingSuppressionFootprints ? deleteOldSuppressionFootprints : forgetOldFootprintMemories}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase disabled:opacity-40 ${showingSuppressionFootprints ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}
              title={showingOldFootprints || showingSuppressionFootprints ? "Delete records older than the selected age." : "Choose Old Footprints or Suppression first."}
            >
              {showingSuppressionFootprints ? "Delete Protected Records" : "Delete Old Footprints"}
            </button>
          </div>
        </div>

        {(footprintMemory.status || footprintMemory.error) && (
          <p className={`text-[10px] font-black uppercase tracking-widest ${footprintMemory.error ? "text-red-600" : "text-gray-400"}`}>
            {footprintMemory.error || footprintMemory.status}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last activity</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {footprintMemory.loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-blue-600 font-black uppercase">
                    Loading footprint memories...
                  </td>
                </tr>
              )}

              {!footprintMemory.loading &&
                footprintRows.map((row: FootprintMemoryRow) => (
                  <tr key={`${row.emailLower || row.email}-${row.source || "memory"}`} className="hover:bg-gray-50/50">
                    <td className="p-4 align-top min-w-[260px]">
                      <p className="font-black text-gray-900">{row.email || row.emailLower}</p>
                      {(row.companyName || row.website) && (
                        <p className="text-[10px] font-bold text-gray-400 mt-1">
                          {[row.companyName, row.website].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="p-4 align-top min-w-[220px]">
                      <p className="text-xs font-black text-gray-900 uppercase">{formatFootprintReason(row)}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{row.source === "suppression_list" ? "Protected suppression" : row.source === "combined" ? "Memory + suppression" : row.source === "outreach_lead" ? "Outreach lead record" : "Contact memory"}</p>
                      {row.leadCount ? <p className="text-[10px] font-bold text-blue-500 mt-1">{row.leadCount} linked lead record{row.leadCount === 1 ? "" : "s"}</p> : null}
                    </td>
                    <td className="p-4 align-top min-w-[200px]">
                      <p className="text-xs font-black text-gray-900">{row.lastActivityAt ? formatDate(row.lastActivityAt) : "N/A"}</p>
                      {row.cooldownUntil && <p className="text-[10px] font-bold text-gray-400 mt-1">Blocked until: {formatDate(row.cooldownUntil)}</p>}
                    </td>
                    <td className="p-4 align-top min-w-[170px]">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${footprintStatusClass(row.status)}`}>
                        {row.statusLabel || row.status || "Blocked"}
                      </span>
                    </td>
                    <td className="p-4 align-top min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        {row.source === "suppression_list" || row.source === "combined" ? (
                          <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={footprintMemory.actionLoading || row.status === "allowed_again"}
                            onClick={() => allowFootprintMemory(row.emailLower || row.email)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase disabled:opacity-40"
                          >
                            Allow again
                          </button>
                        )}
                        {showingOldFootprints && row.source === "contact_memory" ? (
                          <button
                            type="button"
                            disabled={footprintMemory.actionLoading}
                            onClick={() => forgetFootprintMemory(row.emailLower || row.email)}
                            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
                            title="Delete this contact-memory footprint only."
                          >
                            Delete footprint
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

              {!footprintMemory.loading && footprintRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-bold">
                    No footprint memories found for this view.
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
