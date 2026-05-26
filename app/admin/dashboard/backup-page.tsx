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
  Briefcase,
  Building2,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  ExternalLink,
  Flame,
  Globe,
  FileText,
  Eye,
  Sparkles,
  Layers,
  Link2,
  Type,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  MousePointer2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Target,
  Timer,
  Trash2,
  UserPlus,
  X,
  Zap,
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

type MainTab = "overview" | "sheet" | "outreach" | "scheduled" | "leads" | "cleanup" | "automation" | "analytics";
type TriggerMode = "no_reply_after_delay" | "open_required";

type ServiceId = "Email Signature" | "Google Ads" | "Server Side Tracking";
type StepId = "step1" | "step2" | "step3" | "step4" | "step5";

type Variant = {
  id: string;
  content: string;
};

type StepConfig = {
  variants: Variant[];
  delay: number;
};

type FollowupConfig = Record<ServiceId, Record<StepId, StepConfig>>;

type TrackingHistory = {
  event: string;
  time: any;
  link?: string;
  step?: number;
  step_tag?: string;
};

type SentMessage = {
  step: number;
  subject: string;
  message?: string;
  sentAt: any;
  trackingTag?: string;
};

type Lead = {
  id: string;
  name?: string;
  company_name?: string;
  website?: string;
  email: string;
  emailLower?: string;
  subject: string;
  message?: string;
  open_count?: number;
  click_count?: number;
  status?: string;
  createdAt?: any;
  lastOpenedAt?: any;
  lastClickedAt?: any;
  lastEngagedAt?: any;
  lastFollowUp?: any;
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  retryCount?: number;
  lastFollowupError?: string;
  sentAt?: any;
  tracking_history?: TrackingHistory[];
  follow_up_count?: number;
  sent_messages?: SentMessage[];
  service?: ServiceId | string;
  stopAutomation?: boolean;
  sender_email?: string;
  sender_name?: string;
  source?: string;
  sheetRowNumber?: number;
  sheetFinalEmail?: string;
  sheetWebsiteUrl?: string;
  archived?: boolean;
  archivedAt?: any;
  deleted?: boolean;
  deletedAt?: any;
  archiveReason?: string;
  deleteReason?: string;
  [key: string]: any;
};

type SheetLead = {
  rowNumber: number;
  "Export Date"?: string;
  "Business Name"?: string;
  "Website URL"?: string;
  "Final Email"?: string;
  "Email Source"?: string;
  "Social Platform"?: string;
  "Social Link"?: string;
  "WhatsApp"?: string;
  "ChatGPT Prompt"?: string;
  "Lead Status"?: string;
  "Approval Status"?: string;
  "Send Status"?: string;
  "Service Type"?: string;
  "Audit Score"?: string;
  "Lead Label"?: string;
  "Main Issue"?: string;
  "Proof Points"?: string;
  "Report Token"?: string;
  "Report URL"?: string;
  "PDF File ID"?: string;
  "PDF View URL"?: string;
  "PDF Download URL"?: string;
  "PDF Expires At"?: string;
  "Report Page Viewed"?: string;
  "PDF Downloaded"?: string;
  "CTA Clicked"?: string;
  "Last Report Viewed At"?: string;
  "Last PDF Downloaded At"?: string;
  "Last CTA Clicked At"?: string;
  "Email Subject"?: string;
  "Email Body"?: string;
  "Decision Maker"?: string;
  "Decision Maker Title"?: string;
  "Contact Quality"?: string;
  "Tracking ID"?: string;
  "Firestore Lead ID"?: string;
  "Open Count"?: string;
  "Click Count"?: string;
  "Reply Status"?: string;
  "Last Synced"?: string;
  "Archive Status"?: string;
  "Notes"?: string;
  "Sender ID"?: string;
  "Attempt Count"?: string;
  "Queue Lock ID"?: string;
  "Queue Locked At"?: string;
  "Queue Attempt ID"?: string;
  [key: string]: any;
};


type ScheduledEditState = {
  leadId: string;
  email: string;
  clientName: string;
  companyName: string;
  website: string;
  businessType: string;
  subject: string;
  message: string;
  scheduledTime: string;
  selectedService: ServiceId | "";
  selectedSender: string;
  includeSignature: boolean;
  reportUrl: string;
  reportButtonText: string;
};

type FollowupSummaryState = {
  loading: boolean;
  error: string;
  loadedAt: number | null;
  sentToday: number;
  dailyLimit: number;
  batchPerRun: number;
  remainingToday: number;
  maxThisRun: number;
  dueNow: number;
  scheduled: number;
  waitingFirstOpen: number;
  waitingNewEngagement: number;
  templateBlocked: number;
  failedRetry: number;
  failedFinal: number;
  blocked: number;
};

type FirebaseUsageState = {
  loading: boolean;
  error: string;
  loadedAt: number | null;
  usage: {
    estimatedReadsToday: number;
    estimatedWritesToday: number;
    estimatedDeletesToday: number;
    estimatedStorageMb: number;
    readPercent: number;
    writePercent: number;
    deletePercent: number;
    storagePercent: number;
  };
  quota: {
    readsPerDay: number;
    writesPerDay: number;
    deletesPerDay: number;
    storageMb: number;
  };
  counts: {
    leadCount: number;
    activeLeadCount: number;
    archivedLeadCount: number;
    trashedLeadCount: number;
    emailEventCount: number;
    suppressionCount: number;
    initialSentToday: number;
    followupSentToday: number;
    eventsToday: number;
  };
  note: string;
};


type CleanupBucket = "due" | "cold" | "warm" | "replied" | "protected" | "upcoming";

type CleanupCandidate = {
  leadId: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  service?: string;
  status?: string;
  source?: string;
  sourceKind?: "sheet" | "cold" | "test";
  sheetLinked?: boolean;
  sheetRowNumber?: number | null;
  openCount?: number;
  clickCount?: number;
  followUpCount?: number;
  lastContactedAt?: string;
  dueAt?: string;
  daysOld?: number;
  eligible?: boolean;
  outcome?: string;
  reason?: string;
  protectedLead?: boolean;
  cooldownMonths?: number;
  memoryMonths?: number;
  blockedReasons?: string[];
};

type CleanupState = {
  loading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  bucket: CleanupBucket;
  rows: CleanupCandidate[];
  policy?: any;
};


type ContactMemoryWarning = {
  emailLower?: string;
  lastOutcome?: string;
  lastContactedAt?: string;
  cooldownUntil?: string;
  memoryExpiresAt?: string;
  companyName?: string;
  website?: string;
  service?: string;
  openCount?: number;
  clickCount?: number;
  sourceLeadId?: string;
};

type BulkLeadAction = "archive" | "restore" | "trash" | "delete_permanent";

const SERVICE_LIST: { id: ServiceId; icon: ReactNode }[] = [
  { id: "Email Signature", icon: <MousePointer2 size={16} /> },
  { id: "Google Ads", icon: <Target size={16} /> },
  { id: "Server Side Tracking", icon: <Database size={16} /> },
];

const SERVICE_NAMES: ServiceId[] = ["Email Signature", "Google Ads", "Server Side Tracking"];
const STEPS: StepId[] = ["step1", "step2", "step3", "step4", "step5"];
const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "active", "interested"]);
const OUTREACH_DRAFT_KEY = "trackflowpro_admin_outreach_draft_v1";
const MAILING_ADDRESS =
  process.env.NEXT_PUBLIC_TRACKFLOW_MAILING_ADDRESS ||
  process.env.NEXT_PUBLIC_BUSINESS_MAILING_ADDRESS ||
  "";

