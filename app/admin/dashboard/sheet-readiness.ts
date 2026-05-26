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

    // Client-facing email/report links must be branded token pages, not raw files.
    return /^\/r\/[a-z0-9_-]{16,96}\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isSheetReportReady(lead: SheetLead) {
  const reportUrl = sheetValue(lead, "Report URL");
  const reportToken = sheetValue(lead, "Report Token");
  const pdfFileId = sheetValue(lead, "PDF File ID");
  const pdfViewUrl = sheetValue(lead, "PDF View URL");
  const pdfDownloadUrl = sheetValue(lead, "PDF Download URL");
  return Boolean(isSecureReportUrl(reportUrl) && reportToken && pdfFileId && (pdfViewUrl || pdfDownloadUrl));
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
