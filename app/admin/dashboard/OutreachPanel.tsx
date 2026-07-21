"use client";

import React, { type FormEvent, type RefObject, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Eye,
  FileText,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Search,
  Send,
  Type,
  X,
} from "lucide-react";
import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnNumberedList,
  BtnBulletList,
  BtnClearFormatting,
} from "react-simple-wysiwyg";
import { ACTIVE_SENDERS, type SenderAccount } from "../../../lib/senders";
import type { OutreachBlockId } from "../../../lib/trackflow-email/outreach-blocks";
import type { EmailSignatureMode, EmailSignatureProfile } from "../../../lib/trackflow-email/signature-profile";

import type { ContactMemoryWarning, Lead, ServiceId, SheetLead, SendEmailDrawerFilter } from "./types";
import { SERVICE_NAMES } from "./constants";
import {
  applyMergeTags,
  formatDate,
  isEmailPatternValid,
  makeNameFromEmail,
  normalizeEmailSubjectForComposer,
  normalizeOptionalUrl,
  sanitizePreviewHtml,
  stripHtml,
} from "./utils";
import { getSheetEmailQueueStatus, getSheetReadiness, isSecureReportUrl, isSheetEmailOutreachCandidate, sheetValue } from "./sheet-readiness";

type SetState<T> = (value: T | ((current: T) => T)) => void;

type MergeTag = "{name}" | "{company}" | "{website}" | "{service}";

const isPreviewSystemClosingBlock = (html: string) => {
  const plain = stripHtml(String(html || ""))
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return true;
  if (plain.length > 220) return false;

  const normalized = plain.toLowerCase().replace(/[,.!]+$/g, "").trim();
  if (/^(best|best regards|regards|kind regards|thanks|thank you)$/i.test(normalized)) return true;
  if (/^(best regards|kind regards|regards|thanks|thank you)\b/i.test(plain) && /(shahjalal|trackflowpro|trackflow pro|founder|unsubscribe|reference|ref:)/i.test(plain)) return true;
  if (/^(shahjalal(?:\s+khan)?|trackflowpro|trackflow pro|founder,?\s*trackflowpro)$/i.test(normalized)) return true;
  if (/^(reference|ref:)\b/i.test(plain) && /unsubscribe/i.test(plain)) return true;
  if (/^(unsubscribe|mailing address)\b/i.test(plain)) return true;
  return false;
};

const stripPreviewComposerClosingBlocks = (html: string) => {
  let output = String(html || "").trim();

  for (let index = 0; index < 6; index += 1) {
    const match = output.match(/<(p|div)\b[^>]*>[\s\S]*?<\/\1>\s*$/i);
    if (!match || !isPreviewSystemClosingBlock(match[0])) break;
    output = output.slice(0, match.index).trim();
  }

  return output;
};

type OutreachPanelProps = {
  activeSender?: SenderAccount;
  senderCounts: Record<string, number>;
  selectedSender: string;
  email: string;
  setEmail: SetState<string>;
  clientName: string;
  setClientName: SetState<string>;
  companyName: string;
  setCompanyName: SetState<string>;
  website: string;
  setWebsite: SetState<string>;
  subject: string;
  setSubject: SetState<string>;
  message: string;
  setMessage: SetState<string>;
  scheduledTime: string;
  setScheduledTime: SetState<string>;
  selectedService: ServiceId | "";
  emailError: string;
  setEmailError: SetState<string>;
  sending: boolean;
  sendStatus: string;
  includeSignature: boolean;
  setIncludeSignature: SetState<boolean>;
  signatureMode: EmailSignatureMode;
  setSignatureMode: SetState<EmailSignatureMode>;
  signatureProfile: EmailSignatureProfile;
  setSignatureProfile: SetState<EmailSignatureProfile>;
  reportUrl: string;
  setReportUrl: SetState<string>;
  reportButtonText: string;
  setReportButtonText: SetState<string>;
  duplicateLead: Lead | null;
  checkingDuplicate: boolean;
  allowDuplicateSend: boolean;
  setAllowDuplicateSend: SetState<boolean>;
  contactMemoryWarning: ContactMemoryWarning | null;
  allowCooldownOverride: boolean;
  setAllowCooldownOverride: SetState<boolean>;
  lastDraftSavedAt: string;
  minDateTime: string;
  editorRef: RefObject<HTMLDivElement | null>;
  wordCount: number;
  totalLinkCount: number;
  canSend: boolean;
  mainInboxEmail: string;
  sheetLeads: SheetLead[];
  sheetLoading: boolean;
  sheetStatus: string;
  selectedOutreachSheetRow: number | null;
  loadSheetLeads: (force?: boolean) => Promise<void>;
  fillOutreachFromSheet: (lead: SheetLead) => void;
  handleSenderChange: (senderId: string) => void;
  handleServiceChange: (service: ServiceId) => void;
  insertMergeTag: (tag: MergeTag) => void;
  insertOutreachBlock: (blockId: OutreachBlockId) => void;
  addTextLink: () => void;
  resetOutreachForm: () => void;
  handleSendEmail: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  buildPreviewSignature: (
    sender?: SenderAccount,
    tag?: string,
    mode?: EmailSignatureMode,
    profile?: Partial<EmailSignatureProfile>,
  ) => string;
};