function stripHtml(html: string) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePreviewHtml(html: string) {
  if (typeof window === "undefined") return "";

  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  template.content.querySelectorAll("script, iframe, object, embed, link, meta, style").forEach((node) => node.remove());

  template.content.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
        return;
      }

      if (["href", "src", "xlink:href"].includes(name)) {
        const lower = value.toLowerCase();
        const isSafe =
          lower.startsWith("http://") ||
          lower.startsWith("https://") ||
          lower.startsWith("mailto:") ||
          lower.startsWith("tel:") ||
          lower.startsWith("#") ||
          lower.startsWith("/");

        if (!isSafe) element.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

function countWordsFromHtml(html: string) {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

function countLinksFromHtml(html: string) {
  return (String(html || "").match(/<a\s/gi) || []).length;
}

function getFollowupRiskLabel(html: string) {
  const words = countWordsFromHtml(html);
  const links = countLinksFromHtml(html);
  if (words > 120 || links > 1) return { label: "Needs cleanup", tone: "bg-red-50 text-red-600 border-red-100" };
  if (words > 80 || links === 1) return { label: "Review", tone: "bg-amber-50 text-amber-700 border-amber-100" };
  return { label: "Clean", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" };
}

function isEmailPatternValid(inputEmail: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail);
}

function makeNameFromEmail(email: string) {
  const local = email.split("@")[0] || "Sender";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}

function normalizeOptionalUrl(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function emailStatsDocId(email: string) {
  return encodeURIComponent(String(email || "").trim().toLowerCase()).replace(/\./g, "%2E");
}

function todayKeyDhaka(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function monthKeyFromMillis(value: any) {
  const millis = toMillis(value);
  if (!millis) return "";
  const date = new Date(millis);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getRecentMonthOptions(count = 18) {
  const options: { value: string; label: string }[] = [];
  const start = new Date();
  start.setDate(1);

  for (let i = 0; i < count; i += 1) {
    const date = new Date(start);
    date.setMonth(start.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-GB", { month: "short", year: "numeric" });
    options.push({ value, label });
  }

  return options;
}

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

function sheetValue(lead: SheetLead | null | undefined, key: keyof SheetLead | string) {
  return String(lead?.[key as keyof SheetLead] || "").trim();
}

function isSheetEmailReady(lead: SheetLead) {
  return isEmailPatternValid(sheetValue(lead, "Final Email"));
}

function isSheetMessageReady(lead: SheetLead) {
  return Boolean(stripHtml(sheetValue(lead, "Email Body"))) && Boolean(sheetValue(lead, "Email Subject"));
}

function isSecureReportUrl(value: string) {
  const url = normalizeOptionalUrl(value);
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const lower = url.toLowerCase();

    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("0.0.0.0")) return false;
    if (lower.includes("/audit/pdf/") || lower.includes(":8000/")) return false;
    if (lower.includes("drive.google.com") || lower.includes("googleusercontent.com")) return false;
    if (/\.pdf(?:$|[?#])/i.test(parsed.pathname + parsed.search)) return false;

    // Client-facing email/report links must be branded token pages, not raw files.
    return /^\/r\/[a-z0-9_-]{16,96}\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isSheetReportReady(lead: SheetLead) {
  const reportUrl = sheetValue(lead, "Report URL");
  const reportToken = sheetValue(lead, "Report Token");
  const pdfFileId = sheetValue(lead, "PDF File ID");
  const pdfViewUrl = sheetValue(lead, "PDF View URL");
  const pdfDownloadUrl = sheetValue(lead, "PDF Download URL");
  return Boolean(isSecureReportUrl(reportUrl) && reportToken && pdfFileId && (pdfViewUrl || pdfDownloadUrl));
}

function isSheetApprovalReady(lead: SheetLead) {
  const approval = sheetValue(lead, "Approval Status").toLowerCase();
  return ["approved", "manual approved", "system qualified", "send ready"].includes(approval);
}

function isSheetSendStatusReady(lead: SheetLead) {
  const sendStatus = sheetValue(lead, "Send Status").toLowerCase();
  return ["", "not sent", "failed", "needs review"].includes(sendStatus);
}

function getSheetReadiness(lead: SheetLead) {
  const blockers: string[] = [];

  if (!isSheetEmailReady(lead)) blockers.push("valid email missing");
  if (!isSheetApprovalReady(lead)) blockers.push("approval not ready");
  if (!isSheetSendStatusReady(lead)) blockers.push(`send status is ${sheetValue(lead, "Send Status") || "not allowed"}`);
  if (!stripHtml(sheetValue(lead, "Email Subject"))) blockers.push("email subject missing");
  if (!stripHtml(sheetValue(lead, "Email Body"))) blockers.push("email body missing");
  if (!sheetValue(lead, "Main Issue")) blockers.push("main issue missing");
  if (!isSheetReportReady(lead)) blockers.push("secure /r report or PDF fields missing");

  return {
    ready: blockers.length === 0,
    blockers,
    note: blockers.length ? blockers.join(" · ") : "Ready for verified outreach",
  };
}

function getSheetReportStatus(lead: SheetLead) {
  if (isSheetReportReady(lead)) {
    const viewed = sheetValue(lead, "Report Page Viewed").toLowerCase() === "yes";
    const downloaded = sheetValue(lead, "PDF Downloaded").toLowerCase() === "yes";
    const clicked = sheetValue(lead, "CTA Clicked").toLowerCase() === "yes";
    return {
      label: viewed ? "Report viewed" : "Report ready",
      note: [downloaded ? "PDF downloaded" : "PDF hosted", clicked ? "CTA clicked" : "CTA pending"].join(" · "),
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }
  return {
    label: "Report missing",
    note: "Upload PDF + register /r link before sending",
    tone: "bg-red-50 text-red-700 border-red-100",
  };
}


function normalizeSheetService(value: string): ServiceId {
  const text = String(value || "").toLowerCase();
  if (text.includes("signature")) return "Email Signature";
  if (text.includes("server") || text.includes("sst")) return "Server Side Tracking";
  return "Google Ads";
}

function applyMergeTags(html: string, data: { name?: string; company?: string; website?: string; service?: string }) {
  return String(html || "")
    .replace(/{name}/g, data.name || "there")
    .replace(/{company}/g, data.company || "your company")
    .replace(/{website}/g, data.website || "your website")
    .replace(/{service}/g, data.service || "our service");
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

function toMillis(time: any): number {
  if (!time) return 0;
  if (typeof time.toMillis === "function") return time.toMillis();
  if (typeof time.seconds === "number") return time.seconds * 1000;
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDate(timestamp: any) {
  const millis = toMillis(timestamp);
  if (millis === 0) return "N/A";
  return new Date(millis).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


function toDateTimeLocalInput(timestamp: any) {
  const millis = toMillis(timestamp);
  if (!millis) return "";
  const date = new Date(millis);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function makeDefaultStep(): StepConfig {
  return {
    variants: [{ id: "V1", content: "" }],
    delay: 1440,
  };
}

function makeDefaultConfig(): FollowupConfig {
  return SERVICE_NAMES.reduce((serviceAcc, service) => {
    serviceAcc[service] = STEPS.reduce((stepAcc, step) => {
      stepAcc[step] = makeDefaultStep();
      return stepAcc;
    }, {} as Record<StepId, StepConfig>);
    return serviceAcc;
  }, {} as FollowupConfig);
}

function mergeWithDefaultConfig(data: any): FollowupConfig {
  const defaults = makeDefaultConfig();

  for (const service of SERVICE_NAMES) {
    for (const step of STEPS) {
      const loadedStep = data?.[service]?.[step];
      if (!loadedStep) continue;

      const variants = Array.isArray(loadedStep.variants)
        ? loadedStep.variants.filter((variant: any) => variant && typeof variant === "object")
        : [];

      defaults[service][step] = {
        variants: variants.length > 0 ? variants : [{ id: "V1", content: "" }],
        delay: Number(loadedStep.delay || 1440),
      };
    }
  }

  return defaults;
}

function getLastSentMs(lead: Lead) {
  return toMillis(lead.lastFollowUp || lead.sentAt || lead.createdAt);
}

function getLastEngagedMs(lead: Lead) {
  return Math.max(
    toMillis(lead.lastEngagedAt),
    toMillis(lead.lastClickedAt),
    toMillis(lead.lastOpenedAt || lead.last_opened)
  );
}

function isHotLead(lead: Lead) {
  return Number(lead.click_count || 0) > 0 || Number(lead.open_count || 0) >= 1 || lead.status === "clicked";
}

function leadScore(lead: Lead) {
  if (["bounced", "spam", "unsubscribed"].includes(String(lead.status || ""))) return -100;
  if (lead.status === "replied") return 100;

  return (
    Number(lead.open_count || 0) * 10 +
    Number(lead.click_count || 0) * 25 +
    Number(lead.follow_up_count || 0) * 3
  );
}

function getNextFollowUpStatus(lead: Lead, triggerMode: TriggerMode, config: FollowupConfig) {
  if (lead.status === "replied" || lead.stopAutomation) return null;
  if (["bounced", "spam", "unsubscribed", "finished"].includes(String(lead.status || ""))) return null;

  const storedStatus = String(lead.nextFollowupStatus || "").toLowerCase();
  const storedTime = toMillis(lead.nextFollowupAt);
  const nextNumber = Number(lead.nextFollowupStep || Number(lead.follow_up_count || 0) + 1);

  if (storedStatus === "scheduled" && storedTime) {
    const now = Date.now();
    return {
      label: now >= storedTime ? `Ready: F-${nextNumber}` : `Scheduled: F-${nextNumber}`,
      color: now >= storedTime ? "text-green-500" : "text-blue-500",
      time: formatDate(lead.nextFollowupAt),
    };
  }

  if (storedStatus === "processing") {
    return { label: `Processing F-${nextNumber}`, color: "text-amber-600", time: null };
  }

  if (storedStatus === "template_blocked") {
    return { label: "Template/config blocked", color: "text-red-600", time: storedTime ? formatDate(lead.nextFollowupAt) : null };
  }

  if (storedStatus === "failed_final") {
    return { label: "Follow-up failed final", color: "text-red-600", time: null };
  }

  if (storedStatus === "waiting_for_first_open_or_click") {
    return { label: "Waiting for first Open/Click", color: "text-orange-500", time: null };
  }

  if (storedStatus === "waiting_for_new_engagement") {
    return { label: "Waiting for New Open/Click", color: "text-orange-500", time: null };
  }

  if (storedStatus === "blocked") {
    return { label: `Blocked: ${lead.nextFollowupReason || "automation stopped"}`, color: "text-red-600", time: null };
  }

  const followUpCount = Number(lead.follow_up_count || 0);
  if (followUpCount >= 5) return null;

  const service = (lead.service || "Email Signature") as ServiceId;
  const nextStep = (STEPS[followUpCount] || "step1") as StepId;
  const stepConfig = config?.[service]?.[nextStep];
  const delayMinutes = Number(stepConfig?.delay || 1440);

  const lastSent = getLastSentMs(lead);
  const lastEngaged = getLastEngagedMs(lead);

  if (!lastSent) return { label: "Syncing...", color: "text-gray-400", time: null };

  if (Number(lead.open_count || 0) < 1 && Number(lead.click_count || 0) < 1 && !lastEngaged) {
    return { label: "No auto follow-up: No Open/Click", color: "text-orange-500", time: null };
  }

  if (followUpCount >= 1 && lastEngaged <= lastSent) {
    return { label: "Waiting for New Open/Click", color: "text-orange-500", time: null };
  }

  const scheduledMillis = lastEngaged
    ? lastEngaged + (delayMinutes - 60) * 60_000
    : lastSent + delayMinutes * 60_000;

  if (Date.now() >= scheduledMillis) {
    return { label: `Ready: F-${followUpCount + 1}`, color: "text-green-500", time: formatDate(scheduledMillis) };
  }

  return { label: `F-${followUpCount + 1} Scheduled`, color: "text-blue-500", time: formatDate(scheduledMillis) };
}

function isLeadEligibleForStep(lead: Lead, service: ServiceId, step: StepId, triggerMode: TriggerMode): boolean {
  if (lead.stopAutomation === true) return false;
  if (!ACTIVE_STATUSES.has(String(lead.status || ""))) return false;
  if (String(lead.service || "").toLowerCase().trim() !== service.toLowerCase().trim()) return false;

  const followUpCount = Number(lead.follow_up_count || 0);
  const currentStepIndex = STEPS.indexOf(step);
  if (followUpCount !== currentStepIndex) return false;

  const lastSent = getLastSentMs(lead);
  const lastEngaged = getLastEngagedMs(lead);
  const hasAnyEngagement = Number(lead.open_count || 0) >= 1 || Number(lead.click_count || 0) >= 1 || lastEngaged > 0 || lead.status === "clicked";

  if (!hasAnyEngagement) return false;

  if (step === "step1") {
    return hasAnyEngagement;
  }

  return lastSent > 0 && lastEngaged > lastSent;
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

  const monthOptions = useMemo(() => getRecentMonthOptions(18), []);

  const activeSender = ACTIVE_SENDERS.find((sender : any) => sender.id === selectedSender);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const wordCount = stripHtml(message).split(/\s+/).filter(Boolean).length;
  const bodyLinkCount = (message.match(/<a\s/gi) || []).length;
  const reportLinkCount = reportUrl.trim() ? 1 : 0;
  const totalLinkCount = bodyLinkCount + reportLinkCount;


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


  const loadScheduledEmails = async (force = false) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setScheduledStatus("Please login again to load scheduled emails.");
      return;
    }

    if (!force && scheduledLoadedAt && scheduledEmails.length >= 0) {
      setScheduledStatus(`Cached ${scheduledEmails.length} scheduled email(s). Use refresh if needed.`);
      return;
    }

    try {
      setScheduledLoading(true);
      setScheduledStatus("Loading scheduled emails...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/scheduled-emails?status=scheduled&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Scheduled email load failed");
      setScheduledEmails(Array.isArray(data.rows) ? data.rows : []);
      setScheduledLoadedAt(Date.now());
      setScheduledStatus(`Loaded ${data.count || 0} scheduled email(s).`);
    } catch (error: any) {
      console.error("Scheduled emails load error:", error);
      setScheduledEmails([]);
      setScheduledStatus(`Scheduled email load failed: ${error.message || "Unknown error"}`);
    } finally {
      setScheduledLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "scheduled") {
      loadScheduledEmails(false);
    }
  }, [activeTab, sendStatus]);

  const openScheduledEditor = (lead: Lead) => {
    setScheduledEdit({
      leadId: lead.id,
      email: String(lead.email || lead.emailLower || ""),
      clientName: String(lead.name || ""),
      companyName: String(lead.company_name || ""),
      website: String(lead.website || ""),
      businessType: String(lead.business_type || ""),
      subject: String(lead.subject || ""),
      message: String(lead.message || ""),
      scheduledTime: toDateTimeLocalInput(lead.scheduledAt),
      selectedService: SERVICE_NAMES.includes(lead.service as ServiceId) ? (lead.service as ServiceId) : "Google Ads",
      selectedSender: String(lead.sender_id || ACTIVE_SENDERS.find((sender: any) => sender.email === lead.sender_email)?.id || ACTIVE_SENDERS[0]?.id || ""),
      includeSignature: lead.include_signature !== false,
      reportUrl: String(lead.reportUrl || ""),
      reportButtonText: String(lead.reportButtonText || "View short audit note"),
    });
  };

  const saveScheduledEdit = async () => {
    if (!scheduledEdit) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");

    if (!isEmailPatternValid(scheduledEdit.email.trim())) return window.alert("Please enter a valid recipient email.");
    if (!scheduledEdit.subject.trim()) return window.alert("Subject is required.");
    if (!stripHtml(scheduledEdit.message)) return window.alert("Message body cannot be empty.");
    if (scheduledEdit.reportUrl?.trim() && (!normalizeOptionalUrl(scheduledEdit.reportUrl) || !isSecureReportUrl(scheduledEdit.reportUrl))) {
      return window.alert("Scheduled email report URL must be the secure TrackFlow /r/[token] page.");
    }
    if (!scheduledEdit.scheduledTime) return window.alert("Scheduled time is required.");

    try {
      setScheduledSaving(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/scheduled-emails", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: scheduledEdit.leadId,
          email: scheduledEdit.email,
          clientName: scheduledEdit.clientName,
          companyName: scheduledEdit.companyName,
          website: scheduledEdit.website,
          businessType: scheduledEdit.businessType,
          subject: scheduledEdit.subject,
          message: scheduledEdit.message,
          scheduledAt: new Date(scheduledEdit.scheduledTime).toISOString(),
          selectedService: scheduledEdit.selectedService,
          senderId: scheduledEdit.selectedSender,
          includeSignature: scheduledEdit.includeSignature,
          reportUrl: scheduledEdit.reportUrl,
          reportButtonText: scheduledEdit.reportButtonText,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Scheduled email update failed");
      setScheduledEdit(null);
      setScheduledStatus("Scheduled email updated successfully.");
      await loadScheduledEmails(true);
    } catch (error: any) {
      console.error("Scheduled email update error:", error);
      window.alert(error.message || "Scheduled email update failed.");
    } finally {
      setScheduledSaving(false);
    }
  };

  const cancelScheduledEmail = async (leadId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");
    if (!window.confirm("Cancel this scheduled email? It will not be sent.")) return;

    try {
      setScheduledSaving(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/trackflow/send-email?leadId=${encodeURIComponent(leadId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cancel failed");
      setScheduledStatus("Scheduled email cancelled.");
      setScheduledEdit(null);
      await loadScheduledEmails(true);
    } catch (error: any) {
      console.error("Scheduled email cancel error:", error);
      window.alert(error.message || "Scheduled email cancel failed.");
    } finally {
      setScheduledSaving(false);
    }
  };

  const sendScheduledSoon = async (leadId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");
    if (!window.confirm("Move this email to the immediate send queue? It will send on the next scheduled-initials cron run.")) return;

    try {
      setScheduledSaving(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/scheduled-emails", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId, action: "send_soon" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Send-soon update failed");
      setScheduledStatus("Email moved to immediate send queue. Scheduled-initials cron will send it on the next run.");
      setScheduledEdit(null);
      await loadScheduledEmails(true);
    } catch (error: any) {
      console.error("Scheduled send-soon error:", error);
      window.alert(error.message || "Send-soon update failed.");
    } finally {
      setScheduledSaving(false);
    }
  };

  const loadFollowupSummary = async (force = false) => {
    if (!force && followupSummary.loadedAt && Date.now() - followupSummary.loadedAt < 60_000) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFollowupSummary((current) => ({ ...current, error: "Please login again.", loading: false }));
      return;
    }

    try {
      setFollowupSummary((current) => ({ ...current, loading: true, error: "" }));
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/automation/followups/summary", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Follow-up summary failed");

      setFollowupSummary({
        loading: false,
        error: "",
        loadedAt: Date.now(),
        sentToday: Number(data.sentToday || 0),
        dailyLimit: Number(data.dailyLimit || dailyFollowupLimit || 50),
        batchPerRun: Number(data.batchPerRun || followupBatchPerRun || 5),
        remainingToday: Number(data.remainingToday ?? Math.max(0, Number(data.dailyLimit || dailyFollowupLimit || 50) - Number(data.sentToday || 0))),
        maxThisRun: Number(data.maxThisRun ?? Math.min(Number(data.batchPerRun || followupBatchPerRun || 5), Math.max(0, Number(data.dailyLimit || dailyFollowupLimit || 50) - Number(data.sentToday || 0)))),
        dueNow: Number(data.dueNow || 0),
        scheduled: Number(data.scheduled || 0),
        waitingFirstOpen: Number(data.waitingFirstOpen || 0),
        waitingNewEngagement: Number(data.waitingNewEngagement || 0),
        templateBlocked: Number(data.templateBlocked || 0),
        failedRetry: Number(data.failedRetry || 0),
        failedFinal: Number(data.failedFinal || 0),
        blocked: Number(data.blocked || 0),
      });
    } catch (error: any) {
      console.error("Follow-up summary error:", error);
      setFollowupSummary((current) => ({
        ...current,
        loading: false,
        error: error.message || "Follow-up summary failed",
      }));
    }
  };

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "automation") {
      loadFollowupSummary(false).catch((error) => console.error("Follow-up summary load error:", error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  const loadFirebaseUsage = async (force = false) => {
    if (!force && firebaseUsage.loadedAt && Date.now() - firebaseUsage.loadedAt < 60_000) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFirebaseUsage((current) => ({ ...current, error: "Please login again.", loading: false }));
      return;
    }

    try {
      setFirebaseUsage((current) => ({ ...current, loading: true, error: "" }));
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/system/usage-summary", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Usage summary failed");

      setFirebaseUsage({
        loading: false,
        error: "",
        loadedAt: Date.now(),
        usage: {
          estimatedReadsToday: Number(data.usage?.estimatedReadsToday || 0),
          estimatedWritesToday: Number(data.usage?.estimatedWritesToday || 0),
          estimatedDeletesToday: Number(data.usage?.estimatedDeletesToday || 0),
          estimatedStorageMb: Number(data.usage?.estimatedStorageMb || 0),
          readPercent: Number(data.usage?.readPercent || 0),
          writePercent: Number(data.usage?.writePercent || 0),
          deletePercent: Number(data.usage?.deletePercent || 0),
          storagePercent: Number(data.usage?.storagePercent || 0),
        },
        quota: {
          readsPerDay: Number(data.quota?.readsPerDay || 50000),
          writesPerDay: Number(data.quota?.writesPerDay || 20000),
          deletesPerDay: Number(data.quota?.deletesPerDay || 20000),
          storageMb: Number(data.quota?.storageMb || 1024),
        },
        counts: {
          leadCount: Number(data.counts?.leadCount || 0),
          activeLeadCount: Number(data.counts?.activeLeadCount || 0),
          archivedLeadCount: Number(data.counts?.archivedLeadCount || 0),
          trashedLeadCount: Number(data.counts?.trashedLeadCount || 0),
          emailEventCount: Number(data.counts?.emailEventCount || 0),
          suppressionCount: Number(data.counts?.suppressionCount || 0),
          initialSentToday: Number(data.counts?.initialSentToday || 0),
          followupSentToday: Number(data.counts?.followupSentToday || 0),
          eventsToday: Number(data.counts?.eventsToday || 0),
        },
        note: String(data.note || ""),
      });
    } catch (error: any) {
      console.error("Firebase usage summary error:", error);
      setFirebaseUsage((current) => ({ ...current, loading: false, error: error.message || "Usage summary failed" }));
    }
  };

  const loadSystemHealth = async (force = false, deep = false) => {
    if (!force && systemHealth.loadedAt && Date.now() - systemHealth.loadedAt < 60_000) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setSystemHealth((current) => ({ ...current, loading: false, error: "Please login again.", status: "error" }));
      return;
    }

    try {
      setSystemHealth((current) => ({ ...current, loading: true, error: "" }));
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/trackflow/admin/health${deep ? "?deep=true" : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "System health check failed");

      setSystemHealth({
        loading: false,
        error: "",
        loadedAt: Date.now(),
        status: data.switches?.automationPaused ? "paused" : data.status || "ok",
        service: String(data.service || data.mode || "TrackFlowPro API"),
        deep: Boolean(data.deep),
        env: data.env || {},
        switches: {
          ...(data.switches || {}),
          ...(data.drivePdfCleanup ? { drivePdfCleanup: data.drivePdfCleanup } : {}),
        },
        checks: data.checks || data.cronStatus || {},
        followupConfigSource: data.followupConfigSource || data.admin?.followupConfigSource || "",
        followupConfigSavedInFirestore: Boolean(data.followupConfigSavedInFirestore || data.admin?.followupConfigSavedInFirestore),
        followupDailyLimit: Number(data.followupDailyLimit || data.admin?.followupDailyLimit || 0),
        followupBatchPerRun: Number(data.followupBatchPerRun || data.admin?.followupBatchPerRun || 0),
      } as any);
    } catch (error: any) {
      console.error("System health check error:", error);
      setSystemHealth((current) => ({
        ...current,
        loading: false,
        error: error?.message || "System health check failed",
        status: "error",
      }));
    }
  };

  const runSystemCleanup = async (action: string, days = 30) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");
    const labelMap: Record<string, string> = {
      archive_replied: `Archive replied leads older than ${days} days?`,
      archive_finished: `Archive finished/bounced/unsubscribed leads older than ${days} days?`,
      trash_test_leads: "Move detected test/fake leads to trash?",
      delete_old_events: `Delete email event logs older than ${days} days? This cannot be restored.`,
    };
    if (!window.confirm(labelMap[action] || "Run cleanup action?")) return;

    try {
      setCleanupLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/system/cleanup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, days }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cleanup failed");
      window.alert(data.message || "Cleanup completed.");
      await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter });
      await loadFirebaseUsage(true);
    } catch (error: any) {
      console.error("System cleanup error:", error);
      window.alert(error.message || "Cleanup failed.");
    } finally {
      setCleanupLoading(false);
    }
  };

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

  const loadFollowupDryRun = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Please login again.");
      return;
    }

    try {
      setDryRunLoading(true);
      setDryRunStatus("Loading dry-run preview...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/automation/followups/dry-run?limit=50&includeBlocked=false&mode=due", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Dry-run failed");
      setDryRunRows(Array.isArray(data.rows) ? data.rows : []);
      setDryRunStatus(`Dry-run ready: ${data.eligibleCount || 0} eligible lead(s). Checked ${data.checked || 0}.`);
    } catch (error: any) {
      console.error("Follow-up dry-run error:", error);
      setDryRunRows([]);
      setDryRunStatus(`Dry-run failed: ${error.message || "Unknown error"}`);
    } finally {
      setDryRunLoading(false);
    }
  };


  const loadPostmasterHealth = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Please login again.");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort("Postmaster request timeout"), 60000);

    try {
      setPostmasterLoading(true);
      setPostmasterStatus("Loading Google Postmaster health...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/postmaster/health?daysBack=1&maxLookback=3", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: "no-store",
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: false,
          error: `Postmaster API did not return JSON. Status: ${response.status}`,
        };
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Postmaster health failed");
      }

      setPostmasterHealth(data);

      if (!data.configured) {
        setPostmasterStatus("Postmaster API not configured yet.");
      } else if (data.authError || data.needsCredentialRefresh) {
        setPostmasterStatus(data.message || "Postmaster OAuth credentials need to be refreshed.");
      } else if (data.noData) {
        setPostmasterStatus(data.message || "Postmaster connected, but no traffic data is available yet.");
      } else {
        setPostmasterStatus(`Postmaster health loaded for ${data.date || "latest available date"}.`);
      }
    } catch (error: any) {
      console.error("Postmaster health error:", error);
      setPostmasterHealth(null);

      if (error?.name === "AbortError") {
        setPostmasterStatus("Postmaster request timed out. The dashboard is still safe; try again after refreshing credentials or increasing Google API response time.");
      } else {
        setPostmasterStatus(`Postmaster failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      window.clearTimeout(timeout);
      setPostmasterLoading(false);
    }
  };

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
    setEmailError("");
    setDuplicateLead(null);
    setAllowDuplicateSend(false);
    setContactMemoryWarning(null);
    setAllowCooldownOverride(false);
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

      const res = await fetch("/api/trackflow/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          subject,
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSendStatus(scheduledAtISO ? "Success! Email Scheduled." : "Success! Outreach Launched.");
        await refreshLeads();
        await loadFollowupSummary(true);
        resetOutreachForm();
      } else if (data.warningOnly && data.code === "cooldown_active") {
        setContactMemoryWarning(data.contactMemory || null);
        setAllowCooldownOverride(false);
        setSendStatus("Cooldown warning: review and enable override if you still want to send.");
      } else {
        setSendStatus("Failed: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      console.error(error);
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


  const cleanupBuckets: { id: CleanupBucket; label: string; note: string }[] = [
    { id: "due", label: "Due Now", note: "Safe no-reply candidates ready for cleanup" },
    { id: "cold", label: "Cold No Reply", note: "No open/click after 45+ days" },
    { id: "warm", label: "Warm No Reply", note: "Open/click but no reply after 90+ days" },
    { id: "replied", label: "1 Year Review", note: "Replied/interested leads for manual review" },
    { id: "protected", label: "Protected", note: "Suppression/do-not-contact candidates" },
    { id: "upcoming", label: "Upcoming", note: "Not due yet, but scheduled by policy" },
  ];

  const formatSourceLabel = (sourceKind?: string, source?: string) => {
    if (sourceKind === "sheet") return "Sheet Lead";
    if (sourceKind === "test") return "Test Email";
    if (String(source || "").includes("google_sheet")) return "Sheet Lead";
    return "Cold Email";
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

  useEffect(() => {
    if (activeTab === "sheet") {
      loadSheetLeads(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sheetLeadFilter, sheetApprovalFilter, sheetSendFilter]);

  useEffect(() => {
    if (activeTab === "cleanup") {
      loadCleanupCandidates(leadCleanup.bucket, false);
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
    const subjectFromSheet = sheetValue(lead, "Email Subject");
    const bodyFromSheet = sheetValue(lead, "Email Body");

    setEmail(sheetValue(lead, "Final Email"));
    setClientName(sheetValue(lead, "Decision Maker"));
    setCompanyName(sheetValue(lead, "Business Name"));
    setWebsite(sheetValue(lead, "Website URL"));
    setBusinessType(sheetValue(lead, "Lead Label") || sheetValue(lead, "Lead Status"));
    setSubject(subjectFromSheet);
    setMessage(bodyFromSheet);
    setSelectedService(service);
    setReportUrl(sheetValue(lead, "Report URL"));
    setReportButtonText("View short audit note");
    setSendStatus(
      readiness.ready
        ? `Loaded row ${lead.rowNumber}. Verified sheet lead is ready for outreach.`
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
    const subjectFromSheet = sheetValue(lead, "Email Subject");
    const bodyFromSheet = sheetValue(lead, "Email Body");
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

  const renderStatCard = (label: string, value: number | string, icon: ReactNode, tone = "blue") => {
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
  };

  const renderOverview = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard("Cached Leads", analytics.total, <Mail size={22} />)}
          {renderStatCard("Hot Leads", analytics.hot, <Flame size={22} />, "orange")}
          {renderStatCard("Replies", analytics.replied, <MessageSquare size={22} />, "green")}
          {renderStatCard("Bounces", analytics.bounced, <AlertCircle size={22} />, "red")}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Follow-up Today</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">One-glance follow-up report</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">
                {followupSummary.loadedAt ? `Last refreshed ${new Date(followupSummary.loadedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}` : "Not refreshed yet"}
                {followupSummary.error ? ` · ${followupSummary.error}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadFollowupSummary(true)}
              disabled={followupSummary.loading}
              className="px-5 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
            >
              <RefreshCw size={14} className={followupSummary.loading ? "animate-spin" : ""} /> Refresh Report
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3 mt-5">
            {[
              ["Due now", followupSummary.dueNow, "text-green-600"],
              ["Scheduled", followupSummary.scheduled, "text-blue-600"],
              ["Sent today", `${followupSummary.sentToday}/${followupSummary.dailyLimit}`, "text-gray-900"],
              ["Remaining", followupSummary.remainingToday, "text-blue-600"],
              ["Per run", followupSummary.batchPerRun, "text-purple-600"],
              ["Wait 1st open", followupSummary.waitingFirstOpen, "text-orange-500"],
              ["Wait new open", followupSummary.waitingNewEngagement, "text-orange-500"],
              ["Template block", followupSummary.templateBlocked, "text-red-500"],
              ["Retry/fail", followupSummary.failedRetry + followupSummary.failedFinal, "text-red-600"],
              ["Blocked", followupSummary.blocked, "text-gray-500"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className={`text-lg font-black ${tone}`}>{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white rounded-[30px] border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Firebase Usage Monitor</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">Free-tier safety overview</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">
                {firebaseUsage.loadedAt ? `Last refreshed ${new Date(firebaseUsage.loadedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}` : "Not refreshed yet"}
                {firebaseUsage.error ? ` · ${firebaseUsage.error}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadFirebaseUsage(true)}
              disabled={firebaseUsage.loading}
              className="px-5 py-3 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2 justify-center"
            >
              <RefreshCw size={14} className={firebaseUsage.loading ? "animate-spin" : ""} /> Refresh Usage
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              ["Reads", `${firebaseUsage.usage.estimatedReadsToday}/${firebaseUsage.quota.readsPerDay}`, `${firebaseUsage.usage.readPercent}%`],
              ["Writes", `${firebaseUsage.usage.estimatedWritesToday}/${firebaseUsage.quota.writesPerDay}`, `${firebaseUsage.usage.writePercent}%`],
              ["Storage", `${firebaseUsage.usage.estimatedStorageMb} MB/${firebaseUsage.quota.storageMb} MB`, `${firebaseUsage.usage.storagePercent}%`],
              ["Deletes", `${firebaseUsage.usage.estimatedDeletesToday}/${firebaseUsage.quota.deletesPerDay}`, `${firebaseUsage.usage.deletePercent}%`],
            ].map(([label, value, percent]) => (
              <div key={String(label)} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-sm font-black text-gray-900">{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{label} · {percent}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
            {[
              ["Total leads", firebaseUsage.counts.leadCount],
              ["Active", firebaseUsage.counts.activeLeadCount],
              ["Archived", firebaseUsage.counts.archivedLeadCount],
              ["Trash", firebaseUsage.counts.trashedLeadCount],
              ["Events", firebaseUsage.counts.emailEventCount],
              ["Suppressed", firebaseUsage.counts.suppressionCount],
              ["Initial today", firebaseUsage.counts.initialSentToday],
              ["FUP today", firebaseUsage.counts.followupSentToday],
            ].map(([label, value]) => (
              <div key={String(label)} className="px-3 py-3 rounded-2xl bg-white border border-gray-100">
                <p className="text-base font-black text-gray-900">{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={cleanupLoading} onClick={() => runSystemCleanup("archive_replied", 30)} className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-[9px] font-black uppercase disabled:opacity-40">Archive replied 30d+</button>
            <button type="button" disabled={cleanupLoading} onClick={() => runSystemCleanup("archive_finished", 30)} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[9px] font-black uppercase disabled:opacity-40">Archive finished 30d+</button>
            <button type="button" disabled={cleanupLoading} onClick={() => runSystemCleanup("trash_test_leads", 1)} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[9px] font-black uppercase disabled:opacity-40">Trash test leads</button>
            <button type="button" disabled={cleanupLoading} onClick={() => runSystemCleanup("delete_old_events", 90)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase disabled:opacity-40">Delete events 90d+</button>
          </div>
          <p className="text-[9px] font-bold text-gray-400 mt-3">{firebaseUsage.note || "Values are practical estimates. Firebase Console remains the final quota source."}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Hot Lead Priority</h2>
              <button
                type="button"
                onClick={() => setActiveTab("leads")}
                className="text-[10px] font-black text-blue-600 uppercase"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {sortedHotLeads.length === 0 ? (
                <p className="text-xs font-bold text-gray-400">No hot leads yet.</p>
              ) : (
                sortedHotLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedLead(lead)}
                    className="w-full p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-gray-100 text-left transition-all"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">{lead.name || "Unknown"} / {lead.company_name || "No Company"}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate">{lead.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-orange-600">Score {leadScore(lead)}</p>
                        <p className="text-[9px] font-black text-gray-400">O:{lead.open_count || 0} C:{lead.click_count || 0}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-black text-white rounded-[35px] p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-lg font-black uppercase tracking-tighter mb-6">Automation Health</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white/50">Trigger Mode</span>
                  <span>Open/Click</span>
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white/50">Daily Follow-up Limit</span>
                  <span>{dailyFollowupLimit}</span>
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white/50">Active Leads</span>
                  <span>{leads.filter((l) => !l.stopAutomation && ACTIVE_STATUSES.has(String(l.status || ""))).length}</span>
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white/50">Suppressed</span>
                  <span>{analytics.bounced + analytics.unsubscribed}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("automation")}
                className="w-full mt-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase"
              >
                Manage Automation
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/30 blur-[80px] rounded-full" />
          </div>
          <div className="p-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {filteredLeads.length} filtered from {leads.length} cached lead(s)
            </p>
            <button
              type="button"
              onClick={fetchMoreLeads}
              disabled={loadingMoreLeads || !hasMoreLeads}
              className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-2"
            >
              <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading more..." : "See more leads") : "No more leads"}
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderSheetLeads = () => {
    const approvedReady = sheetLeads.filter((lead) => getSheetReadiness(lead).ready).length;

    const selectedReady = sheetLeads.filter((lead) => selectedSheetRows.includes(Number(lead.rowNumber)) && getSheetReadiness(lead).ready).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard("Sheet Leads", sheetLeads.length, <FileText size={22} />)}
          {renderStatCard("Qualified Ready", approvedReady, <CheckCircle2 size={22} />, "green")}
          {renderStatCard("Selected", selectedReady, <MousePointer2 size={22} />, "orange")}
          {renderStatCard("Active Sender", activeSender ? activeSender.email.split("@")[0] : "N/A", <Mail size={22} />)}
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
                onChange={(e: any) => setSheetLeadFilter(e.target.value)}
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
                onChange={(e: any) => setSheetApprovalFilter(e.target.value)}
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
                onChange={(e: any) => setSheetSendFilter(e.target.value)}
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
                disabled={sheetLoading || leads.length === 0}
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
                    <input
                      type="checkbox"
                      checked={
                        sheetLeads.length > 0 &&
                        sheetLeads
                          .filter((lead) => getSheetReadiness(lead).ready)
                          .every((lead) => selectedSheetRows.includes(Number(lead.rowNumber)))
                      }
                      onChange={toggleAllVisibleSheetRows}
                    />
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
                        <p className={`mt-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase leading-4 ${readiness.ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
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
                            onClick={async () => {
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
                            }}
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
  };

  const renderOutreach = () => {
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

    const qualityChecks = [
      { label: "Valid recipient email", ok: isEmailPatternValid(email) },
      { label: "Sender selected", ok: Boolean(activeSender) },
      { label: "Service selected", ok: Boolean(selectedService) },
      { label: "Subject added", ok: Boolean(subject.trim()) },
      { label: "Message body ready", ok: Boolean(stripHtml(message)) },
      { label: "Links kept minimal", ok: totalLinkCount <= 2 },
      { label: "Secure /r report link valid or empty", ok: !reportUrl.trim() || Boolean(safeReportUrl && isSecureReportUrl(safeReportUrl)) },
      { label: "No duplicate lead", ok: !duplicateLead || allowDuplicateSend },
      { label: "Cooldown memory cleared/overridden", ok: !contactMemoryWarning || allowCooldownOverride },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-4 lg:p-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
            <div className="xl:col-span-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Sender</p>
              <p className="mt-1 text-sm font-black text-gray-900 truncate">{activeSender?.name || "No Sender"}</p>
              <p className="text-[10px] font-bold text-gray-400 truncate">{activeSender?.email || "Select sender"}</p>
            </div>

            <div className="xl:col-span-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase">Sent</p>
                <p className="text-xl font-black text-gray-900">{senderCount}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase">Left</p>
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
                  <p className="text-[10px] font-bold text-gray-400">Last saved at {lastDraftSavedAt}. Refresh হলেও draft restore হবে।</p>
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
          <div className="xl:col-span-3 space-y-5">
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
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isLimitReached ? "bg-red-100 text-red-600" : "bg-white text-gray-500"}`}>
                          {count}/{sender.limit}
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

          <div className="xl:col-span-5 bg-white p-6 lg:p-8 rounded-[35px] shadow-xl border border-gray-50">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Professional Email Composer</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Clean body, cursor tags, direct send</p>
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
                      className="min-h-[340px] p-6 bg-white outline-none text-gray-800 font-medium email-editor-content"
                    />
                  </EditorProvider>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-gray-900">Include Clean Signature</p>
                    <p className="text-[10px] font-bold text-gray-400">Text/table signature will show the real inbox: {MAIN_INBOX_EMAIL} for replies.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeSignature((prev) => !prev)}
                    className={`w-14 h-8 rounded-full p-1 transition-all ${includeSignature ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span className={`block w-6 h-6 rounded-full bg-white transition-all ${includeSignature ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-500 ml-1 uppercase">Schedule Later</span>
                  <input
                    type="datetime-local"
                    min={minDateTime}
                    className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm border-2 border-blue-100"
                    value={scheduledTime}
                    onChange={(e: any) => setScheduledTime(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSend}
                  className="w-full py-5 rounded-3xl font-black text-lg bg-black text-white hover:bg-blue-600 transition-all shadow-xl flex justify-center items-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Send Outreach</>}
                </button>
              </div>

              {sendStatus && (
                <div className="text-center text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex justify-center items-center gap-2">
                  <CheckCircle2 size={14} /> {sendStatus}
                </div>
              )}
            </form>
          </div>

          <div className="xl:col-span-4 space-y-5">
            <div className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-xl sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <Eye size={18} className="text-blue-600" /> Live Preview
                </h2>
                <span className="text-[9px] font-black text-gray-400 uppercase">Email View</span>
              </div>

              <div className="rounded-[28px] border border-gray-200 overflow-hidden bg-white">
                <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500"><b>From:</b> {activeSender ? `${activeSender.name} <${activeSender.email}>` : "No sender"}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>Reply-To:</b> {MAIN_INBOX_EMAIL}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>To:</b> {email || "client@example.com"}</p>
                  <p className="text-[10px] font-bold text-gray-500"><b>Subject:</b> {subject || "Subject preview"}</p>
                </div>

                <div className="p-5 text-sm leading-7 text-gray-800">
                  {stripHtml(previewMessage) ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedPreviewMessage }} />
                  ) : (
                    <p className="text-gray-400 italic">Write your email body to preview here...</p>
                  )}

                  {safeReportUrl && (
                    <div className="mt-5 text-sm">
                      Short audit note: <span className="text-blue-600 font-bold underline">{reportButtonText || "View short audit note"}</span>
                    </div>
                  )}

                  {includeSignature ? (
                    <div dangerouslySetInnerHTML={{ __html: buildPreviewSignature(activeSender, "PREVIEW", "full") }} />
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
  };


  const renderScheduledEmails = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Scheduled Email Manager
            </p>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">Edit, Cancel, or Send Scheduled Emails</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 max-w-2xl">
              Only emails with status <b>scheduled</b> are editable here. Already-sent emails stay protected so follow-up automation remains safe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadScheduledEmails(true)}
            disabled={scheduledLoading}
            className="px-5 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:bg-gray-300"
          >
            {scheduledLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
          </button>
        </div>

        {scheduledStatus && (
          <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-4 text-blue-700 text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={15} /> {scheduledStatus}
          </div>
        )}

        <div className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[980px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Send Time", "Recipient", "Subject", "Service", "Sender", "Actions"].map((header) => (
                    <th key={header} className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {scheduledEmails.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-black text-gray-900">{formatDate(lead.scheduledAt)}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">{lead.status || "scheduled"}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-black text-gray-900">{lead.name || lead.company_name || "Unnamed"}</p>
                      <p className="text-[10px] font-bold text-gray-400">{lead.email || lead.emailLower}</p>
                    </td>
                    <td className="p-4 max-w-sm">
                      <p className="text-xs font-black text-gray-900 truncate">{lead.subject || "No subject"}</p>
                      <p className="text-[10px] font-bold text-gray-400 truncate">{stripHtml(lead.message || "") || "No body"}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">{lead.service || "N/A"}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] font-black text-gray-700">{lead.sender_name || "Sender"}</p>
                      <p className="text-[10px] font-bold text-gray-400">{lead.sender_email || "N/A"}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openScheduledEditor(lead)}
                          className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => sendScheduledSoon(lead.id)}
                          className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase"
                        >
                          Send Soon
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelScheduledEmail(lead.id)}
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {scheduledEmails.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Clock size={26} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-black text-gray-400 uppercase">No scheduled emails found.</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">Schedule one from the Send Email tab and it will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {scheduledEdit && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setScheduledEdit(null)} />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Edit Scheduled Email</p>
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter">{scheduledEdit.email}</h3>
                  </div>
                  <button type="button" onClick={() => setScheduledEdit(null)} className="p-3 rounded-2xl bg-gray-50 text-gray-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4 pb-32">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Recipient email" value={scheduledEdit.email} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, email: e.target.value })} />
                    <input className="p-4 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm" type="datetime-local" min={minDateTime} value={scheduledEdit.scheduledTime} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, scheduledTime: e.target.value })} />
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Client name" value={scheduledEdit.clientName} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, clientName: e.target.value })} />
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Company name" value={scheduledEdit.companyName} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, companyName: e.target.value })} />
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Website" value={scheduledEdit.website} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, website: e.target.value })} />
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Business type" value={scheduledEdit.businessType} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, businessType: e.target.value })} />
                    <select className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={scheduledEdit.selectedService} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, selectedService: e.target.value as ServiceId })}>
                      {SERVICE_NAMES.map((service) => <option key={service} value={service}>{service}</option>)}
                    </select>
                    <select className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={scheduledEdit.selectedSender} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, selectedSender: e.target.value })}>
                      {ACTIVE_SENDERS.map((sender: any) => <option key={sender.id} value={sender.id}>{sender.name} — {sender.email}</option>)}
                    </select>
                  </div>

                  <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-lg" placeholder="Subject" value={scheduledEdit.subject} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, subject: e.target.value })} />

                  <div className="rounded-[26px] border-2 border-gray-100 overflow-hidden bg-white">
                    <EditorProvider>
                      <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                        <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnNumberedList /> <BtnBulletList /> <BtnClearFormatting />
                      </Toolbar>
                      <Editor value={scheduledEdit.message} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, message: e.target.value })} className="min-h-[260px] p-5 bg-white outline-none text-gray-800 font-medium email-editor-content" />
                    </EditorProvider>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Report URL optional" value={scheduledEdit.reportUrl} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, reportUrl: e.target.value })} />
                    <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Report button text" value={scheduledEdit.reportButtonText} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, reportButtonText: e.target.value })} />
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                    <input type="checkbox" checked={scheduledEdit.includeSignature} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, includeSignature: e.target.checked })} className="w-4 h-4" />
                    <span className="text-xs font-black text-gray-700 uppercase">Include signature</span>
                  </label>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[11px] font-bold text-amber-700 leading-relaxed">
                    Save Changes updates only the scheduled draft. Send Soon moves it to the next scheduled-initials cron run. Cancel stops it safely before sending.
                  </div>
                </div>

                <div className="fixed bottom-0 right-0 w-full max-w-2xl p-5 bg-white/90 backdrop-blur border-t border-gray-100 grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => cancelScheduledEmail(scheduledEdit.leadId)} disabled={scheduledSaving} className="py-4 rounded-2xl bg-red-50 text-red-600 text-xs font-black uppercase disabled:opacity-60">
                    Cancel
                  </button>
                  <button type="button" onClick={() => sendScheduledSoon(scheduledEdit.leadId)} disabled={scheduledSaving} className="py-4 rounded-2xl bg-blue-50 text-blue-600 text-xs font-black uppercase disabled:opacity-60">
                    Send Soon
                  </button>
                  <button type="button" onClick={saveScheduledEdit} disabled={scheduledSaving} className="py-4 rounded-2xl bg-black text-white text-xs font-black uppercase disabled:bg-gray-300 flex items-center justify-center gap-2">
                    {scheduledSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderLeads = () => {
    const allLoadedSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => selectedLeadIds.includes(lead.id));
    const selectedCount = selectedLeadIds.length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Lead Management</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Professional archive, trash, restore, and cleanup control</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter })}
              disabled={loading}
              className="px-4 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh latest 20
            </button>
            <button
              type="button"
              onClick={fetchMoreLeads}
              disabled={loadingMoreLeads || !hasMoreLeads}
              className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
            >
              <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading..." : "See more 20") : "All loaded"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard("Loaded", leads.length, <Mail size={22} />)}
          {renderStatCard("Filtered", filteredLeads.length, <Database size={22} />, "blue")}
          {renderStatCard("Selected", selectedCount, <CheckCircle2 size={22} />, "green")}
          {renderStatCard("View", leadView.toUpperCase(), <Layers size={22} />, "orange")}
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={leadView} onChange={(e: any) => setLeadView(e.target.value as LeadViewFilter)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="trash">Trash</option>
              <option value="all">All</option>
            </select>
            <select value={selectedMonth} onChange={(e: any) => setSelectedMonth(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
              <option value="All">All Months</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={leadStatusFilter} onChange={(e: any) => setLeadStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
              <option value="All">All Status</option>
              {["scheduled", "sent", "opened", "clicked", "replied", "bounced", "spam", "unsubscribed", "cancelled", "finished"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select value={activeService} onChange={(e: any) => setActiveService(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
              <option value="All">All Services</option>
              {SERVICE_NAMES.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
            <input type="text" placeholder="Search email/company..." className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none" value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-gray-50">
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Bulk actions</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">
                {selectedCount} selected. Archive keeps history and stops automation. Trash is soft delete. Permanent delete is only for test/fake records.
                {bulkActionStatus ? ` ${bulkActionStatus}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("archive")} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[9px] font-black uppercase disabled:opacity-40">Archive</button>
              <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("restore")} className="px-4 py-2 rounded-xl bg-green-50 text-green-600 text-[9px] font-black uppercase disabled:opacity-40">Restore</button>
              <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("trash")} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[9px] font-black uppercase disabled:opacity-40">Move to trash</button>
              <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("delete_permanent")} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase disabled:opacity-40">Permanent delete</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[30px] shadow-xl border border-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <input
                      type="checkbox"
                      checked={allLoadedSelected}
                      onChange={(e: any) => {
                        if (e.target.checked) {
                          setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...filteredLeads.map((lead) => lead.id)])));
                        } else {
                          const filteredIds = new Set(filteredLeads.map((lead) => lead.id));
                          setSelectedLeadIds(selectedLeadIds.filter((id: string) => !filteredIds.has(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Information</th>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Sender</th>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Engagement</th>
                  <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => {
                  const checked = selectedLeadIds.includes(lead.id);
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-blue-50/20 cursor-pointer group transition-all">
                      <td className="p-5" onClick={(e: any) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e: any) => {
                            if (e.target.checked) setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, lead.id])));
                            else setSelectedLeadIds(selectedLeadIds.filter((id: string) => id !== lead.id));
                          }}
                        />
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600 leading-none">{lead.name || "Unknown"}</span>
                            {isHotLead(lead) && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1"><Flame size={10} /> HOT</span>}
                            {lead.archived === true && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black">ARCHIVED</span>}
                            {lead.deleted === true && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[8px] font-black">TRASH</span>}
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{lead.company_name || "No Company"}</span>
                          <span className="text-[10px] text-gray-300 font-bold">{lead.email || lead.emailLower}</span>
                        </div>
                      </td>

                      <td className="p-5">
                        <p className="text-[10px] text-gray-600 font-black">{lead.sender_name || "Sender"}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{lead.sender_email || "N/A"}</p>
                      </td>

                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${lead.status === "replied" ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-500"}`}>{lead.status || "unknown"}</span>
                          <span className="text-[9px] font-bold text-gray-400 italic">{formatDate(lead.createdAt)}</span>
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                          <div><span className="text-xs font-black text-gray-900">{lead.open_count || 0}</span><span className="block text-[8px] font-black text-gray-400 uppercase">Open</span></div>
                          <div><span className="text-xs font-black text-gray-900">{lead.click_count || 0}</span><span className="block text-[8px] font-black text-gray-400 uppercase">Click</span></div>
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e: any) => e.stopPropagation()}>
                          {lead.status !== "replied" && lead.deleted !== true && (
                            <button onClick={(e: any) => handleMarkAsReplied(lead.id, e)} className="p-3 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Mark as Replied"><CheckCircle size={16} /></button>
                          )}
                          {lead.archived !== true && lead.deleted !== true && (
                            <button onClick={(e: any) => handleArchiveLead(lead.id, e)} className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Archive lead"><Database size={16} /></button>
                          )}
                          {(lead.archived === true || lead.deleted === true) && (
                            <button onClick={(e: any) => handleRestoreLead(lead.id, e)} className="p-3 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Restore lead"><RefreshCw size={16} /></button>
                          )}
                          {lead.deleted !== true && (
                            <button onClick={(e: any) => handleDelete(lead.id, e)} className="p-3 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Move to trash"><Trash2 size={16} /></button>
                          )}
                          {lead.deleted === true && (
                            <button onClick={(e: any) => handlePermanentDeleteLead(lead.id, e)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Permanent delete"><X size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs font-black text-gray-400 uppercase">No leads found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{filteredLeads.length} filtered from {leads.length} cached lead(s)</p>
            <button type="button" onClick={fetchMoreLeads} disabled={loadingMoreLeads || !hasMoreLeads} className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-2">
              <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading more..." : "See more leads") : "No more leads"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFollowups = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[25px] shadow-sm border border-gray-100">
            {SERVICE_LIST.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setActiveFollowupService(service.id);
                  setActiveFollowupStep("step1");
                  setShowVariantLeads(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                  activeFollowupService === service.id ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                {service.icon} {service.id}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadFollowupConfig(true)}
            className="flex items-center gap-2 px-5 py-4 bg-white text-gray-500 rounded-[22px] font-black text-xs hover:bg-gray-50 shadow-sm active:scale-95 transition-all border border-gray-100"
          >
            {followupLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} REFRESH CONFIG
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setActiveFollowupStep(step);
                  setShowVariantLeads(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-tighter transition-all ${
                  activeFollowupStep === step ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <Layers size={14} /> F-{idx + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <Clock size={18} className="text-blue-500" />
            <input
              type="number"
              min="1"
              value={days}
              onChange={(e: any) =>
                updateCurrentStep({
                  ...currentStepData,
                  delay: (parseInt(e.target.value, 10) || 1) * 1440,
                })
              }
              className="w-12 bg-blue-50 rounded-xl py-1.5 text-center text-sm font-black text-blue-700 outline-none"
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Days Gap</span>
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <Zap size={18} className="text-orange-500" />
            <input
              type="number"
              min="1"
              value={dailyFollowupLimit}
              onChange={(e: any) => {
                setDailyFollowupLimit(parseInt(e.target.value, 10) || 1);
                setHasUnsavedChanges(true);
              }}
              className="w-16 bg-orange-50 rounded-xl py-1.5 text-center text-sm font-black text-orange-700 outline-none"
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Limit</span>
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <Timer size={18} className="text-purple-500" />
            <input
              type="number"
              min="1"
              max="20"
              value={followupBatchPerRun}
              onChange={(e: any) => {
                setFollowupBatchPerRun(Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, 20)));
                setHasUnsavedChanges(true);
              }}
              className="w-16 bg-purple-50 rounded-xl py-1.5 text-center text-sm font-black text-purple-700 outline-none"
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Per Run</span>
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <ShieldCheck size={18} className="text-green-500" />
            <select
              value={triggerMode}
              onChange={(e: any) => {
                setTriggerMode(e.target.value as TriggerMode);
                setHasUnsavedChanges(true);
              }}
              className="bg-green-50 rounded-xl py-1.5 px-3 text-sm font-black text-green-700 outline-none"
            >
              <option value="open_required">Open/click required</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              updateCurrentStep({
                ...currentStepData,
                variants: [...currentVariants, { id: `V${Date.now()}`, content: "" }],
              })
            }
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-[22px] font-black text-xs hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> ADD VARIANT
          </button>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            Eligible leads for {activeFollowupService} / {activeFollowupStep.toUpperCase()}:{" "}
            <span className="text-blue-600">{currentFollowupLeads.length}</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-2 font-bold">
            Current mode: Follow up only when the lead opened or clicked. No-reply-only follow-up is disabled by safety policy.
          </p>
        </div>

        <div className="p-5 rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Server Dry-run Preview</p>
              <p className="text-[11px] text-slate-300 mt-2 font-bold">
                This uses the same due-query path as the cron: nextFollowupStatus=scheduled and nextFollowupAt ≤ now. Make sure the Firestore composite index is deployed.
              </p>
              {dryRunStatus && <p className="text-[10px] text-blue-200 mt-2 font-black uppercase">{dryRunStatus}</p>}
            </div>
            <button
              type="button"
              onClick={loadFollowupDryRun}
              disabled={dryRunLoading}
              className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {dryRunLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Dry-run now
            </button>
          </div>

          {dryRunRows.length > 0 && (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900">
              {dryRunRows.slice(0, 12).map((row) => (
                <div key={row.leadId} className="p-3 border-b border-slate-800 last:border-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black text-white">{row.email}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">{row.company || row.name || "No company"} · {row.service} · F-{row.nextFollowupNumber}</p>
                  </div>
                  <div className="text-[9px] text-emerald-300 font-black uppercase max-w-md truncate">
                    {(row.reasons || []).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentVariants.map((variant, index) => {
            const vIndex = validCurrentVariants.findIndex((v) => v.id === variant.id);
            const targetEmails =
              vIndex === -1 || validCurrentVariants.length === 0
                ? []
                : currentFollowupLeads.filter((_, idx) => idx % validCurrentVariants.length === vIndex);

            return (
              <div key={variant.id} className="bg-white rounded-[40px] shadow-xl border border-gray-50 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <span className="text-[10px] font-black px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-widest">
                    VARIATION {index + 1}
                  </span>
                  <button type="button" onClick={() => removeVariant(variant.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50">
                    <EditorProvider>
                      <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                        <BtnBold /> <BtnItalic /> <BtnClearFormatting />
                        <div className="ml-auto flex gap-1 flex-wrap">
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{name}")} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase">
                            <UserPlus size={12} className="inline mr-1" /> {"{Name}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{company}")} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">
                            <Building2 size={12} className="inline mr-1" /> {"{Company}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{website}")} className="px-3 py-1 bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase">
                            {"{Website}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{service}")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase">
                            {"{Service}"}
                          </button>
                        </div>
                      </Toolbar>
                      <Editor
                        value={variant.content || ""}
                        onChange={(e: any) => updateVariantContent(variant.id, e.target.value)}
                        className="min-h-[250px] p-5 outline-none text-gray-800 email-editor-content"
                      />
                    </EditorProvider>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase">
                    <span className="px-2 py-1 rounded-lg bg-white text-gray-400 border border-gray-100">
                      {countWordsFromHtml(variant.content)} Words
                    </span>
                    <span className={`px-2 py-1 rounded-lg border ${countLinksFromHtml(variant.content) > 1 ? "bg-red-50 text-red-500 border-red-100" : "bg-white text-gray-400 border-gray-100"}`}>
                      {countLinksFromHtml(variant.content)} Links
                    </span>
                    <span className={`px-2 py-1 rounded-lg border ${getFollowupRiskLabel(variant.content).tone}`}>
                      {getFollowupRiskLabel(variant.content).label}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                      Compact signature auto-added
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowVariantLeads(showVariantLeads === variant.id ? null : variant.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border border-gray-100"
                  >
                    <span className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2">
                      <Mail size={14} className="text-blue-500" /> Active Leads ({targetEmails.length})
                    </span>
                    {showVariantLeads === variant.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showVariantLeads === variant.id && (
                    <div className="mt-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-gray-100">
                      {targetEmails.length === 0 ? (
                        <p className="text-center py-4 text-gray-400 text-[10px] font-bold uppercase">No matching leads in this step</p>
                      ) : (
                        targetEmails.map((lead) => (
                          <div key={lead.id} className="flex flex-col p-2 border-b last:border-0 hover:bg-blue-50">
                            <div className="flex justify-between gap-2">
                              <span className="text-[11px] font-bold text-gray-700 truncate">{lead.email || lead.emailLower}</span>
                              <span className="text-[9px] text-blue-500 font-black whitespace-nowrap">
                                O: {lead.open_count || 0} / C: {lead.click_count || 0}
                              </span>
                            </div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">
                              Status: {lead.status} | Step: {lead.follow_up_count || 0}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-8 left-0 w-full max-w-md mx-auto px-6 z-50">
          <button
            type="button"
            onClick={saveFollowupSettings}
            disabled={followupSaving || !hasUnsavedChanges}
            className={`w-full p-5 rounded-[30px] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 border-4 border-white ${
              hasUnsavedChanges ? "bg-blue-600 text-white scale-105 shadow-blue-300" : "bg-gray-200 text-gray-400"
            }`}
          >
            {followupSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> SAVE FOLLOW-UP SETTINGS</>}
          </button>
        </div>
      </div>
    );
  };


  const renderCleanupManager = () => {
    const selectedCount = selectedCleanupIds.length;
    const eligibleCount = leadCleanup.rows.filter((row: CleanupCandidate) => row.eligible && !row.protectedLead).length;
    const sheetLinkedCount = leadCleanup.rows.filter((row: CleanupCandidate) => row.sheetLinked).length;

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
              onClick={() => loadCleanupCandidates(leadCleanup.bucket as CleanupBucket, true)}
              disabled={leadCleanup.loading || leadCleanup.actionLoading}
              className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
            >
              <Database size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard("Candidates", leadCleanup.rows.length, <Database size={22} />)}
          {renderStatCard("Eligible", eligibleCount, <CheckCircle2 size={22} />, "green")}
          {renderStatCard("Selected", selectedCount, <MousePointer2 size={22} />, "orange")}
          {renderStatCard("Sheet Linked", sheetLinkedCount, <FileText size={22} />, "blue")}
        </div>

        <div className="bg-white border border-gray-100 rounded-[30px] p-5 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {cleanupBuckets.map((bucket) => (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => {
                    setLeadCleanup((prev: CleanupState) => ({ ...prev, bucket: bucket.id }));
                    loadCleanupCandidates(bucket.id, true);
                  }}
                  className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                    leadCleanup.bucket === bucket.id ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
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
                disabled={leadCleanup.actionLoading || selectedCount === 0}
                onClick={() => deleteSelectedCleanupWithMemory("delete")}
                className="px-4 py-3 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete Both + Memory
              </button>
              <button
                type="button"
                disabled={leadCleanup.actionLoading || selectedCount === 0}
                onClick={() => deleteSelectedCleanupWithMemory("mark")}
                className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase disabled:opacity-40"
              >
                Delete Firebase + Mark Sheet
              </button>
              <button
                type="button"
                disabled={leadCleanup.actionLoading || selectedCount === 0}
                onClick={() => skipSelectedCleanup(30)}
                className="px-4 py-3 rounded-2xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase disabled:opacity-40"
              >
                Skip 30 Days
              </button>
              <button
                type="button"
                disabled={leadCleanup.actionLoading || selectedCount === 0}
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
                      checked={leadCleanup.rows.length > 0 && leadCleanup.rows.every((row) => selectedCleanupIds.includes(row.leadId))}
                      onChange={(e: any) => {
                        setSelectedCleanupIds(e.target.checked ? leadCleanup.rows.map((row: CleanupCandidate) => row.leadId) : []);
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
                            <a href={normalizeOptionalUrl(row.website) || "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold inline-flex items-center gap-1 mt-1">
                              Open website <ExternalLink size={12} />
                            </a>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${row.sheetLinked ? "bg-blue-50 text-blue-600" : row.sourceKind === "test" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"}`}>
                            {formatSourceLabel(row.sourceKind, row.source)}
                          </span>
                          {row.sheetRowNumber ? <p className="text-[10px] font-bold text-gray-400 mt-2">Sheet Row #{row.sheetRowNumber}</p> : <p className="text-[10px] font-bold text-gray-400 mt-2">Sheet not linked</p>}
                        </td>
                        <td className="p-4 align-top min-w-[220px]">
                          <p className="text-xs font-black text-gray-900 uppercase">{row.outcome || "unknown"}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">{row.reason}</p>
                          <p className="text-[10px] font-black text-blue-600 mt-2">Open {row.openCount || 0} · Click {row.clickCount || 0} · F{row.followUpCount || 0}</p>
                        </td>
                        <td className="p-4 align-top min-w-[220px]">
                          <p className="text-xs font-black text-gray-900">{row.daysOld || 0} days old</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">Last: {row.lastContactedAt ? formatDate(row.lastContactedAt) : "N/A"}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">Due: {row.dueAt ? formatDate(row.dueAt) : "N/A"}</p>
                        </td>
                        <td className="p-4 align-top min-w-[220px]">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${row.eligible && !row.protectedLead ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-700"}`}>
                            {row.eligible && !row.protectedLead ? "Safe cleanup due" : row.protectedLead ? "Protected/review" : "Not due"}
                          </span>
                          <p className="text-[10px] font-bold text-gray-400 mt-2">
                            Memory: {row.memoryMonths || row.cooldownMonths || 0} months
                          </p>
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
  };


  const renderAnalytics = () => {
    const senderPerformance = ACTIVE_SENDERS.map((sender) => {
      const senderLeads = leads.filter((lead) => lead.sender_email === sender.email);
      const replied = senderLeads.filter((lead) => lead.status === "replied").length;
      const opened = senderLeads.filter((lead) => Number(lead.open_count || 0) > 0).length;
      const clicked = senderLeads.filter((lead) => Number(lead.click_count || 0) > 0).length;

      return {
        ...sender,
        total: senderLeads.length,
        replied,
        opened,
        clicked,
      };
    });

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard("Open Rate", `${analytics.openRate}%`, <Activity size={22} />)}
          {renderStatCard("Click Rate", `${analytics.clickRate}%`, <MousePointer2 size={22} />, "orange")}
          {renderStatCard("Reply Rate", `${analytics.replyRate}%`, <MessageSquare size={22} />, "green")}
          {renderStatCard("Bounce Rate", `${analytics.bounceRate}%`, <AlertCircle size={22} />, "red")}
        </div>

        <div className="bg-slate-950 rounded-[35px] border border-slate-800 p-6 shadow-sm text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Google Postmaster Tools</p>
              <p className="text-[11px] text-slate-300 mt-2 font-bold">
                Domain-level Gmail health: spam rate, reputation, authentication, and delivery errors.
              </p>
              {postmasterStatus && <p className="text-[10px] text-blue-200 mt-2 font-black uppercase">{postmasterStatus}</p>}
            </div>
            <button
              type="button"
              data-no-track="true"
              onClick={(event: any) => {
                event.preventDefault();
                event.stopPropagation();
                loadPostmasterHealth();
              }}
              disabled={postmasterLoading}
              className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {postmasterLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Load Postmaster
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <p className="text-[8px] text-slate-400 font-black uppercase">Domain</p>
              <p className="text-xs font-black mt-1">{postmasterHealth?.domain || "trackflowpro.com"}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <p className="text-[8px] text-slate-400 font-black uppercase">Spam Rate</p>
              <p className="text-xs font-black mt-1">{postmasterHealth?.spamRate != null ? `${(Number(postmasterHealth.spamRate) * 100).toFixed(3)}%` : "N/A"}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <p className="text-[8px] text-slate-400 font-black uppercase">Domain Reputation</p>
              <p className="text-xs font-black mt-1">{postmasterHealth?.domainReputation || "N/A"}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <p className="text-[8px] text-slate-400 font-black uppercase">DMARC Pass</p>
              <p className="text-xs font-black mt-1">{postmasterHealth?.dmarcSuccessRatio != null ? `${(Number(postmasterHealth.dmarcSuccessRatio) * 100).toFixed(1)}%` : "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[35px] border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-5">Sender Performance</h2>

          <div className="space-y-3">
            {senderPerformance.map((sender) => (
              <div key={sender.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-black text-gray-900">{sender.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">{sender.email}</p>
                  </div>
                  <p className="text-xs font-black text-blue-600">{sender.total} leads</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-sm font-black text-gray-900">{sender.opened}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Opened</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-sm font-black text-gray-900">{sender.clicked}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Clicked</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-sm font-black text-gray-900">{sender.replied}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Replied</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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

  if (loading) {
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

          {activeTab === "overview" && renderOverview()}
          {activeTab === "sheet" && renderSheetLeads()}
          {activeTab === "outreach" && renderOutreach()}
          {activeTab === "scheduled" && renderScheduledEmails()}
          {activeTab === "leads" && renderLeads()}
          {activeTab === "cleanup" && renderCleanupManager()}
          {activeTab === "automation" && renderFollowups()}
          {activeTab === "analytics" && renderAnalytics()}

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
