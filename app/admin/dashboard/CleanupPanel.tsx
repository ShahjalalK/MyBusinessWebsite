"use client";

import React, { type ReactNode } from "react";
import {
  AlertTriangle,
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
  { id: "cold", label: "Cold No Reply", note: "No open/click after 45+ days" },
  { id: "warm", label: "Warm No Reply", note: "Open/click but no reply after 90+ days" },
  { id: "replied", label: "1 Year Review", note: "Replied/interested leads for manual review" },
  { id: "protected", label: "Protected", note: "Suppression/do-not-contact candidates" },
  { id: "upcoming", label: "Upcoming", note: "Not due yet, but scheduled by policy" },
];

const REPORT_CLEANUP_MODES: Array<{ id: ReportAssetCleanupMode; label: string; note: string }> = [
  { id: "soft", label: "Soft Cleanup", note: "Delete assets and mark the report cleaned. Recommended for normal cleanup." },
  { id: "assets_only", label: "Assets Only", note: "Delete PDF/image/chat assets but keep lead/report records marked as cleaned." },
  { id: "hard", label: "Hard Delete", note: "Delete report records. Use only for test data or after careful review." },
];

const REPORT_LEAD_MODES: Array<{ id: ReportAssetCleanupLeadMode; label: string }> = [
  { id: "none", label: "Do not touch lead" },
  { id: "archive", label: "Archive lead" },
  { id: "trash", label: "Move lead to trash" },
  { id: "delete", label: "Delete lead + keep memory" },
];

