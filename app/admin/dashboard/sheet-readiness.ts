import type { SheetLead } from "./types";
import { isEmailPatternValid, normalizeOptionalUrl, stripHtml } from "./utils";

export type SheetOutreachChannel = "email" | "linkedin" | "unknown";
export type SheetSourceKind = "python_search" | "linkedin_audit" | "manual" | "unknown";

export function sheetValue(lead: SheetLead | null | undefined, key: keyof SheetLead | string) {
  return String(lead?.[key as keyof SheetLead] || "").trim();
}

function lowerSheetText(...values: string[]) {
  return values.map((value) => String(value || "").toLowerCase()).join(" ");
}

function explicitSourceFieldText(lead: SheetLead) {
  return lowerSheetText(
    sheetValue(lead, "Source Type"),
    sheetValue(lead, "sourceType"),
    sheetValue(lead, "Lead Source"),
    sheetValue(lead, "leadSource"),
    sheetValue(lead, "Audit Source"),
    sheetValue(lead, "auditSource"),
    sheetValue(lead, "Source Context"),
    sheetValue(lead, "sourceContext"),
    sheetValue(lead, "Outreach Channel"),
    sheetValue(lead, "outreachChannel"),
  );
}

function fallbackSourceFieldText(lead: SheetLead) {
  return lowerSheetText(
    sheetValue(lead, "Social Platform"),
    sheetValue(lead, "Social Link"),
    sheetValue(lead, "Notes"),
  );
}

function sourceKindFromText(text: string, allowManual: boolean): SheetSourceKind {
  if (text.includes("linkedin") || text.includes("linked in")) return "linkedin_audit";
  if (
    text.includes("python_search") ||
    text.includes("python search") ||
    text.includes("search_result") ||
    text.includes("search result") ||
    text.includes("website search") ||
    text.includes("google search") ||
    text.includes("source type: search") ||
    text.includes("lead_source: python_search") ||
    text.includes("lead source: python_search") ||
    text.includes(" search") ||
    text.includes("search ") ||
    text.includes("python")
  ) {
    return "python_search";
  }
  if (allowManual && (text.includes("manual_audit") || text.includes("manual audit") || text.includes("source type: manual"))) return "manual";
  return "unknown";
}

export function getSheetSourceKind(lead: SheetLead): SheetSourceKind {
  const explicit = explicitSourceFieldText(lead);
  const explicitKind = sourceKindFromText(explicit, true);
  if (explicitKind !== "unknown") return explicitKind;

  // Fallback is deliberately conservative. "Email Source: Manual / verified by user"
  // means the email address was manually verified, not that the audit source is manual.
  return sourceKindFromText(fallbackSourceFieldText(lead), false);
}

export function getSheetSourceLabel(lead: SheetLead): string {
  const kind = getSheetSourceKind(lead);
  if (kind === "python_search") return "Python Search";
  if (kind === "linkedin_audit") return "LinkedIn Audit";
  if (kind === "manual") return "Manual Source";
  return "Source Unknown";
}


function normalizedSendStatus(lead: SheetLead) {
  return sheetValue(lead, "Send Status").toLowerCase();
}

function isBlockedSendStatus(status: string) {
  return new Set(["sent", "scheduled", "queued", "sending", "cancelled", "blocked", "do not contact", "unsubscribed", "bounced"]).has(status);
}

export function isSheetEmailReady(lead: SheetLead) {
  return isEmailPatternValid(sheetValue(lead, "Final Email"));
}

export function isSheetMessageReady(lead: SheetLead) {
  return Boolean(stripHtml(sheetValue(lead, "Email Body"))) && Boolean(sheetValue(lead, "Email Subject"));
}

function extractReportTokenFromUrl(value: string) {
  const url = normalizeOptionalUrl(value);
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "r" && parts[1]) return parts[1];
    if (parts[0] === "tracking-review" && parts[2]) return parts[2];
  } catch {}

  return "";
}

export function isSecureReportUrl(value: string) {
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

    // Client-facing links may use either the short /r/{token} page or
    // the full /tracking-review/{domainSlug}/{token} page. Direct file links stay blocked.
    return Boolean(extractReportTokenFromUrl(url));
  } catch {
    return false;
  }
}

export function isSheetReportReady(lead: SheetLead) {
  const reportUrl = sheetValue(lead, "Report URL");
  const reportToken = sheetValue(lead, "Report Token") || extractReportTokenFromUrl(reportUrl);

  // For Send Email review, the secure report page URL + token is enough.
  // PDF/B2 details can be checked on the secure page backend and should not hide a ready lead from the drawer.
  return Boolean(isSecureReportUrl(reportUrl) && reportToken);
}

