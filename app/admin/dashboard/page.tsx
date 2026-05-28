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
import { useLeadStore, type LeadViewFilter } from "../../stores/useLeadStore";
import { useTrackflowDashboardStore } from "../../stores/useTrackflowDashboardStore";

import type {
  BulkLeadAction,
  CleanupBucket,
  CleanupCandidate,
  CleanupState,
  ContactMemoryWarning,
  FirebaseUsageState,
  FollowupConfig,
  FollowupSummaryState,
  Lead,
  MainTab,
  ReportAssetCleanupState,
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
  makeDefaultConfig,
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
    mode: "soft",
    leadMode: "archive",
    sheetMode: "mark",
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
  const [reportAssetCleanup, setReportAssetCleanup] = useState<ReportAssetCleanupState>(() => emptyReportAssetCleanupState());
  const [secureReports, setSecureReports] = useState<SecureReportListState>(() => emptySecureReportListState());

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

  const refreshLeadsSmooth = async (input?: { view: LeadViewFilter; month: string; status: string }) => {
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
    fetchLatestLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter }).catch((error) => console.error("Lead cache initial load error:", error));
    setSelectedLeadIds([]);
  }, [fetchLatestLeads, leadView, selectedMonth, leadStatusFilter]);

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
    async function fetchCounts() {
      const counts: Record<string, number> = {};
      const dateKey = todayKeyDhaka();

      await Promise.all(
        ACTIVE_SENDERS.map(async (sender) => {
          try {
            const statsId = `${dateKey}_${emailStatsDocId(sender.email)}`;
            const statsSnap = await getDoc(doc(db, "daily_sending_stats", statsId));
            const stats = statsSnap.exists() ? statsSnap.data() : {};
            counts[sender.email] = Number(stats.initialSent || 0);
          } catch (error) {
            console.error("Sender count stats read error:", sender.email, error);
            counts[sender.email] = 0;
          }
        })
      );

      setSenderCounts(counts);
    }

    fetchCounts().catch((err) => console.error("Sender count error:", err));
  }, [activeTab, sendStatus]);

  const loadFollowupConfig = async (force = false) => {
    if (!force && followupConfigLoadedAt) return;

    try {
      setFollowupLoading(true);
      const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));

      if (configDoc.exists()) {
        const data = configDoc.data();
        setFollowupConfig(mergeWithDefaultConfig(data));
        setDailyFollowupLimit(Number(data.daily_followup_limit || 50));
        setFollowupBatchPerRun(Math.max(1, Math.min(Number(data.followup_batch_per_run || 5), 20)));
        setTriggerMode("open_required");
      } else {
        setFollowupConfig(makeDefaultConfig());
        setDailyFollowupLimit(50);
        setFollowupBatchPerRun(5);
        setTriggerMode("open_required");
      }

      setFollowupConfigLoadedAt(Date.now());
    } catch (err) {
      console.error("Follow-up config load error:", err);
    } finally {
      setFollowupLoading(false);
    }
  };

  useEffect(() => {
    loadFollowupConfig(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
      loadScheduledEmails(false);
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

    const labelMap: Record<BulkLeadAction, string> = {
      archive: `Archive ${ids.length} lead(s)? Automation will stop for them.`,
      restore: `Restore ${ids.length} lead(s)? Automation will not auto-resume.`,
      trash: `Move ${ids.length} lead(s) to trash? Automation will stop for them.`,
      delete_permanent: `Permanently delete ${ids.length} lead(s)? This cannot be undone.`,
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
        body: JSON.stringify({ action, ids }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Lead action failed");

      if (action === "delete_permanent") {
        removeLeadsFromCache(ids);
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

      return matchesSearch && matchesService && matchesMonth && matchesStep && matchesView && matchesStatus;
    });
  }, [leads, searchTerm, activeService, selectedMonth, activeStep, leadView, leadStatusFilter]);

  const sortedHotLeads = useMemo(() => {
    return [...leads].filter((lead) => leadScore(lead) > 0).sort((a, b) => leadScore(b) - leadScore(a)).slice(0, 8);
  }, [leads]);

  const currentStepData: StepConfig = followupConfig[activeFollowupService]?.[activeFollowupStep] || makeDefaultStep();
  const currentVariants: Variant[] = currentStepData.variants || [];
  const validCurrentVariants = currentVariants.filter((variant: Variant) => stripHtml(variant.content));
  const days = Math.max(1, Math.floor((currentStepData.delay || 1440) / 1440));

  const currentFollowupLeads = useMemo(() => {
    return leads.filter((lead) => isLeadEligibleForStep(lead, activeFollowupService, activeFollowupStep, triggerMode));
  }, [leads, activeFollowupService, activeFollowupStep, triggerMode]);

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

  const handleSendEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentMessage = syncEditorMessage();
    const currentSubject = normalizeEmailSubjectForComposer(subject);
    if (currentSubject !== subject) setSubject(currentSubject);
    if (!validateOutreachForm(currentMessage) || !activeSender) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Admin login required. Please login again.");
      return;
    }

    setSending(true);
    setSendStatus("Launching Campaign...");

    try {
      const token = await currentUser.getIdToken();
      const scheduledAtISO = scheduledTime ? new Date(scheduledTime).toISOString() : null;
      const sheetLeadForSend = selectedOutreachSheetLead;
      const sheetRowNumberForSend = sheetLeadForSend ? Number(sheetLeadForSend.rowNumber || 0) : 0;

      if (sheetRowNumberForSend) {
        await patchSheetLead(sheetRowNumberForSend, {
          "Email Subject": currentSubject,
          "Email Body": currentMessage,
          "Approval Status": "Approved",
          "Send Status": scheduledAtISO ? "Scheduling" : "Sending",
          "Sender ID": activeSender.id,
          "Last Synced": new Date().toISOString(),
          Notes: scheduledAtISO ? "Opened from Send Email drawer and scheduling from composer." : "Opened from Send Email drawer and sending from composer.",
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
          ...(sheetLeadForSend
            ? {
                reportToken: sheetValue(sheetLeadForSend, "Report Token"),
                pdfFileId: sheetValue(sheetLeadForSend, "PDF File ID"),
                pdfViewUrl: sheetValue(sheetLeadForSend, "PDF View URL"),
                pdfDownloadUrl: sheetValue(sheetLeadForSend, "PDF Download URL"),
                pdfExpiresAt: sheetValue(sheetLeadForSend, "PDF Expires At"),
                sheetRowNumber: sheetRowNumberForSend,
                sheetWebsiteUrl: sheetValue(sheetLeadForSend, "Website URL"),
                sheetFinalEmail: sheetValue(sheetLeadForSend, "Final Email"),
                source: "google_sheet_send_email_drawer",
              }
            : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (sheetRowNumberForSend) {
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
              Notes: scheduledAtISO ? "Scheduled from Send Email composer drawer." : "Sent from Send Email composer drawer.",
            });
          } catch (sheetError) {
            console.error("Sheet status update after send failed:", sheetError);
            setSendStatus("Email sent, but Sheet status update needs review.");
          }
        }
        const leadIdFromResponse = String(data.leadId || data.id || "").trim();
        const nowIso = new Date().toISOString();
        if (leadIdFromResponse) {
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
            sheetRowNumber: sheetRowNumberForSend || undefined,
            sheetWebsiteUrl: sheetLeadForSend ? sheetValue(sheetLeadForSend, "Website URL") : website,
            sheetFinalEmail: sheetLeadForSend ? sheetValue(sheetLeadForSend, "Final Email") : email,
            open_count: 0,
            click_count: 0,
          });
        }

        setSendStatus(scheduledAtISO ? "Success! Email Scheduled." : "Success! Outreach Launched.");
        void loadFollowupSummary(true);
        resetOutreachForm();
      } else if (data.warningOnly && data.code === "cooldown_active") {
        if (sheetRowNumberForSend) {
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
        if (sheetRowNumberForSend) {
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

    if (!dryRun && reportAssetCleanup.mode === "hard" && reportAssetCleanup.confirmText.trim().toUpperCase() !== "DELETE_REPORT_ASSETS") {
      window.alert("Type DELETE_REPORT_ASSETS before deleting selected test data.");
      return;
    }

    if (!dryRun) {
      const actionName =
        reportAssetCleanup.mode === "hard"
          ? "Delete Selected Test Data"
          : reportAssetCleanup.mode === "assets_only"
            ? "Remove Files From Selected"
            : "Archive Selected Reports";

      const contactModeNote =
        reportAssetCleanup.leadMode === "delete_no_memory"
          ? " No-memory contact delete will only run for contacts with no outreach history."
          : reportAssetCleanup.leadMode === "delete"
            ? " A tiny safety memory will be kept when needed."
            : "";

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
          mode: reportAssetCleanup.mode,
          leadMode: reportAssetCleanup.leadMode,
          sheetMode: reportAssetCleanup.sheetMode,
          dryRun,
          confirm: dryRun ? undefined : reportAssetCleanup.mode === "hard" ? "DELETE_REPORT_ASSETS" : "CLEANUP_REPORT_ASSETS",
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
        await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter });
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
      mode: reportAssetCleanup.mode,
      leadMode: reportAssetCleanup.leadMode,
      sheetMode: reportAssetCleanup.sheetMode,
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

    if (reportAssetCleanup.mode === "hard" && reportAssetCleanup.confirmText.trim().toUpperCase() !== "DELETE_REPORT_ASSETS") {
      window.alert("Type DELETE_REPORT_ASSETS before deleting test data.");
      return;
    }

    const contactModeNote =
      reportAssetCleanup.leadMode === "delete_no_memory"
        ? " The selected contact will be deleted only if no outreach history is found."
        : reportAssetCleanup.leadMode === "delete"
          ? " A small safety memory will be kept for the selected contact."
          : "";

    const confirmMessage =
      reportAssetCleanup.mode === "hard"
        ? `Delete Test Data will remove report records and selected linked data. Use this only for fake/test records.${contactModeNote} Continue?`
        : reportAssetCleanup.mode === "assets_only"
          ? `Remove Files Only will remove the PDF, preview image, and chat history but keep saved records.${contactModeNote} Continue?`
          : `Archive Report will remove report files, make the secure page inactive, and keep a small safety history.${contactModeNote} Continue?`;

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
          mode: reportAssetCleanup.mode,
          leadMode: reportAssetCleanup.leadMode,
          sheetMode: reportAssetCleanup.sheetMode,
          dryRun: false,
          confirm: reportAssetCleanup.mode === "hard" ? "DELETE_REPORT_ASSETS" : "CLEANUP_REPORT_ASSETS",
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
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter });
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

  const deleteSelectedCleanupWithMemory = async (sheetMode: "delete" | "mark" | "skip" = "delete") => {
    if (selectedCleanupIds.length === 0) {
      window.alert("Select at least one cleanup candidate.");
      return;
    }

    const message =
      sheetMode === "delete"
        ? `This will save footprint memory, delete matching Sheet rows, and permanently delete ${selectedCleanupIds.length} Firebase lead(s). Continue?`
        : `This will save footprint memory and delete ${selectedCleanupIds.length} Firebase lead(s). Sheet rows will be ${sheetMode === "mark" ? "marked Deleted" : "skipped"}. Continue?`;

    if (!window.confirm(message)) return;

    setLeadCleanup((prev: CleanupState) => ({ ...prev, actionLoading: true, status: "Deleting full data after saving footprint..." }));

    try {
      const response = await fetch("/api/trackflow/cleanup/delete-full-keep-memory", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ids: selectedCleanupIds, sheetMode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cleanup delete failed");

      const ok = Array.isArray(data.results) ? data.results.filter((item: any) => item.ok).length : data.deletedCount || 0;
      const failed = Array.isArray(data.results) ? data.results.filter((item: any) => !item.ok).length : 0;
      setLeadCleanup((prev: CleanupState) => ({ ...prev, status: `Deleted ${ok}. Failed/skipped ${failed}.` }));
      setSelectedCleanupIds([]);
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter });
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
      params.set("hasEmail", "true");

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
      loadCleanupCandidates(leadCleanup.bucket, false);
      loadSecureReports(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, leadCleanup.bucket]);

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

  const fillOutreachFromSheet = (lead: SheetLead) => {
    const service = normalizeSheetService(sheetValue(lead, "Service Type"));
    const readiness = getSheetReadiness(lead);
    const emailCopy = normalizeSheetEmailCopy(
      sheetValue(lead, "Email Subject"),
      sheetValue(lead, "Email Body"),
    );

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
    const emailCopy = normalizeSheetEmailCopy(sheetValue(lead, "Email Subject"), sheetValue(lead, "Email Body"));
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
        sheetRowNumber: lead.rowNumber,
        sheetWebsiteUrl: sheetValue(lead, "Website URL"),
        sheetFinalEmail: finalEmail,
        source: "google_sheet",
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
    await applyLeadBulkAction("trash", [id]);
  };

  const handlePermanentDeleteLead = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    await applyLeadBulkAction("delete_permanent", [id]);
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
      window.alert("✅ Follow-up settings saved. Template-blocked follow-ups were requeued for the scheduler.");
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
      dryRunStatus={dryRunStatus}
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

              {getNextFollowUpStatus(selectedLead, triggerMode, followupConfig) && (
                <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl bg-gray-50 ${getNextFollowUpStatus(selectedLead, triggerMode, followupConfig)?.color}`}>
                      <Timer size={20} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-tight ${getNextFollowUpStatus(selectedLead, triggerMode, followupConfig)?.color}`}>
                        {getNextFollowUpStatus(selectedLead, triggerMode, followupConfig)?.label}
                      </p>
                      {getNextFollowUpStatus(selectedLead, triggerMode, followupConfig)?.time && (
                        <p className="text-lg font-black text-gray-900 mt-1">{getNextFollowUpStatus(selectedLead, triggerMode, followupConfig)?.time}</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Full Engagement Logs
                  </h4>

                  {(selectedLead.tracking_history?.length || 0) > 5 && (
                    <button onClick={() => setShowAllLogs(!showAllLogs)} className="text-[9px] font-black text-blue-600 uppercase">
                      {showAllLogs ? "Show Less" : `View All (${selectedLead.tracking_history?.length})`}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(selectedLead.tracking_history || [])
                    .slice()
                    .sort((a, b) => toMillis(b.time) - toMillis(a.time))
                    .slice(0, showAllLogs ? undefined : 5)
                    .map((info, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center transition-all hover:border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${info.event === "opened" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                            <Activity size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-800 uppercase">
                              {info.event === "opened" ? "Email Opened" : info.event}
                              {info.step_tag ? <span className="ml-2 text-blue-500">[{info.step_tag}]</span> : ""}
                            </p>
                            <p className="text-[9px] font-bold text-blue-600 italic">{formatDate(info.time)}</p>
                          </div>
                        </div>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                    ))}

                  {(!selectedLead.tracking_history || selectedLead.tracking_history.length === 0) && (
                    <p className="text-[10px] text-gray-400 font-bold text-center py-4 italic">No engagement tracked yet.</p>
                  )}
                </div>
              </div>

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
              loadFollowupSummary={loadFollowupSummary}
              loadFirebaseUsage={loadFirebaseUsage}
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
              leadCleanup={leadCleanup}
              selectedCleanupIds={selectedCleanupIds}
              setSelectedCleanupIds={setSelectedCleanupIds}
              setLeadCleanup={setLeadCleanup}
              loadCleanupCandidates={loadCleanupCandidates}
              runManualCleanupRefresh={runManualCleanupRefresh}
              deleteSelectedCleanupWithMemory={deleteSelectedCleanupWithMemory}
              skipSelectedCleanup={skipSelectedCleanup}
              protectSelectedCleanup={protectSelectedCleanup}
              toggleCleanupCandidate={toggleCleanupCandidate}
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
