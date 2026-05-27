import type { SheetLead } from "./types";
import { isEmailPatternValid, normalizeOptionalUrl, stripHtml } from "./utils";

export function sheetValue(lead: SheetLead | null | undefined, key: keyof SheetLead | string) {
  return String(lead?.[key as keyof SheetLead] || "").trim();
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
  const sendStatus = sheetValue(lead, "Send Status").toLowerCase();
  return ["", "not sent", "failed", "needs review"].includes(sendStatus);
}

export function getSheetReadiness(lead: SheetLead) {
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
    note: "Upload PDF + register /r link before sending",
    tone: "bg-red-50 text-red-700 border-red-100",
  };
}

export function isSheetEmailOutreachCandidate(lead: SheetLead) {
  const sendStatus = sheetValue(lead, "Send Status").toLowerCase();
  const blockedSendStatuses = new Set(["sent", "scheduled", "queued", "sending", "cancelled", "blocked", "do not contact", "unsubscribed", "bounced"]);
  if (blockedSendStatuses.has(sendStatus)) return false;

  if (!isSheetEmailReady(lead)) return false;

  const emailSource = sheetValue(lead, "Email Source").toLowerCase();
  const socialPlatform = sheetValue(lead, "Social Platform").toLowerCase();
  const socialLink = sheetValue(lead, "Social Link").toLowerCase();
  const leadStatus = sheetValue(lead, "Lead Status").toLowerCase();

  const looksLinkedInOnly =
    socialPlatform.includes("linkedin") ||
    socialLink.includes("linkedin.com") ||
    leadStatus.includes("linkedin");

  const explicitlyEmailSourced =
    emailSource.includes("email") ||
    emailSource.includes("search") ||
    emailSource.includes("website") ||
    emailSource.includes("google") ||
    emailSource.includes("verified") ||
    emailSource.includes("hunter") ||
    emailSource.includes("apollo");

  // LinkedIn/manual prospects stay out of Send Email unless the operator explicitly marks an email source.
  if (looksLinkedInOnly && !explicitlyEmailSourced) return false;

  return true;
}

export function getSheetEmailQueueStatus(lead: SheetLead) {
  if (!isSheetEmailOutreachCandidate(lead)) {
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