export function isSheetApprovalReady(lead: SheetLead) {
  const approval = sheetValue(lead, "Approval Status").toLowerCase();
  return ["approved", "manual approved", "system qualified", "send ready"].includes(approval);
}

export function isSheetSendStatusReady(lead: SheetLead) {
  const sendStatus = normalizedSendStatus(lead);
  return ["", "not sent", "failed", "needs review"].includes(sendStatus);
}

export function getSheetOutreachChannel(lead: SheetLead): SheetOutreachChannel {
  const explicitChannel = lowerSheetText(
    sheetValue(lead, "Outreach Channel"),
    sheetValue(lead, "outreachChannel"),
    sheetValue(lead, "Channel"),
    sheetValue(lead, "Email Outreach Allowed"),
    sheetValue(lead, "LinkedIn Outreach Allowed"),
  );

  const emailAllowed = sheetValue(lead, "Email Outreach Allowed").toLowerCase();
  const linkedinAllowed = sheetValue(lead, "LinkedIn Outreach Allowed").toLowerCase();

  if (explicitChannel.includes("linkedin")) return "linkedin";
  if (explicitChannel.includes("email")) return "email";
  if (["yes", "true", "1", "allowed"].includes(emailAllowed) && !["yes", "true", "1", "allowed"].includes(linkedinAllowed)) return "email";
  if (["yes", "true", "1", "allowed"].includes(linkedinAllowed) && !["yes", "true", "1", "allowed"].includes(emailAllowed)) return "linkedin";

  const emailSource = sheetValue(lead, "Email Source").toLowerCase();
  const searchText = lowerSheetText(
    emailSource,
    sheetValue(lead, "Social Platform"),
    sheetValue(lead, "Social Link"),
    sheetValue(lead, "Lead Status"),
    sheetValue(lead, "Lead Label"),
    sheetValue(lead, "Notes"),
    sheetValue(lead, "Source Type"),
    sheetValue(lead, "sourceType"),
    sheetValue(lead, "Lead Source"),
    sheetValue(lead, "leadSource"),
    sheetValue(lead, "Audit Source"),
    sheetValue(lead, "auditSource"),
    sheetValue(lead, "Source Context"),
    sheetValue(lead, "sourceContext"),
  );

  const looksLinkedIn = searchText.includes("linkedin") || searchText.includes("linked in");
  const emailSourceHasLinkedIn = emailSource.includes("linkedin") || emailSource.includes("linked in");
  const explicitlyMovedToEmail =
    emailSource.includes("email_outreach") ||
    emailSource.includes("email outreach") ||
    emailSource.includes("use email") ||
    emailSource.includes("move to email") ||
    emailSource.includes("manual email");
  const explicitlyEmailSourced =
    explicitlyMovedToEmail ||
    (!emailSourceHasLinkedIn &&
      (emailSource.includes("email") ||
        emailSource.includes("search") ||
        emailSource.includes("website") ||
        emailSource.includes("google") ||
        emailSource.includes("verified") ||
        emailSource.includes("hunter") ||
        emailSource.includes("apollo") ||
        emailSource.includes("python")));

  // LinkedIn/manual prospects stay LinkedIn-first unless the Sheet explicitly moves them to email outreach.
  if (looksLinkedIn && !explicitlyEmailSourced) return "linkedin";
  if (isSheetEmailReady(lead)) return "email";
  if (looksLinkedIn) return "linkedin";
  return "unknown";
}

export function isSheetLinkedInOutreachCandidate(lead: SheetLead) {
  return getSheetOutreachChannel(lead) === "linkedin";
}

export function isSheetEmailOutreachCandidate(lead: SheetLead) {
  const sendStatus = normalizedSendStatus(lead);
  if (isBlockedSendStatus(sendStatus)) return false;
  if (!isSheetEmailReady(lead)) return false;
  return getSheetOutreachChannel(lead) === "email";
}

