"use client";

import React, { type FormEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  ExternalLink,
  Flame,
  Globe,
  FileText,
  Eye,
  Layers,
  Link2,
  Type,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  MousePointer2,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Timer,
  Trash2,
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
import { AnimatePresence, motion } from "framer-motion";
import AdminGuard from "@/app/components/AdminGuard";
import Navbar from "@/app/components/navbar";
import { ACTIVE_SENDERS, MAIN_INBOX_EMAIL, BRAND_WEBSITE_LABEL, getColdEmailTemplateForService, applyColdEmailMergeTags, type SenderAccount } from "../../../lib/senders";
import { useLeadStore, type LeadSourceFilter, type LeadViewFilter } from "../../stores/useLeadStore";
import { useTrackflowDashboardStore } from "../../stores/useTrackflowDashboardStore";

import type {
  BulkLeadAction,
  ChatInsightsState,
  CleanupBucket,
  CleanupCandidate,
  CleanupState,
  ContactMemoryWarning,
  FootprintMemoryState,
  FirebaseUsageState,
  FollowupConfig,
  FollowupSummaryState,
  Lead,
  MainTab,
  ReportAssetCleanupState,
  ReportChatMessageRow,
  ReportChatSessionRow,
  SecureReportListState,
  SecureReportRow,
  ScheduledEditState,
  ServiceId,
  SheetLead,
  StepConfig,
  StepId,
  TriggerMode,
  Variant,
} from "./types";
import { OUTREACH_DRAFT_KEY, SERVICE_NAMES } from "./constants";
import {
  applyMergeTags,
  emailStatsDocId,
  formatDate,
  getRecentMonthOptions,
  isEmailPatternValid,
  makeNameFromEmail,
  monthKeyFromMillis,
  normalizeOptionalUrl,
  normalizeSheetEmailCopy,
  normalizeEmailSubjectForComposer,
  getSafeEmailSubjectForComposer,
  normalizeSheetService,
  sanitizePreviewHtml,
  stripHtml,
  toMillis,
  todayKeyDhaka,
} from "./utils";
import {
  getSheetReadiness,
  getSheetReportStatus,
  isSecureReportUrl,
  isSheetReportReady,
  sheetValue,
} from "./sheet-readiness";
import {
  getNextFollowUpStatus,
  isHotLead,
  isLeadEligibleForStep,
  leadScore,
  makeDefaultStep,
  mergeWithDefaultConfig,
} from "./followup-utils";
import { useScheduledEmails } from "./hooks/useScheduledEmails";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { useFollowupAdmin } from "./hooks/useFollowupAdmin";
import ScheduledPanel from "./ScheduledPanel";
import OverviewPanel from "./OverviewPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import CleanupPanel from "./CleanupPanel";
import AutomationPanel from "./AutomationPanel";
import SheetQueuePanel from "./SheetQueuePanel";
import OutreachPanel from "./OutreachPanel";
import LeadsPanel from "./LeadsPanel";
import ChatInsightsPanel from "./ChatInsightsPanel";

const MAILING_ADDRESS =
  process.env.NEXT_PUBLIC_TRACKFLOW_MAILING_ADDRESS ||
  process.env.NEXT_PUBLIC_BUSINESS_MAILING_ADDRESS ||
  "";

function emptyFirebaseUsageState(): FirebaseUsageState {
  return {
    loading: false,
    error: "",
    loadedAt: null,
    usage: {
      estimatedReadsToday: 0,
      estimatedWritesToday: 0,
      estimatedDeletesToday: 0,
      estimatedStorageMb: 0,
      readPercent: 0,
      writePercent: 0,
      deletePercent: 0,
      storagePercent: 0,
    },
    quota: {
      readsPerDay: 50000,
      writesPerDay: 20000,
      deletesPerDay: 20000,
      storageMb: 1024,
    },
    counts: {
      leadCount: 0,
      activeLeadCount: 0,
      archivedLeadCount: 0,
      trashedLeadCount: 0,
      emailEventCount: 0,
      suppressionCount: 0,
      initialSentToday: 0,
      followupSentToday: 0,
      eventsToday: 0,
    },
    note: "",
  };
}

function emptyReportAssetCleanupState(): ReportAssetCleanupState {
  return {
    input: "",
    mode: "hard",
    leadMode: "delete_no_memory",
    sheetMode: "delete",
    loading: false,
    error: "",
    status: "",
    dryRun: true,
    confirmText: "",
    jobId: "",
    failedCount: 0,
    lastPreviewAt: null,
    manifest: null,
    steps: [],
  };
}

function emptyFootprintMemoryState(): FootprintMemoryState {
  return {
    loading: false,
    actionLoading: false,
    error: "",
    status: "",
    loadedAt: null,
    search: "",
    filter: "blocked",
    olderThanDays: 90,
    selectedEmails: [],
    rows: [],
  };
}

function looksLikeReportUrl(value: string): boolean {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) || text.includes("/tracking-review/") || text.includes("/r/");
}

function emptySecureReportListState(): SecureReportListState {
  return {
    loading: false,
    error: "",
    status: "",
    loadedAt: null,
    search: "",
    filter: "all",
    selectedToken: "",
    selectedTokens: [],
    rows: [],
    bulkLoading: false,
    bulkError: "",
    bulkStatus: "",
    bulkRows: [],
    bulkFailedCount: 0,
    bulkCompletedCount: 0,
  };
}


function emptyChatInsightsState(): ChatInsightsState {
  return {
    loading: false,
    transcriptLoading: false,
    actionLoading: false,
    error: "",
    status: "",
    loadedAt: null,
    search: "",
    rows: [],
    selectedSession: null,
    messages: [],
  };
}


