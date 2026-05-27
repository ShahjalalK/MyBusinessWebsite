"use client";

import React, { type ReactNode } from "react";
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
  CleanupBucket,
  CleanupCandidate,
  CleanupState,
  ReportAssetCleanupLeadMode,
  ReportAssetCleanupMode,
  ReportAssetCleanupSheetMode,
  ReportAssetCleanupState,
  ReportCleanupStep,
} from "./types";
import { formatDate, normalizeOptionalUrl } from "./utils";

type CleanupBucketOption = {
  id: CleanupBucket;
  label: string;
  note: string;
};

type CleanupPanelProps = {
  leadCleanup: CleanupState;
  selectedCleanupIds: string[];
  setSelectedCleanupIds: (value: string[]) => void;
  setLeadCleanup: (value: CleanupState | ((prev: CleanupState) => CleanupState)) => void;
  loadCleanupCandidates: (bucket?: CleanupBucket, force?: boolean) => Promise<void>;
  runManualCleanupRefresh: () => Promise<void>;
  deleteSelectedCleanupWithMemory: (sheetMode?: "delete" | "mark" | "skip") => Promise<void>;
  skipSelectedCleanup: (days?: number) => Promise<void>;
  protectSelectedCleanup: () => Promise<void>;
  toggleCleanupCandidate: (leadId: string) => void;
  reportAssetCleanup: ReportAssetCleanupState;
  setReportAssetCleanup: (value: ReportAssetCleanupState | ((prev: ReportAssetCleanupState) => ReportAssetCleanupState)) => void;
  previewReportAssetCleanup: () => Promise<void>;
  runReportAssetCleanup: () => Promise<void>;
};

const CLEANUP_BUCKETS: CleanupBucketOption[] = [
  { id: "due", label: "Due Now", note: "Safe no-reply candidates ready for cleanup" },
  { id: "cold", label: "No Reply", note: "No open/click after the cleanup waiting period" },
  { id: "warm", label: "Viewed, No Reply", note: "Opened/clicked but no reply after the review period" },
  { id: "replied", label: "Needs Review", note: "Replied/interested leads for manual review" },
  { id: "protected", label: "Protected", note: "Suppression/do-not-contact candidates" },
  { id: "upcoming", label: "Upcoming", note: "Not due yet, but scheduled by policy" },
];

const REPORT_CLEANUP_MODES: Array<{ id: ReportAssetCleanupMode; label: string; note: string }> = [
  {
    id: "soft",
    label: "Archive Report",
    note: "Recommended. Removes report files, makes the secure page inactive, and keeps a small history record.",
  },
  {
    id: "assets_only",
    label: "Remove Files Only",
    note: "Removes the PDF, preview image, and chat history, but keeps the report and lead records.",
  },
  {
    id: "hard",
    label: "Delete Test Data",
    note: "Deletes report records too. Use only for fake/test data or a carefully reviewed delete request.",
  },
];

const REPORT_LEAD_MODES: Array<{ id: ReportAssetCleanupLeadMode; label: string }> = [
  { id: "none", label: "Keep lead unchanged" },
  { id: "archive", label: "Archive linked lead" },
  { id: "trash", label: "Move linked lead to trash" },
  { id: "delete", label: "Delete test lead, keep safety memory" },
];

const REPORT_SHEET_MODES: Array<{ id: ReportAssetCleanupSheetMode; label: string }> = [
  { id: "mark", label: "Mark Sheet cleaned" },
  { id: "clear", label: "Clear report fields" },
  { id: "skip", label: "Do not update Sheet" },
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
  if (service.includes("google_sheet")) return "Sheet row";
  if (action.includes("domain")) return "Report lookup";
  if (action.includes("lead")) return "Linked lead";
  if (action.includes("report")) return "Secure report";
  if (service.includes("firestore")) return "Saved record";

  return step.service ? step.service.replace(/_/g, " ") : "Cleanup step";
}