export function getSheetReadiness(lead: SheetLead) {
  const blockers: string[] = [];
  const channel = getSheetOutreachChannel(lead);

  if (channel === "linkedin") {
    if (!isSheetReportReady(lead)) blockers.push("secure report missing");
    if (!sheetValue(lead, "Social Link")) blockers.push("linkedin link missing");

    return {
      ready: blockers.length === 0,
      blockers,
      note: blockers.length ? blockers.join(" · ") : "Ready for LinkedIn/manual outreach review",
    };
  }

  if (channel !== "email") blockers.push("outreach channel unclear");
  if (!isSheetEmailReady(lead)) blockers.push("valid email missing");
  if (!isSheetApprovalReady(lead)) blockers.push("approval not ready");
  if (!isSheetSendStatusReady(lead)) blockers.push(`send status is ${sheetValue(lead, "Send Status") || "not allowed"}`);
  if (!stripHtml(sheetValue(lead, "Email Subject"))) blockers.push("email subject missing");
  if (!stripHtml(sheetValue(lead, "Email Body"))) blockers.push("email body missing");
  if (!sheetValue(lead, "Main Issue")) blockers.push("main issue missing");
  if (!isSheetReportReady(lead)) blockers.push("secure report missing");

  return {
    ready: blockers.length === 0,
    blockers,
    note: blockers.length ? blockers.join(" · ") : "Ready for Send Email review",
  };
}

export function getSheetReportStatus(lead: SheetLead) {
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
    note: "Create/register a secure report link before outreach",
    tone: "bg-red-50 text-red-700 border-red-100",
  };
}

export function getSheetChannelStatus(lead: SheetLead) {
  const channel = getSheetOutreachChannel(lead);
  const readiness = getSheetReadiness(lead);

  if (channel === "email") {
    return {
      label: "Email lead",
      note: readiness.ready ? "Ready to review in Send Email" : readiness.note,
      tone: readiness.ready ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100",
    };
  }

  if (channel === "linkedin") {
    return {
      label: "LinkedIn lead",
      note: readiness.ready ? "Keep this in LinkedIn/manual workflow" : readiness.note,
      tone: readiness.ready ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-amber-50 text-amber-700 border-amber-100",
    };
  }

  return {
    label: "Needs review",
    note: readiness.note || "Choose whether this lead belongs to Email or LinkedIn outreach.",
    tone: "bg-slate-50 text-slate-600 border-slate-100",
  };
}

export function canOpenSheetEmailComposer(lead: SheetLead) {
  return getSheetOutreachChannel(lead) === "email" && isSheetEmailReady(lead) && isSheetReportReady(lead);
}

export function getSheetEmailQueueStatus(lead: SheetLead) {
  if (!isSheetEmailOutreachCandidate(lead)) {
    const sendStatus = normalizedSendStatus(lead);
    if (["sent", "scheduled", "queued"].includes(sendStatus) && canOpenSheetEmailComposer(lead)) {
      return {
        label: "Sent — add recipient",
        note: "Primary send is already recorded. Open manually only when adding another recipient under this report.",
        tone: "bg-blue-50 text-blue-700 border-blue-100",
      };
    }

    return {
      label: "Hidden",
      note: "This row is not part of the email review queue.",
      tone: "bg-slate-50 text-slate-500 border-slate-100",
    };
  }

  const readiness = getSheetReadiness(lead);
  if (readiness.ready) {
    return {
      label: "Ready",
      note: "Open this lead in the composer and review before sending.",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }

  return {
    label: "Needs review",
    note: readiness.note,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  };
}


export type GmailOutreachStage =
  | "ready"
  | "initial_sent"
  | "followup_1"
  | "followup_2"
  | "followup_3"
  | "followup_4"
  | "closed"
  | "do_not_contact";

export const GMAIL_OUTREACH_STAGE_LABELS: Record<GmailOutreachStage, string> = {
  ready: "Ready",
  initial_sent: "Initial Sent",
  followup_1: "Follow-up 1",
  followup_2: "Follow-up 2",
  followup_3: "Follow-up 3",
  followup_4: "Follow-up 4",
  closed: "Closed",
  do_not_contact: "Do Not Contact",
};

const GMAIL_STAGE_VALUES = new Set<GmailOutreachStage>([
  "ready",
  "initial_sent",
  "followup_1",
  "followup_2",
  "followup_3",
  "followup_4",
  "closed",
  "do_not_contact",
]);

function normalizeGmailStageText(value: string): GmailOutreachStage | "" {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!text) return "";
  if (GMAIL_STAGE_VALUES.has(text as GmailOutreachStage)) return text as GmailOutreachStage;
  if (["not_sent", "ready_to_send", "new"].includes(text)) return "ready";
  if (["initial", "initial_sent", "sent_initial"].includes(text)) return "initial_sent";
  if (["followup1", "follow_up_1", "f1"].includes(text)) return "followup_1";
  if (["followup2", "follow_up_2", "f2"].includes(text)) return "followup_2";
  if (["followup3", "follow_up_3", "f3"].includes(text)) return "followup_3";
  if (["followup4", "follow_up_4", "f4"].includes(text)) return "followup_4";
  if (["done", "complete", "completed"].includes(text)) return "closed";
  if (["dnc", "blocked", "unsubscribe", "unsubscribed"].includes(text)) return "do_not_contact";
  return "";
}