function buildPreviewSignature(sender?: SenderAccount, tag = "PREVIEW", mode: "full" | "compact" = "full") {
  if (!sender) return "";

  if (mode === "compact") {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:18px;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;padding:12px 0 0 0;border-top:1px solid #e5e7eb;">
            <div style="margin:0 0 2px 0;color:#111827;font-weight:bold;">${sender.name}</div>
            <div style="margin:0;color:#6b7280;">TrackFlowPro · Conversion Tracking Audit</div>
            <div style="margin:6px 0 0 0;color:#6b7280;font-size:11px;line-height:17px;">
              ${MAIN_INBOX_EMAIL} | ${BRAND_WEBSITE_LABEL} | Unsubscribe${MAILING_ADDRESS ? ` | ${MAILING_ADDRESS}` : ""}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:22px;max-width:560px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;padding:14px 0 0 0;border-top:1px solid #e5e7eb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="4" style="width:4px;background:#2563eb;font-size:0;line-height:0;">&nbsp;</td>
              <td style="padding:0 0 0 14px;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:15px;line-height:20px;font-weight:bold;color:#111827;margin:0;">${sender.name}</div>
                <div style="font-size:13px;line-height:19px;color:#4b5563;font-weight:bold;margin:0;">Founder, TrackFlowPro</div>
                <div style="font-size:12px;line-height:18px;color:#6b7280;margin:3px 0 0 0;">Google Ads Tracking · Server-Side Tracking · Conversion Audit</div>
                <div style="font-size:12px;line-height:18px;color:#374151;margin:8px 0 0 0;">${MAIN_INBOX_EMAIL} | ${BRAND_WEBSITE_LABEL}</div>
                <div style="font-size:10px;line-height:15px;color:#9ca3af;margin:8px 0 0 0;">Ref: ${tag} | Unsubscribe${MAILING_ADDRESS ? ` | ${MAILING_ADDRESS}` : ""}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}


type LeadRecentActivityItem = {
  key: string;
  label: string;
  note?: string;
  time: any;
  tone: "blue" | "green" | "slate" | "amber";
};

function hasTime(value: any) {
  return toMillis(value) > 0;
}

function formatLeadTime(value: any) {
  return hasTime(value) ? formatDate(value) : "Not recorded";
}

function friendlyFollowupReason(value: any) {
  const reason = String(value || "").trim();
  if (!reason) return "No follow-up reason recorded yet.";

  const map: Record<string, string> = {
    open_required: "Waiting for an open or click before the next follow-up.",
    waiting_for_engagement: "Waiting for new engagement before continuing.",
    replied: "Lead replied, so automation should stop.",
    bounced: "Email bounced, so automation is blocked.",
    unsubscribed: "Lead unsubscribed, so automation is blocked.",
    spam: "Lead marked spam, so automation is blocked.",
    archived_by_admin: "Lead was archived by admin.",
    deleted_by_admin: "Lead was moved to trash by admin.",
    manually_marked_replied: "Lead was manually marked as replied.",
  };

  return map[reason] || reason.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildRecentLeadActivity(lead: Lead | null): LeadRecentActivityItem[] {
  if (!lead) return [];

  const items: LeadRecentActivityItem[] = [];
  const push = (item: LeadRecentActivityItem) => {
    if (!hasTime(item.time)) return;
    items.push(item);
  };

  push({
    key: "last-click",
    label: "Last meaningful click",
    note: lead.lastClickedUrl || "Tracked link clicked",
    time: lead.lastClickedAt,
    tone: "green",
  });

  push({
    key: "last-open",
    label: "Last meaningful open",
    note: "Duplicate opens inside the dedupe window are ignored.",
    time: lead.lastOpenedAt,
    tone: "blue",
  });

  (lead.tracking_history || []).forEach((event, index) => {
    const eventName = String(event.event || "activity").toLowerCase();
    push({
      key: `history-${index}-${eventName}`,
      label: eventName === "opened" ? "Email opened" : eventName === "clicked" ? "Link clicked" : eventName.replace(/[_-]+/g, " "),
      note: event.link || event.step_tag || "",
      time: event.time,
      tone: eventName.includes("click") ? "green" : eventName.includes("open") ? "blue" : "slate",
    });
  });

  (lead.sent_messages || []).forEach((message, index) => {
    push({
      key: `sent-message-${index}-${message.step || 0}`,
      label: message.step ? `Follow-up ${message.step} sent` : "Email sent",
      note: message.subject || message.trackingTag || "",
      time: message.sentAt,
      tone: "slate",
    });
  });

  push({
    key: "sent-at",
    label: "Initial email sent",
    note: lead.subject || "",
    time: lead.sentAt || lead.createdAt,
    tone: "slate",
  });

  const seen = new Set<string>();
  return items
    .sort((a, b) => toMillis(b.time) - toMillis(a.time))
    .filter((item) => {
      const key = `${item.label}|${toMillis(item.time)}|${item.note || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function activityToneClass(tone: LeadRecentActivityItem["tone"]) {
  if (tone === "green") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (tone === "blue") return "bg-blue-50 text-blue-600 border-blue-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
}

type DashboardLeadSourceKind = "manual" | "manual_report_linked" | "sheet_primary" | "sheet_additional" | "test";

function getDashboardLeadSourceKind(lead: Lead): DashboardLeadSourceKind {
  const source = String(lead.source || "").toLowerCase();
  const sourceRole = String(lead.sourceRole || "").toLowerCase();
  const email = String(lead.emailLower || lead.email || "").toLowerCase();
  const keepUnderSheetAudit = lead.keepUnderSheetAudit === true;

  if (sourceRole === "test" || source.includes("test") || email.includes("test@") || email === MAIN_INBOX_EMAIL.toLowerCase()) return "test";
  if (sourceRole === "manual_report_linked") return "manual_report_linked";
  if (sourceRole === "sheet_primary") return "sheet_primary";
  if (sourceRole === "sheet_additional_recipient" || sourceRole === "sheet_additional") return "sheet_additional";
  if (keepUnderSheetAudit) {
    const sheetEmail = String(lead.sheetFinalEmail || lead.parentSheetEmail || "").trim().toLowerCase();
    return sheetEmail && sheetEmail !== email ? "sheet_additional" : "sheet_primary";
  }
  if (source.includes("google_sheet") && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (Number(lead.sheetRowNumber || 0) > 0 && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (lead.reportToken || lead.reportUrl) return "manual_report_linked";
  return "manual";
}

function doesLeadMatchSourceFilter(lead: Lead, filter: LeadSourceFilter): boolean {
  if (filter === "all") return true;
  const kind = getDashboardLeadSourceKind(lead);
  if (filter === "sheet") return kind === "sheet_primary" || kind === "sheet_additional";
  if (filter === "manual") return kind === "manual";
  return kind === filter;
}

function isManualDashboardLead(lead: Lead): boolean {
  const kind = getDashboardLeadSourceKind(lead);
  return kind === "manual" || kind === "manual_report_linked" || kind === "test";
}



function trackflowFrontendDebugLog(label: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  const localDebugEnabled = window.localStorage.getItem("TRACKFLOW_DEBUG_EMAIL_FLOW") === "true";
  const envDebugEnabled = process.env.NEXT_PUBLIC_TRACKFLOW_DEBUG_EMAIL_FLOW === "true";
  if (!localDebugEnabled && !envDebugEnabled) return;

  try {
    console.log(`[TRACKFLOW_EMAIL_DEBUG_UI] ${label}`, {
      at: new Date().toISOString(),
      label,
      ...payload,
    });
  } catch {
    console.log(`[TRACKFLOW_EMAIL_DEBUG_UI] ${label}`, payload);
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const {
    leads: cachedLeads,
    loading,
    loadingMore: loadingMoreLeads,
    error: leadCacheError,
    hasMore: hasMoreLeads,
    lastFetchedAt: leadsLastFetchedAt,
    fetchLatestLeads,
    refreshLeads,
    fetchMoreLeads,
    patchLeadInCache,
    patchLeadsInCache,
    removeLeadsFromCache,
  } = useLeadStore();
  const leads = cachedLeads as Lead[];
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followupCandidateLeads, setFollowupCandidateLeads] = useState<Lead[]>([]);
  const [followupCandidatesLoading, setFollowupCandidatesLoading] = useState(false);
  const [followupCandidatesStatus, setFollowupCandidatesStatus] = useState("");
  const [reportAssetCleanup, setReportAssetCleanup] = useState<ReportAssetCleanupState>(() => emptyReportAssetCleanupState());
  const [secureReports, setSecureReports] = useState<SecureReportListState>(() => emptySecureReportListState());
  const [chatInsights, setChatInsights] = useState<ChatInsightsState>(() => emptyChatInsightsState());
  const [footprintMemory, setFootprintMemory] = useState<FootprintMemoryState>(() => emptyFootprintMemoryState());
  const [leadSourceFilter, setLeadSourceFilter] = useState<LeadSourceFilter>("all");

  const {
    // Lead screen UI state kept in Zustand so filter/selection state survives tab switches.
    searchTerm,
    setSearchTerm,
    activeService,
    setActiveService,
    activeStep,
    setActiveStep,
    selectedMonth,
    setSelectedMonth,
    leadView,
    setLeadView,
    leadStatusFilter,
    setLeadStatusFilter,
    selectedLeadIds,
    setSelectedLeadIds,
    bulkActionLoading,
    setBulkActionLoading,
    bulkActionStatus,
    setBulkActionStatus,
    showAllLogs,
    setShowAllLogs,

    // Sheet cache state.
    sheetLeads,
    setSheetLeads,
    sheetLoading,
    setSheetLoading,
    sheetStatus,
    setSheetStatus,
    selectedSheetRows,
    setSelectedSheetRows,
    sheetLeadFilter,
    setSheetLeadFilter,
    sheetApprovalFilter,
    setSheetApprovalFilter,
    sheetSendFilter,
    setSheetSendFilter,
    sheetLoadedAt,
    setSheetLoadedAt,
    sheetCacheKey,
    setSheetCacheKey,
    updateSheetRowInCache,
    updateSheetRowsInCache,
    invalidateSheetCache,

    // Automation/follow-up state.
    followupConfig,
    setFollowupConfig,
    followupLoading,
    setFollowupLoading,
    followupSaving,
    setFollowupSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    activeFollowupService,
    setActiveFollowupService,
    activeFollowupStep,
    setActiveFollowupStep,
    dailyFollowupLimit,
    setDailyFollowupLimit,
    followupBatchPerRun,
    setFollowupBatchPerRun,
    triggerMode,
    setTriggerMode,
    showVariantLeads,
    setShowVariantLeads,
    dryRunLoading,
    setDryRunLoading,
    dryRunRows,
    setDryRunRows,
    dryRunStatus,
    setDryRunStatus,
    postmasterLoading,
    setPostmasterLoading,
    postmasterHealth,
    setPostmasterHealth,
    postmasterStatus,
    setPostmasterStatus,
    followupConfigLoadedAt,
    setFollowupConfigLoadedAt,

    // Scheduled + system cache state.
    scheduledEmails,
    setScheduledEmails,
    scheduledLoading,
    setScheduledLoading,
    scheduledStatus,
    setScheduledStatus,
    scheduledEdit,
    setScheduledEdit,
    scheduledSaving,
    setScheduledSaving,
    scheduledLoadedAt,
    setScheduledLoadedAt,
    followupSummary,
    setFollowupSummary,
    firebaseUsage,
    setFirebaseUsage,
    systemHealth,
    setSystemHealth,
    cleanupLoading,
    setCleanupLoading,
    leadCleanup,
    setLeadCleanup,
    selectedCleanupIds,
    setSelectedCleanupIds,
  } = useTrackflowDashboardStore();

  const [senderCounts, setSenderCounts] = useState<Record<string, number>>({});
  const [selectedSender, setSelectedSender] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceId | "">("");
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [reportUrl, setReportUrl] = useState("");
  const [reportButtonText, setReportButtonText] = useState("View short audit note");
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [allowDuplicateSend, setAllowDuplicateSend] = useState(false);
  const [contactMemoryWarning, setContactMemoryWarning] = useState<ContactMemoryWarning | null>(null);
  const [allowCooldownOverride, setAllowCooldownOverride] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState("");
  const [selectedOutreachSheetRow, setSelectedOutreachSheetRow] = useState<number | null>(null);
  const [leadRefreshLoading, setLeadRefreshLoading] = useState(false);
  const [leadRefreshStatus, setLeadRefreshStatus] = useState("");

  const monthOptions = useMemo(() => getRecentMonthOptions(18), []);

  const activeSender = ACTIVE_SENDERS.find((sender : any) => sender.id === selectedSender);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const wordCount = stripHtml(message).split(/\s+/).filter(Boolean).length;
  const bodyLinkCount = (message.match(/<a\s/gi) || []).length;
  const reportLinkCount = reportUrl.trim() ? 1 : 0;
  const totalLinkCount = bodyLinkCount + reportLinkCount;
  const selectedOutreachSheetLead = useMemo(() => {
    if (!selectedOutreachSheetRow) return null;
    return sheetLeads.find((lead) => Number(lead.rowNumber) === Number(selectedOutreachSheetRow)) || null;
  }, [selectedOutreachSheetRow, sheetLeads]);

  const selectedLeadRecentActivity = useMemo(
    () => buildRecentLeadActivity(selectedLead),
    [selectedLead],
  );

  const selectedLeadFollowupInfo = useMemo(() => {
    if (!selectedLead) {
      return {
        label: "No lead selected",
        time: "",
        color: "text-slate-500",
      };
    }

    const status = String(selectedLead.status || "").toLowerCase();
    const nextStatus = String(selectedLead.nextFollowupStatus || "").toLowerCase();
    const stopReason = String(selectedLead.nextFollowupReason || selectedLead.status || "").toLowerCase();
    const nextAt = selectedLead.nextFollowupAt;

    if (selectedLead.stopAutomation || ["replied", "bounced", "spam", "unsubscribed", "cancelled", "finished", "not_interested"].includes(status)) {
      return {
        label: "Automation stopped",
        time: friendlyFollowupReason(stopReason),
        color: "text-red-600",
      };
    }

    if (nextAt && hasTime(nextAt)) {
      return {
        label: selectedLead.nextFollowupStep ? `Follow-up ${selectedLead.nextFollowupStep} scheduled` : "Next follow-up scheduled",
        time: formatLeadTime(nextAt),
        color: "text-blue-600",
      };
    }

    if (nextStatus.includes("waiting") || nextStatus.includes("open") || nextStatus.includes("engagement")) {
      return {
        label: "Waiting for engagement",
        time: friendlyFollowupReason(selectedLead.nextFollowupReason || nextStatus),
        color: "text-amber-600",
      };
    }

    if (nextStatus.includes("blocked")) {
      return {
        label: "Follow-up blocked",
        time: friendlyFollowupReason(selectedLead.nextFollowupReason || nextStatus),
        color: "text-red-600",
      };
    }

    if (Number(selectedLead.open_count || 0) > 0 || Number(selectedLead.click_count || 0) > 0) {
      return {
        label: "Engaged lead",
        time: selectedLead.lastEngagedAt ? `Last activity: ${formatLeadTime(selectedLead.lastEngagedAt)}` : "",
        color: "text-emerald-600",
      };
    }

    if (status === "sent" || selectedLead.sentAt) {
      return {
        label: "Initial email sent",
        time: "Waiting for open or click before follow-up.",
        color: "text-slate-600",
      };
    }

    return {
      label: "No next follow-up scheduled",
      time: friendlyFollowupReason(selectedLead.nextFollowupReason),
      color: "text-slate-500",
    };
  }, [selectedLead]);

  const refreshLeadsSmooth = async (input?: { view: LeadViewFilter; month: string; status: string; source?: LeadSourceFilter }) => {
    setLeadRefreshLoading(true);
    setLeadRefreshStatus("Refreshing latest leads...");

    try {
      await refreshLeads(input);
      setLeadRefreshStatus("Latest leads refreshed without reloading the dashboard.");
    } catch (error: any) {
      const message = error?.message || "Lead refresh failed.";
      console.error("Smooth lead refresh error:", error);
      setLeadRefreshStatus(`Refresh failed: ${message}`);
      throw error;
    } finally {
      setLeadRefreshLoading(false);
    }
  };


  useEffect(() => {
    // FIREBASE FREE-LIMIT NOTE:
    // Lead data is cached in Zustand. Tab switching will not trigger a Firestore read.
    // Changing view/month/status intentionally reloads the current professional lead view.
    fetchLatestLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter }).catch((error) => console.error("Lead cache initial load error:", error));
    setSelectedLeadIds([]);
  }, [fetchLatestLeads, leadView, selectedMonth, leadStatusFilter, leadSourceFilter]);

  useEffect(() => {
    if (!selectedLead) return;

    const fresh = leads.find((lead) => lead.id === selectedLead.id);
    if (fresh) setSelectedLead(fresh);
  }, [leads, selectedLead?.id]);

  useEffect(() => {
    const updateMinTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      setMinDateTime(now.toISOString().slice(0, 16));
    };

    updateMinTime();
    const timer = window.setInterval(updateMinTime, 120000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedSender = window.localStorage.getItem("outreach_selected_sender");
    const savedService = window.localStorage.getItem("outreach_selected_service");

    if (savedService && SERVICE_NAMES.includes(savedService as ServiceId)) {
      setSelectedService(savedService as ServiceId);
    }

    const savedStillExists = ACTIVE_SENDERS.some((sender : any) => sender.id === savedSender);

    if (savedSender && savedStillExists) {
      setSelectedSender(savedSender);
    } else if (ACTIVE_SENDERS.length > 0) {
      setSelectedSender(ACTIVE_SENDERS[0].id);
      window.localStorage.setItem("outreach_selected_sender", ACTIVE_SENDERS[0].id);
    }
  }, []);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(OUTREACH_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);

        setEmail(String(draft.email || ""));
        setClientName(String(draft.clientName || ""));
        setCompanyName(String(draft.companyName || ""));
        setWebsite(String(draft.website || ""));
        setBusinessType(String(draft.businessType || ""));
        setSubject(String(draft.subject || ""));
        setMessage(String(draft.message || ""));
        setScheduledTime(String(draft.scheduledTime || ""));
        setReportUrl(String(draft.reportUrl || ""));
        setReportButtonText(String(draft.reportButtonText || "View short audit note"));
        setSelectedOutreachSheetRow(draft.selectedOutreachSheetRow ? Number(draft.selectedOutreachSheetRow) || null : null);
        setIncludeSignature(draft.includeSignature !== false);

        if (draft.selectedService && SERVICE_NAMES.includes(draft.selectedService as ServiceId)) {
          setSelectedService(draft.selectedService as ServiceId);
        }

        if (draft.selectedSender && ACTIVE_SENDERS.some((sender : any) => sender.id === draft.selectedSender)) {
          setSelectedSender(draft.selectedSender);
        }

        setSendStatus("Draft restored from this device.");
      }
    } catch (error) {
      console.error("Draft restore error:", error);
      window.localStorage.removeItem(OUTREACH_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;

    const hasDraftContent =
      Boolean(email.trim()) ||
      Boolean(clientName.trim()) ||
      Boolean(companyName.trim()) ||
      Boolean(website.trim()) ||
      Boolean(subject.trim()) ||
      Boolean(stripHtml(message)) ||
      Boolean(reportUrl.trim()) ||
      Boolean(scheduledTime);

    if (!hasDraftContent) {
      window.localStorage.removeItem(OUTREACH_DRAFT_KEY);
      setLastDraftSavedAt("");
      return;
    }

    const draftPayload = {
      email,
      clientName,
      companyName,
      website,
      businessType,
      subject,
      message,
      scheduledTime,
      selectedService,
      selectedSender,
      includeSignature,
      reportUrl,
      reportButtonText,
      selectedOutreachSheetRow,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(OUTREACH_DRAFT_KEY, JSON.stringify(draftPayload));
    setLastDraftSavedAt(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, [
    draftReady,
    email,
    clientName,
    companyName,
    website,
    businessType,
    subject,
    message,
    scheduledTime,
    selectedService,
    selectedSender,
    includeSignature,
    reportUrl,
    reportButtonText,
    selectedOutreachSheetRow,
  ]);

  useEffect(() => {
    const emailLower = String(email || "").trim().toLowerCase();

    setAllowDuplicateSend(false);
    setAllowCooldownOverride(false);
    setContactMemoryWarning(null);

    if (!isEmailPatternValid(emailLower)) {
      setDuplicateLead(null);
      setContactMemoryWarning(null);
      setCheckingDuplicate(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setCheckingDuplicate(true);

        const primaryQuery = query(
          collection(db, "outreach_leads"),
          where("emailLower", "==", emailLower),
          limit(1)
        );

        const primarySnap = await getDocs(primaryQuery);
        let foundLead: Lead | null = null;

        if (!primarySnap.empty) {
          const docSnap = primarySnap.docs[0];
          foundLead = { id: docSnap.id, ...(docSnap.data() as any) } as Lead;
        } else {
          const fallbackQuery = query(
            collection(db, "outreach_leads"),
            where("email", "==", emailLower),
            limit(1)
          );

          const fallbackSnap = await getDocs(fallbackQuery);

          if (!fallbackSnap.empty) {
            const docSnap = fallbackSnap.docs[0];
            foundLead = { id: docSnap.id, ...(docSnap.data() as any) } as Lead;
          }
        }

        let foundMemory: ContactMemoryWarning | null = null;
        const memorySnap = await getDoc(doc(db, "contact_memory", emailStatsDocId(emailLower)));

        if (memorySnap.exists()) {
          const memory = memorySnap.data() as any;
          const cooldownMs = toMillis(memory.cooldownUntil);
          const expiresMs = toMillis(memory.memoryExpiresAt);
          const lastContactedMs = toMillis(memory.lastContactedAt);
          const nowMs = Date.now();

          if (cooldownMs > nowMs && (!expiresMs || expiresMs > nowMs)) {
            foundMemory = {
              emailLower: memory.emailLower || emailLower,
              lastOutcome: memory.lastOutcome || "previous_contact",
              lastContactedAt: lastContactedMs ? new Date(lastContactedMs).toISOString() : "",
              cooldownUntil: cooldownMs ? new Date(cooldownMs).toISOString() : "",
              memoryExpiresAt: expiresMs ? new Date(expiresMs).toISOString() : "",
              companyName: memory.companyName || "",
              website: memory.website || "",
              service: memory.service || "",
              openCount: Number(memory.openCount || 0),
              clickCount: Number(memory.clickCount || 0),
              sourceLeadId: memory.sourceLeadId || "",
            };
          }
        }

        if (!cancelled) {
          setDuplicateLead(foundLead);
          setContactMemoryWarning(foundMemory);
        }
      } catch (error) {
        console.error("Duplicate/contact memory check error:", error);
        if (!cancelled) {
          setDuplicateLead(null);
          setContactMemoryWarning(null);
        }
      } finally {
        if (!cancelled) setCheckingDuplicate(false);
      }
    }, 550);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      const fallbackCounts: Record<string, number> = ACTIVE_SENDERS.reduce((acc: Record<string, number>, sender) => {
        acc[sender.email] = 0;
        return acc;
      }, {});

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          if (!cancelled) setSenderCounts((prev) => ({ ...fallbackCounts, ...prev }));
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/sender-stats", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Sender stats could not be loaded.");
        }

        const nextCounts: Record<string, number> = { ...fallbackCounts };
        if (data.counts && typeof data.counts === "object") {
          Object.entries(data.counts).forEach(([email, value]) => {
            nextCounts[String(email)] = Number(value || 0);
          });
        } else if (Array.isArray(data.rows)) {
          data.rows.forEach((row: any) => {
            if (row?.email) nextCounts[String(row.email)] = Number(row.initialSent || 0);
          });
        }

        if (!cancelled) setSenderCounts(nextCounts);
      } catch (error) {
        console.error("Sender count API error:", error);
        if (!cancelled) setSenderCounts((prev) => ({ ...fallbackCounts, ...prev }));
      }
    }

    fetchCounts().catch((err) => console.error("Sender count error:", err));

    return () => {
      cancelled = true;
    };
  }, [activeTab, sendStatus]);

  const loadFollowupConfig = async (force = false) => {
    if (!force && followupConfigLoadedAt) return;

    try {
      setFollowupLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch("/api/trackflow/automation/followups/config", {
        method: "GET",
        headers,
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Follow-up config load failed");

      const configData = data.config && typeof data.config === "object" ? data.config : {};
      setFollowupConfig(mergeWithDefaultConfig(configData));
      setDailyFollowupLimit(Number(data.dailyFollowupLimit || configData.daily_followup_limit || 50));
      setFollowupBatchPerRun(Math.max(1, Math.min(Number(data.batchPerRun || configData.followup_batch_per_run || 5), 20)));
      setTriggerMode("open_required");
      setFollowupConfigLoadedAt(Date.now());
      if (force) {
        setFollowupCandidatesStatus("Config refreshed. Firestore candidates will reload automatically.");
      }
    } catch (err) {
      console.error("Follow-up config load error:", err);
      window.alert("Follow-up config could not be loaded. Please check your admin login and server logs.");
    } finally {
      setFollowupLoading(false);
    }
  };

  useEffect(() => {
    loadFollowupConfig(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFollowupCandidates = async () => {
    try {
      setFollowupCandidatesLoading(true);
      setFollowupCandidatesStatus("Loading Firestore follow-up candidates...");

      const params = new URLSearchParams({
        service: activeFollowupService,
        step: activeFollowupStep,
        limit: "100",
        scanLimit: "500",
      });

      const response = await fetch(`/api/trackflow/automation/followups/candidates?${params.toString()}`, {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
      });

      const data = await readTrackflowJson(response);
      if (!response.ok || !data.success) throw new Error(data.error || "Follow-up candidates load failed");

      const rows = Array.isArray(data.rows) ? data.rows : [];
      setFollowupCandidateLeads(rows as Lead[]);
      setFollowupCandidatesStatus(`Loaded ${rows.length} Firestore follow-up candidate(s).`);
    } catch (error: any) {
      console.error("Follow-up candidates load error:", error);
      setFollowupCandidatesStatus(`Follow-up candidates failed: ${error.message || "Unknown error"}`);
      setFollowupCandidateLeads([]);
    } finally {
      setFollowupCandidatesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "automation") return;
    loadFollowupCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeFollowupService, activeFollowupStep]);


  const {
    loadScheduledEmails,
    openScheduledEditor,
    saveScheduledEdit,
    cancelScheduledEmail,
    sendScheduledSoon,
  } = useScheduledEmails({
    scheduledEmails,
    scheduledLoadedAt,
    scheduledEdit,
    setScheduledEmails,
    setScheduledLoadedAt,
    setScheduledStatus,
    setScheduledLoading,
    setScheduledEdit,
    setScheduledSaving,
  });

  useEffect(() => {
    if (activeTab === "scheduled") {
      // Always refresh when opening the Scheduled tab so Brevo-sent rows do not
      // remain visible from an old local cache.
      loadScheduledEmails(true);
    }
  }, [activeTab, sendStatus]);

  const {
    loadFollowupSummary,
    loadFollowupDryRun,
    loadPostmasterHealth,
  } = useFollowupAdmin({
    followupSummary,
    dailyFollowupLimit,
    followupBatchPerRun,
    setFollowupSummary,
    setDryRunLoading,
    setDryRunStatus,
    setDryRunRows,
    setPostmasterLoading,
    setPostmasterStatus,
    setPostmasterHealth,
  });

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "automation") {
      loadFollowupSummary(false).catch((error) => console.error("Follow-up summary load error:", error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const {
    loadFirebaseUsage,
    loadSystemHealth,
    runSystemCleanup,
  } = useSystemStatus({
    firebaseUsage,
    systemHealth,
    setFirebaseUsage,
    setSystemHealth,
    setCleanupLoading,
    refreshLeads,
    leadView,
    selectedMonth,
    leadStatusFilter,
  });

  const applyLeadBulkAction = async (action: BulkLeadAction, idsInput?: string[]) => {
    const ids = idsInput && idsInput.length ? idsInput : selectedLeadIds;
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");
    if (!ids.length) return window.alert("Select at least one lead first.");

    const selectedRows = leads.filter((lead) => ids.includes(lead.id));
    const manualRows = selectedRows.filter(isManualDashboardLead);
    const sheetRows = selectedRows.filter((lead) => {
      const kind = getDashboardLeadSourceKind(lead);
      return kind === "sheet_primary" || kind === "sheet_additional";
    });
    const finalIds = action === "delete_manual_keep_memory" || action === "delete_manual_no_footprint" ? manualRows.map((lead) => lead.id) : ids;

    if ((action === "delete_manual_keep_memory" || action === "delete_manual_no_footprint") && !finalIds.length) {
      window.alert("No manual/test leads selected. Sheet audit leads must be deleted from Report Cleanup.");
      return;
    }

    const labelMap: Record<BulkLeadAction, string> = {
      archive: `Hide ${ids.length} lead(s) from Active? History stays and automation stops.`,
      restore: `Show ${ids.length} lead(s) in Active again? Automation will not auto-resume automatically.`,
      trash: `Move ${ids.length} lead(s) to trash? Automation will stop for them.`,
      delete_permanent: `Permanently delete ${ids.length} lead(s)? Sheet audit leads will be skipped.`,
      delete_manual_keep_memory: `Delete ${finalIds.length} manual/test lead(s) and keep tiny contact memory?${sheetRows.length ? ` ${sheetRows.length} sheet audit lead(s) will be skipped.` : ""}`,
      delete_manual_no_footprint: `Delete ${finalIds.length} manual/test lead(s) with no footprint?${sheetRows.length ? ` ${sheetRows.length} sheet audit lead(s) will be skipped.` : ""} This cannot be undone.`,
    };

    if (!window.confirm(labelMap[action])) return;

    try {
      setBulkActionLoading(true);
      setBulkActionStatus("Applying lead action...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/leads/bulk-action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ids: finalIds }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Lead action failed");

      const completedIds = Array.isArray(data.deletedIds) && data.deletedIds.length ? data.deletedIds : finalIds;

      if (action === "delete_permanent" || action === "delete_manual_keep_memory" || action === "delete_manual_no_footprint") {
        removeLeadsFromCache(completedIds);
      } else if (action === "archive") {
        if (leadView === "all") {
          patchLeadsInCache(ids, { archived: true, deleted: false, stopAutomation: true, nextFollowupStatus: "blocked", nextFollowupReason: "archived_by_admin" });
        } else {
          removeLeadsFromCache(ids);
        }
      } else if (action === "trash") {
        if (leadView === "all") {
          patchLeadsInCache(ids, { archived: true, deleted: true, stopAutomation: true, nextFollowupStatus: "blocked", nextFollowupReason: "deleted_by_admin" });
        } else {
          removeLeadsFromCache(ids);
        }
      } else if (action === "restore") {
        if (leadView === "all") {
          patchLeadsInCache(ids, { archived: false, deleted: false, nextFollowupReason: "restored_by_admin_manual_review_required" });
        } else {
          removeLeadsFromCache(ids);
        }
      }

      setSelectedLeadIds([]);
      setSelectedLead((current) => (current && ids.includes(current.id) ? null : current));
      setBulkActionStatus(data.message || "Lead action completed.");
      await loadFirebaseUsage(true);
    } catch (error: any) {
      console.error("Lead bulk action error:", error);
      setBulkActionStatus(`Action failed: ${error.message || "Unknown error"}`);
      window.alert(error.message || "Lead action failed.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "analytics") {
      loadFirebaseUsage(false).catch((error) => console.error("Firebase usage load error:", error));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "automation") {
      loadSystemHealth(false).catch((error) => console.error("System health load error:", error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const analytics = useMemo(() => {
    const total = leads.length;
    const sent = leads.filter((lead) => ["sent", "opened", "clicked", "replied", "finished"].includes(String(lead.status || ""))).length;
    const opened = leads.filter((lead) => Number(lead.open_count || 0) > 0 || lead.status === "opened").length;
    const clicked = leads.filter((lead) => Number(lead.click_count || 0) > 0 || lead.status === "clicked").length;
    const replied = leads.filter((lead) => lead.status === "replied").length;
    const bounced = leads.filter((lead) => lead.status === "bounced").length;
    const unsubscribed = leads.filter((lead) => lead.status === "unsubscribed").length;
    const hot = leads.filter(isHotLead).length;

    return {
      total,
      sent,
      opened,
      clicked,
      replied,
      bounced,
      unsubscribed,
      hot,
      openRate: sent ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent ? Math.round((clicked / sent) * 100) : 0,
      replyRate: sent ? Math.round((replied / sent) * 100) : 0,
      bounceRate: sent ? Math.round((bounced / sent) * 100) : 0,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        String(lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(lead.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(lead.website || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService = activeService === "All" || lead.service === activeService;
      const matchesSource = doesLeadMatchSourceFilter(lead, leadSourceFilter);
      const matchesStep = activeStep === "All" || Number(lead.follow_up_count || 0) === activeStep;

      let matchesMonth = true;
      if (selectedMonth !== "All" && lead.createdAt) {
        matchesMonth = monthKeyFromMillis(lead.createdAt) === selectedMonth;
      }

      const matchesView =
        leadView === "all" ||
        (leadView === "active" && lead.archived !== true && lead.deleted !== true) ||
        (leadView === "archived" && lead.archived === true && lead.deleted !== true) ||
        (leadView === "trash" && lead.deleted === true);
      const matchesStatus = leadStatusFilter === "All" || String(lead.status || "") === leadStatusFilter;

      return matchesSearch && matchesService && matchesSource && matchesMonth && matchesStep && matchesView && matchesStatus;
    });
  }, [leads, searchTerm, activeService, leadSourceFilter, selectedMonth, activeStep, leadView, leadStatusFilter]);

  const sortedHotLeads = useMemo(() => {
    return [...leads].filter((lead) => leadScore(lead) > 0).sort((a, b) => leadScore(b) - leadScore(a)).slice(0, 8);
  }, [leads]);

  const currentStepData: StepConfig = followupConfig[activeFollowupService]?.[activeFollowupStep] || makeDefaultStep();
  const currentVariants: Variant[] = currentStepData.variants || [];
  const validCurrentVariants = currentVariants.filter((variant: Variant) => stripHtml(variant.content));
  const days = Math.max(1, Math.floor((currentStepData.delay || 1440) / 1440));

  const currentFollowupLeads = useMemo(() => {
    const byId = new Map<string, Lead>();

    followupCandidateLeads.forEach((lead) => {
      if (!lead?.id) return;
      byId.set(String(lead.id), lead);
    });

    leads
      .filter((lead) => isLeadEligibleForStep(lead, activeFollowupService, activeFollowupStep, triggerMode))
      .forEach((lead) => {
        if (!lead?.id || byId.has(String(lead.id))) return;
        byId.set(String(lead.id), lead);
      });

    return Array.from(byId.values()).sort((a, b) => leadScore(b) - leadScore(a));
  }, [followupCandidateLeads, leads, activeFollowupService, activeFollowupStep, triggerMode]);

  const updateCurrentStep = (newStepData: StepConfig) => {
    setFollowupConfig((prev: FollowupConfig) => ({
      ...prev,
      [activeFollowupService]: {
        ...(prev[activeFollowupService] || {}),
        [activeFollowupStep]: newStepData,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSenderChange = (senderId: string) => {
    setSelectedSender(senderId);
    window.localStorage.setItem("outreach_selected_sender", senderId);
  };

  const handleServiceChange = (service: ServiceId) => {
    setSelectedService(service);
    window.localStorage.setItem("outreach_selected_service", service);

    // Free-limit friendly: default cold email copy comes from code, not Firestore.
    // The admin can still edit the subject/body before sending.
    const template = getColdEmailTemplateForService(service);
    const mergeData = {
      name: clientName || "",
      company: companyName || "",
      website: website || "",
      service,
    };

    if (!subject.trim()) {
      setSubject(applyColdEmailMergeTags(template.subject, mergeData));
    }

    if (!stripHtml(message)) {
      setMessage(applyColdEmailMergeTags(template.body, mergeData));
    }

    if (!reportButtonText.trim()) {
      setReportButtonText(template.reportButtonText);
    }
  };

  const getCurrentEditorHtml = () => {
    const editor = editorRef.current?.querySelector('[contenteditable="true"]') as HTMLElement | null;
    return editor ? editor.innerHTML : message;
  };

  const syncEditorMessage = () => {
    const currentHtml = getCurrentEditorHtml();
    setMessage(currentHtml);
    return currentHtml;
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current?.querySelector('[contenteditable="true"]') as HTMLElement | null;

    if (!editor) {
      setMessage((prev) => `${prev}${html}`);
      return;
    }

    editor.focus();

    const selection = window.getSelection();
    const hasSelectionInsideEditor =
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editor.contains(selection.anchorNode);

    if (!hasSelectionInsideEditor || !selection) {
      editor.insertAdjacentHTML("beforeend", html);
      setMessage(editor.innerHTML);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const fragment = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;
    let node: ChildNode | null = null;

    while ((node = temp.firstChild)) {
      lastNode = fragment.appendChild(node);
    }

    range.insertNode(fragment);

    if (lastNode) {
      const newRange = range.cloneRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    setMessage(editor.innerHTML);
  };

  const insertMergeTag = (tag: "{name}" | "{company}" | "{website}" | "{service}") => {
    insertHtmlAtCursor(`<span>${tag}</span>`);
  };

  const addTextLink = () => {
    const linkText = window.prompt("Link text:", "View here");
    if (!linkText) return;

    const rawUrl = window.prompt("Enter URL:");
    const safeUrl = normalizeOptionalUrl(rawUrl || "");

    if (!safeUrl) {
      window.alert("Please enter a valid URL.");
      return;
    }

    insertHtmlAtCursor(
      `<a href="${safeUrl}" target="_blank" style="color:#2563eb;text-decoration:underline;font-weight:700;">${linkText}</a>`
    );
  };

  const resetOutreachForm = () => {
    setEmail("");
    setClientName("");
    setCompanyName("");
    setWebsite("");
    setBusinessType("");
    setSubject("");
    setMessage("");
    setScheduledTime("");
    setReportUrl("");
    setSelectedOutreachSheetRow(null);
    setEmailError("");
    setDuplicateLead(null);
    setAllowDuplicateSend(false);
    setContactMemoryWarning(null);
    setAllowCooldownOverride(false);
    setSelectedOutreachSheetRow(null);
    window.localStorage.removeItem(OUTREACH_DRAFT_KEY);
    setLastDraftSavedAt("");
  };

  const validateOutreachForm = (currentMessage = getCurrentEditorHtml()) => {
    if (!subject.trim()) {
      window.alert("Subject is required.");
      return false;
    }

    if (!stripHtml(currentMessage)) {
      window.alert("Message body cannot be empty!");
      return false;
    }

    if (!isEmailPatternValid(email)) {
      setEmailError("Please enter a valid email address!");
      return false;
    }

    if (!selectedService) {
      window.alert("Please select a service first!");
      return false;
    }

    if (!activeSender) {
      window.alert("Please select an active sender!");
      return false;
    }

    const messageLinkCount = (currentMessage.match(/<a\s/gi) || []).length + (reportUrl.trim() ? 1 : 0);
    if (messageLinkCount > 2) {
      window.alert("Too many links. Keep cold outreach to 1 message link + optional report link.");
      return false;
    }

    if (reportUrl.trim() && (!normalizeOptionalUrl(reportUrl) || !isSecureReportUrl(reportUrl))) {
      window.alert("Please use the secure TrackFlow report URL (/r/[token]), not a direct Drive/PDF/local URL.");
      return false;
    }

    if (duplicateLead && !allowDuplicateSend) {
      window.alert("This email already exists in your outreach list. Review the warning or enable Send Anyway.");
      return false;
    }

    if (contactMemoryWarning && !allowCooldownOverride) {
      window.alert("This email has a previous contact footprint and cooldown is still active. Review the warning or enable Cooldown Override.");
      return false;
    }

    return true;
  };

  const getSheetSubjectSafetyContext = (lead: SheetLead) => {
    const service = normalizeSheetService(sheetValue(lead, "Service Type"));
    return {
      email: sheetValue(lead, "Final Email"),
      name: sheetValue(lead, "Decision Maker"),
      company: sheetValue(lead, "Business Name"),
      website: sheetValue(lead, "Website URL"),
      service,
      mainIssue: sheetValue(lead, "Main Issue"),
      leadLabel: sheetValue(lead, "Lead Label") || sheetValue(lead, "Lead Status"),
    };
  };

  const handleSendEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentMessage = syncEditorMessage();
    const currentSubject = selectedOutreachSheetLead
      ? getSafeEmailSubjectForComposer(subject, getSheetSubjectSafetyContext(selectedOutreachSheetLead))
      : normalizeEmailSubjectForComposer(subject);
    if (currentSubject !== subject) setSubject(currentSubject);
    if (!validateOutreachForm(currentMessage) || !activeSender) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Admin login required. Please login again.");
      return;
    }

    setSending(true);
    setSendStatus(scheduledTime ? "Scheduling with Brevo..." : "Launching Campaign...");

    try {
      const token = await currentUser.getIdToken();
      const scheduledAtISO = scheduledTime ? new Date(scheduledTime).toISOString() : null;
      const sheetLeadForSend = selectedOutreachSheetLead;
      const sheetRowNumberForSend = sheetLeadForSend ? Number(sheetLeadForSend.rowNumber || 0) : 0;
      const sheetFinalEmailForSend = sheetLeadForSend ? sheetValue(sheetLeadForSend, "Final Email") : "";
      const sheetReportTokenForSend = sheetLeadForSend ? sheetValue(sheetLeadForSend, "Report Token") : "";
      const sourceRoleForSend = sheetLeadForSend || normalizeOptionalUrl(reportUrl) ? "manual_report_linked" : "manual";

      trackflowFrontendDebugLog("send_email_submit_pre_api", {
        scheduledAtISO,
        email,
        selectedService,
        selectedSender: activeSender.id,
        senderEmail: activeSender.email,
        sourceOrigin: "manual",
        sourceRoleForSend,
        sheetLeadForSend: Boolean(sheetLeadForSend),
        sheetRowNumberForSend,
        sheetFinalEmailForSend,
        hasReportUrl: Boolean(normalizeOptionalUrl(reportUrl)),
        reportUrl: normalizeOptionalUrl(reportUrl),
        reportToken: sheetReportTokenForSend || "",
        allowDuplicateSend,
        allowCooldownOverride,
      });

      if (sheetLeadForSend && sheetRowNumberForSend) {
        await patchSheetLead(sheetRowNumberForSend, {
          "Email Subject": currentSubject,
          "Email Body": currentMessage,
          "Approval Status": "Approved",
          "Send Status": scheduledAtISO ? "Scheduling" : "Sending",
          "Sender ID": activeSender.id,
          "Last Synced": new Date().toISOString(),
          Notes: scheduledAtISO
            ? "Opened from Sheet source and scheduling from composer. Sent lead will be managed independently in Firestore."
            : "Opened from Sheet source and sending from composer. Sent lead will be managed independently in Firestore.",
        });
      }

      const res = await fetch("/api/trackflow/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          subject: currentSubject,
          message: currentMessage,
          service: selectedService,
          clientName,
          companyName,
          website,
          businessType,
          scheduledAt: scheduledAtISO,
          includeSignature,
          signatureMode: "full",
          reportUrl: normalizeOptionalUrl(reportUrl),
          reportButtonText,
          allowDuplicateSend,
          allowCooldownOverride,
          senderId: activeSender.id,
          sourceOrigin: "manual",
          sourceRole: sourceRoleForSend,
          keepUnderSheetAudit: false,
          ...(sheetLeadForSend
            ? {
                reportToken: sheetReportTokenForSend,
                pdfFileId: sheetValue(sheetLeadForSend, "PDF File ID"),
                pdfViewUrl: sheetValue(sheetLeadForSend, "PDF View URL"),
                pdfDownloadUrl: sheetValue(sheetLeadForSend, "PDF Download URL"),
                pdfExpiresAt: sheetValue(sheetLeadForSend, "PDF Expires At"),
                sourceSheetRowNumber: sheetRowNumberForSend,
                sourceSheetEmail: sheetFinalEmailForSend,
                sourceSheetWebsiteUrl: sheetValue(sheetLeadForSend, "Website URL"),
                sourceReportToken: sheetReportTokenForSend,
                source: "manual_report_linked_from_sheet_composer",
              }
            : {}),
        }),
      });

      const data = await res.json();

      trackflowFrontendDebugLog("send_email_api_response", {
        ok: res.ok,
        status: res.status,
        scheduledAtISO,
        email,
        sourceRoleForSend,
        sheetLeadForSend: Boolean(sheetLeadForSend),
        leadId: data?.leadId || data?.id || "",
        trackingId: data?.trackingId || "",
        success: data?.success,
        scheduled: data?.scheduled,
        provider: data?.provider || "",
        messageId: data?.messageId || "",
        error: data?.error || "",
        responseKeys: data && typeof data === "object" ? Object.keys(data).sort() : [],
      });

      if (data.success) {
        if (sheetLeadForSend && sheetRowNumberForSend) {
          try {
            await patchSheetLead(sheetRowNumberForSend, {
              "Email Subject": currentSubject,
              "Email Body": currentMessage,
              "Approval Status": "Approved",
              "Send Status": scheduledAtISO ? "Scheduled" : "Sent",
              "Firestore Lead ID": data.leadId || "",
              "Tracking ID": data.trackingId || "",
              "Reply Status": "No Reply",
              "Open Count": "0",
              "Click Count": "0",
              "Sender ID": activeSender.id,
              "Last Synced": new Date().toISOString(),
              Notes: scheduledAtISO ? "Scheduled with Brevo from Send Email composer drawer. Delivery is provider-managed, not cron-batched." : "Sent from Send Email composer drawer.",
            });
          } catch (sheetError) {
            console.error("Sheet status update after send failed:", sheetError);
            setSendStatus("Email sent, but Sheet status update needs review.");
          }
        }
        const leadIdFromResponse = String(data.leadId || data.id || "").trim();
        const nowIso = new Date().toISOString();
        if (leadIdFromResponse) {
          trackflowFrontendDebugLog("send_email_patch_lead_cache_before", {
            leadId: leadIdFromResponse,
            email,
            scheduledAtISO,
            statusToPatch: scheduledAtISO ? "scheduled" : "sent",
            openCountToPatch: 0,
            clickCountToPatch: 0,
            sourceOrigin: "manual",
            sourceRoleForSend,
            sheetLeadForSend: Boolean(sheetLeadForSend),
          });

          patchLeadInCache(leadIdFromResponse, {
            id: leadIdFromResponse,
            email,
            emailLower: String(email || "").trim().toLowerCase(),
            name: clientName,
            company_name: companyName,
            website,
            business_type: businessType,
            service: selectedService,
            sender_id: activeSender.id,
            sender_email: activeSender.email,
            sender_name: activeSender.name,
            subject: currentSubject,
            message: currentMessage,
            status: scheduledAtISO ? "scheduled" : "sent",
            sentAt: scheduledAtISO ? undefined : nowIso,
            scheduledAt: scheduledAtISO || undefined,
            trackingId: data.trackingId || "",
            reportUrl: normalizeOptionalUrl(reportUrl),
            reportButtonText,
            reportToken: sheetLeadForSend ? sheetReportTokenForSend : undefined,
            sourceOrigin: "manual",
            sourceRole: sourceRoleForSend,
            keepUnderSheetAudit: false,
            sourceSheetRowNumber: sheetLeadForSend ? sheetRowNumberForSend || undefined : undefined,
            sourceSheetEmail: sheetLeadForSend ? sheetFinalEmailForSend : undefined,
            sourceSheetWebsiteUrl: sheetLeadForSend ? sheetValue(sheetLeadForSend, "Website URL") : undefined,
            sourceReportToken: sheetLeadForSend ? sheetReportTokenForSend : undefined,
            open_count: 0,
            click_count: 0,
          });
        }

        if (!scheduledAtISO && activeSender?.email) {
          setSenderCounts((prev) => ({
            ...prev,
            [activeSender.email]: Number(prev[activeSender.email] || 0) + 1,
          }));
        }

        setSendStatus(scheduledAtISO ? "Success! Email scheduled with Brevo." : "Success! Outreach Launched.");
        void loadFollowupSummary(true);
        resetOutreachForm();
      } else if (data.warningOnly && data.code === "cooldown_active") {
        if (sheetLeadForSend && sheetRowNumberForSend) {
          try {
            await patchSheetLead(sheetRowNumberForSend, {
              "Send Status": "Needs Review",
              "Last Synced": new Date().toISOString(),
              Notes: "Cooldown warning from Send Email composer drawer. Review the footprint before sending.",
            });
          } catch (sheetError) {
            console.error("Sheet cooldown status update failed:", sheetError);
          }
        }
        setContactMemoryWarning(data.contactMemory || null);
        setAllowCooldownOverride(false);
        setSendStatus("Cooldown warning: review and enable override if you still want to send.");
      } else {
        if (sheetLeadForSend && sheetRowNumberForSend) {
          try {
            await patchSheetLead(sheetRowNumberForSend, {
              "Send Status": "Failed",
              "Last Synced": new Date().toISOString(),
              Notes: data.error || "Send failed from Send Email composer drawer.",
            });
          } catch (sheetError) {
            console.error("Sheet failure status update failed:", sheetError);
          }
        }
        setSendStatus("Failed: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      console.error(error);
      if (selectedOutreachSheetLead?.rowNumber) {
        try {
          await patchSheetLead(Number(selectedOutreachSheetLead.rowNumber), {
            "Send Status": "Failed",
            "Last Synced": new Date().toISOString(),
            Notes: error instanceof Error ? error.message : "Network error from Send Email composer drawer.",
          });
        } catch (sheetError) {
          console.error("Sheet network failure status update failed:", sheetError);
        }
      }
      setSendStatus("Network Error. Check Console.");
    } finally {
      setSending(false);
    }
  };


  const getAuthHeaders = async () => {
    const currentUser = auth.currentUser;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const readTrackflowJson = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: response.ok ? "TrackFlow API returned an unreadable response." : text.slice(0, 500) || response.statusText,
      };
    }
  };


  const loadChatInsights = async (force = false) => {
    // Chat activity can arrive after the tab is already open, so only skip cached loads
    // when we already have rows. Empty states should be allowed to refresh.
    if (!force && chatInsights.loadedAt && chatInsights.rows.length > 0 && Date.now() - chatInsights.loadedAt < 60_000) return;

    setChatInsights((prev) => ({
      ...prev,
      loading: true,
      error: "",
      status: "Loading client chat conversations...",
    }));

    try {
      const params = new URLSearchParams({
        admin: "1",
        limit: "150",
      });

      if (chatInsights.search.trim()) {
        params.set("search", chatInsights.search.trim());
      }

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error("Admin login required. Please login again.");
      }

      const response = await fetch(`/api/trackflow/report-chat?${params.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data = await readTrackflowJson(response);
      const apiOk = response.ok && (data.success === true || data.ok === true);
      if (!apiOk) {
        throw new Error(data.message || data.error || "Client chats could not be loaded.");
      }

      const rows = Array.isArray(data.sessions)
        ? (data.sessions as ReportChatSessionRow[])
        : Array.isArray(data.rows)
          ? (data.rows as ReportChatSessionRow[])
          : [];

      setChatInsights((prev) => ({
        ...prev,
        rows,
        loading: false,
        loadedAt: Date.now(),
        status:
          data.loggingConfigured === false
            ? "Supabase chat logging is not configured for this environment. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            : rows.length
              ? `${rows.length} client chat conversation${rows.length === 1 ? "" : "s"} loaded.`
              : "No client chats found yet. Send a test message from a secure report, then click Refresh.",
        error: "",
      }));
    } catch (error: any) {
      setChatInsights((prev) => ({
        ...prev,
        loading: false,
        error: String(error?.message || error || "Client chats could not be loaded."),
        status: "",
      }));
    }
  };

  const openChatInsightSession = async (session: ReportChatSessionRow) => {
    setChatInsights((prev) => ({
      ...prev,
      selectedSession: session,
      transcriptLoading: true,
      messages: [],
      error: "",
      status: "",
    }));

    try {
      const params = new URLSearchParams({
        admin: "1",
        token: session.reportToken,
        sessionId: session.id,
      });

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error("Admin login required. Please login again.");
      }

      const response = await fetch(`/api/trackflow/report-chat?${params.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data = await readTrackflowJson(response);
      const apiOk = response.ok && (data.success === true || data.ok === true);
      if (!apiOk) {
        throw new Error(data.message || data.error || "Conversation transcript could not be loaded.");
      }

      const apiMessages = Array.isArray(data.messages) ? (data.messages as ReportChatMessageRow[]) : [];
      const latestSession = {
        ...session,
        ...(data.session && typeof data.session === "object" ? (data.session as ReportChatSessionRow) : {}),
        lastUserQuestion:
          String((data.session as ReportChatSessionRow | undefined)?.lastUserQuestion || "").trim() ||
          String(session.lastUserQuestion || "").trim(),
      } as ReportChatSessionRow;

      const fallbackQuestion = String(latestSession.lastUserQuestion || "").trim();
      const fallbackCreatedAt =
        latestSession.lastSeenAt ||
        latestSession.updatedAt ||
        latestSession.firstSeenAt ||
        session.lastSeenAt ||
        session.updatedAt ||
        session.firstSeenAt ||
        "";

      const messages: ReportChatMessageRow[] = apiMessages.length || !fallbackQuestion
        ? apiMessages
        : [
            {
              sessionId: latestSession.id || session.id,
              reportToken: latestSession.reportToken || session.reportToken,
              role: "user",
              content: fallbackQuestion,
              createdAt: fallbackCreatedAt,
            },
          ];

      setChatInsights((prev) => ({
        ...prev,
        selectedSession: latestSession,
        transcriptLoading: false,
        messages,
      }));
    } catch (error: any) {
      setChatInsights((prev) => ({
        ...prev,
        transcriptLoading: false,
        error: String(error?.message || error || "Conversation transcript could not be loaded."),
      }));
    }
  };

  const markChatSessionReviewed = async (session: ReportChatSessionRow) => {
    setChatInsights((prev) => ({
      ...prev,
      actionLoading: true,
      error: "",
      status: "",
    }));

    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error("Admin login required. Please login again.");
      }

      const response = await fetch("/api/trackflow/report-chat", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          adminAction: "mark_reviewed",
          token: session.reportToken,
          sessionId: session.id,
        }),
      });

      const data = await readTrackflowJson(response);
      const apiOk = response.ok && (data.success === true || data.ok === true);
      if (!apiOk) {
        throw new Error(data.message || data.error || "Conversation could not be marked as reviewed.");
      }

      const reviewedAt = String(data.reviewedAt || new Date().toISOString());

      setChatInsights((prev) => ({
        ...prev,
        actionLoading: false,
        status: "Conversation marked as reviewed.",
        rows: prev.rows.map((row) =>
          row.id === session.id && row.reportToken === session.reportToken ? { ...row, reviewedAt } : row,
        ),
        selectedSession:
          prev.selectedSession?.id === session.id && prev.selectedSession.reportToken === session.reportToken
            ? { ...prev.selectedSession, reviewedAt }
            : prev.selectedSession,
      }));
    } catch (error: any) {
      setChatInsights((prev) => ({
        ...prev,
        actionLoading: false,
        error: String(error?.message || error || "Conversation could not be marked as reviewed."),
      }));
    }
  };

  useEffect(() => {
    if (activeTab !== "chat-insights") return;

    let cancelled = false;

    const load = () => {
      if (cancelled) return;
      loadChatInsights(true).catch((error: any) => {
        console.error("Client chat insight load error:", error);
      });
    };

    load();
    const timer = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // Keep this effect tied only to tab changes. The refresh button and timer handle new messages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);



  const loadSecureReports = async (force = false) => {
    if (!force && secureReports.loadedAt && Date.now() - secureReports.loadedAt < 60_000) return;

    setSecureReports((prev) => ({ ...prev, loading: true, error: "", status: "Loading secure reports..." }));

    try {
      const params = new URLSearchParams({
        limit: "150",
        filter: secureReports.filter || "all",
      });

      if (secureReports.search.trim()) {
        params.set("search", secureReports.search.trim());
      }

      const response = await fetch(`/api/trackflow/cleanup/reports?${params.toString()}`, {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
      });

      const data = await readTrackflowJson(response);
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Secure reports could not be loaded.");
      }

      const rows = Array.isArray(data.rows) ? (data.rows as SecureReportRow[]) : [];

      setSecureReports((prev) => {
        const availableTokens = new Set(rows.map((row) => row.token));
        return {
          ...prev,
          loading: false,
          error: "",
          status: data.message || (rows.length ? `Loaded ${rows.length} secure report(s).` : "No secure reports found yet."),
          loadedAt: Date.now(),
          rows,
          selectedTokens: (prev.selectedTokens || []).filter((token) => availableTokens.has(token)),
        };
      });
    } catch (error: any) {
      console.error("Secure reports load error:", error);
      setSecureReports((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Secure reports could not be loaded.",
        status: "",
      }));
    }
  };

  const selectSecureReportForCleanup = (report: SecureReportRow) => {
    const input = report.reportUrl || report.token;
    setSecureReports((prev) => ({
      ...prev,
      selectedToken: report.token,
      selectedTokens: prev.selectedTokens?.includes(report.token) ? prev.selectedTokens : [...(prev.selectedTokens || []), report.token],
    }));
    setReportAssetCleanup((prev) => ({
      ...prev,
      input,
      error: "",
      status: `Selected ${report.domain || report.companyName || report.token}. Preview before running cleanup.`,
      dryRun: true,
      confirmText: "",
      jobId: "",
      failedCount: 0,
      manifest: null,
      steps: [],
    }));
  };

  const viewSecureReportLead = (report: SecureReportRow) => {
    const searchValue = String(report.email || report.leadId || report.domain || report.companyName || "").trim();
    if (searchValue) setSearchTerm(searchValue);
    setActiveService("All");
    setActiveStep("All");
    setSelectedMonth("All");
    setLeadStatusFilter("All");
    setLeadView("all" as LeadViewFilter);

    if (report.leadId) {
      const foundLead = leads.find((lead) => lead.id === report.leadId);
      if (foundLead) setSelectedLead(foundLead);
    }

    setActiveTab("leads");
  };

  const toggleSecureReportSelection = (token: string) => {
    const cleanToken = String(token || "").trim();
    if (!cleanToken) return;

    setSecureReports((prev) => {
      const selectedTokens = prev.selectedTokens || [];
      const nextSelectedTokens = selectedTokens.includes(cleanToken)
        ? selectedTokens.filter((item) => item !== cleanToken)
        : [...selectedTokens, cleanToken];

      return {
        ...prev,
        selectedTokens: nextSelectedTokens,
        selectedToken: nextSelectedTokens.length === 1 ? nextSelectedTokens[0] : prev.selectedToken,
        bulkError: "",
        bulkStatus: "",
      };
    });
  };

  const runBulkReportCleanup = async (dryRun = true) => {
    const tokens = Array.from(new Set((secureReports.selectedTokens || []).filter(Boolean)));

    if (!tokens.length) {
      window.alert("Select at least one secure report first.");
      return;
    }

    if (!dryRun && reportAssetCleanup.mode !== "assets_only" && reportAssetCleanup.confirmText.trim().toUpperCase() !== "DELETE") {
      window.alert("Type DELETE before deleting selected report data.");
      return;
    }

    if (!dryRun) {
      const actionName =
        reportAssetCleanup.mode === "assets_only"
          ? "Remove Files From Selected"
          : "Delete Selected — No Footprint";

      const contactModeNote =
        reportAssetCleanup.mode === "assets_only"
          ? ""
          : " No contact footprint memory will be kept by this cleanup action.";

      if (!window.confirm(`${actionName} will process ${tokens.length} selected report(s).${contactModeNote} Continue?`)) return;
    }

    setSecureReports((prev) => ({
      ...prev,
      bulkLoading: true,
      bulkError: "",
      bulkStatus: dryRun ? "Previewing selected reports..." : "Running selected cleanup action...",
      bulkRows: [],
      bulkFailedCount: 0,
      bulkCompletedCount: 0,
    }));

    try {
      const response = await fetch("/api/trackflow/cleanup/reports/bulk", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          tokens,
          mode: reportAssetCleanup.mode === "assets_only" ? "assets_only" : "hard",
          leadMode: reportAssetCleanup.mode === "assets_only" ? "none" : "delete_no_memory",
          sheetMode: reportAssetCleanup.mode === "assets_only" ? "skip" : "delete",
          dryRun,
          confirm: dryRun ? undefined : "DELETE",
        }),
      });

      const data = await readTrackflowJson(response);
      if (!response.ok && response.status !== 207) throw new Error(data.error || data.message || "Bulk report cleanup failed.");
      if (!data.success && response.status !== 207) throw new Error(data.error || data.message || "Bulk report cleanup failed.");

      const rows = Array.isArray(data.rows) ? data.rows : [];
      const failedCount = Number(data.failedCount || 0);
      const completedCount = Number(data.completedCount || 0);

      setSecureReports((prev) => ({
        ...prev,
        bulkLoading: false,
        bulkError: failedCount ? `${failedCount} selected report(s) need review.` : "",
        bulkStatus: data.message || (dryRun ? "Selected cleanup preview ready." : "Selected cleanup completed."),
        bulkRows: rows,
        bulkFailedCount: failedCount,
        bulkCompletedCount: completedCount,
      }));

      if (!dryRun) {
        await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
        await loadSecureReports(true);
        await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
      }
    } catch (error: any) {
      console.error("Bulk report cleanup error:", error);
      setSecureReports((prev) => ({
        ...prev,
        bulkLoading: false,
        bulkError: error?.message || "Bulk report cleanup failed.",
        bulkStatus: "",
      }));
    }
  };

  const buildReportCleanupQuery = () => {
    const input = reportAssetCleanup.input.trim();
    const params = new URLSearchParams({
      mode: reportAssetCleanup.mode === "assets_only" ? "assets_only" : "hard",
      leadMode: reportAssetCleanup.mode === "assets_only" ? "none" : "delete_no_memory",
      sheetMode: reportAssetCleanup.mode === "assets_only" ? "skip" : "delete",
    });

    if (looksLikeReportUrl(input)) params.set("reportUrl", input);
    else params.set("token", input);

    return params;
  };

  const previewReportAssetCleanup = async () => {
    const input = reportAssetCleanup.input.trim();
    if (!input) {
      window.alert("Paste a secure report URL or token first.");
      return;
    }

    setReportAssetCleanup((prev) => ({
      ...prev,
      loading: true,
      error: "",
      status: "Previewing what will happen...",
      dryRun: true,
      jobId: "",
      failedCount: 0,
    }));

    try {
      const params = buildReportCleanupQuery();
      const response = await fetch(`/api/trackflow/cleanup/report?${params.toString()}`, {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const data = await readTrackflowJson(response);
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Report cleanup preview failed");

      setReportAssetCleanup((prev) => ({
        ...prev,
        loading: false,
        error: "",
        status: "Preview ready. Review the summary before running an action.",
        dryRun: true,
        lastPreviewAt: Date.now(),
        manifest: data.manifest || null,
        steps: Array.isArray(data.steps) ? data.steps : [],
        jobId: "",
        failedCount: 0,
      }));
    } catch (error: any) {
      console.error("Report cleanup preview error:", error);
      setReportAssetCleanup((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Report cleanup preview failed.",
        status: "",
      }));
    }
  };

  const runReportAssetCleanup = async () => {
    const input = reportAssetCleanup.input.trim();
    if (!input) {
      window.alert("Paste a secure report URL or token first.");
      return;
    }

    if (reportAssetCleanup.mode !== "assets_only" && reportAssetCleanup.confirmText.trim().toUpperCase() !== "DELETE") {
      window.alert("Type DELETE before deleting report data.");
      return;
    }

    const contactModeNote =
      reportAssetCleanup.mode === "assets_only"
        ? ""
        : " No contact footprint memory will be kept by this cleanup action.";

    const confirmMessage =
      reportAssetCleanup.mode === "assets_only"
        ? "Remove Files Only will remove the PDF, preview image, and chat history but keep saved records. Continue?"
        : `Delete All Data will remove the secure report, files, Sheet row, and report-linked contact data.${contactModeNote} Continue?`;

    if (!window.confirm(confirmMessage)) return;

    setReportAssetCleanup((prev) => ({
      ...prev,
      loading: true,
      error: "",
      status: "Running selected cleanup action...",
      dryRun: false,
      jobId: "",
      failedCount: 0,
    }));

    try {
      const inputIsUrl = looksLikeReportUrl(input);
      const response = await fetch("/api/trackflow/cleanup/report", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          ...(inputIsUrl ? { reportUrl: input } : { token: input }),
          mode: reportAssetCleanup.mode === "assets_only" ? "assets_only" : "hard",
          leadMode: reportAssetCleanup.mode === "assets_only" ? "none" : "delete_no_memory",
          sheetMode: reportAssetCleanup.mode === "assets_only" ? "skip" : "delete",
          dryRun: false,
          confirm: "DELETE",
        }),
      });
      const data = await readTrackflowJson(response);
      if (!response.ok && response.status !== 207) throw new Error(data.error || data.message || "Report cleanup failed");
      if (!data.success && response.status !== 207) throw new Error(data.error || data.message || "Report cleanup failed");

      const failedCount = Number(data.failedCount || 0);
      setReportAssetCleanup((prev) => ({
        ...prev,
        loading: false,
        error: failedCount ? `${failedCount} item(s) need attention. Review the summary below.` : "",
        status: failedCount ? "Cleanup finished, but a few items need review." : "Cleanup completed successfully.",
        dryRun: false,
        lastPreviewAt: Date.now(),
        manifest: data.manifest || prev.manifest,
        steps: Array.isArray(data.steps) ? data.steps : [],
        jobId: String(data.jobId || ""),
        failedCount,
      }));

      await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
      await loadSecureReports(true);
      await loadSheetLeads(true);
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
    } catch (error: any) {
      console.error("Report cleanup run error:", error);
      setReportAssetCleanup((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Report cleanup failed.",
        status: "",
      }));
    }
  };

  const loadCleanupCandidates = async (bucket: CleanupBucket = leadCleanup.bucket as CleanupBucket, force = false) => {
    if (!force && leadCleanup.loadedAt && leadCleanup.bucket === bucket && Date.now() - leadCleanup.loadedAt < 60_000) return;

    setLeadCleanup((prev: CleanupState) => ({ ...prev, loading: true, error: "", status: "Loading cleanup candidates...", bucket }));
    setSelectedCleanupIds([]);

    try {
      const params = new URLSearchParams({ bucket, limit: "75" });
      const response = await fetch(`/api/trackflow/cleanup/candidates?${params.toString()}`, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cleanup candidates load failed");

      setLeadCleanup((prev: CleanupState) => ({
        ...prev,
        loading: false,
        error: "",
        status: `Loaded ${data.count || 0} cleanup candidate(s). Checked ${data.checked || 0}.`,
        loadedAt: Date.now(),
        rows: Array.isArray(data.rows) ? data.rows : [],
        policy: data.policy || null,
        bucket,
      }));
    } catch (error: any) {
      console.error("Cleanup candidates error:", error);
      setLeadCleanup((prev: CleanupState) => ({
        ...prev,
        loading: false,
        error: error?.message || "Cleanup candidates load failed",
        status: "",
        rows: [],
      }));
    }
  };

  const toggleCleanupCandidate = (leadId: string) => {
    setSelectedCleanupIds((prev: string[]) =>
      prev.includes(leadId) ? prev.filter((id: string) => id !== leadId) : [...prev, leadId]
    );
  };

  const runManualCleanupRefresh = async () => {
    setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: true, status: "Running manual cleanup check..." }));
    try {
      const response = await fetch("/api/trackflow/cleanup/manual-run", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ bucket: leadCleanup.bucket }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Manual cleanup check failed");
      await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
    } catch (error: any) {
      window.alert(error?.message || "Manual cleanup check failed.");
    } finally {
      setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: false }));
    }
  };

  const deleteSelectedCleanupWithMemory = async () => {
    if (selectedCleanupIds.length === 0) {
      window.alert("Select at least one cleanup candidate.");
      return;
    }

    const message = `This will save footprint memory, delete matching Sheet rows, and permanently delete ${selectedCleanupIds.length} Firebase lead(s). Continue?`;

    if (!window.confirm(message)) return;

    setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: true, status: "Deleting full data after saving footprint..." }));

    try {
      const response = await fetch("/api/trackflow/cleanup/delete-full-keep-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ids: selectedCleanupIds, sheetMode: "delete" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cleanup delete failed");

      const ok = Array.isArray(data.results) ? data.results.filter((item: any) => item.ok).length : data.deletedCount || 0;
      const failed = Array.isArray(data.results) ? data.results.filter((item: any) => !item.ok).length : 0;
      setLeadCleanup((prev: CleanupState) => ({ ...prev, status: `Deleted ${ok}. Failed/skipped ${failed}.` }));
      setSelectedCleanupIds([]);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
      await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
    } catch (error: any) {
      console.error("Cleanup delete error:", error);
      window.alert(error?.message || "Cleanup delete failed.");
    } finally {
      setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: false }));
    }
  };

  const skipSelectedCleanup = async (days = 30) => {
    if (selectedCleanupIds.length === 0) {
      window.alert("Select at least one cleanup candidate.");
      return;
    }

    setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: true, status: `Skipping selected for ${days} days...` }));

    try {
      const response = await fetch("/api/trackflow/cleanup/skip", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ids: selectedCleanupIds, days }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Skip failed");
      setSelectedCleanupIds([]);
      await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
    } catch (error: any) {
      window.alert(error?.message || "Skip failed.");
    } finally {
      setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: false }));
    }
  };

  const protectSelectedCleanup = async () => {
    if (selectedCleanupIds.length === 0) {
      window.alert("Select at least one cleanup candidate.");
      return;
    }

    if (!window.confirm("Protect selected lead(s) and stop automation?")) return;

    setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: true, status: "Protecting selected leads..." }));

    try {
      const response = await fetch("/api/trackflow/cleanup/protect", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ids: selectedCleanupIds, reason: "protected_from_cleanup_tab" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Protect failed");
      setSelectedCleanupIds([]);
      await loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true);
    } catch (error: any) {
      window.alert(error?.message || "Protect failed.");
    } finally {
      setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: false }));
    }
  };

  const loadFootprintMemories = async (force = false) => {
    if (!force && footprintMemory.loadedAt && Date.now() - footprintMemory.loadedAt < 60_000) return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, loading: true, error: "", status: "Loading footprint memories..." }));

    try {
      const params = new URLSearchParams({
        limit: "100",
        filter: footprintMemory.filter,
        olderThanDays: String(footprintMemory.olderThanDays || 90),
      });
      const searchText = footprintMemory.search.trim();
      if (searchText) params.set("q", searchText);

      const response = await fetch(`/api/trackflow/cleanup/footprint-memory?${params.toString()}`, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Footprint memory load failed");

      setFootprintMemory((prev: FootprintMemoryState) => ({
        ...prev,
        loading: false,
        error: "",
        status: `Loaded ${data.count || 0} footprint memor${Number(data.count || 0) === 1 ? "y" : "ies"}.`,
        loadedAt: Date.now(),
        rows: Array.isArray(data.rows) ? data.rows : [],
        selectedEmails: [],
      }));
    } catch (error: any) {
      console.error("Footprint memory load error:", error);
      setFootprintMemory((prev: FootprintMemoryState) => ({
        ...prev,
        loading: false,
        error: error?.message || "Footprint memory load failed",
        status: "",
        rows: [],
      }));
    }
  };

  const allowFootprintMemory = async (email: string) => {
    const emailText = String(email || "").trim();
    if (!emailText) return;
    const typed = window.prompt(`Type ALLOW to allow ${emailText} again.`);
    if (String(typed || "").trim().toUpperCase() !== "ALLOW") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: "Allowing email again...", error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "allow", emails: [emailText], confirm: "ALLOW" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Allow again failed");
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, status: data.message || "Email allowed again." }));
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Allow again failed", status: "" }));
    }
  };

  const allowSuppressionFootprint = async (email: string) => {
    const emailText = String(email || "").trim();
    if (!emailText) return;
    const typed = window.prompt(`Type ALLOW SUPPRESSION to allow the protected footprint for ${emailText}. Unsubscribe, spam, and bounce records will stay protected.`);
    if (String(typed || "").trim().toUpperCase() !== "ALLOW SUPPRESSION") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: "Allowing protected footprint...", error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "allow_suppression", emails: [emailText], confirm: "ALLOW SUPPRESSION" }),
      });
      const data = await response.json();
      if ((!response.ok && response.status !== 207) || !data.success) {
        throw new Error(data.error || data.message || "Allow protected footprint failed");
      }
      setFootprintMemory((prev: FootprintMemoryState) => ({
        ...prev,
        actionLoading: false,
        status: data.message || "Protected footprint allowed again.",
      }));
      await loadFootprintMemories(true);
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({
        ...prev,
        actionLoading: false,
        error: error?.message || "Allow protected footprint failed",
        status: "",
      }));
    }
  };

  const forgetFootprintMemory = async (email: string) => {
    const emailText = String(email || "").trim();
    if (!emailText) return;
    const typed = window.prompt(`Type FORGET to delete the footprint memory for ${emailText}.`);
    if (String(typed || "").trim().toUpperCase() !== "FORGET") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: "Forgetting footprint memory...", error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "forget", emails: [emailText], confirm: "FORGET" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Forget memory failed");
      const deletedLeadIds = Array.isArray(data.deletedLeadIds) ? data.deletedLeadIds.filter(Boolean) : [];
      if (deletedLeadIds.length) removeLeadsFromCache(deletedLeadIds);
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, status: data.message || "Footprint memory removed." }));
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
      await loadFirebaseUsage(true);
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Forget memory failed", status: "" }));
    }
  };

  const forgetOldFootprintMemories = async () => {
    const days = Math.max(1, Number(footprintMemory.olderThanDays || 90));
    const typed = window.prompt(`Type FORGET to delete footprint memories older than ${days} days.`);
    if (String(typed || "").trim().toUpperCase() !== "FORGET") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: `Forgetting memories older than ${days} days...`, error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "forget_older", olderThanDays: days, confirm: "FORGET" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Bulk forget failed");
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, status: data.message || `Forgot ${data.count || 0} old footprint memories.` }));
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
      await loadFirebaseUsage(true);
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Bulk forget failed", status: "" }));
    }
  };

  const deleteOldSuppressionFootprints = async () => {
    const days = Math.max(90, Number(footprintMemory.olderThanDays || 365));
    const typed = window.prompt(`Type DELETE SUPPRESSION to permanently delete protected suppression/unsubscribe/bounce/spam records older than ${days} days.`);
    if (String(typed || "").trim().toUpperCase() !== "DELETE SUPPRESSION") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: `Deleting protected suppression records older than ${days} days...`, error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "delete_suppression_older", olderThanDays: days, confirm: "DELETE SUPPRESSION" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Protected suppression cleanup failed");
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, status: data.message || `Deleted ${data.count || 0} protected suppression records.`, filter: "suppression" }));
      await loadFootprintMemories(true);
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Protected suppression cleanup failed", status: "" }));
    }
  };

  const loadSheetLeads = async (force = false) => {
    const cacheKey = `${sheetLeadFilter}|${sheetApprovalFilter}|${sheetSendFilter}`;
    if (!force && sheetLoadedAt && sheetCacheKey === cacheKey) {
      setSheetStatus(`Cached ${sheetLeads.length} Sheet lead(s). Use refresh to reload.`);
      return;
    }

    setSheetLoading(true);
    setSheetStatus("Loading Google Sheet leads...");

    try {
      const params = new URLSearchParams();
      params.set("limit", "300");
      // Sheet Leads should show every exported audit row, including LinkedIn/manual
      // audit rows that may not have a Final Email yet. The Send Email drawer keeps
      // its own hasEmail=true loader, so removing this filter here does not affect
      // email-only sending safety.
      if (sheetLeadFilter !== "All") params.set("leadStatus", sheetLeadFilter);
      if (sheetApprovalFilter !== "All") params.set("approvalStatus", sheetApprovalFilter);
      if (sheetSendFilter !== "All") params.set("sendStatus", sheetSendFilter);

      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      const response = await fetch(`/api/trackflow/sheets/leads?${params.toString()}`, {
        headers,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Sheet API did not return JSON. Status: ${response.status}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `Sheet lead loading failed. Status: ${response.status}`);
      }

      setSheetLeads(Array.isArray(data.leads) ? data.leads : []);
      setSelectedSheetRows([]);
      setSheetLoadedAt(Date.now());
      setSheetCacheKey(cacheKey);
      setSheetStatus(`Loaded ${data.count || 0} Sheet lead(s).`);
    } catch (error: any) {
      console.error("Sheet lead load error:", error);
      setSheetStatus(`Sheet load failed: ${error.message || "Unknown error"}`);
    } finally {
      setSheetLoading(false);
    }
  };

  const loadEmailDrawerSheetLeads = async (force = false) => {
    const cacheKey = "send_email_drawer_all";
    if (!force && sheetLoadedAt && sheetCacheKey === cacheKey && sheetLeads.length > 0) {
      setSheetStatus(`Cached ${sheetLeads.length} email drawer Sheet row(s). Use refresh to reload.`);
      return;
    }

    setSheetLoading(true);
    setSheetStatus("Loading email review queue from Google Sheet...");

    const fetchSheetRows = async (hasEmailFilter: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (hasEmailFilter) params.set("hasEmail", "true");

      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      const response = await fetch(`/api/trackflow/sheets/leads?${params.toString()}`, {
        headers,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Sheet API did not return JSON. Status: ${response.status}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `Sheet lead loading failed. Status: ${response.status}`);
      }

      return data;
    };

    try {
      let data = await fetchSheetRows(true);
      let rows = Array.isArray(data.leads) ? data.leads : [];

      // Some older Sheet rows may not pass the API-level hasEmail filter because their
      // email data was saved before the current header mapping. Fall back to a plain
      // Sheet load so the drawer can still show rows that the UI can validate locally.
      if (rows.length === 0 && Number(data.totalRows || 0) > 0) {
        data = await fetchSheetRows(false);
        rows = Array.isArray(data.leads) ? data.leads : [];
      }

      setSheetLeads(rows);
      setSelectedSheetRows([]);
      setSheetLoadedAt(Date.now());
      setSheetCacheKey(cacheKey);
      setSheetStatus(`Loaded ${rows.length} Sheet row(s) for Send Email review.`);
    } catch (error: any) {
      console.error("Send Email drawer Sheet load error:", error);
      setSheetStatus(`Send Email drawer load failed: ${error.message || "Unknown error"}`);
    } finally {
      setSheetLoading(false);
    }
  };

  const toggleFootprintMemorySelection = (email: string) => {
    const emailText = String(email || "").trim().toLowerCase();
    if (!emailText) return;
    setFootprintMemory((prev: FootprintMemoryState) => {
      const current = new Set(prev.selectedEmails || []);
      if (current.has(emailText)) current.delete(emailText);
      else current.add(emailText);
      return { ...prev, selectedEmails: Array.from(current) };
    });
  };

  const selectAllVisibleFootprintMemories = () => {
    setFootprintMemory((prev: FootprintMemoryState) => {
      const visibleEmails = (prev.rows || [])
        .slice(0, 100)
        .map((row) => String(row.emailLower || row.email || "").trim().toLowerCase())
        .filter(Boolean);
      const allSelected = visibleEmails.length > 0 && visibleEmails.every((email) => (prev.selectedEmails || []).includes(email));
      return { ...prev, selectedEmails: allSelected ? [] : Array.from(new Set(visibleEmails)) };
    });
  };

  const clearFootprintMemorySelection = () => {
    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, selectedEmails: [] }));
  };

  const allowSelectedFootprintMemories = async () => {
    const emails = Array.from(new Set((footprintMemory.selectedEmails || []).map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)));
    if (!emails.length) return window.alert("Select at least one footprint row first.");

    const hasSuppression = footprintMemory.rows.some(
      (row) => emails.includes(String(row.emailLower || row.email || "").trim().toLowerCase()) && (row.source === "suppression_list" || row.source === "combined"),
    );
    const confirmText = hasSuppression ? "ALLOW SUPPRESSION" : "ALLOW";
    const typed = window.prompt(
      hasSuppression
        ? `Type ${confirmText} to allow ${emails.length} selected email(s) again. Hard unsubscribe/spam/bounce records may remain protected unless you delete those protected records separately.`
        : `Type ${confirmText} to allow ${emails.length} selected email(s) again.`,
    );
    if (String(typed || "").trim().toUpperCase() !== confirmText) return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: "Allowing selected emails again...", error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: hasSuppression ? "allow_suppression" : "allow", emails, confirm: confirmText }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Allow selected failed");
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, selectedEmails: [], status: data.message || "Selected emails allowed again." }));
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Allow selected failed", status: "" }));
    }
  };

  const deleteSelectedFootprintMemories = async () => {
    const emails = Array.from(new Set((footprintMemory.selectedEmails || []).map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)));
    if (!emails.length) return window.alert("Select at least one footprint row first.");

    const hasSuppression = footprintMemory.rows.some(
      (row) => emails.includes(String(row.emailLower || row.email || "").trim().toLowerCase()) && (row.source === "suppression_list" || row.source === "combined"),
    );
    const typed = window.prompt(
      hasSuppression
        ? `Type DELETE SELECTED to permanently delete/ignore ${emails.length} selected footprint email(s), including protected suppression rows. Use this only for accidental/test/old records.`
        : `Type DELETE SELECTED to permanently delete/ignore ${emails.length} selected footprint email(s).`,
    );
    if (String(typed || "").trim().toUpperCase() !== "DELETE SELECTED") return;

    setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: true, status: "Deleting selected footprints...", error: "" }));
    try {
      const response = await fetch("/api/trackflow/cleanup/footprint-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action: "delete_selected", emails, includeSuppression: hasSuppression, confirm: "DELETE SELECTED" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Delete selected failed");
      const deletedLeadIds = Array.isArray(data.deletedLeadIds) ? data.deletedLeadIds.filter(Boolean) : [];
      if (deletedLeadIds.length) removeLeadsFromCache(deletedLeadIds);
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, selectedEmails: [], status: data.message || "Selected footprints deleted." }));
      await loadFootprintMemories(true);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter });
      await loadFirebaseUsage(true);
    } catch (error: any) {
      setFootprintMemory((prev: FootprintMemoryState) => ({ ...prev, actionLoading: false, error: error?.message || "Delete selected failed", status: "" }));
    }
  };


  useEffect(() => {
    if (activeTab === "sheet") {
      loadSheetLeads(false);
    }
    // The Send Email tab loads its drawer queue independently so Sheet tab filters
    // cannot accidentally hide ready email leads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sheetLeadFilter, sheetApprovalFilter, sheetSendFilter]);

  useEffect(() => {
    if (activeTab === "cleanup") {
      loadSecureReports(false);
      loadFootprintMemories(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, footprintMemory.filter, footprintMemory.olderThanDays]);

  const patchSheetLead = async (rowNumber: number, updates: Record<string, any>) => {
    const headers = await getAuthHeaders();

    const response = await fetch("/api/trackflow/sheets/leads", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        rowNumber,
        updates,
      }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Sheet update did not return JSON. Status: ${response.status}`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `Sheet update failed. Status: ${response.status}`);
    }

    updateSheetRowInCache(rowNumber, updates);
    invalidateSheetCache();
    return data;
  };

  const patchSheetLeadsBulk = async (items: Array<{ rowNumber: number; updates: Record<string, any> }>) => {
    const headers = await getAuthHeaders();

    const response = await fetch("/api/trackflow/sheets/leads", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ items }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Bulk Sheet update did not return JSON. Status: ${response.status}`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `Bulk Sheet update failed. Status: ${response.status}`);
    }

    updateSheetRowsInCache(items);
    invalidateSheetCache();
    return data;
  };

  const queueSheetLead = async (lead: SheetLead) => {
    if (!activeSender) throw new Error("Please select an active sender first.");

    const readiness = getSheetReadiness(lead);
    if (!readiness.ready) {
      throw new Error(`Row ${lead.rowNumber} is not ready for queue: ${readiness.note}.`);
    }

    await patchSheetLead(lead.rowNumber, {
      "Approval Status": "Approved",
      "Send Status": "Queued",
      "Sender ID": activeSender.id,
      "Queue Lock ID": "",
      "Queue Locked At": "",
      "Queue Attempt ID": "",
      "Attempt Count": "0",
      Notes: `Queued from dashboard at ${new Date().toLocaleString()}. Cron will send only after backend validation passes.`,
    });
  };

  const toggleSheetRow = (rowNumber: number) => {
    setSelectedSheetRows((prev: number[]) =>
      prev.includes(rowNumber) ? prev.filter((item: number) => item !== rowNumber) : [...prev, rowNumber]
    );
  };

  const toggleAllVisibleSheetRows = () => {
    const readyRows = sheetLeads
      .filter((lead) => getSheetReadiness(lead).ready)
      .map((lead) => Number(lead.rowNumber))
      .filter(Boolean);

    const allSelected = readyRows.length > 0 && readyRows.every((row) => selectedSheetRows.includes(row));

    setSelectedSheetRows(allSelected ? [] : readyRows);
  };

  const getSheetEmailCopyForComposer = (lead: SheetLead) => {
    const service = normalizeSheetService(sheetValue(lead, "Service Type"));
    return normalizeSheetEmailCopy(
      sheetValue(lead, "Email Subject"),
      sheetValue(lead, "Email Body"),
      getSheetSubjectSafetyContext(lead),
    );
  };

  const fillOutreachFromSheet = (lead: SheetLead) => {
    const service = normalizeSheetService(sheetValue(lead, "Service Type"));
    const readiness = getSheetReadiness(lead);
    const emailCopy = getSheetEmailCopyForComposer(lead);

    setSelectedOutreachSheetRow(Number(lead.rowNumber) || null);
    setAllowDuplicateSend(false);
    setAllowCooldownOverride(false);
    setEmail(sheetValue(lead, "Final Email"));
    setClientName(sheetValue(lead, "Decision Maker"));
    setCompanyName(sheetValue(lead, "Business Name"));
    setWebsite(sheetValue(lead, "Website URL"));
    setBusinessType(sheetValue(lead, "Lead Label") || sheetValue(lead, "Lead Status"));
    setSubject(emailCopy.subject);
    setMessage(emailCopy.bodyHtml);
    setSelectedService(service);
    setReportUrl(sheetValue(lead, "Report URL"));
    setReportButtonText("View short audit note");
    setSendStatus(
      readiness.ready
        ? `Loaded row ${lead.rowNumber}. Review the subject/body before sending.`
        : `Loaded row ${lead.rowNumber}, but do not send yet: ${readiness.note}.`
    );
    setActiveTab("outreach");
  };

  const sendSheetLead = async (lead: SheetLead) => {
    if (!activeSender) throw new Error("Please select an active sender first.");

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Admin login required. Please login again.");

    const readiness = getSheetReadiness(lead);
    if (!readiness.ready) {
      throw new Error(`Row ${lead.rowNumber} is not ready for direct send: ${readiness.note}.`);
    }

    const finalEmail = sheetValue(lead, "Final Email");
    const service = normalizeSheetService(sheetValue(lead, "Service Type"));
    const emailCopy = getSheetEmailCopyForComposer(lead);
    const subjectFromSheet = emailCopy.subject;
    const bodyFromSheet = emailCopy.bodyHtml;
    const reportFromSheet = normalizeOptionalUrl(sheetValue(lead, "Report URL"));

    await patchSheetLead(lead.rowNumber, {
      "Send Status": "Sending",
      Notes: `Locked by dashboard before direct send at ${new Date().toLocaleString()}`,
    });

    const token = await currentUser.getIdToken();

    const response = await fetch("/api/trackflow/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: finalEmail,
        subject: subjectFromSheet,
        message: bodyFromSheet,
        service,
        clientName: sheetValue(lead, "Decision Maker"),
        companyName: sheetValue(lead, "Business Name"),
        website: sheetValue(lead, "Website URL"),
        businessType: sheetValue(lead, "Lead Label") || sheetValue(lead, "Lead Status"),
        includeSignature: true,
        signatureMode: "full",
        reportUrl: reportFromSheet,
        reportButtonText: "View short audit note",
        reportToken: sheetValue(lead, "Report Token"),
        pdfFileId: sheetValue(lead, "PDF File ID"),
        pdfViewUrl: sheetValue(lead, "PDF View URL"),
        pdfDownloadUrl: sheetValue(lead, "PDF Download URL"),
        pdfExpiresAt: sheetValue(lead, "PDF Expires At"),
        sourceSheetRowNumber: lead.rowNumber,
        sourceSheetEmail: finalEmail,
        sourceSheetWebsiteUrl: sheetValue(lead, "Website URL"),
        sourceReportToken: sheetValue(lead, "Report Token"),
        source: "manual_report_linked_from_sheet_direct_send",
        sourceOrigin: "manual",
        sourceRole: "manual_report_linked",
        keepUnderSheetAudit: false,
        senderId: activeSender.id,
      }),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { success: false, error: `Send API did not return JSON. Status: ${response.status}` };
    }

    if (!response.ok || !data.success) {
      await patchSheetLead(lead.rowNumber, {
        "Send Status": "Failed",
        Notes: data.error || "Unknown sending error",
      });
      throw new Error(data.error || `Send failed for row ${lead.rowNumber}.`);
    }

    await patchSheetLead(lead.rowNumber, {
      "Approval Status": "Approved",
      "Send Status": data.scheduled ? "Scheduled" : "Sent",
      "Firestore Lead ID": data.leadId || "",
      "Tracking ID": data.trackingId || "",
      "Reply Status": "No Reply",
      "Open Count": "0",
      "Click Count": "0",
      Notes: data.scheduled ? "Scheduled from dashboard." : "Sent from dashboard.",
    });

    return data;
  };

  const sendSelectedSheetLeads = async () => {
    if (selectedSheetRows.length === 0) {
      window.alert("Please select at least one Sheet lead.");
      return;
    }

    if (!activeSender) {
      window.alert("Please select an active sender first.");
      return;
    }

    if (!window.confirm(`Queue ${selectedSheetRows.length} selected lead(s) for cron sending?`)) return;

    setSending(true);
    setSheetStatus(`Queueing ${selectedSheetRows.length} selected Sheet lead(s)...`);

    try {
      const items = selectedSheetRows
        .map((rowNumber) => {
          const lead = sheetLeads.find((item) => Number(item.rowNumber) === Number(rowNumber));
          if (!lead) return null;
          const readiness = getSheetReadiness(lead);
          if (!readiness.ready) return null;
          return {
            rowNumber,
            updates: {
              "Approval Status": "Approved",
              "Send Status": "Queued",
              "Sender ID": activeSender.id,
              "Queue Lock ID": "",
              "Queue Locked At": "",
              "Queue Attempt ID": "",
              "Attempt Count": "0",
              Notes: `Queued from dashboard at ${new Date().toLocaleString()}. Cron will send only after backend validation passes.`,
            },
          };
        })
        .filter(Boolean) as Array<{ rowNumber: number; updates: Record<string, any> }>;

      if (items.length === 0) {
        throw new Error("No selected rows are ready. Each row needs approval, valid email, subject, body, main issue, secure /r report URL, report token, PDF File ID, and PDF View/Download URL.");
      }

      await patchSheetLeadsBulk(items);
      setSheetStatus(`Queued ${items.length} verified report-ready lead(s). Cron /api/trackflow/cron/sheet-queued-sends will send them.`);
      setSelectedSheetRows([]);
      await loadSheetLeads(true);
    } catch (error: any) {
      console.error("Sheet queue error:", error);
      setSheetStatus(`Queue failed: ${error.message || "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };


  const syncSheetTrackingFromFirestore = async () => {
    setSheetLoading(true);
    setSheetStatus("Syncing tracking summary to Google Sheet...");

    try {
      let updated = 0;

      for (const sheetLead of sheetLeads) {
        const firestoreLeadId = sheetValue(sheetLead, "Firestore Lead ID");
        if (!firestoreLeadId) continue;

        const localLead = leads.find((lead) => lead.id === firestoreLeadId);
        if (!localLead) continue;

        await patchSheetLead(Number(sheetLead.rowNumber), {
          "Send Status": localLead.status || sheetValue(sheetLead, "Send Status") || "Sent",
          "Open Count": String(localLead.open_count || 0),
          "Click Count": String(localLead.click_count || 0),
          "Reply Status": localLead.status === "replied" ? "Replied" : sheetValue(sheetLead, "Reply Status") || "No Reply",
          Notes: `Tracking synced from Firestore. Status: ${localLead.status || "unknown"}`,
        });

        updated += 1;
      }

      setSheetStatus(`Tracking sync completed. Updated ${updated} row(s).`);
      await loadSheetLeads(true);
    } catch (error: any) {
      console.error("Sheet tracking sync error:", error);
      setSheetStatus(`Tracking sync failed: ${error.message || "Unknown error"}`);
    } finally {
      setSheetLoading(false);
    }
  };

  const canSend =
    !sending &&
    Boolean(activeSender) &&
    isEmailPatternValid(email) &&
    Boolean(selectedService) &&
    Boolean(subject.trim()) &&
    Boolean(stripHtml(message)) &&
    totalLinkCount <= 2 &&
    (!reportUrl.trim() || Boolean(normalizeOptionalUrl(reportUrl) && isSecureReportUrl(reportUrl))) &&
    (!duplicateLead || allowDuplicateSend) &&
    (!contactMemoryWarning || allowCooldownOverride);

  const handleMarkAsReplied = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();

    if (!window.confirm("Mark this lead as Replied and stop automation?")) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/trackflow/admin/leads/mark-replied", {
        method: "POST",
        headers,
        body: JSON.stringify({ leadId: id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Mark replied failed");

      patchLeadInCache(id, { status: "replied", stopAutomation: true, nextFollowupStatus: "blocked", nextFollowupReason: "manual_marked_replied" });
    } catch (error: any) {
      console.error("Mark replied error:", error);
      window.alert(error?.message || "Could not mark lead as replied.");
    }
  };

  const handleArchiveLead = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    await applyLeadBulkAction("archive", [id]);
  };

  const handleRestoreLead = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    await applyLeadBulkAction("restore", [id]);
  };

  const handleDelete = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    await applyLeadBulkAction("delete_manual_keep_memory", [id]);
  };

  const handlePermanentDeleteLead = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    await applyLeadBulkAction("delete_manual_no_footprint", [id]);
  };

  const addVariant = () => {
    updateCurrentStep({
      ...currentStepData,
      variants: [...currentVariants, { id: `V${Date.now()}`, content: "" }],
    });
  };

  const removeVariant = (variantId: string) => {
    const nextVariants = currentVariants.filter((variant: Variant) => variant.id !== variantId);

    updateCurrentStep({
      ...currentStepData,
      variants: nextVariants.length > 0 ? nextVariants : [{ id: "V1", content: "" }],
    });
  };

  const updateVariantContent = (variantId: string, content: string) => {
    updateCurrentStep({
      ...currentStepData,
      variants: currentVariants.map((variant: Variant) => (variant.id === variantId ? { ...variant, content } : variant)),
    });
  };

  const appendMergeTag = (variantId: string, tag: "{name}" | "{company}" | "{website}" | "{service}") => {
    updateCurrentStep({
      ...currentStepData,
      variants: currentVariants.map((variant: Variant) =>
        variant.id === variantId ? { ...variant, content: `${variant.content || ""} ${tag}` } : variant
      ),
    });
  };

  const saveFollowupSettings = async () => {
    const currentStepVariants = currentVariants.filter((variant: Variant) => stripHtml(variant.content));
    if (currentStepVariants.length === 0) return window.alert("Please add content to at least one variant.");

    setFollowupSaving(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/trackflow/automation/followups/config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          config: followupConfig,
          daily_followup_limit: Number(dailyFollowupLimit || 50),
          followup_batch_per_run: Math.max(1, Math.min(Number(followupBatchPerRun || 5), 20)),
          followup_trigger_mode: "open_required",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Follow-up settings save failed");
      if (data.config && typeof data.config === "object") {
        setFollowupConfig(mergeWithDefaultConfig(data.config));
      }

      let rescheduledCount = 0;
      let rescheduleChecked = 0;
      let rescheduleMessage = "";

      try {
        const rescheduleResponse = await fetch("/api/trackflow/automation/followups/reschedule", {
          method: "POST",
          headers,
          body: JSON.stringify({
            service: activeFollowupService,
            step: activeFollowupStep,
            updateMode: "recalculate_all",
          }),
        });
        const rescheduleData = await rescheduleResponse.json().catch(() => ({}));
        if (!rescheduleResponse.ok || !rescheduleData.success) {
          throw new Error(rescheduleData.error || "Follow-up reschedule failed");
        }
        rescheduledCount = Number(rescheduleData.updated || 0);
        rescheduleChecked = Number(rescheduleData.checked || 0);
        rescheduleMessage = ` Synced ${rescheduledCount} existing ${activeFollowupService} ${activeFollowupStep.toUpperCase()} lead schedule(s). Checked ${rescheduleChecked}.`;
      } catch (rescheduleError) {
        console.warn("Follow-up reschedule failed:", rescheduleError);
        rescheduleMessage = " Settings were saved, but existing scheduled leads could not be rescheduled automatically.";
      }

      try {
        const currentUser = auth.currentUser;
        const token = currentUser ? await currentUser.getIdToken() : "";
        if (token) {
          await fetch("/api/trackflow/automation/followups/release-template-blocked", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (releaseError) {
        console.warn("Template-blocked requeue failed:", releaseError);
      }

      setTriggerMode("open_required");
      setHasUnsavedChanges(false);
      await loadFollowupSummary(true);
      await loadFollowupCandidates().catch((candidateError: any) => console.warn("Follow-up candidate refresh failed:", candidateError));
      await refreshLeads().catch((refreshError: any) => console.warn("Lead refresh after follow-up save failed:", refreshError));
      window.alert(`✅ Follow-up settings saved.${rescheduleMessage}`);
    } catch (error) {
      console.error(error);
      window.alert("Error saving follow-up settings.");
    } finally {
      setFollowupSaving(false);
    }
  };

  const renderTopTabs = () => {
    const tabs: { id: MainTab; label: string; icon: ReactNode }[] = [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
      { id: "sheet", label: "Sheet Leads", icon: <FileText size={16} /> },
      { id: "outreach", label: "Send Email", icon: <Send size={16} /> },
      { id: "scheduled", label: "Scheduled", icon: <Clock size={16} /> },
      { id: "leads", label: "Leads", icon: <Mail size={16} /> },
      { id: "cleanup", label: "Cleanup", icon: <Trash2 size={16} /> },
      { id: "automation", label: "Automation", icon: <Settings2 size={16} /> },
      { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
      { id: "chat-insights", label: "Chat Insights", icon: <MessageSquare size={16} /> },
    ];

    return (
      <div className="flex gap-2 overflow-x-auto bg-white border border-gray-100 shadow-sm rounded-[28px] p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-black text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderSheetLeads = () => (
    <SheetQueuePanel
      sheetLeads={sheetLeads}
      sheetStatus={sheetStatus}
      sheetLeadFilter={sheetLeadFilter}
      sheetApprovalFilter={sheetApprovalFilter}
      sheetSendFilter={sheetSendFilter}
      sheetLoading={sheetLoading}
      selectedSheetRows={selectedSheetRows}
      sending={sending}
      activeSender={activeSender}
      hasCachedLeads={leads.length > 0}
      setSheetLeadFilter={setSheetLeadFilter}
      setSheetApprovalFilter={setSheetApprovalFilter}
      setSheetSendFilter={setSheetSendFilter}
      setSending={setSending}
      setSheetStatus={setSheetStatus}
      loadSheetLeads={loadSheetLeads}
      sendSelectedSheetLeads={sendSelectedSheetLeads}
      syncSheetTrackingFromFirestore={syncSheetTrackingFromFirestore}
      toggleAllVisibleSheetRows={toggleAllVisibleSheetRows}
      toggleSheetRow={toggleSheetRow}
      fillOutreachFromSheet={fillOutreachFromSheet}
      queueSheetLead={queueSheetLead}
    />
  );

  const renderOutreach = () => (
    <OutreachPanel
      activeSender={activeSender}
      senderCounts={senderCounts}
      selectedSender={selectedSender}
      email={email}
      setEmail={setEmail}
      clientName={clientName}
      setClientName={setClientName}
      companyName={companyName}
      setCompanyName={setCompanyName}
      website={website}
      setWebsite={setWebsite}
      subject={subject}
      setSubject={setSubject}
      message={message}
      setMessage={setMessage}
      scheduledTime={scheduledTime}
      setScheduledTime={setScheduledTime}
      selectedService={selectedService}
      emailError={emailError}
      setEmailError={setEmailError}
      sending={sending}
      sendStatus={sendStatus}
      includeSignature={includeSignature}
      setIncludeSignature={setIncludeSignature}
      reportUrl={reportUrl}
      setReportUrl={setReportUrl}
      reportButtonText={reportButtonText}
      setReportButtonText={setReportButtonText}
      duplicateLead={duplicateLead}
      checkingDuplicate={checkingDuplicate}
      allowDuplicateSend={allowDuplicateSend}
      setAllowDuplicateSend={setAllowDuplicateSend}
      contactMemoryWarning={contactMemoryWarning}
      allowCooldownOverride={allowCooldownOverride}
      setAllowCooldownOverride={setAllowCooldownOverride}
      lastDraftSavedAt={lastDraftSavedAt}
      minDateTime={minDateTime}
      editorRef={editorRef}
      wordCount={wordCount}
      totalLinkCount={totalLinkCount}
      canSend={canSend}
      mainInboxEmail={MAIN_INBOX_EMAIL}
      sheetLeads={sheetLeads}
      sheetLoading={sheetLoading}
      sheetStatus={sheetStatus}
      selectedOutreachSheetRow={selectedOutreachSheetRow}
      loadSheetLeads={loadEmailDrawerSheetLeads}
      fillOutreachFromSheet={fillOutreachFromSheet}
      handleSenderChange={handleSenderChange}
      handleServiceChange={handleServiceChange}
      insertMergeTag={insertMergeTag}
      addTextLink={addTextLink}
      resetOutreachForm={resetOutreachForm}
      handleSendEmail={handleSendEmail}
      buildPreviewSignature={buildPreviewSignature}
    />
  );


  const renderScheduledEmails = () => (
    <ScheduledPanel
      scheduledEmails={scheduledEmails as Lead[]}
      scheduledStatus={scheduledStatus}
      scheduledLoading={scheduledLoading}
      scheduledEdit={scheduledEdit}
      scheduledSaving={scheduledSaving}
      minDateTime={minDateTime}
      setScheduledEdit={setScheduledEdit}
      loadScheduledEmails={loadScheduledEmails}
      openScheduledEditor={openScheduledEditor}
      sendScheduledSoon={sendScheduledSoon}
      cancelScheduledEmail={cancelScheduledEmail}
      saveScheduledEdit={saveScheduledEdit}
    />
  );

  const renderLeads = () => (
    <LeadsPanel
      leads={leads}
      filteredLeads={filteredLeads}
      selectedLeadIds={selectedLeadIds}
      leadView={leadView}
      selectedMonth={selectedMonth}
      leadStatusFilter={leadStatusFilter}
      leadSourceFilter={leadSourceFilter}
      activeService={activeService}
      searchTerm={searchTerm}
      loading={leadRefreshLoading}
      refreshStatus={leadRefreshStatus}
      loadingMoreLeads={loadingMoreLeads}
      hasMoreLeads={hasMoreLeads}
      monthOptions={monthOptions}
      bulkActionLoading={bulkActionLoading}
      bulkActionStatus={bulkActionStatus}
      setLeadView={setLeadView}
      setSelectedMonth={setSelectedMonth}
      setLeadStatusFilter={setLeadStatusFilter}
      setLeadSourceFilter={setLeadSourceFilter}
      setActiveService={setActiveService}
      setSearchTerm={setSearchTerm}
      setSelectedLeadIds={setSelectedLeadIds}
      setSelectedLead={setSelectedLead}
      refreshLeads={refreshLeadsSmooth}
      fetchMoreLeads={fetchMoreLeads}
      applyLeadBulkAction={applyLeadBulkAction}
      handleMarkAsReplied={handleMarkAsReplied}
      handleArchiveLead={handleArchiveLead}
      handleRestoreLead={handleRestoreLead}
      handleDelete={handleDelete}
      handlePermanentDeleteLead={handlePermanentDeleteLead}
    />
  );

  const followupPanelStatus = followupCandidatesLoading
    ? "Loading Firestore follow-up candidates..."
    : followupCandidatesStatus
      ? `${dryRunStatus || "Automation ready."} · ${followupCandidatesStatus}`
      : dryRunStatus;

  const renderFollowups = () => (
    <AutomationPanel
      activeFollowupService={activeFollowupService}
      activeFollowupStep={activeFollowupStep}
      followupLoading={followupLoading}
      days={days}
      currentStepData={currentStepData}
      currentVariants={currentVariants}
      validCurrentVariants={validCurrentVariants}
      currentFollowupLeads={currentFollowupLeads}
      dailyFollowupLimit={dailyFollowupLimit}
      followupBatchPerRun={followupBatchPerRun}
      triggerMode={triggerMode}
      dryRunStatus={followupPanelStatus}
      dryRunLoading={dryRunLoading}
      dryRunRows={dryRunRows}
      showVariantLeads={showVariantLeads}
      followupSaving={followupSaving}
      hasUnsavedChanges={hasUnsavedChanges}
      setActiveFollowupService={setActiveFollowupService}
      setActiveFollowupStep={setActiveFollowupStep}
      setShowVariantLeads={setShowVariantLeads}
      loadFollowupConfig={loadFollowupConfig}
      updateCurrentStep={updateCurrentStep}
      setDailyFollowupLimit={setDailyFollowupLimit}
      setHasUnsavedChanges={setHasUnsavedChanges}
      setFollowupBatchPerRun={setFollowupBatchPerRun}
      setTriggerMode={setTriggerMode}
      loadFollowupDryRun={loadFollowupDryRun}
      removeVariant={removeVariant}
      appendMergeTag={appendMergeTag}
      updateVariantContent={updateVariantContent}
      saveFollowupSettings={saveFollowupSettings}
    />
  );




  const renderLeadDrawer = () => (
    <AnimatePresence>
      {selectedLead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLead(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[101] overflow-y-auto shadow-2xl"
          >
            <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Lead Intelligence</h2>
              <button onClick={() => setSelectedLead(null)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-black transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 pb-32">
              <section className="bg-black p-8 rounded-[35px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-bold opacity-50 uppercase mb-2 tracking-widest">Target Profile</p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedLead.name || "Unknown Lead"}</h3>
                    {selectedLead.company_name && (
                      <span className="text-blue-400 font-black text-xs uppercase italic tracking-tighter">/ {selectedLead.company_name}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium opacity-70 mt-1">{selectedLead.email || selectedLead.emailLower}</p>

                  {selectedLead.website && (
                    <a
                      href={selectedLead.website.startsWith("http") ? selectedLead.website : `https://${selectedLead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group"
                    >
                      <Globe size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Visit Website</span>
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  <div className="mt-6 flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">
                      {selectedLead.service}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedLead.status === "replied" ? "bg-green-500" : "bg-blue-600"}`}>
                      Status: {selectedLead.status}
                    </span>
                    <span className="px-3 py-1 bg-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Score: {leadScore(selectedLead)}
                    </span>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full" />
              </section>

              <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Eye size={13} /> Engagement Summary
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-gray-400">
                      Meaningful opens/clicks only. Duplicate hits inside the dedupe window are ignored.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[9px] font-black uppercase text-white">
                    {selectedLead.status || "new"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                    <p className="text-[9px] font-black uppercase text-blue-500">Opens</p>
                    <p className="mt-1 text-3xl font-black text-blue-700">{Number(selectedLead.open_count || 0)}</p>
                    <p className="mt-2 text-[10px] font-bold text-blue-600">First: {formatLeadTime(selectedLead.firstOpenedAt || selectedLead.lastOpenedAt)}</p>
                    <p className="text-[10px] font-bold text-blue-600">Last: {formatLeadTime(selectedLead.lastOpenedAt)}</p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                    <p className="text-[9px] font-black uppercase text-emerald-500">Clicks</p>
                    <p className="mt-1 text-3xl font-black text-emerald-700">{Number(selectedLead.click_count || 0)}</p>
                    <p className="mt-2 text-[10px] font-bold text-emerald-600">First: {formatLeadTime(selectedLead.firstClickedAt || selectedLead.lastClickedAt)}</p>
                    <p className="text-[10px] font-bold text-emerald-600">Last: {formatLeadTime(selectedLead.lastClickedAt)}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Last activity</p>
                  <p className="mt-1 text-sm font-black text-gray-900">{formatLeadTime(selectedLead.lastEngagedAt || selectedLead.lastClickedAt || selectedLead.lastOpenedAt || selectedLead.sentAt)}</p>
                  {selectedLead.lastClickedUrl ? (
                    <p className="mt-1 truncate text-[10px] font-bold text-emerald-600">Last clicked URL: {selectedLead.lastClickedUrl}</p>
                  ) : null}
                </div>
              </section>

              <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl bg-gray-50 ${selectedLeadFollowupInfo?.color || "text-slate-500"}`}>
                    <Timer size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[11px] font-black uppercase tracking-tight ${selectedLeadFollowupInfo?.color || "text-slate-500"}`}>
                      Follow-up Status
                    </p>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {selectedLead.stopAutomation ? "Automation stopped" : selectedLeadFollowupInfo?.label || "No next follow-up scheduled"}
                    </p>
                    {selectedLeadFollowupInfo?.time ? (
                      <p className="text-[11px] font-bold text-blue-600 mt-1">Next action: {selectedLeadFollowupInfo.time}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[9px] font-black uppercase text-gray-400">Current step</p>
                    <p className="mt-1 text-sm font-black text-gray-900">
                      {selectedLead.nextFollowupStep ? `Follow-up ${selectedLead.nextFollowupStep}` : Number(selectedLead.follow_up_count || 0) > 0 ? `Sent ${selectedLead.follow_up_count}` : "Initial outreach"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[9px] font-black uppercase text-gray-400">Sent count</p>
                    <p className="mt-1 text-sm font-black text-gray-900">{Number(selectedLead.follow_up_count || 0)} follow-up(s)</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[9px] font-black uppercase text-gray-400">Last follow-up</p>
                    <p className="mt-1 text-xs font-black text-gray-900">{formatLeadTime(selectedLead.lastFollowUp)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[9px] font-black uppercase text-gray-400">Next follow-up</p>
                    <p className="mt-1 text-xs font-black text-gray-900">{formatLeadTime(selectedLead.nextFollowupAt)}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-[9px] font-black uppercase text-amber-700">Reason</p>
                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-amber-800">
                    {friendlyFollowupReason(selectedLead.nextFollowupReason || selectedLead.nextFollowupStatus || (selectedLead.stopAutomation ? "automation stopped" : ""))}
                  </p>
                  {selectedLead.lastFollowupError ? (
                    <p className="mt-2 text-[10px] font-bold text-red-600">Last error: {String(selectedLead.lastFollowupError)}</p>
                  ) : null}
                </div>
              </section>

              <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Recent Activity
                  </h4>
                  <span className="text-[9px] font-black text-gray-300 uppercase">Last 5 events</span>
                </div>

                <div className="space-y-2">
                  {selectedLeadRecentActivity.map((info) => (
                    <div key={info.key} className={`border rounded-2xl p-4 flex justify-between items-center transition-all ${activityToneClass(info.tone)}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-white/70">
                          {info.tone === "green" ? <MousePointer2 size={14} /> : info.tone === "blue" ? <Eye size={14} /> : <Clock size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase truncate">{info.label}</p>
                          <p className="text-[9px] font-bold italic">{formatLeadTime(info.time)}</p>
                          {info.note ? <p className="mt-1 truncate text-[9px] font-bold opacity-70">{info.note}</p> : null}
                        </div>
                      </div>
                      <CheckCircle2 size={14} />
                    </div>
                  ))}

                  {selectedLeadRecentActivity.length === 0 && (
                    <p className="text-[10px] text-gray-400 font-bold text-center py-4 italic">No engagement tracked yet.</p>
                  )}
                </div>
              </section>

              <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MessageSquare size={14} /> Full Journey Tracking
                </h4>

                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                  {selectedLead.sent_messages &&
                    [...selectedLead.sent_messages].reverse().map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-blue-500 z-10 flex items-center justify-center text-[8px] font-bold">
                          {msg.step}
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">{formatDate(msg.sentAt)}</span>
                          <p className="text-[11px] font-black text-gray-800 uppercase italic">Email Step {msg.step}</p>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">{msg.subject}</p>
                        </div>
                      </div>
                    ))}

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                    <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                      <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">{formatDate(selectedLead.createdAt)}</span>
                      <p className="text-[11px] font-black text-blue-600 uppercase italic tracking-tighter">Initial Outreach</p>
                      <p className="text-[10px] font-bold text-gray-700 mt-2">Sub: {selectedLead.subject}</p>
                      {selectedLead.message && (
                        <div className="mt-2 text-[9px] text-gray-500 bg-white p-3 rounded-lg border border-blue-50 italic" dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(selectedLead.message) }} />
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="fixed bottom-0 w-full max-w-lg p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3">
              {selectedLead.status !== "replied" && (
                <button
                  type="button"
                  onClick={() => handleMarkAsReplied(selectedLead.id)}
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
                >
                  Mark Replied
                </button>
              )}

              <button type="button" onClick={() => handleDelete(selectedLead.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl">
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const showInitialDashboardLoading = loading && leads.length === 0 && !leadsLastFetchedAt;

  if (showInitialDashboardLoading) {
    return <div className="min-h-screen bg-[#FAFBFF] px-4 pt-28 text-center text-xs font-black uppercase text-blue-600 animate-pulse">
        Syncing Command Center...
      </div>
  }

  return (
    <>
      <Navbar />
      <AdminGuard>
        <div data-no-track="true" className="min-h-screen bg-[#FAFBFF] px-4 pb-4 pt-24 lg:px-10 lg:pb-10 lg:pt-28">
          <div className="flex flex-col xl:flex-row justify-between mb-8 gap-6 items-start xl:items-end">
            <div>
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">TrackFlowPro Command Center</h1>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Active Leads: {filteredLeads.length}</span>
                <span className="text-orange-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                  <Flame size={12} /> Hot Leads: {analytics.hot}
                </span>
                <span
                  className={`font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 ${
                    systemHealth.status === "ok"
                      ? "text-emerald-600"
                      : systemHealth.status === "paused"
                        ? "text-amber-600"
                        : systemHealth.status === "error" || systemHealth.status === "needs_attention"
                          ? "text-red-600"
                          : "text-gray-400"
                  }`}
                  title={systemHealth.error || "TrackFlow system health"}
                >
                  <ShieldCheck size={12} /> System: {systemHealth.status === "unknown" ? "Not checked" : systemHealth.status.replace(/_/g, " ")}
                </span>
                <span className="text-green-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={12} /> Replies: {analytics.replied}
                </span>
              </div>
            </div>

            {renderTopTabs()}
          </div>

          {activeTab === "overview" && (
            <OverviewPanel
              analytics={analytics}
              followupSummary={followupSummary}
              firebaseUsage={firebaseUsage}
              cleanupLoading={cleanupLoading}
              dailyFollowupLimit={dailyFollowupLimit}
              leads={leads}
              sortedHotLeads={sortedHotLeads}
              filteredLeadCount={filteredLeads.length}
              loadingMoreLeads={loadingMoreLeads}
              hasMoreLeads={hasMoreLeads}
              sheetLeads={sheetLeads}
              sheetLoading={sheetLoading}
              sheetStatus={sheetStatus}
              sheetLoadedAt={sheetLoadedAt}
              senderCounts={senderCounts}
              loadFollowupSummary={loadFollowupSummary}
              loadFirebaseUsage={loadFirebaseUsage}
              loadSheetLeads={loadSheetLeads}
              runSystemCleanup={runSystemCleanup}
              setActiveTab={setActiveTab}
              setSelectedLead={setSelectedLead}
              fetchMoreLeads={fetchMoreLeads}
            />
          )}
          {activeTab === "sheet" && renderSheetLeads()}
          {activeTab === "outreach" && renderOutreach()}
          {activeTab === "scheduled" && renderScheduledEmails()}
          {activeTab === "leads" && renderLeads()}
          {activeTab === "cleanup" && (
            <CleanupPanel
              reportAssetCleanup={reportAssetCleanup}
              setReportAssetCleanup={setReportAssetCleanup}
              previewReportAssetCleanup={previewReportAssetCleanup}
              runReportAssetCleanup={runReportAssetCleanup}
              secureReports={secureReports}
              setSecureReports={setSecureReports}
              loadSecureReports={loadSecureReports}
              selectSecureReportForCleanup={selectSecureReportForCleanup}
              viewSecureReportLead={viewSecureReportLead}
              toggleSecureReportSelection={toggleSecureReportSelection}
              runBulkReportCleanup={runBulkReportCleanup}
              footprintMemory={footprintMemory}
              setFootprintMemory={setFootprintMemory}
              loadFootprintMemories={loadFootprintMemories}
              allowFootprintMemory={allowFootprintMemory}
              allowSuppressionFootprint={allowSuppressionFootprint}
              forgetFootprintMemory={forgetFootprintMemory}
              forgetOldFootprintMemories={forgetOldFootprintMemories}
              deleteOldSuppressionFootprints={deleteOldSuppressionFootprints}
              toggleFootprintMemorySelection={toggleFootprintMemorySelection}
              selectAllVisibleFootprintMemories={selectAllVisibleFootprintMemories}
              clearFootprintMemorySelection={clearFootprintMemorySelection}
              allowSelectedFootprintMemories={allowSelectedFootprintMemories}
              deleteSelectedFootprintMemories={deleteSelectedFootprintMemories}
            />
          )}
          {activeTab === "automation" && renderFollowups()}
          {activeTab === "analytics" && (
            <AnalyticsPanel
              analytics={analytics}
              leads={leads}
              postmasterStatus={postmasterStatus}
              postmasterLoading={postmasterLoading}
              postmasterHealth={postmasterHealth}
              loadPostmasterHealth={loadPostmasterHealth}
            />
          )}
          {activeTab === "chat-insights" && (
            <ChatInsightsPanel
              chatInsights={chatInsights}
              setChatInsightsSearch={(value) =>
                setChatInsights((prev) => ({
                  ...prev,
                  search: value,
                }))
              }
              loadChatInsights={loadChatInsights}
              openChatInsightSession={openChatInsightSession}
              markChatSessionReviewed={markChatSessionReviewed}
            />
          )}

          {renderLeadDrawer()}

          <style jsx global>{`
            .rsw-editor {
              border: none !important;
              background: transparent !important;
            }
            .email-editor-content ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
            }
            .email-editor-content ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
            }
            .email-editor-content {
              color: #1e293b !important;
              line-height: 1.75 !important;
              font-size: 15px;
              font-weight: 500;
              letter-spacing: -0.01em;
            }
            .email-editor-content a {
              color: #2563eb !important;
              text-decoration: underline !important;
              font-weight: 700 !important;
            }
          `}</style>
        </div>
        
      </AdminGuard>
     
    </>
  );
}
