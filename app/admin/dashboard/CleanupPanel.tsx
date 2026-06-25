"use client";

import React, { type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  CalendarDays,
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
  DailySendingStatsCleanupState,
  FootprintMemoryRow,
  FootprintMemoryState,
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
  dailySendingStatsCleanup: DailySendingStatsCleanupState;
  loadDailySendingStatsCleanup: (force?: boolean) => Promise<void>;
  deleteOldDailySendingStats: () => Promise<void>;
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
  allowSuppressionFootprint: (email: string) => Promise<void>;
  forgetFootprintMemory: (email: string) => Promise<void>;
  forgetOldFootprintMemories: () => Promise<void>;
  deleteOldSuppressionFootprints: () => Promise<void>;
  toggleFootprintMemorySelection: (email: string) => void;
  selectAllVisibleFootprintMemories: () => void;
  clearFootprintMemorySelection: () => void;
  allowSelectedFootprintMemories: () => Promise<void>;
  deleteSelectedFootprintMemories: () => Promise<void>;
};

const REPORT_CLEANUP_MODES: Array<{ id: ReportAssetCleanupMode; label: string; note: string }> = [
  {
    id: "hard",
    label: "Delete All Data",
    note: "Deletes the secure report, B2 PDF, B2 secure evidence screenshots, private B2 email preview thumbnail, preview image, chat history, Google Sheet row, and report-linked send/event data. No contact footprint memory is kept from this cleanup action.",
  },
  {
    id: "assets_only",
    label: "Remove Files Only",
    note: "Removes the B2 PDF, B2 secure evidence screenshots, private B2 email preview thumbnail, preview image, and chat history. The saved report, Sheet row, and contact record remain, while stale thumbnail references are cleared.",
  },
];

const SECURE_REPORT_FILTERS: Array<{ id: SecureReportFilter; label: string }> = [
  { id: "all", label: "All reports" },
  { id: "active", label: "Active" },
  { id: "viewed", label: "Viewed" },
  { id: "no_view", label: "No view" },
  { id: "expired", label: "Expired" },
  { id: "search_email", label: "Search / Email leads" },
  { id: "python_search", label: "Python search audits" },
  { id: "linkedin_manual", label: "LinkedIn / Manual reports" },
  { id: "manual_audit", label: "Manual audit only" },
  { id: "contacted", label: "Contacted" },
  { id: "not_contacted", label: "Not contacted" },
];

function formatSourceLabel(sourceKind?: string, source?: string) {
  if (sourceKind === "sheet") return "Sheet Lead";
  if (sourceKind === "test") return "Test Email";
  if (String(source || "").includes("google_sheet")) return "Sheet Lead";
  return "Cold Email";
}

function cleanupDateStartMillis(value?: string): number {
  const text = String(value || "").trim();
  if (!text) return 0;
  const ms = Date.parse(`${text}T00:00:00`);
  return Number.isFinite(ms) ? ms : 0;
}

function cleanupDateEndMillis(value?: string): number {
  const text = String(value || "").trim();
  if (!text) return 0;
  const ms = Date.parse(`${text}T23:59:59.999`);
  return Number.isFinite(ms) ? ms : 0;
}

function secureReportDateMillis(report: SecureReportRow): number {
  const candidates = [
    report.createdAt,
    report.updatedAt,
    report.lastActivityAt,
    report.lastSeenAt,
    report.sentAt,
    report.lastEngagedAt,
    report.lastOpenedAt,
    report.lastClickedAt,
    report.lastDownloadedAt,
    report.lastPdfDownloadedAt,
    report.lastPdfOpenedAt,
    report.lastVideoPlayClickedAt,
    report.lastVideoWatchedAt,
    report.lastChatboxOpenedAt,
    report.lastChatQuestionAt,
    report.lastCtaClickedAt,
    report.pdfExpiresAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const raw = value as any;
    const ms =
      typeof raw?.toMillis === "function"
        ? raw.toMillis()
        : typeof raw?.seconds === "number"
          ? raw.seconds * 1000
          : Date.parse(String(raw));
    if (Number.isFinite(ms) && ms > 0) return ms;
  }

  return 0;
}

function secureReportMatchesDateRange(report: SecureReportRow, dateFrom?: string, dateTo?: string): boolean {
  const fromMs = cleanupDateStartMillis(dateFrom);
  const toMs = cleanupDateEndMillis(dateTo);
  if (!fromMs && !toMs) return true;

  const reportMs = secureReportDateMillis(report);
  if (!reportMs) return false;
  if (fromMs && reportMs < fromMs) return false;
  if (toMs && reportMs > toMs) return false;
  return true;
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

  if (action.includes("secure_evidence")) return "Evidence screenshots";
  if (action.includes("email_preview")) return "Email preview image";
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

  if (action.includes("delete_secure_evidence")) return "Remove screenshots";
  if (action.includes("delete_email_preview")) return "Remove thumbnail";
  if (action.includes("clear_email_preview")) return "Clear image reference";
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
  return "Delete All Data — No Footprint";
}

function secureReportChannelLabel(channel?: SecureReportRow["channel"]): string {
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "email") return "Email";
  if (channel === "manual") return "Manual";
  return "Report";
}