export function getGmailOutreachStage(lead: SheetLead): GmailOutreachStage {
  const explicit = normalizeGmailStageText(sheetValue(lead, "Gmail Outreach Stage"));
  if (explicit) return explicit;

  const sendStatus = sheetValue(lead, "Send Status").toLowerCase();
  if (sendStatus.includes("do not contact") || sendStatus.includes("unsubscribed") || sendStatus.includes("bounced")) return "do_not_contact";
  if (sendStatus.includes("closed") || sendStatus.includes("complete")) return "closed";

  if (sheetValue(lead, "Gmail Follow-up 4 Sent At")) return "closed";
  if (sheetValue(lead, "Gmail Follow-up 3 Sent At")) return "followup_4";
  if (sheetValue(lead, "Gmail Follow-up 2 Sent At")) return "followup_3";
  if (sheetValue(lead, "Gmail Follow-up 1 Sent At")) return "followup_2";
  if (sheetValue(lead, "Gmail Initial Sent At") || sendStatus.includes("manual gmail initial sent")) return "followup_1";

  return "ready";
}

export function getGmailOutreachStageLabel(lead: SheetLead): string {
  return GMAIL_OUTREACH_STAGE_LABELS[getGmailOutreachStage(lead)];
}

export function getNextGmailStageAfterSend(stage: GmailOutreachStage): GmailOutreachStage {
  if (stage === "ready") return "followup_1";
  if (stage === "initial_sent") return "followup_1";
  if (stage === "followup_1") return "followup_2";
  if (stage === "followup_2") return "followup_3";
  if (stage === "followup_3") return "followup_4";
  if (stage === "followup_4") return "closed";
  return stage;
}

export function gmailSentAtHeaderForStage(stage: GmailOutreachStage): string {
  if (stage === "ready" || stage === "initial_sent") return "Gmail Initial Sent At";
  if (stage === "followup_1") return "Gmail Follow-up 1 Sent At";
  if (stage === "followup_2") return "Gmail Follow-up 2 Sent At";
  if (stage === "followup_3") return "Gmail Follow-up 3 Sent At";
  if (stage === "followup_4") return "Gmail Follow-up 4 Sent At";
  return "Gmail Last Sent At";
}

export function gmailSubjectHeaderForStage(stage: GmailOutreachStage): string {
  if (stage === "ready" || stage === "initial_sent") return "Gmail Initial Subject";
  if (stage === "followup_1") return "Gmail Follow-up 1 Subject";
  if (stage === "followup_2") return "Gmail Follow-up 2 Subject";
  if (stage === "followup_3") return "Gmail Follow-up 3 Subject";
  if (stage === "followup_4") return "Gmail Follow-up 4 Subject";
  return "Gmail Initial Subject";
}

export function gmailMessageHeaderForStage(stage: GmailOutreachStage): string {
  if (stage === "ready" || stage === "initial_sent") return "Gmail Initial Message";
  if (stage === "followup_1") return "Gmail Follow-up 1 Message";
  if (stage === "followup_2") return "Gmail Follow-up 2 Message";
  if (stage === "followup_3") return "Gmail Follow-up 3 Message";
  if (stage === "followup_4") return "Gmail Follow-up 4 Message";
  return "Gmail Initial Message";
}

export function getGmailOutreachSubject(lead: SheetLead, stage = getGmailOutreachStage(lead)): string {
  return (
    sheetValue(lead, gmailSubjectHeaderForStage(stage)) ||
    (stage === "ready" || stage === "initial_sent" ? sheetValue(lead, "Email Subject") : "")
  );
}

export function getGmailOutreachMessage(lead: SheetLead, stage = getGmailOutreachStage(lead)): string {
  return (
    sheetValue(lead, gmailMessageHeaderForStage(stage)) ||
    (stage === "ready" || stage === "initial_sent" ? sheetValue(lead, "Email Body") : "")
  );
}