const REPORT_SHEET_MODES: Array<{ id: ReportAssetCleanupSheetMode; label: string }> = [
  { id: "mark", label: "Mark Sheet cleaned" },
  { id: "clear", label: "Clear report fields" },
  { id: "skip", label: "Skip Sheet" },
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

  const handleBucketSelect = (bucket: CleanupBucket) => {
    setLeadCleanup((prev: CleanupState) => ({ ...prev, bucket }));
    loadCleanupCandidates(bucket, true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} /> Lead Cleanup Manager
          </p>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Full Delete + Footprint Memory</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            Manual cleanup button. Full lead data can be removed from Firebase + Sheet while a small contact_memory footprint remains.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runManualCleanupRefresh}
            disabled={leadCleanup.loading || leadCleanup.actionLoading}
            className="px-4 py-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw size={14} className={leadCleanup.loading || leadCleanup.actionLoading ? "animate-spin" : ""} /> Manual Check
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
        <StatCard label="Candidates" value={leadCleanup.rows.length} icon={<Database size={22} />} />
        <StatCard label="Eligible" value={eligibleCount} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="Selected" value={selectedCount} icon={<MousePointer2 size={22} />} tone="orange" />
        <StatCard label="Sheet Linked" value={sheetLinkedCount} icon={<FileText size={22} />} tone="blue" />
      </div>


      <div className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Report Asset Cleanup
            </p>
            <h2 className="text-2xl font-black tracking-tighter text-gray-900">Secure Report / PDF / Preview Cleanup</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 max-w-3xl">
              Paste a secure report URL or report token. Preview first, then run a confirmed cleanup from the deployed TrackFlow API.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={14} /> Dry-run first
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr] gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Report token or secure page URL</label>
            <input
              type="text"
              value={reportAssetCleanup.input}
              onChange={(event) =>
                setReportAssetCleanup((prev) => ({ ...prev, input: event.target.value, error: "", status: "" }))
              }
              placeholder="https://trackflowpro.com/tracking-review/domain/token or token"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cleanup mode</label>
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
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lead action</label>
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
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sheet action</label>
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

        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold text-slate-600 leading-relaxed">
          {REPORT_CLEANUP_MODES.find((mode) => mode.id === reportAssetCleanup.mode)?.note || "Preview first, then run confirmed cleanup."}
          {reportAssetCleanup.mode === "hard" ? " Hard cleanup requires typing DELETE_REPORT_ASSETS before the action button unlocks." : " Soft cleanup is recommended for normal report expiry."}
        </div>

        {reportAssetCleanup.mode === "hard" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-2">
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest">Hard cleanup confirmation</label>
            <input
              type="text"
              value={reportAssetCleanup.confirmText}
              onChange={(event) => setReportAssetCleanup((prev) => ({ ...prev, confirmText: event.target.value }))}
              placeholder="Type DELETE_REPORT_ASSETS"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-red-100 text-sm font-black text-red-700 outline-none"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={reportCleanupDisabled}
            onClick={previewReportAssetCleanup}
            className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
          >
            {reportAssetCleanup.loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Preview Cleanup
          </button>
          <button
            type="button"
            disabled={!reportCleanupCanRun}
            onClick={runReportAssetCleanup}
            className={`px-4 py-3 rounded-2xl text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2 ${
              reportAssetCleanup.mode === "hard" ? "bg-red-600" : "bg-slate-950"
            }`}
          >
            <Trash2 size={14} /> {reportAssetCleanup.mode === "hard" ? "Run Hard Cleanup" : "Run Confirmed Cleanup"}
          </button>
          {reportAssetCleanup.jobId && (
            <span className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
              Job: {reportAssetCleanup.jobId.slice(0, 12)}
            </span>
          )}
        </div>

        {(reportAssetCleanup.status || reportAssetCleanup.error) && (
          <p className={`text-[10px] font-black uppercase tracking-widest ${reportAssetCleanup.error ? "text-red-600" : "text-gray-400"}`}>
            {reportAssetCleanup.error || reportAssetCleanup.status}
          </p>
        )}

        {manifest && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Report</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.reportFound ? "Found" : "Not found"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 break-all">{manifest.reportToken || "No token"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">B2 PDF</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.b2PdfKey ? "Key found" : "No key"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 break-all">{manifest.b2PdfKey || "—"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blob images</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.blobImageTargets?.length || 0} target(s)</p>
              {manifest.reportUrl && normalizeOptionalUrl(manifest.reportUrl || "") && (
                <a href={normalizeOptionalUrl(manifest.reportUrl || "") || "#"} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 inline-flex items-center gap-1 mt-1">
                  Open report <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead / Sheet</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.leadFound ? "Lead found" : "No lead"}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">Sheet row: {manifest.sheetRowNumber || "—"}</p>
            </div>
          </div>
        )}

        {reportAssetCleanup.steps.length > 0 && (
          <div className="border border-gray-100 rounded-[28px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportAssetCleanup.steps.map((step, index) => (
                    <tr key={`${step.service}-${step.action}-${index}`}>
                      <td className="p-4 text-xs font-black text-gray-900 uppercase">{step.service.replace(/_/g, " ")}</td>
                      <td className="p-4 text-xs font-bold text-gray-600">{step.action.replace(/_/g, " ")}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase ${reportStepTone(step)}`}>{step.status}</span>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-gray-400 max-w-[260px] truncate" title={formatCleanupTarget(step)}>
                        {formatCleanupTarget(step)}
                      </td>
                      <td className="p-4 text-[11px] font-bold text-gray-500 max-w-[420px]">
                        {step.error || step.message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CLEANUP_BUCKETS.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => handleBucketSelect(bucket.id)}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                  activeBucket === bucket.id ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
                title={bucket.note}
              >
                {bucket.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deleteSelectedCleanupWithMemory("delete")}
              className="px-4 py-3 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete Both + Memory
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deleteSelectedCleanupWithMemory("mark")}
              className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Delete Firebase + Mark Sheet
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

        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-[11px] font-bold text-blue-700 leading-relaxed">
          Rules: Cold no-reply leads are due after {leadCleanup.policy?.coldNoReplyDeleteDays || 45} days. Warm open/click no-reply leads are due after {leadCleanup.policy?.warmNoReplyDeleteDays || 90} days. Replied leads are review-only after {leadCleanup.policy?.repliedReviewDays || 365} days. Queued/processing leads are blocked from hard delete.
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