function secureReportSourceGroup(report: SecureReportRow): "search_email" | "linkedin_manual" | "other" {
  const explicit = String(report.sourceGroup || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    explicit === "search_email" ||
    explicit === "search" ||
    explicit === "email" ||
    explicit === "sheet" ||
    explicit.includes("search_email") ||
    explicit.includes("email_lead") ||
    explicit.includes("sheet_lead")
  ) {
    return "search_email";
  }
  if (
    explicit === "linkedin_manual" ||
    explicit === "linkedin" ||
    explicit === "manual" ||
    explicit === "manual_report" ||
    explicit.includes("linkedin_manual") ||
    explicit.includes("manual_report") ||
    explicit.includes("linkedin_report")
  ) {
    return "linkedin_manual";
  }

  const source = String(report.source || "").toLowerCase();
  const sourceType = String(report.sourceType || "").toLowerCase();
  const outreachChannel = String(report.outreachChannel || "").toLowerCase();
  const leadSource = String(report.leadSource || "").toLowerCase();
  const auditSource = String(report.auditSource || "").toLowerCase();
  const sourceContext = String(report.sourceContext || "").toLowerCase();
  const sourceOrigin = String(report.sourceOrigin || "").toLowerCase();
  const sourceRole = String(report.sourceRole || "").toLowerCase();
  const sourceLabel = String(report.sourceLabel || "").toLowerCase();
  const sourceHaystack = [sourceType, outreachChannel, leadSource, auditSource, sourceContext, sourceOrigin, sourceRole, sourceLabel, source].join(" ");

  if (
    report.channel === "linkedin" ||
    outreachChannel.includes("linkedin") ||
    leadSource.includes("linkedin") ||
    auditSource.includes("linkedin") ||
    sourceType.includes("linkedin") ||
    sourceHaystack.includes("linkedin")
  ) {
    return "linkedin_manual";
  }

  if (
    report.channel === "manual" ||
    sourceOrigin === "manual" ||
    sourceType === "manual" ||
    sourceType.includes("manual_report") ||
    sourceType.includes("manual_audit") ||
    leadSource.includes("manual_report") ||
    leadSource.includes("manual_audit") ||
    auditSource.includes("manual_report") ||
    auditSource.includes("manual_audit") ||
    source.includes("manual_report") ||
    sourceRole.includes("manual_report") ||
    sourceHaystack.includes("manual_report") ||
    sourceHaystack.includes("manual report")
  ) {
    return "linkedin_manual";
  }

  const hasContactOrLeadLink = Boolean(report.email || report.leadId);

  if (
    report.channel === "email" ||
    sourceHaystack.includes("python_search") ||
    sourceHaystack.includes("google_search") ||
    sourceHaystack.includes("search") ||
    sourceHaystack.includes("sheet") ||
    report.keepUnderSheetAudit === true ||
    Number(report.sheetRowNumber || 0) > 0 ||
    outreachChannel.includes("email") ||
    outreachChannel.includes("gmail") ||
    sourceHaystack.includes("email") ||
    sourceHaystack.includes("gmail") ||
    sourceHaystack.includes("brevo") ||
    sourceHaystack.includes("cold") ||
    hasContactOrLeadLink
  ) {
    return "search_email";
  }

  return "other";
}

function secureReportSourceLabel(report: SecureReportRow): string {
  if (report.sourceLabel) return report.sourceLabel;
  const group = secureReportSourceGroup(report);
  if (group === "search_email") return "Search / Email";
  if (group === "linkedin_manual") return report.channel === "linkedin" ? "LinkedIn report" : "Manual report";
  return secureReportChannelLabel(report.channel);
}

function secureReportSourceTone(report: SecureReportRow): string {
  const group = secureReportSourceGroup(report);
  if (group === "search_email") return "bg-blue-50 text-blue-700 border-blue-100";
  if (group === "linkedin_manual") return "bg-violet-50 text-violet-700 border-violet-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function secureReportSourceNote(report: SecureReportRow): string {
  const group = secureReportSourceGroup(report);
  if (group === "search_email") return "Python/search audit sent by email";
  if (group === "linkedin_manual") return "Secure report URL shared manually/LinkedIn";
  return report.source || "Report source";
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
  if (report.ctaClicked || report.pdfDownloaded || report.videoWatched || report.chatQuestionAsked) return "High intent";
  if (report.videoPlayClicked || report.chatboxOpened || report.pdfOpened) return "Engaged";
  if (report.reportPageViewed) return "Viewed";
  if (isSecureReportExpired(report)) return "Expired";
  return "Active";
}

function secureReportStatusTone(report: SecureReportRow): string {
  const status = secureReportStatusLabel(report);
  if (status === "High intent") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "Engaged") return "bg-cyan-50 text-cyan-700 border-cyan-100";
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

