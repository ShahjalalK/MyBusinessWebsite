"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react";

import type { SheetLead } from "./types";
import {
  type GmailOutreachStage,
  GMAIL_OUTREACH_STAGE_LABELS,
  getGmailOutreachMessage,
  getGmailOutreachStage,
  getGmailOutreachSubject,
  getNextGmailStageAfterSend,
  getSheetSourceKind,
  getSheetSourceLabel,
  gmailMessageHeaderForStage,
  gmailSentAtHeaderForStage,
  gmailSubjectHeaderForStage,
  sheetValue,
} from "./sheet-readiness";
import { normalizeOptionalUrl, stripHtml } from "./utils";

type GmailOutreachPanelProps = {
  sheetLeads: SheetLead[];
  sheetStatus: string;
  sheetLoading: boolean;
  loadSheetLeads: (force?: boolean) => Promise<void>;
  patchSheetLead: (rowNumber: number, updates: Record<string, any>) => Promise<any>;
};

type SourceFilter = "all" | "python_search" | "linkedin_audit" | "manual" | "unknown";

const STAGE_TABS: Array<{ id: GmailOutreachStage | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "followup_1", label: "Follow-up 1" },
  { id: "followup_2", label: "Follow-up 2" },
  { id: "followup_3", label: "Follow-up 3" },
  { id: "followup_4", label: "Follow-up 4" },
  { id: "closed", label: "Closed" },
  { id: "do_not_contact", label: "DNC" },
];

const SOURCE_FILTERS: Array<{ id: SourceFilter; label: string }> = [
  { id: "all", label: "All sources" },
  { id: "python_search", label: "Python Search" },
  { id: "linkedin_audit", label: "LinkedIn" },
  { id: "manual", label: "Manual" },
  { id: "unknown", label: "Unknown" },
];

function nowLocalString() {
  return new Date().toLocaleString();
}

function cleanText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getEmail(lead: SheetLead) {
  return cleanText(sheetValue(lead, "Final Email")).toLowerCase();
}

function getLinkedInUrl(lead: SheetLead) {
  const raw = cleanText(sheetValue(lead, "Social Link"));
  if (!raw || !/linkedin\.com/i.test(raw)) return "";
  return normalizeOptionalUrl(raw);
}

function getReportUrl(lead: SheetLead) {
  return normalizeOptionalUrl(sheetValue(lead, "Report URL"));
}

function getEmailPreviewUrl(lead: SheetLead) {
  return normalizeOptionalUrl(sheetValue(lead, "Email Preview Image URL"));
}

function buildEmailPreviewHtml(lead: SheetLead) {
  const reportUrl = getReportUrl(lead);
  const imageUrl = getEmailPreviewUrl(lead);
  if (!reportUrl || !imageUrl) return "";

  const alt = cleanText(sheetValue(lead, "Business Name") || sheetValue(lead, "Website URL") || "Private tracking review")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${alt} private tracking review" width="600" style="display:block;width:100%;max-width:600px;border:0;border-radius:16px;outline:none;text-decoration:none;" /></a>`;
}

function gmailComposeUrl(input: { to: string; subject: string; body: string }) {
  const params = new URLSearchParams();
  if (input.to) params.set("to", input.to);
  if (input.subject) params.set("su", input.subject);
  if (input.body) params.set("body", stripHtml(input.body));
  return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
}