function reportStepActionLabel(step: ReportCleanupStep): string {
  const action = String(step.action || "").toLowerCase();

  if (action.includes("delete_pdf")) return "Remove file";
  if (action.includes("delete_preview")) return "Remove image";
  if (action.includes("delete_report_chat")) return "Remove chat";
  if (action.includes("delete_report_document")) return "Delete record";
  if (action.includes("mark_report_cleaned")) return "Archive report";
  if (action.includes("cleanup_domain") || action.includes("delete_domain")) return "Update lookup";
  if (action.includes("clear_report_fields")) return "Clear Sheet fields";
  if (action.includes("mark_cleanup")) return "Mark cleaned";
  if (action.includes("archive_lead")) return "Archive lead";
  if (action.includes("trash_lead")) return "Move to trash";
  if (action.includes("delete_lead")) return "Delete lead";

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
  if (mode === "hard") return "Delete Test Data";
  return "Archive Report";
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

export default function CleanupPanel({
  leadCleanup,
  selectedCleanupIds,
  setSelectedCleanupIds,
  setLeadCleanup,
  loadCleanupCandidates,
  runManualCleanupRefresh,
  deleteSelectedCleanupWithMemory,
  skipSelectedCleanup,
  protectSelectedCleanup,
  toggleCleanupCandidate,
  reportAssetCleanup,
  setReportAssetCleanup,
  previewReportAssetCleanup,
  runReportAssetCleanup,
}: CleanupPanelProps) {
  const selectedCount = selectedCleanupIds.length;
  const eligibleCount = leadCleanup.rows.filter((row: CleanupCandidate) => row.eligible && !row.protectedLead).length;
  const sheetLinkedCount = leadCleanup.rows.filter((row: CleanupCandidate) => row.sheetLinked).length;

  const activeBucket = leadCleanup.bucket as CleanupBucket;
  const allVisibleRowsSelected = leadCleanup.rows.length > 0 && leadCleanup.rows.every((row: CleanupCandidate) => selectedCleanupIds.includes(row.leadId));
  const isActionDisabled = Boolean(leadCleanup.actionLoading || selectedCount === 0);
  const reportCleanupInput = reportAssetCleanup.input.trim();
  const reportCleanupDisabled = reportAssetCleanup.loading || !reportCleanupInput;
  const hardConfirmReady = reportAssetCleanup.mode !== "hard" || reportAssetCleanup.confirmText.trim().toUpperCase() === "DELETE_REPORT_ASSETS";
  const reportCleanupCanRun = !reportCleanupDisabled && hardConfirmReady;
  const manifest = reportAssetCleanup.manifest;
  const activeReportMode = REPORT_CLEANUP_MODES.find((mode) => mode.id === reportAssetCleanup.mode) || REPORT_CLEANUP_MODES[0];
  const actionLabel = reportModeActionLabel(reportAssetCleanup.mode);
  const needsAttentionCount = reportAssetCleanup.steps.filter((step) => step.status === "warning" || step.status === "error").length;
  const doneCount = reportAssetCleanup.steps.filter((step) => step.status === "ok").length;
  const plannedCount = reportAssetCleanup.steps.filter((step) => step.status === "planned").length;

  const handleBucketSelect = (bucket: CleanupBucket) => {
    setLeadCleanup((prev: CleanupState) => ({ ...prev, bucket }));
    loadCleanupCandidates(bucket, true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} /> Cleanup Center
          </p>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Clean old reports and outreach leads</h1>
          <p className="text-gray-500 text-sm font-semibold mt-2 max-w-3xl">
            Manage secure report files, expired audit links, and old no-reply leads from one place. Start with preview, then choose the safe action.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runManualCleanupRefresh}
            disabled={leadCleanup.loading || leadCleanup.actionLoading}
            className="px-4 py-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw size={14} className={leadCleanup.loading || leadCleanup.actionLoading ? "animate-spin" : ""} /> Check Leads
          </button>
          <button
            type="button"
            onClick={() => loadCleanupCandidates(activeBucket, true)}
            disabled={leadCleanup.loading || leadCleanup.actionLoading}
            className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
          >
            <Database size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Lead rows" value={leadCleanup.rows.length} icon={<Database size={22} />} />
        <StatCard label="Ready" value={eligibleCount} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="Selected" value={selectedCount} icon={<MousePointer2 size={22} />} tone="orange" />
        <StatCard label="Sheet linked" value={sheetLinkedCount} icon={<FileText size={22} />} tone="blue" />
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secure report URL or token</label>
            <input
              type="text"
              value={reportAssetCleanup.input}
              onChange={(event) =>
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
              onChange={(event) =>
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
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Linked lead</label>
            <select
              value={reportAssetCleanup.leadMode}
              onChange={(event) =>
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
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sheet row</label>
            <select
              value={reportAssetCleanup.sheetMode}
              onChange={(event) =>
                setReportAssetCleanup((prev) => ({ ...prev, sheetMode: event.target.value as ReportAssetCleanupSheetMode, error: "", status: "" }))
              }
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-700 outline-none"
            >
              {REPORT_SHEET_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 text-[12px] font-bold leading-relaxed ${reportAssetCleanup.mode === "hard" ? "bg-red-50 border-red-100 text-red-700" : "bg-blue-50 border-blue-100 text-blue-700"}`}>
          <span className="font-black">{activeReportMode.label}:</span> {activeReportMode.note}
          {reportAssetCleanup.mode === "soft" && " This is the safest normal action for expired or unused report links."}
        </div>

        {reportAssetCleanup.mode === "hard" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-2">
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest">Delete test data confirmation</label>
            <input
              type="text"
              value={reportAssetCleanup.confirmText}
              onChange={(event) => setReportAssetCleanup((prev) => ({ ...prev, confirmText: event.target.value }))}
              placeholder="Type DELETE_REPORT_ASSETS"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-red-100 text-sm font-black text-red-700 outline-none"
            />
            <p className="text-[11px] font-bold text-red-500">
              Use this only for fake/test reports or when you are fully sure the saved report record should be removed.
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
            className={`px-4 py-3 rounded-2xl text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2 ${reportAssetCleanup.mode === "hard" ? "bg-red-600" : "bg-slate-950"}`}
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
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linked lead</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.leadFound ? "Found" : "No lead linked"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">Sheet row: {manifest.sheetRowNumber || "—"}</p>
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

      <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} /> Old Lead Cleanup
            </p>
            <h2 className="text-2xl font-black tracking-tighter text-gray-900">Review old no-reply leads</h2>
            <p className="text-sm text-gray-500 font-semibold mt-2">
              Select leads that are safe to archive, skip, or protect. This is separate from secure report file cleanup above.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deleteSelectedCleanupWithMemory("mark")}
              className="px-4 py-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
            >
              <Trash2 size={14} /> Archive Selected
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deleteSelectedCleanupWithMemory("delete")}
              className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Delete From Sheet Too
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => skipSelectedCleanup(30)}
              className="px-4 py-3 rounded-2xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Skip 30 Days
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={protectSelectedCleanup}
              className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Protect
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CLEANUP_BUCKETS.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              onClick={() => handleBucketSelect(bucket.id)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeBucket === bucket.id ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}
              title={bucket.note}
            >
              {bucket.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-[11px] font-bold text-blue-700 leading-relaxed">
          Recommended: archive old no-reply leads first. Use protect for important contacts or anyone who should not be cleaned automatically.
        </div>

        {(leadCleanup.status || leadCleanup.error) && (
          <p className={`text-[10px] font-black uppercase tracking-widest ${leadCleanup.error ? "text-red-600" : "text-gray-400"}`}>
            {leadCleanup.error || leadCleanup.status}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={allVisibleRowsSelected}
                    onChange={(event) => {
                      setSelectedCleanupIds(event.target.checked ? leadCleanup.rows.map((row: CleanupCandidate) => row.leadId) : []);
                    }}
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Outcome</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Safety</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {leadCleanup.loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-blue-600 font-black uppercase">
                    Loading cleanup candidates...
                  </td>
                </tr>
              )}

              {!leadCleanup.loading &&
                leadCleanup.rows.map((row: CleanupCandidate) => {
                  const checked = selectedCleanupIds.includes(row.leadId);
                  return (
                    <tr key={row.leadId} className={checked ? "bg-blue-50/50" : "hover:bg-gray-50/50"}>
                      <td className="p-4 align-top">
                        <input type="checkbox" checked={checked} onChange={() => toggleCleanupCandidate(row.leadId)} />
                      </td>
                      <td className="p-4 align-top min-w-[280px]">
                        <p className="font-black text-gray-900">{row.company || row.name || "Unnamed lead"}</p>
                        <p className="text-xs text-gray-500 font-semibold mt-1">{row.email}</p>
                        {row.website && (
                          <a
                            href={normalizeOptionalUrl(row.website) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 font-bold inline-flex items-center gap-1 mt-1"
                          >
                            Open website <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            row.sheetLinked ? "bg-blue-50 text-blue-600" : row.sourceKind === "test" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {formatSourceLabel(row.sourceKind, row.source)}
                        </span>
                        {row.sheetRowNumber ? (
                          <p className="text-[10px] font-bold text-gray-400 mt-2">Sheet Row #{row.sheetRowNumber}</p>
                        ) : (
                          <p className="text-[10px] font-bold text-gray-400 mt-2">Sheet not linked</p>
                        )}
                      </td>
                      <td className="p-4 align-top min-w-[220px]">
                        <p className="text-xs font-black text-gray-900 uppercase">{row.outcome || "unknown"}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">{row.reason}</p>
                        <p className="text-[10px] font-black text-blue-600 mt-2">
                          Open {row.openCount || 0} · Click {row.clickCount || 0} · F{row.followUpCount || 0}
                        </p>
                      </td>
                      <td className="p-4 align-top min-w-[220px]">
                        <p className="text-xs font-black text-gray-900">{row.daysOld || 0} days old</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Last: {row.lastContactedAt ? formatDate(row.lastContactedAt) : "N/A"}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Due: {row.dueAt ? formatDate(row.dueAt) : "N/A"}</p>
                      </td>
                      <td className="p-4 align-top min-w-[220px]">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            row.eligible && !row.protectedLead ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.eligible && !row.protectedLead ? "Safe cleanup due" : row.protectedLead ? "Protected/review" : "Not due"}
                        </span>
                        <p className="text-[10px] font-bold text-gray-400 mt-2">Memory: {row.memoryMonths || row.cooldownMonths || 0} months</p>
                        {(row.blockedReasons || []).length > 0 && (
                          <p className="text-[10px] font-bold text-red-500 mt-2">{(row.blockedReasons || []).join(", ")}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {!leadCleanup.loading && leadCleanup.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    No cleanup candidates found for this bucket.
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
