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
  X,
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
type EditableGmailStage = "ready" | "followup_1" | "followup_2" | "followup_3" | "followup_4";
type DraftMap = Record<EditableGmailStage, { subject: string; message: string }>;

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

const EDITABLE_STAGES: Array<{ id: EditableGmailStage; label: string; helper: string }> = [
  { id: "ready", label: "Initial Email", helper: "Main email copy from the Sheet Email Subject / Email Body, or the saved Gmail Initial fields." },
  { id: "followup_1", label: "Follow-up 1", helper: "Optional first follow-up copy." },
  { id: "followup_2", label: "Follow-up 2", helper: "Optional second follow-up copy." },
  { id: "followup_3", label: "Follow-up 3", helper: "Optional third follow-up copy." },
  { id: "followup_4", label: "Follow-up 4", helper: "Optional fourth follow-up / final close-the-loop copy." },
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
  const direct = normalizeOptionalUrl(sheetValue(lead, "Email Preview Image URL"));
  if (direct) return direct;

  // Backward-compatible fallback for rows created while the Sheet header did not yet
  // include Email Preview Image columns. In those rows, the preview URL may sit in
  // the next available report column, usually PDF File ID.
  const legacyPdfFileId = normalizeOptionalUrl(sheetValue(lead, "PDF File ID"));
  if (/\/api\/email-preview\//i.test(legacyPdfFileId)) return legacyPdfFileId;

  const legacyPdfViewUrl = normalizeOptionalUrl(sheetValue(lead, "PDF View URL"));
  if (/\/api\/email-preview\//i.test(legacyPdfViewUrl)) return legacyPdfViewUrl;

  return "";
}

function escapeHtmlAttribute(value: unknown): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildEmailPreviewHtml(lead: SheetLead) {
  const reportUrl = getReportUrl(lead);
  const imageUrl = getEmailPreviewUrl(lead);
  if (!reportUrl || !imageUrl) return "";

  const alt = escapeHtmlAttribute(
    cleanText(sheetValue(lead, "Business Name") || sheetValue(lead, "Website URL") || "Private tracking review"),
  );
  const safeReportUrl = escapeHtmlAttribute(reportUrl);
  const safeImageUrl = escapeHtmlAttribute(imageUrl);

  // Gmail-ready block: when copied as text/html, this pastes as a visible image
  // and the image itself opens the secure TrackFlow report page.
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:16px 0;line-height:1.45;color:#111827;">
      <a href="${safeReportUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:#111827;">
        <img src="${safeImageUrl}" alt="${alt} private tracking review" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:1px solid #e5e7eb;border-radius:16px;outline:none;text-decoration:none;" />
      </a>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;margin-top:8px;">
        Private TrackFlow review — click the image to open the secure page.
      </div>
    </div>
  `.trim();
}

function buildEmailPreviewPlainText(lead: SheetLead | null) {
  if (!lead) return "";
  const reportUrl = getReportUrl(lead);
  const imageUrl = getEmailPreviewUrl(lead);
  return [
    reportUrl ? `Secure page: ${reportUrl}` : "",
    imageUrl ? `Email preview image: ${imageUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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

function editableStageFromCurrent(stage: GmailOutreachStage): EditableGmailStage {
  if (stage === "followup_1" || stage === "followup_2" || stage === "followup_3" || stage === "followup_4") return stage;
  return "ready";
}

function buildDraftMap(lead: SheetLead): DraftMap {
  return {
    ready: {
      subject: getGmailOutreachSubject(lead, "ready"),
      message: getGmailOutreachMessage(lead, "ready"),
    },
    followup_1: {
      subject: getGmailOutreachSubject(lead, "followup_1"),
      message: getGmailOutreachMessage(lead, "followup_1"),
    },
    followup_2: {
      subject: getGmailOutreachSubject(lead, "followup_2"),
      message: getGmailOutreachMessage(lead, "followup_2"),
    },
    followup_3: {
      subject: getGmailOutreachSubject(lead, "followup_3"),
      message: getGmailOutreachMessage(lead, "followup_3"),
    },
    followup_4: {
      subject: getGmailOutreachSubject(lead, "followup_4"),
      message: getGmailOutreachMessage(lead, "followup_4"),
    },
  };
}

function buildSheetDraftUpdates(drafts: DraftMap): Record<string, string> {
  const updates: Record<string, string> = {};
  EDITABLE_STAGES.forEach((stage) => {
    updates[gmailSubjectHeaderForStage(stage.id)] = drafts[stage.id].subject;
    updates[gmailMessageHeaderForStage(stage.id)] = drafts[stage.id].message;
  });
  return updates;
}

function plainEmailBody(message: string) {
  const plain = stripHtml(message);
  return plain || String(message || "").trim();
}

function fullCopyText(subject: string, message: string) {
  const cleanSubject = String(subject || "").trim();
  const cleanBody = plainEmailBody(message);
  return [cleanSubject ? `Subject: ${cleanSubject}` : "", cleanBody].filter(Boolean).join("\n\n");
}

function escapeHtmlText(value: unknown): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasLikelyHtml(value: string) {
  return /<\/?(?:p|br|div|span|table|tbody|tr|td|a|strong|b|em|i|ul|ol|li|img|h[1-6])\b/i.test(String(value || ""));
}

function plainTextToParagraphHtml(value: string) {
  const paragraphs = String(value || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) return "";

  return paragraphs
    .map((paragraph) => `<p style="margin:0 0 12px 0;">${escapeHtmlText(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function normalizeEmailBodyHtml(message: string) {
  const raw = String(message || "").trim();
  if (!raw) return "";
  if (hasLikelyHtml(raw)) return raw;
  return plainTextToParagraphHtml(raw);
}

function buildRichEmailBodyHtml(message: string) {
  const html = normalizeEmailBodyHtml(message);
  if (!html) return "";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;max-width:640px;">
      ${html}
    </div>
  `.trim();
}

function buildRichFullEmailHtml(subject: string, message: string) {
  const subjectText = String(subject || "").trim();
  const bodyHtml = normalizeEmailBodyHtml(message);
  if (!subjectText && !bodyHtml) return "";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;max-width:640px;">
      ${subjectText ? `<div style="margin:0 0 14px 0;font-size:13px;line-height:19px;color:#374151;"><strong>Subject:</strong> ${escapeHtmlText(subjectText)}</div>` : ""}
      ${bodyHtml}
    </div>
  `.trim();
}

type ClipboardCopyMode = "rich" | "dom-rich" | "plain";

function copyRichHtmlViaDomSelection(html: string): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;

  const container = document.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "760px";
  container.style.padding = "16px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();

  try {
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);
    container.focus();
    const copied = document.execCommand("copy");
    selection?.removeAllRanges();
    return copied;
  } catch {
    selection?.removeAllRanges();
    return false;
  } finally {
    document.body.removeChild(container);
  }
}

async function writeRichHtmlToClipboard(html: string, plainText: string): Promise<ClipboardCopyMode> {
  const safeHtml = String(html || "").trim();
  const safePlain = String(plainText || "").trim() || stripHtml(safeHtml);
  if (!safeHtml && !safePlain) throw new Error("Nothing to copy.");

  try {
    const ClipboardItemCtor = typeof window !== "undefined" ? (window as any).ClipboardItem : undefined;
    const clipboardWrite = typeof navigator !== "undefined" ? (navigator.clipboard as any)?.write : undefined;
    if (ClipboardItemCtor && typeof clipboardWrite === "function") {
      await clipboardWrite.call(navigator.clipboard, [
        new ClipboardItemCtor({
          "text/html": new Blob([safeHtml || escapeHtmlText(safePlain)], { type: "text/html" }),
          "text/plain": new Blob([safePlain], { type: "text/plain" }),
        }),
      ]);
      return "rich";
    }
  } catch {
    // Some browsers block navigator.clipboard.write for HTML. Fall back to a
    // DOM selection copy, which still gives Gmail a rendered HTML selection.
  }

  if (safeHtml && copyRichHtmlViaDomSelection(safeHtml)) {
    return "dom-rich";
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(safePlain || safeHtml);
    return "plain";
  }

  throw new Error("Clipboard copy is not available in this browser.");
}


export default function GmailOutreachPanel({
  sheetLeads,
  sheetStatus,
  sheetLoading,
  loadSheetLeads,
  patchSheetLead,
}: GmailOutreachPanelProps) {
  const [stageFilter, setStageFilter] = useState<GmailOutreachStage | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>(() => ({
    ready: { subject: "", message: "" },
    followup_1: { subject: "", message: "" },
    followup_2: { subject: "", message: "" },
    followup_3: { subject: "", message: "" },
    followup_4: { subject: "", message: "" },
  }));
  const [activeDraftStage, setActiveDraftStage] = useState<EditableGmailStage>("ready");
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

    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied.`);
    } catch (error: any) {
      setStatus(`${label} copy failed: ${error?.message || "clipboard blocked"}`);
    }
  };

  const copyRichHtml = async (html: string, plainText: string, label: string) => {
    const richHtml = String(html || "").trim();
    const plain = String(plainText || "").trim() || stripHtml(richHtml);

    if (!richHtml && !plain) {
      setStatus(`${label} missing for this row.`);
      return;
    }

    try {
      const mode = await writeRichHtmlToClipboard(richHtml, plain);
      if (mode === "plain") {
        setStatus(`${label} copied as plain text fallback. Use Open rendered preview if Gmail shows code/text only.`);
      } else {
        setStatus(`${label} copied as a rich Gmail-ready block. Paste directly into Gmail compose.`);
      }
    } catch (error: any) {
      setStatus(`${label} copy failed: ${error?.message || "clipboard blocked"}`);
    }
  };

  const openRenderedPreview = () => {
    if (!selectedPreviewHtml) {
      setStatus("Email preview image block missing for this row.");
      return;
    }

    const previewWindow = window.open("", "_blank", "width=820,height=720");
    if (!previewWindow) {
      setStatus("Popup blocked. Allow popups, or use Copy Gmail image block.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>TrackFlow Gmail Image Preview</title>
          <style>
            body { margin: 0; padding: 28px; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
            .card { max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.10); }
            .hint { margin: 0 0 18px 0; font-size: 13px; line-height: 20px; color: #475569; font-weight: 700; }
            .copy-zone { padding: 12px; border: 1px dashed #cbd5e1; border-radius: 18px; background: #ffffff; }
          </style>
        </head>
        <body>
          <div class="card">
            <p class="hint">Select/copy the image block below if the direct clipboard button does not paste correctly into Gmail. The image is linked to the secure report page.</p>
            <div class="copy-zone" contenteditable="true">${selectedPreviewHtml}</div>
          </div>
        </body>
      </html>`);
    previewWindow.document.close();
    setStatus("Rendered preview opened. Copy the visible image block from that page if needed.");
  };

  const openLead = (lead: SheetLead) => {
    const stage = getGmailOutreachStage(lead);
    setSelectedRowNumber(Number(lead.rowNumber));
    setDrafts(buildDraftMap(lead));
    setActiveDraftStage(editableStageFromCurrent(stage));
    setStatus("");
  };

  const closeLeadModal = () => {
    setSelectedRowNumber(null);
    setStatus("");
  };

  const updateDraft = (stage: EditableGmailStage, field: "subject" | "message", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value,
      },
    }));
  };

  const saveAllDraftsForSelected = async () => {
    if (!selectedLead) return;
    setActionLoadingRow(Number(selectedLead.rowNumber));
    try {
      await patchSheetLead(Number(selectedLead.rowNumber), {
        ...buildSheetDraftUpdates(drafts),
        "Gmail Last Action": "all_drafts_saved",
        "Gmail Last Action At": nowLocalString(),
      });
      setStatus("Initial + follow-up copies saved to Google Sheet.");
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
    const editableStage = editableStageFromCurrent(stage);
    const modalIsForThisLead = selectedLead?.rowNumber === lead.rowNumber;
    const subject = modalIsForThisLead ? drafts[editableStage].subject : getGmailOutreachSubject(lead, stage);
    const message = modalIsForThisLead ? drafts[editableStage].message : getGmailOutreachMessage(lead, stage);
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

      if (modalIsForThisLead) {
        setActiveDraftStage(editableStageFromCurrent(nextStage));
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
  const selectedPreviewUrl = selectedLead ? getEmailPreviewUrl(selectedLead) : "";
  const selectedPreviewHtml = selectedLead ? buildEmailPreviewHtml(selectedLead) : "";
  const selectedPreviewPlainText = buildEmailPreviewPlainText(selectedLead);
  const selectedCurrentStage = selectedLead ? getGmailOutreachStage(selectedLead) : "ready";
  const modalLoading = selectedLead ? actionLoadingRow === Number(selectedLead.rowNumber) : false;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Gmail Workspace Outreach</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Sheet-only manual Gmail pipeline</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Open a lead email modal, edit the initial copy and up to four follow-ups, save them to Google Sheet, then copy/paste into Gmail manually.
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
            <div className="mt-1 text-[10px] font-bold text-slate-400">
              Gmail Outreach loads all Sheet rows independently from the Sheet tab filters.
            </div>
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-[11px] font-black uppercase text-white"
                  >
                    <Mail size={14} /> Open email
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
            No Sheet rows matched this Gmail outreach filter. Click All, clear search, or refresh Sheet. This panel does not use the Sheet tab approval/send filters.
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Email copy modal · Sheet row #{selectedLead.rowNumber}</p>
                <h3 className="mt-2 truncate text-2xl font-black text-slate-950">
                  {sheetValue(selectedLead, "Business Name") || "Selected lead"}
                </h3>
                <p className="mt-1 break-words text-xs font-bold text-slate-500">{sheetValue(selectedLead, "Website URL")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${stageTone(selectedCurrentStage)}`}>
                    {GMAIL_OUTREACH_STAGE_LABELS[selectedCurrentStage]}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${sourceTone(getSheetSourceKind(selectedLead))}`}>
                    {getSheetSourceLabel(selectedLead)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLeadModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                aria-label="Close email modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-b border-slate-100 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(selectedEmail, "Email")}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-xs font-black text-slate-700"
                  >
                    Copy email
                    <span className="mt-1 block truncate font-semibold text-slate-500">{selectedEmail || "Missing"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(selectedLinkedIn, "LinkedIn URL")}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-xs font-black text-slate-700"
                  >
                    Copy LinkedIn
                    <span className="mt-1 block truncate font-semibold text-slate-500">{selectedLinkedIn || "Missing"}</span>
                  </button>
                  {selectedLinkedIn && (
                    <a
                      href={selectedLinkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700"
                    >
                      Open LinkedIn profile ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copyText(selectedReport, "Secure page URL")}
                    className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-xs font-black text-blue-700"
                  >
                    Copy secure page URL
                    <span className="mt-1 block truncate font-semibold text-blue-500">{selectedReport || "Missing"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(selectedPreviewUrl, "Email preview image URL")}
                    className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-left text-xs font-black text-sky-700"
                  >
                    Copy preview image URL
                    <span className="mt-1 block truncate font-semibold text-sky-500">{selectedPreviewUrl || "Missing"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyRichHtml(selectedPreviewHtml, selectedPreviewPlainText, "Gmail image block")}
                    className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-xs font-black text-blue-700"
                  >
                    Copy Gmail image block
                    <span className="mt-1 block font-semibold text-blue-500">Paste into Gmail as visible image</span>
                  </button>
                  <button
                    type="button"
                    onClick={openRenderedPreview}
                    className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-xs font-black text-indigo-700"
                  >
                    Open rendered preview
                    <span className="mt-1 block font-semibold text-indigo-500">Backup copy method</span>
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-3 text-[11px] font-bold leading-5 text-slate-500">
                  Gmail compose auto-open removed from the main flow. Copy subject/body from this modal, paste into Gmail Workspace, then mark the stage sent here. Use Copy Gmail image block when you want the preview image to paste as a visible, clickable image that opens the secure report page.
                </div>

                {selectedPreviewHtml ? (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3">
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Rendered Gmail image preview</div>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2" dangerouslySetInnerHTML={{ __html: selectedPreviewHtml }} />
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-700">
                    Email preview image is missing for this Sheet row. Secure page URL and normal email copy can still be copied.
                  </div>
                )}

                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    onClick={saveAllDraftsForSelected}
                    disabled={modalLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
                  >
                    {modalLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Save all copy to Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => markSent(selectedLead, activeDraftStage)}
                    disabled={modalLoading || selectedCurrentStage === "closed" || selectedCurrentStage === "do_not_contact"}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
                  >
                    Mark selected stage sent
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
              </aside>

              <main className="space-y-4 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {EDITABLE_STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveDraftStage(stage.id)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide ${
                        activeDraftStage === stage.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>

                {EDITABLE_STAGES.map((stage) => {
                  const isActive = activeDraftStage === stage.id;
                  const draft = drafts[stage.id];

                  return (
                    <section
                      key={stage.id}
                      className={`rounded-[26px] border p-4 ${isActive ? "border-slate-300 bg-white shadow-sm" : "border-slate-100 bg-slate-50/60"}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-950">{stage.label}</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{stage.helper}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(draft.subject, `${stage.label} subject`)}
                            className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-600"
                          >
                            Copy subject
                          </button>
                          <button
                            type="button"
                            onClick={() => copyRichHtml(buildRichEmailBodyHtml(draft.message), plainEmailBody(draft.message), `${stage.label} body`)}
                            className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-600"
                          >
                            Copy body rich
                          </button>
                          <button
                            type="button"
                            onClick={() => copyRichHtml(buildRichFullEmailHtml(draft.subject, draft.message), fullCopyText(draft.subject, draft.message), `${stage.label} full copy`)}
                            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-700"
                          >
                            Copy all rich
                          </button>
                          <button
                            type="button"
                            onClick={() => markSent(selectedLead, stage.id)}
                            disabled={modalLoading}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"
                          >
                            Mark sent
                          </button>
                        </div>
                      </div>

                      <label className="mt-4 block">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Subject</span>
                        <input
                          value={draft.subject}
                          onChange={(event) => updateDraft(stage.id, "subject", event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-300"
                          placeholder={`${stage.label} subject`}
                        />
                      </label>

                      <label className="mt-3 block">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Message copy</span>
                        <textarea
                          value={draft.message}
                          onChange={(event) => updateDraft(stage.id, "message", event.target.value)}
                          rows={stage.id === "ready" ? 10 : 7}
                          className="mt-2 w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-slate-300"
                          placeholder={`${stage.label} message copy`}
                        />
                      </label>
                    </section>
                  );
                })}
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