function sourceTone(source: string) {
  if (source === "python_search") return "bg-blue-50 text-blue-700 border-blue-100";
  if (source === "linkedin_audit") return "bg-violet-50 text-violet-700 border-violet-100";
  if (source === "manual") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function stageTone(stage: GmailOutreachStage) {
  if (stage === "ready") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (stage.startsWith("followup")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (stage === "closed") return "bg-gray-50 text-gray-600 border-gray-100";
  if (stage === "do_not_contact") return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
}

export default function GmailOutreachPanel({
  sheetLeads,
  sheetStatus,
  sheetLoading,
  loadSheetLeads,
  patchSheetLead,
}: GmailOutreachPanelProps) {
  const [stageFilter, setStageFilter] = useState<GmailOutreachStage | "all">("ready");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftStage, setDraftStage] = useState<GmailOutreachStage>("ready");
  const [status, setStatus] = useState("");
  const [actionLoadingRow, setActionLoadingRow] = useState<number | null>(null);

  const selectedLead = useMemo(
    () => sheetLeads.find((lead) => Number(lead.rowNumber) === Number(selectedRowNumber)) || null,
    [selectedRowNumber, sheetLeads],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: sheetLeads.length };
    STAGE_TABS.forEach((tab) => {
      if (tab.id !== "all") result[tab.id] = 0;
    });
    sheetLeads.forEach((lead) => {
      const stage = getGmailOutreachStage(lead);
      result[stage] = (result[stage] || 0) + 1;
    });
    return result;
  }, [sheetLeads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sheetLeads
      .filter((lead) => {
        const stage = getGmailOutreachStage(lead);
        if (stageFilter !== "all" && stage !== stageFilter) return false;

        const source = getSheetSourceKind(lead);
        if (sourceFilter !== "all" && source !== sourceFilter) return false;

        if (!query) return true;
        return [
          sheetValue(lead, "Business Name"),
          sheetValue(lead, "Website URL"),
          sheetValue(lead, "Final Email"),
          sheetValue(lead, "Social Link"),
          sheetValue(lead, "Report URL"),
          sheetValue(lead, "Lead Source"),
          sheetValue(lead, "Audit Source"),
          sheetValue(lead, "Gmail Outreach Notes"),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 500);
  }, [sheetLeads, stageFilter, sourceFilter, search]);

  const copyText = async (value: string, label: string) => {
    const text = String(value || "").trim();
    if (!text) {
      setStatus(`${label} missing for this row.`);
      return;
    }

    await navigator.clipboard.writeText(text);
    setStatus(`${label} copied.`);
  };

  const openLead = (lead: SheetLead) => {
    const stage = getGmailOutreachStage(lead);
    setSelectedRowNumber(Number(lead.rowNumber));
    setDraftStage(stage === "initial_sent" ? "followup_1" : stage);
    setDraftSubject(getGmailOutreachSubject(lead, stage));
    setDraftMessage(getGmailOutreachMessage(lead, stage));
    setStatus("");
  };

  const saveDraftForSelected = async () => {
    if (!selectedLead) return;
    setActionLoadingRow(Number(selectedLead.rowNumber));
    try {
      const updates: Record<string, string> = {
        [gmailSubjectHeaderForStage(draftStage)]: draftSubject,
        [gmailMessageHeaderForStage(draftStage)]: draftMessage,
        "Gmail Last Action": "draft_saved",
        "Gmail Last Action At": nowLocalString(),
      };
      await patchSheetLead(Number(selectedLead.rowNumber), updates);
      setStatus(`Saved ${GMAIL_OUTREACH_STAGE_LABELS[draftStage]} draft to Google Sheet.`);
    } catch (error: any) {
      setStatus(`Save failed: ${error?.message || "Unknown error"}`);
    } finally {
      setActionLoadingRow(null);
    }
  };

  const markSent = async (lead: SheetLead, stageInput?: GmailOutreachStage) => {
    const stage = stageInput || getGmailOutreachStage(lead);
    const nextStage = getNextGmailStageAfterSend(stage);
    const sentAt = nowLocalString();
    const subject = selectedLead?.rowNumber === lead.rowNumber ? draftSubject : getGmailOutreachSubject(lead, stage);
    const message = selectedLead?.rowNumber === lead.rowNumber ? draftMessage : getGmailOutreachMessage(lead, stage);
    const label = stage === "ready" || stage === "initial_sent" ? "Initial" : GMAIL_OUTREACH_STAGE_LABELS[stage];

    setActionLoadingRow(Number(lead.rowNumber));

    try {
      const updates: Record<string, string> = {
        "Gmail Outreach Stage": nextStage,
        "Gmail Last Sent At": sentAt,
        "Gmail Last Action": `${stage}_sent`,
        "Gmail Last Action At": sentAt,
        [gmailSentAtHeaderForStage(stage)]: sentAt,
        [gmailSubjectHeaderForStage(stage)]: subject,
        [gmailMessageHeaderForStage(stage)]: message,
        "Send Status": nextStage === "closed" ? "Manual Gmail Sequence Completed" : `Manual Gmail ${label} Sent`,
      };

      await patchSheetLead(Number(lead.rowNumber), updates);
      setStatus(`${label} marked sent. Row moved to ${GMAIL_OUTREACH_STAGE_LABELS[nextStage]}.`);

      if (selectedLead?.rowNumber === lead.rowNumber) {
        setDraftStage(nextStage);
        setDraftSubject(getGmailOutreachSubject({ ...lead, ...updates } as SheetLead, nextStage));
        setDraftMessage(getGmailOutreachMessage({ ...lead, ...updates } as SheetLead, nextStage));
      }
    } catch (error: any) {
      setStatus(`Update failed: ${error?.message || "Unknown error"}`);
    } finally {
      setActionLoadingRow(null);
    }
  };

  const setClosed = async (lead: SheetLead, reason = "Closed from Gmail Outreach panel") => {
    setActionLoadingRow(Number(lead.rowNumber));
    try {
      await patchSheetLead(Number(lead.rowNumber), {
        "Gmail Outreach Stage": "closed",
        "Gmail Closed Reason": reason,
        "Gmail Last Action": "closed",
        "Gmail Last Action At": nowLocalString(),
        "Send Status": "Manual Gmail Closed",
      });
      setStatus("Lead closed in Google Sheet.");
    } catch (error: any) {
      setStatus(`Close failed: ${error?.message || "Unknown error"}`);
    } finally {
      setActionLoadingRow(null);
    }
  };

  const setDoNotContact = async (lead: SheetLead) => {
    if (!window.confirm("Mark this Sheet row as Do Not Contact?")) return;
    setActionLoadingRow(Number(lead.rowNumber));
    try {
      await patchSheetLead(Number(lead.rowNumber), {
        "Gmail Outreach Stage": "do_not_contact",
        "Gmail Last Action": "do_not_contact",
        "Gmail Last Action At": nowLocalString(),
        "Send Status": "Do Not Contact",
      });
      setStatus("Marked Do Not Contact in Google Sheet.");
    } catch (error: any) {
      setStatus(`Update failed: ${error?.message || "Unknown error"}`);
    } finally {
      setActionLoadingRow(null);
    }
  };

  const selectedEmail = selectedLead ? getEmail(selectedLead) : "";
  const selectedLinkedIn = selectedLead ? getLinkedInUrl(selectedLead) : "";
  const selectedReport = selectedLead ? getReportUrl(selectedLead) : "";
  const selectedPreviewHtml = selectedLead ? buildEmailPreviewHtml(selectedLead) : "";

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Gmail Workspace Outreach</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Sheet-only manual Gmail pipeline</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              This panel reads and updates Google Sheet rows only. Use Gmail Workspace for actual sending, then mark each stage here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadSheetLeads(true)}
            disabled={sheetLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm disabled:opacity-60"
          >
            {sheetLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh Sheet
          </button>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, email, website, LinkedIn..."
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
              className="w-full bg-transparent text-sm font-black text-slate-700 outline-none"
            >
              {SOURCE_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
            {sheetLoading ? "Loading Sheet..." : sheetStatus || `${filteredLeads.length} visible row(s)`}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStageFilter(tab.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide ${
                stageFilter === tab.id
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5">{tab.id === "all" ? counts.all : counts[tab.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {status && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {status}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const stage = getGmailOutreachStage(lead);
            const source = getSheetSourceKind(lead);
            const email = getEmail(lead);
            const linkedIn = getLinkedInUrl(lead);
            const reportUrl = getReportUrl(lead);
            const loading = actionLoadingRow === Number(lead.rowNumber);
            const nextStage = getNextGmailStageAfterSend(stage);
            const markLabel = stage === "ready" || stage === "initial_sent" ? "Mark Initial Sent" : `Mark ${GMAIL_OUTREACH_STAGE_LABELS[stage]} Sent`;

            return (
              <article key={lead.rowNumber} className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black text-white">#{lead.rowNumber}</span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${stageTone(stage)}`}>
                        {GMAIL_OUTREACH_STAGE_LABELS[stage]}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${sourceTone(source)}`}>
                        {getSheetSourceLabel(lead)}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-black text-slate-950">
                      {sheetValue(lead, "Business Name") || sheetValue(lead, "Website URL") || "Unnamed Sheet lead"}
                    </h3>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">{sheetValue(lead, "Website URL")}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-400">
                      {email || "No email"} {linkedIn ? "· LinkedIn available" : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openLead(lead)}
                      className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50"
                    >
                      Details / Copy
                    </button>
                    {email && (
                      <button
                        type="button"
                        onClick={() => copyText(email, "Email")}
                        className="inline-flex items-center gap-1 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50"
                      >
                        <Copy size={13} /> Email
                      </button>
                    )}
                    {linkedIn && (
                      <a
                        href={linkedIn}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] font-black uppercase text-violet-700"
                      >
                        <ExternalLink size={13} /> LinkedIn
                      </a>
                    )}
                    {reportUrl && (
                      <button
                        type="button"
                        onClick={() => copyText(reportUrl, "Secure URL")}
                        className="inline-flex items-center gap-1 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-black uppercase text-blue-700"
                      >
                        <Copy size={13} /> Report
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <a
                    href={gmailComposeUrl({
                      to: email,
                      subject: getGmailOutreachSubject(lead, stage),
                      body: getGmailOutreachMessage(lead, stage),
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-[11px] font-black uppercase text-white"
                  >
                    <Mail size={14} /> Open Gmail
                  </a>
                  <button
                    type="button"
                    onClick={() => markSent(lead, stage)}
                    disabled={loading || stage === "closed" || stage === "do_not_contact"}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase text-white disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {markLabel}
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">Next: {GMAIL_OUTREACH_STAGE_LABELS[nextStage]}</span>
                </div>
              </article>
            );
          })}

          {!filteredLeads.length && (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No Sheet rows matched this Gmail outreach filter.
            </div>
          )}
        </div>

        <aside className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
          {!selectedLead ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <MessageSquare size={32} className="text-slate-300" />
              <h3 className="mt-4 text-lg font-black text-slate-900">Select a lead</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Open a row to copy contact info, save Gmail drafts, and mark the follow-up stage.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Selected row #{selectedLead.rowNumber}</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{sheetValue(selectedLead, "Business Name") || "Selected lead"}</h3>
                <p className="mt-1 break-words text-xs font-bold text-slate-500">{sheetValue(selectedLead, "Website URL")}</p>
              </div>

              <div className="grid gap-2">
                <button type="button" onClick={() => copyText(selectedEmail, "Email")} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs font-black text-slate-700">
                  Copy email: <span className="font-semibold">{selectedEmail || "Missing"}</span>
                </button>
                <button type="button" onClick={() => copyText(selectedLinkedIn, "LinkedIn URL")} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs font-black text-slate-700">
                  Copy LinkedIn: <span className="font-semibold">{selectedLinkedIn || "Missing"}</span>
                </button>
                {selectedLinkedIn && (
                  <a href={selectedLinkedIn} target="_blank" rel="noreferrer" className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700">
                    Open LinkedIn profile ↗
                  </a>
                )}
                <button type="button" onClick={() => copyText(selectedReport, "Secure URL")} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-xs font-black text-blue-700">
                  Copy secure page URL
                </button>
                <button type="button" onClick={() => copyText(selectedPreviewHtml, "Email preview HTML")} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-xs font-black text-blue-700">
                  Copy email preview HTML
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Gmail stage</label>
                <select
                  value={draftStage}
                  onChange={(event) => {
                    const stage = event.target.value as GmailOutreachStage;
                    setDraftStage(stage);
                    setDraftSubject(getGmailOutreachSubject(selectedLead, stage));
                    setDraftMessage(getGmailOutreachMessage(selectedLead, stage));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 outline-none"
                >
                  {STAGE_TABS.filter((tab) => tab.id !== "all").map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject</span>
                <input
                  value={draftSubject}
                  onChange={(event) => setDraftSubject(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message / follow-up copy</span>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  rows={10}
                  className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none"
                />
              </label>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={saveDraftForSelected}
                  disabled={actionLoadingRow === Number(selectedLead.rowNumber)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {actionLoadingRow === Number(selectedLead.rowNumber) ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save draft to Sheet
                </button>
                <a
                  href={gmailComposeUrl({ to: selectedEmail, subject: draftSubject, body: draftMessage })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase text-white"
                >
                  <Mail size={15} /> Open Gmail Compose
                </a>
                <button
                  type="button"
                  onClick={() => markSent(selectedLead, draftStage)}
                  disabled={actionLoadingRow === Number(selectedLead.rowNumber) || draftStage === "closed" || draftStage === "do_not_contact"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
                >
                  Mark sent and move next
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setClosed(selectedLead)} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-black uppercase text-slate-600">
                    Close
                  </button>
                  <button type="button" onClick={() => setDoNotContact(selectedLead)} className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-black uppercase text-red-700">
                    Do Not Contact
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