export default function OutreachPanel({
  activeSender,
  senderCounts,
  selectedSender,
  email,
  setEmail,
  clientName,
  setClientName,
  companyName,
  setCompanyName,
  website,
  setWebsite,
  subject,
  setSubject,
  message,
  setMessage,
  scheduledTime,
  setScheduledTime,
  selectedService,
  emailError,
  setEmailError,
  sending,
  sendStatus,
  includeSignature,
  setIncludeSignature,
  signatureMode,
  setSignatureMode,
  signatureProfile,
  setSignatureProfile,
  reportUrl,
  setReportUrl,
  reportButtonText,
  setReportButtonText,
  duplicateLead,
  checkingDuplicate,
  allowDuplicateSend,
  setAllowDuplicateSend,
  contactMemoryWarning,
  allowCooldownOverride,
  setAllowCooldownOverride,
  lastDraftSavedAt,
  minDateTime,
  editorRef,
  wordCount,
  totalLinkCount,
  canSend,
  mainInboxEmail,
  sheetLeads,
  sheetLoading,
  sheetStatus,
  selectedOutreachSheetRow,
  loadSheetLeads,
  fillOutreachFromSheet,
  handleSenderChange,
  handleServiceChange,
  insertMergeTag,
  insertOutreachBlock,
  addTextLink,
  resetOutreachForm,
  handleSendEmail,
  buildPreviewSignature,
}: OutreachPanelProps) {
    const senderCount = activeSender ? senderCounts[activeSender.email] || 0 : 0;
    const remaining = activeSender ? Math.max(activeSender.limit - senderCount, 0) : 0;
    const usagePercent = activeSender ? Math.min(Math.round((senderCount / activeSender.limit) * 100), 100) : 0;
    const senderTone = usagePercent >= 90 ? "text-red-600 bg-red-50" : usagePercent >= 70 ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50";
    const safeReportUrl = normalizeOptionalUrl(reportUrl);
    const previewMessage = applyMergeTags(message, {
      name: clientName,
      company: companyName,
      website,
      service: selectedService || undefined,
    });
    const sanitizedPreviewMessage = sanitizePreviewHtml(previewMessage);
    const signatureVisible = signatureMode !== "none" && includeSignature;
    const previewBodyHtml = signatureVisible ? stripPreviewComposerClosingBlocks(sanitizedPreviewMessage) : sanitizedPreviewMessage;
    const showPreviewClosing = signatureVisible && Boolean(stripHtml(previewMessage) || safeReportUrl);

    const qualityChecks = [
      { label: "Valid recipient email", ok: isEmailPatternValid(email) },
      { label: "Sender selected", ok: Boolean(activeSender) },
      { label: "Service selected", ok: Boolean(selectedService) },
      { label: "Subject added", ok: Boolean(subject.trim()) },
      { label: "Message body ready", ok: Boolean(stripHtml(message)) },
      { label: "Links kept minimal", ok: totalLinkCount <= 2 },
      { label: "CTA text short", ok: !safeReportUrl || (reportButtonText || "View private tracking review").trim().length <= 44 },
      { label: "Signature / unsubscribe visible", ok: signatureVisible },
      { label: "Signature email valid", ok: !signatureVisible || isEmailPatternValid(signatureProfile.email) },
      { label: "Secure /r report link valid or empty", ok: !reportUrl.trim() || Boolean(safeReportUrl && isSecureReportUrl(safeReportUrl)) },
      { label: "No duplicate lead", ok: !duplicateLead || allowDuplicateSend },
      { label: "Cooldown memory cleared/overridden", ok: !contactMemoryWarning || allowCooldownOverride },
    ];

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [signatureEditorOpen, setSignatureEditorOpen] = useState(false);
    const [drawerFilter, setDrawerFilter] = useState<SendEmailDrawerFilter>("all");
    const [drawerSearch, setDrawerSearch] = useState("");

    const emailQueueRows = useMemo(() => {
      const search = drawerSearch.trim().toLowerCase();
      return sheetLeads
        .filter(isSheetEmailOutreachCandidate)
        .map((lead) => {
          const readiness = getSheetReadiness(lead);
          const status = getSheetEmailQueueStatus(lead);
          return {
            lead,
            readiness,
            status,
            queueStatus: readiness.ready ? "ready" : "needs_review",
          } as const;
        })
        .filter((item) => drawerFilter === "all" || item.queueStatus === drawerFilter)
        .filter((item) => {
          if (!search) return true;
          const haystack = [
            sheetValue(item.lead, "Business Name"),
            sheetValue(item.lead, "Final Email"),
            sheetValue(item.lead, "Website URL"),
            sheetValue(item.lead, "Email Subject"),
            String(item.lead.rowNumber || ""),
          ].join(" ").toLowerCase();
          return haystack.includes(search);
        })
        .slice(0, 80);
    }, [drawerFilter, drawerSearch, sheetLeads]);

    const readyCount = useMemo(
      () => sheetLeads.filter(isSheetEmailOutreachCandidate).filter((lead) => getSheetReadiness(lead).ready).length,
      [sheetLeads],
    );
    const needsReviewCount = useMemo(
      () => sheetLeads.filter(isSheetEmailOutreachCandidate).filter((lead) => !getSheetReadiness(lead).ready).length,
      [sheetLeads],
    );

    const openDrawer = () => {
      setDrawerOpen(true);
      void loadSheetLeads(true);
    };

    const handleDrawerLeadSelect = (lead: SheetLead) => {
      fillOutreachFromSheet(lead);
      setDrawerOpen(false);
    };

    return (
      <div className="min-w-0 max-w-full space-y-6">
        <button
          type="button"
          onClick={openDrawer}
          className="fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-600 text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          aria-label="Open ready email leads drawer"
          title="Ready email leads"
        >
          <Mail size={18} />
          {readyCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
              {readyCount > 99 ? "99+" : readyCount}
            </span>
          ) : null}
        </button>

        {drawerOpen && (
          <aside className="fixed inset-x-3 bottom-3 top-20 z-50 flex max-w-[430px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(430px,calc(100vw-2rem))] sm:rounded-[28px]">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Send Email Queue</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">Ready Email Leads</h3>
                    <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                      Pick one lead, review the email in the composer, then send or schedule. LinkedIn-first reports stay out of this list.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
                    aria-label="Close ready email leads drawer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-[9px] font-black uppercase text-emerald-600">Ready</p>
                    <p className="text-2xl font-black text-emerald-700">{readyCount}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-[9px] font-black uppercase text-amber-600">Needs review</p>
                    <p className="text-2xl font-black text-amber-700">{needsReviewCount}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {(["all", "ready", "needs_review"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDrawerFilter(filter)}
                      className={`rounded-full px-3 py-2 text-[10px] font-black uppercase ${
                        drawerFilter === filter ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {filter === "needs_review" ? "Review" : filter}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => loadSheetLeads(true)}
                    disabled={sheetLoading}
                    className="ml-auto rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {sheetLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={drawerSearch}
                    onChange={(event) => setDrawerSearch(event.target.value)}
                    placeholder="Search business, email, website, row..."
                    className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                {sheetStatus && <p className="mt-2 text-[10px] font-bold text-slate-400">{sheetStatus}</p>}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
                {sheetLoading && emailQueueRows.length === 0 ? (
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm font-black text-blue-700">
                    Loading ready email leads...
                  </div>
                ) : emailQueueRows.length === 0 ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    No email-ready Sheet leads found for this filter. Refresh the drawer. If it still shows 0, check that the Google Sheet rows have Final Email and a secure Report URL.
                  </div>
                ) : (
                  emailQueueRows.map(({ lead, readiness, status, queueStatus }) => {
                    const selected = Number(selectedOutreachSheetRow || 0) === Number(lead.rowNumber || 0);
                    return (
                      <button
                        key={lead.rowNumber}
                        type="button"
                        onClick={() => handleDrawerLeadSelect(lead)}
                        className={`w-full rounded-3xl border p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50/40 ${
                          selected ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-100 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {sheetValue(lead, "Business Name") || `Sheet row ${lead.rowNumber}`}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{sheetValue(lead, "Final Email")}</p>
                            <p className="truncate text-[10px] font-bold text-slate-400">{sheetValue(lead, "Website URL")}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-black uppercase">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">Row {lead.rowNumber}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                            {sheetValue(lead, "Service Type") || "Google Ads"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                            {sheetValue(lead, "Approval Status") || "No approval"}
                          </span>
                        </div>
                        <p className={`mt-3 text-[10px] font-bold leading-relaxed ${queueStatus === "ready" ? "text-emerald-600" : "text-amber-600"}`}>
                          {readiness.ready ? "Ready to open in composer." : readiness.note}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
        )}

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-4 lg:p-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
            <div className="xl:col-span-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Sender</p>
              <p className="mt-1 text-sm font-black text-gray-900 truncate">{activeSender?.name || "No Sender"}</p>
              <p className="text-[10px] font-bold text-gray-400 truncate">{activeSender?.email || "Select sender"}</p>
            </div>

            <div className="xl:col-span-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase">Sent today</p>
                <p className="text-xl font-black text-gray-900">{senderCount}/{activeSender?.limit || 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase">Left today</p>
                <p className="text-xl font-black text-gray-900">{remaining}</p>
              </div>
            </div>

            <div className="xl:col-span-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Health</p>
              <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${senderTone}`}>
                {usagePercent >= 90 ? "Limit Warning" : usagePercent >= 70 ? "Warming" : "Healthy"}
              </span>
            </div>

            <div className="xl:col-span-5">
              <div className="rounded-[24px] bg-blue-50/60 border border-blue-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={15} className="text-blue-600" />
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Audit PDF / Report Link</p>
                  <span className="ml-auto text-[9px] font-black text-blue-400 uppercase">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Paste secure /r/[token] report link here"
                    className="md:col-span-3 w-full p-3 bg-white rounded-2xl outline-none border border-blue-100 focus:border-blue-500 text-xs font-bold"
                    value={reportUrl}
                    onChange={(e: any) => setReportUrl(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Link text"
                    className="md:col-span-2 w-full p-3 bg-white rounded-2xl outline-none border border-blue-100 focus:border-blue-500 text-xs font-bold"
                    value={reportButtonText}
                    onChange={(e: any) => setReportButtonText(e.target.value)}
                  />
                </div>
                <p className="text-[9px] font-bold text-blue-400 mt-2">
                  Only secure TrackFlow /r/[token] links are allowed. Direct PDF, Drive, localhost, and audit engine links are blocked.
                </p>
              </div>
            </div>
          </div>
        </div>

        {(checkingDuplicate || duplicateLead || contactMemoryWarning || lastDraftSavedAt) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lastDraftSavedAt && (
              <div className="bg-white rounded-[24px] border border-green-100 p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Save size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-900">Draft Auto-Saved</p>
                  <p className="text-[10px] font-bold text-gray-400">Last saved at {lastDraftSavedAt}. It will be restored after refresh.</p>
                </div>
                <button
                  type="button"
                  onClick={resetOutreachForm}
                  className="ml-auto rounded-xl border border-green-100 bg-white px-3 py-2 text-[9px] font-black uppercase text-green-700 hover:bg-green-50"
                >
                  Clear Draft
                </button>
              </div>
            )}

            {checkingDuplicate && (
              <div className="bg-white rounded-[24px] border border-blue-100 p-4 shadow-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <p className="text-xs font-black text-blue-600 uppercase">Checking duplicate email...</p>
              </div>
            )}

            {duplicateLead && (
              <div className="bg-red-50 rounded-[24px] border border-red-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center">
                    <AlertCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-red-700 uppercase">Duplicate Lead Warning</p>
                    <p className="text-[11px] font-bold text-red-600 mt-1">
                      This email already exists. Status: {duplicateLead.status || "N/A"} • Service: {duplicateLead.service || "N/A"} • Created: {formatDate(duplicateLead.createdAt)}
                    </p>
                    <label className="mt-3 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDuplicateSend}
                        onChange={(e: any) => setAllowDuplicateSend(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-[10px] font-black text-red-700 uppercase">
                        I checked this lead — Send Anyway
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {contactMemoryWarning && (
              <div className="bg-amber-50 rounded-[24px] border border-amber-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-amber-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-amber-700 uppercase">Cooldown Memory Warning</p>
                    <p className="text-[11px] font-bold text-amber-700 mt-1">
                      This email was contacted before. Outcome: {contactMemoryWarning.lastOutcome || "previous_contact"}
                      {contactMemoryWarning.lastContactedAt ? ` • Last contacted: ${formatDate(contactMemoryWarning.lastContactedAt)}` : ""}
                      {contactMemoryWarning.cooldownUntil ? ` • Cooldown until: ${formatDate(contactMemoryWarning.cooldownUntil)}` : ""}
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 mt-1">
                      Open: {contactMemoryWarning.openCount || 0} • Click: {contactMemoryWarning.clickCount || 0}
                      {contactMemoryWarning.companyName ? ` • ${contactMemoryWarning.companyName}` : ""}
                    </p>
                    <label className="mt-3 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowCooldownOverride}
                        onChange={(e: any) => setAllowCooldownOverride(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-[10px] font-black text-amber-700 uppercase">
                        I reviewed the footprint — Override cooldown and send
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-2 space-y-5">
            <div className="bg-white rounded-[35px] border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" /> Sender Accounts
              </h2>

              <div className="space-y-3">
                {ACTIVE_SENDERS.map((sender) => {
                  const count = senderCounts[sender.email] || 0;
                  const isActive = selectedSender === sender.id;
                  const percent = Math.min((count / sender.limit) * 100, 100);
                  const isLimitReached = count >= sender.limit;

                  return (
                    <button
                      type="button"
                      key={sender.id}
                      onClick={() => handleSenderChange(sender.id)}
                      className={`w-full p-4 rounded-3xl border-2 text-left transition-all duration-300 ${
                        isActive ? "border-blue-500 bg-blue-50/40 shadow-lg" : "border-gray-100 bg-gray-50/60 hover:border-blue-200"
                      } ${isLimitReached ? "opacity-60 grayscale" : ""}`}
                    >
                      <div className="flex justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className={`font-black text-xs truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                            {sender.name || makeNameFromEmail(sender.email)}
                          </p>
                          <p className="font-bold text-[10px] text-gray-400 truncate">{sender.email}</p>
                          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Sent today: {count}/{sender.limit} · Left: {Math.max(sender.limit - count, 0)}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isLimitReached ? "bg-red-100 text-red-600" : "bg-white text-gray-500"}`}>
                          {isLimitReached ? "Limit" : `${count}/${sender.limit}`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : "bg-blue-500"}`} style={{ width: `${percent}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 bg-white p-6 lg:p-8 rounded-[35px] shadow-xl border border-gray-50">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Professional Email Composer</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Fast blocks, clean body, cursor insertion</p>
                {selectedOutreachSheetRow ? (
                  <div className="mt-2 space-y-2">
                    <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-700">
                      Loaded from Sheet row {selectedOutreachSheetRow}
                    </p>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs font-bold text-slate-700">
                      <span className="block text-[10px] font-black uppercase text-blue-700">Sheet source only</span>
                      <span className="block text-[10px] leading-relaxed text-slate-500">
                        This row only fills the composer. After sending, the email becomes an independent Firestore outreach lead managed from Lead Management.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <Type className="text-blue-600" size={22} />
            </div>

            <form onSubmit={handleSendEmail} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Prospect Name"
                  required
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-medium"
                  value={clientName}
                  onChange={(e: any) => setClientName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-medium"
                  value={companyName}
                  onChange={(e: any) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="email"
                    placeholder="Target Email"
                    required
                    className={`w-full p-4 bg-gray-50 rounded-2xl outline-none border transition-all font-medium ${
                      emailError ? "border-red-400 bg-red-50" : "border-transparent focus:border-blue-500"
                    }`}
                    value={email}
                    onChange={(e: any) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                  />
                  {emailError && (
                    <div className="flex items-center gap-1 text-red-500 text-[10px] font-black mt-2 ml-2 uppercase tracking-tight">
                      <AlertCircle size={12} /> {emailError}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Website Link"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-medium"
                  value={website}
                  onChange={(e: any) => setWebsite(e.target.value)}
                />
              </div>

              <select
                required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-bold text-gray-700"
                value={selectedService}
                onChange={(e: any) => handleServiceChange(e.target.value as ServiceId)}
              >
                <option value="" disabled>Select Targeted Service</option>
                {SERVICE_NAMES.map((service) => <option key={service} value={service}>{service}</option>)}
              </select>

              <input
                type="text"
                placeholder="Subject Line"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-bold text-lg"
                value={subject}
                onChange={(e: any) => setSubject(e.target.value)}
                onBlur={(e: any) => setSubject(normalizeEmailSubjectForComposer(e.target.value))}
              />

              <div className="rounded-[30px] border border-gray-100 bg-[#fbfcff] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                    {(["{name}", "{company}", "{website}", "{service}"] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertMergeTag(tag)}
                        className="px-3 py-1.5 bg-white border border-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50"
                      >
                        {tag}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={addTextLink}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Link2 size={12} /> Insert Link
                    </button>
                  </div>

                  <div className="flex gap-2 text-[9px] font-black uppercase">
                    <span className="px-2 py-1 rounded-lg bg-white text-gray-400 border border-gray-100">{wordCount} Words</span>
                    <span className={`px-2 py-1 rounded-lg border ${totalLinkCount > 2 ? "bg-red-50 text-red-500 border-red-100" : "bg-white text-gray-400 border-gray-100"}`}>
                      {totalLinkCount} Links
                    </span>
                  </div>
                </div>

                <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Quick insert</span>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        const value = event.currentTarget.value as OutreachBlockId;
                        if (value) insertOutreachBlock(value);
                        event.currentTarget.value = "";
                      }}
                      className="min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="" disabled>Insert a ready block…</option>
                      <option value="greeting">Greeting</option>
                      <option value="wordpress_gig">WordPress Fiverr card</option>
                      <option value="shopify_gig">Shopify Fiverr card</option>
                      <option value="soft_question">Soft question</option>
                      <option value="opt_out">Opt-out line</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => insertOutreachBlock("wordpress_gig")}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-700 hover:bg-emerald-100"
                    >
                      + WordPress Gig
                    </button>
                    <button
                      type="button"
                      onClick={() => insertOutreachBlock("shopify_gig")}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-700 hover:bg-blue-100"
                    >
                      + Shopify Gig
                    </button>
                    <span className="mx-1 hidden h-7 w-px bg-slate-200 lg:block" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Signature</span>
                    <select
                      value={signatureMode}
                      onChange={(event) => {
                        const nextMode = event.currentTarget.value as EmailSignatureMode;
                        setSignatureMode(nextMode);
                        setIncludeSignature(nextMode !== "none");
                      }}
                      className="min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="compact">Shahjalal — Professional</option>
                      <option value="minimal">Short outreach signature</option>
                      <option value="none">No signature</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSignatureEditorOpen((current) => !current)}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-700 hover:bg-blue-100"
                    >
                      {signatureEditorOpen ? "Close editor" : "Edit signature"}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-relaxed text-slate-400">
                    Blocks are inserted at the text cursor. The selected signature is added automatically below the message; reference and unsubscribe remain included.
                  </p>

                  {signatureEditorOpen ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Name</span>
                        <input
                          value={signatureProfile.name}
                          onChange={(event) => setSignatureProfile((current) => ({ ...current, name: event.target.value }))}
                          maxLength={80}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Professional title</span>
                        <input
                          value={signatureProfile.title}
                          onChange={(event) => setSignatureProfile((current) => ({ ...current, title: event.target.value }))}
                          maxLength={100}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Company</span>
                        <input
                          value={signatureProfile.company}
                          onChange={(event) => setSignatureProfile((current) => ({ ...current, company: event.target.value }))}
                          maxLength={80}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Email shown in signature</span>
                        <input
                          type="email"
                          value={signatureProfile.email}
                          onChange={(event) => setSignatureProfile((current) => ({ ...current, email: event.target.value }))}
                          maxLength={160}
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 ${
                            isEmailPatternValid(signatureProfile.email) ? "border-gray-200" : "border-amber-300 bg-amber-50"
                          }`}
                        />
                      </label>
                      <p className="sm:col-span-2 text-[10px] font-medium leading-relaxed text-gray-400">
                        Signature settings are saved in this browser. Current reply inbox: {mainInboxEmail}.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div ref={editorRef} className="modern-editor-wrapper rounded-[26px] border-2 border-gray-100 overflow-hidden focus-within:border-blue-500 transition-all bg-white shadow-sm">
                  <EditorProvider>
                    <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                      <BtnBold /> <BtnItalic /> <BtnUnderline />
                      <span className="w-px h-6 bg-gray-200 mx-1"></span>
                      <BtnNumberedList /> <BtnBulletList />
                      <span className="w-px h-6 bg-gray-200 mx-1"></span>
                      <button type="button" onClick={addTextLink} className="p-1.5 hover:bg-blue-50 rounded-md border border-gray-200 flex items-center justify-center transition-all">
                        <Link2 size={16} className="text-gray-600" />
                      </button>
                      <BtnClearFormatting />
                    </Toolbar>
                    <Editor
                      value={message}
                      onChange={(e: any) => setMessage(e.target.value)}
                      className="min-h-[560px] p-5 bg-white outline-none text-gray-800 font-medium email-editor-content"
                    />
                  </EditorProvider>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-500 ml-1 uppercase">Schedule with Brevo</span>
                  <input
                    type="datetime-local"
                    min={minDateTime}
                    className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm border-2 border-blue-100"
                    value={scheduledTime}
                    onChange={(e: any) => setScheduledTime(e.target.value)}
                  />
                  <p className="text-[10px] font-bold text-blue-500 leading-relaxed">
                    Initial scheduled delivery is handled by Brevo, so emails do not wait for the cron batch.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!canSend}
                  className="w-full py-5 rounded-3xl font-black text-lg bg-black text-white hover:bg-blue-600 transition-all shadow-xl flex justify-center items-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="animate-spin" /> : <><Send size={20} /> {scheduledTime ? "Schedule via Brevo" : "Send Now"}</>}
                </button>
              </div>

              {sendStatus && (
                <div className="text-center text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex justify-center items-center gap-2">
                  <CheckCircle2 size={14} /> {sendStatus}
                </div>
              )}
            </form>
          </div>

          <div className="xl:col-span-3 space-y-5">
            <div className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-xl sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <Eye size={18} className="text-blue-600" /> Live Preview
                </h2>
                <span className="text-[9px] font-black text-gray-400 uppercase">Email View</span>
              </div>

              <div className="rounded-[28px] border border-gray-200 overflow-hidden bg-white">
                <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500"><b>From:</b> {activeSender ? `${activeSender.name} <${activeSender.email}>` : "No sender"}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>Reply-To:</b> {mainInboxEmail}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>To:</b> {email || "client@example.com"}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>Subject:</b> {subject || "Subject preview"}</p>
                </div>

                <div className="p-5 text-sm leading-[22px] text-gray-800">
                  {stripHtml(previewMessage) ? (
                    <div dangerouslySetInnerHTML={{ __html: previewBodyHtml }} />
                  ) : (
                    <p className="text-gray-400 italic">Write your email body to preview here...</p>
                  )}

                  {safeReportUrl && (
                    <div className="mt-4 mb-4">
                      <a
                        href={safeReportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold leading-4 text-gray-900 no-underline"
                      >
                        {reportButtonText || "View private tracking review"}
                      </a>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                        Private TrackFlow Pro audit note · PDF opens from the secure report page.
                      </p>
                    </div>
                  )}

                  {showPreviewClosing ? (
                    <p className="mt-3 mb-0 text-sm leading-[22px] text-gray-800">Best regards,</p>
                  ) : null}

                  {signatureVisible ? (
                    <div className="mt-0" dangerouslySetInnerHTML={{ __html: buildPreviewSignature(activeSender, "PREVIEW", signatureMode, signatureProfile) }} />
                  ) : (
                    <p className="mt-5 text-[10px] font-black text-gray-400 uppercase">Signature hidden</p>
                  )}
                </div>
              </div>

              <div className="mt-5 bg-gray-50 rounded-[28px] p-4 border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Quality Checklist</h3>
                <div className="space-y-2">
                  {qualityChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                      {item.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-orange-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[10px] text-gray-400 font-bold leading-relaxed">
                <FileText size={14} />
                Report link is optional. If empty, no extra HTML will be added to the email body.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