function firstNonEmptyReportString(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function secureReportContactEmail(report: SecureReportRow): string {
  const email = firstNonEmptyReportString(
    report.contactEmail,
    report.contact_email,
    report.email,
    report.finalEmail,
    report.final_email,
    report.sheetFinalEmail,
    report.sheet_final_email,
  ).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function secureReportLinkedInUrl(report: SecureReportRow): string {
  const raw = firstNonEmptyReportString(
    report.linkedinProfileUrl,
    report.linkedin_profile_url,
    report.linkedinUrl,
    report.linkedin_url,
    report.linkedinCompanyUrl,
    report.linkedin_company_url,
    report.socialLink,
    report.social_link,
  );
  if (!raw || !/linkedin\.com/i.test(raw)) return "";
  return normalizeOptionalUrl(raw);
}

function secureReportContactActions(report: SecureReportRow): Array<{ key: string; label: string; href: string; title: string }> {
  const actions: Array<{ key: string; label: string; href: string; title: string }> = [];
  const email = secureReportContactEmail(report);
  const linkedInUrl = secureReportLinkedInUrl(report);

  if (email) {
    actions.push({
      key: "email",
      label: "Email",
      href: `mailto:${encodeURIComponent(email)}`,
      title: email,
    });
  }
  if (linkedInUrl) {
    actions.push({
      key: "linkedin",
      label: "LinkedIn",
      href: linkedInUrl,
      title: firstNonEmptyReportString(report.linkedinContactName, report.linkedin_contact_name, linkedInUrl),
    });
  }

  return actions;
}

function numberFromReport(...values: unknown[]): number {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
}

function secureReportActiveSeconds(report: SecureReportRow): number {
  // "Active" means the visitor's current/last visible+focused report session time.
  // estimatedActiveSeconds is kept as an aggregate/backward-compatible field, but it can
  // be inflated on older records if total duration was added repeatedly. Prefer the
  // session total fields when present.
  const sessionSeconds = numberFromReport(
    report.lastActiveSessionTotalSeconds,
    report.last_active_session_total_seconds,
    report.lastReportedActiveSeconds,
    report.last_reported_active_seconds,
  );
  if (sessionSeconds) return sessionSeconds;
  return numberFromReport(report.estimatedActiveSeconds, report.estimated_active_seconds);
}

function formatActiveSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (!total) return "No active time";
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (minutes <= 0) return `${remainder}s active`;
  if (!remainder) return `${minutes}m active`;
  return `${minutes}m ${remainder}s active`;
}

function formatDeviceSummary(report: SecureReportRow): { label: string; detail: string; full: string } {
  const device = String(report.lastVisitorDeviceType || report.visitorDeviceType || report.deviceType || "").trim();
  const browser = String(report.lastVisitorBrowser || report.visitorBrowser || report.browser || "").trim();
  const os = String(report.lastVisitorOs || report.visitorOs || report.os || "").trim();
  const label = device || "Unknown";
  const detail = [browser, os].filter(Boolean).join(" · ");
  const full = [label, detail].filter(Boolean).join(" · ");
  return { label, detail, full };
}

function formatCtaType(value?: string): string {
  const text = String(value || "").toLowerCase();
  if (text === "booking") return "Booking";
  if (text === "whatsapp") return "WhatsApp";
  if (text === "email" || text === "gmail") return "Email";
  if (text === "linkedin") return "LinkedIn";
  return "CTA";
}

function secureReportIntentScore(report: SecureReportRow): number {
  const explicit = Number(report.lastIntentScore || report.intentScore || 0);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(100, explicit);
  if (report.bookingClicked || report.lastCtaType === "booking") return 95;
  if (report.ctaClicked || report.whatsappClicked || report.emailClicked || report.gmailClicked || report.linkedinClicked) return 85;
  if (report.chatQuestionAsked || report.videoWatched) return 80;
  if (report.pdfDownloaded) return 75;
  if (report.videoPlayClicked || report.chatboxOpened) return 55;
  if (report.pdfOpened) return 45;
  if (secureReportActiveSeconds(report) >= 60) return 30;
  if (report.reportPageViewed) return 10;
  return 0;
}

function secureReportIntentLabel(report: SecureReportRow): string {
  const explicit = String(report.lastIntentLabel || report.intentLabel || "").toLowerCase();
  if (["hot", "high", "medium", "low"].includes(explicit)) return explicit.charAt(0).toUpperCase() + explicit.slice(1);
  const score = secureReportIntentScore(report);
  if (score >= 90) return "Hot";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  if (score > 0) return "Low";
  return "No intent";
}

function secureReportIntentTone(report: SecureReportRow): string {
  const label = secureReportIntentLabel(report).toLowerCase();
  if (label === "hot") return "bg-red-50 text-red-700 border-red-100";
  if (label === "high") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (label === "medium") return "bg-blue-50 text-blue-700 border-blue-100";
  if (label === "low") return "bg-slate-50 text-slate-600 border-slate-100";
  return "bg-gray-50 text-gray-500 border-gray-100";
}

function secureReportActivitySummary(report: SecureReportRow): string {
  const items: string[] = [];

  if (report.videoWatched) items.push(`Video watched ${report.videoWatchedThreshold || 60}%`);
  else if (report.videoPlayClicked) items.push("Video clicked");

  if (report.pdfDownloaded) items.push("PDF downloaded");
  else if (report.pdfOpened) items.push("PDF opened");

  if (report.chatQuestionAsked) items.push("Chat question asked");
  else if (report.chatboxOpened) items.push("Chatbox opened");

  if (report.ctaClicked || report.lastCtaType) items.push(`${formatCtaType(report.lastCtaType)} clicked`);
  if (!items.length && report.reportPageViewed) items.push("Page viewed");

  return items.length ? items.slice(0, 4).join(" · ") : "No view yet";
}

function secureReportActivityMeta(report: SecureReportRow): string {
  const details: string[] = [];
  const activeSeconds = secureReportActiveSeconds(report);
  if (activeSeconds) details.push(formatActiveSeconds(activeSeconds));
  if (report.lastVisitorCountry || report.visitorCountry) details.push(`Country: ${report.lastVisitorCountry || report.visitorCountry}`);
  const lastTime = report.lastSeenAt || report.lastActivityAt;
  if (lastTime) details.push(`Last: ${formatDate(lastTime)}`);
  return details.length ? details.join(" · ") : "No activity date";
}

function secureReportActivityPills(report: SecureReportRow): Array<{ label: string; active: boolean; tone: string }> {
  return [
    {
      label: report.videoWatched ? `Video ${report.videoWatchedThreshold || 60}%` : report.videoPlayClicked ? "Video clicked" : "Video",
      active: Boolean(report.videoWatched || report.videoPlayClicked),
      tone: report.videoWatched ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: report.pdfDownloaded ? "PDF downloaded" : report.pdfOpened ? "PDF opened" : "PDF",
      active: Boolean(report.pdfDownloaded || report.pdfOpened),
      tone: report.pdfDownloaded ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: report.chatQuestionAsked ? "Chat question" : report.chatboxOpened ? "Chatbox opened" : "Chat",
      active: Boolean(report.chatQuestionAsked || report.chatboxOpened),
      tone: report.chatQuestionAsked ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: report.ctaClicked || report.lastCtaType ? `${formatCtaType(report.lastCtaType)} click` : "CTA",
      active: Boolean(report.ctaClicked || report.lastCtaType),
      tone: report.bookingClicked || report.lastCtaType === "booking" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
  ];
}

function secureReportMatchesSourceFilter(report: SecureReportRow, filter: "search_email" | "python_search" | "linkedin_manual" | "manual_audit"): boolean {
  const group = secureReportSourceGroup(report);

  const text = [
    report.sourceGroup,
    report.sourceLabel,
    report.channel,
    report.source,
    report.sourceType,
    report.outreachChannel,
    report.leadSource,
    report.auditSource,
    report.sourceContext,
    report.sourceOrigin,
    report.sourceRole,
    report.companyName,
    report.domain,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const sourceTypeRaw = String(report.sourceType || "").toLowerCase().replace(/[\s-]+/g, "_");
  const sourceOriginRaw = String(report.sourceOrigin || "").toLowerCase().replace(/[\s-]+/g, "_");
  const isManual =
    report.channel === "manual" ||
    sourceTypeRaw === "manual" ||
    sourceOriginRaw === "manual" ||
    text.includes("manual_audit") ||
    text.includes("manual_report") ||
    text.includes("operator_manual") ||
    text.includes("direct_manual") ||
    text.includes("source_type_manual");

  const isLinkedIn =
    report.channel === "linkedin" ||
    text.includes("linkedin") ||
    text.includes("linked_in") ||
    text.includes("linkedin_manual") ||
    text.includes("linkedin_report");

  const isPythonSearch =
    text.includes("python_search") ||
    text.includes("python") ||
    text.includes("colab_direct") ||
    text.includes("colab") ||
    text.includes("search_result") ||
    text.includes("google_search") ||
    text.includes("website_search") ||
    text.includes("lead_source_python_search") ||
    text.includes("audit_source_python") ||
    text.includes("source_type_search");

  const isEmailOrSheet =
    report.channel === "email" ||
    text.includes("search_email") ||
    text.includes("email") ||
    text.includes("gmail") ||
    text.includes("brevo") ||
    text.includes("cold") ||
    text.includes("sheet") ||
    report.keepUnderSheetAudit === true ||
    Number(report.sheetRowNumber || 0) > 0 ||
    Boolean(report.email || report.leadId);

  if (filter === "manual_audit") return isManual;
  if (filter === "python_search") return isPythonSearch || (!isManual && !isLinkedIn && (group === "search_email" || isEmailOrSheet));
  if (filter === "linkedin_manual") return group === "linkedin_manual" || isLinkedIn || isManual;
  if (filter === "search_email") return group === "search_email" || isPythonSearch || (!isManual && !isLinkedIn && isEmailOrSheet);

  return true;
}

function secureReportMatchesFilter(report: SecureReportRow, filter: SecureReportFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return !isSecureReportCleaned(report) && !isSecureReportExpired(report);
  if (filter === "expired") return isSecureReportExpired(report);
  if (filter === "viewed") return Boolean(report.reportPageViewed || report.pdfOpened || report.pdfDownloaded || report.videoPlayClicked || report.videoWatched || report.chatboxOpened || report.chatQuestionAsked || report.ctaClicked);
  if (filter === "no_view") return !report.reportPageViewed && !report.pdfOpened && !report.pdfDownloaded && !report.videoPlayClicked && !report.videoWatched && !report.chatboxOpened && !report.chatQuestionAsked && !report.ctaClicked && !isSecureReportCleaned(report);
  if (filter === "contacted") return Boolean(report.contacted || report.sentAt || report.lastEngagedAt || Number(report.openCount || 0) || Number(report.clickCount || 0) || String(report.contactStatus || "").toLowerCase().includes("sent") || String(report.contactStatus || "").toLowerCase().includes("contacted"));
  if (filter === "not_contacted") return !secureReportMatchesFilter(report, "contacted");
  if (filter === "search_email") return secureReportMatchesSourceFilter(report, "search_email");
  if (filter === "python_search") return secureReportMatchesSourceFilter(report, "python_search");
  if (filter === "linkedin_manual") return secureReportMatchesSourceFilter(report, "linkedin_manual");
  if (filter === "manual_audit") return secureReportMatchesSourceFilter(report, "manual_audit");
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
    <div className="bg-white rounded-[24px] sm:rounded-[30px] border border-gray-100 p-4 sm:p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${toneClass} flex items-center justify-center mb-5`}>{icon}</div>
      <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter break-words">{value}</p>
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
  dailySendingStatsCleanup,
  loadDailySendingStatsCleanup,
  deleteOldDailySendingStats,
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
  allowSuppressionFootprint,
  forgetFootprintMemory,
  forgetOldFootprintMemories,
  deleteOldSuppressionFootprints,
  toggleFootprintMemorySelection,
  selectAllVisibleFootprintMemories,
  clearFootprintMemorySelection,
  allowSelectedFootprintMemories,
  deleteSelectedFootprintMemories,
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
  const filteredSecureReportsBeforeSlice = secureReports.rows
    .filter((report) => secureReportMatchesFilter(report, secureReports.filter))
    .filter((report) => secureReportMatchesSearch(report, secureReports.search))
    .filter((report) => secureReportMatchesDateRange(report, secureReports.dateFrom, secureReports.dateTo));
  const filteredSecureReports = filteredSecureReportsBeforeSlice.slice(0, 50);
  const selectedReportTokens = secureReports.selectedTokens || [];
  const selectedReportCount = selectedReportTokens.length;
  const allVisibleReportsSelected =
    filteredSecureReports.length > 0 && filteredSecureReports.every((report) => selectedReportTokens.includes(report.token));
  const secureReportFilterActive = Boolean(
    secureReports.search.trim() ||
      secureReports.filter !== "all" ||
      String(secureReports.dateFrom || "").trim() ||
      String(secureReports.dateTo || "").trim(),
  );
  const secureReportFilterSummary = secureReportFilterActive
    ? `${filteredSecureReportsBeforeSlice.length} matched from ${secureReports.rows.length} loaded`
    : `${secureReports.rows.length} loaded`;
  const bulkReportActionDisabled = Boolean(secureReports.bulkLoading || selectedReportCount === 0);
  const selectedReportActionLabel =
    reportAssetCleanup.mode === "assets_only" ? "Remove Files From Selected" : "Delete Selected — No Footprint";
  const footprintRows = footprintMemory.rows.slice(0, 100);
  const selectedFootprintEmails = footprintMemory.selectedEmails || [];
  const visibleFootprintEmails = footprintRows
    .map((row) => String(row.emailLower || row.email || "").trim().toLowerCase())
    .filter(Boolean);
  const allVisibleFootprintsSelected = visibleFootprintEmails.length > 0 && visibleFootprintEmails.every((email) => selectedFootprintEmails.includes(email));
  const blockedFootprintCount = footprintMemory.rows.filter(
    (row) => row.status !== "allowed_again" && row.source !== "suppression_list" && row.source !== "combined",
  ).length;
  const suppressionFootprintCount = footprintMemory.rows.filter((row) => row.source === "suppression_list" || row.source === "combined").length;
  const showingSuppressionFootprints = footprintMemory.filter === "suppression";
  const showingOldFootprints = footprintMemory.filter === "old";
  const dailyStatsDeleteDisabled = dailySendingStatsCleanup.loading || dailySendingStatsCleanup.actionLoading || dailySendingStatsCleanup.oldDocs <= 0;


  return (
    <div className="min-w-0 max-w-full space-y-6">
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
            onClick={() => loadDailySendingStatsCleanup(true)}
            disabled={dailySendingStatsCleanup.loading || dailySendingStatsCleanup.actionLoading}
            className="px-4 py-3 rounded-2xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
          >
            <Database size={14} /> Refresh Daily Stats
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label="Old daily stats" value={dailySendingStatsCleanup.oldDocs} icon={<Database size={22} />} tone="orange" />
        <StatCard label="Today stats" value={dailySendingStatsCleanup.todayDocs} icon={<CheckCircle2 size={22} />} tone="green" />
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

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px_160px_160px_auto] gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={secureReports.search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSecureReports((prev) => ({ ...prev, search: event.target.value, selectedTokens: [], bulkError: "", bulkStatus: "" }))}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") loadSecureReports(true);
                }}
                placeholder="Search by domain, company, email, or token"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200"
              />
            </div>
            <select
              value={secureReports.filter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setSecureReports((prev) => ({ ...prev, filter: event.target.value as SecureReportFilter, selectedTokens: [], bulkError: "", bulkStatus: "" }))}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-700 outline-none"
            >
              {SECURE_REPORT_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
            <label className="relative block">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={secureReports.dateFrom || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSecureReports((prev) => ({ ...prev, dateFrom: event.target.value, selectedTokens: [], bulkError: "", bulkStatus: "" }))}
                className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-700 outline-none"
                title="From date"
              />
            </label>
            <label className="relative block">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={secureReports.dateTo || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSecureReports((prev) => ({ ...prev, dateTo: event.target.value, selectedTokens: [], bulkError: "", bulkStatus: "" }))}
                className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-700 outline-none"
                title="To date"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSecureReports(true)}
                disabled={secureReports.loading}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase disabled:bg-gray-300 inline-flex items-center justify-center gap-2"
              >
                {secureReports.loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Apply
              </button>
              <button
                type="button"
                onClick={() =>
                  setSecureReports((prev) => ({
                    ...prev,
                    search: "",
                    filter: "all",
                    dateFrom: "",
                    dateTo: "",
                    selectedTokens: [],
                    bulkError: "",
                    bulkStatus: "",
                  }))
                }
                className="px-3 py-3 rounded-2xl bg-white border border-gray-100 text-gray-500 text-[10px] font-black uppercase"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-gray-100 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {secureReportFilterSummary}
              {filteredSecureReportsBeforeSlice.length > filteredSecureReports.length ? ` · showing first ${filteredSecureReports.length}` : ""}
            </p>
            <p className="text-[10px] font-bold text-gray-400">
              Date filter checks created/updated/activity timestamps. Use Refresh/Apply to request more rows from the server.
            </p>
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

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {secureReports.loading && !secureReports.rows.length ? (
              <div className="rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading saved secure reports...
              </div>
            ) : filteredSecureReports.length ? (
              filteredSecureReports.map((report, reportIndex) => {
                const bulkSelected = selectedReportTokens.includes(report.token);
                const selected = bulkSelected || secureReports.selectedToken === report.token || reportAssetCleanup.input.includes(report.token);
                const rowNumber = reportIndex + 1;
                const openReportUrl = report.reportUrl ? normalizeOptionalUrl(report.reportUrl) : "";
                const activeSeconds = secureReportActiveSeconds(report);
                const countryLabel = report.lastVisitorCountry || report.visitorCountry || "Unknown";
                const deviceSummary = formatDeviceSummary(report);
                const lastSeenAt = report.lastSeenAt || report.lastActivityAt;
                const lastSeenLabel = lastSeenAt ? formatDate(lastSeenAt) : "No visit yet";
                const expiryLabel = report.pdfExpiresAt ? formatDate(report.pdfExpiresAt) : "No expiry";
                const cleanupLabel = report.cleanupStatus || "Not cleaned";
                const activityPills = secureReportActivityPills(report);

                return (
                  <div
                    key={report.token}
                    className={`rounded-[28px] border p-4 bg-white shadow-sm grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1.15fr)_minmax(280px,1.45fr)_minmax(210px,0.85fr)_auto] gap-4 items-stretch transition ${selected ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100 hover:border-blue-100 hover:shadow-md"}`}
                  >
                    <label className="inline-flex items-start justify-start lg:justify-center pt-1">
                      <input
                        type="checkbox"
                        checked={bulkSelected}
                        onChange={() => toggleSecureReportSelection(report.token)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${report.companyName || report.domain || report.token}`}
                      />
                    </label>

                    <div className="min-w-0 flex flex-col justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 text-[10px] font-black text-white">
                            #{rowNumber}
                          </span>
                          <p className="min-w-0 flex-1 text-sm font-black text-gray-950 truncate">
                            {report.companyName || report.domain || "Untitled report"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${secureReportSourceTone(report)}`}>
                            {secureReportSourceLabel(report)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${secureReportStatusTone(report)}`}>
                            {secureReportStatusLabel(report)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${secureReportContactTone(report)}`}>
                            {secureReportContactLabel(report)}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-black text-gray-600 truncate">{report.domain || report.domainSlug || report.token}</p>
                        {secureReportContactActions(report).length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {secureReportContactActions(report).map((action) => (
                              <a
                                key={`${report.token}-${action.key}`}
                                href={action.href}
                                target={action.key === "linkedin" ? "_blank" : undefined}
                                rel={action.key === "linkedin" ? "noreferrer" : undefined}
                                title={action.title}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700 hover:bg-blue-100"
                              >
                                {action.label}
                                {action.key === "linkedin" ? <ExternalLink size={9} /> : null}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <p className="text-[10px] font-bold text-gray-400 leading-4 line-clamp-2">{secureReportSourceNote(report)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 min-w-0" title={secureReportActivityMeta(report)}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity & Contact</p>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${secureReportIntentTone(report)}`}>
                          {secureReportIntentLabel(report)} intent
                        </span>
                      </div>
                      <p className="text-xs font-black text-gray-800 mt-2 leading-5">
                        {secureReportActivitySummary(report)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {activityPills.map((pill) => (
                          <span
                            key={`${report.token}-${pill.label}`}
                            className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${pill.active ? pill.tone : "bg-white text-gray-300 border-gray-100"}`}
                          >
                            {pill.label}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 leading-4 line-clamp-2">{secureReportContactNote(report)}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visitor</p>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${secureReportIntentTone(report)}`}>
                          {secureReportIntentLabel(report)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-2 min-w-0">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Country</p>
                          <p className="text-[11px] font-black text-gray-800 break-words mt-1">{countryLabel}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-2 min-w-0" title={deviceSummary.full}>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Device</p>
                          <p className="text-[11px] font-black text-gray-800 break-words mt-1">{deviceSummary.label}</p>
                          {deviceSummary.detail && <p className="text-[9px] font-bold text-gray-400 break-words mt-0.5">{deviceSummary.detail}</p>}
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-2 min-w-0 col-span-2">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active</p>
                          <p className="text-[11px] font-black text-gray-800 break-words mt-1">{activeSeconds ? formatActiveSeconds(activeSeconds) : "No active time"}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-2 min-w-0 col-span-2">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Last seen</p>
                          <p className="text-[11px] font-black text-gray-800 break-words mt-1">{lastSeenLabel}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-2 min-w-0 col-span-2">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Expiry</p>
                          <p className="text-[11px] font-black text-gray-800 break-words mt-1">{expiryLabel}</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 break-words">{cleanupLabel}</p>
                    </div>

                    <div className="flex flex-wrap lg:flex-col lg:items-end lg:justify-center gap-2">
                      {openReportUrl && (
                        <a
                          href={openReportUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase inline-flex items-center justify-center gap-1"
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
                          View lead
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
                setReportAssetCleanup((prev) => {
                  const nextMode = event.target.value as ReportAssetCleanupMode;
                  return {
                    ...prev,
                    mode: nextMode,
                    leadMode: nextMode === "assets_only" ? "none" : "delete_no_memory",
                    confirmText: "",
                    error: "",
                    status: "",
                  };
                })
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
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact footprint</label>
            {reportAssetCleanup.mode === "assets_only" ? (
              <div className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-500">
                Contact unchanged
              </div>
            ) : (
              <div className="w-full px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-black text-red-700">
                No footprint kept
              </div>
            )}
          </div>

        </div>

        <div className={`rounded-2xl border p-4 text-[12px] font-bold leading-relaxed ${reportAssetCleanup.mode === "assets_only" ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-100 text-red-700"}`}>
          <span className="font-black">{activeReportMode.label}:</span> {activeReportMode.note}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-[12px] text-gray-600 font-semibold leading-relaxed">
          <span className="font-black text-gray-900">Footprint rule:</span>{" "}
          Report cleanup now uses <span className="font-black">No Footprint</span> by default. Delete All Data sends a no-memory cleanup request for report-linked contact data, so unused/test reports do not leave a contact footprint behind.
          Actual outreach contacts should be managed later from the Lead tab or Contact Control area.
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
              Type DELETE after preview. This removes the report, files, Sheet row, and report-linked contact footprint data.
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
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
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evidence screenshots</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.secureEvidenceAssetCount ?? manifest.secureEvidenceB2Keys?.length ?? 0} item(s)</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">B2 secure evidence assets</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email preview thumbnail</p>
              <p className="text-sm font-black text-gray-900 mt-1">{manifest.emailPreviewAssetCount ?? manifest.emailPreviewB2Keys?.length ?? 0} item(s)</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">Private B2 email-only asset</p>
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
                <div className="mt-3 max-w-full overflow-x-auto overscroll-x-contain touch-pan-x rounded-2xl bg-white border border-gray-100 p-3 text-left normal-case font-mono text-[10px] text-gray-500">
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

      <div className="bg-white border border-amber-100 rounded-[30px] p-5 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} /> Daily Sending Stats Cleanup
            </p>
            <h2 className="text-2xl font-black tracking-tighter text-gray-900">Delete old sender stats, keep today</h2>
            <p className="text-sm text-gray-500 font-semibold mt-2 max-w-3xl">
              This only cleans the <span className="font-black text-gray-800">daily_sending_stats</span> collection. Today's dateKey stays protected so sender limits do not reset accidentally.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDailySendingStatsCleanup(true)}
              disabled={dailySendingStatsCleanup.loading || dailySendingStatsCleanup.actionLoading}
              className="px-4 py-3 rounded-2xl bg-white border border-amber-100 text-amber-700 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
            >
              <RefreshCw size={14} className={dailySendingStatsCleanup.loading ? "animate-spin" : ""} /> Preview Stats
            </button>
            <button
              type="button"
              onClick={deleteOldDailySendingStats}
              disabled={dailyStatsDeleteDisabled}
              className="px-4 py-3 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
              title="Deletes only records where dateKey is before today."
            >
              {dailySendingStatsCleanup.actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete Old Stats, Keep Today
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total records</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{dailySendingStatsCleanup.totalDocs}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Today protected</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{dailySendingStatsCleanup.todayDocs}</p>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Old records</p>
            <p className="text-2xl font-black text-red-600 mt-1">{dailySendingStatsCleanup.oldDocs}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Previewed senders</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{dailySendingStatsCleanup.senderCount}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keep dateKey</p>
            <p className="text-sm font-black text-gray-900 mt-2">{dailySendingStatsCleanup.keepDateKey || "Today"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[12px] font-bold text-amber-800 leading-relaxed">
          Safety rule: delete query uses <span className="font-black">dateKey &lt; today</span>. It does not touch today's sender count, outreach leads, email events, report cleanup, B2, Supabase, or follow-up automation.
        </div>

        {(dailySendingStatsCleanup.status || dailySendingStatsCleanup.error) && (
          <p className={`text-[10px] font-black uppercase tracking-widest ${dailySendingStatsCleanup.error ? "text-red-600" : "text-gray-500"}`}>
            {dailySendingStatsCleanup.error || dailySendingStatsCleanup.status}
          </p>
        )}

        {dailySendingStatsCleanup.senderRows.length > 0 && (
          <div className="border border-gray-100 rounded-[24px] overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sender breakdown</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Shows today + the first preview sample of old stats. Old records are the ones that will be deleted.</p>
            </div>
            <div className="divide-y divide-gray-50">
              {dailySendingStatsCleanup.senderRows.slice(0, 12).map((row) => (
                <div key={row.senderEmail} className="p-4 grid grid-cols-1 md:grid-cols-[1.4fr_0.5fr_0.5fr_0.7fr] gap-3 items-center">
                  <div>
                    <p className="text-xs font-black text-gray-900 break-all">{row.senderEmail}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">{row.oldestDateKey || "—"} → {row.latestDateKey || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Old docs</p>
                    <p className="text-sm font-black text-red-600">{row.oldDocs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Today</p>
                    <p className="text-sm font-black text-emerald-700">{row.todayDocs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Sent count</p>
                    <p className="text-sm font-black text-gray-900">{row.totalSent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dailySendingStatsCleanup.sampleRows.length > 0 && (
          <details className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-gray-500">Show old records sample</summary>
            <div className="mt-4 max-h-72 overflow-auto divide-y divide-gray-100">
              {dailySendingStatsCleanup.sampleRows.slice(0, 50).map((row) => (
                <div key={row.id} className="py-3 grid grid-cols-1 md:grid-cols-[0.5fr_1.4fr_0.5fr_0.5fr] gap-2 text-xs font-bold text-gray-600">
                  <span className="font-black text-gray-900">{row.dateKey || "—"}</span>
                  <span className="break-all">{row.senderEmail || "global"}</span>
                  <span>Initial: {row.initialSent}</span>
                  <span>Follow-up: {row.followupSent}</span>
                </div>
              ))}
            </div>
          </details>
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
                    selectedEmails: [],
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
          Keep this simple: select one or many rows, then choose Allow selected or Delete selected. Allow selected removes the send block only. Delete selected removes contact-memory and linked Lead tab rows. Suppression/Unsubscribe only deletes after a strong confirmation.
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
                  <option value={30}>Older than 30 days</option>
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

        <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected footprint rows</p>
            <p className="text-sm font-black text-gray-900">{selectedFootprintEmails.length} selected</p>
            <p className="text-[11px] font-bold text-gray-500 mt-1">Allow selected removes the send block. Delete selected removes contact memory and permanently removes linked Lead tab rows; suppression rows are deleted only when selected and confirmed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={footprintMemory.loading || footprintMemory.actionLoading || !footprintRows.length}
              onClick={selectAllVisibleFootprintMemories}
              className="px-4 py-3 rounded-2xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase disabled:opacity-40"
            >
              {allVisibleFootprintsSelected ? "Unselect visible" : "Select visible"}
            </button>
            <button
              type="button"
              disabled={footprintMemory.actionLoading || !selectedFootprintEmails.length}
              onClick={allowSelectedFootprintMemories}
              className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Allow selected
            </button>
            <button
              type="button"
              disabled={footprintMemory.actionLoading || !selectedFootprintEmails.length}
              onClick={deleteSelectedFootprintMemories}
              className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Delete selected
            </button>
            <button
              type="button"
              disabled={footprintMemory.actionLoading || !selectedFootprintEmails.length}
              onClick={clearFootprintMemorySelection}
              className="px-4 py-3 rounded-2xl bg-gray-50 text-gray-400 text-[10px] font-black uppercase disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[35px] shadow-sm overflow-hidden">
        <div className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleFootprintsSelected}
                    onChange={selectAllVisibleFootprintMemories}
                    disabled={!footprintRows.length || footprintMemory.loading || footprintMemory.actionLoading}
                    className="h-4 w-4 rounded border-gray-300"
                    aria-label="Select all visible footprint rows"
                  />
                </th>
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
                  <td colSpan={6} className="p-10 text-center text-blue-600 font-black uppercase">
                    Loading footprint memories...
                  </td>
                </tr>
              )}

              {!footprintMemory.loading &&
                footprintRows.map((row: FootprintMemoryRow) => (
                  <tr key={`${row.emailLower || row.email}-${row.source || "memory"}`} className="hover:bg-gray-50/50">
                    <td className="p-4 align-top w-12">
                      <input
                        type="checkbox"
                        checked={selectedFootprintEmails.includes(String(row.emailLower || row.email || "").trim().toLowerCase())}
                        onChange={() => toggleFootprintMemorySelection(row.emailLower || row.email)}
                        disabled={footprintMemory.actionLoading}
                        className="h-4 w-4 rounded border-gray-300"
                        aria-label={`Select footprint row for ${row.email || row.emailLower}`}
                      />
                    </td>
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
                          row.status === "allowed_again" ? (
                            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                              Allowed
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={footprintMemory.actionLoading}
                              onClick={() => allowSuppressionFootprint(row.emailLower || row.email)}
                              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase disabled:opacity-40"
                              title="Allows non-hard suppression records such as replied/manual blocks. Unsubscribe, spam, and bounce records stay protected."
                            >
                              Allow protected
                            </button>
                          )
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
                        {row.source !== "suppression_list" && row.source !== "combined" ? (
                          <button
                            type="button"
                            disabled={footprintMemory.actionLoading}
                            onClick={() => forgetFootprintMemory(row.emailLower || row.email)}
                            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
                            title="Delete contact-memory footprint and linked Lead tab row(s) for this email."
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
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
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
