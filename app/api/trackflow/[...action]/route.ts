import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { google } from "googleapis";
import { z } from "zod";
import { readPdfFromB2, sanitizeB2Key } from "@/lib/trackflow-storage/b2";
import { markReportPdfDownloaded } from "@/lib/supabase-admin";
import {
  ApiError,
  buildComplianceAddressLine,
  emailDocId,
  env,
  escapeHtml,
  getAction,
  getEngagementMinuteOfDayUtc,
  htmlResponse,
  isValidEmail,
  json,
  normalizeEmail,
  plainTextFromHtml,
  readJson,
  type RouteContext,
  safeEqual,
  sanitizeOptionalUrl,
  scheduleBeforeEngagementTime,
  shiftMinuteOfDay,
  stripDangerousHtml,
  timestampFromAny,
  todayKey,
  toMillis,
  validateFollowupContent,
} from "@/lib/trackflow-api/core";
import {
  requireAdmin,
  requireCronSecret,
  requireWebhookSecret,
  unsubscribeToken,
  unsubscribeUrl,
} from "@/lib/trackflow-api/security";
import { getActiveContactMemoryWarning } from "@/lib/trackflow-email/contact-memory";
import { addEmailEvent, deleteEmailEventsForReport } from "@/lib/trackflow-email/email-events";
import { getSenderFromBody, getSenderFromLead, mapSharedSender } from "@/lib/trackflow-email/sender-selection";
import { addSuppression, isSuppressed } from "@/lib/trackflow-email/suppression";
import { createReportCleanupHandlers } from "@/lib/trackflow-cleanup/report-cleanup";
import {
  BRAND_WEBSITE,
  BRAND_WEBSITE_LABEL,
  ACTIVE_SENDERS,
  MAIN_INBOX_EMAIL,
  MAIN_INBOX_NAME,
  getDefaultSender,
  getSenderById,
} from "@/lib/senders";

/**
 * TrackFlowPro Single API Route
 * File path:
 *   app/api/trackflow/[...action]/route.ts
 *
 * This one catch-all route replaces these separate API routes:
 *   POST   /api/send-email                         -> POST   /api/trackflow/send-email
 *   DELETE /api/send-email                         -> DELETE /api/trackflow/send-email
 *   GET    /api/cron/scheduled-initials            -> GET    /api/trackflow/cron/scheduled-initials
 *   GET    /api/cron/followups                     -> GET    /api/trackflow/cron/followups
 *   POST   /api/webhooks/brevo                     -> POST   /api/trackflow/webhooks/brevo
 *   POST   /api/webhooks/reply                     -> POST   /api/trackflow/webhooks/reply
 *   GET    /api/unsubscribe                        -> GET    /api/trackflow/unsubscribe
 *   POST   /api/unsubscribe                        -> POST   /api/trackflow/unsubscribe
 *
 * Required ENV:
 *   BREVO_API_KEY=
 *   CRON_SECRET=
 *   BREVO_WEBHOOK_SECRET=
 *   REPLY_WEBHOOK_SECRET=
 *   UNSUBSCRIBE_SECRET=
 *   NEXT_PUBLIC_APP_URL=https://trackflowpro.com
 *   ALLOWED_ADMIN_EMAILS=your@email.com,another@email.com
 *
 * Optional ENV:
 *   ALLOW_UNAUTHENTICATED_ADMIN_API=false
 *   GOOGLE_OAUTH_CLIENT_ID=                 // needed when Vercel proxies/deletes Drive PDFs
 *   GOOGLE_OAUTH_CLIENT_SECRET=
 *   GOOGLE_OAUTH_REFRESH_TOKEN=
 *   DELETE_DRIVE_PDF_ON_LEAD_DELETE=true    // permanent delete only; archive/trash keeps PDFs
 *   DRIVE_PDF_DELETE_MODE=trash             // trash is safer than delete
 *   REQUIRE_DRIVE_PDF_CLEANUP_ON_LEAD_DELETE=true
 *   PERMANENT_DELETE_SHEET_MODE=mark        // mark/delete/skip for bulk permanent deletes
 *
 * Free-limit friendly architecture note:
 * - Sender list/config stays in lib/senders.ts, not Firestore.
 * - Google Sheet is used as a lead queue/staging area, not as the realtime automation database.
 * - Follow-up timing remains Firestore-based so open/click scheduling stays accurate.
 * - Sheet queue locking uses Sheet columns, not an extra Firestore lock collection.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TFP_REPORT_REGISTER_DEBUG_VERSION = "v18.79-email-preview-private-b2-register-2026-06-22";


const {
  handleSecureReportsList,
  handleReportCleanupPreview,
  handleReportCleanup,
  handleBulkReportCleanup,
  handleExpiredReportCleanupCron,
} = createReportCleanupHandlers({
  ApiError,
  requireAdmin,
  requireCronSecret,
  readJson,
  json,
});


function tfpCleanupText(value: any, fallback = ""): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function tfpCleanupSourceText(row: AnyRecord = {}): string {
  return [
    row.sourceGroup,
    row.sourceLabel,
    row.channel,
    row.source,
    row.sourceType,
    row.source_type,
    row.outreachChannel,
    row.outreach_channel,
    row.leadSource,
    row.lead_source,
    row.auditSource,
    row.audit_source,
    row.sourceContext,
    row.source_context,
    row.sourceOrigin,
    row.source_origin,
    row.sourceRole,
    row.source_role,
    row.reportMode,
    row.report_mode,
    row.trackingCase?.mode,
    row.tracking_case?.mode,
    row.reportUrl,
    row.report_url,
    row.websiteUrl,
    row.website_url,
    row.contactEmail,
    row.contact_email,
    row.companyName,
    row.company_name,
    row.businessName,
    row.business_name,
    row.domain,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function tfpCleanupNormalizeChannel(row: AnyRecord = {}): "email" | "linkedin" | "manual" | "unknown" {
  const explicit = tfpCleanupText(row.channel || row.outreachChannel || row.outreach_channel).toLowerCase();
  const text = tfpCleanupSourceText(row);

  if (explicit.includes("linkedin") || text.includes("linkedin")) return "linkedin";
  if (explicit.includes("manual") || text.includes("manual_audit") || text.includes("manual_report") || text.includes("operator_manual")) return "manual";
  if (explicit.includes("email") || text.includes("email") || text.includes("gmail") || text.includes("brevo") || text.includes("cold")) return "email";
  return "unknown";
}

function tfpCleanupIsManual(row: AnyRecord = {}): boolean {
  const text = tfpCleanupSourceText(row);
  const sourceType = tfpCleanupText(row.sourceType || row.source_type).toLowerCase().replace(/[\s-]+/g, "_");
  const sourceOrigin = tfpCleanupText(row.sourceOrigin || row.source_origin).toLowerCase().replace(/[\s-]+/g, "_");
  return (
    tfpCleanupNormalizeChannel(row) === "manual" ||
    sourceType === "manual" ||
    sourceOrigin === "manual" ||
    text.includes("manual_audit") ||
    text.includes("manual_report") ||
    text.includes("operator_manual") ||
    text.includes("direct_manual") ||
    text.includes("source_type_manual")
  );
}

function tfpCleanupIsLinkedIn(row: AnyRecord = {}): boolean {
  const text = tfpCleanupSourceText(row);
  return tfpCleanupNormalizeChannel(row) === "linkedin" || text.includes("linkedin") || text.includes("linked_in");
}

function tfpCleanupIsPythonSearch(row: AnyRecord = {}): boolean {
  const text = tfpCleanupSourceText(row);
  const sourceType = tfpCleanupText(row.sourceType || row.source_type).toLowerCase().replace(/[\s-]+/g, "_");
  const source = tfpCleanupText(row.source).toLowerCase().replace(/[\s-]+/g, "_");

  if (sourceType === "search") return true;
  if (
    text.includes("python_search") ||
    text.includes("python") ||
    text.includes("colab_direct") ||
    text.includes("colab") ||
    text.includes("search_result") ||
    text.includes("google_search") ||
    text.includes("website_search") ||
    text.includes("source_type_search") ||
    text.includes("lead_source_python_search") ||
    text.includes("audit_source_python")
  ) {
    return true;
  }

  // Backfill for older secure reports created from local search rows before
  // sourceType/leadSource were written into Firestore. These records usually
  // only saved source=lead_row_secure_page_create/update.
  if (
    !tfpCleanupIsLinkedIn(row) &&
    !tfpCleanupIsManual(row) &&
    (
      source.includes("lead_row_secure_page") ||
      source.includes("lead_row") ||
      source.includes("local_audit_b2_report_export") ||
      source.includes("local_audit_dashboard_selected_export") ||
      text.includes("lead_row_secure_page") ||
      text.includes("local_audit_b2_report_export")
    )
  ) {
    return true;
  }

  return false;
}

function tfpCleanupIsSearchEmail(row: AnyRecord = {}): boolean {
  const text = tfpCleanupSourceText(row);
  return (
    tfpCleanupIsPythonSearch(row) ||
    tfpCleanupNormalizeChannel(row) === "email" ||
    text.includes("search_email") ||
    text.includes("search") ||
    text.includes("sheet") ||
    text.includes("email") ||
    text.includes("gmail") ||
    text.includes("brevo") ||
    text.includes("cold") ||
    row.keepUnderSheetAudit === true ||
    Number(row.sheetRowNumber || row.sheet_row_number || 0) > 0 ||
    Boolean(row.email || row.leadId || row.lead_id)
  );
}

function tfpCleanupSourceGroup(row: AnyRecord = {}): "search_email" | "linkedin_manual" | "other" {
  const explicit = tfpCleanupText(row.sourceGroup || row.source_group).toLowerCase().replace(/[\s-]+/g, "_");
  if (["search_email", "python_search", "search", "email", "sheet"].includes(explicit)) return "search_email";
  if (["linkedin_manual", "linkedin", "manual", "manual_audit", "manual_report"].includes(explicit)) return "linkedin_manual";

  if (tfpCleanupIsLinkedIn(row) || tfpCleanupIsManual(row)) return "linkedin_manual";
  if (tfpCleanupIsSearchEmail(row)) return "search_email";
  return "other";
}

function tfpCleanupSourceLabel(row: AnyRecord = {}): string {
  if (row.sourceLabel || row.source_label) return tfpCleanupText(row.sourceLabel || row.source_label);
  if (tfpCleanupIsPythonSearch(row)) return "Python search audit";
  if (tfpCleanupIsLinkedIn(row)) return "LinkedIn / manual report";
  if (tfpCleanupIsManual(row)) return "Manual audit";
  if (tfpCleanupSourceGroup(row) === "search_email") return "Search / Email lead";
  return "Secure report";
}

function tfpCleanupToIso(value: any): string {
  if (!value) return "";
  const ms = toMillis(value);
  if (ms) return new Date(ms).toISOString();
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function tfpCleanupDateMillis(row: AnyRecord = {}): number {
  const candidates = [
    row.createdAt,
    row.created_at,
    row.reportCreatedAt,
    row.report_created_at,
    row.registeredAt,
    row.registered_at,
    row.updatedAt,
    row.updated_at,
    row.lastActivityAt,
    row.last_activity_at,
    row.lastSeenAt,
    row.last_seen_at,
    row.sentAt,
    row.sent_at,
    row.lastEngagedAt,
    row.last_engaged_at,
    row.lastOpenedAt,
    row.last_opened_at,
    row.lastClickedAt,
    row.last_clicked_at,
    row.lastDownloadedAt,
    row.last_downloaded_at,
    row.lastPdfDownloadedAt,
    row.last_pdf_downloaded_at,
    row.pdfExpiresAt,
    row.pdf_expires_at,
  ];

  for (const value of candidates) {
    const ms = toMillis(value) || Date.parse(String(value || ""));
    if (Number.isFinite(ms) && ms > 0) return ms;
  }

  return 0;
}

function tfpCleanupDateBoundary(value: string, end = false): number {
  const text = tfpCleanupText(value);
  if (!text) return 0;
  const ms = Date.parse(`${text}T${end ? "23:59:59.999" : "00:00:00"}`);
  return Number.isFinite(ms) ? ms : 0;
}

function tfpCleanupMatchesDate(row: AnyRecord, from: string, to: string): boolean {
  const fromMs = tfpCleanupDateBoundary(from, false);
  const toMs = tfpCleanupDateBoundary(to, true);
  if (!fromMs && !toMs) return true;

  const rowMs = tfpCleanupDateMillis(row);
  if (!rowMs) return false;
  if (fromMs && rowMs < fromMs) return false;
  if (toMs && rowMs > toMs) return false;
  return true;
}

function tfpCleanupIsContacted(row: AnyRecord = {}): boolean {
  const status = tfpCleanupText(row.contactStatus || row.contact_status).toLowerCase();
  return Boolean(
    row.contacted === true ||
      row.sentAt ||
      row.sent_at ||
      row.lastEngagedAt ||
      row.last_engaged_at ||
      Number(row.openCount || row.open_count || 0) > 0 ||
      Number(row.clickCount || row.click_count || 0) > 0 ||
      status.includes("sent") ||
      status.includes("contacted") ||
      status.includes("opened") ||
      status.includes("clicked") ||
      status.includes("replied")
  );
}

function tfpCleanupViewed(row: AnyRecord = {}): boolean {
  return Boolean(
    row.reportPageViewed ||
      row.report_page_viewed ||
      row.pdfOpened ||
      row.pdf_opened ||
      row.pdfDownloaded ||
      row.pdf_downloaded ||
      row.videoPlayClicked ||
      row.video_play_clicked ||
      row.videoWatched ||
      row.video_watched ||
      row.chatboxOpened ||
      row.chatbox_opened ||
      row.chatQuestionAsked ||
      row.chat_question_asked ||
      row.ctaClicked ||
      row.cta_clicked
  );
}

function tfpCleanupIsExpired(row: AnyRecord = {}): boolean {
  const ms = toMillis(row.pdfExpiresAt || row.pdf_expires_at) || Date.parse(String(row.pdfExpiresAt || row.pdf_expires_at || ""));
  return Number.isFinite(ms) && ms > 0 && ms <= Date.now();
}

function tfpCleanupIsCleaned(row: AnyRecord = {}): boolean {
  const status = tfpCleanupText(row.cleanupStatus || row.cleanup_status).toLowerCase();
  return row.active === false || status.includes("clean") || status.includes("delete");
}

function tfpCleanupMatchesFilter(row: AnyRecord, filter: string): boolean {
  const normalizedFilter = tfpCleanupText(filter, "all").toLowerCase().replace(/[\s-]+/g, "_");
  if (normalizedFilter === "all") return true;
  if (normalizedFilter === "active") return !tfpCleanupIsCleaned(row) && !tfpCleanupIsExpired(row);
  if (normalizedFilter === "expired") return tfpCleanupIsExpired(row);
  if (normalizedFilter === "viewed") return tfpCleanupViewed(row);
  if (normalizedFilter === "no_view") return !tfpCleanupViewed(row) && !tfpCleanupIsCleaned(row);
  if (normalizedFilter === "contacted") return tfpCleanupIsContacted(row);
  if (normalizedFilter === "not_contacted") return !tfpCleanupIsContacted(row);
  if (normalizedFilter === "manual_audit") return tfpCleanupIsManual(row);
  if (normalizedFilter === "python_search") return tfpCleanupIsPythonSearch(row) || (!tfpCleanupIsManual(row) && !tfpCleanupIsLinkedIn(row) && tfpCleanupIsSearchEmail(row));
  if (normalizedFilter === "linkedin_manual") return tfpCleanupSourceGroup(row) === "linkedin_manual" || tfpCleanupIsLinkedIn(row) || tfpCleanupIsManual(row);
  if (normalizedFilter === "search_email") return tfpCleanupSourceGroup(row) === "search_email" || tfpCleanupIsPythonSearch(row) || (!tfpCleanupIsLinkedIn(row) && !tfpCleanupIsManual(row) && tfpCleanupIsSearchEmail(row));
  return true;
}

function tfpCleanupMatchesSearch(row: AnyRecord, search: string): boolean {
  const query = tfpCleanupText(search).toLowerCase();
  if (!query) return true;
  return [
    row.domain,
    row.domainSlug,
    row.domain_slug,
    row.companyName,
    row.company_name,
    row.businessName,
    row.business_name,
    row.email,
    row.token,
    row.reportUrl,
    row.report_url,
    row.source,
    row.sourceType,
    row.leadSource,
    row.auditSource,
    row.cleanupStatus,
    row.contactStatus,
    row.contactStatusLabel,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function tfpCleanupFirstEmail(...values: any[]): string {
  for (const value of values) {
    const email = String(value || "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  }
  return "";
}

function tfpCleanupSafeUrl(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function tfpCleanupCollectStrings(value: any, depth = 0, output: string[] = []): string[] {
  if (output.length > 400 || depth > 4 || value === null || value === undefined) return output;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value || "").trim();
    if (text) output.push(text);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 80)) tfpCleanupCollectStrings(item, depth + 1, output);
    return output;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as AnyRecord).slice(0, 120)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes("raw") || normalizedKey.includes("html") || normalizedKey.includes("copy")) continue;
      tfpCleanupCollectStrings(item, depth + 1, output);
      if (output.length > 400) break;
    }
  }
  return output;
}

function tfpCleanupFirstLinkedInUrl(...values: any[]): string {
  const candidates: string[] = [];
  for (const value of values) tfpCleanupCollectStrings(value, 0, candidates);

  for (const candidate of candidates) {
    const match = String(candidate || "").match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[A-Za-z0-9_./%?=&+#:-]+/i);
    if (!match?.[0]) continue;
    const url = tfpCleanupSafeUrl(match[0]);
    if (url && /linkedin\.com/i.test(url)) return url;
  }

  return "";
}

function tfpCleanupFirstContactName(...values: any[]): string {
  for (const value of values) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (text) return text.slice(0, 160);
  }
  return "";
}

function tfpCleanupPickSafeContactFields(row: AnyRecord = {}, reportData: AnyRecord = {}): AnyRecord {
  const person1 = (reportData.person1 || reportData.person_1 || row.person1 || row.person_1 || {}) as AnyRecord;
  const social = (reportData.social || reportData.socials || reportData.socialProfiles || reportData.social_profiles || row.social || row.socials || row.socialProfiles || row.social_profiles || {}) as AnyRecord;
  const lead = (reportData.lead || reportData.leadData || reportData.lead_data || row.lead || row.leadData || row.lead_data || {}) as AnyRecord;

  const email = tfpCleanupFirstEmail(
    row.contactEmail,
    row.contact_email,
    row.email,
    row.finalEmail,
    row.final_email,
    row.sheetFinalEmail,
    row.sheet_final_email,
    reportData.contactEmail,
    reportData.contact_email,
    reportData.email,
    reportData.finalEmail,
    reportData.final_email,
    reportData.sheetFinalEmail,
    reportData.sheet_final_email,
    reportData.decisionMakerEmail,
    reportData.decision_maker_email,
    lead.email,
    lead.emailLower,
    lead.email_lower
  );

  const linkedInUrl = tfpCleanupFirstLinkedInUrl(
    row.linkedinProfileUrl,
    row.linkedin_profile_url,
    row.linkedinUrl,
    row.linkedin_url,
    row.linkedinCompanyUrl,
    row.linkedin_company_url,
    row.socialLink,
    row.social_link,
    reportData.linkedinProfileUrl,
    reportData.linkedin_profile_url,
    reportData.linkedinUrl,
    reportData.linkedin_url,
    reportData.linkedinCompanyUrl,
    reportData.linkedin_company_url,
    reportData.socialLink,
    reportData.social_link,
    person1.linkedin,
    person1.linkedinUrl,
    person1.linkedin_url,
    social,
    lead.linkedin,
    lead.linkedinUrl,
    lead.linkedin_url,
    lead.socialLink,
    lead.social_link
  );

  const linkedInName = tfpCleanupFirstContactName(
    row.linkedinContactName,
    row.linkedin_contact_name,
    reportData.linkedinContactName,
    reportData.linkedin_contact_name,
    reportData.decisionMaker,
    reportData.decision_maker,
    person1.name,
    lead.name,
    lead.company_name,
    reportData.companyName,
    reportData.company_name
  );

  const output: AnyRecord = {};
  if (email) {
    output.contactEmail = email;
    output.contact_email = email;
    output.email = row.email || email;
    output.finalEmail = row.finalEmail || row.final_email || email;
    output.final_email = row.final_email || row.finalEmail || email;
  }
  if (linkedInUrl) {
    output.linkedinProfileUrl = row.linkedinProfileUrl || row.linkedin_profile_url || linkedInUrl;
    output.linkedin_profile_url = row.linkedin_profile_url || row.linkedinProfileUrl || linkedInUrl;
    output.linkedinUrl = row.linkedinUrl || row.linkedin_url || linkedInUrl;
    output.linkedin_url = row.linkedin_url || row.linkedinUrl || linkedInUrl;
    output.socialLink = row.socialLink || row.social_link || linkedInUrl;
    output.social_link = row.social_link || row.socialLink || linkedInUrl;
  }
  if (linkedInName) {
    output.linkedinContactName = row.linkedinContactName || row.linkedin_contact_name || linkedInName;
    output.linkedin_contact_name = row.linkedin_contact_name || row.linkedinContactName || linkedInName;
  }

  return output;
}

async function tfpCleanupEnrichRowsWithSafeContactFields(rows: AnyRecord[] = []): Promise<AnyRecord[]> {
  const tokens = Array.from(
    new Set(
      rows
        .map((row) => tfpCleanupText(row.token || row.reportToken || row.report_token).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96))
        .filter(Boolean)
    )
  );

  if (!tokens.length) {
    return rows.map((row) => ({ ...row, ...tfpCleanupPickSafeContactFields(row) }));
  }

  const reportMap = new Map<string, AnyRecord>();
  for (let index = 0; index < tokens.length; index += 40) {
    const chunk = tokens.slice(index, index + 40);
    const snapshots = await Promise.all(
      chunk.map((token) =>
        adminDb
          .collection("audit_reports")
          .doc(token)
          .get()
          .then((snapshot) => ({ token, data: snapshot.exists ? ((snapshot.data() || {}) as AnyRecord) : {} }))
          .catch(() => ({ token, data: {} }))
      )
    );
    for (const item of snapshots) reportMap.set(item.token, item.data);
  }

  const leadIds = Array.from(
    new Set(
      rows
        .map((row) => {
          const token = tfpCleanupText(row.token || row.reportToken || row.report_token).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96);
          const reportData = token ? reportMap.get(token) || {} : {};
          return tfpCleanupText(row.leadId || row.lead_id || reportData.leadId || reportData.lead_id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
        })
        .filter(Boolean)
    )
  );

  const leadMap = new Map<string, AnyRecord>();
  for (let index = 0; index < leadIds.length; index += 40) {
    const chunk = leadIds.slice(index, index + 40);
    const snapshots = await Promise.all(
      chunk.map((leadId) =>
        adminDb
          .collection("leads")
          .doc(leadId)
          .get()
          .then((snapshot) => ({ leadId, data: snapshot.exists ? ((snapshot.data() || {}) as AnyRecord) : {} }))
          .catch(() => ({ leadId, data: {} }))
      )
    );
    for (const item of snapshots) leadMap.set(item.leadId, item.data);
  }

  return rows.map((row) => {
    const token = tfpCleanupText(row.token || row.reportToken || row.report_token).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96);
    const reportData = token ? reportMap.get(token) || {} : {};
    const leadId = tfpCleanupText(row.leadId || row.lead_id || reportData.leadId || reportData.lead_id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
    const leadData = leadId ? leadMap.get(leadId) || {} : {};
    const safeContactFields = tfpCleanupPickSafeContactFields(row, { ...reportData, lead: leadData });
    return { ...row, ...safeContactFields };
  });
}

function tfpCleanupNormalizeRow(row: AnyRecord = {}): AnyRecord {
  const sourceGroup = tfpCleanupSourceGroup(row);
  const channel = tfpCleanupNormalizeChannel(row);
  const normalizedChannel = channel === "unknown" ? row.channel || (sourceGroup === "search_email" ? "email" : "manual") : channel;
  const sourceType = tfpCleanupText(row.sourceType || row.source_type) ||
    (sourceGroup === "search_email" ? "search" : sourceGroup === "linkedin_manual" ? (tfpCleanupIsLinkedIn(row) ? "linkedin" : "manual") : "unknown");
  const leadSource = tfpCleanupText(row.leadSource || row.lead_source) ||
    (sourceType === "search" ? "python_search" : sourceType === "linkedin" ? "linkedin_audit" : sourceType === "manual" ? "manual_audit" : "unknown");
  const auditSource = tfpCleanupText(row.auditSource || row.audit_source) ||
    (sourceType === "search" ? "python_search" : sourceType === "linkedin" ? "linkedin_audit" : sourceType === "manual" ? "manual_audit" : tfpCleanupText(row.source || "unknown"));
  const sourceContext = tfpCleanupText(row.sourceContext || row.source_context || auditSource);
  const sourceLabel = tfpCleanupSourceLabel(row);

  return {
    ...row,
    sourceGroup,
    source_group: sourceGroup,
    sourceLabel,
    source_label: sourceLabel,
    sourceType,
    source_type: sourceType,
    outreachChannel: normalizedChannel,
    outreach_channel: normalizedChannel,
    channel: normalizedChannel,
    leadSource,
    lead_source: leadSource,
    auditSource,
    audit_source: auditSource,
    sourceContext,
    source_context: sourceContext,
    createdAt: tfpCleanupToIso(row.createdAt || row.created_at || row.reportCreatedAt || row.report_created_at || row.registeredAt || row.registered_at) || row.createdAt,
    updatedAt: tfpCleanupToIso(row.updatedAt || row.updated_at) || row.updatedAt,
    lastActivityAt: tfpCleanupToIso(row.lastActivityAt || row.last_activity_at || row.lastSeenAt || row.last_seen_at) || row.lastActivityAt,
  };
}

async function handleSecureReportsListWithCleanupFilters(req: Request) {
  const response = await handleSecureReportsList(req);

  let data: AnyRecord;
  try {
    data = await response.clone().json();
  } catch {
    return response;
  }

  if (!Array.isArray(data.rows)) {
    return json(data, response.status);
  }

  const url = new URL(req.url);
  const filter = tfpCleanupText(url.searchParams.get("filter"), "all");
  const search = tfpCleanupText(url.searchParams.get("search"));
  const from = tfpCleanupText(url.searchParams.get("from") || url.searchParams.get("dateFrom") || url.searchParams.get("startDate"));
  const to = tfpCleanupText(url.searchParams.get("to") || url.searchParams.get("dateTo") || url.searchParams.get("endDate"));

  const enrichedRows = await tfpCleanupEnrichRowsWithSafeContactFields(data.rows as AnyRecord[]);
  const normalizedRows = enrichedRows.map((row: AnyRecord) => tfpCleanupNormalizeRow(row));
  const filteredRows = normalizedRows
    .filter((row: AnyRecord) => tfpCleanupMatchesFilter(row, filter))
    .filter((row: AnyRecord) => tfpCleanupMatchesSearch(row, search))
    .filter((row: AnyRecord) => tfpCleanupMatchesDate(row, from, to));

  return json(
    {
      ...data,
      rows: filteredRows,
      totalBeforeCleanupFilter: normalizedRows.length,
      filteredCount: filteredRows.length,
      sourceFilter: filter,
      dateFrom: from,
      dateTo: to,
      message:
        data.message ||
        (filteredRows.length
          ? `Loaded ${filteredRows.length} secure report(s).`
          : "No secure reports matched this filter/date range."),
    },
    response.status,
  );
}


type SenderConfig = {
  id?: string;
  name: string;
  email: string;
  replyToEmail?: string;
  replyToName?: string;
  dailyLimit: number;
};

type BrevoSendInput = {
  sender: SenderConfig;
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  tag: string;
  customMessageId: string;
  scheduledAt?: string;
  headers?: Record<string, string>;
};

type LeadData = {
  id?: string;
  email?: string;
  emailLower?: string;
  name?: string;
  company_name?: string;
  website?: string;
  business_type?: string;
  service?: string;
  sender_email?: string;
  sender_name?: string;
  sender_id?: string;
  senderId?: string;
  subject?: string;
  message?: string;
  trackingId?: string;
  status?: string;
  stopAutomation?: boolean;
  follow_up_count?: number;
  open_count?: number;
  click_count?: number;
  sentAt?: any;
  lastFollowUp?: any;
  firstOpenedAt?: any;
  lastOpenedAt?: any;
  firstClickedAt?: any;
  lastClickedAt?: any;
  lastClickedUrl?: string;
  lastEngagedAt?: any;
  tracking_history?: any[];
  sent_messages?: any[];
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  lastFollowupEvaluatedAt?: any;
  retryCount?: number;
  lastFollowupError?: string;
  scheduledAt?: any;
  automationLock?: any;
  include_signature?: boolean;
  reportUrl?: string;
  reportButtonText?: string;
  reportToken?: string;
  pdfFileId?: string;
  pdfViewUrl?: string;
  pdfDownloadUrl?: string;
  pdfExpiresAt?: any;
  sheetRowNumber?: number;
  sheetWebsiteUrl?: string;
  sheetFinalEmail?: string;
  keepUnderSheetAudit?: boolean;
  sourceOrigin?: string;
  sourceRole?: string;
  parentSheetEmail?: string;
  parentSheetRowNumber?: number;
  parentSheetWebsiteUrl?: string;
  parentReportToken?: string;
  source?: string;
  [key: string]: any;
};


/**
 * Lightweight Firestore snapshot aliases.
 * বাংলা ব্যাখ্যা: কিছু project-এ FirebaseFirestore namespace type missing দেখাতে পারে।
 * তাই route file-এর ভিতরে local aliases রাখা হয়েছে, runtime behavior পরিবর্তন হয় না।
 */
type FirestoreDocRef = any;
type FirestoreQueryRef = any;
type FirestoreDocSnap = any;
type FirestoreQueryDocSnap = any;


/**
 * Sender is verified server-side from app/config/senders.ts.
 * Frontend only sends senderId; API never trusts raw sender email/name from the browser.
 */
const DEFAULT_SENDER_NAME = MAIN_INBOX_NAME;
const DEFAULT_REPLY_TO_EMAIL = MAIN_INBOX_EMAIL;
const DEFAULT_REPLY_TO_NAME = MAIN_INBOX_NAME;
const DEFAULT_DAILY_LIMIT = 50;

const SERVICES = new Set(["Email Signature", "Google Ads", "Server Side Tracking"]);
const PROTECTED_STATUSES = new Set(["opened", "clicked", "replied", "bounced", "spam", "unsubscribed", "cancelled", "finished"]);
const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "interested", "active"]);
const HARD_STOP_STATUSES = new Set(["replied", "bounced", "spam", "unsubscribed", "not_interested", "cancelled", "finished", "blocked_suppressed"]);
const FOLLOWUP_MAX_WORDS = 120;
const FOLLOWUP_MAX_LINKS = 1;
const FOLLOWUP_CANDIDATE_LIMIT = 300; // legacy fallback / dry-run safety cap
const NEXT_FOLLOWUP_QUERY_LIMIT = 100;
const DEFAULT_FOLLOWUP_BATCH_PER_RUN = 5;
const MAX_FOLLOWUP_BATCH_PER_RUN = 20;
const MAX_FOLLOWUP_RETRIES = 3;
const STALE_LOCK_MINUTES = 30;

// Follow-up safety cap: one initial email + F-1/F-2/F-3 only.
// step4/step5 remain in saved config for backward compatibility, but automation must never send them.
const MAX_AUTOMATED_FOLLOWUPS = 3;
const MAX_CONFIGURED_FOLLOWUP_STEPS = 5;

// Serious cold-outreach safety policy:
// - Never auto follow-up leads with zero open/click engagement.
// - When engagement exists, send follow-ups 1 hour before the lead's last engagement time + configured delay.
const REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP = true;
const FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES = 60;

// Initial scheduled emails are handed to Brevo so they do not wait for a 10-minute cron batch.
// Keep the window conservative because Brevo transactional scheduled sends support near-future delivery,
// while longer-term follow-up timing remains Firestore + cron based.
const BREVO_INITIAL_SCHEDULE_MIN_DELAY_MS = 30_000;
const BREVO_INITIAL_SCHEDULE_MAX_DELAY_MS = 72 * 60 * 60 * 1000;
// After this grace window, provider-scheduled initial emails should no longer appear
// in the Scheduled tab even if Brevo sent/delivered webhook delivery is delayed.
// This does not change follow-up automation; open/click and delivered/sent events still
// update the Firestore lead when they arrive.
const BREVO_INITIAL_SCHEDULE_TAB_GRACE_MS = 10 * 60 * 1000;
const BREVO_PROVIDER_REQUEST_DELIVERY_GRACE_MS = 5 * 60 * 1000;
const BREVO_SCHEDULE_ACTION_LOCK_MS = 5 * 60 * 1000;


// Open tracking source policy:
// - TrackFlow's self-hosted pixel is the primary source for automation open_count.
// - Brevo "opened" webhooks are kept as provider diagnostics by default because
//   provider/image-proxy opens can arrive immediately after manual sends.
// - Set BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION=true only if you intentionally want
//   Brevo provider opens to increment open_count and schedule follow-ups.
function brevoOpenWebhookUpdatesAutomation(): boolean {
  return envFlag("BREVO_OPEN_WEBHOOK_UPDATES_AUTOMATION", false);
}

function openTrackingDebugWindowMs(): number {
  return intEnv("OPEN_TRACKING_DEBUG_WINDOW_MINUTES", 10, 1, 60) * 60_000;
}

function getLeadSentMsForOpenTracking(lead: LeadData = {}): number {
  return Math.max(
    toMillis(lead.sentAt),
    toMillis((lead as AnyRecord).lastSentAt),
    toMillis((lead as AnyRecord).createdAt),
    toMillis((lead as AnyRecord).scheduledAcceptedAt),
  );
}

function secondsAfterLeadSentForOpenTracking(lead: LeadData = {}, eventMs = Date.now()): number | null {
  const sentMs = getLeadSentMsForOpenTracking(lead);
  if (!sentMs || !eventMs) return null;
  return Math.round((eventMs - sentMs) / 1000);
}

function shouldForceStoreOpenDebug(lead: LeadData = {}, eventMs = Date.now()): boolean {
  if (!envFlag("STORE_OPEN_TRACKING_DEBUG", false)) return false;
  const sentMs = getLeadSentMsForOpenTracking(lead);
  if (!sentMs) return true;
  return Math.abs(eventMs - sentMs) <= openTrackingDebugWindowMs();
}

function envEmailList(name: string): string[] {
  return String(process.env[name] || "")
    .split(/[,;\n]/g)
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

function internalOpenTestEmails(): Set<string> {
  return new Set(
    [
      MAIN_INBOX_EMAIL,
      ...ACTIVE_SENDERS.map((sender: any) => sender?.email || ""),
      ...ACTIVE_SENDERS.map((sender: any) => sender?.replyToEmail || ""),
      ...envEmailList("TRACKFLOW_TEST_RECIPIENT_EMAILS"),
      ...envEmailList("OPEN_TRACKING_TEST_RECIPIENTS"),
    ]
      .map((value) => normalizeEmail(value))
      .filter(Boolean),
  );
}

function shouldIgnoreInternalTestOpen(emailLower: string): boolean {
  if (envFlag("COUNT_INTERNAL_TEST_OPENS", false)) return false;
  const normalized = normalizeEmail(emailLower || "");
  return Boolean(normalized && internalOpenTestEmails().has(normalized));
}



function trackflowEmailDebugLog(label: string, payload: Record<string, any> = {}) {
  if (!envFlag("TRACKFLOW_DEBUG_EMAIL_FLOW", false)) return;

  try {
    const safePayload = JSON.stringify(
      {
        at: new Date().toISOString(),
        label,
        ...payload,
      },
      (_key, value) => {
        if (typeof value === "bigint") return String(value);
        if (value && typeof value.toMillis === "function") {
          try {
            return new Date(value.toMillis()).toISOString();
          } catch {
            return String(value);
          }
        }
        if (value && typeof value.toDate === "function") {
          try {
            return value.toDate().toISOString();
          } catch {
            return String(value);
          }
        }
        if (typeof value === "function") return "[function]";
        return value;
      },
      2,
    );

    console.log(`[TRACKFLOW_EMAIL_DEBUG] ${label}`, safePayload);
  } catch (error) {
    console.log(`[TRACKFLOW_EMAIL_DEBUG] ${label}`, payload);
  }
}

function trackflowRequestDebugMeta(req?: Request): Record<string, any> {
  if (!req) return {};

  return {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent") || "",
    ip:
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "",
  };
}

function isBrevoImageProxyOpenRequest(req?: Request): boolean {
  const userAgent = String(req?.headers.get("user-agent") || "").toLowerCase();
  if (!userAgent) return false;

  return (
    userAgent.includes("brevo/1.0") &&
    (userAgent.includes("redirection-images") || userAgent.includes("image"))
  );
}

const DEFAULT_PROVIDER_IMAGE_PROXY_FAST_OPEN_WINDOW_SECONDS = 3;

function providerImageProxyFastOpenWindowSeconds(): number {
  // Keep this window very short. A 30-second window can hide genuine fast opens,
  // while the 3-second window only catches provider-side Brevo image prefetches
  // that arrive almost immediately after send. Set env to 0 only when you
  // intentionally want to disable this protection for debugging.
  return intEnv(
    "IGNORE_PROVIDER_IMAGE_PROXY_OPEN_SECONDS",
    DEFAULT_PROVIDER_IMAGE_PROXY_FAST_OPEN_WINDOW_SECONDS,
    0,
    300,
  );
}

function shouldIgnoreProviderImageProxyOpen(
  req?: Request,
  secondsAfterSent?: number | null,
): { ignore: boolean; reason: string; windowSeconds: number } {
  const windowSeconds = providerImageProxyFastOpenWindowSeconds();

  if (!isBrevoImageProxyOpenRequest(req)) {
    return { ignore: false, reason: "", windowSeconds };
  }

  // Brevo may fetch/proxy the tracking pixel very quickly after send.
  // Ignore only the configured very-early provider-image fetch window.
  // Real Gmail/recipient opens can also arrive through Brevo's image proxy, so
  // after this short window we allow the normal 4-hour dedupe logic to run.
  if (typeof secondsAfterSent !== "number" || !Number.isFinite(secondsAfterSent)) {
    return { ignore: true, reason: "brevo_redirection_image_proxy_missing_sent_time", windowSeconds };
  }

  if (windowSeconds > 0 && secondsAfterSent >= 0 && secondsAfterSent <= windowSeconds) {
    return { ignore: true, reason: "brevo_redirection_image_proxy_fast_prefetch", windowSeconds };
  }

  return { ignore: false, reason: "", windowSeconds };
}

const SERVICE_IDS = ["Email Signature", "Google Ads", "Server Side Tracking"] as const;
const STEP_IDS = ["step1", "step2", "step3", "step4", "step5"] as const;

const CODE_DEFAULT_FOLLOWUP_CONFIG: AnyRecord = {
  "Email Signature": {
    step1: {
      delay: 1440,
      variants: [
        {
          id: "code-default-email-signature-step1",
          content:
            "<p>Hi {name}, just checking if you had a chance to look at the email signature tracking note I sent for {company}.</p><p>It was not a final diagnosis — just a browser-visible signal worth checking so outbound email clicks and enquiry-path visits are measured clearly.</p><p>If helpful, I can point out the first area I would verify so you do not have to dig through everything.</p>",
        },
      ],
    },
    step2: {
      delay: 2880,
      variants: [
        {
          id: "code-default-email-signature-step2",
          content:
            "<p>Hi {name}, quick second follow-up on the email signature tracking note for {company}.</p><p>If this is not a priority right now, no worries. I just wanted to make sure the note did not get buried.</p>",
        },
      ],
    },
    step3: { delay: 4320, variants: [{ id: "code-default-email-signature-step3", content: "<p>Hi {name}, should I leave this tracking note for now, or would a quick verification be useful?</p>" }] },
    step4: { delay: 7200, variants: [{ id: "code-default-email-signature-step4", content: "<p>Hi {name}, no worries if this is not relevant right now. I will leave the note with you.</p>" }] },
    step5: { delay: 10080, variants: [{ id: "code-default-email-signature-step5", content: "<p>Hi {name}, closing the loop here. If email tracking verification becomes useful later, feel free to revisit the note.</p>" }] },
  },
  "Google Ads": {
    step1: {
      delay: 1440,
      variants: [
        {
          id: "code-default-google-ads-step1",
          content:
            "<p>Hi {name}, just checking if you had a chance to look at the tracking note I sent for {company}.</p><p>It was not a final diagnosis — just a browser-visible signal worth checking inside Google Ads, GA4, or GTM.</p><p>If helpful, I can point out the first area I would verify so you do not have to dig through everything.</p>",
        },
      ],
    },
    step2: {
      delay: 2880,
      variants: [
        {
          id: "code-default-google-ads-step2",
          content:
            "<p>Hi {name}, quick second follow-up on the tracking note for {company}.</p><p>If Google Ads is spending and key lead actions are not recorded cleanly, it can make campaign decisions less reliable. Worth checking before changing budgets.</p>",
        },
      ],
    },
    step3: { delay: 4320, variants: [{ id: "code-default-google-ads-step3", content: "<p>Hi {name}, should I leave this tracking note for now, or would a quick verification be useful?</p>" }] },
    step4: { delay: 7200, variants: [{ id: "code-default-google-ads-step4", content: "<p>Hi {name}, no worries if this is not relevant right now. I will leave the note with you.</p>" }] },
    step5: { delay: 10080, variants: [{ id: "code-default-google-ads-step5", content: "<p>Hi {name}, closing the loop here. If conversion tracking becomes a priority later, feel free to revisit the note.</p>" }] },
  },
  "Server Side Tracking": {
    step1: {
      delay: 1440,
      variants: [
        {
          id: "code-default-sst-step1",
          content:
            "<p>Hi {name}, just checking if you had a chance to look at the server-side tracking note I sent for {company}.</p><p>It was not a final diagnosis — just a browser-visible signal worth checking inside GA4, GTM, or the server-side setup.</p><p>If helpful, I can point out the first area I would verify so you do not have to dig through everything.</p>",
        },
      ],
    },
    step2: {
      delay: 2880,
      variants: [
        {
          id: "code-default-sst-step2",
          content:
            "<p>Hi {name}, quick second follow-up on the server-side tracking note for {company}.</p><p>If browser-side signals are unclear, server-side tracking can help only when events are forwarded and deduplicated correctly. That is the part worth verifying.</p>",
        },
      ],
    },
    step3: { delay: 4320, variants: [{ id: "code-default-sst-step3", content: "<p>Hi {name}, should I leave this tracking note for now, or would a quick verification be useful?</p>" }] },
    step4: { delay: 7200, variants: [{ id: "code-default-sst-step4", content: "<p>Hi {name}, no worries if this is not relevant right now. I will leave the note with you.</p>" }] },
    step5: { delay: 10080, variants: [{ id: "code-default-sst-step5", content: "<p>Hi {name}, closing the loop here. If server-side tracking becomes a priority later, feel free to revisit the note.</p>" }] },
  },
};
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const LEGACY_CODE_DEFAULT_FOLLOWUP_CONTENT: Record<string, string> = {
  "code-default-email-signature-step1": "<p>Hi {name}, just checking if you saw my note about the email signature tracking issue I noticed for {company}.</p><p>If helpful, I can point out the exact area to verify—no pitch, just a quick check.</p>",
  "code-default-email-signature-step2": "<p>Hi {name}, one last quick note on this.</p><p>If signature clicks are not being tracked cleanly, replies and website visits from outbound emails can be hard to measure. Worth checking when you have a minute.</p>",
  "code-default-email-signature-step3": "<p>Hi {name}, should I close the loop on this for now?</p>",
  "code-default-email-signature-step4": "<p>Hi {name}, no worries if this is not a priority right now. I can leave this with you.</p>",
  "code-default-email-signature-step5": "<p>Hi {name}, closing this out. If email tracking becomes relevant later, feel free to revisit the note.</p>",
  "code-default-google-ads-step1": "<p>Hi {name}, just following up on the tracking note I sent for {company}.</p><p>The main point was about whether important lead actions are clearly visible from the browser side and then confirmed inside Google Ads or GA4.</p>",
  "code-default-google-ads-step2": "<p>Hi {name}, quick second follow-up.</p><p>If Google Ads is spending but lead actions are not recorded consistently, it can quietly make campaign decisions less reliable. Worth a quick check before changing budgets.</p>",
  "code-default-google-ads-step3": "<p>Hi {name}, should I leave this for now, or would a quick tracking check be useful?</p>",
  "code-default-google-ads-step4": "<p>Hi {name}, I will not keep chasing. Just wanted to make sure the tracking note did not get buried.</p>",
  "code-default-google-ads-step5": "<p>Hi {name}, closing the loop here. Hope the note was useful as a quick tracking sanity check.</p>",
  "code-default-sst-step1": "<p>Hi {name}, following up on the server-side tracking note for {company}.</p><p>I only checked public browser-visible signals, so the next step would be confirming the setup inside GTM/GA4/server logs.</p>",
  "code-default-sst-step2": "<p>Hi {name}, quick reminder on this.</p><p>If browser-side signals are unclear, server-side tracking can help, but only if events are being forwarded and deduplicated correctly. That is the part worth verifying.</p>",
  "code-default-sst-step3": "<p>Hi {name}, should I close this out, or is tracking verification something you want to revisit?</p>",
  "code-default-sst-step4": "<p>Hi {name}, no pressure. I will leave the note with you in case it becomes useful later.</p>",
  "code-default-sst-step5": "<p>Hi {name}, closing the loop here. If server-side tracking becomes a priority, the report should give you a starting point.</p>",
};

function normalizeFollowupTemplateForCompare(value: any): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+</g, "<")
    .replace(/>\s+/g, ">")
    .trim();
}

function upgradeLegacyDefaultFollowupVariant(service: string, step: string, variant: AnyRecord, safeContent: string): AnyRecord {
  const variantId = String(variant?.id || "").slice(0, 80);
  const recommended = CODE_DEFAULT_FOLLOWUP_CONFIG?.[service]?.[step]?.variants?.find((item: any) => item?.id === variantId);
  const legacyContent = LEGACY_CODE_DEFAULT_FOLLOWUP_CONTENT[variantId];

  if (!recommended?.content || !legacyContent) {
    return { id: variantId || `${service}-${step}-variant`, content: safeContent };
  }

  // Only upgrade variants that are clearly the previous code-default copy.
  // Custom edited follow-up copy is preserved.
  const loaded = normalizeFollowupTemplateForCompare(safeContent);
  const legacy = normalizeFollowupTemplateForCompare(legacyContent);
  const sameLegacyContent = loaded === legacy;

  return {
    id: variantId,
    content: sameLegacyContent ? recommended.content : safeContent,
  };
}

function sanitizeFollowupRuntimeConfig(rawData: AnyRecord = {}) {
  const merged: AnyRecord = cloneJson(CODE_DEFAULT_FOLLOWUP_CONFIG);

  for (const service of SERVICE_IDS) {
    for (const step of STEP_IDS) {
      const loadedStep = rawData?.[service]?.[step];
      if (!loadedStep || typeof loadedStep !== "object") continue;

      const safeVariants = Array.isArray(loadedStep.variants)
        ? loadedStep.variants
            .map((variant: any, index: number) =>
              upgradeLegacyDefaultFollowupVariant(
                service,
                step,
                { ...variant, id: String(variant?.id || `${service}-${step}-variant-${index + 1}`).slice(0, 80) },
                stripDangerousHtml(String(variant?.content || "")),
              ),
            )
            .filter((variant: any) => plainTextFromHtml(variant.content))
            .slice(0, 10)
        : [];

      const delay = Math.max(60, Math.min(Number(loadedStep.delay || merged[service][step].delay || 1440), 60 * 24 * 30));
      merged[service][step] = {
        delay,
        variants: safeVariants.length ? safeVariants : merged[service][step].variants,
      };
    }
  }

  merged.daily_followup_limit = Math.max(1, Math.min(Number(rawData?.daily_followup_limit || 50), 500));
  merged.followup_batch_per_run = Math.max(1, Math.min(Number(rawData?.followup_batch_per_run || DEFAULT_FOLLOWUP_BATCH_PER_RUN), MAX_FOLLOWUP_BATCH_PER_RUN));
  merged.followup_trigger_mode = "open_required";
  return merged;
}

async function loadFollowupRuntimeConfig(): Promise<{ data: AnyRecord; source: "firestore" | "code_default"; exists: boolean }> {
  const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
  if (!configDoc.exists) {
    return {
      data: sanitizeFollowupRuntimeConfig({}),
      source: "code_default",
      exists: false,
    };
  }

  return {
    data: sanitizeFollowupRuntimeConfig(configDoc.data() || {}),
    source: "firestore",
    exists: true,
  };
}


const ServiceSchema = z.enum(["Email Signature", "Google Ads", "Server Side Tracking"]);

const SendInitialBodySchema = z
  .object({
    email: z.string().email(),
    senderId: z.string().optional(),
    sender_id: z.string().optional(),
    sender: z.object({ id: z.string().optional() }).optional(),
    clientName: z.string().optional(),
    name: z.string().optional(),
    companyName: z.string().optional(),
    company_name: z.string().optional(),
    website: z.string().optional(),
    businessType: z.string().optional(),
    business_type: z.string().optional(),
    selectedService: ServiceSchema.optional(),
    service: ServiceSchema.optional(),
    subject: z.string().min(1),
    message: z.string().min(1),
    scheduledAt: z.any().optional(),
    includeSignature: z.boolean().optional(),
    signatureMode: z.enum(["full", "compact", "none"]).optional(),
    signature_mode: z.enum(["full", "compact", "none"]).optional(),
    reportUrl: z.string().optional(),
    reportButtonText: z.string().optional(),
    allowDuplicateSend: z.boolean().optional(),
    allowCooldownOverride: z.boolean().optional(),
    trackingId: z.string().optional(),
    reportToken: z.string().optional(),
    pdfFileId: z.string().optional(),
    pdfViewUrl: z.string().optional(),
    pdfDownloadUrl: z.string().optional(),
    pdfExpiresAt: z.any().optional(),
    sheetRowNumber: z.any().optional(),
    sheetWebsiteUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
    sheetFinalEmail: z.string().optional(),
    keepUnderSheetAudit: z.boolean().optional(),
    sourceOrigin: z.string().optional(),
    sourceRole: z.string().optional(),
    parentSheetEmail: z.string().optional(),
    parentSheetRowNumber: z.any().optional(),
    parentSheetWebsiteUrl: z.string().optional(),
    parentReportToken: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough()
  .refine((value: any) => Boolean(value.senderId || value.sender_id || value.sender?.id), {
    message: "senderId is required",
    path: ["senderId"],
  })
  .refine((value: any) => Boolean(value.selectedService || value.service), {
    message: "selectedService is required",
    path: ["selectedService"],
  });

// Shared route helpers, security helpers, sender selection, suppression,
// contact-memory and lightweight email-event logging now live under lib/trackflow-*.
type EmailTrackingContext = {
  leadId?: string;
  reportToken?: string;
  messageId?: string;
  trackingId?: string;
  tag?: string;
  emailLower?: string;
};

function hasEmailTrackingIdentity(context: EmailTrackingContext = {}): boolean {
  return Boolean(
    String(context.leadId || "").trim() ||
      normalizeReportToken(context.reportToken || "") ||
      String(context.messageId || "").trim() ||
      String(context.trackingId || "").trim()
  );
}

function appendEmailTrackingParams(trackingUrl: URL, context: EmailTrackingContext = {}) {
  const leadId = String(context.leadId || "").trim();
  const reportToken = normalizeReportToken(context.reportToken || "");
  const messageId = String(context.messageId || "").trim().replace(/[\r\n]/g, "").slice(0, 180);
  const trackingId = String(context.trackingId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);

  if (leadId) trackingUrl.searchParams.set("lid", leadId);
  if (reportToken) {
    trackingUrl.searchParams.set("rt", reportToken);
    trackingUrl.searchParams.set("reportToken", reportToken);
  }
  if (messageId) {
    trackingUrl.searchParams.set("mid", messageId);
    trackingUrl.searchParams.set("messageId", messageId);
  }
  if (trackingId) trackingUrl.searchParams.set("trackingId", trackingId);
  if (context.tag) trackingUrl.searchParams.set("t", context.tag);
  if (context.emailLower) trackingUrl.searchParams.set("email", context.emailLower);
}

function buildTrackedClickUrl(targetUrl: string, context: EmailTrackingContext = {}): string {
  const safeTarget = sanitizeOptionalUrl(targetUrl || "");

  if (!safeTarget || !hasEmailTrackingIdentity(context)) return safeTarget || targetUrl || "";

  try {
    const trackingUrl = new URL(`${appBaseUrl()}/api/trackflow/track/click`);
    appendEmailTrackingParams(trackingUrl, context);
    trackingUrl.searchParams.set("url", safeTarget);
    return trackingUrl.toString();
  } catch {
    return safeTarget;
  }
}

function buildOpenTrackingPixel(context: EmailTrackingContext = {}): string {
  if (!hasEmailTrackingIdentity(context)) return "";

  try {
    const trackingUrl = new URL(`${appBaseUrl()}/api/trackflow/track/open`);
    appendEmailTrackingParams(trackingUrl, context);

    return `<img src="${escapeHtml(trackingUrl.toString())}" width="1" height="1" alt="" border="0" style="display:none;width:1px;height:1px;max-width:1px;max-height:1px;overflow:hidden;opacity:0;mso-hide:all;" />`;
  } catch {
    return "";
  }
}

function shouldTrackHref(value: string): boolean {
  const raw = String(value || "").trim();
  if (!raw) return false;

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (url.pathname.includes("/api/trackflow/track/click")) return false;
    if (url.pathname.includes("/api/trackflow/unsubscribe") || url.pathname.includes("/unsubscribe")) return false;
    return true;
  } catch {
    return false;
  }
}

function rewriteHtmlLinksForTracking(html: string, context: EmailTrackingContext = {}): string {
  if (!hasEmailTrackingIdentity(context) || !html) return html;

  return String(html).replace(
    /<a\b([^>]*?)\bhref=(["'])(.*?)\2([^>]*)>/gi,
    (match, before, quote, href, after) => {
      const cleanHref = String(href || "").trim();
      if (!shouldTrackHref(cleanHref)) return match;

      const trackedUrl = buildTrackedClickUrl(cleanHref, context);
      if (!trackedUrl || trackedUrl === cleanHref) return match;

      return `<a${before}href=${quote}${escapeHtml(trackedUrl)}${quote}${after}>`;
    },
  );
}

function normalizeVisibleText(value: any, fallback: string, maxLength = 48): string {
  const text = String(value || fallback || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return text || fallback;
}

function formatVisibleEmailReference(tag: string): string {
  const normalized = String(tag || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();

  if (!normalized) return "TF-EMAIL";

  const stepMatch = normalized.match(/(?:_|-)?STEP(\d+)$/i);
  const stepLabel = stepMatch ? `-STEP${stepMatch[1]}` : "";
  const withoutStep = normalized.replace(/(?:_|-)?STEP\d+$/i, "");
  const firstReadableSegment = withoutStep.split(/[-_]/).filter(Boolean)[0] || withoutStep;
  const shortId = firstReadableSegment.replace(/[^A-Z0-9]/g, "").slice(0, 8) || "EMAIL";

  return `TF-${shortId}${stepLabel}`;
}

function buildReportLinkBlock(
  reportUrl?: string,
  buttonText = "View private tracking review",
  trackingContext: EmailTrackingContext = {},
) {
  const safeUrl = sanitizePublicReportUrl(reportUrl || "");
  if (!safeUrl) return "";

  const clickUrl = hasEmailTrackingIdentity(trackingContext) ? buildTrackedClickUrl(safeUrl, trackingContext) : safeUrl;
  const rawText = normalizeVisibleText(buttonText, "View private tracking review", 44);
  const safeText = escapeHtml(rawText);
  const safeClickUrl = escapeHtml(clickUrl);

  // Outlook desktop clips bordered VML buttons in some builds.
  // This table-only CTA is intentionally simple: stable first, styling second.
  // Do not change the tracked click URL; this only adjusts rendering/spacing.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:12px 0 8px 0;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;mso-line-height-rule:exactly;padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td align="center" valign="middle" bgcolor="#ffffff" style="background:#ffffff;border:1px solid #d1d5db;border-radius:5px;padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:16px;font-weight:bold;mso-line-height-rule:exactly;">
                <a href="${safeClickUrl}" target="_blank" style="display:block;color:#111827;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:16px;font-weight:bold;text-decoration:none;-webkit-text-size-adjust:none;">
                  ${safeText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="left" style="padding:7px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#6b7280;mso-line-height-rule:exactly;overflow-wrap:break-word;word-break:normal;">
          Private TrackFlow Pro audit note · PDF opens from the secure report page.
        </td>
      </tr>
    </table>
  `;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || BRAND_WEBSITE || "https://trackflowpro.com").replace(/\/+$/, "");
}

function normalizeReportToken(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function createReportToken(): string {
  return randomUUID().replace(/-/g, "");
}

function normalizeReportSlug(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "website";
}

function buildPublicReportUrl(token: string, domainSlug = "website"): string {
  const slug = normalizeReportSlug(domainSlug || "website");
  return `${appBaseUrl()}/tracking-review/${encodeURIComponent(slug)}/${encodeURIComponent(token)}`;
}

function isLocalOrUnsafeReportUrl(value: string): boolean {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return true;
  if (raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("0.0.0.0")) return true;
  if (raw.includes("/audit/pdf/") || raw.includes(":8000/")) return true;
  // Email/report URL must be the branded TrackFlow /tracking-review/{domainSlug}/{token} page, not a direct PDF/Drive link.
  if (raw.includes("drive.google.com") || raw.includes("googleusercontent.com")) return true;
  if (/\.pdf(?:$|[?#])/.test(raw)) return true;
  return false;
}

function sanitizePublicReportUrl(value: any): string {
  const url = sanitizeOptionalUrl(String(value || ""));
  if (!url || isLocalOrUnsafeReportUrl(url)) return "";
  return url;
}

function normalizeYouTubeVideoId(value: any): string {
  const raw = cleanCell(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return /^[a-zA-Z0-9_-]{8,32}$/.test(raw) ? raw : "";
}

function extractYouTubeVideoId(value: any): string {
  const raw = cleanCell(value);
  if (!raw) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return normalizeYouTubeVideoId(url.pathname.split("/").filter(Boolean)[0] || "");
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return normalizeYouTubeVideoId(watchId);

      const parts = url.pathname.split("/").filter(Boolean);
      const markerIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part.toLowerCase()));
      if (markerIndex >= 0 && parts[markerIndex + 1]) return normalizeYouTubeVideoId(parts[markerIndex + 1]);
    }
  } catch {}

  return normalizeYouTubeVideoId(raw);
}

function normalizeEvidenceVideoPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
  const raw = getObjectCandidate(
    body.evidenceVideo,
    body.evidence_video,
    body.videoEvidence,
    body.video_evidence,
    body.video,
    privatePage.evidenceVideo,
    privatePage.evidence_video,
  );

  const clear = Boolean(
    body.clearEvidenceVideo ||
      body.clear_evidence_video ||
      body.removeEvidenceVideo ||
      body.remove_evidence_video ||
      body.deleteEvidenceVideo ||
      body.delete_evidence_video ||
      raw.clear === true ||
      raw.remove === true ||
      raw.delete === true,
  );

  if (clear) {
    return { enabled: false, clear: true, status: "removed" };
  }

  const incomingUrl = firstCleanString(
    raw.videoUrl,
    raw.video_url,
    raw.youtubeUrl,
    raw.youtube_url,
    raw.url,
    typeof body.evidenceVideo === "string" ? body.evidenceVideo : "",
    typeof body.evidence_video === "string" ? body.evidence_video : "",
    typeof body.videoEvidence === "string" ? body.videoEvidence : "",
    typeof body.video_evidence === "string" ? body.video_evidence : "",
    typeof body.video === "string" ? body.video : "",
    body.evidenceVideoUrl,
    body.evidence_video_url,
    body.videoUrl,
    body.video_url,
    body.youtubeUrl,
    body.youtube_url,
    privatePage.evidenceVideoUrl,
    privatePage.evidence_video_url,
  );
  const videoId =
    extractYouTubeVideoId(incomingUrl) ||
    normalizeYouTubeVideoId(firstCleanString(raw.youtubeVideoId, raw.youtube_video_id, raw.videoId, raw.video_id, body.youtubeVideoId, body.youtube_video_id));

  if (!videoId) {
    return { enabled: false, clear: false, status: firstCleanString(raw.status, body.evidenceVideoStatus, body.evidence_video_status, "not_added") };
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return {
    enabled: true,
    provider: "youtube",
    status: firstCleanString(raw.status, body.evidenceVideoStatus, body.evidence_video_status, "ready"),
    title: firstCleanString(raw.title, body.evidenceVideoTitle, body.evidence_video_title, "Short browser-side evidence walkthrough"),
    description: firstCleanString(
      raw.description,
      body.evidenceVideoDescription,
      body.evidence_video_description,
      "This optional video shows browser-visible evidence only. Final confirmation still requires account-level access.",
    ),
    videoId,
    youtubeVideoId: videoId,
    videoUrl: watchUrl,
    youtubeUrl: watchUrl,
    embedUrl,
    embedProvider: "youtube_nocookie",
    addedAt: firstCleanString(raw.addedAt, raw.added_at, body.evidenceVideoAddedAt, body.evidence_video_added_at),
    optional: true,
  };
}

function sanitizeLocalRedirectTarget(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "/contact";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  const safe = sanitizeOptionalUrl(raw);
  if (!safe) return "/contact";
  try {
    const url = new URL(safe);
    const app = new URL(appBaseUrl());
    if (url.hostname === app.hostname) return `${url.pathname}${url.search}${url.hash}`;
  } catch {}
  return "/contact";
}

function firstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = cleanCell(value || "");
    if (text) return text;
  }
  return "";
}

function normalizeStringArray(value: any, maxItems = 8): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of rawItems) {
    const text = cleanCell(
      item && typeof item === "object"
        ? item.text || item.label || item.title || item.description || item.name || ""
        : item || "",
    );
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeRecommendationArray(value: any, maxItems = 8): AnyRecord[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: AnyRecord[] = [];

  for (const item of rawItems) {
    if (item && typeof item === "object") {
      const title = cleanCell(item.title || item.step || item.name || item.description || "");
      const description = cleanCell(item.description || item.detail || item.summary || "");
      const priority = cleanCell(item.priority || `Priority ${output.length + 1}`);
      const estimatedEffort = cleanCell(item.estimatedEffort || item.estimated_effort || item.effort || "Short review");
      const key = `${title}|${description}`.toLowerCase();
      if ((title || description) && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority,
          title: title || description,
          description,
          estimatedEffort,
        });
      }
    } else {
      const title = cleanCell(item || "");
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority: `Priority ${output.length + 1}`,
          title,
          description: "",
          estimatedEffort: "Short review",
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeAdsFoundValue(value: any): "yes" | "no" | "unknown" {
  const text = cleanCell(value || "").toLowerCase();
  if (["yes", "true", "1", "found", "ads_found", "active", "running"].includes(text)) return "yes";
  if (["no", "false", "0", "not_found", "none", "no_ads"].includes(text)) return "no";
  return "unknown";
}

function boolFromAny(value: any): boolean {
  if (typeof value === "boolean") return value;
  const text = cleanCell(value || "").toLowerCase();
  return ["1", "true", "yes", "y", "checked", "found", "active", "running"].includes(text);
}

function normalizeManualAdsTransparency(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
  const raw = getObjectCandidate(
    body.manualAdsTransparency,
    body.manual_ads_transparency,
    privatePage.manualAdsTransparency,
    privatePage.manual_ads_transparency,
  );

  const adsFound = normalizeAdsFoundValue(
    raw.adsFound ?? raw.ads_found ?? body.manualAdsFound ?? body.manual_ads_found,
  );

  const checked = Boolean(
    raw.checked === true ||
      boolFromAny(raw.checked) ||
      boolFromAny(body.manualAdsChecked) ||
      boolFromAny(body.manual_ads_checked) ||
      adsFound !== "unknown",
  );

  return {
    checked,
    adsFound,
    ads_found: adsFound,
    source: firstCleanString(raw.source, raw.manual_ads_source, body.manualAdsSource, body.manual_ads_source, "Google Ads Transparency"),
    note: firstCleanString(raw.note, raw.manual_ads_note, body.manualAdsNote, body.manual_ads_note),
    checkedAt: firstCleanString(raw.checkedAt, raw.checked_at, body.manualAdsCheckedAt, body.manual_ads_checked_at),
    checked_at: firstCleanString(raw.checkedAt, raw.checked_at, body.manualAdsCheckedAt, body.manual_ads_checked_at),
  };
}

function getObjectCandidate(...values: any[]): AnyRecord {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as AnyRecord;
  }
  return {};
}


const PUBLIC_REPORT_COPY_BLOCKED_KEYS = new Set([
  "emailcopy",
  "emailcopyhtml",
  "emailcopytext",
  "emaildraft",
  "emaildrafthtml",
  "emaildrafttext",
  "emailmessage",
  "emailmessages",
  "emailoutreachcopy",
  "emailsubject",
  "emailbody",
  "linkedincopy",
  "linkedinmessage",
  "linkedinmessages",
  "linkedinmessagecopy",
  "linkedinoutreachcopy",
  "outreachcopy",
  "outreachcopies",
  "outreachmessage",
  "outreachmessages",
  "clientcopycontext",
  "rawgeminiresponse",
  "geminirawresponse",
  "rawauditjson",
  "rawaudit",
  "networkrequests",
  "observedrequests",
  "allrequests",
  "requestlogs",
  "debuglogs",
  "debug",
]);

function normalizePublicCopyKey(key: string): string {
  return String(key || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function isBlockedPublicReportCopyKey(key: string): boolean {
  const normalized = normalizePublicCopyKey(key);
  if (!normalized) return true;

  if (PUBLIC_REPORT_COPY_BLOCKED_KEYS.has(normalized)) return true;

  return (
    normalized.includes("emailcopy") ||
    normalized.includes("emaildraft") ||
    normalized.includes("linkedincopy") ||
    normalized.includes("linkedinmessage") ||
    normalized.includes("outreachcopy") ||
    normalized.includes("outreachmessage") ||
    normalized.includes("rawgemini") ||
    normalized.includes("networkrequests") ||
    normalized.includes("observedrequests") ||
    normalized.includes("debuglog")
  );
}

function sanitizePublicReportCopyObject(value: any, maxKeys = 40): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const output: AnyRecord = {};
  let count = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    if (count >= maxKeys) break;
    if (!key || rawValue === undefined || typeof rawValue === "function" || isBlockedPublicReportCopyKey(key)) continue;
    if (isBlockedPublicReportCopyKey(key)) continue;

    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      output[key] = rawValue;
      count += 1;
      continue;
    }

    if (Array.isArray(rawValue)) {
      output[key] = rawValue
        .slice(0, 12)
        .map((item) => {
          if (item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") return item;
          if (item && typeof item === "object" && !Array.isArray(item)) return sanitizePublicReportCopyObject(item, 12);
          return null;
        })
        .filter((item) => item !== null && item !== undefined);
      count += 1;
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      output[key] = sanitizePublicReportCopyObject(rawValue, 12);
      count += 1;
    }
  }

  return output;
}

function sanitizePlainObject(value: any, maxKeys = 30): AnyRecord {
  /**
   * Firestore-safe public report object sanitizer.
   * Keeps only JSON-safe values from the register payload so the public /r page
   * can receive richer professional report sections without storing huge raw audit objects.
   */
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const output: AnyRecord = {};
  let count = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    if (count >= maxKeys) break;
    if (!key || rawValue === undefined || typeof rawValue === "function") continue;

    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      output[key] = rawValue;
      count += 1;
      continue;
    }

    if (Array.isArray(rawValue)) {
      output[key] = rawValue
        .slice(0, 12)
        .map((item) => {
          if (item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") return item;
          if (item && typeof item === "object" && !Array.isArray(item)) return sanitizePlainObject(item, 12);
          return null;
        })
        .filter((item) => item !== null && item !== undefined);
      count += 1;
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      output[key] = sanitizePlainObject(rawValue, 12);
      count += 1;
    }
  }

  return output;
}

function normalizeReportCards(value: any, fallbackEvidence: string[] = [], maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const title = firstCleanString(record.title, record.problem, record.name, record.label);
    const finding = firstCleanString(record.finding, record.summary, record.description, record.text);
    const businessMeaning = firstCleanString(
      record.businessMeaning,
      record.business_meaning,
      record.businessImpact,
      record.business_impact,
      record.whyItMatters,
      record.why_it_matters,
      record.impact,
    );
    const nextCheck = firstCleanString(
      record.nextCheck,
      record.next_check,
      record.manualCheck,
      record.manual_check,
      record.recommendation,
      record.nextStep,
      record.next_step,
    );
    const evidence = normalizeStringArray(record.evidence || record.evidencePoints || record.evidence_points, 4);
    const key = `${title}|${finding}`.toLowerCase();

    if (!title && !finding) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      title: title || "Tracking item to verify",
      finding: finding || "Browser-visible evidence suggests this area is worth checking.",
      businessMeaning: businessMeaning || "This can affect how confidently marketing enquiries are measured and attributed.",
      nextCheck: nextCheck || "Confirm this item inside the relevant tracking account, CRM, or server records.",
      evidence,
    });

    if (output.length >= maxItems) break;
  }

  if (output.length) return output;

  return fallbackEvidence.slice(0, Math.min(3, maxItems)).map((item, index) => ({
    title: index === 0 ? "Tracking evidence to verify" : `Evidence item ${index + 1}`,
    finding: item,
    businessMeaning: "This point should be confirmed before making budget or reporting decisions.",
    nextCheck: "Confirm this item inside the relevant tracking account, CRM, or server records.",
    evidence: [],
  }));
}

function normalizeVerificationPlan(value: any, fallback: AnyRecord[] | string[] = [], maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value) && value.length ? value : fallback;
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of Array.isArray(rawItems) ? rawItems : []) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as AnyRecord;
      const title = firstCleanString(record.title, record.step, record.name, record.description);
      const description = firstCleanString(record.description, record.detail, record.summary, record.text);
      const priority = firstCleanString(record.priority, `Priority ${output.length + 1}`);
      const estimatedEffort = firstCleanString(record.estimatedEffort, record.estimated_effort, record.effort, "Short review");
      const key = `${title}|${description}`.toLowerCase();

      if ((title || description) && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority,
          title: title || description,
          description,
          estimatedEffort,
        });
      }
    } else {
      const title = firstCleanString(item);
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority: `Priority ${output.length + 1}`,
          title,
          description: "",
          estimatedEffort: "Short review",
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeWebsiteSpeedSnapshot(...values: any[]): AnyRecord | null {
  const raw = getObjectCandidate(...values);
  if (!Object.keys(raw).length) return null;

  const snapshot: AnyRecord = {};
  const allowedKeys = [
    "score",
    "label",
    "speedScore",
    "speed_score",
    "performance_score",
    "homepage_load_time_seconds",
    "visual_load_estimate_seconds",
    "dom_content_loaded_seconds",
    "network_idle_seconds",
    "audit_total_scan_time_seconds",
    "request_count",
    "third_party_request_count",
    "unique_host_count",
    "scanned_page_count",
    "client_facing_note",
    "note",
    "truth_note",
    "url",
    "page_url",
  ];

  for (const key of allowedKeys) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") {
      snapshot[key] = raw[key];
    }
  }

  if (!Object.keys(snapshot).length) return sanitizePlainObject(raw, 20);
  return snapshot;
}

function normalizeCtaInteractionReport(...values: any[]): AnyRecord | null {
  const raw = getObjectCandidate(...values);
  if (!Object.keys(raw).length) return null;

  const testedItems = Array.isArray(raw.testedItems)
    ? raw.testedItems
    : Array.isArray(raw.tested_items)
      ? raw.tested_items
      : [];

  return {
    ...sanitizePlainObject(raw, 24),
    enabled: raw.enabled !== false,
    tested: Boolean(raw.tested || raw.ctasTested || raw.ctas_tested || testedItems.length),
    status: firstCleanString(raw.status, raw.verdict, raw.test_status, "not_tested"),
    ctasFound: Number(raw.ctasFound ?? raw.ctas_found ?? testedItems.length ?? 0) || 0,
    ctas_found: Number(raw.ctas_found ?? raw.ctasFound ?? testedItems.length ?? 0) || 0,
    ctasTested: Number(raw.ctasTested ?? raw.ctas_tested ?? 0) || 0,
    ctas_tested: Number(raw.ctas_tested ?? raw.ctasTested ?? 0) || 0,
    trackingObserved: Boolean(raw.trackingObserved || raw.tracking_observed),
    tracking_observed: Boolean(raw.tracking_observed || raw.trackingObserved),
    googleAdsAfterClick: Boolean(raw.googleAdsAfterClick || raw.google_ads_after_click || raw.google_ads_conversion_after_click),
    google_ads_after_click: Boolean(raw.google_ads_after_click || raw.googleAdsAfterClick || raw.google_ads_conversion_after_click),
    ga4EventsAfterClick: normalizeStringArray(raw.ga4EventsAfterClick || raw.ga4_events_after_click, 10),
    ga4_events_after_click: normalizeStringArray(raw.ga4_events_after_click || raw.ga4EventsAfterClick, 10),
    metaEventsAfterClick: normalizeStringArray(raw.metaEventsAfterClick || raw.meta_events_after_click, 10),
    meta_events_after_click: normalizeStringArray(raw.meta_events_after_click || raw.metaEventsAfterClick, 10),
    testedItems: testedItems.slice(0, 10).map((item: any) => sanitizePlainObject(item, 20)),
    tested_items: testedItems.slice(0, 10).map((item: any) => sanitizePlainObject(item, 20)),
    truthNote: firstCleanString(raw.truthNote, raw.truth_note),
    truth_note: firstCleanString(raw.truth_note, raw.truthNote),
  };
}


async function requireReportRegisterAccess(req: Request) {
  const expected = process.env.REPORT_REGISTER_SECRET || "";
  if (expected) {
    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
    const secret = req.headers.get("x-report-register-secret") || bearer;
    if (secret && safeEqual(secret, expected)) return { uid: "report-register-secret", email: "python-export" };
  }
  return await requireAdmin(req);
}

function getReportTimestamp(value: any, fallbackDays = 30) {
  const parsed = timestampFromAny(value);
  if (parsed) return parsed;
  return admin.firestore.Timestamp.fromMillis(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}


// TrackFlow Pro v27.63 - Manual evidence secure-page hero support
// Narrow register-layer support only. Does not touch secure page analytics,
// PDF open/download tracking, video tracking, email automation, or cleanup logic.
function tfpV2763CleanSentence(value: any, limit = 520): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return limit && text.length > limit ? `${text.slice(0, Math.max(0, limit - 3)).trim()}...` : text;
}

function tfpV2763ActionType(value: any, fallback = "form_submission"): string {
  const raw = String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const aliases: Record<string, string> = {
    auto: fallback,
    unknown: fallback,
    form: "form_submission",
    contact_form: "form_submission",
    contact_form_submission: "form_submission",
    lead_form: "form_submission",
    lead_form_submission: "form_submission",
    submit_form: "form_submission",
    form_submit: "form_submission",
    generate_lead: "form_submission",
    phone: "phone_call",
    call: "phone_call",
    phone_click: "phone_call",
    call_click: "phone_call",
    click_to_call: "phone_call",
    booking: "booking_appointment",
    appointment: "booking_appointment",
    book_appointment: "booking_appointment",
    schedule: "booking_appointment",
    cart: "add_to_cart",
    add_cart: "add_to_cart",
    checkout: "begin_checkout",
    email: "email_click",
    whatsapp: "whatsapp_click",
  };
  return aliases[raw] || raw || fallback;
}

function tfpV2763DefaultLabel(actionType: any): string {
  const labels: Record<string, string> = {
    form_submission: "Contact Form Submission",
    phone_call: "Phone Call",
    booking_appointment: "Booking / Appointment",
    add_to_cart: "Add to Cart",
    begin_checkout: "Begin Checkout",
    purchase: "Purchase / Checkout",
    email_click: "Email Click",
    whatsapp_click: "WhatsApp Click",
  };
  return labels[tfpV2763ActionType(actionType)] || "Selected Conversion Action";
}

function tfpV2763Status(value: any, fallback = "not_sure"): string {
  const raw = String(value === undefined || value === null || value === "" ? fallback : value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const aliases: Record<string, string> = {
    true: "yes", "1": "yes", yes_observed: "yes", observed: "yes", found: "yes", fired: "yes", confirmed: "yes", completed: "yes", passed: "yes",
    false: "no", "0": "no", no_not_observed: "no", not_observed: "no", not_found: "no", not_fired: "no", failed: "no",
    unclear: "not_sure", not_clear: "not_sure", not_sure_unclear: "not_sure", unknown: "not_sure", maybe: "not_sure",
    untested: "not_tested",
  };
  const normalized = aliases[raw] || raw;
  return ["yes", "no", "not_sure", "not_tested"].includes(normalized) ? normalized : fallback;
}

function tfpV2763StatusLabel(value: any): string {
  const status = tfpV2763Status(value);
  if (status === "yes") return "Observed";
  if (status === "no") return "Not clearly observed";
  if (status === "not_tested") return "Not tested";
  return "Unclear / needs verification";
}

function tfpV2763DefaultExpectedEvent(actionType: any): string {
  const defaults: Record<string, string> = {
    form_submission: "form_submit / generate_lead",
    phone_call: "phone_click",
    booking_appointment: "booking_search / begin_checkout / generate_lead",
    add_to_cart: "add_to_cart",
    begin_checkout: "begin_checkout",
    purchase: "purchase",
    email_click: "email_click",
    whatsapp_click: "whatsapp_click",
  };
  return defaults[tfpV2763ActionType(actionType)] || "generate_lead";
}

function tfpV2763ExpectedLooksResultLike(value: any): boolean {
  const text = tfpV2763CleanSentence(value, 180).toLowerCase();
  if (!text) return false;
  return /\b(no|not|nothing|none)\b.*\b(event|observed|found|fired|visible)\b|\bpage[_\s-]*view\s+only\b|\bonly\s+page[_\s-]*view\b|\bnot\s+clearly\b|\bno\s+clear\b/i.test(text);
}

function tfpV2763ExpectedObserved(actionType: string, expected: any, observed: any): { expectedEvent: string; observedEventName: string } {
  let expectedEvent = tfpV2763CleanSentence(expected, 140);
  let observedEventName = tfpV2763CleanSentence(observed, 180);
  if (tfpV2763ExpectedLooksResultLike(expectedEvent)) {
    if (!observedEventName) observedEventName = expectedEvent;
    expectedEvent = tfpV2763DefaultExpectedEvent(actionType);
  }
  if (!expectedEvent) expectedEvent = tfpV2763DefaultExpectedEvent(actionType);
  return { expectedEvent, observedEventName };
}

function tfpV2763NormalizeAction(rawValue: any, slot: "primary" | "secondary", fallbackActionType = "form_submission"): AnyRecord {
  const raw = getObjectCandidate(rawValue);
  const actionType = tfpV2763ActionType(firstCleanString(raw.actionType, raw.action_type, raw.type, raw.action, raw.conversionAction, raw.conversion_action), fallbackActionType);
  const label = tfpV2763CleanSentence(firstCleanString(raw.label, raw.actionLabel, raw.action_label, raw.name), 120) || tfpV2763DefaultLabel(actionType);
  const { expectedEvent, observedEventName } = tfpV2763ExpectedObserved(
    actionType,
    firstCleanString(raw.expectedEvent, raw.expected_event, raw.expected, raw.expectedEventName, raw.expected_event_name),
    firstCleanString(raw.observedEventName, raw.observed_event_name, raw.observedEvent, raw.observed_event, raw.eventName, raw.event_name),
  );
  const actionCompleted = tfpV2763Status(firstCleanString(raw.actionCompleted, raw.action_completed, raw.completed), "not_tested");
  const ga4EventObserved = tfpV2763Status(firstCleanString(raw.ga4EventObserved, raw.ga4_event_observed, raw.ga4Event, raw.ga4_event, raw.eventObserved, raw.event_observed), "not_sure");
  const googleAdsConversionObserved = tfpV2763Status(firstCleanString(raw.googleAdsConversionObserved, raw.google_ads_conversion_observed, raw.googleAdsObserved, raw.google_ads_observed, raw.googleAdsConversion, raw.google_ads_conversion), "not_sure");
  const gtmTriggerObserved = tfpV2763Status(firstCleanString(raw.gtmTriggerObserved, raw.gtm_trigger_observed, raw.gtmObserved, raw.gtm_observed, raw.gtmTrigger, raw.gtm_trigger), "not_sure");
  const trackingObserved = ga4EventObserved === "yes" || googleAdsConversionObserved === "yes" || gtmTriggerObserved === "yes";
  const testUrl = sanitizeOptionalUrl(firstCleanString(raw.testUrl, raw.test_url, raw.url, raw.pageUrl, raw.page_url));
  const evidenceNote = tfpV2763CleanSentence(firstCleanString(raw.evidenceNote, raw.evidence_note, raw.operatorNote, raw.operator_note, raw.note, raw.notes), 520);
  return {
    slot,
    label,
    actionType,
    action_type: actionType,
    tool: tfpV2763CleanSentence(firstCleanString(raw.tool, raw.toolUsed, raw.tool_used, "Tag Assistant"), 90),
    actionCompleted,
    action_completed: actionCompleted,
    ga4EventObserved,
    ga4_event_observed: ga4EventObserved,
    googleAdsConversionObserved,
    google_ads_conversion_observed: googleAdsConversionObserved,
    gtmTriggerObserved,
    gtm_trigger_observed: gtmTriggerObserved,
    testUrl,
    test_url: testUrl,
    expectedEvent,
    expected_event: expectedEvent,
    observedEventName,
    observed_event_name: observedEventName,
    evidenceNote,
    evidence_note: evidenceNote,
    trackingObserved,
    tracking_observed: trackingObserved,
  };
}

function tfpV2763ActionHasEvidence(action: AnyRecord, slot: "primary" | "secondary"): boolean {
  if (!action) return false;
  if (slot === "primary" && action.actionType) return true;
  if (["yes", "no"].includes(tfpV2763Status(action.actionCompleted || action.action_completed, "not_tested"))) return true;
  return Boolean(action.testUrl || action.test_url || action.observedEventName || action.observed_event_name || action.evidenceNote || action.evidence_note);
}

function tfpV2763NormalizeManualEvidence(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
  const manual = getObjectCandidate(
    body.manualConversionEvidence,
    body.manual_conversion_evidence,
    body.manualTrackingEvidence,
    body.manual_tracking_evidence,
    body.operatorManualEvidence,
    body.operator_manual_evidence,
    privatePage.manualConversionEvidence,
    privatePage.manual_conversion_evidence,
    privatePage.manualTrackingEvidence,
    privatePage.manual_tracking_evidence,
  );
  if (!Object.keys(manual).length || manual.enabled === false) {
    const nowIso = new Date().toISOString();
    return {
      enabled: false,
      source: "operator_manual_tracking_review",
      primaryAction: {},
      primary_action: {},
      secondaryEnabled: false,
      secondary_enabled: false,
      secondaryAction: {},
      secondary_action: {},
      updatedAt: nowIso,
      updated_at: nowIso,
    };
  }
  const primaryRaw = getObjectCandidate(manual.primary_action, manual.primaryAction, manual.primary, manual);
  const primary = tfpV2763NormalizeAction(primaryRaw, "primary", firstCleanString(manual.actionType, manual.action_type, "form_submission"));
  const secondaryRaw = getObjectCandidate(manual.secondary_action, manual.secondaryAction, manual.secondary);
  const secondary = tfpV2763NormalizeAction(secondaryRaw, "secondary", "phone_call");
  const secondaryEnabled = Boolean(manual.secondary_enabled || manual.secondaryEnabled) && tfpV2763ActionHasEvidence(secondary, "secondary");
  const enabled = tfpV2763ActionHasEvidence(primary, "primary") || secondaryEnabled;
  const nowIso = new Date().toISOString();
  return {
    enabled,
    source: tfpV2763CleanSentence(firstCleanString(manual.source, "operator_manual_tracking_review"), 90),
    primaryAction: primary,
    primary_action: primary,
    secondaryEnabled,
    secondary_enabled: secondaryEnabled,
    secondaryAction: secondaryEnabled ? secondary : {},
    secondary_action: secondaryEnabled ? secondary : {},
    updatedAt: firstCleanString(manual.updatedAt, manual.updated_at, nowIso),
    updated_at: firstCleanString(manual.updatedAt, manual.updated_at, nowIso),
  };
}

function tfpV2763ActionPhrase(actionType: string): string {
  if (actionType === "phone_call") return "phone click action";
  if (actionType === "booking_appointment") return "booking journey";
  if (actionType === "add_to_cart") return "add-to-cart action";
  if (actionType === "begin_checkout") return "checkout-start action";
  if (actionType === "purchase") return "purchase / checkout action";
  if (actionType === "email_click") return "email click action";
  if (actionType === "whatsapp_click") return "WhatsApp click action";
  return "contact form action";
}

function tfpV2763BusinessRisk(actionType: string): string {
  if (actionType === "phone_call") return "If calls are an important lead source, Google Ads and GA4 may need a clear phone-click or call-tracking conversion signal.";
  if (actionType === "booking_appointment") return "If bookings are the main revenue action, campaigns may need a clear booking, begin-checkout, or lead event to optimize reliably.";
  if (["add_to_cart", "begin_checkout", "purchase"].includes(actionType)) return "If paid traffic depends on ecommerce optimization, the selected cart, checkout, or purchase event should be confirmed before relying on campaign reporting.";
  if (actionType === "email_click") return "If email clicks are a lead source, the event should be confirmed before using it for reporting or campaign optimization.";
  if (actionType === "whatsapp_click") return "If WhatsApp enquiries are a lead source, the click event should be confirmed before using it for reporting or campaign optimization.";
  return "If this form is the main lead source, Google Ads optimization may rely on weaker signals unless the lead event is confirmed inside the tracking accounts.";
}


function tfpV2763NormalizeIncomingManualEvidenceHero(rawValue: any): AnyRecord | null {
  const raw = getObjectCandidate(rawValue);
  if (!Object.keys(raw).length || raw.enabled === false) return null;

  const actionType = tfpV2763ActionType(firstCleanString(raw.actionType, raw.action_type), "form_submission");
  const label = tfpV2763CleanSentence(firstCleanString(raw.actionLabel, raw.action_label, raw.label, tfpV2763DefaultLabel(actionType)), 120) || tfpV2763DefaultLabel(actionType);
  const expectedEvent = tfpV2763CleanSentence(firstCleanString(raw.expectedEvent, raw.expected_event, tfpV2763DefaultExpectedEvent(actionType)), 140);
  const observedEvent = tfpV2763CleanSentence(firstCleanString(raw.observedEvent, raw.observed_event, "Not clearly observed"), 180);
  const title = tfpV2763CleanSentence(firstCleanString(raw.title, raw.headline, `${label} tracking should be verified`), 180);
  const summary = tfpV2763CleanSentence(firstCleanString(
    raw.summary,
    `The selected ${label.toLowerCase()} was reviewed from the browser side. The visible result should still be confirmed inside the actual tracking accounts before making final decisions.`,
  ), 520);
  const businessImpact = tfpV2763CleanSentence(firstCleanString(raw.businessImpact, raw.business_impact, tfpV2763BusinessRisk(actionType)), 420);
  const tool = tfpV2763CleanSentence(firstCleanString(raw.tool, "Tag Assistant"), 90);
  const testUrl = sanitizeOptionalUrl(firstCleanString(raw.testUrl, raw.test_url));
  const operatorNote = tfpV2763CleanSentence(firstCleanString(raw.operatorNote, raw.operator_note, raw.note), 520);

  if (!label && !expectedEvent && !observedEvent && !title && !summary) return null;

  return {
    enabled: true,
    source: tfpV2763CleanSentence(firstCleanString(raw.source, "operator_manual_tracking_review"), 90),
    label,
    actionLabel: label,
    action_label: label,
    actionType,
    action_type: actionType,
    title,
    headline: firstCleanString(raw.headline, title),
    summary,
    verificationMessage: tfpV2763CleanSentence(firstCleanString(raw.verificationMessage, raw.verification_message, `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent}. Final account-side confirmation is still required.`), 520),
    verification_message: tfpV2763CleanSentence(firstCleanString(raw.verificationMessage, raw.verification_message, `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent}. Final account-side confirmation is still required.`), 520),
    businessImpact,
    business_impact: businessImpact,
    expectedEvent,
    expected_event: expectedEvent,
    observedEvent,
    observed_event: observedEvent,
    tool,
    actionCompleted: firstCleanString(raw.actionCompleted, raw.action_completed, "Unclear / needs verification"),
    action_completed: firstCleanString(raw.actionCompleted, raw.action_completed, "Unclear / needs verification"),
    ga4Status: firstCleanString(raw.ga4Status, raw.ga4_status, "Unclear / needs verification"),
    ga4_status: firstCleanString(raw.ga4Status, raw.ga4_status, "Unclear / needs verification"),
    googleAdsStatus: firstCleanString(raw.googleAdsStatus, raw.google_ads_status, "Unclear / needs verification"),
    google_ads_status: firstCleanString(raw.googleAdsStatus, raw.google_ads_status, "Unclear / needs verification"),
    gtmStatus: firstCleanString(raw.gtmStatus, raw.gtm_status, "Unclear / needs verification"),
    gtm_status: firstCleanString(raw.gtmStatus, raw.gtm_status, "Unclear / needs verification"),
    testUrl,
    test_url: testUrl,
    operatorNote,
    operator_note: operatorNote,
    disclaimer: firstCleanString(raw.disclaimer, "This is browser-visible manual evidence only. Final recording must be confirmed inside GA4, GTM, Google Ads, CRM, call-tracking, booking engine, or server records."),
    severity: firstCleanString(raw.severity, "medium"),
  };
}

function tfpV2763BuildManualEvidenceHero(manualEvidence: AnyRecord = {}): AnyRecord | null {
  if (!manualEvidence.enabled) return null;
  const primary = getObjectCandidate(manualEvidence.primaryAction, manualEvidence.primary_action);
  const actionType = tfpV2763ActionType(primary.actionType || primary.action_type, "form_submission");
  const label = tfpV2763CleanSentence(primary.label, 120) || tfpV2763DefaultLabel(actionType);
  const actionCompleted = tfpV2763Status(primary.actionCompleted || primary.action_completed, "not_tested");
  const ga4Status = tfpV2763Status(primary.ga4EventObserved || primary.ga4_event_observed, "not_sure");
  const adsStatus = tfpV2763Status(primary.googleAdsConversionObserved || primary.google_ads_conversion_observed, "not_sure");
  const gtmStatus = tfpV2763Status(primary.gtmTriggerObserved || primary.gtm_trigger_observed, "not_sure");
  const expectedEvent = tfpV2763CleanSentence(primary.expectedEvent || primary.expected_event || tfpV2763DefaultExpectedEvent(actionType), 140);
  const observedEvent = tfpV2763CleanSentence(primary.observedEventName || primary.observed_event_name || "Not clearly observed", 180);
  const actionWasCompleted = actionCompleted === "yes";
  const conversionNotClear = actionWasCompleted && (adsStatus === "no" || ga4Status === "no" || (!primary.trackingObserved && !primary.tracking_observed));
  const title = conversionNotClear
    ? `${label} expected event was not clearly observed`
    : actionCompleted === "not_tested"
      ? `${label} still needs a controlled verification test`
      : `${label} conversion signal should be verified`;
  const summary = conversionNotClear
    ? `The selected ${tfpV2763ActionPhrase(actionType)} was completed from the browser side. The expected event (${expectedEvent}) was not clearly found during the manual review.`
    : actionCompleted === "not_tested"
      ? `The selected ${tfpV2763ActionPhrase(actionType)} is the main review target, but the action has not been completed in a controlled manual test yet.`
      : `The selected ${tfpV2763ActionPhrase(actionType)} was reviewed from the browser side. The visible result should still be confirmed inside the actual tracking accounts before making final decisions.`;
  const verificationMessage = conversionNotClear
    ? `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent}. This does not prove final tracking failure, but it should be checked inside GA4, GTM, Google Ads, and the relevant CRM, booking engine, call-tracking, or server records.`
    : actionCompleted === "not_tested"
      ? `Expected event to verify: ${expectedEvent}. Complete one controlled manual test, then compare the observed result inside Tag Assistant, GTM Preview, GA4 DebugView, and Google Ads diagnostics.`
      : `Expected event to verify: ${expectedEvent}. Compare the browser-visible result with GA4, GTM, Google Ads, and backend/account-side records before making final decisions.`;
  return {
    enabled: true,
    source: manualEvidence.source || "operator_manual_tracking_review",
    label,
    actionLabel: label,
    action_label: label,
    actionType,
    action_type: actionType,
    title,
    headline: title,
    summary,
    verificationMessage,
    verification_message: verificationMessage,
    businessImpact: tfpV2763BusinessRisk(actionType),
    expectedEvent,
    expected_event: expectedEvent,
    observedEvent,
    observed_event: observedEvent,
    tool: tfpV2763CleanSentence(primary.tool || "Tag Assistant", 90),
    actionCompleted: tfpV2763StatusLabel(actionCompleted),
    action_completed: tfpV2763StatusLabel(actionCompleted),
    ga4Status: tfpV2763StatusLabel(ga4Status),
    ga4_status: tfpV2763StatusLabel(ga4Status),
    googleAdsStatus: adsStatus === "yes" ? "Observed (verify conversion label)" : tfpV2763StatusLabel(adsStatus),
    google_ads_status: adsStatus === "yes" ? "Observed (verify conversion label)" : tfpV2763StatusLabel(adsStatus),
    gtmStatus: tfpV2763StatusLabel(gtmStatus),
    gtm_status: tfpV2763StatusLabel(gtmStatus),
    testUrl: primary.testUrl || primary.test_url || "",
    test_url: primary.testUrl || primary.test_url || "",
    operatorNote: tfpV2763CleanSentence(primary.evidenceNote || primary.evidence_note, 520),
    operator_note: tfpV2763CleanSentence(primary.evidenceNote || primary.evidence_note, 520),
    disclaimer: "This is browser-visible manual evidence only. Final recording must be confirmed inside GA4, GTM, Google Ads, CRM, call-tracking, booking engine, or server records.",
    severity: conversionNotClear ? "high" : "medium",
  };
}

function tfpV2763ManualSnapshotQuestions(hero: AnyRecord): string[] {
  const action = firstCleanString(hero.actionLabel, hero.action_label, hero.label, "selected customer action");
  const expected = firstCleanString(hero.expectedEvent, hero.expected_event, "the expected conversion event");
  const observed = firstCleanString(hero.observedEvent, hero.observed_event, "the observed browser-side result");
  return normalizeStringArray([
    `Was ${expected} observed after the ${action} review?`,
    `Why does the observed result (${observed}) matter for Google Ads reporting?`,
    `What should be checked inside GA4, GTM, and Google Ads for this ${action}?`,
    "Could this affect optimization if ads are active?",
  ], 4);
}

function tfpV2763ManualVerificationPlan(hero: AnyRecord): AnyRecord[] {
  const action = firstCleanString(hero.actionLabel, hero.action_label, hero.label, "selected customer action");
  const expected = firstCleanString(hero.expectedEvent, hero.expected_event, "the expected conversion event");
  const observed = firstCleanString(hero.observedEvent, hero.observed_event, "the observed browser-side result");
  return normalizeVerificationPlan([
    `Run one controlled ${action} test on the Reviewed page.`,
    `Confirm whether ${expected} fires in GTM Preview for the same action.`,
    `Check GA4 DebugView or GA4 events for ${expected}, not only ${observed}.`,
    "Review Google Ads conversion diagnostics for the matching conversion action.",
  ], [], 4);
}

function tfpV2763ManualWhatChecked(hero: AnyRecord, existing: string[]): string[] {
  const action = firstCleanString(hero.actionLabel, hero.action_label, hero.label, "selected customer action");
  const expected = firstCleanString(hero.expectedEvent, hero.expected_event, "the expected conversion event");
  const observed = firstCleanString(hero.observedEvent, hero.observed_event, "not clearly observed");
  return normalizeStringArray([
    `Reviewed page ${action} journey.`,
    `Expected event: ${expected}`,
    `Observed event: ${observed}`,
    ...existing,
    "Browser-visible request evidence and manual conversion-path context.",
  ], 8);
}

function tfpV2749NormalizeReportPayloadBase(body: AnyRecord = {}) {
  const token = normalizeReportToken(body.token || body.reportToken || body.report_token) || createReportToken();
  const domain = firstCleanString(body.domain, body.websiteUrl, body.website_url, body.website, body.url);
  const companyName = firstCleanString(body.companyName, body.company_name, body.businessName, body.business_name, domain);
  const domainSlug = normalizeReportSlug(body.domainSlug || body.domain_slug || body.reportSlug || body.report_slug || domain || companyName || "website");
  const pdfViewUrl = sanitizeOptionalUrl(
    body.pdfViewUrl ||
      body.pdf_view_url ||
      body.blobUrl ||
      body.blob_url ||
      body.blobViewUrl ||
      body.blob_view_url ||
      body.driveViewUrl ||
      body.drive_view_url ||
      body.pdfUrl ||
      body.pdf_url ||
      "",
  );
  const pdfDownloadUrl = sanitizeOptionalUrl(
    body.pdfDownloadUrl ||
      body.pdf_download_url ||
      body.blobDownloadUrl ||
      body.blob_download_url ||
      body.downloadUrl ||
      body.download_url ||
      body.driveDownloadUrl ||
      body.drive_download_url ||
      pdfViewUrl ||
      "",
  );
  const reportUrl = sanitizePublicReportUrl(body.reportUrl || body.report_url) || buildPublicReportUrl(token, domainSlug);

  const ogImageUrl = sanitizeOptionalUrl(
    body.ogImageUrl ||
      body.og_image_url ||
      body.openGraphImageUrl ||
      body.open_graph_image_url ||
      body.previewImageUrl ||
      body.preview_image_url ||
      body.homepageScreenshotUrl ||
      body.homepage_screenshot_url ||
      "",
  );
  const openGraphImageUrl = sanitizeOptionalUrl(
    body.openGraphImageUrl ||
      body.open_graph_image_url ||
      ogImageUrl ||
      body.previewImageUrl ||
      body.preview_image_url ||
      body.homepageScreenshotUrl ||
      body.homepage_screenshot_url ||
      "",
  );
  const previewImageUrl = sanitizeOptionalUrl(
    body.previewImageUrl ||
      body.preview_image_url ||
      ogImageUrl ||
      openGraphImageUrl ||
      body.homepageScreenshotUrl ||
      body.homepage_screenshot_url ||
      "",
  );
  const homepageScreenshotUrl = sanitizeOptionalUrl(
    body.homepageScreenshotUrl ||
      body.homepage_screenshot_url ||
      previewImageUrl ||
      ogImageUrl ||
      openGraphImageUrl ||
      "",
  );
  const ogImagePathname = firstCleanString(
    body.ogImagePathname,
    body.og_image_pathname,
    body.previewImagePathname,
    body.preview_image_pathname,
    body.homepageScreenshotPathname,
    body.homepage_screenshot_pathname,
    "",
  );

  const rawSecurePageCopy = getObjectCandidate(
    body.securePageCopy,
    body.secure_page_copy,
    body.privateReportPage,
    body.private_report_page,
  );
  const rawPrivateReportCopy = getObjectCandidate(
    rawSecurePageCopy,
    body.privateReportCopy,
    body.private_report_copy,
    body.aiPrivateReportCopy,
    body.ai_private_report_copy,
  );
  const privateReportCopy = sanitizePublicReportCopyObject(rawPrivateReportCopy, 40);
  const privatePage = sanitizePublicReportCopyObject(getObjectCandidate(rawSecurePageCopy, privateReportCopy), 40);
  const manualAdsTransparency = normalizeManualAdsTransparency(body, privatePage);
  const evidenceVideo = normalizeEvidenceVideoPayload(body, privatePage);
  const emailPreviewImage = normalizeEmailPreviewImageAssetPayload(body, privatePage);
  const emailPreviewImageUrl = sanitizeOptionalUrl(firstCleanString(
    body.emailPreviewImageUrl,
    body.email_preview_image_url,
    privatePage.emailPreviewImageUrl,
    privatePage.email_preview_image_url,
    emailPreviewImage?.publicUrl,
    emailPreviewImage?.public_url,
  ));
  const emailPreviewImageWebpUrl = sanitizeOptionalUrl(firstCleanString(
    body.emailPreviewImageWebpUrl,
    body.email_preview_image_webp_url,
    privatePage.emailPreviewImageWebpUrl,
    privatePage.email_preview_image_webp_url,
    emailPreviewImage?.mimeType === "image/webp" ? (emailPreviewImage?.publicUrl || emailPreviewImage?.public_url) : "",
  ));
  const emailPreviewImageB2Key = firstCleanString(
    body.emailPreviewImageB2Key,
    body.email_preview_image_b2_key,
    privatePage.emailPreviewImageB2Key,
    privatePage.email_preview_image_b2_key,
    emailPreviewImage?.b2Key,
    emailPreviewImage?.b2_key,
  );
  const emailPreviewImageMimeType = firstCleanString(
    body.emailPreviewImageMimeType,
    body.email_preview_image_mime_type,
    privatePage.emailPreviewImageMimeType,
    privatePage.email_preview_image_mime_type,
    emailPreviewImage?.mimeType,
    emailPreviewImage?.mime_type,
  );
  const emailPreviewImageSizeBytes = Number(
    body.emailPreviewImageSizeBytes ||
      body.email_preview_image_size_bytes ||
      privatePage.emailPreviewImageSizeBytes ||
      privatePage.email_preview_image_size_bytes ||
      emailPreviewImage?.sizeBytes ||
      emailPreviewImage?.size_bytes ||
      0,
  ) || 0;
  const manualConversionEvidence = tfpV2763NormalizeManualEvidence(body, privatePage);
  const incomingManualEvidenceHero = tfpV2763NormalizeIncomingManualEvidenceHero(
    getObjectCandidate(
      body.manualEvidenceHero,
      body.manual_evidence_hero,
      privatePage.manualEvidenceHero,
      privatePage.manual_evidence_hero,
    ),
  );
  const manualEvidenceHero = tfpV2763BuildManualEvidenceHero(manualConversionEvidence) || incomingManualEvidenceHero;

  const headline = firstCleanString(
    manualEvidenceHero?.headline,
    body.headline,
    privatePage.headline,
    privatePage.privatePageHeadline,
    body.clientMessageHeadline,
    body.client_message_headline,
    body.mainIssue,
    body.main_issue,
    "Private tracking audit note",
  );

  const subheadline = firstCleanString(
    body.subheadline,
    body.privatePageSubheadline,
    body.private_page_subheadline,
    privatePage.subheadline,
    privatePage.privatePageSubheadline,
    privatePage.privatePageSummary,
  );

  const mainFinding = firstCleanString(
    manualEvidenceHero?.title,
    body.mainFinding,
    body.main_finding,
    privatePage.mainFinding,
    body.mainIssue,
    body.main_issue,
    body.problemSummary,
    body.problem_summary,
  );

  const businessImpact = firstCleanString(
    manualEvidenceHero?.businessImpact,
    body.businessImpact,
    body.business_impact,
    privatePage.businessImpact,
    body.impact,
    body.messageAngle,
    body.message_angle,
  );

  const proofPoints = normalizeStringArray(
    privatePage.proofPoints || privatePage.proof_points || body.proofPoints || body.proof_points || body.evidencePoints || body.evidence_points,
    10,
  );

  const recommendations = normalizeRecommendationArray(
    privatePage.recommendations || privatePage.recommendedFixPlan || privatePage.recommended_fix_plan || body.recommendations || body.fixRecommendations || body.fix_recommendations,
    8,
  );

  let whatChecked = normalizeStringArray(
    privatePage.whatChecked || privatePage.what_checked || privatePage.checks || body.whatChecked || body.what_checked || body.auditScope || body.audit_scope,
    8,
  );

  let auditSnapshotQuestions = normalizeStringArray(
    privatePage.auditSnapshotQuestions || privatePage.audit_snapshot_questions || privatePage.snapshotQuestions || body.auditSnapshotQuestions || body.audit_snapshot_questions,
    4,
  );

  const trustNotes = normalizeStringArray(
    privatePage.trustNotes || privatePage.trust_notes || privatePage.trustSignals || body.trustNotes || body.trust_notes || body.trustSignals,
    4,
  );

  const howToReadParagraphs = normalizeStringArray(
    privatePage.howToReadParagraphs || privatePage.how_to_read_paragraphs || privatePage.howToReadThisReview || body.howToReadParagraphs || body.how_to_read_paragraphs || body.howToReadThisReview,
    4,
  );

  const problemCards = normalizeReportCards(
    privatePage.problemCards || privatePage.businessProblems || body.problemCards || body.businessProblems,
    proofPoints,
    4,
  );

  let verificationPlan = normalizeVerificationPlan(
    privatePage.verificationPlan ||
      privatePage.verification_plan ||
      privatePage.recommendedFixPlan ||
      privatePage.recommended_fix_plan ||
      body.verificationPlan ||
      body.verification_plan ||
      body.recommendedFixPlan ||
      body.recommended_fix_plan,
    recommendations,
    4,
  );

  if (manualEvidenceHero) {
    whatChecked = tfpV2763ManualWhatChecked(manualEvidenceHero, whatChecked);
    auditSnapshotQuestions = tfpV2763ManualSnapshotQuestions(manualEvidenceHero);
    verificationPlan = tfpV2763ManualVerificationPlan(manualEvidenceHero);
  }

  const websiteSpeed = normalizeWebsiteSpeedSnapshot(
    privatePage.websiteSpeed,
    privatePage.website_speed,
    body.websiteSpeed,
    body.website_speed,
    body.speed,
  );

  const ctaInteractionTest = normalizeCtaInteractionReport(
    privatePage.ctaInteractionTest,
    privatePage.cta_interaction_test,
    privatePage.leadActionTest,
    privatePage.lead_action_test,
    body.ctaInteractionTest,
    body.cta_interaction_test,
    body.leadActionTest,
    body.lead_action_test,
  );

  const email = normalizeEmail(body.email || body.finalEmail || body.final_email || "");
  const leadId = firstCleanString(body.leadId, body.firestoreLeadId, body.firestore_lead_id);
  const sheetRowNumber = Number(body.sheetRowNumber || body.sheet_row_number || 0) || null;
  const pdfExpiresAt = getReportTimestamp(body.pdfExpiresAt || body.pdf_expires_at || body.expiresAt || body.expires_at, 45);

  const ctaText = firstCleanString(
    body.ctaText,
    body.cta_text,
    privatePage.ctaText,
    privatePage.cta_text,
    "Book a tracking review",
  );

  const normalizedPrivateReportCopy = {
    headline,
    subheadline,
    mainFinding,
    businessImpact,
    proofPoints,
    recommendations,
    problemCards,
    businessProblems: problemCards,
    verificationPlan,
    verification_plan: verificationPlan,
    websiteSpeed,
    website_speed: websiteSpeed,
    ctaInteractionTest,
    cta_interaction_test: ctaInteractionTest,
    whatChecked,
    auditSnapshotTitle: firstCleanString(
      manualEvidenceHero?.actionLabel ? `${manualEvidenceHero.actionLabel} tracking snapshot` : "",
      privatePage.auditSnapshotTitle,
      privatePage.audit_snapshot_title,
      body.auditSnapshotTitle,
      body.audit_snapshot_title,
      "What this review is designed to clarify",
    ),
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: firstCleanString(privatePage.howToReadTitle, privatePage.how_to_read_title, body.howToReadTitle, body.how_to_read_title, "How to read this review"),
    howToReadParagraphs,
    ctaHeadline: firstCleanString(privatePage.ctaHeadline, privatePage.cta_headline, body.ctaHeadline, body.cta_headline, "Want this verified inside your actual accounts?"),
    ctaText,
    manualAdsTransparency,
    manual_ads_transparency: manualAdsTransparency,
    manualConversionEvidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manual_conversion_evidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manualEvidenceHero: manualEvidenceHero || undefined,
    manual_evidence_hero: manualEvidenceHero || undefined,
    evidenceVideo: evidenceVideo.enabled ? evidenceVideo : undefined,
    evidence_video: evidenceVideo.enabled ? evidenceVideo : undefined,
    emailPreviewImage: emailPreviewImage || undefined,
    email_preview_image: emailPreviewImage || undefined,
    emailPreviewImageUrl,
    email_preview_image_url: emailPreviewImageUrl,
    emailPreviewImageWebpUrl,
    email_preview_image_webp_url: emailPreviewImageWebpUrl,
    emailPreviewImageB2Key,
    email_preview_image_b2_key: emailPreviewImageB2Key,
    emailPreviewImageMimeType,
    email_preview_image_mime_type: emailPreviewImageMimeType,
    emailPreviewImageSizeBytes,
    email_preview_image_size_bytes: emailPreviewImageSizeBytes,
    privateReportVersion: firstCleanString(privatePage.privateReportVersion, privatePage.private_report_version, body.privateReportVersion, body.private_report_version),
  };

  return {
    token,
    domainSlug,
    domain_slug: domainSlug,
    reportUrl,
    ogImageUrl,
    openGraphImageUrl: openGraphImageUrl || ogImageUrl,
    previewImageUrl: previewImageUrl || ogImageUrl || openGraphImageUrl,
    homepageScreenshotUrl: homepageScreenshotUrl || previewImageUrl || ogImageUrl || openGraphImageUrl,
    emailPreviewImage: emailPreviewImage || null,
    email_preview_image: emailPreviewImage || null,
    emailPreviewImageUrl,
    email_preview_image_url: emailPreviewImageUrl,
    emailPreviewImageWebpUrl,
    email_preview_image_webp_url: emailPreviewImageWebpUrl,
    emailPreviewImageB2Key,
    email_preview_image_b2_key: emailPreviewImageB2Key,
    emailPreviewImageMimeType,
    email_preview_image_mime_type: emailPreviewImageMimeType,
    emailPreviewImageSizeBytes,
    email_preview_image_size_bytes: emailPreviewImageSizeBytes,
    ogImagePathname,
    domain,
    websiteUrl: firstCleanString(body.websiteUrl, body.website_url, body.website, domain ? `https://${domain}` : ""),
    companyName,
    email,
    headline,
    subheadline,
    mainFinding,
    businessImpact,
    proofPoints,
    recommendations,
    problemCards,
    businessProblems: problemCards,
    verificationPlan,
    verification_plan: verificationPlan,
    websiteSpeed,
    website_speed: websiteSpeed,
    ctaInteractionTest,
    cta_interaction_test: ctaInteractionTest,
    whatChecked,
    auditSnapshotTitle: normalizedPrivateReportCopy.auditSnapshotTitle,
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: normalizedPrivateReportCopy.howToReadTitle,
    howToReadParagraphs,
    ctaHeadline: normalizedPrivateReportCopy.ctaHeadline,
    privateReportCopy: normalizedPrivateReportCopy,
    securePageCopy: normalizedPrivateReportCopy,
    secure_page_copy: normalizedPrivateReportCopy,
    privateReportVersion: normalizedPrivateReportCopy.privateReportVersion,
    manualAdsTransparency,
    manual_ads_transparency: manualAdsTransparency,
    manualConversionEvidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manual_conversion_evidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manualEvidenceHero: manualEvidenceHero || undefined,
    manual_evidence_hero: manualEvidenceHero || undefined,
    manual_ads_checked: manualAdsTransparency.checked,
    manual_ads_found: manualAdsTransparency.adsFound,
    manual_ads_source: manualAdsTransparency.source,
    manual_ads_note: manualAdsTransparency.note,
    manual_ads_checked_at: manualAdsTransparency.checkedAt,
    pdfFileId: firstCleanString(
      body.pdfFileId,
      body.pdf_file_id,
      body.blobFileId,
      body.blob_file_id,
      body.blobPathname,
      body.blob_pathname,
      body.pathname,
      body.driveFileId,
      body.drive_file_id,
      body.googleDriveFileId,
    ),
    pdfViewUrl,
    pdfDownloadUrl,
    pdfExpiresAt,
    leadId,
    sheetRowNumber,
    source: firstCleanString(body.source, "python_blob_export"),
    auditId: firstCleanString(body.auditId, body.audit_id, body.sourceAuditId, body.source_audit_id),
    storageProvider: firstCleanString(
      body.storageProvider,
      body.storage_provider,
      (body.b2Key || body.b2_key || body.pdfStorageKey || body.pdf_storage_key || body.storageProvider === "backblaze_b2" || body.storage_provider === "backblaze_b2")
        ? "backblaze_b2"
        : body.blobUrl || body.blob_url
          ? "vercel_blob"
          : "storage",
    ),
    blobUrl: firstCleanString(body.blobUrl, body.blob_url, pdfViewUrl),
    blobDownloadUrl: firstCleanString(body.blobDownloadUrl, body.blob_download_url, pdfDownloadUrl),
    blobPathname: firstCleanString(body.blobPathname, body.blob_pathname, body.pathname, body.b2Key, body.b2_key, body.pdfStorageKey, body.pdf_storage_key),
    b2Key: firstCleanString(body.b2Key, body.b2_key, body.pdfStorageKey, body.pdf_storage_key, body.blobPathname, body.blob_pathname, body.pdfFileId, body.pdf_file_id),
    b2Bucket: firstCleanString(body.b2Bucket, body.b2_bucket, body.b2BucketName, body.b2_bucket_name),
    pdfStorageKey: firstCleanString(body.pdfStorageKey, body.pdf_storage_key, body.b2Key, body.b2_key, body.blobPathname, body.blob_pathname, body.pdfFileId, body.pdf_file_id),
    pdfStorageEtag: firstCleanString(body.pdfStorageEtag, body.pdf_storage_etag, body.b2Etag, body.b2_etag),
    pdfStorageSize: Number(body.pdfStorageSize || body.pdf_storage_size || body.b2Size || body.b2_size || 0) || undefined,
    evidenceVideo,
    evidence_video: evidenceVideo.enabled ? evidenceVideo : undefined,
    evidenceVideoUrl: evidenceVideo.enabled ? evidenceVideo.videoUrl : "",
    evidence_video_url: evidenceVideo.enabled ? evidenceVideo.videoUrl : "",
    evidenceVideoEmbedUrl: evidenceVideo.enabled ? evidenceVideo.embedUrl : "",
    evidence_video_embed_url: evidenceVideo.enabled ? evidenceVideo.embedUrl : "",
    evidenceVideoProvider: evidenceVideo.enabled ? evidenceVideo.provider : "",
    evidence_video_provider: evidenceVideo.enabled ? evidenceVideo.provider : "",
    evidenceVideoId: evidenceVideo.enabled ? evidenceVideo.videoId : "",
    evidence_video_id: evidenceVideo.enabled ? evidenceVideo.videoId : "",
    evidenceVideoVisibility: evidenceVideo.enabled ? "unlisted" : "",
    evidence_video_visibility: evidenceVideo.enabled ? "unlisted" : "",
    evidenceVideoTitle: evidenceVideo.enabled ? evidenceVideo.title : "",
    evidence_video_title: evidenceVideo.enabled ? evidenceVideo.title : "",
    evidenceVideoStatus: evidenceVideo.status || "",
    evidence_video_status: evidenceVideo.status || "",
    contactEmail: firstCleanString(body.contactEmail, body.contact_email, body.agencyEmail, body.agency_email, MAIN_INBOX_EMAIL),
    ctaUrl: firstCleanString(body.ctaUrl, body.cta_url, privatePage.ctaUrl, privatePage.cta_url, "/contact"),
    ctaText,
  };
}


// ============================================================
// v27.49 Press-3.1: Firestore-safe report mode fields
// Purpose:
// - Preserve Press-1 tracking_case/reportMode fields through secure-page registration.
// - For no-GA4/no-GTM setup-first reports, prevent manualEvidenceHero from becoming
//   the Firestore/page hero while keeping manualConversionEvidence as context.
// - Keep canonical camelCase fields plus small snake_case aliases to avoid field-name drift.
// ============================================================

const TFP_V2749_SETUP_FIRST_MODES = new Set(["tracking_foundation_setup", "ga4_setup_needed"]);

function tfpV2749CleanString(value: any, fallback = ""): string {
  if (value === null || value === undefined || value === "") return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function tfpV2749Object(value: any): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AnyRecord : {};
}

function tfpV2749FirstObject(...values: any[]): AnyRecord {
  for (const value of values) {
    const obj = tfpV2749Object(value);
    if (Object.keys(obj).length) return obj;
  }
  return {};
}

function tfpV2749FirstString(...values: any[]): string {
  for (const value of values) {
    const text = tfpV2749CleanString(value);
    if (text) return text;
  }
  return "";
}

function tfpV2749TrackingCaseFrom(body: AnyRecord = {}, normalized: AnyRecord = {}): AnyRecord {
  const privateCopy = tfpV2749Object(body.privateReportCopy || body.private_report_copy || body.securePageCopy || body.secure_page_copy);
  const normalizedPrivateCopy = tfpV2749Object(normalized.privateReportCopy || normalized.private_report_copy || normalized.securePageCopy || normalized.secure_page_copy);
  const rawCase = tfpV2749FirstObject(
    normalized.trackingCase,
    normalized.tracking_case,
    normalizedPrivateCopy.trackingCase,
    normalizedPrivateCopy.tracking_case,
    body.trackingCase,
    body.tracking_case,
    body.reportTrackingCase,
    body.report_tracking_case,
    privateCopy.trackingCase,
    privateCopy.tracking_case,
  );
  const mode = tfpV2749FirstString(
    rawCase.mode,
    rawCase.reportMode,
    rawCase.report_mode,
    normalized.reportMode,
    normalized.report_mode,
    normalizedPrivateCopy.reportMode,
    normalizedPrivateCopy.report_mode,
    body.reportMode,
    body.report_mode,
    privateCopy.reportMode,
    privateCopy.report_mode,
  );
  if (!mode && !Object.keys(rawCase).length) return {};
  const title = tfpV2749FirstString(rawCase.title, rawCase.reportTitle, rawCase.report_title);
  const mainFinding = tfpV2749FirstString(rawCase.mainFinding, rawCase.main_finding, rawCase.safePrimaryClaim, rawCase.safe_primary_claim);
  return {
    ...rawCase,
    mode,
    reportMode: mode,
    report_mode: mode,
    ...(title ? { title } : {}),
    ...(mainFinding ? { mainFinding, main_finding: mainFinding } : {}),
  };
}

function tfpV2749IsSetupFirstMode(mode: any): boolean {
  return TFP_V2749_SETUP_FIRST_MODES.has(String(mode || "").trim());
}

function tfpV2749ManualPrimaryAction(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord {
  const manual = tfpV2749FirstObject(
    report.manualConversionEvidence,
    report.manual_conversion_evidence,
    body.manualConversionEvidence,
    body.manual_conversion_evidence,
    tfpV2749Object(report.privateReportCopy || report.private_report_copy).manualConversionEvidence,
    tfpV2749Object(report.privateReportCopy || report.private_report_copy).manual_conversion_evidence,
  );
  return tfpV2749FirstObject(manual.primaryAction, manual.primary_action, manual.primary);
}

function tfpV2749SetupFirstFields(report: AnyRecord, body: AnyRecord, trackingCase: AnyRecord): AnyRecord {
  const mode = tfpV2749FirstString(trackingCase.mode, report.reportMode, report.report_mode);
  const primary = tfpV2749ManualPrimaryAction(report, body);
  const actionLabel = tfpV2749FirstString(primary.label, primary.actionLabel, primary.action_label, report.primaryActionLabel, "main business action");
  const expectedEvent = tfpV2749FirstString(primary.expectedEvent, primary.expected_event, "the selected business event");
  const foundationLabel = mode === "ga4_setup_needed" ? "GA4 setup readiness" : "Tracking foundation setup";
  const mainFinding = mode === "ga4_setup_needed"
    ? "A GTM/container path may exist, but GA4 tracking was not clearly detected from the browser-visible review."
    : "GA4/GTM tracking foundation was not clearly detected from the public browser-side review.";

  const whatChecked = [
    "Public browser-visible GA4/GTM foundation signals.",
    "Whether a clear analytics foundation was visible before event-level verification.",
    actionLabel ? `Manual target selected for future event setup: ${actionLabel}.` : "The main business event to configure after setup.",
    "Final conversion recording was not claimed because setup/account-side confirmation is still required.",
  ].filter(Boolean);

  const auditSnapshotQuestions = [
    "Was a GA4 or GTM tracking foundation clearly visible from the public browser-side review?",
    actionLabel ? `Which main business action should be configured after setup (${actionLabel})?` : "Which main business action should be configured after setup?",
    expectedEvent ? `After setup, should ${expectedEvent} be tested in GTM Preview and GA4 DebugView?` : "After setup, which event should be tested in GTM Preview and GA4 DebugView?",
    "Where should final recording be confirmed — GA4, GTM, CRM, form inbox, or server logs?",
  ];

  const verificationPlan = [
    {
      priority: "Priority 1",
      title: "Set up GTM or Google tag on the website.",
      description: "Create a clear browser-visible analytics foundation before judging conversion events.",
      estimatedEffort: "Setup review",
    },
    {
      priority: "Priority 2",
      title: "Install or configure GA4 page_view tracking.",
      description: "Confirm GA4 is visible in Tag Assistant and available for DebugView testing.",
      estimatedEffort: "Setup review",
    },
    {
      priority: "Priority 3",
      title: actionLabel ? `Define the main business event for ${actionLabel}.` : "Define the main business event to track.",
      description: expectedEvent ? `Use an appropriate event such as ${expectedEvent}, then map it consistently in GTM/GA4.` : "Choose the correct event name for the selected customer action.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 4",
      title: "Run one controlled test after setup.",
      description: "Verify the event in GTM Preview, GA4 DebugView, and the relevant CRM/form inbox/server records.",
      estimatedEffort: "Short review",
    },
  ];

  const proofPoints = [
    "The review is based on public browser-visible evidence.",
    mainFinding,
    actionLabel ? `Manual conversion context was kept as secondary context: ${actionLabel}.` : "Manual conversion context was kept as secondary context.",
    "Final account-side confirmation still requires GA4, GTM, CRM, form inbox, or server/server-log access.",
  ];

  const problemCards = [
    {
      title: "GA4/GTM tracking foundation was not clearly detected",
      finding: mainFinding,
      businessMeaning: "Without a clear analytics foundation, traffic, enquiries, audiences, and future campaign reporting may be harder to measure.",
      nextCheck: "Install or verify GTM/Google tag and GA4 first, then test the main business event.",
    },
    {
      title: "Conversion-event verification should come after setup",
      finding: actionLabel ? `${actionLabel} can be configured and tested after the tracking foundation is in place.` : "The selected business event can be configured and tested after the tracking foundation is in place.",
      businessMeaning: "A missing event should not be presented as the primary issue until the base tracking setup is visible.",
      nextCheck: "After setup, run one controlled action test in GTM Preview and GA4 DebugView.",
    },
    {
      title: "Final recording requires account/server confirmation",
      finding: "Browser-visible evidence cannot prove final account-side or server-side recording by itself.",
      businessMeaning: "CRM, form inbox, booking/ecommerce records, or server logs should be compared with GA4/GTM events.",
      nextCheck: "Confirm the same test action inside GA4, GTM, CRM/form inbox, or server logs.",
    },
  ];

  return {
    headline: mode === "ga4_setup_needed" ? "Private GA4 setup readiness review" : "Private website tracking readiness review",
    mainFinding,
    businessImpact: "Without a clear analytics foundation, website traffic, enquiries, audience building, and future campaign reporting may be harder to measure.",
    proofPoints,
    problemCards,
    businessProblems: problemCards,
    recommendations: [
      "Set up GTM or Google tag first.",
      "Install/configure GA4 and confirm page_view tracking.",
      actionLabel ? `Configure the selected business event: ${actionLabel}.` : "Configure the selected main business event.",
      "Run one controlled conversion test after setup and confirm it in GA4/GTM plus backend records.",
    ],
    verificationPlan,
    verification_plan: verificationPlan,
    whatChecked,
    auditSnapshotTitle: "Website Tracking Readiness Snapshot",
    auditSnapshotQuestions,
    primaryActionLabel: foundationLabel,
    primaryPageLabel: "Website tracking foundation",
    primaryPageUrl: "",
    ctaHeadline: "Ready to verify this tracking setup live?",
    ctaText: "Request tracking setup review",
    manualEvidenceHero: null,
    manual_evidence_hero: null,
  };
}

function tfpV2749ApplyReportModeFirestoreOverrides(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord {
  const trackingCase = tfpV2749TrackingCaseFrom(body, report);
  const mode = tfpV2749FirstString(trackingCase.mode, report.reportMode, report.report_mode);
  if (!mode) return report;

  const trackingCaseOut = {
    ...trackingCase,
    mode,
    reportMode: mode,
    report_mode: mode,
  };

  let output: AnyRecord = {
    ...report,
    trackingCase: trackingCaseOut,
    tracking_case: trackingCaseOut,
    reportMode: mode,
    report_mode: mode,
    privateReportCopy: {
      ...(tfpV2749Object(report.privateReportCopy || report.private_report_copy)),
      trackingCase: trackingCaseOut,
      tracking_case: trackingCaseOut,
      reportMode: mode,
      report_mode: mode,
    },
  };

  if (!tfpV2749IsSetupFirstMode(mode)) return output;

  const setupFields = tfpV2749SetupFirstFields(output, body, trackingCaseOut);
  const privateCopy = {
    ...(tfpV2749Object(output.privateReportCopy || output.private_report_copy)),
    ...setupFields,
    trackingCase: trackingCaseOut,
    tracking_case: trackingCaseOut,
    reportMode: mode,
    report_mode: mode,
    manualEvidenceHero: null,
    manual_evidence_hero: null,
  };

  output = {
    ...output,
    ...setupFields,
    trackingCase: trackingCaseOut,
    tracking_case: trackingCaseOut,
    reportMode: mode,
    report_mode: mode,
    privateReportCopy: privateCopy,
    securePageCopy: privateCopy,
    secure_page_copy: privateCopy,
    manualEvidenceHero: null,
    manual_evidence_hero: null,
  };

  return output;
}


function normalizeEmailPreviewImageAssetPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord | null {
  const raw = getObjectCandidate(
    body.emailPreviewImage,
    body.email_preview_image,
    body.emailPreviewImageAsset,
    body.email_preview_image_asset,
    privatePage.emailPreviewImage,
    privatePage.email_preview_image,
  );

  const b2Key = firstCleanString(
    raw.b2Key,
    raw.b2_key,
    body.emailPreviewImageB2Key,
    body.email_preview_image_b2_key,
    privatePage.emailPreviewImageB2Key,
    privatePage.email_preview_image_b2_key,
  ).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");

  const publicUrl = sanitizeOptionalUrl(firstCleanString(
    raw.publicUrl,
    raw.public_url,
    raw.url,
    body.emailPreviewImageUrl,
    body.email_preview_image_url,
    body.emailPreviewImageWebpUrl,
    body.email_preview_image_webp_url,
    privatePage.emailPreviewImageUrl,
    privatePage.email_preview_image_url,
    privatePage.emailPreviewImageWebpUrl,
    privatePage.email_preview_image_webp_url,
  ));

  if (!b2Key && !publicUrl) return null;

  const mimeType = firstCleanString(
    raw.mimeType,
    raw.mime_type,
    body.emailPreviewImageMimeType,
    body.email_preview_image_mime_type,
    privatePage.emailPreviewImageMimeType,
    privatePage.email_preview_image_mime_type,
    "image/webp",
  ).toLowerCase();

  const sizeBytes = Number(
    raw.sizeBytes ||
      raw.size_bytes ||
      body.emailPreviewImageSizeBytes ||
      body.email_preview_image_size_bytes ||
      privatePage.emailPreviewImageSizeBytes ||
      privatePage.email_preview_image_size_bytes ||
      0,
  ) || 0;

  return {
    id: firstCleanString(raw.id, "email_preview_thumbnail"),
    role: firstCleanString(raw.role, "email_preview_thumbnail"),
    caption: firstCleanString(raw.caption, raw.title, "Clickable email preview thumbnail"),
    fileName: firstCleanString(raw.fileName, raw.file_name, "email-preview-thumbnail.webp"),
    file_name: firstCleanString(raw.fileName, raw.file_name, "email-preview-thumbnail.webp"),
    mimeType,
    mime_type: mimeType,
    sizeBytes,
    size_bytes: sizeBytes,
    pageUrl: sanitizeOptionalUrl(firstCleanString(raw.pageUrl, raw.page_url, privatePage.pageUrl, body.websiteUrl, body.website_url)),
    page_url: sanitizeOptionalUrl(firstCleanString(raw.pageUrl, raw.page_url, privatePage.pageUrl, body.websiteUrl, body.website_url)),
    source: firstCleanString(raw.source, "manual_email_preview_upload"),
    storageProvider: firstCleanString(raw.storageProvider, raw.storage_provider, "backblaze_b2"),
    storage_provider: firstCleanString(raw.storageProvider, raw.storage_provider, "backblaze_b2"),
    b2Bucket: firstCleanString(raw.b2Bucket, raw.b2_bucket, raw.bucket, body.emailPreviewImageB2Bucket, body.email_preview_image_b2_bucket),
    b2_bucket: firstCleanString(raw.b2Bucket, raw.b2_bucket, raw.bucket, body.emailPreviewImageB2Bucket, body.email_preview_image_b2_bucket),
    b2Key,
    b2_key: b2Key,
    etag: firstCleanString(raw.etag, raw.eTag, raw.b2Etag, raw.b2_etag),
    uploadedAt: firstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at),
    uploaded_at: firstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at),
    redacted: raw.redacted !== false,
    publicUrl,
    public_url: publicUrl,
    optimized: Boolean(raw.optimized),
    optimizationFormat: firstCleanString(raw.optimizationFormat, raw.optimization_format),
    optimization_format: firstCleanString(raw.optimizationFormat, raw.optimization_format),
    note: firstCleanString(raw.note, "Email-only preview thumbnail metadata. This is not secure-page evidence and should not be displayed as proof on the report page."),
  };
}

function normalizeReportPayload(body: AnyRecord = {}) {
  const report = tfpV2749NormalizeReportPayloadBase(body);
  return tfpV2749ApplyReportModeFirestoreOverrides(report, body);
}

type SignatureMode = "full" | "compact" | "none";

function normalizeSignatureMode(value: any, fallback: SignatureMode = "full"): SignatureMode {
  const mode = String(value || "").toLowerCase().trim();
  if (mode === "compact" || mode === "none" || mode === "full") return mode as SignatureMode;
  return fallback;
}

function buildSignature(emailLower: string, tag: string, sender?: SenderConfig, mode: SignatureMode = "full") {
  if (mode === "none") return "";

  const unsub = unsubscribeUrl(emailLower);
  const senderName = escapeHtml(sender?.name || DEFAULT_SENDER_NAME);
  // Visible contact is always the real inbox. Sender aliases are used only as From addresses.
  const visibleEmail = escapeHtml(MAIN_INBOX_EMAIL);
  const websiteUrl = escapeHtml(BRAND_WEBSITE);
  const websiteLabel = escapeHtml(BRAND_WEBSITE_LABEL);
  const visibleReference = escapeHtml(formatVisibleEmailReference(tag));
  const mailingAddressLine = buildComplianceAddressLine();
  const mailingAddressRow = mailingAddressLine
    ? `
                <tr>
                  <td style="padding:4px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#9ca3af;mso-line-height-rule:exactly;overflow-wrap:break-word;word-break:normal;">
                    ${mailingAddressLine}
                  </td>
                </tr>`
    : "";

  if (mode === "compact") {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:560px;">
        <tr>
          <td height="16" style="height:16px;line-height:16px;font-size:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr>
        <tr>
          <td style="height:1px;line-height:1px;font-size:0;border-top:1px solid #e5e7eb;padding:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;padding:12px 0 0 0;mso-line-height-rule:exactly;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
              <tr>
                <td style="border-left:3px solid #2563eb;padding:0 0 0 12px;font-family:Arial,Helvetica,sans-serif;overflow-wrap:break-word;word-break:normal;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td style="padding:0 0 1px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:19px;color:#111827;font-weight:bold;mso-line-height-rule:exactly;">${senderName}</td>
                    </tr>
                    <tr>
                      <td style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#4b5563;font-weight:bold;mso-line-height-rule:exactly;">TrackFlowPro · Conversion Tracking Audit</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#6b7280;mso-line-height-rule:exactly;overflow-wrap:break-word;word-break:normal;">
                        <a href="mailto:${visibleEmail}" style="color:#374151;text-decoration:none;">${visibleEmail}</a>
                        <span style="color:#d1d5db;"> | </span>
                        <a href="${websiteUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:bold;">${websiteLabel}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#9ca3af;mso-line-height-rule:exactly;overflow-wrap:break-word;word-break:normal;">
                        Reference: ${visibleReference}
                        <span style="color:#d1d5db;"> | </span>
                        <a href="${unsub}" target="_blank" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                      </td>
                    </tr>
                    ${mailingAddressRow}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  // Full signature is text/table based only. The spacer rows and single border-left cell keep Outlook from pulling the CTA note into the signature area.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:560px;">
      <tr>
        <td height="18" style="height:18px;line-height:18px;font-size:0;mso-line-height-rule:exactly;">&nbsp;</td>
      </tr>
      <tr>
        <td style="height:1px;line-height:1px;font-size:0;border-top:1px solid #e5e7eb;padding:0;mso-line-height-rule:exactly;">&nbsp;</td>
      </tr>
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;padding:14px 0 0 0;mso-line-height-rule:exactly;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td style="border-left:3px solid #2563eb;padding:0 0 0 14px;font-family:Arial,Helvetica,sans-serif;overflow-wrap:break-word;word-break:normal;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td style="padding:0 0 1px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#111827;">${senderName}</td>
                  </tr>
                  <tr>
                    <td style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:#4b5563;font-weight:bold;">Founder, TrackFlowPro</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#6b7280;overflow-wrap:break-word;word-break:normal;">Google Ads Conversion Tracking · GA4/GTM Audit · Server-Side Tracking</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#374151;overflow-wrap:break-word;word-break:normal;">
                      <a href="mailto:${visibleEmail}" style="color:#374151;text-decoration:none;">${visibleEmail}</a>
                      <span style="color:#d1d5db;"> | </span>
                      <a href="${websiteUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:bold;">${websiteLabel}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;mso-line-height-rule:exactly;color:#9ca3af;overflow-wrap:break-word;word-break:normal;">
                      Reference: ${visibleReference}
                      <span style="color:#d1d5db;"> | </span>
                      <a href="${unsub}" target="_blank" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                    </td>
                  </tr>
                  ${mailingAddressRow}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function mergeEmailInlineStyle(attrs: string, baseStyle: string): string {
  const rawAttrs = String(attrs || "");
  if (/\sstyle\s*=/.test(rawAttrs)) {
    return rawAttrs.replace(/\sstyle=(['"])(.*?)\1/i, (_match, quote, currentStyle) => ` style=${quote}${baseStyle}${currentStyle}${quote}`);
  }
  return ` style="${baseStyle}"${rawAttrs}`;
}

function applyEmailTagStyle(html: string, tagName: string, baseStyle: string): string {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  return String(html || "").replace(pattern, (_match, attrs) => `<${tagName}${mergeEmailInlineStyle(String(attrs || ""), baseStyle)}>`);
}

function removeEmptyEmailBlocks(html: string): string {
  let output = String(html || "");

  for (let index = 0; index < 3; index += 1) {
    const before = output;
    output = output.replace(/<(p|div)\b[^>]*>(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*<\/\1>/gi, "");
    output = output.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />");
    if (output === before) break;
  }

  return output.trim();
}

function isSystemClosingOrSignatureBlock(html: string): boolean {
  const plain = plainTextFromHtml(html || "")
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
}

function removeTrailingComposerClosingBlocks(html: string): string {
  let output = String(html || "").trim();

  for (let index = 0; index < 6; index += 1) {
    const match = output.match(/<(p|div)\b[^>]*>[\s\S]*?<\/\1>\s*$/i);
    if (!match || !isSystemClosingOrSignatureBlock(match[0])) break;
    output = output.slice(0, match.index).trim();
  }

  return removeEmptyEmailBlocks(output);
}

function buildEmailClosingBlock(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:10px 0 0 0;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:560px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#1f2937;mso-line-height-rule:exactly;padding:0;margin:0;">Best regards,</td>
      </tr>
    </table>
  `;
}

function normalizeEmailBodyHtml(input: string): string {
  const cleanMessage = stripDangerousHtml(input || "").replace(/\u00a0/g, " ").trim();
  if (!cleanMessage) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(cleanMessage);
  if (hasHtml) {
    let html = removeEmptyEmailBlocks(cleanMessage);
    if (!plainTextFromHtml(html)) return "";

    html = applyEmailTagStyle(html, "p", "margin:0 0 12px 0;");
    html = applyEmailTagStyle(html, "div", "margin:0 0 12px 0;");
    html = applyEmailTagStyle(html, "li", "margin:0 0 7px 0;");
    html = applyEmailTagStyle(html, "a", "color:#2563eb;text-decoration:underline;font-weight:bold;");
    html = removeEmptyEmailBlocks(html);

    return html;
  }

  return cleanMessage
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 12px 0;">${escapeHtml(part).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function buildEmailHtml(
  message: string,
  emailLower: string,
  tag: string,
  options: {
    includeSignature?: boolean;
    reportUrl?: string;
    reportButtonText?: string;
    sender?: SenderConfig;
    signatureMode?: SignatureMode;
    includeReportLink?: boolean;
    leadId?: string;
    reportToken?: string;
    messageId?: string;
    trackingId?: string;
  } = {}
) {
  const trackingContext: EmailTrackingContext = {
    leadId: options.leadId,
    reportToken: normalizeReportToken(options.reportToken || extractReportTokenFromUrl(options.reportUrl || "")),
    messageId: options.messageId,
    trackingId: options.trackingId || (tag ? tag.split("_step")[0] : ""),
    tag,
    emailLower,
  };
  const includeSignature = options.includeSignature !== false;
  const cleanMessage = normalizeEmailBodyHtml(message);
  const messageBody = includeSignature ? removeTrailingComposerClosingBlocks(cleanMessage) : cleanMessage;
  const trackedMessage = rewriteHtmlLinksForTracking(messageBody, trackingContext);
  const signatureMode = includeSignature ? normalizeSignatureMode(options.signatureMode, "full") : "none";
  const reportBlock = options.includeReportLink === false ? "" : buildReportLinkBlock(options.reportUrl, options.reportButtonText || "View short audit note", trackingContext);
  const closingBlock = includeSignature ? buildEmailClosingBlock() : "";
  const signatureBlock = includeSignature ? buildSignature(emailLower, tag, options.sender, signatureMode) : "";
  const openPixel = buildOpenTrackingPixel(trackingContext);

  return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--[if mso]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;width:100% !important;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#ffffff;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;">
      <tr>
        <td align="left" style="padding:20px 16px 20px 16px;margin:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:620px;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#1f2937;padding:0;margin:0;overflow-wrap:break-word;word-break:normal;">
                ${trackedMessage}
                ${reportBlock}
                ${closingBlock}
                ${signatureBlock}
                ${openPixel}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function personalizeTemplate(content: string, lead: LeadData): string {
  const replacements: Record<string, string> = {
    "{name}": lead.name || "there",
    "{company}": lead.company_name || "your company",
    "{website}": lead.website || "your website",
    "{service}": lead.service || "our service",
  };

  let output = stripDangerousHtml(content);

  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(escapeHtml(value));
  }

  return output;
}

async function sendViaBrevo(input: BrevoSendInput) {
  const emailLower = normalizeEmail(input.toEmail);
  const unsub = unsubscribeUrl(emailLower);

  const payload: Record<string, any> = {
    sender: { name: input.sender.name, email: input.sender.email },
    to: [{ email: input.toEmail, name: input.toName || "" }],
    replyTo: {
      email: input.sender.replyToEmail || DEFAULT_REPLY_TO_EMAIL,
      name: input.sender.replyToName || input.sender.name || DEFAULT_REPLY_TO_NAME,
    },
    subject: input.subject,
    tags: [input.tag],
    htmlContent: input.htmlContent,
    headers: {
      "X-Mailin-Tag": input.tag,
      "Message-ID": input.customMessageId,
      "X-Entity-Ref-ID": input.tag.split("_step")[0],
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      ...(input.headers || {}),
    },
  };

  if (input.scheduledAt) {
    payload.scheduledAt = input.scheduledAt;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env("BREVO_API_KEY"),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || "Brevo API Error", 400);
  }

  return data;
}


function getBrevoScheduledIdentifier(lead: Record<string, any> = {}): string {
  const direct = String(lead.brevoMessageId || lead.originalMessageId || lead.providerMessageId || "").trim();
  if (direct) return direct;

  const messages = Array.isArray(lead.sent_messages) ? [...lead.sent_messages].reverse() : [];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const provider = String(message.provider || "").toLowerCase();
    const kind = String(message.kind || "").toLowerCase();
    if (provider !== "brevo" && !kind.includes("scheduled")) continue;
    const messageId = String(message.messageId || message.brevoMessageId || "").trim();
    if (messageId) return messageId;
  }

  return "";
}

function getBrevoScheduledTimeMs(lead: Record<string, any> = {}): number {
  return toMillis(lead.scheduledAt || lead.brevoScheduledAt);
}

function assertBrevoScheduledActionIsSafe(lead: Record<string, any> = {}, actionLabel = "change") {
  const scheduledAtMs = getBrevoScheduledTimeMs(lead);
  if (scheduledAtMs > 0 && scheduledAtMs <= Date.now() + BREVO_SCHEDULE_ACTION_LOCK_MS) {
    throw new ApiError(
      `This Brevo scheduled email is too close to its send time to ${actionLabel} safely. Please refresh the Scheduled tab and check the Lead tab after delivery.`,
      409,
    );
  }
}

async function deleteBrevoScheduledEmailForLead(lead: Record<string, any> = {}, actionLabel = "change") {
  assertBrevoScheduledActionIsSafe(lead, actionLabel);

  const identifier = getBrevoScheduledIdentifier(lead);
  if (!identifier) {
    throw new ApiError("Brevo scheduled message id is missing, so the provider schedule cannot be changed safely.", 409);
  }

  const response = await fetch(`https://api.brevo.com/v3/smtp/email/${encodeURIComponent(identifier)}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "api-key": env("BREVO_API_KEY"),
    },
  });

  if (response.status === 204) return { deleted: true, identifier };
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || `Brevo scheduled email ${actionLabel} failed`, response.status || 400);
  }

  return { deleted: true, identifier, data };
}

function buildInitialEmailInputFromLead(leadId: string, lead: LeadData, customMessageId?: string) {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  if (!isValidEmail(emailLower)) throw new ApiError("Invalid target email", 400);

  const subject = String(lead.subject || "").trim();
  const message = String(lead.message || "").trim();
  if (!subject) throw new ApiError("Subject is required", 400);
  if (!plainTextFromHtml(message)) throw new ApiError("Message body cannot be empty", 400);

  const sender = getSenderFromLead(lead);
  const selectedService = SERVICES.has(lead.service || "") ? String(lead.service || "") : "Google Ads";
  const trackingId = String(lead.trackingId || leadId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const tag = `${trackingId}_step1`;
  const nextCustomMessageId = customMessageId || `<${Date.now()}.${trackingId}@mail.trackflowpro.com>`;
  const includeSignature = lead.include_signature !== false;
  const reportUrl = sanitizePublicReportUrl(lead.reportUrl || "");
  const reportButtonText = String(lead.reportButtonText || "View short audit note").trim().slice(0, 80);
  const reportToken = normalizeReportToken(lead.reportToken || lead.parentReportToken || "");

  const personalizedInitialMessage = personalizeTemplate(message, {
    name: lead.name || "",
    company_name: lead.company_name || "",
    website: lead.website || "",
    service: selectedService,
  });

  const htmlContent = buildEmailHtml(personalizedInitialMessage, emailLower, tag, {
    includeSignature,
    reportUrl,
    reportButtonText,
    sender,
    signatureMode: normalizeSignatureMode(lead.signatureMode || "full", "full"),
    includeReportLink: true,
    leadId,
    reportToken,
    messageId: nextCustomMessageId,
    trackingId,
  });

  return {
    emailLower,
    sender,
    selectedService,
    subject,
    message,
    trackingId,
    tag,
    customMessageId: nextCustomMessageId,
    includeSignature,
    reportUrl,
    reportButtonText,
    reportToken,
    htmlContent,
  };
}

async function rescheduleBrevoInitialEmail(
  ref: FirestoreDocRef,
  leadId: string,
  current: LeadData,
  updates: Record<string, any>,
) {
  const scheduledAt = timestampFromAny(updates.scheduledAt || current.scheduledAt || current.brevoScheduledAt);
  if (!scheduledAt) throw new ApiError("Invalid scheduledAt", 400);

  const scheduledAtMs = scheduledAt.toMillis();
  const nowMs = Date.now();
  if (scheduledAtMs <= nowMs + BREVO_INITIAL_SCHEDULE_MIN_DELAY_MS) {
    throw new ApiError("Scheduled time must be at least 30 seconds in the future. Use Send Now for immediate sending.", 400);
  }
  if (scheduledAtMs > nowMs + BREVO_INITIAL_SCHEDULE_MAX_DELAY_MS) {
    throw new ApiError("Brevo initial email scheduling supports up to 72 hours ahead. For longer timing, schedule closer to the send date.", 400);
  }

  const nextLead = { ...current, ...updates, scheduledAt, brevoScheduledAt: scheduledAt, id: leadId } as LeadData;
  await deleteBrevoScheduledEmailForLead(current, "update");

  const customMessageId = `<${Date.now()}.${String(nextLead.trackingId || leadId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)}@mail.trackflowpro.com>`;
  const input = buildInitialEmailInputFromLead(leadId, nextLead, customMessageId);
  const scheduledAtIso = new Date(scheduledAtMs).toISOString();

  const data = await sendViaBrevo({
    sender: input.sender,
    toEmail: input.emailLower,
    toName: String(nextLead.name || ""),
    subject: input.subject,
    htmlContent: input.htmlContent,
    tag: input.tag,
    customMessageId: input.customMessageId,
    scheduledAt: scheduledAtIso,
  });

  const scheduledAcceptedAt = admin.firestore.Timestamp.now();
  await ref.update({
    ...updates,
    status: "scheduled",
    scheduledAt,
    scheduledProvider: "brevo",
    providerScheduleStatus: "accepted",
    brevoScheduled: true,
    brevoScheduledAt: scheduledAt,
    brevoScheduledAtIso: scheduledAtIso,
    scheduledAcceptedAt,
    customMessageId: input.customMessageId,
    originalMessageId: data.messageId || "",
    brevoMessageId: data.messageId || "",
    nextFollowupStatus: "waiting_for_initial_delivery",
    nextFollowupReason: "brevo_provider_scheduled_updated",
    stopAutomation: false,
    automationLock: admin.firestore.FieldValue.delete(),
    error: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sent_messages: admin.firestore.FieldValue.arrayUnion({
      step: 1,
      kind: "initial_rescheduled",
      provider: "brevo",
      subject: input.subject,
      trackingTag: input.tag,
      messageId: data.messageId || "",
      customMessageId: input.customMessageId,
      trackingId: input.trackingId,
      reportToken: input.reportToken,
      includeSignature: input.includeSignature,
      reportUrl: input.reportUrl,
      scheduledAt,
      scheduledAtIso,
      scheduledAcceptedAt,
    }),
  });

  await addEmailEvent(leadId, "scheduled", {
    emailLower: input.emailLower,
    step: 1,
    provider: "brevo",
    action: "rescheduled",
    scheduledAt,
    scheduledAtIso,
    trackingTag: input.tag,
    messageId: data.messageId || input.customMessageId,
    customMessageId: input.customMessageId,
    trackingId: input.trackingId,
    reportToken: input.reportToken,
    forceStore: true,
  });

  const updated = await ref.get();
  return json({
    success: true,
    scheduled: true,
    provider: "brevo",
    message: "Brevo scheduled email updated safely.",
    lead: serializeScheduledLead(updated),
  });
}

async function sendBrevoScheduledInitialNow(ref: FirestoreDocRef, leadId: string, current: LeadData) {
  await deleteBrevoScheduledEmailForLead(current, "send now");

  const emailLower = normalizeEmail(current.emailLower || current.email || "");
  const suppressed = await isSuppressed(emailLower);
  if (suppressed) throw new ApiError(`Email is suppressed: ${suppressed.reason || "blocked"}`, 409);

  const input = buildInitialEmailInputFromLead(leadId, current);
  const quota = await reserveDailySlot(input.sender.dailyLimit, "initial", input.sender.email);
  if (!quota.ok) {
    throw new ApiError(`Daily limit reached for ${input.sender.email}: ${quota.used}/${quota.limit}`, 429);
  }

  const data = await sendViaBrevo({
    sender: input.sender,
    toEmail: input.emailLower,
    toName: String(current.name || ""),
    subject: input.subject,
    htmlContent: input.htmlContent,
    tag: input.tag,
    customMessageId: input.customMessageId,
  });

  const sentAt = admin.firestore.Timestamp.now();
  await ref.update({
    status: "sent",
    sentAt,
    lastSentAt: sentAt,
    scheduledProvider: "brevo",
    providerScheduleStatus: "sent",
    brevoScheduled: false,
    brevoProviderLastEvent: "manual_send_now",
    brevoProviderLastEventAt: sentAt,
    customMessageId: input.customMessageId,
    originalMessageId: data.messageId || "",
    brevoMessageId: data.messageId || "",
    nextFollowupStatus: "waiting_for_first_open_or_click",
    nextFollowupReason: "initial_sent_waiting_for_engagement",
    stopAutomation: false,
    automationLock: admin.firestore.FieldValue.delete(),
    error: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sent_messages: admin.firestore.FieldValue.arrayUnion({
      step: 1,
      kind: "initial",
      provider: "brevo",
      subject: input.subject,
      sentAt,
      trackingTag: input.tag,
      messageId: data.messageId || "",
      customMessageId: input.customMessageId,
      trackingId: input.trackingId,
      reportToken: input.reportToken,
      includeSignature: input.includeSignature,
      reportUrl: input.reportUrl,
    }),
  });

  await addEmailEvent(leadId, "sent", {
    emailLower: input.emailLower,
    step: 1,
    provider: "brevo",
    action: "send_now",
    trackingTag: input.tag,
    messageId: data.messageId || input.customMessageId,
    customMessageId: input.customMessageId,
    trackingId: input.trackingId,
    reportToken: input.reportToken,
    forceStore: true,
  });

  return json({
    success: true,
    sent: true,
    provider: "brevo",
    message: "Brevo scheduled email was cancelled and sent now.",
    leadId,
  });
}

function normalizeMessageIdHeader(value: any): string {
  const raw = String(value || "")
    .trim()
    .replace(/[\r\n]/g, "")
    .slice(0, 300);

  if (!raw) return "";

  const match = raw.match(/<[^<>\s]+@[^<>\s]+>/);
  if (match) return match[0];

  const cleaned = raw.replace(/[<>]/g, "").trim();
  if (!cleaned || !cleaned.includes("@") || /\s/.test(cleaned)) return "";
  return `<${cleaned}>`;
}

function isBrevoSmtpMessageId(value: any): boolean {
  const messageId = normalizeMessageIdHeader(value).toLowerCase();
  return (
    messageId.endsWith("@smtp-relay.sendinblue.com>") ||
    messageId.endsWith("@smtp-relay.brevo.com>")
  );
}

function uniqueMessageIdList(values: any[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const messageId = normalizeMessageIdHeader(value);
    if (!messageId || seen.has(messageId)) continue;
    seen.add(messageId);
    output.push(messageId);
  }

  return output;
}

function getLeadMessageIdChain(lead: LeadData): string[] {
  const providerCandidates: any[] = [];
  const fallbackCandidates: any[] = [];

  const addProviderCandidate = (value: any) => {
    if (isBrevoSmtpMessageId(value)) providerCandidates.push(value);
  };

  // Prefer the final SMTP Message-Id that Gmail actually sees. Brevo rewrites
  // our custom Message-ID and exposes the custom value only as Origin-messageId.
  addProviderCandidate((lead as AnyRecord).providerSmtpMessageId);
  addProviderCandidate((lead as AnyRecord).brevoSmtpMessageId);
  addProviderCandidate((lead as AnyRecord).providerDeliveredMessageId);
  addProviderCandidate((lead as AnyRecord).brevoDeliveredMessageId);
  addProviderCandidate((lead as AnyRecord).smtpMessageId);
  addProviderCandidate(lead.originalMessageId);
  addProviderCandidate(lead.brevoMessageId);

  fallbackCandidates.push(lead.customMessageId, lead.originalMessageId, lead.brevoMessageId);

  if (Array.isArray(lead.sent_messages)) {
    const messages = [...lead.sent_messages].sort((a: any, b: any) => Number(a?.step || 0) - Number(b?.step || 0));
    for (const message of messages) {
      if (!message || typeof message !== "object") continue;

      addProviderCandidate(message.providerSmtpMessageId);
      addProviderCandidate(message.brevoSmtpMessageId);
      addProviderCandidate(message.providerDeliveredMessageId);
      addProviderCandidate(message.brevoDeliveredMessageId);
      addProviderCandidate(message.deliveredMessageId);
      addProviderCandidate(message.smtpMessageId);
      addProviderCandidate(message.threadMessageId);
      addProviderCandidate(message.messageId);

      fallbackCandidates.push(
        message.customMessageId,
        message.messageId,
        message.brevoMessageId,
        message.threadMessageId,
        message.inReplyTo,
      );
    }
  }

  addProviderCandidate((lead as AnyRecord).lastProviderSmtpMessageId);
  addProviderCandidate((lead as AnyRecord).lastBrevoSmtpMessageId);
  addProviderCandidate((lead as AnyRecord).lastFollowupProviderSmtpMessageId);
  addProviderCandidate((lead as AnyRecord).lastFollowupBrevoSmtpMessageId);

  const providerChain = uniqueMessageIdList(providerCandidates);
  if (providerChain.length) return providerChain;

  return uniqueMessageIdList(fallbackCandidates);
}

function followupThreadingMode(): "legacy_subject_grouping" | "provider_headers" {
  const raw = String(process.env.FOLLOWUP_THREADING_MODE || "legacy_subject_grouping")
    .trim()
    .toLowerCase();

  // provider_headers is intentionally opt-in only.
  // Brevo rewrites the final SMTP Message-Id, so using TrackFlow's custom
  // mail.trackflowpro.com id inside In-Reply-To/References can stop Gmail from
  // grouping follow-ups with the original message. The default restores the
  // older working behavior: same sender + Re: same subject, without reply headers.
  if (["provider_headers", "smtp_headers", "message_id_headers", "headers"].includes(raw)) {
    return "provider_headers";
  }

  return "legacy_subject_grouping";
}

function buildThreadHeadersForFollowup(lead: LeadData): Record<string, string> {
  if (followupThreadingMode() !== "provider_headers") {
    return {};
  }

  const chain = getLeadMessageIdChain(lead);
  if (!chain.length || !chain.some((messageId) => isBrevoSmtpMessageId(messageId))) return {};

  const threadRootMessageId = chain[0];
  const previousMessageId = chain[chain.length - 1] || threadRootMessageId;

  return {
    "In-Reply-To": previousMessageId,
    References: chain.join(" "),
    "X-TFP-Thread-Root": threadRootMessageId,
  };
}

function deterministicVariantIndex(key: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

async function reserveDailySlot(limit: number, kind: "initial" | "followup", senderEmail?: string) {
  const key = todayKey();
  const id = senderEmail ? `${key}_${emailDocId(normalizeEmail(senderEmail))}` : key;
  const ref = adminDb.collection("daily_sending_stats").doc(id);

  const result = await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const field = kind === "followup" ? "followupSent" : "initialSent";
    const total = Number(data[field] || 0);
    if (total >= limit) return { ok: false, used: total, limit };
    tx.set(
      ref,
      {
        dateKey: key,
        senderEmail: senderEmail || "global",
        [field]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true, used: total + 1, limit };
  });

  return result;
}

async function releaseDailySlot(kind: "initial" | "followup", senderEmail?: string) {
  const key = todayKey();
  const id = senderEmail ? `${key}_${emailDocId(normalizeEmail(senderEmail))}` : key;
  const ref = adminDb.collection("daily_sending_stats").doc(id);
  const field = kind === "followup" ? "followupSent" : "initialSent";

  // Keep quota counters from going negative if a retry/error path calls release twice.
  await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const current = Math.max(0, Number(data[field] || 0));
    tx.set(
      ref,
      {
        dateKey: key,
        senderEmail: senderEmail || "global",
        [field]: Math.max(0, current - 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

async function writeCronStatus(cronName: string, payload: Record<string, any>) {
  /**
   * MINIMAL CRON MONITORING
   * বাংলা ব্যাখ্যা: Free limit বাঁচাতে প্রতি run-এ নতুন document বানানো হচ্ছে না।
   * একই system_status/cron document update হয়, তাই dashboard/health endpoint থেকে শেষ অবস্থা দেখা যায়।
   */
  try {
    await adminDb.collection("system_status").doc("cron").set(
      {
        [cronName]: {
          ...payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Cron status update failed:", error);
  }
}

type CronLock = {
  acquired: boolean;
  ref: FirestoreDocRef;
  runId: string;
  lockedBy?: string;
  lockedAt?: string;
};

async function acquireCronLock(lockName: string, maxAgeMinutes = 20): Promise<CronLock> {
  const ref = adminDb.collection("system_locks").doc(`cron_${lockName}`);
  const runId = randomUUID();
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.fromMillis(nowMs);

  return await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const lockedAtMs = toMillis(data.lockedAt);
    const isActive = Boolean(data.runId) && lockedAtMs && nowMs - lockedAtMs < maxAgeMinutes * 60_000;

    if (isActive) {
      return {
        acquired: false,
        ref,
        runId,
        lockedBy: data.runId || "unknown",
        lockedAt: new Date(lockedAtMs).toISOString(),
      };
    }

    tx.set(
      ref,
      {
        runId,
        lockName,
        lockedAt: nowTs,
        expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + maxAgeMinutes * 60_000),
        updatedAt: nowTs,
      },
      { merge: true }
    );

    return { acquired: true, ref, runId };
  });
}

async function releaseCronLock(lock: CronLock) {
  if (!lock?.acquired) return;

  await adminDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(lock.ref);
    const data = snap.exists ? snap.data() || {} : {};
    if (data.runId === lock.runId) {
      tx.delete(lock.ref);
    }
  });
}

/** POST /api/trackflow/send-email */
async function handleSendInitial(req: Request) {
  await requireAdmin(req);
  const rawBody = await readJson(req);
  return await sendInitialFromBody(rawBody);
}

async function sendInitialFromBody(rawBody: any) {
  const parsedBody = SendInitialBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    const issues = parsedBody.error.issues.map((issue: any) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
    throw new ApiError(`Invalid send-email request: ${issues}`, 400);
  }
  const body = { ...rawBody, ...parsedBody.data };

  trackflowEmailDebugLog("send_initial_body_parsed", {
    rawScheduledAt: rawBody?.scheduledAt || null,
    parsedScheduledAt: body.scheduledAt || null,
    email: body.email || "",
    senderId: body.senderId || body.sender_id || body.sender?.id || "",
    selectedService: body.selectedService || body.service || "",
    source: body.source || "",
    sourceOrigin: body.sourceOrigin || "",
    sourceRole: body.sourceRole || "",
    keepUnderSheetAudit: body.keepUnderSheetAudit,
    hasReportUrl: Boolean(body.reportUrl),
    hasReportToken: Boolean(body.reportToken || body.report_token || body.parentReportToken),
    sheetRowNumber: body.sheetRowNumber || body.parentSheetRowNumber || body.sourceSheetRowNumber || null,
  });

  if (automationPaused()) {
    return json(pausedPayload("initial_email_send"), 423);
  }

  // Cloudflare Turnstile removed. Firebase admin auth now protects this internal agency API.

  const emailLower = normalizeEmail(body.email);
  if (!isValidEmail(emailLower)) throw new ApiError("Invalid target email", 400);

  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (!subject) throw new ApiError("Subject is required", 400);
  if (!plainTextFromHtml(message)) throw new ApiError("Message body cannot be empty", 400);

  const includeSignature = body.includeSignature !== false;
  const rawReportUrl = String(body.reportUrl || "").trim();
  const reportUrl = rawReportUrl ? sanitizePublicReportUrl(rawReportUrl) : "";
  if (rawReportUrl && !reportUrl) {
    throw new ApiError("Invalid or unsafe report URL. Use the secure TrackFlow /tracking-review/{domainSlug}/{token} report URL, not localhost or a direct PDF/Drive URL.", 400);
  }
  const reportButtonText = String(body.reportButtonText || "View short audit note").trim().slice(0, 80);
  const source = String(body.source || "").trim();
  const rawSheetRowNumber = Number(body.sheetRowNumber || body.parentSheetRowNumber || 0) || 0;
  const rawSheetFinalEmail = String(body.sheetFinalEmail || body.parentSheetEmail || "").trim();
  const rawSheetWebsiteUrl = String(body.sheetWebsiteUrl || body.parentSheetWebsiteUrl || body.websiteUrl || "").trim();
  const rawReportToken = normalizeReportToken(body.reportToken || body.report_token || body.parentReportToken || "");
  const sourceLower = source.toLowerCase();
  const hasSheetContext = rawSheetRowNumber > 0 || Boolean(rawSheetFinalEmail || rawSheetWebsiteUrl);
  const explicitKeepUnderSheetAudit = typeof body.keepUnderSheetAudit === "boolean";
  const keepUnderSheetAudit = hasSheetContext && (explicitKeepUnderSheetAudit ? body.keepUnderSheetAudit === true : sourceLower.includes("google_sheet") || sourceLower.includes("sheet_queue"));
  const sourceOrigin = keepUnderSheetAudit ? "sheet" : String(body.sourceOrigin || (rawReportToken || reportUrl ? "manual" : "manual")).trim().toLowerCase();
  const sourceRole = (() => {
    const requested = String(body.sourceRole || "").trim().toLowerCase();
    if (requested === "test") return "test";
    if (keepUnderSheetAudit) {
      const sheetEmailLower = normalizeEmail(rawSheetFinalEmail);
      return sheetEmailLower && sheetEmailLower === emailLower ? "sheet_primary" : "sheet_additional_recipient";
    }
    if (rawReportToken || reportUrl) return "manual_report_linked";
    return requested || "manual";
  })();
  const normalizedSource = source || (keepUnderSheetAudit ? "google_sheet_send_email_drawer" : sourceRole === "manual_report_linked" ? "manual_report_linked" : "dashboard");
  const requiresReviewedReport = normalizedSource === "google_sheet_queue" || normalizedSource === "sheet_queue";

  trackflowEmailDebugLog("send_initial_source_normalized", {
    emailLower,
    rawSheetRowNumber,
    rawSheetFinalEmail,
    rawSheetWebsiteUrl,
    rawReportToken,
    hasSheetContext,
    explicitKeepUnderSheetAudit,
    keepUnderSheetAudit,
    sourceOrigin,
    sourceRole,
    normalizedSource,
    requiresReviewedReport,
  });

  if (requiresReviewedReport) {
    const reportToken = normalizeReportToken(body.reportToken || body.report_token || "");
    const pdfFileId = String(body.pdfFileId || body.pdf_file_id || "").trim();
    const pdfViewUrl = sanitizeOptionalUrl(body.pdfViewUrl || body.pdf_view_url || "");
    const pdfDownloadUrl = sanitizeOptionalUrl(body.pdfDownloadUrl || body.pdf_download_url || "");

    const blockers: string[] = [];
    if (!reportUrl) blockers.push("secure TrackFlow tracking-review report URL is missing");
    if (!reportToken) blockers.push("report token is missing");
    if (!pdfFileId) blockers.push("PDF file ID is missing");
    if (!pdfViewUrl && !pdfDownloadUrl) blockers.push("PDF view/download URL is missing");

    if (blockers.length) {
      throw new ApiError(`Sheet queue send blocked before email: ${blockers.join("; ")}`, 400);
    }
  }

  const sender = getSenderFromBody(body);
  const selectedService = SERVICES.has(body.selectedService || body.service) ? body.selectedService || body.service : body.selectedService || body.service || "Google Ads";
  if (!SERVICES.has(selectedService)) throw new ApiError("Invalid service", 400);

  const suppressed = await isSuppressed(emailLower);
  if (suppressed) {
    return json({ success: false, error: `Email is suppressed: ${suppressed.reason || "blocked"}` }, 409);
  }

  const allowDuplicateSend = body.allowDuplicateSend === true;
  const allowCooldownOverride = body.allowCooldownOverride === true;
  const duplicateSnap = await adminDb
    .collection("outreach_leads")
    .where("emailLower", "==", emailLower)
    .limit(5)
    .get();

  if (!duplicateSnap.empty) {
    const existing = duplicateSnap.docs
      .map((item: any) => ({ id: item.id, ...(item.data() || {}) }))
      .find((item: any) => {
        const status = String(item.status || "").trim().toLowerCase();
        if (["failed", "cancelled", "blocked_daily_limit"].includes(status)) return false;
        if (item.footprintAllowedAgain === true || item.footprintIgnored === true || item.allowedAgain === true || item.allowRecontact === true) return false;
        if (toMillis(item.footprintAllowedAgainAt) || toMillis(item.footprintIgnoredAt)) return false;
        return true;
      });

    if (existing) {
      const protectedDuplicate =
        PROTECTED_STATUSES.has(String((existing as any).status || "")) ||
        (existing as any).stopAutomation === true ||
        ["replied", "bounced", "spam", "unsubscribed", "not_interested"].includes(String((existing as any).status || ""));

      if (protectedDuplicate || !allowDuplicateSend) {
        return json(
          {
            success: false,
            error: protectedDuplicate
              ? `Duplicate blocked: existing lead is ${(existing as any).status || "protected"}`
              : "Duplicate email already exists in outreach leads.",
            duplicateLeadId: (existing as any).id,
            duplicateStatus: (existing as any).status || "unknown",
          },
          409,
        );
      }
    }
  }

  const contactMemoryWarning = await getActiveContactMemoryWarning(emailLower);
  if (contactMemoryWarning && !allowCooldownOverride) {
    return json(
      {
        success: false,
        warningOnly: true,
        code: "cooldown_active",
        allowOverride: true,
        error: `This email was contacted before. Cooldown is active until ${contactMemoryWarning.cooldownUntil || "a future date"}.`,
        contactMemory: contactMemoryWarning,
      },
      409,
    );
  }

  const trackingId = String(body.trackingId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const tag = `${trackingId}_step1`;
  const customMessageId = `<${Date.now()}.${trackingId}@mail.trackflowpro.com>`;
  const scheduledAt = timestampFromAny(body.scheduledAt);
  const nowMs = Date.now();
  const scheduledAtMs = scheduledAt ? scheduledAt.toMillis() : 0;
  const isFutureSchedule = Boolean(scheduledAt && scheduledAtMs > nowMs + BREVO_INITIAL_SCHEDULE_MIN_DELAY_MS);
  const brevoScheduledAtIso = isFutureSchedule && scheduledAt ? new Date(scheduledAtMs).toISOString() : "";

  trackflowEmailDebugLog("send_initial_schedule_decision", {
    emailLower,
    trackingId,
    tag,
    customMessageId,
    scheduledAtMs,
    nowMs,
    isFutureSchedule,
    brevoScheduledAtIso,
    minDelayMs: BREVO_INITIAL_SCHEDULE_MIN_DELAY_MS,
    maxDelayMs: BREVO_INITIAL_SCHEDULE_MAX_DELAY_MS,
  });

  if (isFutureSchedule && scheduledAtMs > nowMs + BREVO_INITIAL_SCHEDULE_MAX_DELAY_MS) {
    throw new ApiError("Brevo initial email scheduling supports up to 72 hours ahead. For longer timing, schedule closer to the send date.", 400);
  }

  const leadRef = adminDb.collection("outreach_leads").doc();
  const baseLead = {
    name: String(body.clientName || body.name || "").trim(),
    company_name: String(body.companyName || body.company_name || "").trim(),
    website: String(body.website || "").trim(),
    business_type: String(body.businessType || body.business_type || "").trim(),
    service: selectedService,
    email: String(body.email || "").trim(),
    emailLower,
    sender_email: sender.email,
    sender_name: sender.name,
    sender_id: sender.id || "",
    reply_to_email: sender.replyToEmail || DEFAULT_REPLY_TO_EMAIL,
    reply_to_name: sender.replyToName || sender.name || DEFAULT_REPLY_TO_NAME,
    sender_daily_limit: sender.dailyLimit || DEFAULT_DAILY_LIMIT,
    include_signature: includeSignature,
    signatureMode: normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full"),
    reportUrl,
    reportButtonText,
    reportToken: rawReportToken,
    pdfFileId: String(body.pdfFileId || body.pdf_file_id || "").trim(),
    pdfViewUrl: sanitizeOptionalUrl(body.pdfViewUrl || body.pdf_view_url || ""),
    pdfDownloadUrl: sanitizeOptionalUrl(body.pdfDownloadUrl || body.pdf_download_url || ""),
    pdfExpiresAt: body.pdfExpiresAt || body.pdf_expires_at || null,
    sheetRowNumber: keepUnderSheetAudit ? rawSheetRowNumber || null : null,
    sheetWebsiteUrl: keepUnderSheetAudit ? rawSheetWebsiteUrl : "",
    sheetFinalEmail: keepUnderSheetAudit ? rawSheetFinalEmail : "",
    keepUnderSheetAudit,
    sourceOrigin,
    sourceRole,
    parentSheetRowNumber: rawSheetRowNumber || null,
    parentSheetEmail: rawSheetFinalEmail,
    parentSheetWebsiteUrl: rawSheetWebsiteUrl,
    parentReportToken: rawReportToken,
    source: normalizedSource,
    cooldownOverride: allowCooldownOverride === true,
    cooldownOverrideAt: allowCooldownOverride === true ? admin.firestore.FieldValue.serverTimestamp() : null,
    subject,
    message: stripDangerousHtml(message),
    trackingId,
    customMessageId,
    originalMessageId: "",
    status: isFutureSchedule ? "scheduled" : "processing_initial",
    scheduledProvider: isFutureSchedule ? "brevo" : "",
    providerScheduleStatus: isFutureSchedule ? "pending" : "",
    brevoScheduled: isFutureSchedule,
    brevoScheduledAt: isFutureSchedule ? scheduledAt : null,
    brevoScheduledAtIso,
    stopAutomation: false,
    open_count: 0,
    click_count: 0,
    follow_up_count: 0,
    scheduledAt: scheduledAt || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    tracking_history: [],
    sent_messages: [],
    nextFollowupStatus: isFutureSchedule ? "waiting_for_initial_delivery" : "waiting_for_first_open_or_click",
    nextFollowupReason: isFutureSchedule ? "brevo_provider_schedule_pending" : "initial_not_sent_yet",
    retryCount: 0,
  };

  trackflowEmailDebugLog("initial_lead_before_firestore_create", {
    leadId: leadRef.id,
    emailLower,
    status: baseLead.status,
    openCountToSave: baseLead.open_count,
    clickCountToSave: baseLead.click_count,
    sourceOrigin: baseLead.sourceOrigin,
    sourceRole: baseLead.sourceRole,
    source: baseLead.source,
    keepUnderSheetAudit: baseLead.keepUnderSheetAudit,
    reportToken: baseLead.reportToken,
    scheduledAt: baseLead.scheduledAt,
    brevoScheduled: baseLead.brevoScheduled,
    brevoScheduledAtIso: baseLead.brevoScheduledAtIso,
    trackingId: baseLead.trackingId,
    customMessageId: baseLead.customMessageId,
  });

  await leadRef.set(baseLead);

  trackflowEmailDebugLog("initial_lead_after_firestore_create", {
    leadId: leadRef.id,
    emailLower,
    initialStatus: baseLead.status,
    openCountSaved: 0,
    clickCountSaved: 0,
  });

  if (isFutureSchedule) {
    try {
      const personalizedInitialMessage = personalizeTemplate(message, {
        name: baseLead.name,
        company_name: baseLead.company_name,
        website: baseLead.website,
        service: selectedService,
      });

      trackflowEmailDebugLog("initial_brevo_scheduled_send_before_api", {
        leadId: leadRef.id,
        emailLower,
        subject,
        tag,
        customMessageId,
        scheduledAtIso: brevoScheduledAtIso,
        sourceOrigin: baseLead.sourceOrigin,
        sourceRole: baseLead.sourceRole,
        reportToken: baseLead.reportToken,
      });

      const data = await sendViaBrevo({
        sender,
        toEmail: emailLower,
        toName: baseLead.name,
        subject,
        htmlContent: buildEmailHtml(personalizedInitialMessage, emailLower, tag, {
          includeSignature,
          reportUrl,
          reportButtonText,
          sender,
          signatureMode: normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full"),
          includeReportLink: true,
          leadId: leadRef.id,
          reportToken: baseLead.reportToken,
          messageId: customMessageId,
          trackingId,
        }),
        tag,
        customMessageId,
        scheduledAt: brevoScheduledAtIso,
      });

      const scheduledAcceptedAt = admin.firestore.Timestamp.now();
      trackflowEmailDebugLog("initial_brevo_scheduled_accepted_before_firestore_update", {
        leadId: leadRef.id,
        emailLower,
        providerMessageId: data.messageId || "",
        customMessageId,
        scheduledAtIso: brevoScheduledAtIso,
        openCountUpdateIncluded: false,
        clickCountUpdateIncluded: false,
      });

      await leadRef.update({
        status: "scheduled",
        scheduledProvider: "brevo",
        providerScheduleStatus: "accepted",
        brevoScheduled: true,
        brevoScheduledAt: scheduledAt,
        brevoScheduledAtIso,
        scheduledAcceptedAt,
        originalMessageId: data.messageId || "",
        brevoMessageId: data.messageId || "",
        nextFollowupStatus: "waiting_for_initial_delivery",
        nextFollowupReason: "brevo_provider_scheduled",
        error: admin.firestore.FieldValue.delete(),
        sent_messages: admin.firestore.FieldValue.arrayUnion({
          step: 1,
          kind: "initial_scheduled",
          provider: "brevo",
          subject,
          trackingTag: tag,
          messageId: data.messageId || "",
          customMessageId,
          trackingId,
          reportToken: baseLead.reportToken,
          includeSignature,
          reportUrl,
          scheduledAt,
          scheduledAtIso: brevoScheduledAtIso,
          scheduledAcceptedAt,
        }),
      });

      trackflowEmailDebugLog("initial_brevo_scheduled_after_firestore_update", {
        leadId: leadRef.id,
        emailLower,
        providerMessageId: data.messageId || "",
        status: "scheduled",
        providerScheduleStatus: "accepted",
        openCountUpdateIncluded: false,
      });

      await addEmailEvent(leadRef.id, "scheduled", {
        emailLower,
        step: 1,
        provider: "brevo",
        scheduledAt,
        scheduledAtIso: brevoScheduledAtIso,
        trackingTag: tag,
        messageId: data.messageId || customMessageId,
        customMessageId,
        trackingId,
        reportToken: baseLead.reportToken,
        forceStore: true,
      });

      return json({
        success: true,
        scheduled: true,
        provider: "brevo",
        leadId: leadRef.id,
        messageId: data.messageId || "",
        trackingId,
        scheduledAt: brevoScheduledAtIso,
        message: "Initial email scheduled with Brevo. It will be delivered by Brevo at the selected time, not by the scheduled-initials cron batch.",
      });
    } catch (error: any) {
      const messageText = String(error?.message || error);
      await leadRef
        .update({
          status: "failed",
          providerScheduleStatus: "failed",
          brevoScheduled: false,
          error: messageText,
          nextFollowupStatus: "blocked",
          nextFollowupReason: "brevo_provider_schedule_failed",
          stopAutomation: true,
        })
        .catch(() => {});
      throw error;
    }
  }

  const quota = await reserveDailySlot(sender.dailyLimit, "initial", sender.email);
  if (!quota.ok) {
    await leadRef.update({ status: "blocked_daily_limit", error: `Sender daily limit reached ${quota.used}/${quota.limit}` });
    return json({ success: false, error: "Sender daily limit reached", quota }, 429);
  }

  let emailActuallySent = false;

  try {
    const personalizedInitialMessage = personalizeTemplate(message, {
      name: baseLead.name,
      company_name: baseLead.company_name,
      website: baseLead.website,
      service: selectedService,
    });

    trackflowEmailDebugLog("initial_direct_send_before_brevo_api", {
      leadId: leadRef.id,
      emailLower,
      subject,
      tag,
      customMessageId,
      sourceOrigin: baseLead.sourceOrigin,
      sourceRole: baseLead.sourceRole,
      reportToken: baseLead.reportToken,
    });

    const data = await sendViaBrevo({
      sender,
      toEmail: emailLower,
      toName: baseLead.name,
      subject,
      htmlContent: buildEmailHtml(personalizedInitialMessage, emailLower, tag, {
        includeSignature,
        reportUrl,
        reportButtonText,
        sender,
        signatureMode: normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full"),
        includeReportLink: true,
        leadId: leadRef.id,
        reportToken: baseLead.reportToken,
        messageId: customMessageId,
        trackingId,
      }),
      tag,
      customMessageId,
    });
    emailActuallySent = true;

    const sentAt = admin.firestore.Timestamp.now();
    trackflowEmailDebugLog("initial_direct_send_before_firestore_update", {
      leadId: leadRef.id,
      emailLower,
      providerMessageId: data.messageId || "",
      customMessageId,
      sentAt,
      statusToSave: "sent",
      openCountUpdateIncluded: false,
      clickCountUpdateIncluded: false,
    });

    await leadRef.update({
      status: "sent",
      sentAt,
      lastFollowUp: sentAt,
      lastSentAt: sentAt,
      nextFollowupStatus: "waiting_for_first_open_or_click",
      nextFollowupReason: "initial_sent_waiting_for_engagement",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      retryCount: 0,
      lastFollowupError: admin.firestore.FieldValue.delete(),
      originalMessageId: data.messageId || "",
      brevoMessageId: data.messageId || "",
      sent_messages: admin.firestore.FieldValue.arrayUnion({
        step: 1,
        kind: "initial",
        subject,
        trackingTag: tag,
        messageId: data.messageId || "",
        customMessageId,
        trackingId,
        reportToken: baseLead.reportToken,
        includeSignature,
        reportUrl,
        sentAt,
      }),
    });

    trackflowEmailDebugLog("initial_direct_send_after_firestore_update", {
      leadId: leadRef.id,
      emailLower,
      providerMessageId: data.messageId || "",
      status: "sent",
      sentAt,
      openCountUpdateIncluded: false,
    });

    await addEmailEvent(leadRef.id, "sent", {
      emailLower,
      step: 1,
      trackingTag: tag,
      messageId: data.messageId || customMessageId,
      customMessageId,
      trackingId,
      reportToken: baseLead.reportToken,
    });

    return json({ success: true, leadId: leadRef.id, messageId: data.messageId, trackingId });
  } catch (error: any) {
    const message = String(error?.message || error);

    // If Brevo already accepted the email, do NOT release the daily slot.
    // Otherwise the app may send more emails than the configured daily limit.
    if (!emailActuallySent) {
      await releaseDailySlot("initial", sender.email).catch(() => {});
      await leadRef.update({ status: "failed", error: message }).catch(() => {});
    } else {
      await leadRef
        .update({
          status: "processing_initial",
          error: `Email was accepted by Brevo, but Firestore post-send update failed: ${message}`,
          postSendUpdateFailed: true,
          postSendUpdateFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => {});
    }

    throw error;
  }
}

/** DELETE /api/trackflow/send-email?leadId=... */
async function handleCancelInitial(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId") || "";
  const trackingId = url.searchParams.get("trackingId") || "";

  let ref: FirestoreDocRef | null = null;

  if (leadId) {
    ref = adminDb.collection("outreach_leads").doc(leadId);
  } else if (trackingId) {
    const snap = await adminDb.collection("outreach_leads").where("trackingId", "==", trackingId).limit(1).get();
    if (!snap.empty) ref = snap.docs[0].ref;
  }

  if (!ref) throw new ApiError("leadId or trackingId required", 400);

  const doc = await ref.get();
  if (!doc.exists) throw new ApiError("Lead not found", 404);

  const lead = doc.data() || {};
  const isBrevoProviderScheduled = lead.brevoScheduled === true || String(lead.scheduledProvider || "").toLowerCase() === "brevo";

  if (!["scheduled", "processing_initial"].includes(String(lead.status || ""))) {
    throw new ApiError("Only scheduled or processing initial emails can be cancelled safely", 400);
  }

  if (isBrevoProviderScheduled) {
    await deleteBrevoScheduledEmailForLead(lead, "cancel");
  }

  await ref.update({
    status: "cancelled",
    stopAutomation: true,
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    providerScheduleStatus: isBrevoProviderScheduled ? "cancelled" : lead.providerScheduleStatus || "",
    brevoScheduled: false,
    nextFollowupStatus: "blocked",
    nextFollowupReason: "manual_cancelled_scheduled_initial",
    automationLock: admin.firestore.FieldValue.delete(),
    error: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return json({
    success: true,
    message: isBrevoProviderScheduled
      ? "Brevo scheduled email cancelled safely."
      : "Scheduled email cancelled safely",
  });
}

/** GET /api/trackflow/cron/scheduled-initials */
async function handleCronScheduledInitials(req: Request) {
  requireCronSecret(req);
  if (automationPaused()) return json(pausedPayload("scheduled_initials_cron"), 423);

  const cronLock = await acquireCronLock("scheduled_initials", 10);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Scheduled initials cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("scheduledInitials", {
      success: true,
      locked: true,
      skipped: true,
      reason: "scheduled_initials_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const snap = await adminDb
      .collection("outreach_leads")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(requestLimit(req, "limit", "SCHEDULED_INITIALS_BATCH_PER_RUN", 20, 1, 50))
      .get();

    const runId = randomUUID();
    const sent: string[] = [];
    const skipped: any[] = [];

    for (const docSnap of snap.docs) {
      const leadRef = docSnap.ref;

      const locked = await adminDb.runTransaction(async (tx : any) => {
        const fresh = await tx.get(leadRef);
        if (!fresh.exists) return null;
        const lead = fresh.data() as LeadData;
        if (lead.status !== "scheduled" || lead.stopAutomation) return null;
        if (lead.brevoScheduled === true || String(lead.scheduledProvider || "").toLowerCase() === "brevo") {
          return { id: fresh.id, ...lead, __skipProviderScheduled: true };
        }
        tx.update(leadRef, {
          status: "processing_initial",
          automationLock: { runId, lockedAt: admin.firestore.Timestamp.now() },
        });
        return { id: fresh.id, ...lead };
      });

      if (!locked) continue;

      if ((locked as AnyRecord).__skipProviderScheduled) {
        skipped.push({
          email: (locked as LeadData).emailLower || normalizeEmail((locked as LeadData).email || ""),
          reason: "brevo_provider_scheduled",
        });
        continue;
      }

      const lead = locked as LeadData;
      const emailLower = lead.emailLower || normalizeEmail(lead.email || "");
      const sender = getSenderFromLead(lead);
      const tag = `${lead.trackingId || lead.id}_step1`;
      const customMessageId = `<${Date.now()}.${lead.trackingId || lead.id}@mail.trackflowpro.com>`;
      let emailActuallySent = false;

      try {
        const suppressed = await isSuppressed(emailLower);
        if (suppressed) {
          await leadRef.update({
            status: "blocked_suppressed",
            stopAutomation: true,
            nextFollowupStatus: "blocked",
            nextFollowupReason: `suppressed:${suppressed.reason || "blocked"}`,
            nextFollowupAt: admin.firestore.FieldValue.delete(),
            nextFollowupStep: admin.firestore.FieldValue.delete(),
            error: `Suppressed: ${suppressed.reason || "blocked"}`,
            automationLock: admin.firestore.FieldValue.delete(),
          });
          skipped.push({ email: emailLower, reason: "suppressed" });
          continue;
        }

        const legacySubject = String(lead.subject || "").trim();
        const legacyMessage = String(lead.message || "").trim();
        if (!legacySubject || !plainTextFromHtml(legacyMessage)) {
          await leadRef.update({
            status: "failed",
            stopAutomation: true,
            nextFollowupStatus: "blocked",
            nextFollowupReason: "scheduled_initial_missing_subject_or_message",
            automationLock: admin.firestore.FieldValue.delete(),
            error: "Scheduled initial blocked: subject/message missing. No fallback email was sent.",
          });
          skipped.push({ email: emailLower, reason: "missing_subject_or_message" });
          continue;
        }

        const quota = await reserveDailySlot(sender.dailyLimit, "initial", sender.email);
        if (!quota.ok) {
          await leadRef.update({
            status: "scheduled",
            automationLock: admin.firestore.FieldValue.delete(),
            error: "Sender daily limit reached; will retry on next cron.",
          });
          skipped.push({ email: emailLower, reason: "daily_limit" });
          continue;
        }

        const data = await sendViaBrevo({
          sender,
          toEmail: emailLower,
          toName: lead.name || "",
          subject: legacySubject,
          htmlContent: buildEmailHtml(personalizeTemplate(legacyMessage, lead), emailLower, tag, {
            includeSignature: lead.include_signature !== false,
            reportUrl: lead.reportUrl || lead.report_url || "",
            reportButtonText: lead.reportButtonText || lead.report_button_text || "View short audit note",
            sender,
            signatureMode: normalizeSignatureMode(lead.signatureMode || lead.signature_mode || "full", "full"),
            includeReportLink: true,
            leadId: String((lead as AnyRecord).id || leadRef.id),
            reportToken: normalizeReportToken(lead.reportToken || (lead as AnyRecord).report_token || extractReportTokenFromUrl(lead.reportUrl || (lead as AnyRecord).report_url || "")),
            messageId: customMessageId,
            trackingId: String(lead.trackingId || lead.id || leadRef.id || ""),
          }),
          tag,
          customMessageId,
        });
        emailActuallySent = true;

        const sentAt = admin.firestore.Timestamp.now();
        await leadRef.update({
          status: "sent",
          sentAt,
          lastFollowUp: sentAt,
          lastSentAt: sentAt,
          nextFollowupStatus: "waiting_for_first_open_or_click",
          nextFollowupReason: "initial_sent_waiting_for_engagement",
          nextFollowupAt: admin.firestore.FieldValue.delete(),
          nextFollowupStep: admin.firestore.FieldValue.delete(),
          retryCount: 0,
          lastFollowupError: admin.firestore.FieldValue.delete(),
          originalMessageId: data.messageId || "",
          brevoMessageId: data.messageId || "",
          automationLock: admin.firestore.FieldValue.delete(),
          sent_messages: admin.firestore.FieldValue.arrayUnion({
            step: 1,
            kind: "initial",
            subject: legacySubject,
            trackingTag: tag,
            messageId: data.messageId || "",
            customMessageId,
            trackingId: String(lead.trackingId || lead.id || leadRef.id || ""),
            reportToken: normalizeReportToken(lead.reportToken || (lead as AnyRecord).report_token || extractReportTokenFromUrl(lead.reportUrl || (lead as AnyRecord).report_url || "")),
            includeSignature: lead.include_signature !== false,
            reportUrl: lead.reportUrl || "",
            sentAt,
          }),
        });

        await addEmailEvent(leadRef.id, "sent", {
          emailLower,
          step: 1,
          trackingTag: tag,
          messageId: data.messageId || customMessageId,
          customMessageId,
          trackingId: String(lead.trackingId || lead.id || leadRef.id || ""),
          reportToken: normalizeReportToken(lead.reportToken || (lead as AnyRecord).report_token || extractReportTokenFromUrl(lead.reportUrl || (lead as AnyRecord).report_url || "")),
        });
        sent.push(emailLower);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        const message = String(error?.message || error);

        // Release quota only when the email was not accepted by Brevo.
        // If Brevo accepted it and Firestore update failed, keep the slot used to avoid limit overrun.
        if (!emailActuallySent) {
          await releaseDailySlot("initial", sender.email).catch(() => {});
          await leadRef
            .update({
              status: "scheduled",
              automationLock: admin.firestore.FieldValue.delete(),
              error: message,
            })
            .catch(() => {});
        } else {
          await leadRef
            .update({
              status: "processing_initial",
              automationLock: admin.firestore.FieldValue.delete(),
              error: `Email was accepted by Brevo, but Firestore post-send update failed: ${message}`,
              postSendUpdateFailed: true,
              postSendUpdateFailedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
            .catch(() => {});
        }

        skipped.push({ email: emailLower, reason: emailActuallySent ? "post_send_update_failed" : "send_error" });
      }
    }

    return json({ success: true, found: snap.size, sentCount: sent.length, sent, skipped });
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Scheduled initials cron lock release failed:", error));
  }
}


/** GET /api/trackflow/cron/followups */

type NextFollowupSchedule = {
  ok: boolean;
  blockers: string[];
  nextFollowupAt?: any;
  nextFollowupAtMs?: number;
  nextFollowupStep?: number;
  configStepKey?: string;
  delayMinutes?: number;
  reason?: string;
};

function getServiceId(value: any): string {
  const service = String(value || "").trim();
  return SERVICES.has(service) ? service : "Email Signature";
}

function getFollowupStepConfig(configData: any, service: string, nextFollowupNumber: number) {
  const configStepKey = `step${nextFollowupNumber}`;
  const stepConfig = configData?.[service]?.[configStepKey];
  return { configStepKey, stepConfig };
}

function hasSafeFollowupVariant(stepConfig: any): boolean {
  const variants = Array.isArray(stepConfig?.variants) ? stepConfig.variants : [];
  return variants.some((variant: any) => validateFollowupContent(variant?.content || "").ok);
}

function buildNextFollowupSchedule(
  lead: LeadData,
  configData: any,
  engagementMs: number,
  reason = "engagement_webhook"
): NextFollowupSchedule {
  const blockers: string[] = [];
  const emailLower = lead.emailLower || normalizeEmail(lead.email || "");

  if (!isValidEmail(emailLower)) blockers.push("invalid_email");
  if (lead.stopAutomation === true) blockers.push("automation_stopped");

  const status = String(lead.status || "").toLowerCase();
  if (HARD_STOP_STATUSES.has(status)) blockers.push(`hard_stop_status:${status}`);

  const followUpCount = Number(lead.follow_up_count || 0);
  if (!Number.isFinite(followUpCount) || followUpCount < 0) blockers.push("invalid_follow_up_count");
  if (followUpCount >= MAX_AUTOMATED_FOLLOWUPS) blockers.push("max_followups_reached");

  const lastSentMs = toMillis(lead.lastFollowUp || lead.lastSentAt || lead.sentAt || lead.createdAt);
  if (!lastSentMs) blockers.push("missing_last_sent_time");
  if (lastSentMs && engagementMs <= lastSentMs) blockers.push("engagement_not_newer_than_last_send");

  const nextFollowupNumber = Math.max(0, followUpCount) + 1;
  const service = getServiceId(lead.service);
  const { configStepKey, stepConfig } = getFollowupStepConfig(configData, service, nextFollowupNumber);
  if (!stepConfig) blockers.push("missing_step_config");
  if (stepConfig && !hasSafeFollowupVariant(stepConfig)) blockers.push("no_safe_variant_for_step");

  const delayMinutesRaw = Number(lead[`${configStepKey}Delay`] || stepConfig?.delay || 1440);
  const delayMinutes = Number.isFinite(delayMinutesRaw) && delayMinutesRaw > 0 ? delayMinutesRaw : 1440;

  const scheduledMsRaw = scheduleBeforeEngagementTime(engagementMs, delayMinutes);
  const scheduledMs = Math.max(engagementMs, scheduledMsRaw || 0);
  if (!scheduledMs) blockers.push("schedule_calculation_failed");

  if (blockers.length > 0) {
    return {
      ok: false,
      blockers,
      nextFollowupStep: nextFollowupNumber,
      configStepKey,
      delayMinutes,
      reason,
    };
  }

  return {
    ok: true,
    blockers,
    nextFollowupAt: admin.firestore.Timestamp.fromMillis(scheduledMs),
    nextFollowupAtMs: scheduledMs,
    nextFollowupStep: nextFollowupNumber,
    configStepKey,
    delayMinutes,
    reason,
  };
}

function hasTemplateOrConfigBlocker(blockers: string[]) {
  return blockers.some((blocker) =>
    [
      "missing_step_config",
      "no_variants_configured",
      "all_variants_failed_safety_check",
      "no_safe_variant_for_step",
    ].includes(blocker)
  );
}

function blockedFollowupUpdate(blockers: string[], extra: Record<string, any> = {}) {
  if (blockers.includes("max_followups_reached")) {
    return {
      status: "finished",
      nextFollowupStatus: "finished",
      nextFollowupReason: blockers.join(",") || "max_followups_reached",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      automationLock: admin.firestore.FieldValue.delete(),
      ...extra,
    };
  }

  const hardBlocked = blockers.some((blocker) =>
    blocker.startsWith("hard_stop_status") ||
    ["automation_stopped", "invalid_email"].includes(blocker)
  );
  const templateBlocked = hasTemplateOrConfigBlocker(blockers);

  if (templateBlocked && !hardBlocked) {
    return {
      nextFollowupStatus: "template_blocked",
      nextFollowupReason: blockers.join(",") || "template_or_config_blocked",
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      automationLock: admin.firestore.FieldValue.delete(),
      ...extra,
    };
  }

  return {
    nextFollowupStatus: hardBlocked ? "blocked" : "waiting_for_new_engagement",
    nextFollowupReason: blockers.join(",") || "not_scheduled",
    nextFollowupAt: admin.firestore.FieldValue.delete(),
    nextFollowupStep: admin.firestore.FieldValue.delete(),
    lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    automationLock: admin.firestore.FieldValue.delete(),
    ...extra,
  };
}

type FollowupDecision = {
  eligible: boolean;
  blockers: string[];
  reasons: string[];
  emailLower?: string;
  service?: string;
  followUpCount?: number;
  nextFollowupNumber?: number;
  configStepKey?: string;
  trackingStepNumber?: number;
  delayMinutes?: number;
  scheduledMs?: number;
  scheduledAt?: string;
  variantCount?: number;
  validVariants?: any[];
  lastSentMs?: number;
  lastEngagedMs?: number;
};

function evaluateFollowupCandidate(
  lead: LeadData,
  configData: any,
  nowMs: number,
  options: { ignoreLock?: boolean } = {}
): FollowupDecision {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const emailLower = lead.emailLower || normalizeEmail(lead.email || "");

  if (!isValidEmail(emailLower)) blockers.push("invalid_email");
  if (lead.stopAutomation === true) blockers.push("automation_stopped");

  const status = String(lead.status || "").toLowerCase();
  if (HARD_STOP_STATUSES.has(status)) blockers.push(`hard_stop_status:${status}`);
  if (!ACTIVE_STATUSES.has(status)) blockers.push(`inactive_status:${status || "missing"}`);
  if (lead.repliedAt || lead.replyAt || lead.reply_at) blockers.push("reply_detected");

  const existingLock = lead.automationLock;
  const lockMs = toMillis(existingLock?.lockedAt);
  const lockStillActive = Boolean(lockMs && nowMs - lockMs < STALE_LOCK_MINUTES * 60_000);
  if (!options.ignoreLock && lockStillActive) blockers.push("active_automation_lock");

  const followUpCount = Number(lead.follow_up_count || 0);
  if (!Number.isFinite(followUpCount) || followUpCount < 0) blockers.push("invalid_follow_up_count");
  if (followUpCount >= MAX_AUTOMATED_FOLLOWUPS) blockers.push("max_followups_reached");

  const nextFollowupNumber = Math.max(0, followUpCount) + 1;
  const configStepKey = `step${nextFollowupNumber}`;
  const trackingStepNumber = nextFollowupNumber + 1;

  const service = SERVICES.has(String(lead.service || "")) ? String(lead.service) : "Email Signature";
  const stepConfig = configData?.[service]?.[configStepKey];
  if (!stepConfig) blockers.push("missing_step_config");

  const variants = Array.isArray(stepConfig?.variants) ? stepConfig.variants : [];
  const validVariants = variants.filter((variant: any) => {
    const safety = validateFollowupContent(variant?.content || "");
    return safety.ok;
  });

  if (variants.length === 0) blockers.push("no_variants_configured");
  if (variants.length > 0 && validVariants.length === 0) blockers.push("all_variants_failed_safety_check");

  const delayMinutesRaw = Number(lead[`${configStepKey}Delay`] || stepConfig?.delay || 1440);
  const delayMinutes = Number.isFinite(delayMinutesRaw) && delayMinutesRaw > 0 ? delayMinutesRaw : 1440;
  const lastSentMs = toMillis(lead.lastFollowUp || lead.lastSentAt || lead.sentAt || lead.createdAt);
  const lastOpenedMs = toMillis(lead.lastOpenedAt || lead.last_opened);
  const lastClickedMs = toMillis(lead.lastClickedAt);
  const lastEngagedMs = Math.max(lastOpenedMs, lastClickedMs);
  const openCount = Number(lead.open_count || 0);
  const clickCount = Number(lead.click_count || 0);
  const hasAnyEngagement = openCount > 0 || clickCount > 0 || lastEngagedMs > 0;

  if (!lastSentMs) blockers.push("missing_last_sent_time");

  const triggerMode = String(configData.followup_trigger_mode || "open_required");

  // Hard safety rule requested for serious cold email:
  // if the lead never opened or clicked, one initial email is enough.
  if (REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP && !hasAnyEngagement) {
    blockers.push("no_open_or_click_no_automatic_followup");
  }

  // For every later follow-up, require a fresh open/click after the previous send.
  // This avoids blindly sending F2-F5 if F1 also did not get engagement.
  if (REQUIRE_OPEN_OR_CLICK_FOR_FOLLOWUP && followUpCount >= 1 && lastEngagedMs <= lastSentMs) {
    blockers.push("waiting_for_new_open_or_click_after_last_send");
  }

  if (triggerMode === "open_required") {
    if (followUpCount === 0 && !hasAnyEngagement) {
      blockers.push("waiting_for_first_open_or_click");
    }
    if (followUpCount >= 1 && lastEngagedMs <= lastSentMs) {
      blockers.push("waiting_for_new_open_or_click_after_last_send");
    }
  }

  // Preferred timing: if a lead engaged at 10:45 and delay is 2 days,
  // schedule at roughly 09:45 two days later. Cron sends on the next run after this time.
  // nextFollowupAt is the source of truth once the Brevo webhook has scheduled it.
  const storedNextFollowupMs = toMillis(lead.nextFollowupAt);
  const calculatedScheduledMs = lastEngagedMs
    ? scheduleBeforeEngagementTime(lastEngagedMs, delayMinutes)
    : lastSentMs
      ? lastSentMs + delayMinutes * 60_000
      : 0;
  const scheduledMs = storedNextFollowupMs || calculatedScheduledMs;

  if (String(lead.nextFollowupStatus || "").toLowerCase() === "blocked") blockers.push("next_followup_blocked");
  if (String(lead.nextFollowupStatus || "").toLowerCase() === "processing") blockers.push("next_followup_processing");
  if (scheduledMs && nowMs < scheduledMs) blockers.push("delay_not_completed_or_preferred_window_not_reached");

  if (blockers.length === 0) {
    reasons.push("status_is_active");
    reasons.push("automation_not_stopped");
    reasons.push("no_reply_or_hard_stop_detected");
    reasons.push("followup_step_available");
    reasons.push("template_passed_safety_check");
    reasons.push("delay_completed");
    reasons.push("open_or_click_detected");
    reasons.push("scheduled_one_hour_before_last_engagement_time");
    if (triggerMode === "open_required") reasons.push("engagement_requirement_met");
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    reasons,
    emailLower,
    service,
    followUpCount,
    nextFollowupNumber,
    configStepKey,
    trackingStepNumber,
    delayMinutes,
    scheduledMs,
    scheduledAt: scheduledMs ? new Date(scheduledMs).toISOString() : undefined,
    variantCount: validVariants.length,
    validVariants,
    lastSentMs,
    lastEngagedMs,
  };
}

async function releaseStaleAutomationLocks(limit = 300) {
  const nowMs = Date.now();
  const snap = await adminDb
    .collection("outreach_leads")
    .where("status", "in", ["processing_initial", "processing_followup"])
    .limit(Math.max(1, Math.min(limit, 500)))
    .get();

  const released: any[] = [];
  const batch = adminDb.batch();

  for (const docSnap of snap.docs) {
    const lead = docSnap.data() as LeadData;
    const lockMs = toMillis(lead.automationLock?.lockedAt);
    if (!lockMs || nowMs - lockMs < STALE_LOCK_MINUTES * 60_000) continue;

    const previousStatus = String(lead.automationLock?.previousStatus || "").trim();
    const fallbackStatus = lead.status === "processing_initial" ? "scheduled" : "sent";
    const nextStatus = previousStatus && !previousStatus.startsWith("processing_") ? previousStatus : fallbackStatus;

    batch.update(docSnap.ref, {
      status: nextStatus,
      nextFollowupStatus: lead.status === "processing_followup" ? "scheduled" : lead.nextFollowupStatus || admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
      error: `Recovered stale automation lock older than ${STALE_LOCK_MINUTES} minutes`,
      recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    released.push({ leadId: docSnap.id, email: lead.emailLower || lead.email || "", restoredStatus: nextStatus });
  }

  if (released.length > 0) await batch.commit();
  return released;
}

async function handleCronRecoverLocks(req: Request) {
  requireCronSecret(req);
  const released = await releaseStaleAutomationLocks();
  return json({ success: true, releasedCount: released.length, released });
}

async function handleFollowupDryRun(req: Request) {
  await requireAdmin(req);

  const url = new URL(req.url);
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const includeBlocked = url.searchParams.get("includeBlocked") === "true";
  const mode = String(url.searchParams.get("mode") || "due").toLowerCase();

  const runtimeConfig = await loadFollowupRuntimeConfig();
  const configData = runtimeConfig.data;
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.now();

  const candidatesSnap =
    mode === "legacy"
      ? await adminDb.collection("outreach_leads").where("stopAutomation", "==", false).limit(FOLLOWUP_CANDIDATE_LIMIT).get()
      : await adminDb
          .collection("outreach_leads")
          .where("stopAutomation", "==", false)
          .where("nextFollowupStatus", "==", "scheduled")
          .where("nextFollowupAt", "<=", nowTs)
          .orderBy("nextFollowupAt", "asc")
          .limit(max)
          .get();

  const rows = candidatesSnap.docs
    .map((docSnap: any) => {
      const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
      const decision = evaluateFollowupCandidate(lead, configData, nowMs);
      return {
        leadId: docSnap.id,
        email: decision.emailLower || lead.email || "",
        name: lead.name || "",
        company: lead.company_name || "",
        service: decision.service || lead.service || "",
        status: lead.status || "",
        nextFollowupStatus: lead.nextFollowupStatus || "",
        followUpCount: lead.follow_up_count || 0,
        nextFollowupNumber: decision.nextFollowupNumber,
        scheduledAt: decision.scheduledAt,
        eligible: decision.eligible,
        reasons: decision.reasons,
        blockers: decision.blockers,
      };
    })
    .filter((row: any) => includeBlocked || row.eligible)
    .slice(0, max);

  return json({
    success: true,
    mode,
    configSource: runtimeConfig.source,
    checked: candidatesSnap.size,
    returned: rows.length,
    eligibleCount: rows.filter((row: any) => row.eligible).length,
    generatedAt: new Date(nowMs).toISOString(),
    rows,
  });
}
async function getCount(queryRef: FirestoreQueryRef): Promise<number> {
  const aggregateSnap = await queryRef.count().get();
  return Number(aggregateSnap.data().count || 0);
}

async function getStatusCount(status: string): Promise<number> {
  return getCount(adminDb.collection("outreach_leads").where("nextFollowupStatus", "==", status));
}

function getFollowupBatchPerRun(configData: any): number {
  return Math.max(
    1,
    Math.min(Number(configData?.followup_batch_per_run || DEFAULT_FOLLOWUP_BATCH_PER_RUN), MAX_FOLLOWUP_BATCH_PER_RUN)
  );
}

async function getFollowupSentTodayTotal(dateKey = todayKey()): Promise<number> {
  const statsSnap = await adminDb.collection("daily_sending_stats").where("dateKey", "==", dateKey).get();
  return statsSnap.docs.reduce((total: number, docSnap: any) => total + Number((docSnap.data() || {}).followupSent || 0), 0);
}


async function handleSenderStats(req: Request) {
  await requireAdmin(req);

  const dateKey = todayKey();
  const statsSnap = await adminDb.collection("daily_sending_stats").where("dateKey", "==", dateKey).get();
  const byEmail: Record<string, { initialSent: number; followupSent: number; totalSent: number }> = {};

  statsSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    const senderEmail = normalizeEmail(data.senderEmail || "");
    if (!senderEmail || senderEmail === "global") return;

    const initialSent = Number(data.initialSent || 0);
    const followupSent = Number(data.followupSent || 0);
    const current = byEmail[senderEmail] || { initialSent: 0, followupSent: 0, totalSent: 0 };
    current.initialSent += initialSent;
    current.followupSent += followupSent;
    current.totalSent += initialSent + followupSent;
    byEmail[senderEmail] = current;
  });

  const rows = ACTIVE_SENDERS.map((sender: any) => {
    const email = normalizeEmail(sender.email || "");
    const count = byEmail[email] || { initialSent: 0, followupSent: 0, totalSent: 0 };
    const limit = Math.max(1, Math.min(Number(sender.limit || DEFAULT_DAILY_LIMIT), 500));
    return {
      id: sender.id,
      name: sender.name,
      email,
      limit,
      initialSent: count.initialSent,
      followupSent: count.followupSent,
      totalSent: count.totalSent,
      remaining: Math.max(limit - count.initialSent, 0),
    };
  });

  return json({
    success: true,
    dateKey,
    rows,
    counts: rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.email] = Number(row.initialSent || 0);
      return acc;
    }, {}),
  });
}


type DailySendingStatsSummary = {
  keepDateKey: string;
  totalDocs: number;
  todayDocs: number;
  oldDocs: number;
  senderCount: number;
  oldestDateKey: string;
  latestDateKey: string;
  senderRows: Array<{
    senderEmail: string;
    totalDocs: number;
    oldDocs: number;
    todayDocs: number;
    initialSent: number;
    followupSent: number;
    totalSent: number;
    oldestDateKey?: string;
    latestDateKey?: string;
  }>;
  sampleRows: Array<{
    id: string;
    dateKey: string;
    senderEmail: string;
    initialSent: number;
    followupSent: number;
    totalSent: number;
    updatedAt?: string;
  }>;
};

function serializeDailySendingStatsTimestamp(value: any): string {
  if (!value) return "";
  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    if (typeof value.toMillis === "function") return new Date(value.toMillis()).toISOString();
  } catch {
    return "";
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  return "";
}

function normalizeDailySendingStatsRow(docSnap: FirestoreQueryDocSnap) {
  const data = docSnap.data() || {};
  const dateKey = String(data.dateKey || "").trim();
  const senderEmail = normalizeEmail(data.senderEmail || "") || "global";
  const initialSent = Math.max(0, Number(data.initialSent || 0));
  const followupSent = Math.max(0, Number(data.followupSent || 0));

  return {
    id: docSnap.id,
    dateKey,
    senderEmail,
    initialSent,
    followupSent,
    totalSent: initialSent + followupSent,
    updatedAt: serializeDailySendingStatsTimestamp(data.updatedAt),
  };
}

async function buildDailySendingStatsCleanupSummary(keepDateKey = todayKey()): Promise<DailySendingStatsSummary> {
  const collectionRef = adminDb.collection("daily_sending_stats");
  const [totalDocs, todayDocs, oldDocs, sampleSnap] = await Promise.all([
    getCount(collectionRef),
    getCount(collectionRef.where("dateKey", "==", keepDateKey)),
    getCount(collectionRef.where("dateKey", "<", keepDateKey)),
    collectionRef.where("dateKey", "<", keepDateKey).orderBy("dateKey", "asc").limit(250).get(),
  ]);

  const senderMap = new Map<string, DailySendingStatsSummary["senderRows"][number]>();
  const sampleRows = sampleSnap.docs.map((docSnap: any) => normalizeDailySendingStatsRow(docSnap));
  let oldestDateKey = "";
  let latestDateKey = "";

  const addSenderRow = (row: ReturnType<typeof normalizeDailySendingStatsRow>, isToday: boolean) => {
    const senderEmail = row.senderEmail || "global";
    const current = senderMap.get(senderEmail) || {
      senderEmail,
      totalDocs: 0,
      oldDocs: 0,
      todayDocs: 0,
      initialSent: 0,
      followupSent: 0,
      totalSent: 0,
      oldestDateKey: "",
      latestDateKey: "",
    };

    current.totalDocs += 1;
    current.oldDocs += isToday ? 0 : 1;
    current.todayDocs += isToday ? 1 : 0;
    current.initialSent += row.initialSent;
    current.followupSent += row.followupSent;
    current.totalSent += row.totalSent;
    if (row.dateKey && (!current.oldestDateKey || row.dateKey < current.oldestDateKey)) current.oldestDateKey = row.dateKey;
    if (row.dateKey && (!current.latestDateKey || row.dateKey > current.latestDateKey)) current.latestDateKey = row.dateKey;
    senderMap.set(senderEmail, current);
  };

  sampleRows.forEach((row) => {
    if (row.dateKey && (!oldestDateKey || row.dateKey < oldestDateKey)) oldestDateKey = row.dateKey;
    if (row.dateKey && (!latestDateKey || row.dateKey > latestDateKey)) latestDateKey = row.dateKey;
    addSenderRow(row, false);
  });

  const todaySnap = await collectionRef.where("dateKey", "==", keepDateKey).limit(100).get();
  todaySnap.docs.map((docSnap: any) => normalizeDailySendingStatsRow(docSnap)).forEach((row) => {
    if (row.dateKey && (!oldestDateKey || row.dateKey < oldestDateKey)) oldestDateKey = row.dateKey;
    if (row.dateKey && (!latestDateKey || row.dateKey > latestDateKey)) latestDateKey = row.dateKey;
    addSenderRow(row, true);
  });

  return {
    keepDateKey,
    totalDocs,
    todayDocs,
    oldDocs,
    senderCount: senderMap.size,
    oldestDateKey,
    latestDateKey,
    senderRows: Array.from(senderMap.values()).sort((a, b) => b.oldDocs - a.oldDocs || a.senderEmail.localeCompare(b.senderEmail)).slice(0, 100),
    sampleRows,
  };
}

async function handleDailySendingStatsCleanupPreview(req: Request) {
  await requireAdmin(req);

  const keepDateKey = todayKey();
  const summary = await buildDailySendingStatsCleanupSummary(keepDateKey);

  return json({
    success: true,
    mode: "preview",
    message: summary.oldDocs
      ? `${summary.oldDocs} old daily sending stat record(s) are ready to delete. Today's ${summary.todayDocs} record(s) will stay.`
      : "No old daily sending stat records found. Today's data is protected.",
    ...summary,
  });
}

async function handleDailySendingStatsCleanup(req: Request) {
  await requireAdmin(req);

  const body = await readJson(req).catch(() => ({}));
  const confirm = String(body?.confirm || "").trim().toUpperCase();
  if (confirm !== "DELETE OLD DAILY STATS") {
    throw new ApiError("Type DELETE OLD DAILY STATS before deleting old daily sending stats.", 400);
  }

  const keepDateKey = todayKey();
  const batchSize = Math.max(1, Math.min(Number(body?.batchSize || 400), 450));
  const maxBatches = Math.max(1, Math.min(Number(body?.maxBatches || 10), 20));
  const collectionRef = adminDb.collection("daily_sending_stats");

  let deletedCount = 0;
  const deletedSamples: string[] = [];

  for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
    const snap = await collectionRef.where("dateKey", "<", keepDateKey).orderBy("dateKey", "asc").limit(batchSize).get();
    if (snap.empty) break;

    const batch = adminDb.batch();
    snap.docs.forEach((docSnap: any) => {
      batch.delete(docSnap.ref);
      if (deletedSamples.length < 10) deletedSamples.push(docSnap.id);
    });
    await batch.commit();
    deletedCount += snap.size;

    if (snap.size < batchSize) break;
  }

  const summary = await buildDailySendingStatsCleanupSummary(keepDateKey);

  return json({
    success: true,
    mode: "delete_old_keep_today",
    message: deletedCount
      ? `Deleted ${deletedCount} old daily sending stat record(s). Today's ${summary.todayDocs} record(s) stayed protected.${summary.oldDocs ? ` ${summary.oldDocs} old record(s) still remain; run cleanup again if needed.` : ""}`
      : "No old daily sending stat records were deleted. Today's data stayed protected.",
    deletedCount,
    remainingOldDocs: summary.oldDocs,
    hasMore: summary.oldDocs > 0,
    deletedSamples,
    ...summary,
  });
}

async function handleFollowupSummary(req: Request) {
  await requireAdmin(req);

  const runtimeConfig = await loadFollowupRuntimeConfig();
  const configData = runtimeConfig.data;
  const dailyLimit = Math.max(1, Math.min(Number(configData.daily_followup_limit || 50), 500));
  const batchPerRun = getFollowupBatchPerRun(configData);
  const nowTs = admin.firestore.Timestamp.now();
  const key = todayKey();

  const dueQuery = adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", "<=", nowTs);

  const scheduledQuery = adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", ">", nowTs);

  const [dueNow, scheduled, waitingFirstOpen, waitingNewEngagement, templateBlocked, failedFinal, blocked, statsSnap] = await Promise.all([
    getCount(dueQuery),
    getCount(scheduledQuery),
    getStatusCount("waiting_for_first_open_or_click"),
    getStatusCount("waiting_for_new_engagement"),
    getStatusCount("template_blocked"),
    getStatusCount("failed_final"),
    getStatusCount("blocked"),
    adminDb.collection("daily_sending_stats").where("dateKey", "==", key).get(),
  ]);

  const sentToday = statsSnap.docs.reduce((total: number, docSnap: any) => total + Number((docSnap.data() || {}).followupSent || 0), 0);
  const remainingToday = Math.max(0, dailyLimit - sentToday);
  const maxThisRun = Math.min(batchPerRun, remainingToday);
  const failedRetry = dueNow > 0 ? 0 : 0;

  return json({
    success: true,
    generatedAt: new Date().toISOString(),
    dateKey: key,
    configSource: runtimeConfig.source,
    dailyLimit,
    batchPerRun,
    remainingToday,
    maxThisRun,
    sentToday,
    dueNow,
    scheduled,
    waitingFirstOpen,
    waitingNewEngagement,
    templateBlocked,
    failedRetry,
    failedFinal,
    blocked,
  });
}

/** GET /api/trackflow/cron/followups */
async function handleCronFollowups(req: Request) {
  requireCronSecret(req);
  if (automationPaused()) return json(pausedPayload("followups_cron"), 423);
  if (!followupsEnabled()) return json({ success: true, skipped: true, disabled: true, feature: "followups", message: "FOLLOWUPS_ENABLED=false" });

  const cronLock = await acquireCronLock("followups", 20);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Follow-up cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("followups", {
      success: true,
      locked: true,
      skipped: true,
      reason: "followups_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
  const recoveredLocks = await releaseStaleAutomationLocks(200).catch(() => []);

  const runtimeConfig = await loadFollowupRuntimeConfig();
  const configData = runtimeConfig.data;
  const globalDailyLimit = Math.max(1, Math.min(Number(configData.daily_followup_limit || 50), 500));
  const batchPerRun = getFollowupBatchPerRun(configData);
  const sentTodayBeforeRun = await getFollowupSentTodayTotal();
  const remainingDailyBeforeRun = Math.max(0, globalDailyLimit - sentTodayBeforeRun);
  const runSendLimit = Math.min(batchPerRun, remainingDailyBeforeRun);
  const nowMs = Date.now();
  const nowTs = admin.firestore.Timestamp.now();
  const runId = randomUUID();
  const url = new URL(req.url);
  const includeLegacyBackfill = url.searchParams.get("legacy") === "true" || envFlag("FOLLOWUP_LEGACY_BACKFILL", false);

  if (runSendLimit <= 0) {
    return json({
      success: true,
      message: "Daily follow-up limit reached. Due leads remain scheduled for the next cron/day.",
      recoveredLocks,
      checked: 0,
      dueChecked: 0,
      legacyChecked: 0,
      sentCount: 0,
      sent: [],
      skipped: [],
      dailyLimit: globalDailyLimit,
      batchPerRun,
      sentTodayBeforeRun,
      remainingDailyBeforeRun,
      runSendLimit,
    });
  }

  // Primary scheduler: read only leads whose nextFollowupAt is already due.
  // This keeps reads low and avoids missing the 1-hour-before preferred window.
  const dueSnap = await adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "scheduled")
    .where("nextFollowupAt", "<=", nowTs)
    .orderBy("nextFollowupAt", "asc")
    .limit(NEXT_FOLLOWUP_QUERY_LIMIT)
    .get();

  const candidateDocs: FirestoreQueryDocSnap[] = [...dueSnap.docs];
  const seenIds = new Set(candidateDocs.map((docSnap) => docSnap.id));

  // Compatibility safety net for leads created before nextFollowupAt existed.
  // Keep it small. Once all active leads receive a new open/click or you run a backfill, this can be disabled with ?legacy=false.
  let legacyChecked = 0;
  if (includeLegacyBackfill && candidateDocs.length < 50) {
    const legacySnap = await adminDb
      .collection("outreach_leads")
      .where("stopAutomation", "==", false)
      .limit(intEnv("FOLLOWUP_LEGACY_BACKFILL_LIMIT", Math.min(FOLLOWUP_CANDIDATE_LIMIT, 75), 1, 150))
      .get();

    legacyChecked = legacySnap.size;

    for (const docSnap of legacySnap.docs) {
      if (seenIds.has(docSnap.id)) continue;
      const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
      if (lead.nextFollowupAt && String(lead.nextFollowupStatus || "") === "scheduled") continue;

      const decision = evaluateFollowupCandidate(lead, configData, nowMs);
      if (!decision.eligible) continue;

      // Schedule it first so future cron runs use the indexed due-query path.
      await docSnap.ref.set(
        {
          nextFollowupAt: admin.firestore.Timestamp.fromMillis(decision.scheduledMs || nowMs),
          nextFollowupStep: decision.nextFollowupNumber || Number(lead.follow_up_count || 0) + 1,
          nextFollowupStatus: "scheduled",
          nextFollowupReason: "legacy_backfill_from_cron",
          lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      candidateDocs.push(docSnap);
      seenIds.add(docSnap.id);
      if (candidateDocs.length >= NEXT_FOLLOWUP_QUERY_LIMIT) break;
    }
  }

  const sent: string[] = [];
  const skipped: any[] = [];

  for (const docSnap of candidateDocs) {
    if (sent.length >= runSendLimit) break;

    const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
    const decision = evaluateFollowupCandidate(lead, configData, nowMs);

    if (!decision.eligible) {
      await docSnap.ref.set(blockedFollowupUpdate(decision.blockers), { merge: true }).catch(() => {});
      skipped.push({ email: decision.emailLower || lead.email || "", reason: decision.blockers.join(",") });
      continue;
    }

    const emailLower = decision.emailLower || "";
    const suppressed = await isSuppressed(emailLower);
    if (suppressed) {
      await docSnap.ref.update({
        status: "blocked_suppressed",
        stopAutomation: true,
        nextFollowupStatus: "blocked",
        nextFollowupReason: `suppressed:${suppressed.reason || "blocked"}`,
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        error: `Suppressed: ${suppressed.reason || "blocked"}`,
        automationLock: admin.firestore.FieldValue.delete(),
      });
      skipped.push({ email: emailLower, reason: "suppressed" });
      continue;
    }

    const sender = getSenderFromLead(lead);
    const effectiveLimit = Math.min(globalDailyLimit, sender.dailyLimit || globalDailyLimit);
    const quota = await reserveDailySlot(effectiveLimit, "followup", sender.email);
    if (!quota.ok) {
      skipped.push({
        email: emailLower,
        reason: "sender_followup_limit_reached",
        quota,
      });
      continue;
    }

    const lockResult = await adminDb.runTransaction(async (tx: any) => {
      const fresh = await tx.get(docSnap.ref);
      if (!fresh.exists) return { ok: false, reason: "lead_missing" };

      const freshLead = { id: docSnap.id, ...fresh.data() } as LeadData;
      const freshDecision = evaluateFollowupCandidate(freshLead, configData, Date.now());
      if (!freshDecision.eligible) return { ok: false, reason: freshDecision.blockers.join(",") };

      tx.update(docSnap.ref, {
        status: "processing_followup",
        nextFollowupStatus: "processing",
        lastFollowupEvaluatedAt: nowTs,
        automationLock: {
          runId,
          lockedAt: nowTs,
          step: freshDecision.nextFollowupNumber,
          previousStatus: freshLead.status || "sent",
          previousNextFollowupStatus: freshLead.nextFollowupStatus || "scheduled",
          eligibilityReasons: freshDecision.reasons,
          scheduledAt: freshDecision.scheduledAt || null,
        },
      });

      return { ok: true, lead: freshLead, decision: freshDecision };
    });

    if (!lockResult.ok) {
      await releaseDailySlot("followup", sender.email).catch(() => {});
      skipped.push({ email: emailLower, reason: lockResult.reason || "lock_failed" });
      continue;
    }

    const lockedLead = lockResult.lead as LeadData;
    const lockedDecision = lockResult.decision as FollowupDecision;
    let emailActuallySent = false;

    try {
      const variants = lockedDecision.validVariants || [];
      const assignedVariantId = lockedLead[`${lockedDecision.configStepKey}AssignedVariant`];
      const selectedVariant =
        variants.find((v: any) => v.id === assignedVariantId) ||
        variants[deterministicVariantIndex(`${lockedLead.id}-${lockedDecision.configStepKey}`, variants.length)];

      if (!selectedVariant?.content) throw new ApiError("No safe follow-up variant available", 400);

      const tag = `${lockedLead.trackingId || lockedLead.id}_step${lockedDecision.trackingStepNumber}`;
      const baseSubject = String(lockedLead.subject || "Our Discussion").replace(/^\s*re:\s*/i, "").trim() || "Our Discussion";
      const subject = `Re: ${baseSubject}`;
      const customMessageId = `<${Date.now()}.${lockedLead.trackingId || lockedLead.id}.${lockedDecision.configStepKey}@mail.trackflowpro.com>`;
      const threadHeaders = buildThreadHeadersForFollowup(lockedLead);

      trackflowEmailDebugLog("followup_threading_mode_selected", {
        leadId: String(lockedLead.id || docSnap.id || ""),
        emailLower,
        baseSubject,
        subject,
        threadingMode: followupThreadingMode(),
        sendsInReplyToHeader: Boolean(threadHeaders["In-Reply-To"]),
        sendsReferencesHeader: Boolean(threadHeaders.References),
        inReplyTo: threadHeaders["In-Reply-To"] || "",
        referencesCount: threadHeaders.References ? threadHeaders.References.split(" ").filter(Boolean).length : 0,
      });

      const htmlContent = buildEmailHtml(personalizeTemplate(selectedVariant.content, lockedLead), emailLower, tag, {
        includeSignature: lockedLead.include_signature !== false,
        reportUrl: "",
        reportButtonText: "",
        sender,
        signatureMode: "compact",
        includeReportLink: false,
        leadId: String(lockedLead.id || ""),
        reportToken: normalizeReportToken(lockedLead.reportToken || (lockedLead as AnyRecord).report_token || extractReportTokenFromUrl(lockedLead.reportUrl || (lockedLead as AnyRecord).report_url || "")),
        messageId: customMessageId,
        trackingId: String(lockedLead.trackingId || lockedLead.id || ""),
      });

      const data = await sendViaBrevo({
        sender,
        toEmail: emailLower,
        toName: lockedLead.name || "",
        subject,
        htmlContent,
        tag,
        customMessageId,
        headers: threadHeaders,
      });
      emailActuallySent = true;

      const sentAt = admin.firestore.Timestamp.now();
      const nextFollowupNumber = Number(lockedDecision.nextFollowupNumber || 0);
      await docSnap.ref.update({
        status: nextFollowupNumber >= MAX_AUTOMATED_FOLLOWUPS ? "finished" : "sent",
        follow_up_count: nextFollowupNumber,
        lastFollowUp: sentAt,
        lastSentAt: sentAt,
        nextFollowupStatus: nextFollowupNumber >= MAX_AUTOMATED_FOLLOWUPS ? "finished" : "waiting_for_new_engagement",
        nextFollowupReason: nextFollowupNumber >= MAX_AUTOMATED_FOLLOWUPS ? "max_followups_sent" : "followup_sent_waiting_for_new_open_or_click",
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        retryCount: 0,
        lastFollowupError: admin.firestore.FieldValue.delete(),
        automationLock: admin.firestore.FieldValue.delete(),
        lastAutomationDecision: {
          runId,
          type: "followup_sent",
          reasons: lockedDecision.reasons,
          sentAt,
          nextFollowupNumber,
          configStepKey: lockedDecision.configStepKey,
        },
        lastFollowupMessageId: data.messageId || customMessageId,
        lastFollowupCustomMessageId: customMessageId,
        lastFollowupInReplyTo: threadHeaders["In-Reply-To"] || "",
        lastFollowupReferences: threadHeaders.References || "",
        sent_messages: admin.firestore.FieldValue.arrayUnion({
          step: lockedDecision.trackingStepNumber,
          followupNumber: nextFollowupNumber,
          configStepKey: lockedDecision.configStepKey,
          subject,
          trackingTag: tag,
          variantId: selectedVariant.id || "",
          messageId: data.messageId || "",
          customMessageId,
          trackingId: String(lockedLead.trackingId || lockedLead.id || ""),
          reportToken: normalizeReportToken(lockedLead.reportToken || (lockedLead as AnyRecord).report_token || extractReportTokenFromUrl(lockedLead.reportUrl || (lockedLead as AnyRecord).report_url || "")),
          inReplyTo: threadHeaders["In-Reply-To"] || "",
          references: threadHeaders.References || "",
          threadRootMessageId: threadHeaders["X-TFP-Thread-Root"] || "",
          eligibilityReasons: lockedDecision.reasons,
          sentAt,
        }),
      });

      await addEmailEvent(docSnap.id, "followup_sent", {
        emailLower,
        followupNumber: nextFollowupNumber,
        step: lockedDecision.trackingStepNumber,
        trackingTag: tag,
        messageId: data.messageId || customMessageId,
        customMessageId,
        trackingId: String(lockedLead.trackingId || lockedLead.id || ""),
        reportToken: normalizeReportToken(lockedLead.reportToken || (lockedLead as AnyRecord).report_token || extractReportTokenFromUrl(lockedLead.reportUrl || (lockedLead as AnyRecord).report_url || "")),
        inReplyTo: threadHeaders["In-Reply-To"] || "",
        references: threadHeaders.References || "",
        eligibilityReasons: lockedDecision.reasons,
      });

      sent.push(emailLower);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      const message = String(error?.message || error);

      // Release quota only when the email was not accepted by Brevo.
      // If Brevo accepted it and Firestore update failed, keep the daily count used.
      if (!emailActuallySent) {
        await releaseDailySlot("followup", sender.email).catch(() => {});
      }

      const retryCount = Number(lockedLead.retryCount || 0) + 1;
      const canRetry = !emailActuallySent && retryCount < MAX_FOLLOWUP_RETRIES;
      await docSnap.ref.update({
        status: emailActuallySent
          ? "processing_followup"
          : String(lockedLead.status || "sent").startsWith("processing_")
            ? "sent"
            : lockedLead.status || "sent",
        nextFollowupStatus: emailActuallySent ? "processing" : canRetry ? "scheduled" : "failed_final",
        nextFollowupReason: emailActuallySent
          ? "post_send_update_failed_manual_review_needed"
          : canRetry
            ? "send_error_retry_scheduled"
            : "send_error_retry_limit_reached",
        nextFollowupAt: canRetry
          ? admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60_000)
          : admin.firestore.FieldValue.delete(),
        retryCount,
        lastFollowupError: message,
        automationLock: admin.firestore.FieldValue.delete(),
        error: emailActuallySent ? `Email was accepted by Brevo, but Firestore post-send update failed: ${message}` : message,
        postSendUpdateFailed: emailActuallySent || admin.firestore.FieldValue.delete(),
        postSendUpdateFailedAt: emailActuallySent ? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.delete(),
      });
      skipped.push({
        email: emailLower,
        reason: emailActuallySent ? "post_send_update_failed" : "send_error",
        retryCount,
        error: message,
      });
    }
  }

  return json({
    success: true,
    configSource: runtimeConfig.source,
    recoveredLocks,
    checked: candidateDocs.length,
    dueChecked: dueSnap.size,
    legacyChecked,
    dailyLimit: globalDailyLimit,
    batchPerRun,
    sentTodayBeforeRun,
    remainingDailyBeforeRun,
    runSendLimit,
    remainingDailyAfterRun: Math.max(0, remainingDailyBeforeRun - sent.length),
    sentCount: sent.length,
    sent,
    skipped,
  });
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Follow-up cron lock release failed:", error));
  }
}

/** POST /api/trackflow/webhooks/brevo */
async function applyNextFollowupScheduleFromEngagement(
  updatePayload: any,
  leadData: LeadData,
  eventTime: any,
  reason: "opened" | "clicked"
) {
  try {
    const runtimeConfig = await loadFollowupRuntimeConfig();

    const effectiveLead = {
      ...leadData,
      status: updatePayload.status || leadData.status,
      lastEngagedAt: eventTime,
    } as LeadData;

    const schedule = buildNextFollowupSchedule(effectiveLead, runtimeConfig.data, eventTime.toMillis(), reason);

    if (schedule.ok) {
      Object.assign(updatePayload, {
        nextFollowupAt: schedule.nextFollowupAt,
        nextFollowupStep: schedule.nextFollowupStep,
        nextFollowupStatus: "scheduled",
        nextFollowupReason: reason,
        nextFollowupDelayMinutes: schedule.delayMinutes || null,
        nextFollowupConfigStepKey: schedule.configStepKey || null,
        lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        retryCount: 0,
        lastFollowupError: admin.firestore.FieldValue.delete(),
      });
    } else {
      Object.assign(updatePayload, blockedFollowupUpdate(schedule.blockers, { nextFollowupReason: `${reason}:${schedule.blockers.join(",")}` }));
    }
  } catch (error: any) {
    Object.assign(updatePayload, {
      nextFollowupStatus: "waiting_for_new_engagement",
      nextFollowupReason: `schedule_error:${String(error?.message || error)}`,
      lastFollowupError: String(error?.message || error),
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

function normalizeBrevoWebhookTagList(body: AnyRecord = {}): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  const pushTag = (value: any) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      for (const item of value) pushTag(item);
      return;
    }

    const raw = String(value || "").trim();
    if (!raw) return;

    // Brevo can send `tag` as a JSON-stringified array, for example:
    // tag: "[\"tracking-id_step1\"]". Normalize it before lookup.
    if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== raw) {
          pushTag(parsed);
          return;
        }
      } catch {
        // Fall through to character cleanup below.
      }
    }

    const clean = cleanTrackingIdentifier(raw, 180);
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    output.push(clean);
  };

  pushTag(body.tag);
  pushTag(body["X-Mailin-Tag"]);
  pushTag(body["x-mailin-tag"]);
  pushTag(body["mailin-tag"]);
  pushTag(body.tags);

  return output.slice(0, 10);
}

function brevoMessageIdLookupCandidates(value: any): string[] {
  const raw = String(value || "")
    .trim()
    .replace(/[\r\n]/g, "")
    .slice(0, 300);

  const withoutBrackets = raw.replace(/[<>]/g, "").trim();
  const candidates = [
    withoutBrackets,
    withoutBrackets ? `<${withoutBrackets}>` : "",
    normalizeMessageIdHeader(raw),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
}

function normalizeBrevoWebhookUuid(value: any): string {
  const raw = String(value || "")
    .trim()
    .replace(/[<>]/g, "")
    .replace(/@smtp-relay\.sendinblue\.com$/i, "")
    .replace(/@smtp-relay\.brevo\.com$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);

  if (!raw || raw.length < 8) return "";
  return raw;
}

function brevoSmtpMessageIdFromWebhook(body: AnyRecord = {}): string {
  const explicitMessageId = normalizeMessageIdHeader(
    body.smtpMessageId ||
      body.smtp_message_id ||
      body.providerSmtpMessageId ||
      body.provider_smtp_message_id ||
      body.deliveredMessageId ||
      body.delivered_message_id ||
      "",
  );

  if (isBrevoSmtpMessageId(explicitMessageId)) return explicitMessageId;

  const uuid = normalizeBrevoWebhookUuid(
    body.uuid ||
      body.message_uuid ||
      body.messageUuid ||
      body["message-uuid"] ||
      body["message_uuid"] ||
      "",
  );

  return uuid ? `<${uuid}@smtp-relay.sendinblue.com>` : "";
}

function parseStepNumberFromTrackingTag(tag: string): number {
  const match = String(tag || "").toLowerCase().match(/_step(\d+)/);
  const step = match ? Number(match[1]) : 0;
  return Number.isFinite(step) && step > 0 ? step : 0;
}

function withBrevoSmtpMessageIdOnSentMessages(
  sentMessages: any,
  trackingTag: string,
  brevoSmtpMessageId: string,
  event: string,
  eventTime: any,
): any[] | null {
  if (!Array.isArray(sentMessages) || !brevoSmtpMessageId) return null;

  const stepNumber = parseStepNumberFromTrackingTag(trackingTag);
  let changed = false;

  const updated = sentMessages.map((message: any) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) return message;

    const messageTag = String(message.trackingTag || message.tracking_tag || "").trim();
    const messageStep = Number(message.step || 0);
    const followupNumber = Number(message.followupNumber || 0);
    const matchesTag = Boolean(trackingTag && messageTag && messageTag === trackingTag);
    const matchesStep = Boolean(stepNumber && (messageStep === stepNumber || followupNumber === Math.max(0, stepNumber - 1)));

    if (!matchesTag && !matchesStep) return message;

    const nextMessage = {
      ...message,
      providerSmtpMessageId: brevoSmtpMessageId,
      brevoSmtpMessageId,
      providerDeliveredMessageId: brevoSmtpMessageId,
      brevoDeliveredMessageId: brevoSmtpMessageId,
      smtpMessageId: brevoSmtpMessageId,
    };

    if (!isBrevoSmtpMessageId(nextMessage.messageId)) {
      nextMessage.messageId = brevoSmtpMessageId;
    }

    if (event === "delivered") {
      nextMessage.providerDeliveredAt = eventTime;
      nextMessage.deliveredAt = eventTime;
    } else if (event === "request" || event === "sent") {
      nextMessage.providerRequestedAt = eventTime;
    } else if (event === "opened" || event === "unique_opened") {
      nextMessage.providerOpenedAt = eventTime;
    } else if (event === "click" || event === "clicked") {
      nextMessage.providerClickedAt = eventTime;
    }

    changed = true;
    return nextMessage;
  });

  return changed ? updated : null;
}

async function handleBrevoWebhook(req: Request) {
  requireWebhookSecret(req, "BREVO_WEBHOOK_SECRET");
  const body = await readJson(req);

  const event = String(body.event || "");
  const emailLower = normalizeEmail(body.email || "");
  const rawMessageId = String(body["message-id"] || body.messageId || body.message_id || "").replace(/[<>]/g, "");
  const brevoSmtpMessageId = brevoSmtpMessageIdFromWebhook(body);
  const messageIdCandidates = Array.from(
    new Set([
      ...brevoMessageIdLookupCandidates(body["message-id"] || body.messageId || body.message_id || ""),
      ...brevoMessageIdLookupCandidates(brevoSmtpMessageId),
    ]),
  );
  const tags = normalizeBrevoWebhookTagList(body);
  let receivedTag = tags[0] || "";
  const timestamp = Number(body.ts_event || body.ts || Math.floor(Date.now() / 1000));
  const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

  trackflowEmailDebugLog("brevo_webhook_received", {
    event,
    emailLower,
    rawMessageId,
    brevoSmtpMessageId,
    brevoUuid: normalizeBrevoWebhookUuid(body.uuid || body.message_uuid || body.messageUuid || body["message-uuid"] || body["message_uuid"] || ""),
    receivedTag,
    tags,
    timestamp,
    eventTime,
    automationOpenEnabled: brevoOpenWebhookUpdatesAutomation(),
    providerPayloadKeys: Object.keys(body || {}).sort(),
  });

  const outreachRef = adminDb.collection("outreach_leads");
  let leadDoc: FirestoreQueryDocSnap | null = null;

  for (const tagCandidate of tags) {
    if (leadDoc) break;
    const originalTrackingId = cleanTrackingIdentifier(String(tagCandidate || "").split("_step")[0] || "", 120);
    if (!originalTrackingId) continue;

    const tagSnapshot = await outreachRef.where("trackingId", "==", originalTrackingId).limit(1).get();
    if (!tagSnapshot.empty) {
      leadDoc = tagSnapshot.docs[0];
      receivedTag = tagCandidate;
    }
  }

  for (const messageIdCandidate of messageIdCandidates) {
    if (leadDoc) break;
    const idSnapshot = await outreachRef.where("originalMessageId", "==", messageIdCandidate).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  for (const messageIdCandidate of messageIdCandidates) {
    if (leadDoc) break;
    const idSnapshot = await outreachRef.where("brevoMessageId", "==", messageIdCandidate).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  for (const messageIdCandidate of messageIdCandidates) {
    if (leadDoc) break;
    const idSnapshot = await outreachRef.where("brevoSmtpMessageId", "==", messageIdCandidate).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  for (const messageIdCandidate of messageIdCandidates) {
    if (leadDoc) break;
    const idSnapshot = await outreachRef.where("providerSmtpMessageId", "==", messageIdCandidate).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  for (const messageIdCandidate of messageIdCandidates) {
    if (leadDoc) break;
    const idSnapshot = await outreachRef.where("customMessageId", "==", messageIdCandidate).limit(1).get();
    if (!idSnapshot.empty) leadDoc = idSnapshot.docs[0];
  }

  if (!leadDoc) {
    trackflowEmailDebugLog("brevo_webhook_lead_not_found", {
      event,
      emailLower,
      rawMessageId,
      brevoSmtpMessageId,
      receivedTag,
      tags,
    });
    return json({ message: "Lead not found in database" }, 404);
  }

  trackflowEmailDebugLog("brevo_webhook_lead_matched", {
    event,
    leadId: leadDoc.id,
    emailLower,
    rawMessageId,
    brevoSmtpMessageId,
    receivedTag,
  });

  const leadData = leadDoc.data() as LeadData;
  const dbEmailLower = leadData.emailLower || normalizeEmail(leadData.email || "");
  if (dbEmailLower && emailLower && dbEmailLower !== emailLower) {
    return json({ message: "Lead identity mismatch" }, 403);
  }

  const docRef = outreachRef.doc(leadDoc.id);
  const updatePayload: any = {};
  const webhookStepNumber = parseStepNumberFromTrackingTag(receivedTag);
  const brevoWebhookUuid = normalizeBrevoWebhookUuid(body.uuid || body.message_uuid || body.messageUuid || body["message-uuid"] || body["message_uuid"] || "");

  if (brevoSmtpMessageId) {
    updatePayload.lastBrevoWebhookUuid = brevoWebhookUuid || admin.firestore.FieldValue.delete();
    updatePayload.lastBrevoSmtpMessageId = brevoSmtpMessageId;
    updatePayload.lastProviderSmtpMessageId = brevoSmtpMessageId;
    updatePayload.lastProviderMessageId = brevoSmtpMessageId;
    updatePayload.brevoProviderLastMessageId = brevoSmtpMessageId;

    const providerSentMessages = withBrevoSmtpMessageIdOnSentMessages(
      leadData.sent_messages,
      receivedTag,
      brevoSmtpMessageId,
      event,
      eventTime,
    );
    if (providerSentMessages) updatePayload.sent_messages = providerSentMessages;

    if (!webhookStepNumber || webhookStepNumber <= 1) {
      const oldOriginalMessageId = normalizeMessageIdHeader(leadData.originalMessageId);
      const oldBrevoMessageId = normalizeMessageIdHeader(leadData.brevoMessageId);
      if (oldOriginalMessageId && !isBrevoSmtpMessageId(oldOriginalMessageId)) {
        updatePayload.originMessageId = oldOriginalMessageId;
      }
      if (oldBrevoMessageId && !isBrevoSmtpMessageId(oldBrevoMessageId)) {
        updatePayload.brevoOriginMessageId = oldBrevoMessageId;
      }

      updatePayload.originalMessageId = brevoSmtpMessageId;
      updatePayload.brevoMessageId = brevoSmtpMessageId;
      updatePayload.providerSmtpMessageId = brevoSmtpMessageId;
      updatePayload.brevoSmtpMessageId = brevoSmtpMessageId;
      updatePayload.providerDeliveredMessageId = brevoSmtpMessageId;
      updatePayload.brevoDeliveredMessageId = brevoSmtpMessageId;
      updatePayload.smtpMessageId = brevoSmtpMessageId;
    } else {
      updatePayload.lastFollowupProviderSmtpMessageId = brevoSmtpMessageId;
      updatePayload.lastFollowupBrevoSmtpMessageId = brevoSmtpMessageId;
    }
  }

  let openRecorded = false;
  let clickRecorded = false;
  const trackingEntryBase = {
    time: eventTime,
    step_tag: receivedTag || "unknown",
  };
  const isBrevoProviderScheduled = leadData.brevoScheduled === true || String(leadData.scheduledProvider || "").toLowerCase() === "brevo";
  const providerScheduledAtMs = toMillis(leadData.scheduledAt || leadData.brevoScheduledAt);
  const eventMs = eventTime.toMillis();
  const isProviderScheduledRequestAtDelivery =
    isBrevoProviderScheduled &&
    event === "request" &&
    providerScheduledAtMs > 0 &&
    eventMs >= providerScheduledAtMs - BREVO_PROVIDER_REQUEST_DELIVERY_GRACE_MS;
  const isInitialDeliveryEvent =
    event === "delivered" ||
    event === "sent" ||
    isProviderScheduledRequestAtDelivery ||
    (event === "request" && !isBrevoProviderScheduled);

  if (isInitialDeliveryEvent) {
    if (!PROTECTED_STATUSES.has(String(leadData.status || ""))) {
      updatePayload.status = "sent";
    }

    if (!leadData.sentAt && (!receivedTag || receivedTag.endsWith("_step1"))) {
      updatePayload.sentAt = eventTime;
    }

    if (isBrevoProviderScheduled) {
      updatePayload.providerScheduleStatus = event === "delivered" ? "delivered" : "sent";
      updatePayload.brevoProviderLastEvent = event;
      updatePayload.brevoProviderLastEventAt = eventTime;
    }

    updatePayload.lastSentAt = eventTime;
    updatePayload.followUpReady = false;

    if (receivedTag.includes("_step")) {
      const stepNumber = parseInt(receivedTag.split("_step")[1], 10);
      if (Number.isFinite(stepNumber)) {
        const targetFollowupCount = Math.max(0, stepNumber - 1);
        if (targetFollowupCount > Number(leadData.follow_up_count || 0)) {
          updatePayload.follow_up_count = targetFollowupCount;
        }
      }
    }
  }

  if (event === "hard_bounce" || event === "soft_bounce") {
    updatePayload.status = "bounced";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "bounced";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.bouncedAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "bounced", { source: "brevo_webhook", event });
  }

  if (event === "spam") {
    updatePayload.status = "spam";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "spam";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.spamAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "spam", { source: "brevo_webhook", event });
  }

  if (event === "unsubscribed") {
    updatePayload.status = "unsubscribed";
    updatePayload.stopAutomation = true;
    updatePayload.nextFollowupStatus = "blocked";
    updatePayload.nextFollowupReason = "unsubscribed";
    updatePayload.nextFollowupAt = admin.firestore.FieldValue.delete();
    updatePayload.nextFollowupStep = admin.firestore.FieldValue.delete();
    updatePayload.unsubscribedAt = eventTime;
    await addSuppression(dbEmailLower || emailLower, "unsubscribed", { source: "brevo_webhook", event });
  }

  if (event === "opened") {
    const currentRequestTime = eventTime.toMillis();

    trackflowEmailDebugLog("brevo_open_webhook_received", {
      leadId: leadDoc.id,
      emailLower: dbEmailLower || emailLower,
      currentOpenCount: Number(leadData.open_count || 0),
      lastOpenedAt: leadData.lastOpenedAt || null,
      sentAt: leadData.sentAt || null,
      lastSentAt: (leadData as AnyRecord).lastSentAt || null,
      secondsAfterSent: secondsAfterLeadSentForOpenTracking(leadData, currentRequestTime),
      automationOpenEnabled: brevoOpenWebhookUpdatesAutomation(),
      rawMessageId,
      receivedTag,
    });

    if (brevoOpenWebhookUpdatesAutomation()) {
      const lastOpened = toMillis(leadData.lastOpenedAt);

      if (!isDuplicateEngagement(lastOpened, currentRequestTime, webhookOpenDedupeMs())) {
        openRecorded = true;
        if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
          updatePayload.status = "opened";
        }

        const engagementMinuteUtc = getEngagementMinuteOfDayUtc(currentRequestTime);
        trackflowEmailDebugLog("brevo_open_before_increment", {
          leadId: leadDoc.id,
          emailLower: dbEmailLower || emailLower,
          currentOpenCount: Number(leadData.open_count || 0),
          secondsAfterSent: secondsAfterLeadSentForOpenTracking(leadData, currentRequestTime),
          dedupeWindowMs: webhookOpenDedupeMs(),
        });

        updatePayload.open_count = admin.firestore.FieldValue.increment(1);
        if (!toMillis(leadData.firstOpenedAt)) updatePayload.firstOpenedAt = eventTime;
        updatePayload.lastOpenedAt = eventTime;
        updatePayload.lastEngagedAt = eventTime;
        updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
        updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
        updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
        updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
        await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "opened");
        if (envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false)) {
          updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
            event: "opened",
            ...trackingEntryBase,
            source: "brevo_webhook_open",
            ip: body.ip || "unknown",
            device: body["user-agent"] || "unknown",
          });
        }
      }
    }
  }

  if (event === "click") {
    const lastClicked = toMillis(leadData.lastClickedAt);
    const currentRequestTime = eventTime.toMillis();

    if (!isDuplicateEngagement(lastClicked, currentRequestTime, webhookClickDedupeMs())) {
      clickRecorded = true;

      if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
        updatePayload.status = "clicked";
      }

      const engagementMinuteUtc = getEngagementMinuteOfDayUtc(eventTime.toMillis());
      updatePayload.click_count = admin.firestore.FieldValue.increment(1);
      if (!toMillis(leadData.firstClickedAt)) updatePayload.firstClickedAt = eventTime;
      updatePayload.lastClickedAt = eventTime;
      updatePayload.lastEngagedAt = eventTime;
      updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
      updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
      updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
      updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
      await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "clicked");

      if (envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false)) {
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: "clicked",
          ...trackingEntryBase,
          link: body.url || "unknown link",
        });
      }
    }
  }

  if (Object.keys(updatePayload).length > 0) {
    await docRef.update(updatePayload);
  }

  const sheetRowNumber = Number(leadData.sheetRowNumber || 0);
  if (sheetRowNumber > 1 && ["opened", "click", "hard_bounce", "soft_bounce", "spam", "unsubscribed", "delivered"].includes(event)) {
    const sheetUpdates: AnyRecord = {};
    if (event === "opened" && openRecorded) {
      sheetUpdates.openCount = String(Number(leadData.open_count || 0) + 1);
    }
    if (event === "click" && clickRecorded) {
      sheetUpdates.clickCount = String(Number(leadData.click_count || 0) + 1);
    }
    if (event === "delivered") sheetUpdates.sendStatus = "Sent";
    if (event === "hard_bounce" || event === "soft_bounce") {
      sheetUpdates.sendStatus = "Bounced";
      sheetUpdates.replyStatus = "Bounced";
    }
    if (event === "spam") {
      sheetUpdates.sendStatus = "Spam";
      sheetUpdates.replyStatus = "Spam";
    }
    if (event === "unsubscribed") {
      sheetUpdates.sendStatus = "Unsubscribed";
      sheetUpdates.replyStatus = "Unsubscribed";
    }
    if (Object.keys(sheetUpdates).length) await patchSheetRowSafely(sheetRowNumber, sheetUpdates);
  }

  const reportToken = normalizeReportToken(leadData.reportToken || (leadData as AnyRecord).report_token || extractReportTokenFromUrl(leadData.reportUrl || (leadData as AnyRecord).report_url || ""));
  if (reportToken && (openRecorded || clickRecorded)) {
    await recordReportEmailEngagement(reportToken, openRecorded ? "opened" : "clicked", eventTime, {
      targetUrl: body.url || "",
      messageId: rawMessageId || "",
      trackingId: String(leadData.trackingId || ""),
      tag: receivedTag || "",
      leadId: leadDoc.id,
      emailLower: dbEmailLower || emailLower,
    });
  }

  const brevoOpenIgnoredForAutomation = event === "opened" && !brevoOpenWebhookUpdatesAutomation();
  const brevoEventMs = eventTime.toMillis();
  const brevoSecondsAfterSent = secondsAfterLeadSentForOpenTracking(leadData, brevoEventMs);

  await addEmailEvent(leadDoc.id, brevoOpenIgnoredForAutomation ? "brevo_open_ignored" : event || "unknown", {
    emailLower: dbEmailLower || emailLower,
    trackingTag: receivedTag || "",
    rawMessageId: rawMessageId || "",
    messageId: rawMessageId || "",
    providerSmtpMessageId: brevoSmtpMessageId || "",
    brevoSmtpMessageId: brevoSmtpMessageId || "",
    brevoUuid: brevoWebhookUuid || "",
    url: body.url || "",
    ip: body.ip || "",
    userAgent: body["user-agent"] || "",
    eventTime,
    reportToken,
    trackingId: String(leadData.trackingId || ""),
    source: "brevo_webhook",
    providerEvent: event || "unknown",
    openAutomationSource: brevoOpenWebhookUpdatesAutomation() ? "brevo_webhook_enabled" : "trackflow_self_hosted_pixel_primary",
    ignoredForAutomation: brevoOpenIgnoredForAutomation,
    ignoredReason: brevoOpenIgnoredForAutomation ? "brevo_open_webhook_is_diagnostic_only" : "",
    secondsAfterSent: brevoSecondsAfterSent,
    forceStore: brevoOpenIgnoredForAutomation && shouldForceStoreOpenDebug(leadData, brevoEventMs),
  });

  return json({ message: "Webhook processed" });
}


const TRACKING_PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

function trackingPixelResponse() {
  return new Response(TRACKING_PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRACKING_PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function cleanTrackingIdentifier(value: any, maxLength = 128): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, maxLength);
}

async function resolveLeadForSelfHostedTracking(req: Request): Promise<{
  url: URL;
  leadDoc: FirestoreDocSnap | null;
  leadData: LeadData | null;
  tag: string;
  emailLower: string;
  reportToken: string;
  messageId: string;
  trackingId: string;
}> {
  const url = new URL(req.url);
  const leadId = cleanTrackingIdentifier(url.searchParams.get("lid") || url.searchParams.get("leadId") || "");
  const tag = cleanTrackingIdentifier(url.searchParams.get("t") || url.searchParams.get("tag") || "", 140);
  const emailLower = normalizeEmail(url.searchParams.get("email") || "");
  const reportToken = normalizeReportToken(
    url.searchParams.get("rt") ||
      url.searchParams.get("reportToken") ||
      url.searchParams.get("report_token") ||
      extractReportTokenFromUrl(url.searchParams.get("url") || ""),
  );
  const messageId = String(
    url.searchParams.get("mid") ||
      url.searchParams.get("messageId") ||
      url.searchParams.get("message_id") ||
      url.searchParams.get("customMessageId") ||
      "",
  )
    .trim()
    .replace(/[\r\n]/g, "")
    .slice(0, 180);
  const trackingId = cleanTrackingIdentifier(url.searchParams.get("trackingId") || url.searchParams.get("tid") || (tag ? tag.split("_step")[0] : ""), 100);
  const outreachRef = adminDb.collection("outreach_leads");

  let leadDoc: FirestoreDocSnap | null = null;

  if (leadId) {
    const directSnap = await outreachRef.doc(leadId).get();
    if (directSnap.exists) leadDoc = directSnap;
  }

  if (!leadDoc && trackingId) {
    const trackingSnap = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();
    if (!trackingSnap.empty) leadDoc = trackingSnap.docs[0];
  }

  if (!leadDoc && reportToken) {
    for (const field of ["reportToken", "report_token", "token"]) {
      const reportSnap = await outreachRef.where(field, "==", reportToken).limit(10).get();
      if (reportSnap.empty) continue;

      const matchingEmailDoc = emailLower
        ? reportSnap.docs.find((docSnap: any) => {
            const data = docSnap.data() as LeadData;
            return (data.emailLower || normalizeEmail(data.email || "")) === emailLower;
          })
        : null;

      leadDoc = matchingEmailDoc || reportSnap.docs[0];
      if (leadDoc) break;
    }
  }

  const leadData = leadDoc?.exists ? (leadDoc.data() as LeadData) : null;
  return { url, leadDoc, leadData, tag, emailLower, reportToken, messageId, trackingId };
}

function shouldStoreReportEmailEngagementOnAuditReport(): boolean {
  const raw = String(process.env.TRACKFLOW_STORE_REPORT_EMAIL_ENGAGEMENT || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

async function recordReportEmailEngagement(
  reportToken: string,
  event: "opened" | "clicked",
  eventTime: any,
  meta: { targetUrl?: string; messageId?: string; trackingId?: string; tag?: string; leadId?: string; emailLower?: string } = {},
) {
  const token = normalizeReportToken(reportToken);
  if (!token || !shouldStoreReportEmailEngagementOnAuditReport()) return;

  const updatePayload: AnyRecord = {
    lastEmailEngagedAt: eventTime,
    lastEngagedAt: eventTime,
    engagementSource: "email",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (event === "opened") {
    updatePayload.emailOpenCount = admin.firestore.FieldValue.increment(1);
    updatePayload.lastEmailOpenedAt = eventTime;
    updatePayload.reportEmailStatus = "email_opened";
  }

  if (event === "clicked") {
    updatePayload.emailClickCount = admin.firestore.FieldValue.increment(1);
    updatePayload.lastEmailClickedAt = eventTime;
    updatePayload.lastEmailClickedUrl = meta.targetUrl || "";
    updatePayload.reportEmailStatus = "email_clicked";
  }

  if (meta.messageId) updatePayload.lastEmailMessageId = meta.messageId;
  if (meta.trackingId) updatePayload.lastEmailTrackingId = meta.trackingId;
  if (meta.tag) updatePayload.lastEmailTrackingTag = meta.tag;
  if (meta.leadId) updatePayload.lastEmailLeadId = meta.leadId;
  if (meta.emailLower) updatePayload.lastEmailRecipient = meta.emailLower;

  try {
    await adminDb.collection("audit_reports").doc(token).set(updatePayload, { merge: true });
  } catch (error) {
    console.warn("Report email engagement update failed:", error);
  }
}

async function recordSelfHostedEmailEngagement(
  leadDoc: FirestoreDocSnap,
  leadData: LeadData,
  event: "opened" | "clicked",
  tag: string,
  meta: { targetUrl?: string; req?: Request; reportToken?: string; messageId?: string; trackingId?: string; emailLower?: string } = {},
) {
  const docRef = leadDoc.ref || adminDb.collection("outreach_leads").doc(leadDoc.id);
  const eventTime = admin.firestore.Timestamp.now();
  const updatePayload: AnyRecord = {};
  const nowMs = eventTime.toMillis();
  const reportToken = normalizeReportToken(meta.reportToken || leadData.reportToken || (leadData as AnyRecord).report_token || extractReportTokenFromUrl(leadData.reportUrl || (leadData as AnyRecord).report_url || ""));
  const normalizedRecipientEmail = normalizeEmail(meta.emailLower || leadData.emailLower || leadData.email || "");
  const secondsAfterSent = secondsAfterLeadSentForOpenTracking(leadData, nowMs);
  const forceStoreOpenDebug = event === "opened" && shouldForceStoreOpenDebug(leadData, nowMs);
  const trackingEntryBase = {
    time: eventTime,
    step_tag: tag || "self_hosted",
    source: "trackflow_self_hosted_tracking",
    reportToken,
    messageId: meta.messageId || "",
    trackingId: meta.trackingId || leadData.trackingId || "",
  };

  if (event === "opened") {
    trackflowEmailDebugLog("self_hosted_open_received", {
      leadId: leadDoc.id,
      emailLower: normalizedRecipientEmail,
      currentOpenCount: Number(leadData.open_count || 0),
      status: leadData.status || "",
      sourceOrigin: leadData.sourceOrigin || "",
      sourceRole: leadData.sourceRole || "",
      sentAt: leadData.sentAt || null,
      lastSentAt: (leadData as AnyRecord).lastSentAt || null,
      createdAt: (leadData as AnyRecord).createdAt || null,
      secondsAfterSent,
      tag,
      reportToken,
      messageId: meta.messageId || "",
      trackingId: meta.trackingId || leadData.trackingId || "",
      internalTestRecipient: shouldIgnoreInternalTestOpen(normalizedRecipientEmail),
    });

    const providerImageProxyOpen = shouldIgnoreProviderImageProxyOpen(meta.req, secondsAfterSent);
    if (providerImageProxyOpen.ignore) {
      trackflowEmailDebugLog("self_hosted_open_ignored_provider_image_proxy", {
        leadId: leadDoc.id,
        emailLower: normalizedRecipientEmail,
        secondsAfterSent,
        currentOpenCount: Number(leadData.open_count || 0),
        ignoredReason: providerImageProxyOpen.reason,
        fastOpenWindowSeconds: providerImageProxyOpen.windowSeconds,
        userAgent: meta.req?.headers.get("user-agent") || "",
      });

      await addEmailEvent(leadDoc.id, "trackflow_open_ignored", {
        emailLower: normalizedRecipientEmail,
        trackingTag: tag || "",
        url: meta.targetUrl || "",
        source: "trackflow_self_hosted_tracking",
        eventTime,
        reportToken,
        messageId: meta.messageId || "",
        trackingId: meta.trackingId || leadData.trackingId || "",
        ignoredForAutomation: true,
        ignoredReason: providerImageProxyOpen.reason,
        fastOpenWindowSeconds: providerImageProxyOpen.windowSeconds,
        secondsAfterSent,
        userAgent: meta.req?.headers.get("user-agent") || "",
        forceStore: forceStoreOpenDebug,
      });
      return { recorded: false, reason: providerImageProxyOpen.reason };
    }

    if (shouldIgnoreInternalTestOpen(normalizedRecipientEmail)) {
      trackflowEmailDebugLog("self_hosted_open_ignored_internal_test", {
        leadId: leadDoc.id,
        emailLower: normalizedRecipientEmail,
        secondsAfterSent,
        currentOpenCount: Number(leadData.open_count || 0),
      });

      await addEmailEvent(leadDoc.id, "trackflow_open_ignored", {
        emailLower: normalizedRecipientEmail,
        trackingTag: tag || "",
        url: meta.targetUrl || "",
        source: "trackflow_self_hosted_tracking",
        eventTime,
        reportToken,
        messageId: meta.messageId || "",
        trackingId: meta.trackingId || leadData.trackingId || "",
        ignoredForAutomation: true,
        ignoredReason: "internal_test_recipient",
        secondsAfterSent,
        forceStore: forceStoreOpenDebug,
      });
      return { recorded: false, reason: "internal_test_recipient_open_ignored" };
    }

    const lastOpened = toMillis(leadData.lastOpenedAt);
    if (isDuplicateEngagement(lastOpened, nowMs, webhookOpenDedupeMs())) {
      trackflowEmailDebugLog("self_hosted_open_ignored_duplicate", {
        leadId: leadDoc.id,
        emailLower: normalizedRecipientEmail,
        currentOpenCount: Number(leadData.open_count || 0),
        lastOpenedAt: leadData.lastOpenedAt || null,
        secondsAfterSent,
        dedupeWindowMs: webhookOpenDedupeMs(),
      });
      return { recorded: false, reason: "duplicate_open" };
    }

    trackflowEmailDebugLog("self_hosted_open_before_increment", {
      leadId: leadDoc.id,
      emailLower: normalizedRecipientEmail,
      currentOpenCount: Number(leadData.open_count || 0),
      status: leadData.status || "",
      sourceOrigin: leadData.sourceOrigin || "",
      sourceRole: leadData.sourceRole || "",
      secondsAfterSent,
      dedupeWindowMs: webhookOpenDedupeMs(),
    });

    if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
      updatePayload.status = "opened";
    }

    const engagementMinuteUtc = getEngagementMinuteOfDayUtc(nowMs);
    updatePayload.open_count = admin.firestore.FieldValue.increment(1);
    if (!toMillis(leadData.firstOpenedAt)) updatePayload.firstOpenedAt = eventTime;
    updatePayload.lastOpenedAt = eventTime;
    updatePayload.lastEngagedAt = eventTime;
    updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
    updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
    updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
    updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
    await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "opened");

    if (envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false)) {
      updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
        event: "opened",
        ...trackingEntryBase,
      });
    }
  }

  if (event === "clicked") {
    const lastClicked = toMillis(leadData.lastClickedAt);
    if (isDuplicateEngagement(lastClicked, nowMs, webhookClickDedupeMs())) {
      return { recorded: false, reason: "duplicate_click" };
    }

    if (!["replied", "bounced", "spam", "unsubscribed", "cancelled"].includes(String(leadData.status || ""))) {
      updatePayload.status = "clicked";
    }

    const engagementMinuteUtc = getEngagementMinuteOfDayUtc(nowMs);
    updatePayload.click_count = admin.firestore.FieldValue.increment(1);
    if (!toMillis(leadData.firstClickedAt)) updatePayload.firstClickedAt = eventTime;
    updatePayload.lastClickedAt = eventTime;
    updatePayload.lastEngagedAt = eventTime;
    updatePayload.lastClickedUrl = meta.targetUrl || "";
    updatePayload.preferred_hour = Math.floor(engagementMinuteUtc / 60);
    updatePayload.preferred_engagement_minute_utc = engagementMinuteUtc;
    updatePayload.preferred_followup_minute_utc = shiftMinuteOfDay(engagementMinuteUtc, -FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES);
    updatePayload.preferred_followup_rule = "one_hour_before_last_open_or_click";
    await applyNextFollowupScheduleFromEngagement(updatePayload, leadData, eventTime, "clicked");

    if (envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false)) {
      updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
        event: "clicked",
        ...trackingEntryBase,
        link: meta.targetUrl || "unknown link",
      });
    }
  }

  if (Object.keys(updatePayload).length) {
    trackflowEmailDebugLog("self_hosted_engagement_before_firestore_update", {
      leadId: leadDoc.id,
      event,
      emailLower: normalizedRecipientEmail,
      updateKeys: Object.keys(updatePayload),
      currentOpenCount: Number(leadData.open_count || 0),
      currentClickCount: Number(leadData.click_count || 0),
      secondsAfterSent,
    });
    await docRef.update(updatePayload);
    trackflowEmailDebugLog("self_hosted_engagement_after_firestore_update", {
      leadId: leadDoc.id,
      event,
      emailLower: normalizedRecipientEmail,
      incrementedOpen: event === "opened",
      incrementedClick: event === "clicked",
    });
  }

  if (reportToken) {
    await recordReportEmailEngagement(reportToken, event, eventTime, {
      targetUrl: meta.targetUrl || "",
      messageId: meta.messageId || "",
      trackingId: meta.trackingId || String(leadData.trackingId || ""),
      tag,
      leadId: leadDoc.id,
      emailLower: meta.emailLower || leadData.emailLower || normalizeEmail(leadData.email || ""),
    });
  }

  const sheetRowNumber = Number(leadData.sheetRowNumber || 0);
  if (sheetRowNumber > 1) {
    const sheetUpdates: AnyRecord = {};
    if (event === "opened") sheetUpdates.openCount = String(Number(leadData.open_count || 0) + 1);
    if (event === "clicked") sheetUpdates.clickCount = String(Number(leadData.click_count || 0) + 1);
    if (Object.keys(sheetUpdates).length) await patchSheetRowSafely(sheetRowNumber, sheetUpdates);
  }

  await addEmailEvent(leadDoc.id, event, {
    emailLower: normalizedRecipientEmail,
    trackingTag: tag || "",
    url: meta.targetUrl || "",
    source: "trackflow_self_hosted_tracking",
    eventTime,
    reportToken,
    messageId: meta.messageId || "",
    trackingId: meta.trackingId || leadData.trackingId || "",
    secondsAfterSent,
    forceStore: forceStoreOpenDebug,
  });

  return { recorded: true, reason: event };
}

async function handleSelfHostedEmailOpen(req: Request) {
  try {
    const { leadDoc, leadData, tag, emailLower, reportToken, messageId, trackingId } = await resolveLeadForSelfHostedTracking(req);

    trackflowEmailDebugLog("self_hosted_open_resolved", {
      ...trackflowRequestDebugMeta(req),
      leadFound: Boolean(leadDoc && leadData),
      leadId: leadDoc?.id || "",
      emailLower,
      dbEmailLower: leadData?.emailLower || normalizeEmail(leadData?.email || ""),
      tag,
      reportToken,
      messageId,
      trackingId,
      currentOpenCount: Number(leadData?.open_count || 0),
      status: leadData?.status || "",
      sourceOrigin: leadData?.sourceOrigin || "",
      sourceRole: leadData?.sourceRole || "",
      secondsAfterSent: leadData ? secondsAfterLeadSentForOpenTracking(leadData) : null,
    });

    if (leadDoc && leadData) {
      const dbEmailLower = leadData.emailLower || normalizeEmail(leadData.email || "");
      if (!emailLower || !dbEmailLower || emailLower === dbEmailLower) {
        await recordSelfHostedEmailEngagement(leadDoc, leadData, "opened", tag, {
          req,
          reportToken,
          messageId,
          trackingId,
          emailLower,
        });
      }
    } else if (reportToken) {
      await recordReportEmailEngagement(reportToken, "opened", admin.firestore.Timestamp.now(), {
        messageId,
        trackingId,
        tag,
        emailLower,
      });
      await addEmailEvent("", "opened", {
        emailLower,
        trackingTag: tag || "",
        source: "trackflow_self_hosted_tracking_report_only",
        eventTime: admin.firestore.Timestamp.now(),
        reportToken,
        messageId,
        trackingId,
      });
    }
  } catch (error) {
    console.warn("Self-hosted email open tracking failed:", error);
  }

  return trackingPixelResponse();
}

async function handleSelfHostedEmailClick(req: Request) {
  const { url, leadDoc, leadData, tag, emailLower, reportToken, messageId, trackingId } = await resolveLeadForSelfHostedTracking(req);
  const rawTarget = String(url.searchParams.get("url") || "").trim();
  const targetUrl = sanitizeOptionalUrl(rawTarget) || appBaseUrl();

  try {
    if (leadDoc && leadData) {
      const dbEmailLower = leadData.emailLower || normalizeEmail(leadData.email || "");
      if (!emailLower || !dbEmailLower || emailLower === dbEmailLower) {
        await recordSelfHostedEmailEngagement(leadDoc, leadData, "clicked", tag, {
          targetUrl,
          req,
          reportToken,
          messageId,
          trackingId,
          emailLower,
        });
      }
    } else if (reportToken) {
      await recordReportEmailEngagement(reportToken, "clicked", admin.firestore.Timestamp.now(), {
        targetUrl,
        messageId,
        trackingId,
        tag,
        emailLower,
      });
      await addEmailEvent("", "clicked", {
        emailLower,
        trackingTag: tag || "",
        url: targetUrl,
        source: "trackflow_self_hosted_tracking_report_only",
        eventTime: admin.firestore.Timestamp.now(),
        reportToken,
        messageId,
        trackingId,
      });
    }
  } catch (error) {
    console.warn("Self-hosted email click tracking failed:", error);
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}

/** POST /api/trackflow/webhooks/reply */
async function handleReplyWebhook(req: Request) {
  requireWebhookSecret(req, "REPLY_WEBHOOK_SECRET");
  const body = await readJson(req);
  const clientEmail = normalizeEmail(body.email || body.sender || body.from || "");

  if (!isValidEmail(clientEmail)) throw new ApiError("No valid email provided", 400);

  const snapshot = await adminDb.collection("outreach_leads").where("emailLower", "==", clientEmail).get();

  if (snapshot.empty) {
    const legacySnapshot = await adminDb.collection("outreach_leads").where("email", "==", clientEmail).get();
    if (legacySnapshot.empty) return json({ success: false, message: "Lead not found" });
    await markRepliesBatch(legacySnapshot.docs, clientEmail);
  } else {
    await markRepliesBatch(snapshot.docs, clientEmail);
  }

  await addSuppression(clientEmail, "replied", { source: "reply_webhook" });

  return json({ success: true, message: `Automation stopped for ${clientEmail}` });
}

async function markRepliesBatch(docs: FirestoreQueryDocSnap[], clientEmail: string) {
  const batch = adminDb.batch();

  docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      emailLower: clientEmail,
      status: "replied",
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "reply_detected",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
    });
  });

  await batch.commit();

  await Promise.all(
    docs.map((docSnap) =>
      addEmailEvent(docSnap.id, "replied", {
        emailLower: clientEmail,
        source: "reply_webhook",
        reportToken: normalizeReportToken((docSnap.data() || {}).reportToken || (docSnap.data() || {}).report_token || extractReportTokenFromUrl((docSnap.data() || {}).reportUrl || (docSnap.data() || {}).report_url || "")),
      })
    )
  );
}

/** GET /api/trackflow/unsubscribe?email=...&token=... */
async function handleUnsubscribeGet(req: Request) {
  const url = new URL(req.url);
  const emailLower = normalizeEmail(url.searchParams.get("email") || "");
  const token = String(url.searchParams.get("token") || "");

  if (!isValidEmail(emailLower)) {
    return htmlResponse("<h2>Invalid unsubscribe request.</h2>", 400);
  }

  const expected = unsubscribeToken(emailLower);
  if (!safeEqual(token, expected)) {
    return htmlResponse("<h2>Invalid or expired unsubscribe link.</h2>", 403);
  }

  await unsubscribeEmail(emailLower, "unsubscribe_link");

  return htmlResponse(`
    <html>
      <body style="font-family:Arial,sans-serif;max-width:640px;margin:80px auto;padding:24px;line-height:1.6;color:#111;">
        <h1>You have been unsubscribed.</h1>
        <p>${emailLower} will no longer receive outreach or follow-up emails from TrackFlowPro.</p>
        <p style="color:#777;font-size:13px;">If this was a mistake, contact us at shahjalal@trackflowpro.com.</p>
      </body>
    </html>
  `);
}

/** POST /api/trackflow/unsubscribe */
async function handleUnsubscribePost(req: Request) {
  const body = await readJson(req);
  const emailLower = normalizeEmail(body.email || "");
  const token = String(body.token || "");

  if (!isValidEmail(emailLower)) throw new ApiError("Invalid email", 400);
  if (!safeEqual(token, unsubscribeToken(emailLower))) throw new ApiError("Invalid unsubscribe token", 403);

  await unsubscribeEmail(emailLower, "unsubscribe_post");
  return json({ success: true });
}

async function unsubscribeEmail(emailLower: string, source: string) {
  await addSuppression(emailLower, "unsubscribed", { source });

  const snap = await adminDb.collection("outreach_leads").where("emailLower", "==", emailLower).get();
  const batch = adminDb.batch();

  snap.docs.forEach((docSnap: any) => {
    batch.update(docSnap.ref, {
      status: "unsubscribed",
      stopAutomation: true,
      unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextFollowupStatus: "blocked",
      nextFollowupReason: "unsubscribed",
      nextFollowupAt: admin.firestore.FieldValue.delete(),
      nextFollowupStep: admin.firestore.FieldValue.delete(),
      automationLock: admin.firestore.FieldValue.delete(),
    });
  });

  if (!snap.empty) await batch.commit();

  await Promise.all(
    snap.docs.map((docSnap: any) =>
      addEmailEvent(docSnap.id, "unsubscribed", {
        emailLower,
        source,
        reportToken: normalizeReportToken((docSnap.data() || {}).reportToken || (docSnap.data() || {}).report_token || extractReportTokenFromUrl((docSnap.data() || {}).reportUrl || (docSnap.data() || {}).report_url || "")),
      })
    )
  );
}


// ============================================================
// Google Sheet Lead Staging Bridge (via /api/trackflow/sheets/leads)
// ============================================================
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

/**
 * TrackFlowPro Sheet Bridge API
 *
 * Purpose:
 * 1) POST  : Python/audit dashboard can add/update only verified hot leads.
 * 2) GET   : Email automation dashboard can read Sheet leads.
 * 3) PATCH : Email automation/tracking can update status back to Sheet.
 *
 * Important:
 * - This route is intentionally non-destructive. When a website already exists,
 *   audit/contact fields are refreshed, but send/tracking/manual status fields
 *   are preserved unless the incoming payload explicitly provides them.
 * - Website URL is the primary dedupe key. Final Email is a fallback key.
 */

const HEADERS = [
  'Export Date',
  'Business Name',
  'Website URL',
  'Final Email',
  'Email Source',
  'Social Platform',
  'Social Link',
  'WhatsApp',
  'ChatGPT Prompt',

  // Lead qualification / audit summary
  'Lead Status',
  'Approval Status',
  'Send Status',
  'Service Type',
  'Audit Score',
  'Lead Label',
  'Main Issue',
  'Proof Points',
  'Report Token',
  'Report URL',
  'Email Preview Image URL',
  'Email Preview Image B2 Key',
  'Email Preview Image MIME',
  'Email Preview Image Size',
  'PDF File ID',
  'PDF View URL',
  'PDF Download URL',
  'PDF Expires At',
  'Report Page Viewed',
  'PDF Downloaded',
  'CTA Clicked',
  'Last Report Viewed At',
  'Last PDF Downloaded At',
  'Last CTA Clicked At',
  'Email Subject',
  'Email Body',
  'Decision Maker',
  'Decision Maker Title',
  'Contact Quality',

  // Email automation / Firestore sync
  'Tracking ID',
  'Firestore Lead ID',
  'Open Count',
  'Click Count',
  'Reply Status',
  'Last Synced',
  'Archive Status',
  'Notes',
  'Sender ID',
  'Attempt Count',

  // Sheet queue locking / idempotency
  // বাংলা ব্যাখ্যা: Cron একসাথে চললেও একই row যেন দুইবার send না হয়, তাই Sheet-এর মধ্যেই lock রাখা হয়।
  'Queue Lock ID',
  'Queue Locked At',
  'Queue Attempt ID',
  'Source Type',
  'Outreach Channel',
  'Lead Source',
  'Audit Source',
  'Source Context',
  'Email Outreach Allowed',
  'LinkedIn Outreach Allowed',

  // Gmail Workspace manual outreach pipeline (Sheet-only; no Firestore write).
  'Gmail Outreach Stage',
  'Gmail Last Sent At',
  'Gmail Next Follow-up Due',
  'Gmail Last Action',
  'Gmail Last Action At',
  'Gmail Initial Sent At',
  'Gmail Follow-up 1 Sent At',
  'Gmail Follow-up 2 Sent At',
  'Gmail Follow-up 3 Sent At',
  'Gmail Follow-up 4 Sent At',
  'Gmail Initial Subject',
  'Gmail Initial Message',
  'Gmail Follow-up 1 Subject',
  'Gmail Follow-up 1 Message',
  'Gmail Follow-up 2 Subject',
  'Gmail Follow-up 2 Message',
  'Gmail Follow-up 3 Subject',
  'Gmail Follow-up 3 Message',
  'Gmail Follow-up 4 Subject',
  'Gmail Follow-up 4 Message',
  'Gmail Outreach Notes',
  'Gmail Closed Reason',
] as const;

type HeaderName = (typeof HEADERS)[number];
type AnyRecord = Record<string, any>;

type BestSocial = {
  platform: string;
  url: string;
};

const MAX_CELL_CHARS = 45000;

const CONTROL_HEADERS = new Set<HeaderName>([
  'Approval Status',
  'Send Status',
  'Email Preview Image URL',
  'Email Preview Image B2 Key',
  'Email Preview Image MIME',
  'Email Preview Image Size',
  'Tracking ID',
  'Firestore Lead ID',
  'Open Count',
  'Click Count',
  'Report Page Viewed',
  'PDF Downloaded',
  'CTA Clicked',
  'Last Report Viewed At',
  'Last PDF Downloaded At',
  'Last CTA Clicked At',
  'Reply Status',
  'Archive Status',
  'Notes',
  'Sender ID',
  'Attempt Count',
  'Queue Lock ID',
  'Queue Locked At',
  'Queue Attempt ID',

  // Preserve Gmail Workspace manual outreach status during report/audit refreshes.
  'Gmail Outreach Stage',
  'Gmail Last Sent At',
  'Gmail Next Follow-up Due',
  'Gmail Last Action',
  'Gmail Last Action At',
  'Gmail Initial Sent At',
  'Gmail Follow-up 1 Sent At',
  'Gmail Follow-up 2 Sent At',
  'Gmail Follow-up 3 Sent At',
  'Gmail Follow-up 4 Sent At',
  'Gmail Initial Subject',
  'Gmail Initial Message',
  'Gmail Follow-up 1 Subject',
  'Gmail Follow-up 1 Message',
  'Gmail Follow-up 2 Subject',
  'Gmail Follow-up 2 Message',
  'Gmail Follow-up 3 Subject',
  'Gmail Follow-up 3 Message',
  'Gmail Follow-up 4 Subject',
  'Gmail Follow-up 4 Message',
  'Gmail Outreach Notes',
  'Gmail Closed Reason',
]);

const UPDATE_KEY_MAP: Record<string, HeaderName> = {
  exportDate: 'Export Date',
  businessName: 'Business Name',
  companyName: 'Business Name',
  websiteUrl: 'Website URL',
  website: 'Website URL',
  finalEmail: 'Final Email',
  email: 'Final Email',
  emailSource: 'Email Source',
  sourceType: 'Source Type',
  source_type: 'Source Type',
  outreachChannel: 'Outreach Channel',
  outreach_channel: 'Outreach Channel',
  leadSource: 'Lead Source',
  lead_source: 'Lead Source',
  auditSource: 'Audit Source',
  audit_source: 'Audit Source',
  sourceContext: 'Source Context',
  source_context: 'Source Context',
  emailOutreachAllowed: 'Email Outreach Allowed',
  email_outreach_allowed: 'Email Outreach Allowed',
  linkedinOutreachAllowed: 'LinkedIn Outreach Allowed',
  linkedin_outreach_allowed: 'LinkedIn Outreach Allowed',

  gmailOutreachStage: 'Gmail Outreach Stage',
  gmail_outreach_stage: 'Gmail Outreach Stage',
  gmailStage: 'Gmail Outreach Stage',
  gmail_stage: 'Gmail Outreach Stage',
  gmailLastSentAt: 'Gmail Last Sent At',
  gmail_last_sent_at: 'Gmail Last Sent At',
  gmailNextFollowupDue: 'Gmail Next Follow-up Due',
  gmail_next_followup_due: 'Gmail Next Follow-up Due',
  gmailLastAction: 'Gmail Last Action',
  gmail_last_action: 'Gmail Last Action',
  gmailLastActionAt: 'Gmail Last Action At',
  gmail_last_action_at: 'Gmail Last Action At',
  gmailInitialSentAt: 'Gmail Initial Sent At',
  gmail_initial_sent_at: 'Gmail Initial Sent At',
  gmailFollowup1SentAt: 'Gmail Follow-up 1 Sent At',
  gmail_followup_1_sent_at: 'Gmail Follow-up 1 Sent At',
  gmailFollowup2SentAt: 'Gmail Follow-up 2 Sent At',
  gmail_followup_2_sent_at: 'Gmail Follow-up 2 Sent At',
  gmailFollowup3SentAt: 'Gmail Follow-up 3 Sent At',
  gmail_followup_3_sent_at: 'Gmail Follow-up 3 Sent At',
  gmailFollowup4SentAt: 'Gmail Follow-up 4 Sent At',
  gmail_followup_4_sent_at: 'Gmail Follow-up 4 Sent At',
  gmailInitialSubject: 'Gmail Initial Subject',
  gmail_initial_subject: 'Gmail Initial Subject',
  gmailInitialMessage: 'Gmail Initial Message',
  gmail_initial_message: 'Gmail Initial Message',
  gmailFollowup1Subject: 'Gmail Follow-up 1 Subject',
  gmail_followup_1_subject: 'Gmail Follow-up 1 Subject',
  gmailFollowup1Message: 'Gmail Follow-up 1 Message',
  gmail_followup_1_message: 'Gmail Follow-up 1 Message',
  gmailFollowup2Subject: 'Gmail Follow-up 2 Subject',
  gmail_followup_2_subject: 'Gmail Follow-up 2 Subject',
  gmailFollowup2Message: 'Gmail Follow-up 2 Message',
  gmail_followup_2_message: 'Gmail Follow-up 2 Message',
  gmailFollowup3Subject: 'Gmail Follow-up 3 Subject',
  gmail_followup_3_subject: 'Gmail Follow-up 3 Subject',
  gmailFollowup3Message: 'Gmail Follow-up 3 Message',
  gmail_followup_3_message: 'Gmail Follow-up 3 Message',
  gmailFollowup4Subject: 'Gmail Follow-up 4 Subject',
  gmail_followup_4_subject: 'Gmail Follow-up 4 Subject',
  gmailFollowup4Message: 'Gmail Follow-up 4 Message',
  gmail_followup_4_message: 'Gmail Follow-up 4 Message',
  gmailOutreachNotes: 'Gmail Outreach Notes',
  gmail_outreach_notes: 'Gmail Outreach Notes',
  gmailClosedReason: 'Gmail Closed Reason',
  gmail_closed_reason: 'Gmail Closed Reason',
  socialPlatform: 'Social Platform',
  socialLink: 'Social Link',
  whatsapp: 'WhatsApp',
  chatgptPrompt: 'ChatGPT Prompt',
  leadStatus: 'Lead Status',
  approvalStatus: 'Approval Status',
  approved: 'Approval Status',
  sendStatus: 'Send Status',
  serviceType: 'Service Type',
  service: 'Service Type',
  auditScore: 'Audit Score',
  leadLabel: 'Lead Label',
  mainIssue: 'Main Issue',
  proofPoints: 'Proof Points',
  reportToken: 'Report Token',
  report_token: 'Report Token',
  pdfFileId: 'PDF File ID',
  pdf_file_id: 'PDF File ID',
  pdfViewUrl: 'PDF View URL',
  pdf_view_url: 'PDF View URL',
  pdfDownloadUrl: 'PDF Download URL',
  pdf_download_url: 'PDF Download URL',
  pdfExpiresAt: 'PDF Expires At',
  pdf_expires_at: 'PDF Expires At',
  reportPageViewed: 'Report Page Viewed',
  report_page_viewed: 'Report Page Viewed',
  pdfDownloaded: 'PDF Downloaded',
  pdf_downloaded: 'PDF Downloaded',
  ctaClicked: 'CTA Clicked',
  cta_clicked: 'CTA Clicked',
  lastReportViewedAt: 'Last Report Viewed At',
  last_report_viewed_at: 'Last Report Viewed At',
  lastPdfDownloadedAt: 'Last PDF Downloaded At',
  last_pdf_downloaded_at: 'Last PDF Downloaded At',
  lastCtaClickedAt: 'Last CTA Clicked At',
  last_cta_clicked_at: 'Last CTA Clicked At',
  reportUrl: 'Report URL',
  reportURL: 'Report URL',
  emailSubject: 'Email Subject',
  subject: 'Email Subject',
  emailBody: 'Email Body',
  message: 'Email Body',
  decisionMaker: 'Decision Maker',
  decisionMakerTitle: 'Decision Maker Title',
  contactQuality: 'Contact Quality',
  trackingId: 'Tracking ID',
  firestoreLeadId: 'Firestore Lead ID',
  leadId: 'Firestore Lead ID',
  openCount: 'Open Count',
  clickCount: 'Click Count',
  replyStatus: 'Reply Status',
  lastSynced: 'Last Synced',
  archiveStatus: 'Archive Status',
  notes: 'Notes',
  senderId: 'Sender ID',
  senderID: 'Sender ID',
  sender_id: 'Sender ID',
  attemptCount: 'Attempt Count',
  attempts: 'Attempt Count',
  queueLockId: 'Queue Lock ID',
  queueLockedAt: 'Queue Locked At',
  queueAttemptId: 'Queue Attempt ID',
};

const COLUMN_WIDTHS: Partial<Record<HeaderName, number>> = {
  'Export Date': 130,
  'Business Name': 210,
  'Website URL': 260,
  'Final Email': 240,
  'Email Source': 170,
  'Social Platform': 135,
  'Social Link': 250,
  WhatsApp: 185,
  'ChatGPT Prompt': 380,
  'Lead Status': 135,
  'Approval Status': 145,
  'Send Status': 125,
  'Service Type': 160,
  'Audit Score': 110,
  'Lead Label': 130,
  'Main Issue': 300,
  'Proof Points': 360,
  'Report Token': 180,
  'Report URL': 280,
  'Email Preview Image URL': 280,
  'Email Preview Image B2 Key': 220,
  'Email Preview Image MIME': 140,
  'Email Preview Image Size': 140,
  'PDF File ID': 210,
  'PDF View URL': 280,
  'PDF Download URL': 280,
  'PDF Expires At': 150,
  'Report Page Viewed': 145,
  'PDF Downloaded': 135,
  'CTA Clicked': 125,
  'Last Report Viewed At': 175,
  'Last PDF Downloaded At': 185,
  'Last CTA Clicked At': 175,
  'Email Subject': 260,
  'Email Body': 420,
  'Decision Maker': 190,
  'Decision Maker Title': 190,
  'Contact Quality': 145,
  'Tracking ID': 210,
  'Firestore Lead ID': 210,
  'Open Count': 110,
  'Click Count': 110,
  'Reply Status': 135,
  'Last Synced': 170,
  'Archive Status': 135,
  Notes: 280,
  'Queue Lock ID': 190,
  'Queue Locked At': 190,
  'Queue Attempt ID': 190,
};

function clean(value: any, fallback = ''): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => clean(item)).join(', ');
  return String(value).trim();
}

function cleanCell(value: any, fallback = ''): string {
  const text = clean(value, fallback).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!text) return fallback;
  return text.length > MAX_CELL_CHARS ? `${text.slice(0, MAX_CELL_CHARS - 20)}\n...[trimmed]` : text;
}

function isValidValue(value: any): boolean {
  const text = clean(value).toLowerCase();
  return Boolean(
    text &&
      text !== 'not found' &&
      text !== 'n/a' &&
      text !== 'na' &&
      text !== 'none' &&
      text !== 'unknown' &&
      text !== 'পাওয়া যায়নি',
  );
}

function firstValid(items?: any[]): string {
  if (!Array.isArray(items)) return '';
  const found = items.find((item) => isValidValue(item));
  return clean(found, '');
}

function firstValidValue(...items: any[]): string {
  for (const item of items) {
    if (isValidValue(item)) return clean(item);
  }
  return '';
}

function normalizeUrlForSheet(value: any): string {
  const raw = clean(value, '');
  if (!raw) return '';

  let url = raw;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    const cleanPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.protocol}//${parsed.hostname.replace(/^www\./i, '').toLowerCase()}${cleanPath}`;
  } catch {
    return raw.replace(/\/$/, '').toLowerCase();
  }
}

// Sheet code uses the top-level normalizeEmail(email: string) helper defined earlier.

function normalizeServiceType(value: any): string {
  const text = clean(value).toLowerCase();

  if (text.includes('signature')) return 'Email Signature';
  if (
    text.includes('server') ||
    text.includes('sst') ||
    text.includes('server-side') ||
    text.includes('server side')
  ) {
    return 'Server Side Tracking';
  }

  if (
    text.includes('google') ||
    text.includes('ads') ||
    text.includes('ga4') ||
    text.includes('conversion') ||
    text.includes('tracking')
  ) {
    return 'Google Ads';
  }

  return 'Google Ads';
}

function nowDhaka(): string {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function todayDhaka(): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function columnLetter(indexOneBased: number): string {
  let index = indexOneBased;
  let letter = '';
  while (index > 0) {
    const mod = (index - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    index = Math.floor((index - mod) / 26);
  }
  return letter;
}

function lastColumnLetter(): string {
  return columnLetter(HEADERS.length);
}

function getManualUpdate(audit?: AnyRecord, lead?: AnyRecord): AnyRecord {
  return (
    audit?.manual_decision_maker_update ||
    audit?.manual_contact_update ||
    audit?.manual_update ||
    lead?.manual_decision_maker_update ||
    lead?.manualContact ||
    lead?.manual_contact_update ||
    {}
  );
}

function getBusinessName(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.business_name ||
      manual?.company_name ||
      audit?.company_name ||
      audit?.business_name ||
      audit?.email_intelligence?.company_name ||
      audit?.nextjs_payload?.lead?.['Company Name'] ||
      lead?.businessName ||
      lead?.companyName ||
      lead?.title ||
      audit?.domain,
    'N/A',
  );
}

function getWebsiteUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(lead?.websiteUrl || lead?.website || lead?.link || audit?.homepage_url || audit?.domain, 'N/A');
}

function getMainProblem(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.mainIssue ||
      audit?.dashboard_verdict?.main_opportunity ||
      audit?.top_opportunity?.problem ||
      audit?.client_dashboard_message?.headline ||
      audit?.client_dashboard_message?.problem_summary ||
      audit?.email_intelligence?.problem_title ||
      audit?.conversion_qa?.summary,
    'a website tracking or lead measurement item may be worth checking',
  );
}

function getProofPoints(audit?: AnyRecord, lead?: AnyRecord): string[] {
  const proofPoints =
    lead?.proofPoints ||
    audit?.proof_points ||
    audit?.top_opportunity?.proof_points ||
    audit?.client_dashboard_message?.proof_points ||
    audit?.email_intelligence?.evidence_points ||
    audit?.advanced_tracking?.issues ||
    [];

  if (Array.isArray(proofPoints)) {
    return proofPoints.filter(isValidValue).map((item) => clean(item)).slice(0, 5);
  }

  const text = clean(proofPoints);
  return text ? [text] : [];
}

function getFinalEmail(audit?: AnyRecord, lead?: AnyRecord): { email: string; source: string } {
  const manual = getManualUpdate(audit, lead);

  // 1) Manual email always wins because you verified/edited it before export.
  const manualEmail = clean(
    manual?.email ||
      manual?.verified_email ||
      manual?.web_email ||
      lead?.manualEmail ||
      lead?.finalEmail ||
      lead?.email,
  );

  if (isValidValue(manualEmail)) {
    return { email: manualEmail, source: clean(lead?.emailSource || 'Manual / verified by user') };
  }

  // 2) Public website/person email. Do not use guessed email by default.
  const personEmail = clean(audit?.person1?.web_email);
  if (isValidValue(personEmail)) {
    return { email: personEmail, source: 'Person / website email' };
  }

  const websiteEmail = firstValid(audit?.contact?.web_emails);
  if (websiteEmail) {
    return { email: websiteEmail, source: 'Website email' };
  }

  return { email: '', source: 'No reliable email found' };
}

function getBestSocial(audit?: AnyRecord, lead?: AnyRecord): BestSocial {
  const manual = getManualUpdate(audit, lead);
  const social = audit?.social_links || {};

  const candidates: BestSocial[] = [
    { platform: 'LinkedIn', url: manual?.linkedin || manual?.personal_linkedin || audit?.person1?.linkedin || social?.linkedin || lead?.linkedin },
    { platform: 'Facebook', url: manual?.facebook || social?.facebook || lead?.facebook },
    { platform: 'Instagram', url: manual?.instagram || social?.instagram || lead?.instagram },
    { platform: 'Twitter/X', url: manual?.twitter_x || manual?.twitter || social?.twitter_x || social?.twitter || lead?.twitter_x || lead?.twitter },
    { platform: 'YouTube', url: manual?.youtube || social?.youtube || lead?.youtube },
    { platform: 'TikTok', url: manual?.tiktok || social?.tiktok || lead?.tiktok },
    { platform: 'Pinterest', url: manual?.pinterest || social?.pinterest || lead?.pinterest },
  ];

  const best = candidates.find((item) => isValidValue(item.url));
  if (best) return { platform: best.platform, url: clean(best.url) };

  const fallback = Object.entries(social).find(([, value]) => isValidValue(value));
  if (fallback) return { platform: clean(fallback[0], 'Social'), url: clean(fallback[1]) };

  return { platform: '', url: '' };
}

function getWhatsApp(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(manual?.whatsapp || lead?.whatsapp || firstValid(audit?.contact?.whatsapp), '');
}

function getAuditScore(audit?: AnyRecord, lead?: AnyRecord): string {
  const score =
    lead?.auditScore ??
    audit?.opportunity_score?.overall_score ??
    audit?.lead_score?.score ??
    audit?.advanced_tracking?.confidence_score ??
    audit?.visitor_potential?.score ??
    '';

  return cleanCell(score);
}

function getLeadLabel(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.leadLabel ||
      audit?.opportunity_score?.label ||
      audit?.lead_score?.label ||
      audit?.dashboard_verdict?.label ||
      audit?.email_intelligence?.priority ||
      '',
  );
}

function getLeadStatus(audit?: AnyRecord, lead?: AnyRecord, existing?: AnyRecord): string {
  const explicit = firstValidValue(lead?.leadStatus, lead?.status, existing?.['Lead Status']);
  if (explicit) return explicit;

  const label = getLeadLabel(audit, lead).toLowerCase();
  if (label.includes('hot')) return 'Hot Lead';
  if (label.includes('good') || label.includes('warm')) return 'Good Lead';
  if (label.includes('low')) return 'Low Priority';

  return 'New';
}

function getServiceType(audit?: AnyRecord, lead?: AnyRecord): string {
  return normalizeServiceType(
    lead?.serviceType ||
      lead?.service ||
      audit?.outreach_playbook?.service_offer ||
      audit?.client_dashboard_message?.service_angle ||
      audit?.email_intelligence?.main_angle ||
      audit?.top_opportunity?.outreach_angle ||
      getMainProblem(audit, lead),
  );
}

function getReportUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  const candidates = [
    manual?.report_url,
    manual?.reportUrl,
    lead?.reportUrl,
    lead?.report_url,
    audit?.report_url,
    audit?.reportUrl,
    audit?.exports?.report_url,
    audit?.exports?.reportUrl,
    audit?.nextjs_payload?.report_url,
    audit?.nextjs_payload?.reportUrl,
  ];
  for (const candidate of candidates) {
    const safe = sanitizePublicReportUrl(candidate);
    if (safe) return cleanCell(safe);
  }
  return '';
}

function getReportToken(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.report_token ||
      manual?.reportToken ||
      lead?.reportToken ||
      lead?.report_token ||
      audit?.report_token ||
      audit?.reportToken ||
      audit?.exports?.report_token ||
      audit?.exports?.reportToken ||
      '',
  );
}

function getEmailPreviewImageUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  const raw =
    manual?.email_preview_image_url ||
    manual?.emailPreviewImageUrl ||
    lead?.emailPreviewImageUrl ||
    lead?.email_preview_image_url ||
    lead?.emailPreviewImageWebpUrl ||
    lead?.email_preview_image_webp_url ||
    audit?.emailPreviewImageUrl ||
    audit?.email_preview_image_url ||
    audit?.emailPreviewImageWebpUrl ||
    audit?.email_preview_image_webp_url ||
    audit?.emailPreviewImage?.publicUrl ||
    audit?.emailPreviewImage?.public_url ||
    audit?.email_preview_image?.publicUrl ||
    audit?.email_preview_image?.public_url ||
    audit?.exports?.emailPreviewImageUrl ||
    audit?.exports?.email_preview_image_url ||
    audit?.report?.emailPreviewImageUrl ||
    audit?.report?.email_preview_image_url ||
    '';
  const safe = sanitizeOptionalUrl(raw);
  return /\/api\/email-preview\//i.test(safe) ? cleanCell(safe) : '';
}

function getEmailPreviewImageB2Key(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_preview_image_b2_key ||
      manual?.emailPreviewImageB2Key ||
      lead?.emailPreviewImageB2Key ||
      lead?.email_preview_image_b2_key ||
      audit?.emailPreviewImageB2Key ||
      audit?.email_preview_image_b2_key ||
      audit?.emailPreviewImage?.b2Key ||
      audit?.emailPreviewImage?.b2_key ||
      audit?.email_preview_image?.b2Key ||
      audit?.email_preview_image?.b2_key ||
      audit?.exports?.emailPreviewImageB2Key ||
      audit?.exports?.email_preview_image_b2_key ||
      ''
  );
}

function getEmailPreviewImageMimeType(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_preview_image_mime_type ||
      manual?.emailPreviewImageMimeType ||
      lead?.emailPreviewImageMimeType ||
      lead?.email_preview_image_mime_type ||
      audit?.emailPreviewImageMimeType ||
      audit?.email_preview_image_mime_type ||
      audit?.emailPreviewImage?.mimeType ||
      audit?.emailPreviewImage?.mime_type ||
      audit?.email_preview_image?.mimeType ||
      audit?.email_preview_image?.mime_type ||
      audit?.exports?.emailPreviewImageMimeType ||
      audit?.exports?.email_preview_image_mime_type ||
      ''
  );
}

function getEmailPreviewImageSizeBytes(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_preview_image_size_bytes ||
      manual?.emailPreviewImageSizeBytes ||
      lead?.emailPreviewImageSizeBytes ||
      lead?.email_preview_image_size_bytes ||
      audit?.emailPreviewImageSizeBytes ||
      audit?.email_preview_image_size_bytes ||
      audit?.emailPreviewImage?.sizeBytes ||
      audit?.emailPreviewImage?.size_bytes ||
      audit?.email_preview_image?.sizeBytes ||
      audit?.email_preview_image?.size_bytes ||
      audit?.exports?.emailPreviewImageSizeBytes ||
      audit?.exports?.email_preview_image_size_bytes ||
      ''
  );
}

function getPdfFileId(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.pdf_file_id ||
      manual?.pdfFileId ||
      lead?.pdfFileId ||
      lead?.pdf_file_id ||
      audit?.pdf_file_id ||
      audit?.pdfFileId ||
      audit?.exports?.pdf_file_id ||
      audit?.exports?.pdfFileId ||
      '',
  );
}

function getPdfViewUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    sanitizeOptionalUrl(
      manual?.pdf_view_url ||
        manual?.pdfViewUrl ||
        lead?.pdfViewUrl ||
        lead?.pdf_view_url ||
        audit?.pdf_view_url ||
        audit?.pdfViewUrl ||
        audit?.exports?.pdf_view_url ||
        audit?.exports?.pdfViewUrl ||
        '',
    ),
  );
}

function getPdfDownloadUrl(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    sanitizeOptionalUrl(
      manual?.pdf_download_url ||
        manual?.pdfDownloadUrl ||
        lead?.pdfDownloadUrl ||
        lead?.pdf_download_url ||
        audit?.pdf_download_url ||
        audit?.pdfDownloadUrl ||
        audit?.exports?.pdf_download_url ||
        audit?.exports?.pdfDownloadUrl ||
        '',
    ),
  );
}

function getPdfExpiresAt(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.pdf_expires_at ||
      manual?.pdfExpiresAt ||
      lead?.pdfExpiresAt ||
      lead?.pdf_expires_at ||
      audit?.pdf_expires_at ||
      audit?.pdfExpiresAt ||
      audit?.exports?.pdf_expires_at ||
      audit?.exports?.pdfExpiresAt ||
      '',
  );
}

function getEmailSubject(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_subject ||
      lead?.emailSubject ||
      lead?.subject ||
      audit?.outreach_email_brief?.subject ||
      audit?.nextjs_payload?.email_brief?.subject ||
      audit?.email_draft?.subject ||
      audit?.outreach_playbook?.first_email_subjects?.[0] ||
      '',
  );
}

function getEmailBody(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  return cleanCell(
    manual?.email_body ||
      lead?.emailBody ||
      lead?.message ||
      audit?.outreach_email_brief?.ready_email ||
      audit?.outreach_email_brief?.copy_ready_email ||
      audit?.nextjs_payload?.email_brief?.ready_email ||
      audit?.nextjs_payload?.email_brief?.copy_ready_email ||
      audit?.outreach_playbook?.first_email ||
      audit?.email_draft?.body ||
      '',
  );
}

function buildFallbackChatGptPrompt(audit?: AnyRecord, lead?: AnyRecord): string {
  const businessName = getBusinessName(audit, lead);
  const websiteUrl = getWebsiteUrl(audit, lead);
  const problem = getMainProblem(audit, lead);
  const proofPoints = getProofPoints(audit, lead);
  const finalEmail = getFinalEmail(audit, lead);
  const social = getBestSocial(audit, lead);
  const whatsapp = getWhatsApp(audit, lead);

  return [
    'Write a short, natural English cold outreach email based only on the website audit evidence below.',
    '',
    `Business name: ${businessName}`,
    `Website URL: ${websiteUrl}`,
    `Main issue/opportunity: ${problem}`,
    `Email/contact found: ${finalEmail.email || 'No reliable email found'}`,
    social.url ? `Best social profile: ${social.platform} - ${social.url}` : '',
    whatsapp ? `WhatsApp: ${whatsapp}` : '',
    proofPoints.length ? `Proof points: ${proofPoints.join(' | ')}` : '',
    '',
    'Rules:',
    '- Write 3 email versions under 120 words each.',
    '- Give 2 subject line options.',
    '- Sound human, calm, and helpful.',
    '- Do not mention AI, automation, scraper, audit tool, or bot.',
    '- Do not say the website is broken.',
    '- Do not claim Google Ads/GA4 account-level conversion recording without access.',
    '- Use cautious phrases like “I noticed”, “may be worth checking”, and “could be harder to measure”.',
    '- End with a soft question, not a hard sales pitch.',
  ]
    .filter(Boolean)
    .join('\n');
}

function getChatGptPrompt(audit?: AnyRecord, lead?: AnyRecord): string {
  const manual = getManualUpdate(audit, lead);
  const prompt =
    manual?.chatgpt_prompt ||
    lead?.chatgptPrompt ||
    lead?.chatgpt_prompt ||
    lead?.chatgptEmailPrompt ||
    audit?.outreach_email_brief?.chatgpt_email_prompt ||
    audit?.nextjs_payload?.email_brief?.chatgpt_email_prompt ||
    audit?.email_brief?.chatgpt_email_prompt ||
    audit?.outreach_playbook?.chatgpt_prompt ||
    '';

  return cleanCell(prompt || buildFallbackChatGptPrompt(audit, lead));
}

function getDecisionMaker(audit?: AnyRecord, lead?: AnyRecord): { name: string; title: string } {
  const manual = getManualUpdate(audit, lead);

  const safeName =
    audit?.decision_maker_safety?.selected_name ||
    audit?.nextjs_payload?.decision_maker_safety?.selected_name ||
    '';

  const safeTitle =
    audit?.decision_maker_safety?.selected_title ||
    audit?.nextjs_payload?.decision_maker_safety?.selected_title ||
    '';

  return {
    name: cleanCell(
      manual?.name ||
        manual?.decision_maker_name ||
        lead?.decisionMaker ||
        lead?.founder ||
        safeName ||
        audit?.person1?.name ||
        audit?.decision_makers?.best_match?.name ||
        '',
    ),
    title: cleanCell(
      manual?.title ||
        manual?.decision_maker_title ||
        lead?.decisionMakerTitle ||
        lead?.personTitle ||
        safeTitle ||
        audit?.person1?.title ||
        audit?.decision_makers?.best_match?.title ||
        '',
    ),
  };
}

function getContactQuality(audit?: AnyRecord, lead?: AnyRecord): string {
  return cleanCell(
    lead?.contactQuality ||
      audit?.contact_quality?.level ||
      audit?.contact_quality?.best_contact_method ||
      '',
  );
}



function lowerSheetText(...values: unknown[]): string {
  return values
    .map((value) => {
      if (value === undefined || value === null) return '';
      if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean).join(' ');
      if (typeof value === 'object') {
        try {
          return Object.values(value as AnyRecord).map((item) => clean(item)).filter(Boolean).join(' ');
        } catch {
          return '';
        }
      }
      return clean(value);
    })
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isValidEmailAddress(value: unknown): boolean {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function textHasAny(value: string, patterns: string[]) {
  const text = String(value || '').toLowerCase();
  return patterns.some((pattern) => text.includes(pattern));
}

function normalizeSourceTypeForSheet(value: unknown): 'search' | 'linkedin' | 'manual' | '' {
  const text = clean(value).toLowerCase();
  if (!text) return '';
  if (textHasAny(text, ['linkedin', 'linked in'])) return 'linkedin';
  if (textHasAny(text, ['python_search', 'python search', 'search_result', 'search result', 'website search', 'google search', 'source type: search', 'python'])) return 'search';
  if (textHasAny(text, ['manual_audit', 'manual audit', 'source type: manual'])) return 'manual';
  if (['search', 'linkedin', 'manual'].includes(text)) return text as 'search' | 'linkedin' | 'manual';
  return '';
}

function sourceBooleanCell(value: unknown, fallback = ''): string {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = clean(value);
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (['1', 'true', 'yes', 'y', 'allowed', 'allow'].includes(lower)) return 'Yes';
  if (['0', 'false', 'no', 'n', 'blocked', 'disallow'].includes(lower)) return 'No';
  return cleanCell(text);
}

function getSourceMetadata(audit?: AnyRecord, lead?: AnyRecord): Record<'Source Type' | 'Outreach Channel' | 'Lead Source' | 'Audit Source' | 'Source Context' | 'Email Outreach Allowed' | 'LinkedIn Outreach Allowed', string> {
  const explicitSourceType = firstValidValue(
    lead?.sourceType,
    lead?.source_type,
    audit?.sourceType,
    audit?.source_type,
    audit?.nextjs_payload?.sourceType,
    audit?.nextjs_payload?.source_type,
  );
  const explicitLeadSource = firstValidValue(
    lead?.leadSource,
    lead?.lead_source,
    audit?.leadSource,
    audit?.lead_source,
    audit?.nextjs_payload?.leadSource,
    audit?.nextjs_payload?.lead_source,
  );
  const explicitAuditSource = firstValidValue(
    lead?.auditSource,
    lead?.audit_source,
    audit?.auditSource,
    audit?.audit_source,
    audit?.nextjs_payload?.auditSource,
    audit?.nextjs_payload?.audit_source,
    audit?.audit_source,
    lead?.source,
  );
  const explicitSourceContext = firstValidValue(
    lead?.sourceContext,
    lead?.source_context,
    audit?.sourceContext,
    audit?.source_context,
    audit?.nextjs_payload?.sourceContext,
    audit?.nextjs_payload?.source_context,
  );
  const explicitChannel = firstValidValue(
    lead?.outreachChannel,
    lead?.outreach_channel,
    audit?.outreachChannel,
    audit?.outreach_channel,
    audit?.nextjs_payload?.outreachChannel,
    audit?.nextjs_payload?.outreach_channel,
  );

  const social = getBestSocial(audit, lead);
  const finalEmail = getFinalEmail(audit, lead).email;
  const hasReportMetadata = Boolean(getReportToken(audit, lead) || getReportUrl(audit, lead) || getPdfFileId(audit, lead));
  const sourceText = lowerSheetText(
    explicitSourceType,
    explicitLeadSource,
    explicitAuditSource,
    explicitSourceContext,
    explicitChannel,
    social.platform,
    social.url,
    lead?.linkedin,
    lead?.linkedinUrl,
    lead?.linkedin_url,
    audit?.linkedin_profile_url,
    audit?.linkedinProfileUrl,
    audit?.source_context,
    audit?.audit_source,
  );

  let sourceType = normalizeSourceTypeForSheet(explicitSourceType) || normalizeSourceTypeForSheet(explicitLeadSource) || normalizeSourceTypeForSheet(explicitAuditSource) || normalizeSourceTypeForSheet(explicitSourceContext);
  if (!sourceType && textHasAny(sourceText, ['linkedin', 'linked in'])) sourceType = 'linkedin';
  if (!sourceType && textHasAny(sourceText, ['python', 'search_result', 'search result', 'website search', 'google search'])) sourceType = 'search';
  if (!sourceType && hasReportMetadata) sourceType = 'search';
  if (!sourceType && textHasAny(sourceText, ['manual_audit', 'manual audit'])) sourceType = 'manual';

  const normalizedExplicitChannel = clean(explicitChannel).toLowerCase();
  const outreachChannel =
    normalizedExplicitChannel.includes('linkedin')
      ? 'linkedin'
      : normalizedExplicitChannel.includes('email')
        ? 'email'
        : sourceType === 'linkedin'
          ? 'linkedin'
          : sourceType === 'search'
            ? 'email'
            : sourceType === 'manual'
              ? (isValidEmailAddress(finalEmail) ? 'email' : 'manual')
              : isValidEmailAddress(finalEmail)
                ? 'email'
                : '';

  const leadSource = cleanCell(explicitLeadSource || (sourceType === 'linkedin' ? 'linkedin_audit' : sourceType === 'search' ? 'python_search' : sourceType === 'manual' ? 'manual_audit' : ''));
  const auditSource = cleanCell(explicitAuditSource || (sourceType === 'linkedin' ? 'linkedin_manual_audit' : sourceType === 'search' ? 'python_sheet_export' : sourceType === 'manual' ? 'manual_audit' : ''));
  const sourceContext = cleanCell(explicitSourceContext || auditSource || leadSource || sourceType);

  const explicitEmailAllowed = lead?.emailOutreachAllowed ?? lead?.email_outreach_allowed ?? audit?.emailOutreachAllowed ?? audit?.email_outreach_allowed;
  const explicitLinkedInAllowed = lead?.linkedinOutreachAllowed ?? lead?.linkedin_outreach_allowed ?? audit?.linkedinOutreachAllowed ?? audit?.linkedin_outreach_allowed;

  return {
    'Source Type': cleanCell(sourceType),
    'Outreach Channel': cleanCell(outreachChannel),
    'Lead Source': leadSource,
    'Audit Source': auditSource,
    'Source Context': sourceContext,
    'Email Outreach Allowed': sourceBooleanCell(explicitEmailAllowed, outreachChannel === 'email' && isValidEmailAddress(finalEmail) ? 'Yes' : 'No'),
    'LinkedIn Outreach Allowed': sourceBooleanCell(explicitLinkedInAllowed, outreachChannel === 'linkedin' ? 'Yes' : 'No'),
  };
}

function getExistingOrDefault(
  existing: AnyRecord | undefined,
  header: HeaderName,
  fallback: string,
  incoming?: any,
): string {
  if (incoming !== undefined && incoming !== null && clean(incoming) !== '') return cleanCell(incoming);
  const oldValue = existing?.[header];
  if (oldValue !== undefined && oldValue !== null && clean(oldValue) !== '') return cleanCell(oldValue);
  return fallback;
}

function buildLeadObject(lead: AnyRecord, existing?: AnyRecord): Record<HeaderName, string> {
  const audit = lead?.audit || {};
  const finalEmail = getFinalEmail(audit, lead);
  const social = getBestSocial(audit, lead);
  const decisionMaker = getDecisionMaker(audit, lead);
  const sourceMeta = getSourceMetadata(audit, lead);

  const generated: Record<HeaderName, string> = {
    'Export Date': todayDhaka(),
    'Business Name': getBusinessName(audit, lead),
    'Website URL': getWebsiteUrl(audit, lead),
    'Final Email': cleanCell(finalEmail.email),
    'Email Source': cleanCell(finalEmail.source),
    'Social Platform': cleanCell(social.platform),
    'Social Link': cleanCell(social.url),
    WhatsApp: getWhatsApp(audit, lead),
    'ChatGPT Prompt': getChatGptPrompt(audit, lead),

    'Lead Status': getLeadStatus(audit, lead, existing),
    'Approval Status': getExistingOrDefault(existing, 'Approval Status', 'System Qualified', lead?.approvalStatus),
    'Send Status': getExistingOrDefault(existing, 'Send Status', 'Not Sent', lead?.sendStatus),
    'Service Type': getServiceType(audit, lead),
    'Audit Score': getAuditScore(audit, lead),
    'Lead Label': getLeadLabel(audit, lead),
    'Main Issue': getMainProblem(audit, lead),
    'Proof Points': cleanCell(getProofPoints(audit, lead).join(' | ')),
    'Report Token': getReportToken(audit, lead),
    'Report URL': getReportUrl(audit, lead),
    'Email Preview Image URL': getExistingOrDefault(existing, 'Email Preview Image URL', getEmailPreviewImageUrl(audit, lead), lead?.emailPreviewImageUrl || lead?.email_preview_image_url || lead?.emailPreviewImageWebpUrl || lead?.email_preview_image_webp_url),
    'Email Preview Image B2 Key': getExistingOrDefault(existing, 'Email Preview Image B2 Key', getEmailPreviewImageB2Key(audit, lead), lead?.emailPreviewImageB2Key || lead?.email_preview_image_b2_key),
    'Email Preview Image MIME': getExistingOrDefault(existing, 'Email Preview Image MIME', getEmailPreviewImageMimeType(audit, lead), lead?.emailPreviewImageMimeType || lead?.email_preview_image_mime_type),
    'Email Preview Image Size': getExistingOrDefault(existing, 'Email Preview Image Size', getEmailPreviewImageSizeBytes(audit, lead), lead?.emailPreviewImageSizeBytes || lead?.email_preview_image_size_bytes),
    'PDF File ID': getPdfFileId(audit, lead),
    'PDF View URL': getPdfViewUrl(audit, lead),
    'PDF Download URL': getPdfDownloadUrl(audit, lead),
    'PDF Expires At': getPdfExpiresAt(audit, lead),
    'Report Page Viewed': getExistingOrDefault(existing, 'Report Page Viewed', 'No', lead?.reportPageViewed),
    'PDF Downloaded': getExistingOrDefault(existing, 'PDF Downloaded', 'No', lead?.pdfDownloaded),
    'CTA Clicked': getExistingOrDefault(existing, 'CTA Clicked', 'No', lead?.ctaClicked),
    'Last Report Viewed At': getExistingOrDefault(existing, 'Last Report Viewed At', '', lead?.lastReportViewedAt),
    'Last PDF Downloaded At': getExistingOrDefault(existing, 'Last PDF Downloaded At', '', lead?.lastPdfDownloadedAt),
    'Last CTA Clicked At': getExistingOrDefault(existing, 'Last CTA Clicked At', '', lead?.lastCtaClickedAt),
    'Email Subject': getEmailSubject(audit, lead),
    'Email Body': getEmailBody(audit, lead),
    'Decision Maker': decisionMaker.name,
    'Decision Maker Title': decisionMaker.title,
    'Contact Quality': getContactQuality(audit, lead),

    'Source Type': getExistingOrDefault(existing, 'Source Type', sourceMeta['Source Type'], lead?.sourceType || lead?.source_type),
    'Outreach Channel': getExistingOrDefault(existing, 'Outreach Channel', sourceMeta['Outreach Channel'], lead?.outreachChannel || lead?.outreach_channel),
    'Lead Source': getExistingOrDefault(existing, 'Lead Source', sourceMeta['Lead Source'], lead?.leadSource || lead?.lead_source),
    'Audit Source': getExistingOrDefault(existing, 'Audit Source', sourceMeta['Audit Source'], lead?.auditSource || lead?.audit_source),
    'Source Context': getExistingOrDefault(existing, 'Source Context', sourceMeta['Source Context'], lead?.sourceContext || lead?.source_context),
    'Email Outreach Allowed': getExistingOrDefault(existing, 'Email Outreach Allowed', sourceMeta['Email Outreach Allowed'], lead?.emailOutreachAllowed ?? lead?.email_outreach_allowed),
    'LinkedIn Outreach Allowed': getExistingOrDefault(existing, 'LinkedIn Outreach Allowed', sourceMeta['LinkedIn Outreach Allowed'], lead?.linkedinOutreachAllowed ?? lead?.linkedin_outreach_allowed),

    'Tracking ID': getExistingOrDefault(existing, 'Tracking ID', '', lead?.trackingId),
    'Firestore Lead ID': getExistingOrDefault(existing, 'Firestore Lead ID', '', lead?.firestoreLeadId || lead?.leadId),
    'Open Count': getExistingOrDefault(existing, 'Open Count', '0', lead?.openCount),
    'Click Count': getExistingOrDefault(existing, 'Click Count', '0', lead?.clickCount),
    'Reply Status': getExistingOrDefault(existing, 'Reply Status', 'No Reply', lead?.replyStatus),
    'Last Synced': nowDhaka(),
    'Archive Status': getExistingOrDefault(existing, 'Archive Status', 'Active', lead?.archiveStatus),
    Notes: getExistingOrDefault(existing, 'Notes', '', lead?.notes),
    'Sender ID': getExistingOrDefault(existing, 'Sender ID', '', lead?.senderId || lead?.sender_id),
    'Attempt Count': getExistingOrDefault(existing, 'Attempt Count', '0', lead?.attemptCount || lead?.attempts),
    'Queue Lock ID': getExistingOrDefault(existing, 'Queue Lock ID', '', lead?.queueLockId),
    'Queue Locked At': getExistingOrDefault(existing, 'Queue Locked At', '', lead?.queueLockedAt),
    'Queue Attempt ID': getExistingOrDefault(existing, 'Queue Attempt ID', '', lead?.queueAttemptId),

    'Gmail Outreach Stage': getExistingOrDefault(existing, 'Gmail Outreach Stage', '', lead?.gmailOutreachStage || lead?.gmail_outreach_stage),
    'Gmail Last Sent At': getExistingOrDefault(existing, 'Gmail Last Sent At', '', lead?.gmailLastSentAt || lead?.gmail_last_sent_at),
    'Gmail Next Follow-up Due': getExistingOrDefault(existing, 'Gmail Next Follow-up Due', '', lead?.gmailNextFollowupDue || lead?.gmail_next_followup_due),
    'Gmail Last Action': getExistingOrDefault(existing, 'Gmail Last Action', '', lead?.gmailLastAction || lead?.gmail_last_action),
    'Gmail Last Action At': getExistingOrDefault(existing, 'Gmail Last Action At', '', lead?.gmailLastActionAt || lead?.gmail_last_action_at),
    'Gmail Initial Sent At': getExistingOrDefault(existing, 'Gmail Initial Sent At', '', lead?.gmailInitialSentAt || lead?.gmail_initial_sent_at),
    'Gmail Follow-up 1 Sent At': getExistingOrDefault(existing, 'Gmail Follow-up 1 Sent At', '', lead?.gmailFollowup1SentAt || lead?.gmail_followup_1_sent_at),
    'Gmail Follow-up 2 Sent At': getExistingOrDefault(existing, 'Gmail Follow-up 2 Sent At', '', lead?.gmailFollowup2SentAt || lead?.gmail_followup_2_sent_at),
    'Gmail Follow-up 3 Sent At': getExistingOrDefault(existing, 'Gmail Follow-up 3 Sent At', '', lead?.gmailFollowup3SentAt || lead?.gmail_followup_3_sent_at),
    'Gmail Follow-up 4 Sent At': getExistingOrDefault(existing, 'Gmail Follow-up 4 Sent At', '', lead?.gmailFollowup4SentAt || lead?.gmail_followup_4_sent_at),
    'Gmail Initial Subject': getExistingOrDefault(existing, 'Gmail Initial Subject', '', lead?.gmailInitialSubject || lead?.gmail_initial_subject),
    'Gmail Initial Message': getExistingOrDefault(existing, 'Gmail Initial Message', '', lead?.gmailInitialMessage || lead?.gmail_initial_message),
    'Gmail Follow-up 1 Subject': getExistingOrDefault(existing, 'Gmail Follow-up 1 Subject', '', lead?.gmailFollowup1Subject || lead?.gmail_followup_1_subject),
    'Gmail Follow-up 1 Message': getExistingOrDefault(existing, 'Gmail Follow-up 1 Message', '', lead?.gmailFollowup1Message || lead?.gmail_followup_1_message),
    'Gmail Follow-up 2 Subject': getExistingOrDefault(existing, 'Gmail Follow-up 2 Subject', '', lead?.gmailFollowup2Subject || lead?.gmail_followup_2_subject),
    'Gmail Follow-up 2 Message': getExistingOrDefault(existing, 'Gmail Follow-up 2 Message', '', lead?.gmailFollowup2Message || lead?.gmail_followup_2_message),
    'Gmail Follow-up 3 Subject': getExistingOrDefault(existing, 'Gmail Follow-up 3 Subject', '', lead?.gmailFollowup3Subject || lead?.gmail_followup_3_subject),
    'Gmail Follow-up 3 Message': getExistingOrDefault(existing, 'Gmail Follow-up 3 Message', '', lead?.gmailFollowup3Message || lead?.gmail_followup_3_message),
    'Gmail Follow-up 4 Subject': getExistingOrDefault(existing, 'Gmail Follow-up 4 Subject', '', lead?.gmailFollowup4Subject || lead?.gmail_followup_4_subject),
    'Gmail Follow-up 4 Message': getExistingOrDefault(existing, 'Gmail Follow-up 4 Message', '', lead?.gmailFollowup4Message || lead?.gmail_followup_4_message),
    'Gmail Outreach Notes': getExistingOrDefault(existing, 'Gmail Outreach Notes', '', lead?.gmailOutreachNotes || lead?.gmail_outreach_notes),
    'Gmail Closed Reason': getExistingOrDefault(existing, 'Gmail Closed Reason', '', lead?.gmailClosedReason || lead?.gmail_closed_reason),
  };

  // Preserve control fields if the incoming lead did not explicitly send them.
  if (existing) {
    for (const header of CONTROL_HEADERS) {
      const camel = Object.entries(UPDATE_KEY_MAP).find(([, mapped]) => mapped === header)?.[0];
      const hasIncoming =
        lead?.[header] !== undefined ||
        (camel && lead?.[camel] !== undefined) ||
        (header === 'Firestore Lead ID' && lead?.leadId !== undefined);

      if (!hasIncoming && isValidValue(existing[header])) {
        generated[header] = cleanCell(existing[header]);
      }
    }
  }

  generated['Last Synced'] = nowDhaka();

  if (generated['Email Preview Image URL']) {
    const safePreviewUrl = sanitizeOptionalUrl(generated['Email Preview Image URL']);
    generated['Email Preview Image URL'] = /\/api\/email-preview\//i.test(safePreviewUrl) ? cleanCell(safePreviewUrl) : '';
  }

  return generated;
}

const EMAIL_PREVIEW_HEADERS = new Set<string>([
  'Email Preview Image URL',
  'Email Preview Image B2 Key',
  'Email Preview Image MIME',
  'Email Preview Image Size',
]);

const LEGACY_HEADERS_WITHOUT_EMAIL_PREVIEW = HEADERS.filter((header) => !EMAIL_PREVIEW_HEADERS.has(header)) as string[];

function isEmailPreviewImageUrl(value: any): boolean {
  const url = sanitizeOptionalUrl(value);
  return Boolean(url && /\/api\/email-preview\//i.test(url));
}

function looksLikePdfStorageValue(value: any): boolean {
  const text = clean(value).toLowerCase();
  return Boolean(
    text &&
      (
        text.includes('/pdf/') ||
        text.includes('audit-report.pdf') ||
        text.includes('/api/trackflow/reports/preview') ||
        text.includes('/api/trackflow/reports/download') ||
        text.endsWith('.pdf')
      )
  );
}

function rowToObjectWithHeaders(row: any[] = [], headers: readonly string[], rowNumber?: number): AnyRecord {
  const record: AnyRecord = {};
  headers.forEach((header, index) => {
    record[header] = clean(row[index], '');
  });
  if (rowNumber) record.rowNumber = rowNumber;
  return record;
}

function rowToObject(row: any[] = [], rowNumber?: number): AnyRecord {
  const canonical = rowToObjectWithHeaders(row, HEADERS, rowNumber);

  // Backward-compatible read repair:
  // Some older Sheets did not have Email Preview Image columns. If a legacy row
  // was written before those columns existed, its PDF fields appear in the new
  // Email Preview slots after the header is repaired. Detect that shape and map
  // the physical cells with the legacy header layout instead. Rows that already
  // contain /api/email-preview/ in the new slot are already in the new layout.
  const previewSlot = canonical['Email Preview Image URL'];
  const pdfSlot = canonical['PDF File ID'];
  const probablyLegacyWithoutPreviewColumns =
    Boolean(previewSlot) &&
    !isEmailPreviewImageUrl(previewSlot) &&
    looksLikePdfStorageValue(previewSlot) &&
    !looksLikePdfStorageValue(pdfSlot);

  if (!probablyLegacyWithoutPreviewColumns) {
    return canonical;
  }

  const legacy = rowToObjectWithHeaders(row, LEGACY_HEADERS_WITHOUT_EMAIL_PREVIEW, rowNumber);
  return {
    ...legacy,
    'Email Preview Image URL': '',
    'Email Preview Image B2 Key': '',
    'Email Preview Image MIME': '',
    'Email Preview Image Size': '',
    rowNumber,
  };
}

function normalizeSheetRowForDashboard(row: AnyRecord): AnyRecord {
  const next = { ...row };
  if (!clean(next['Lead Status'])) next['Lead Status'] = clean(next['Lead Label']) || 'Maybe Check';
  if (!clean(next['Approval Status'])) next['Approval Status'] = 'System Qualified';
  if (!clean(next['Send Status'])) next['Send Status'] = 'Not Sent';
  if (!clean(next['Archive Status'])) next['Archive Status'] = 'Active';
  if (!clean(next['Reply Status'])) next['Reply Status'] = 'No Reply';
  if (!clean(next['Open Count'])) next['Open Count'] = '0';
  if (!clean(next['Click Count'])) next['Click Count'] = '0';
  if (!clean(next['Source Type'])) {
    const sourceText = [next['Email Source'], next['Lead Source'], next['Audit Source'], next['Source Context'], next['Social Platform'], next['Social Link'], next['Notes']]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
    if (sourceText.includes('linkedin') || sourceText.includes('linked in')) next['Source Type'] = 'linkedin';
    else if (sourceText.includes('search') || sourceText.includes('python')) next['Source Type'] = 'search';
  }
  return next;
}

function rowObjectToArray(row: AnyRecord): string[] {
  return HEADERS.map((header) => cleanCell(row[header], ''));
}

const SHEET_PROCESSING_LOCK_MAX_AGE_MINUTES = 30;

function sheetLockTimestamp(): string {
  // ISO timestamp is used because it can be parsed reliably by cron in any timezone.
  return new Date().toISOString();
}

function sheetLockAgeMs(value: any): number {
  const text = clean(value);
  if (!text) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Date.now() - parsed;
}

function isSheetProcessingLockStale(row: AnyRecord): boolean {
  return sheetLockAgeMs(row['Queue Locked At']) > SHEET_PROCESSING_LOCK_MAX_AGE_MINUTES * 60_000;
}

function isRetryableDailyLimitError(error: any): boolean {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("daily limit") || message.includes("limit reached") || message.includes("blocked_daily_limit");
}

async function updateSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number, rowObj: AnyRecord) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowObjectToArray({ ...rowObj, 'Last Synced': nowDhaka() })] },
  });
}

async function readSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number): Promise<AnyRecord> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
  });
  const row = response.data.values?.[0] || [];
  return rowToObject(row, rowNumber);
}

function getLeadUrlKey(lead: AnyRecord): string {
  const audit = lead?.audit || {};
  return normalizeUrlForSheet(lead?.websiteUrl || lead?.website || lead?.link || audit?.homepage_url || audit?.domain);
}

function normalizeUpdateObject(input: AnyRecord): AnyRecord {
  const output: AnyRecord = {};
  const blocked = new Set(['rowNumber', 'websiteUrl', 'website', 'finalEmail', 'email', 'updates', 'items']);

  for (const [rawKey, rawValue] of Object.entries(input || {})) {
    if (blocked.has(rawKey)) continue;
    if (rawValue === undefined) continue;

    const mapped = (HEADERS as readonly string[]).includes(rawKey) ? rawKey : UPDATE_KEY_MAP[rawKey];

    if (mapped) {
      output[mapped] = cleanCell(rawValue);
    }
  }

  return output;
}

async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID is missing.');
  if (!clientEmail) throw new Error('GOOGLE_CLIENT_EMAIL is missing.');
  if (!privateKey) throw new Error('GOOGLE_PRIVATE_KEY is missing.');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId,
  };
}

async function requireSheetAccess(req: Request) {
  const expected = process.env.SHEET_API_SECRET || "";
  const received = req.headers.get("x-sheet-secret") || "";

  // Local audit/bridge tools should send x-sheet-secret in a header, not in the URL.
  if (expected && received && safeEqual(received, expected)) {
    return { uid: "sheet-secret", email: "sheet-bridge@local" };
  }

  // Dashboard/browser requests should use Firebase ID token, same as the other TrackFlow APIs.
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return await requireAdmin(req);
  }

  throw new ApiError("Unauthorized sheet request: missing Firebase ID token or valid x-sheet-secret header", 401);
}

async function ensureHeaderRow(sheets: any, spreadsheetId: string) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${lastColumnLetter()}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
}

async function loadRows(sheets: any, spreadsheetId: string): Promise<any[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:${lastColumnLetter()}`,
  });

  const values = response?.data?.values;
  return Array.isArray(values) ? (values as any[][]) : [];
}

function buildIndexes(rows: any[][]) {
  const urlToRowNumber = new Map<string, number>();
  const emailToRowNumber = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const obj = rowToObject(row, rowNumber);

    const urlKey = normalizeUrlForSheet(obj['Website URL']);
    if (urlKey) urlToRowNumber.set(urlKey, rowNumber);

    const emailKey = normalizeEmail(obj['Final Email']);
    if (emailKey) emailToRowNumber.set(emailKey, rowNumber);
  });

  return { urlToRowNumber, emailToRowNumber };
}

async function applySheetFormatting(sheets: any, spreadsheetId: string) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = sheetMeta.data.sheets?.find((item: any) => item.properties?.title === SHEET_NAME);

  const sheetId = sheet?.properties?.sheetId;
  const rowCount = sheet?.properties?.gridProperties?.rowCount || 1000;

  if (sheetId === undefined || sheetId === null) return;

  const widthRequests = HEADERS.map((header, index) => ({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 },
      properties: { pixelSize: COLUMN_WIDTHS[header] || 160 },
      fields: 'pixelSize',
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: Math.max(rowCount, 2),
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
            },
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: HEADERS.length,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.08, green: 0.1, blue: 0.18 } },
                backgroundColor: { red: 0.9, green: 0.92, blue: 0.96 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'CLIP',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              endRowIndex: Math.max(rowCount, 2),
              startColumnIndex: 0,
              endColumnIndex: HEADERS.length,
            },
            cell: {
              userEnteredFormat: {
                verticalAlignment: 'MIDDLE',
                horizontalAlignment: 'LEFT',
                wrapStrategy: 'CLIP',
              },
            },
            fields: 'userEnteredFormat(verticalAlignment,horizontalAlignment,wrapStrategy)',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 42 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: Math.max(rowCount, 2) },
            properties: { pixelSize: 34 },
            fields: 'pixelSize',
          },
        },
        ...widthRequests,
      ],
    },
  });
}

/**
 * GET /api/sheets/leads
 *
 * Query examples:
 * - ?approvalStatus=Approved
 * - ?sendStatus=Not%20Sent
 * - ?hasEmail=true
 * - ?includeArchived=true
 * - ?limit=100
 */
async function handleSheetLeadsGet(req: Request) {
  try {
    await requireSheetAccess(req);

    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const leads = rows.map((row: any[], index: number) => normalizeSheetRowForDashboard(rowToObject(row, index + 2)));

    const url = new URL(req.url);
    const approvalStatus = clean(url.searchParams.get('approvalStatus'));
    const sendStatus = clean(url.searchParams.get('sendStatus'));
    const leadStatus = clean(url.searchParams.get('leadStatus'));
    const archiveStatus = clean(url.searchParams.get('archiveStatus'));
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const hasEmail = url.searchParams.get('hasEmail') === 'true';
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const max = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 500;

    let filtered = leads.filter((lead: AnyRecord) => {
      if (!includeArchived) {
        const status = clean(lead['Archive Status']).toLowerCase();
        if (status === 'archived' || status === 'deleted') return false;
      }

      if (approvalStatus && clean(lead['Approval Status']).toLowerCase() !== approvalStatus.toLowerCase()) return false;
      if (sendStatus && clean(lead['Send Status']).toLowerCase() !== sendStatus.toLowerCase()) return false;
      if (leadStatus) {
        const rowLeadStatus = clean(lead['Lead Status']).toLowerCase();
        const requestedLeadStatus = leadStatus.toLowerCase();
        const isQualifiedRequest = requestedLeadStatus === 'qualified' || requestedLeadStatus === 'hot_good' || requestedLeadStatus === 'hot+good';
        if (isQualifiedRequest) {
          if (!rowLeadStatus.includes('hot') && !rowLeadStatus.includes('good')) return false;
        } else if (rowLeadStatus !== requestedLeadStatus) {
          return false;
        }
      }
      if (archiveStatus && clean(lead['Archive Status']).toLowerCase() !== archiveStatus.toLowerCase()) return false;
      if (hasEmail && !isValidValue(lead['Final Email'])) return false;

      return true;
    });

    filtered = filtered.slice(0, max);

    return NextResponse.json({
      success: true,
      count: filtered.length,
      totalRows: leads.length,
      headers: HEADERS,
      leads: filtered,
    });
  } catch (error: any) {
    console.error('Sheet GET Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * POST /api/sheets/leads
 *
 * Existing Python/audit flow can keep sending:
 * { "leads": [{ title, link, audit: {...} }] }
 *
 * Also supports:
 * { "lead": {...} }
 */
async function handleSheetLeadsPost(req: Request) {
  try {
    await requireSheetAccess(req);

    const body = await req.json();
    const leads = Array.isArray(body?.leads) ? body.leads : body?.lead ? [body.lead] : [];

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ success: false, message: 'No leads received.' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getSheetsClient();

    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const { urlToRowNumber, emailToRowNumber } = buildIndexes(rows);

    const rowsToAppend: string[][] = [];
    const rowsToUpdate: Array<{ rowNumber: number; row: string[] }> = [];
    const skipped: string[] = [];

    leads.forEach((lead: AnyRecord) => {
      const urlKey = getLeadUrlKey(lead);
      const finalEmail = getFinalEmail(lead?.audit || {}, lead).email;
      const emailKey = normalizeEmail(finalEmail);

      if (!urlKey && !emailKey) {
        skipped.push(clean(lead?.title || lead?.link || 'Unknown lead'));
        return;
      }

      const existingRowNumber = (urlKey && urlToRowNumber.get(urlKey)) || (emailKey && emailToRowNumber.get(emailKey));
      const existingObj = existingRowNumber ? rowToObject(rows[existingRowNumber - 2], existingRowNumber) : undefined;
      const rowObj = buildLeadObject(lead, existingObj);
      const row = rowObjectToArray(rowObj);

      if (existingRowNumber) {
        rowsToUpdate.push({ rowNumber: existingRowNumber, row });
      } else {
        rowsToAppend.push(row);
      }
    });

    if (rowsToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: rowsToUpdate.map(({ rowNumber, row }) => ({
            range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
            values: [row],
          })),
        },
      });
    }

    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rowsToAppend },
      });
    }

    if (body?.applyFormatting === true) {
      await applySheetFormatting(sheets, spreadsheetId);
    }

    return NextResponse.json({
      success: true,
      addedCount: rowsToAppend.length,
      updatedCount: rowsToUpdate.length,
      skippedCount: skipped.length,
      skipped,
      message: `Added ${rowsToAppend.length} new lead(s), updated ${rowsToUpdate.length} existing lead(s).`,
    });
  } catch (error: any) {
    console.error('Sheet POST Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * PATCH /api/sheets/leads
 *
 * Single update:
 * {
 *   "rowNumber": 5,
 *   "updates": {
 *     "Approval Status": "Approved",
 *     "Send Status": "Sent",
 *     "Firestore Lead ID": "...",
 *     "Tracking ID": "..."
 *   }
 * }
 *
 * Or by website/email:
 * {
 *   "websiteUrl": "https://example.com",
 *   "updates": { "approvalStatus": "Approved" }
 * }
 *
 * Bulk:
 * { "items": [ { "rowNumber": 5, "updates": {...} }, ... ] }
 */
async function handleSheetLeadsPatch(req: Request) {
  try {
    await requireSheetAccess(req);

    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [body];

    if (!items.length) {
      return NextResponse.json({ success: false, message: 'No update items received.' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getSheetsClient();

    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const { urlToRowNumber, emailToRowNumber } = buildIndexes(rows);

    const updatesForSheet: Array<{ rowNumber: number; row: string[] }> = [];
    const missing: AnyRecord[] = [];

    for (const item of items) {
      const rowNumberFromBody = Number(item?.rowNumber || 0);
      const websiteKey = normalizeUrlForSheet(item?.websiteUrl || item?.website);
      const emailKey = normalizeEmail(item?.finalEmail || item?.email);

      const rowNumber =
        rowNumberFromBody > 1
          ? rowNumberFromBody
          : (websiteKey && urlToRowNumber.get(websiteKey)) || (emailKey && emailToRowNumber.get(emailKey)) || 0;

      if (!rowNumber || !rows[rowNumber - 2]) {
        missing.push({
          rowNumber: item?.rowNumber || '',
          websiteUrl: item?.websiteUrl || item?.website || '',
          finalEmail: item?.finalEmail || item?.email || '',
        });
        continue;
      }

      const existingObj = rowToObject(rows[rowNumber - 2], rowNumber);
      const normalizedUpdates = normalizeUpdateObject(item?.updates || item);

      const nextObj: AnyRecord = {
        ...existingObj,
        ...normalizedUpdates,
        'Last Synced': nowDhaka(),
      };

      updatesForSheet.push({ rowNumber, row: rowObjectToArray(nextObj) });
    }

    if (updatesForSheet.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesForSheet.map(({ rowNumber, row }) => ({
            range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
            values: [row],
          })),
        },
      });
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatesForSheet.length,
      missingCount: missing.length,
      missing,
    });
  } catch (error: any) {
    console.error('Sheet PATCH Error:', error);
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}


async function patchSheetRowSafely(rowNumber: number, updates: AnyRecord) {
  if (!rowNumber || rowNumber <= 1) return;
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);
    const existing = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
    if (!existing || !Object.keys(existing).length) return;
    const normalized = normalizeUpdateObject(updates || {});
    await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, { ...existing, ...normalized });
  } catch (error) {
    console.warn("Sheet patch skipped:", error);
  }
}


function normalizeDomainKeyForReports(...values: any[]): string {
  for (const value of values) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) continue;

    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./i, "").replace(/:\d+$/g, "").trim();
      if (host) return host;
    } catch {}

    const fallback = raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .replace(/:\d+$/g, "")
      .trim();

    if (fallback) return fallback;
  }

  return "";
}

function reportSortMsForReports(report: AnyRecord = {}): number {
  return Math.max(
    toMillis(report.lastRegisteredAt),
    toMillis(report.updatedAt),
    toMillis(report.createdAt),
    toMillis(report.pdfExpiresAt),
    0,
  );
}

function serializeResolvedReportForReports(report: AnyRecord = {}, fallbackToken = ""): AnyRecord {
  const token = normalizeReportToken(report.token || report.reportToken || report.report_token || fallbackToken);
  const domainKey = normalizeDomainKeyForReports(report.domain, report.normalizedDomain, report.normalized_domain, report.websiteUrl, report.website_url, report.website);
  const domainSlug = String(report.domainSlug || report.domain_slug || normalizeReportSlug(domainKey || report.domain || report.websiteUrl || "website"));

  const ogImageUrl = String(
    report.ogImageUrl ||
      report.openGraphImageUrl ||
      report.previewImageUrl ||
      report.homepageScreenshotUrl ||
      report.og_image_url ||
      report.open_graph_image_url ||
      report.preview_image_url ||
      report.homepage_screenshot_url ||
      "",
  );

  return {
    found: Boolean(token),
    token,
    reportToken: token,
    domain: domainKey || String(report.domain || ""),
    normalizedDomain: domainKey,
    domainSlug,
    domain_slug: domainSlug,
    reportUrl: String(report.reportUrl || report.report_url || ""),
    ogImageUrl,
    openGraphImageUrl: String(report.openGraphImageUrl || ogImageUrl || ""),
    previewImageUrl: String(report.previewImageUrl || ogImageUrl || ""),
    homepageScreenshotUrl: String(report.homepageScreenshotUrl || ogImageUrl || ""),
    ogImagePathname: String(report.ogImagePathname || report.og_image_pathname || report.previewImagePathname || report.preview_image_pathname || ""),
    pdfFileId: String(report.pdfFileId || report.pdf_file_id || report.blobPathname || report.blob_pathname || ""),
    pdfViewUrl: String(report.pdfViewUrl || report.pdf_view_url || report.blobUrl || report.blob_url || ""),
    pdfDownloadUrl: String(report.pdfDownloadUrl || report.pdf_download_url || report.blobDownloadUrl || report.blob_download_url || ""),
    pdfExpiresAt: report.pdfExpiresAt || report.pdf_expires_at || "",
    blobPathname: String(report.blobPathname || report.blob_pathname || report.pdfFileId || report.pdf_file_id || ""),
    blobUrl: String(report.blobUrl || report.blob_url || report.pdfViewUrl || report.pdf_view_url || ""),
    blobDownloadUrl: String(report.blobDownloadUrl || report.blob_download_url || report.pdfDownloadUrl || report.pdf_download_url || ""),
    active: report.active !== false,
    reportReady: report.reportReady !== false,
    source: "audit_reports_lookup",
  };
}

async function readReportDocByTokenForReports(tokenRaw: any): Promise<AnyRecord | null> {
  const token = normalizeReportToken(tokenRaw);
  if (!token) return null;

  const snap = await adminDb.collection("audit_reports").doc(token).get();
  if (!snap.exists) return null;

  const report = snap.data() || {};
  if (report.active === false) return null;

  return serializeResolvedReportForReports(report, token);
}

async function resolveReportFromDomainIndexForReports(domainKey: string): Promise<AnyRecord | null> {
  if (!domainKey) return null;

  const indexSnap = await adminDb.collection("audit_report_domains").doc(domainKey).get();
  if (!indexSnap.exists) return null;

  const indexData = indexSnap.data() || {};
  const token = normalizeReportToken(indexData.token || indexData.reportToken || indexData.report_token);
  if (!token) return null;

  const report = await readReportDocByTokenForReports(token);
  if (report) {
    return {
      ...report,
      source: "audit_report_domains_index",
    };
  }

  return null;
}

async function queryReportsByFieldForReports(field: string, value: any): Promise<AnyRecord[]> {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return [];

  const snap = await adminDb.collection("audit_reports").where(field, "==", cleanValue).limit(20).get();
  const reports: AnyRecord[] = [];

  snap.forEach((doc: any) => {
    const data = doc.data() || {};
    if (data.active === false) return;
    reports.push({
      ...serializeResolvedReportForReports(data, doc.id),
      _sortMs: reportSortMsForReports(data),
      _docId: doc.id,
      source: `audit_reports_${field}`,
    });
  });

  return reports;
}

async function findExistingReportByDomainForReports(body: AnyRecord = {}): Promise<AnyRecord> {
  const domainKey = normalizeDomainKeyForReports(
    body.normalizedDomain,
    body.normalized_domain,
    body.domain,
    body.websiteUrl,
    body.website_url,
    body.website,
    body.url,
  );
  const domainSlug = normalizeReportSlug(body.domainSlug || body.domain_slug || domainKey || body.domain || body.websiteUrl || "website");
  const websiteHttps = domainKey ? `https://${domainKey}` : "";
  const websiteHttp = domainKey ? `http://${domainKey}` : "";

  const indexed = await resolveReportFromDomainIndexForReports(domainKey);
  if (indexed) {
    return {
      ...indexed,
      found: true,
      domainSlug: indexed.domainSlug || domainSlug,
      domain_slug: indexed.domain_slug || domainSlug,
    };
  }

  const candidates = [
    ...(await queryReportsByFieldForReports("domain", domainKey)),
    ...(await queryReportsByFieldForReports("normalizedDomain", domainKey)),
    ...(await queryReportsByFieldForReports("normalized_domain", domainKey)),
    ...(await queryReportsByFieldForReports("websiteUrl", websiteHttps)),
    ...(await queryReportsByFieldForReports("websiteUrl", websiteHttp)),
    ...(await queryReportsByFieldForReports("website_url", websiteHttps)),
    ...(await queryReportsByFieldForReports("website_url", websiteHttp)),
    ...(await queryReportsByFieldForReports("domainSlug", domainSlug)),
    ...(await queryReportsByFieldForReports("domain_slug", domainSlug)),
  ];

  const unique = new Map<string, AnyRecord>();
  for (const candidate of candidates) {
    const token = normalizeReportToken(candidate.token || candidate.reportToken);
    if (!token) continue;
    unique.set(token, candidate);
  }

  const sorted = Array.from(unique.values()).sort((a, b) => Number(b._sortMs || 0) - Number(a._sortMs || 0));
  const best = sorted[0];

  if (!best) {
    return {
      success: true,
      found: false,
      token: "",
      reportToken: "",
      reportUrl: "",
      ogImageUrl: "",
      openGraphImageUrl: "",
      previewImageUrl: "",
      homepageScreenshotUrl: "",
      ogImagePathname: "",
      domain: domainKey,
      normalizedDomain: domainKey,
      domainSlug,
      domain_slug: domainSlug,
      pdfFileId: "",
      pdfViewUrl: "",
      pdfDownloadUrl: "",
      blobPathname: "",
      source: "no_existing_report_for_domain",
    };
  }

  const resolvedToken = normalizeReportToken(best.token || best.reportToken || best.report_token || best._docId || "");
  const resolvedDomainSlug = String(best.domainSlug || best.domain_slug || domainSlug || "website");

  const resolved: AnyRecord = {
    ...best,
    found: Boolean(resolvedToken),
    token: resolvedToken,
    reportToken: resolvedToken,
    domain: best.domain || domainKey,
    normalizedDomain: domainKey,
    domainSlug: resolvedDomainSlug,
    domain_slug: resolvedDomainSlug,
  };

  if (domainKey && resolvedToken) {
    await adminDb.collection("audit_report_domains").doc(domainKey).set(
      {
        token: resolvedToken,
        reportToken: resolvedToken,
        reportUrl: String(resolved.reportUrl || ""),
        ogImageUrl: String(resolved.ogImageUrl || ""),
        openGraphImageUrl: String(resolved.openGraphImageUrl || resolved.ogImageUrl || ""),
        previewImageUrl: String(resolved.previewImageUrl || resolved.ogImageUrl || ""),
        homepageScreenshotUrl: String(resolved.homepageScreenshotUrl || resolved.ogImageUrl || ""),
        ogImagePathname: String(resolved.ogImagePathname || ""),
        domain: domainKey,
        normalizedDomain: domainKey,
        domainSlug: resolvedDomainSlug,
        domain_slug: resolvedDomainSlug,
        pdfFileId: String(resolved.pdfFileId || ""),
        pdfViewUrl: String(resolved.pdfViewUrl || ""),
        pdfDownloadUrl: String(resolved.pdfDownloadUrl || ""),
        blobPathname: String(resolved.blobPathname || ""),
        source: "backfilled_from_catch_all_route_lookup",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return resolved;
}

async function handleResolveExistingReportForReports(body: AnyRecord = {}) {
  const resolved = await findExistingReportByDomainForReports(body);

  return json({
    success: true,
    mode: "resolve_existing_report",
    resolveOnly: true,
    ...resolved,
  });
}


function pickReportRegisterDebugFields(value: AnyRecord = {}): AnyRecord {
  const raw = value || {};
  const secureAssets = Array.isArray(raw.securePageEvidenceAssets || raw.secure_page_evidence_assets)
    ? (raw.securePageEvidenceAssets || raw.secure_page_evidence_assets)
    : [];
  return {
    token: String(raw.token || raw.reportToken || raw.report_token || ""),
    domain: String(raw.domain || raw.websiteUrl || raw.website_url || raw.website || ""),
    domainSlug: String(raw.domainSlug || raw.domain_slug || ""),
    reportUrl: String(raw.reportUrl || raw.report_url || ""),
    pdfViewUrl: String(raw.pdfViewUrl || raw.pdf_view_url || raw.blobUrl || raw.blob_url || ""),
    pdfDownloadUrl: String(raw.pdfDownloadUrl || raw.pdf_download_url || raw.blobDownloadUrl || raw.blob_download_url || ""),
    blobPathname: String(raw.blobPathname || raw.blob_pathname || raw.pdfFileId || raw.pdf_file_id || ""),
    ogImageUrl: String(raw.ogImageUrl || raw.og_image_url || ""),
    openGraphImageUrl: String(raw.openGraphImageUrl || raw.open_graph_image_url || ""),
    previewImageUrl: String(raw.previewImageUrl || raw.preview_image_url || ""),
    homepageScreenshotUrl: String(raw.homepageScreenshotUrl || raw.homepage_screenshot_url || ""),
    emailPreviewImageUrl: String(
      raw.emailPreviewImageUrl ||
        raw.email_preview_image_url ||
        raw.emailPreviewImage?.publicUrl ||
        raw.emailPreviewImage?.public_url ||
        "",
    ),
    emailPreviewImageB2Key: String(
      raw.emailPreviewImageB2Key ||
        raw.email_preview_image_b2_key ||
        raw.emailPreviewImage?.b2Key ||
        raw.emailPreviewImage?.b2_key ||
        "",
    ),
    emailPreviewImageMimeType: String(
      raw.emailPreviewImageMimeType ||
        raw.email_preview_image_mime_type ||
        raw.emailPreviewImage?.mimeType ||
        raw.emailPreviewImage?.mime_type ||
        "",
    ),
    emailPreviewImageSizeBytes:
      Number(
        raw.emailPreviewImageSizeBytes ||
          raw.email_preview_image_size_bytes ||
          raw.emailPreviewImage?.sizeBytes ||
          raw.emailPreviewImage?.size_bytes ||
          0,
      ) || 0,
    securePageEvidenceAssetCount: secureAssets.length,
    securePageEvidenceRoles: secureAssets.map((item: AnyRecord) => String(item?.role || item?.type || "")).filter(Boolean),
    ogImagePathname: String(raw.ogImagePathname || raw.og_image_pathname || raw.previewImagePathname || raw.preview_image_pathname || ""),
    hasPrivateReportCopy: Boolean(raw.privateReportCopy || raw.private_report_copy),
    hasHeavyDuplicates: Boolean(raw.privateReportCopy || raw.private_report_copy || raw.business_problems || raw.verification_plan || raw.website_speed || raw.manual_ads_transparency),
  };
}


function normalizeEmailPreviewB2KeyForRegister(value: any): string {
  return cleanCell(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function isEmailPreviewB2KeyScopedToReportForRegister(key: string, token: string): boolean {
  const normalizedKey = normalizeEmailPreviewB2KeyForRegister(key);
  const normalizedToken = normalizeReportToken(token);
  if (!normalizedKey || !normalizedToken || normalizedKey.includes("..")) return false;
  return normalizedKey.startsWith("reports/") && normalizedKey.includes(`/${normalizedToken}/email-preview/`);
}

function normalizeEmailPreviewImageForRegister(rawValue: any, fallback: AnyRecord = {}): AnyRecord | null {
  const raw = rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
    ? (rawValue as AnyRecord)
    : {};
  const b2Key = normalizeEmailPreviewB2KeyForRegister(
    firstCleanString(raw.b2Key, raw.b2_key, fallback.b2Key, fallback.b2_key),
  );
  const publicUrl = sanitizeOptionalUrl(
    firstCleanString(raw.publicUrl, raw.public_url, raw.url, fallback.publicUrl, fallback.public_url),
  );
  if (!b2Key && !publicUrl) return null;

  const mimeType = firstCleanString(
    raw.mimeType,
    raw.mime_type,
    fallback.mimeType,
    fallback.mime_type,
    "image/webp",
  ).toLowerCase();
  const sizeBytes =
    Number(raw.sizeBytes || raw.size_bytes || fallback.sizeBytes || fallback.size_bytes || 0) || 0;
  const fileName = firstCleanString(
    raw.fileName,
    raw.file_name,
    fallback.fileName,
    fallback.file_name,
    "email-preview-thumbnail.webp",
  );
  const pageUrl = sanitizeOptionalUrl(
    firstCleanString(raw.pageUrl, raw.page_url, fallback.pageUrl, fallback.page_url),
  );
  const uploadedAt = firstCleanString(
    raw.uploadedAt,
    raw.uploaded_at,
    raw.createdAt,
    raw.created_at,
    fallback.uploadedAt,
    fallback.uploaded_at,
  );

  return {
    id: firstCleanString(raw.id, fallback.id, "email_preview_thumbnail"),
    role: firstCleanString(raw.role, fallback.role, "email_preview_thumbnail"),
    caption: firstCleanString(
      raw.caption,
      raw.title,
      fallback.caption,
      "Clickable email preview thumbnail",
    ),
    fileName,
    file_name: fileName,
    mimeType,
    mime_type: mimeType,
    sizeBytes,
    size_bytes: sizeBytes,
    pageUrl,
    page_url: pageUrl,
    source: firstCleanString(raw.source, fallback.source, "manual_email_preview_upload"),
    storageProvider: firstCleanString(
      raw.storageProvider,
      raw.storage_provider,
      fallback.storageProvider,
      fallback.storage_provider,
      "backblaze_b2",
    ),
    storage_provider: firstCleanString(
      raw.storageProvider,
      raw.storage_provider,
      fallback.storageProvider,
      fallback.storage_provider,
      "backblaze_b2",
    ),
    b2Bucket: firstCleanString(
      raw.b2Bucket,
      raw.b2_bucket,
      raw.bucket,
      fallback.b2Bucket,
      fallback.b2_bucket,
    ),
    b2_bucket: firstCleanString(
      raw.b2Bucket,
      raw.b2_bucket,
      raw.bucket,
      fallback.b2Bucket,
      fallback.b2_bucket,
    ),
    b2Key,
    b2_key: b2Key,
    etag: firstCleanString(raw.etag, raw.eTag, raw.b2Etag, raw.b2_etag, fallback.etag),
    uploadedAt,
    uploaded_at: uploadedAt,
    redacted: raw.redacted !== false,
    publicUrl,
    public_url: publicUrl,
    optimized: Boolean(raw.optimized ?? fallback.optimized),
    optimizationFormat: firstCleanString(
      raw.optimizationFormat,
      raw.optimization_format,
      fallback.optimizationFormat,
      fallback.optimization_format,
    ),
    optimization_format: firstCleanString(
      raw.optimizationFormat,
      raw.optimization_format,
      fallback.optimizationFormat,
      fallback.optimization_format,
    ),
    note: firstCleanString(
      raw.note,
      fallback.note,
      "Email-only preview thumbnail metadata. This is not secure-page proof evidence.",
    ),
  };
}

function resolveEmailPreviewImageForRegister(
  report: AnyRecord = {},
  existingData: AnyRecord = {},
): {
  asset: AnyRecord | null;
  url: string;
  webpUrl: string;
  b2Key: string;
  mimeType: string;
  sizeBytes: number;
  hasIncoming: boolean;
  hasExisting: boolean;
} {
  const incomingAsset = normalizeEmailPreviewImageForRegister(
    report.emailPreviewImage || report.email_preview_image,
    {
      b2Key: report.emailPreviewImageB2Key || report.email_preview_image_b2_key,
      publicUrl:
        report.emailPreviewImageUrl ||
        report.email_preview_image_url ||
        report.emailPreviewImageWebpUrl ||
        report.email_preview_image_webp_url,
      mimeType: report.emailPreviewImageMimeType || report.email_preview_image_mime_type,
      sizeBytes: report.emailPreviewImageSizeBytes || report.email_preview_image_size_bytes,
    },
  );

  const existingAsset = normalizeEmailPreviewImageForRegister(
    existingData.emailPreviewImage || existingData.email_preview_image,
    {
      b2Key: existingData.emailPreviewImageB2Key || existingData.email_preview_image_b2_key,
      publicUrl:
        existingData.emailPreviewImageUrl ||
        existingData.email_preview_image_url ||
        existingData.emailPreviewImageWebpUrl ||
        existingData.email_preview_image_webp_url,
      mimeType: existingData.emailPreviewImageMimeType || existingData.email_preview_image_mime_type,
      sizeBytes: existingData.emailPreviewImageSizeBytes || existingData.email_preview_image_size_bytes,
    },
  );

  const hasIncoming = Boolean(
    report.emailPreviewImage ||
      report.email_preview_image ||
      report.emailPreviewImageUrl ||
      report.email_preview_image_url ||
      report.emailPreviewImageB2Key ||
      report.email_preview_image_b2_key,
  );
  const selected = incomingAsset || existingAsset;
  const url = sanitizeOptionalUrl(
    firstCleanString(
      hasIncoming ? report.emailPreviewImageUrl : "",
      hasIncoming ? report.email_preview_image_url : "",
      selected?.publicUrl,
      selected?.public_url,
      existingData.emailPreviewImageUrl,
      existingData.email_preview_image_url,
    ),
  );
  const webpUrl = sanitizeOptionalUrl(
    firstCleanString(
      hasIncoming ? report.emailPreviewImageWebpUrl : "",
      hasIncoming ? report.email_preview_image_webp_url : "",
      selected?.mimeType === "image/webp" ? selected?.publicUrl || selected?.public_url : "",
      existingData.emailPreviewImageWebpUrl,
      existingData.email_preview_image_webp_url,
    ),
  );
  const b2Key = normalizeEmailPreviewB2KeyForRegister(
    firstCleanString(
      selected?.b2Key,
      selected?.b2_key,
      existingData.emailPreviewImageB2Key,
      existingData.email_preview_image_b2_key,
    ),
  );
  const mimeType = firstCleanString(
    selected?.mimeType,
    selected?.mime_type,
    existingData.emailPreviewImageMimeType,
    existingData.email_preview_image_mime_type,
  ).toLowerCase();
  const sizeBytes =
    Number(
      selected?.sizeBytes ||
        selected?.size_bytes ||
        existingData.emailPreviewImageSizeBytes ||
        existingData.email_preview_image_size_bytes ||
        0,
    ) || 0;

  const asset = selected
    ? {
        ...selected,
        publicUrl: url || selected.publicUrl || selected.public_url || "",
        public_url: url || selected.publicUrl || selected.public_url || "",
        b2Key,
        b2_key: b2Key,
        mimeType,
        mime_type: mimeType,
        sizeBytes,
        size_bytes: sizeBytes,
      }
    : null;

  return {
    asset,
    url,
    webpUrl,
    b2Key,
    mimeType,
    sizeBytes,
    hasIncoming,
    hasExisting: Boolean(existingAsset),
  };
}

function normalizeSecurePageEvidenceAssetsForRegister(...values: any[]): AnyRecord[] {
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  const collect = (value: any) => {
    const rawItems = Array.isArray(value) ? value : [];
    for (const [index, item] of rawItems.entries()) {
      const raw = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
      const b2Key = cleanCell(raw.b2Key || raw.b2_key || raw.storageKey || raw.storage_key || raw.key || "");
      if (!b2Key || seen.has(b2Key.toLowerCase())) continue;
      seen.add(b2Key.toLowerCase());

      const id = cleanCell(raw.id || raw.assetId || raw.asset_id || `asset_${output.length + 1}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96) || `asset_${output.length + 1}`;
      const role = cleanCell(raw.role || raw.kind || raw.type || "browser_side_proof").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "browser_side_proof";
      const fileName = cleanCell(raw.fileName || raw.file_name || raw.name || "secure-page-evidence.png").replace(/[\r\n"]/g, "").slice(0, 180);
      const mimeType = cleanCell(raw.mimeType || raw.mime_type || raw.contentType || raw.content_type || "image/png").toLowerCase().slice(0, 80);
      const sizeBytes = Number(raw.sizeBytes || raw.size_bytes || raw.size || raw.contentLength || raw.content_length || 0) || 0;
      const pageUrl = sanitizeOptionalUrl(cleanCell(raw.pageUrl || raw.page_url || raw.url || raw.testUrl || raw.test_url || ""));
      const caption = cleanCell(raw.caption || raw.title || raw.label || "Browser-side evidence screenshot").replace(/\s+/g, " " ).slice(0, 240);
      const bucket = cleanCell(raw.b2Bucket || raw.b2_bucket || raw.bucket || "");

      output.push({
        id,
        role,
        caption,
        fileName,
        file_name: fileName,
        mimeType,
        mime_type: mimeType,
        sizeBytes,
        size_bytes: sizeBytes,
        pageUrl,
        page_url: pageUrl,
        source: cleanCell(raw.source || "manual_secure_page_evidence_upload").slice(0, 120),
        storageProvider: cleanCell(raw.storageProvider || raw.storage_provider || "backblaze_b2"),
        storage_provider: cleanCell(raw.storageProvider || raw.storage_provider || "backblaze_b2"),
        b2Bucket: bucket,
        b2_bucket: bucket,
        b2Key,
        b2_key: b2Key,
        etag: cleanCell(raw.etag || raw.eTag || raw.b2Etag || raw.b2_etag || ""),
        uploadedAt: cleanCell(raw.uploadedAt || raw.uploaded_at || raw.createdAt || raw.created_at || ""),
        uploaded_at: cleanCell(raw.uploadedAt || raw.uploaded_at || raw.createdAt || raw.created_at || ""),
        redacted: raw.redacted !== false,
        displayOrder: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
        display_order: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
        publicUrl: sanitizeOptionalUrl(cleanCell(raw.publicUrl || raw.public_url || raw.proxyUrl || raw.proxy_url || "")),
        public_url: sanitizeOptionalUrl(cleanCell(raw.publicUrl || raw.public_url || raw.proxyUrl || raw.proxy_url || "")),
        note: cleanCell(raw.note || "Private evidence image metadata only. Rendering can be enabled on the secure page UI separately.").replace(/\s+/g, " " ).slice(0, 260),
      });

      if (output.length >= 12) return;
    }
  };

  for (const value of values) {
    collect(value);
    if (output.length >= 12) break;
  }

  return output;
}

function logReportRegisterDebug(stage: string, details: AnyRecord = {}) {
  try {
    console.log(
      "[TFP_REPORT_REGISTER_DEBUG]",
      JSON.stringify({
        version: TFP_REPORT_REGISTER_DEBUG_VERSION,
        stage,
        ...details,
      }),
    );
  } catch {
    console.log("[TFP_REPORT_REGISTER_DEBUG]", TFP_REPORT_REGISTER_DEBUG_VERSION, stage, details);
  }
}

async function handleReportDebug(req: Request) {
  await requireReportRegisterAccess(req);
  const url = new URL(req.url);
  const token = normalizeReportToken(url.searchParams.get("token") || url.searchParams.get("reportToken") || "");
  const domainKey = normalizeDomainKeyForReports(
    url.searchParams.get("domain") || "",
    url.searchParams.get("websiteUrl") || "",
  );

  let reportData: AnyRecord | null = null;
  let reportExists = false;
  if (token) {
    const reportSnap = await adminDb.collection("audit_reports").doc(token).get();
    reportExists = reportSnap.exists;
    reportData = reportSnap.exists ? reportSnap.data() || {} : null;
  }

  let domainIndexData: AnyRecord | null = null;
  let domainIndexExists = false;
  if (domainKey) {
    const indexSnap = await adminDb.collection("audit_report_domains").doc(domainKey).get();
    domainIndexExists = indexSnap.exists;
    domainIndexData = indexSnap.exists ? indexSnap.data() || {} : null;
  }

  logReportRegisterDebug("debug_endpoint", {
    token,
    domainKey,
    reportExists,
    domainIndexExists,
    report: pickReportRegisterDebugFields(reportData || {}),
    domainIndex: pickReportRegisterDebugFields(domainIndexData || {}),
  });

  return json({
    success: true,
    action: "reports/debug",
    debugVersion: TFP_REPORT_REGISTER_DEBUG_VERSION,
    token,
    domainKey,
    reportExists,
    report: pickReportRegisterDebugFields(reportData || {}),
    domainIndexExists,
    domainIndex: pickReportRegisterDebugFields(domainIndexData || {}),
    rawReportKeys: reportData ? Object.keys(reportData).sort() : [],
    rawDomainIndexKeys: domainIndexData ? Object.keys(domainIndexData).sort() : [],
  });
}



function isRegisterFirestoreSpecialValue(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  const ctorName = String(value?.constructor?.name || "");
  return (
    ctorName.includes("FieldValue") ||
    ctorName.includes("Timestamp") ||
    ctorName.includes("DocumentReference") ||
    ctorName.includes("GeoPoint") ||
    typeof value?.toDate === "function" ||
    typeof value?.toMillis === "function" ||
    typeof value?.isEqual === "function" && ("seconds" in value || "nanoseconds" in value)
  );
}

function sanitizeRegisterFirestoreValue(value: any, depth = 0): any {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return String(value);
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (isRegisterFirestoreSpecialValue(value)) return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (depth > 16) return null;

  if (Array.isArray(value)) {
    const arr = value
      .map((item) => sanitizeRegisterFirestoreValue(item, depth + 1))
      .filter((item) => item !== undefined);
    return arr;
  }

  if (typeof value === "object") {
    const output: AnyRecord = {};
    for (const [key, item] of Object.entries(value as AnyRecord)) {
      if (!key || item === undefined) continue;
      const cleanItem = sanitizeRegisterFirestoreValue(item, depth + 1);
      if (cleanItem === undefined) continue;
      output[key] = cleanItem;
    }
    return output;
  }

  return value;
}

function sanitizeRegisterFirestoreObject(value: AnyRecord = {}): AnyRecord {
  const cleanValue = sanitizeRegisterFirestoreValue(value, 0);
  return cleanValue && typeof cleanValue === "object" && !Array.isArray(cleanValue) ? cleanValue as AnyRecord : {};
}

function stripEmailPreviewFieldsForRegisterRetry(payload: AnyRecord, deleteField: any): AnyRecord {
  const next: AnyRecord = {
    ...payload,
    emailPreviewImage: null,
    email_preview_image: null,
    emailPreviewImageUrl: "",
    email_preview_image_url: "",
    emailPreviewImageWebpUrl: "",
    email_preview_image_webp_url: "",
    emailPreviewImageB2Key: "",
    email_preview_image_b2_key: "",
    emailPreviewImageMimeType: "",
    email_preview_image_mime_type: "",
    emailPreviewImageSizeBytes: 0,
    email_preview_image_size_bytes: 0,
    emailPreviewImageUpdatedAt: deleteField,
  };
  return next;
}

async function setAuditReportPayloadResilient(input: {
  reportRef: any;
  payload: AnyRecord;
  reportToken: string;
  deleteField: any;
}) {
  const safePayload = sanitizeRegisterFirestoreObject(input.payload);
  try {
    await input.reportRef.set(safePayload, { merge: true });
    return { payload: safePayload, emailPreviewPersisted: true, fallbackUsed: false };
  } catch (error: any) {
    logReportRegisterDebug("firestore_primary_set_failed", {
      docPath: `audit_reports/${input.reportToken}`,
      error: error?.message || String(error || ""),
      payloadKeys: Object.keys(safePayload).sort(),
      hasEmailPreviewImage: Boolean(safePayload.emailPreviewImage || safePayload.emailPreviewImageUrl || safePayload.emailPreviewImageB2Key),
      retry: "strip_email_preview_metadata_once",
    });

    const retryPayload = sanitizeRegisterFirestoreObject(
      stripEmailPreviewFieldsForRegisterRetry(input.payload, input.deleteField),
    );
    await input.reportRef.set(retryPayload, { merge: true });
    logReportRegisterDebug("firestore_retry_without_email_preview_succeeded", {
      docPath: `audit_reports/${input.reportToken}`,
      payloadKeys: Object.keys(retryPayload).sort(),
      note: "Secure report was registered. Email preview metadata was skipped because Firestore rejected the primary payload.",
    });
    return { payload: retryPayload, emailPreviewPersisted: false, fallbackUsed: true };
  }
}

async function handleReportRegister(req: Request) {
  await requireReportRegisterAccess(req);
  const requestUrl = new URL(req.url);
  const debugRequested =
    requestUrl.searchParams.get("debug") === "1" ||
    requestUrl.searchParams.get("debug") === "true";
  const rawBody = await readJson(req);
  const body = rawBody?.report || rawBody;

  logReportRegisterDebug("incoming_request", {
    path: requestUrl.pathname,
    debugRequested,
    rawHasReportWrapper: Boolean(rawBody?.report),
    rawKeys: rawBody && typeof rawBody === "object" ? Object.keys(rawBody).sort() : [],
    bodyKeys: body && typeof body === "object" ? Object.keys(body).sort() : [],
    incoming: pickReportRegisterDebugFields(body || {}),
  });

  if (body?.resolveOnly === true || body?.mode === "resolve_existing_report") {
    logReportRegisterDebug("resolve_only_request", {
      incoming: pickReportRegisterDebugFields(body || {}),
    });
    return await handleResolveExistingReportForReports(body || {});
  }

  const report = normalizeReportPayload(body || {});

  logReportRegisterDebug("normalized_report", {
    normalized: pickReportRegisterDebugFields(report || {}),
    hasOgImageUrl: Boolean(report.ogImageUrl),
    hasHomepageScreenshotUrl: Boolean(report.homepageScreenshotUrl),
    hasPdfViewUrl: Boolean(report.pdfViewUrl),
    secureEvidence: {
      incomingCount: Array.isArray(body?.securePageEvidenceAssets || body?.secure_page_evidence_assets) ? (body.securePageEvidenceAssets || body.secure_page_evidence_assets).length : 0,
      normalizedCount: Array.isArray(report.securePageEvidenceAssets || report.secure_page_evidence_assets) ? (report.securePageEvidenceAssets || report.secure_page_evidence_assets).length : 0,
    },
    manualEvidence: {
      incoming: {
        hasManualConversionEvidence: Boolean(body?.manualConversionEvidence || body?.manual_conversion_evidence),
        hasManualEvidenceHero: Boolean(body?.manualEvidenceHero || body?.manual_evidence_hero),
      },
      normalized: {
        hasManualConversionEvidence: Boolean(report.manualConversionEvidence),
        hasManualEvidenceHero: Boolean(report.manualEvidenceHero),
        auditSnapshotTitle: String(report.auditSnapshotTitle || ""),
        auditSnapshotQuestionsCount: Array.isArray(report.auditSnapshotQuestions) ? report.auditSnapshotQuestions.length : 0,
      },
    },
  });

  if (!report.domain && !report.websiteUrl) {
    throw new ApiError("domain or websiteUrl is required for report registration", 400);
  }
  if (!report.companyName) {
    throw new ApiError("companyName or businessName is required for report registration", 400);
  }
  if (!report.pdfViewUrl && !report.pdfDownloadUrl) {
    throw new ApiError("pdfViewUrl or pdfDownloadUrl is required", 400);
  }
  if (!report.reportUrl || isLocalOrUnsafeReportUrl(report.reportUrl)) {
    throw new ApiError("A secure public reportUrl is required. Use NEXT_PUBLIC_APP_URL/tracking-review/{domainSlug}/{token}, not localhost or a direct PDF URL.", 400);
  }

  const reportRef = adminDb.collection("audit_reports").doc(report.token);
  const existing = await reportRef.get();
  const existingData = existing.exists ? existing.data() || {} : {};
  const deleteField = admin.firestore.FieldValue.delete();
  const normalizedDomain = normalizeDomainKeyForReports(report.domain, report.websiteUrl);

  const previewImageUrl = report.previewImageUrl || report.ogImageUrl || report.openGraphImageUrl || report.homepageScreenshotUrl || "";
  const pdfStorageKey = report.pdfStorageKey || report.b2Key || report.blobPathname || report.pdfFileId;
  const legacyReportFieldsToDelete = [
    "domain_slug",
    "normalized_domain",
    "email",
    "ogImageUrl",
    "og_image_url",
    "openGraphImageUrl",
    "open_graph_image_url",
    "homepageScreenshotUrl",
    "homepage_screenshot_url",
    "preview_image_url",
    "previewImagePathname",
    "preview_image_pathname",
    "recommendations",
    "businessProblems",
    "business_problems",
    "verification_plan",
    "websiteSpeed",
    "website_speed",
    "ctaInteractionTest",
    "cta_interaction_test",
    "what_checked",
    "proof_points",
    "privateReportCopy",
    "private_report_copy",
    "securePageCopy",
    "secure_page_copy",
    "manualAdsTransparency",
    "manual_ads_transparency",
    "manual_ads_checked",
    "manual_ads_found",
    "manual_ads_source",
    "manual_ads_note",
    "manual_ads_checked_at",
    "pdfFileId",
    "pdf_file_id",
    "blobUrl",
    "blob_url",
    "blobDownloadUrl",
    "blob_download_url",
    "blobPathname",
    "blob_pathname",
    "b2Key",
    "b2_key",
    "b2Bucket",
    "b2_bucket",
    "pdf_storage_key",
    "pdf_storage_etag",
    "pdf_storage_size",
    "sourceType",
    "source_type",
    "outreachChannel",
    "outreach_channel",
    "leadSource",
    "lead_source",
    "emailValid",
    "email_valid",
    "emailOutreachAllowed",
    "email_outreach_allowed",
    "linkedinOutreachAllowed",
    "linkedin_outreach_allowed",
    "auditSource",
    "audit_source",
    "sourceContext",
    "source_context",
    "linkedinProfileUrl",
    "linkedin_profile_url",
    "linkedinCompanyUrl",
    "linkedin_company_url",
    "linkedinContactName",
    "linkedin_contact_name",
    "emailCopy",
    "email_copy",
    "emailDraft",
    "email_draft",
    "emailSubject",
    "email_subject",
    "emailBody",
    "email_body",
    "linkedinMessageCopy",
    "linkedin_message_copy",
    "linkedinMessage",
    "linkedin_message",
    "outreachCopy",
    "outreach_copy",
    "outreachMessage",
    "outreach_message",
    "clientCopyContext",
    "client_copy_context",
    "rawGeminiResponse",
    "raw_gemini_response",
    "emailOpenCount",
    "email_open_count",
    "emailClickCount",
    "email_click_count",
    "lastEmailOpenedAt",
    "last_email_opened_at",
    "lastEmailClickedAt",
    "last_email_clicked_at",
    "lastEmailClickedUrl",
    "last_email_clicked_url",
    "lastEmailEngagedAt",
    "last_email_engaged_at",
    "lastEngagedAt",
    "engagementSource",
    "engagement_source",
    "lastEmailRecipient",
    "lastEmailLeadId",
    "lastEmailMessageId",
    "lastEmailTrackingId",
    "lastEmailTrackingTag",
    "reportEmailStatus",
    "report_email_status",
  ];

  const sourceText = String(report.source || body?.source || "").toLowerCase();
  const tfpV2749RegisterMode = String(report.reportMode || report.report_mode || report.trackingCase?.mode || report.tracking_case?.mode || body?.reportMode || body?.report_mode || body?.trackingCase?.mode || body?.tracking_case?.mode || "").trim();
  const tfpV2749SetupFirstRegister = TFP_V2749_SETUP_FIRST_MODES.has(tfpV2749RegisterMode);
  const rawIncomingManualConversionEvidence =
    report.manualConversionEvidence ||
    body?.manualConversionEvidence ||
    body?.manual_conversion_evidence ||
    report.privateReportCopy?.manualConversionEvidence ||
    report.privateReportCopy?.manual_conversion_evidence ||
    null;
  const rawIncomingManualEvidenceHero = tfpV2749SetupFirstRegister
    ? null
    : (
      report.manualEvidenceHero ||
      body?.manualEvidenceHero ||
      body?.manual_evidence_hero ||
      report.privateReportCopy?.manualEvidenceHero ||
      report.privateReportCopy?.manual_evidence_hero ||
      null
    );
  const incomingManualConversionEvidence = rawIncomingManualConversionEvidence && typeof rawIncomingManualConversionEvidence === "object"
    ? rawIncomingManualConversionEvidence
    : null;
  const incomingManualEvidenceHero = rawIncomingManualEvidenceHero && typeof rawIncomingManualEvidenceHero === "object"
    ? rawIncomingManualEvidenceHero
    : null;
  const shouldPreserveExistingManualEvidence =
    !tfpV2749SetupFirstRegister &&
    !incomingManualConversionEvidence &&
    Boolean(existingData.manualConversionEvidence || existingData.manualEvidenceHero) &&
    /video|youtube|evidence_video|attach/.test(sourceText);
  const nextManualConversionEvidence = incomingManualConversionEvidence || (shouldPreserveExistingManualEvidence ? existingData.manualConversionEvidence : null);
  const nextManualEvidenceHero = tfpV2749SetupFirstRegister ? null : (incomingManualEvidenceHero || (shouldPreserveExistingManualEvidence ? existingData.manualEvidenceHero : null));
  logReportRegisterDebug("manual_evidence_firestore_resolution", {
    source: sourceText,
    incoming: {
      hasManualConversionEvidence: Boolean(incomingManualConversionEvidence),
      hasManualEvidenceHero: Boolean(incomingManualEvidenceHero),
    },
    existing: {
      hasManualConversionEvidence: Boolean(existingData.manualConversionEvidence),
      hasManualEvidenceHero: Boolean(existingData.manualEvidenceHero),
    },
    resolved: {
      hasManualConversionEvidence: Boolean(nextManualConversionEvidence),
      hasManualEvidenceHero: Boolean(nextManualEvidenceHero),
      auditSnapshotTitle: String(report.auditSnapshotTitle || ""),
      auditSnapshotQuestionsCount: Array.isArray(report.auditSnapshotQuestions) ? report.auditSnapshotQuestions.length : 0,
    },
    preservedExistingManualEvidence: shouldPreserveExistingManualEvidence,
  });

  const cleanSecurePageEvidenceAssets = normalizeSecurePageEvidenceAssetsForRegister(
    report.securePageEvidenceAssets,
    report.secure_page_evidence_assets,
    body?.securePageEvidenceAssets,
    body?.secure_page_evidence_assets,
    report.privateReportCopy?.securePageEvidenceAssets,
    report.privateReportCopy?.secure_page_evidence_assets,
  );

  logReportRegisterDebug("secure_evidence_firestore_resolution", {
    incomingCount: Array.isArray(body?.securePageEvidenceAssets || body?.secure_page_evidence_assets) ? (body.securePageEvidenceAssets || body.secure_page_evidence_assets).length : 0,
    normalizedCount: cleanSecurePageEvidenceAssets.length,
    roles: cleanSecurePageEvidenceAssets.map((item) => String(item.role || "")),
    note: "Firestore stores B2 metadata only, never dataUrl/base64 image data.",
  });

  const cleanEmailPreviewImage = resolveEmailPreviewImageForRegister(report, existingData);
  let persistedEmailPreviewImage = cleanEmailPreviewImage;
  if (
    persistedEmailPreviewImage.b2Key &&
    !isEmailPreviewB2KeyScopedToReportForRegister(persistedEmailPreviewImage.b2Key, report.token)
  ) {
    throw new ApiError(
      "Email preview B2 key is not scoped to the current report token/email-preview folder.",
      400,
    );
  }
  if (
    cleanEmailPreviewImage.hasIncoming &&
    persistedEmailPreviewImage.url &&
    !persistedEmailPreviewImage.b2Key
  ) {
    throw new ApiError(
      "Email preview URL was provided without its private B2 key metadata.",
      400,
    );
  }

  logReportRegisterDebug("email_preview_firestore_resolution", {
    incoming: pickReportRegisterDebugFields(report || {}),
    existing: pickReportRegisterDebugFields(existingData || {}),
    resolved: {
      emailPreviewImageUrl: persistedEmailPreviewImage.url,
      emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
      preservedExisting:
        !cleanEmailPreviewImage.hasIncoming && cleanEmailPreviewImage.hasExisting,
    },
    note: "Email preview thumbnail is an email-only asset; it is not secure-page proof evidence.",
  });

  const payload: AnyRecord = {
    token: report.token,
    domainSlug: report.domainSlug,
    reportUrl: report.reportUrl,
    trackingCase: report.trackingCase || report.tracking_case || null,
    tracking_case: report.tracking_case || report.trackingCase || null,
    reportMode: report.reportMode || report.report_mode || "",
    report_mode: report.report_mode || report.reportMode || "",
    setupFirstOverrideApplied: Boolean(tfpV2749SetupFirstRegister),
    domain: normalizedDomain || report.domain,
    normalizedDomain,
    websiteUrl: report.websiteUrl,
    companyName: report.companyName,
    headline: report.headline,
    subheadline: report.subheadline,
    mainFinding: report.mainFinding,
    businessImpact: report.businessImpact,
    proofPoints: report.proofPoints,
    problemCards: report.problemCards,
    verificationPlan: report.verificationPlan,
    whatChecked: report.whatChecked,
    auditSnapshotTitle: report.auditSnapshotTitle,
    auditSnapshotQuestions: report.auditSnapshotQuestions,
    trustNotes: report.trustNotes,
    howToReadTitle: report.howToReadTitle,
    howToReadParagraphs: report.howToReadParagraphs,
    ctaHeadline: report.ctaHeadline,
    manualConversionEvidence: nextManualConversionEvidence || null,
    manual_conversion_evidence: deleteField,
    manualEvidenceHero: nextManualEvidenceHero || null,
    manual_evidence_hero: deleteField,
    previewImageUrl,
    emailPreviewImage: persistedEmailPreviewImage.asset || null,
    email_preview_image: persistedEmailPreviewImage.asset || null,
    emailPreviewImageUrl: persistedEmailPreviewImage.url,
    email_preview_image_url: persistedEmailPreviewImage.url,
    emailPreviewImageWebpUrl: persistedEmailPreviewImage.webpUrl,
    email_preview_image_webp_url: persistedEmailPreviewImage.webpUrl,
    emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
    email_preview_image_b2_key: persistedEmailPreviewImage.b2Key,
    emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
    email_preview_image_mime_type: persistedEmailPreviewImage.mimeType,
    emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
    email_preview_image_size_bytes: persistedEmailPreviewImage.sizeBytes,
    emailPreviewImageUpdatedAt: persistedEmailPreviewImage.asset
      ? admin.firestore.FieldValue.serverTimestamp()
      : deleteField,
    ogImagePathname: report.ogImagePathname,
    pdfViewUrl: report.pdfViewUrl,
    pdfDownloadUrl: report.pdfDownloadUrl,
    pdfStorageKey,
    pdfStorageEtag: report.pdfStorageEtag,
    pdfStorageSize: report.pdfStorageSize,
    pdfExpiresAt: report.pdfExpiresAt,
    leadId: report.leadId,
    sheetRowNumber: report.sheetRowNumber,
    source: report.source,
    sourceAuditId: report.auditId,
    storageProvider: report.storageProvider,
    contactEmail: report.contactEmail,
    contact_email: report.contactEmail,
    linkedinProfileUrl: report.linkedinProfileUrl,
    linkedin_profile_url: report.linkedinProfileUrl,
    linkedinUrl: report.linkedinUrl,
    linkedin_url: report.linkedinUrl,
    linkedinCompanyUrl: report.linkedinCompanyUrl,
    linkedin_company_url: report.linkedinCompanyUrl,
    linkedinContactName: report.linkedinContactName,
    linkedin_contact_name: report.linkedinContactName,
    ctaUrl: report.ctaUrl,
    ctaText: report.ctaText,
    active: body?.active === false ? false : true,
    reportReady: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRegisteredAt: admin.firestore.FieldValue.serverTimestamp(),
    viewCount: Number(existingData.viewCount || 0),
    downloadCount: Number(existingData.downloadCount || 0),
    ctaClickCount: Number(existingData.ctaClickCount || 0),
  };

  if (cleanSecurePageEvidenceAssets.length) {
    payload.securePageEvidenceAssets = cleanSecurePageEvidenceAssets;
    payload.secure_page_evidence_assets = cleanSecurePageEvidenceAssets;
    payload.securePageEvidenceAssetCount = cleanSecurePageEvidenceAssets.length;
    payload.secure_page_evidence_asset_count = cleanSecurePageEvidenceAssets.length;
    payload.securePageEvidenceUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  for (const field of legacyReportFieldsToDelete) {
    payload[field] = deleteField;
  }


  if (report.evidenceVideo?.clear) {
    payload.evidenceVideo = deleteField;
    payload.evidence_video = deleteField;
    payload.evidenceVideoUrl = deleteField;
    payload.evidence_video_url = deleteField;
    payload.evidenceVideoEmbedUrl = deleteField;
    payload.evidence_video_embed_url = deleteField;
    payload.evidenceVideoProvider = deleteField;
    payload.evidence_video_provider = deleteField;
    payload.evidenceVideoStatus = "removed";
    payload.evidence_video_status = deleteField;
    payload.evidenceVideoUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  } else if (report.evidenceVideo?.enabled && report.evidenceVideoEmbedUrl) {
    payload.evidenceVideo = report.evidenceVideo;
    payload.evidence_video = deleteField;
    payload.evidenceVideoUrl = report.evidenceVideoUrl;
    payload.evidence_video_url = deleteField;
    payload.evidenceVideoEmbedUrl = report.evidenceVideoEmbedUrl;
    payload.evidence_video_embed_url = deleteField;
    payload.evidenceVideoProvider = report.evidenceVideoProvider || "youtube";
    payload.evidence_video_provider = deleteField;
    payload.evidenceVideoStatus = report.evidenceVideoStatus || "ready";
    payload.evidence_video_status = deleteField;
    payload.evidenceVideoUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (!existing.exists) {
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }

  logReportRegisterDebug("before_firestore_set", {
    docPath: `audit_reports/${report.token}`,
    existing: existing.exists,
    payload: pickReportRegisterDebugFields(payload),
    secureEvidenceCount: cleanSecurePageEvidenceAssets.length,
    deleteHeavyDuplicateFields: true,
    payloadKeys: Object.keys(payload).sort(),
  });

  const firestoreSetResult = await setAuditReportPayloadResilient({
    reportRef,
    payload,
    reportToken: report.token,
    deleteField,
  });
  const firestorePayload = firestoreSetResult.payload;
  const emailPreviewPersisted = firestoreSetResult.emailPreviewPersisted;
  persistedEmailPreviewImage = emailPreviewPersisted ? cleanEmailPreviewImage : {
    asset: null,
    url: "",
    webpUrl: "",
    b2Key: "",
    mimeType: "",
    sizeBytes: 0,
    hasIncoming: false,
    hasExisting: false,
  };

  const savedSnap = await reportRef.get();
  const savedData = savedSnap.exists ? savedSnap.data() || {} : {};
  logReportRegisterDebug("after_firestore_set", {
    docPath: `audit_reports/${report.token}`,
    exists: savedSnap.exists,
    saved: pickReportRegisterDebugFields(savedData),
    savedKeys: Object.keys(savedData).sort(),
    secureEvidenceSavedCount: Array.isArray(savedData?.securePageEvidenceAssets || savedData?.secure_page_evidence_assets)
      ? (savedData.securePageEvidenceAssets || savedData.secure_page_evidence_assets).length
      : 0,
  });

  if (normalizedDomain) {
    const domainIndexPayload = sanitizeRegisterFirestoreObject({
      token: report.token,
      reportToken: report.token,
      reportUrl: report.reportUrl,
      reportMode: report.reportMode || report.report_mode || "",
      trackingCase: report.trackingCase || report.tracking_case || null,
      domain: normalizedDomain,
      normalizedDomain,
      domainSlug: report.domainSlug,
      previewImageUrl,
      emailPreviewImageUrl: persistedEmailPreviewImage.url,
      email_preview_image_url: persistedEmailPreviewImage.url,
      emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
      email_preview_image_b2_key: persistedEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
      email_preview_image_mime_type: persistedEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
      email_preview_image_size_bytes: persistedEmailPreviewImage.sizeBytes,
      ogImagePathname: report.ogImagePathname || "",
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      pdfStorageKey,
      storageProvider: report.storageProvider,
      source: "catch_all_route_register",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRegisteredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await adminDb.collection("audit_report_domains").doc(normalizedDomain).set(domainIndexPayload, { merge: true });
      logReportRegisterDebug("after_domain_index_set", {
        docPath: `audit_report_domains/${normalizedDomain}`,
        index: {
          token: report.token,
          reportUrl: report.reportUrl,
          previewImageUrl,
          emailPreviewImageUrl: persistedEmailPreviewImage.url,
          emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
          emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
          emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
          ogImagePathname: report.ogImagePathname || "",
          pdfStorageKey,
        },
      });
    } catch (error: any) {
      logReportRegisterDebug("domain_index_set_failed_non_fatal", {
        docPath: `audit_report_domains/${normalizedDomain}`,
        error: error?.message || String(error || ""),
        note: "Main audit_reports document was already saved. Domain index can be rebuilt later.",
      });
    }
  }

  if (report.leadId) {
    const leadUpdatePayload = sanitizeRegisterFirestoreObject({
      reportToken: report.token,
      reportUrl: report.reportUrl,
      domainSlug: report.domainSlug,
      emailPreviewImageUrl: persistedEmailPreviewImage.url,
      email_preview_image_url: persistedEmailPreviewImage.url,
      emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
      email_preview_image_b2_key: persistedEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
      email_preview_image_mime_type: persistedEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
      email_preview_image_size_bytes: persistedEmailPreviewImage.sizeBytes,
      ogImageUrl: report.ogImageUrl || "",
      homepageScreenshotUrl: report.homepageScreenshotUrl || report.ogImageUrl || "",
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      pdfExpiresAt: report.pdfExpiresAt,
      reportReady: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tracking_history: admin.firestore.FieldValue.arrayUnion({
        event: "report_registered",
        reportToken: report.token,
        time: admin.firestore.Timestamp.now(),
      }),
    });

    try {
      await adminDb.collection("outreach_leads").doc(report.leadId).set(leadUpdatePayload, { merge: true });
    } catch (error: any) {
      logReportRegisterDebug("outreach_lead_report_link_failed_non_fatal", {
        leadId: report.leadId,
        error: error?.message || String(error || ""),
        note: "Main secure report stayed registered. Lead cache link can be refreshed later.",
      });
    }
  }

  let sheetUpdated = false;
  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      reportToken: report.token,
      reportUrl: report.reportUrl,
      emailPreviewImageUrl: persistedEmailPreviewImage.url,
      emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      pdfExpiresAt: report.pdfExpiresAt,
      reportPageViewed: "No",
      pdfDownloaded: "No",
      ctaClicked: "No",
      notes: "Secure report registered and PDF uploaded.",
    });
    sheetUpdated = true;
  }

  const responsePayload: AnyRecord = {
    success: true,
    message: "Secure report registered successfully.",
    token: report.token,
    reportToken: report.token,
    domainSlug: report.domainSlug,
    domain_slug: report.domainSlug,
    reportUrl: report.reportUrl,
    ogImageUrl: report.ogImageUrl || "",
    openGraphImageUrl: report.openGraphImageUrl || report.ogImageUrl || "",
    previewImageUrl: report.previewImageUrl || report.ogImageUrl || "",
    homepageScreenshotUrl: report.homepageScreenshotUrl || report.ogImageUrl || "",
    emailPreviewImageUrl: persistedEmailPreviewImage.url,
    email_preview_image_url: persistedEmailPreviewImage.url,
    emailPreviewImageWebpUrl: persistedEmailPreviewImage.webpUrl,
    email_preview_image_webp_url: persistedEmailPreviewImage.webpUrl,
    emailPreviewImageB2Key: persistedEmailPreviewImage.b2Key,
    email_preview_image_b2_key: persistedEmailPreviewImage.b2Key,
    emailPreviewImageMimeType: persistedEmailPreviewImage.mimeType,
    email_preview_image_mime_type: persistedEmailPreviewImage.mimeType,
    emailPreviewImageSizeBytes: persistedEmailPreviewImage.sizeBytes,
    email_preview_image_size_bytes: persistedEmailPreviewImage.sizeBytes,
    ogImagePathname: report.ogImagePathname || "",
    pdfFileId: report.pdfFileId,
    pdfViewUrl: report.pdfViewUrl,
    pdfDownloadUrl: report.pdfDownloadUrl,
    blobUrl: report.blobUrl,
    blobDownloadUrl: report.blobDownloadUrl,
    blobPathname: report.blobPathname,
    b2Key: report.b2Key,
    b2Bucket: report.b2Bucket,
    pdfStorageKey: report.pdfStorageKey || report.b2Key || report.blobPathname || report.pdfFileId,
    pdfStorageEtag: report.pdfStorageEtag,
    pdfStorageSize: report.pdfStorageSize,
    pdfExpiresAt: report.pdfExpiresAt,
    evidenceVideoProvider: report.evidenceVideoProvider || report.evidenceVideo?.provider || '',
    evidenceVideoUrl: report.evidenceVideoUrl || report.evidenceVideo?.videoUrl || report.evidenceVideo?.youtubeUrl || '',
    evidenceVideoId: report.evidenceVideoId || report.evidenceVideo?.videoId || report.evidenceVideo?.youtubeVideoId || '',
    evidenceVideoEmbedUrl: report.evidenceVideoEmbedUrl || report.evidenceVideo?.embedUrl || '',
    evidenceVideoVisibility: report.evidenceVideoVisibility || report.evidenceVideo?.visibility || 'unlisted',
    evidenceVideoTitle: report.evidenceVideoTitle || report.evidenceVideo?.title || '',
    evidenceVideoStatus: report.evidenceVideoStatus || report.evidenceVideo?.status || '',
    evidenceVideoUpdatedAt: report.evidenceVideoUpdatedAt || '',
    leadId: report.leadId,
    sheetRowNumber: report.sheetRowNumber,
    sheetUpdated,
    storageProvider: report.storageProvider,
    debugVersion: TFP_REPORT_REGISTER_DEBUG_VERSION,
    registerDebug: {
      requested: debugRequested,
      docPath: `audit_reports/${report.token}`,
      existing: existing.exists,
      incoming: pickReportRegisterDebugFields(body || {}),
      normalized: pickReportRegisterDebugFields(report || {}),
      saved: pickReportRegisterDebugFields(savedData || {}),
    },
  };

  logReportRegisterDebug("response", responsePayload.registerDebug);

  return json(responsePayload);
}

async function getActiveReportByToken(tokenRaw: any) {
  const token = normalizeReportToken(tokenRaw);
  if (!token) throw new ApiError("Report token is required", 400);

  const snap = await adminDb.collection("audit_reports").doc(token).get();
  if (!snap.exists) throw new ApiError("Report not found", 404);
  const report = snap.data() || {};

  if (report.active === false) throw new ApiError("Report is no longer available", 410);
  const expiresAtMs = toMillis(report.pdfExpiresAt || report.expiresAt);
  if (expiresAtMs && Date.now() > expiresAtMs) throw new ApiError("Report has expired", 410);

  return { token, ref: snap.ref, report };
}

async function getReportTokenFromRequest(req: Request): Promise<string> {
  const url = new URL(req.url);
  const queryToken = normalizeReportToken(url.searchParams.get("token"));
  if (queryToken) return queryToken;

  if (req.method.toUpperCase() === "POST") {
    const body = await readJson(req);
    return normalizeReportToken(body?.token || body?.reportToken || body?.report_token || "");
  }

  return "";
}

function getReportPdfRedirectTarget(report: AnyRecord, preferDownload = false): string {
  const first = preferDownload ? report.pdfDownloadUrl : report.pdfViewUrl;
  const second = preferDownload ? report.pdfViewUrl : report.pdfDownloadUrl;
  return sanitizeOptionalUrl(first || second || "");
}

function getGoogleDriveOAuthClient() {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const refreshToken = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "").trim();

  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth });
}

function extractGoogleDriveFileId(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    if (fileMatch?.[1]) return fileMatch[1];

    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {}

  return "";
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.byteLength > 4 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}


type DrivePdfDeleteMode = "trash" | "delete";

type DrivePdfCleanupResult = {
  attempted: boolean;
  ok: boolean;
  fileId: string;
  mode: DrivePdfDeleteMode | "disabled" | "skipped" | "missing_credentials" | "not_found";
  error?: string;
};

type AuditReportCleanupResult = {
  attempted: boolean;
  ok: boolean;
  reportToken: string;
  error?: string;
};

type LeadAssetCleanupResult = {
  drive: DrivePdfCleanupResult;
  report: AuditReportCleanupResult;
};

function envFlag(name: string, fallback = false): boolean {
  const raw = String(process.env[name] ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(raw)) return true;
  if (["0", "false", "no", "n", "off"].includes(raw)) return false;
  return fallback;
}

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number(process.env[name]);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(value, max));
}

function requestLimit(req: Request, queryName: string, envName: string, fallback: number, min: number, max: number): number {
  const url = new URL(req.url);
  const fromQuery = Number(url.searchParams.get(queryName) || "");
  const fromEnv = intEnv(envName, fallback, min, max);
  const raw = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : fromEnv;
  return Math.max(min, Math.min(raw, max));
}

function automationPaused(): boolean {
  return envFlag("AUTOMATION_PAUSED", false);
}

function sheetQueueSendEnabled(): boolean {
  return envFlag("SHEET_QUEUE_SEND_ENABLED", true);
}

function followupsEnabled(): boolean {
  return envFlag("FOLLOWUPS_ENABLED", true);
}

function pausedPayload(feature: string) {
  return {
    success: false,
    paused: true,
    feature,
    error: `${feature} is paused by server config. Set AUTOMATION_PAUSED=false or the feature-specific switch to enable it.`,
  };
}

function webhookOpenDedupeMs(): number {
  return intEnv("WEBHOOK_OPEN_DEDUPE_MINUTES", 180, 1, 24 * 60) * 60_000;
}

function webhookClickDedupeMs(): number {
  return intEnv("WEBHOOK_CLICK_DEDUPE_MINUTES", 30, 1, 24 * 60) * 60_000;
}

function isDuplicateEngagement(lastMs: number, currentMs: number, windowMs: number): boolean {
  return Boolean(lastMs && currentMs && currentMs - lastMs >= 0 && currentMs - lastMs <= windowMs);
}

function isUnsafeStoredPdfUrl(value: any): boolean {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return false;
  if (raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("0.0.0.0")) return true;
  if (raw.includes(":8000/") || raw.includes("/audit/pdf/") || raw.includes("/audit/evidence/")) return true;
  return false;
}

function drivePdfDeleteMode(): DrivePdfDeleteMode {
  return String(process.env.DRIVE_PDF_DELETE_MODE || "trash").trim().toLowerCase() === "delete" ? "delete" : "trash";
}

function shouldDeleteDrivePdfOnLeadDelete(): boolean {
  return envFlag("DELETE_DRIVE_PDF_ON_LEAD_DELETE", true);
}

function shouldRequireDrivePdfCleanupOnLeadDelete(): boolean {
  return envFlag("REQUIRE_DRIVE_PDF_CLEANUP_ON_LEAD_DELETE", true);
}

function extractReportTokenFromUrl(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const tokenFromPath = (pathname: string) => {
    const trackingReviewMatch = pathname.match(/^\/tracking-review\/[^/]+\/([a-zA-Z0-9_-]{8,128})\/?$/);
    if (trackingReviewMatch?.[1]) return normalizeReportToken(trackingReviewMatch[1]);

    // Backward-compatible fallback only. New client-facing links use /tracking-review/{domainSlug}/{token}.
    const oldShortMatch = pathname.match(/^\/r\/([a-zA-Z0-9_-]{8,128})\/?$/);
    return normalizeReportToken(oldShortMatch?.[1] || "");
  };

  try {
    const url = new URL(raw.startsWith("http") ? raw : `${appBaseUrl()}${raw.startsWith("/") ? "" : "/"}${raw}`);
    return tokenFromPath(url.pathname);
  } catch {
    const trackingReviewMatch = raw.match(/\/tracking-review\/[^/]+\/([a-zA-Z0-9_-]{8,128})\/?/);
    if (trackingReviewMatch?.[1]) return normalizeReportToken(trackingReviewMatch[1]);
    const oldShortMatch = raw.match(/\/r\/([a-zA-Z0-9_-]{8,128})\/?/);
    return normalizeReportToken(oldShortMatch?.[1] || "");
  }
}

function getLeadReportTokenForCleanup(lead: LeadData): string {
  return normalizeReportToken(
    lead.reportToken ||
      lead.report_token ||
      lead.token ||
      extractReportTokenFromUrl(lead.reportUrl || lead.report_url || "") ||
      "",
  );
}

function uniqueCleanStringsForCleanup(values: any[], max = 100): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= max) break;
  }

  return output;
}

function getLeadEmailEventMessageIdsForCleanup(lead: LeadData): string[] {
  const candidates: any[] = [
    ...getLeadMessageIdChain(lead),
    lead.customMessageId,
    lead.originalMessageId,
    lead.brevoMessageId,
    (lead as AnyRecord).messageId,
    (lead as AnyRecord).message_id,
    (lead as AnyRecord).lastFollowupMessageId,
    (lead as AnyRecord).lastFollowupCustomMessageId,
  ];

  if (Array.isArray(lead.sent_messages)) {
    for (const message of lead.sent_messages) {
      if (!message || typeof message !== "object") continue;
      candidates.push(
        message.customMessageId,
        message.custom_message_id,
        message.messageId,
        message.message_id,
        message.brevoMessageId,
        message.brevo_message_id,
        message.inReplyTo,
        message.references,
      );
    }
  }

  return uniqueCleanStringsForCleanup(candidates, 100);
}

function cleanEmailTrackingIdForCleanup(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 100);
}

function getLeadEmailEventTrackingIdsForCleanup(lead: LeadData): string[] {
  const candidates: any[] = [
    lead.trackingId,
    (lead as AnyRecord).tracking_id,
    (lead as AnyRecord).lastEmailTrackingId,
  ];

  if (Array.isArray(lead.sent_messages)) {
    for (const message of lead.sent_messages) {
      if (!message || typeof message !== "object") continue;
      candidates.push(
        message.trackingId,
        message.tracking_id,
        message.trackingTag,
        message.tracking_tag,
      );
    }
  }

  const expanded: string[] = [];
  for (const value of candidates) {
    const cleanValue = cleanEmailTrackingIdForCleanup(value);
    if (!cleanValue) continue;
    expanded.push(cleanValue);
    const stepPrefix = cleanValue.match(/^(.+)_step\d+$/i)?.[1];
    if (stepPrefix) expanded.push(stepPrefix);
  }

  return uniqueCleanStringsForCleanup(expanded, 100);
}

function getLeadEmailLowersForEventCleanup(lead: LeadData): string[] {
  return uniqueCleanStringsForCleanup(
    [
      lead.emailLower,
      (lead as AnyRecord).email_lower,
      lead.email,
      lead.sheetFinalEmail,
      lead.parentSheetEmail,
    ]
      .map((value) => normalizeEmail(value || ""))
      .filter(Boolean),
    20,
  );
}

async function cleanupEmailEventsForLeadBeforeDelete(leadId: string, lead: LeadData, maxDocs = 2000) {
  return deleteEmailEventsForReport({
    reportToken: getLeadReportTokenForCleanup(lead),
    leadIds: [leadId],
    messageIds: getLeadEmailEventMessageIdsForCleanup(lead),
    trackingIds: getLeadEmailEventTrackingIdsForCleanup(lead),
    emailLowers: getLeadEmailLowersForEventCleanup(lead),
    matchReportToken: false,
    matchReportTokenWithEmail: true,
    maxDocs,
  });
}

function getLeadDrivePdfFileIdForCleanup(lead: LeadData): string {
  return String(
    lead.pdfFileId ||
      lead.pdf_file_id ||
      lead.driveFileId ||
      lead.googleDriveFileId ||
      extractGoogleDriveFileId(lead.pdfViewUrl || lead.pdf_view_url || "") ||
      extractGoogleDriveFileId(lead.pdfDownloadUrl || lead.pdf_download_url || "") ||
      "",
  ).trim();
}

function getGoogleApiStatusCode(error: any): number {
  return Number(error?.code || error?.status || error?.response?.status || error?.errors?.[0]?.code || 0) || 0;
}

async function cleanupDrivePdfForLeadDelete(lead: LeadData): Promise<DrivePdfCleanupResult> {
  const fileId = getLeadDrivePdfFileIdForCleanup(lead);
  if (!fileId) return { attempted: false, ok: true, fileId: "", mode: "skipped" };

  if (!shouldDeleteDrivePdfOnLeadDelete()) {
    return { attempted: false, ok: true, fileId, mode: "disabled" };
  }

  const drive = getGoogleDriveOAuthClient();
  if (!drive) {
    return {
      attempted: true,
      ok: false,
      fileId,
      mode: "missing_credentials",
      error: "Missing Google Drive OAuth credentials for PDF cleanup.",
    };
  }

  const mode = drivePdfDeleteMode();
  try {
    if (mode === "delete") {
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } else {
      await drive.files.update({
        fileId,
        requestBody: { trashed: true },
        fields: "id,trashed",
        supportsAllDrives: true,
      });
    }

    return { attempted: true, ok: true, fileId, mode };
  } catch (error: any) {
    const statusCode = getGoogleApiStatusCode(error);
    if (statusCode === 404) {
      return { attempted: true, ok: true, fileId, mode: "not_found" };
    }

    return {
      attempted: true,
      ok: false,
      fileId,
      mode,
      error: String(error?.message || error || "Google Drive PDF cleanup failed."),
    };
  }
}

async function deactivateAuditReportForLeadDelete(
  lead: LeadData,
  options: { actor?: string; reason?: string; driveCleanup?: DrivePdfCleanupResult } = {},
): Promise<AuditReportCleanupResult> {
  const reportToken = getLeadReportTokenForCleanup(lead);
  if (!reportToken) return { attempted: false, ok: true, reportToken: "" };

  try {
    await adminDb.collection("audit_reports").doc(reportToken).set(
      {
        active: false,
        reportReady: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: options.actor || "admin",
        deleteReason: options.reason || "lead_deleted",
        drivePdfCleanup: options.driveCleanup || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { attempted: true, ok: true, reportToken };
  } catch (error: any) {
    return {
      attempted: true,
      ok: false,
      reportToken,
      error: String(error?.message || error || "Report deactivation failed."),
    };
  }
}

async function cleanupLeadExternalAssetsBeforePermanentDelete(
  lead: LeadData,
  options: { actor?: string; reason?: string; allowAssetCleanupFailure?: boolean } = {},
): Promise<LeadAssetCleanupResult> {
  const drive = await cleanupDrivePdfForLeadDelete(lead);
  const report = await deactivateAuditReportForLeadDelete(lead, { ...options, driveCleanup: drive });

  const driveCleanupRequired =
    drive.attempted && !drive.ok && shouldRequireDrivePdfCleanupOnLeadDelete() && options.allowAssetCleanupFailure !== true;
  if (driveCleanupRequired) {
    throw new ApiError(`Drive PDF cleanup failed before permanent delete: ${drive.error || drive.mode}`, 502);
  }

  if (report.attempted && !report.ok && options.allowAssetCleanupFailure !== true) {
    throw new ApiError(`Report page deactivation failed before permanent delete: ${report.error || report.reportToken}`, 502);
  }

  return { drive, report };
}

async function fetchPdfBufferFromDriveApi(fileId: string): Promise<Buffer | null> {
  const drive = getGoogleDriveOAuthClient();
  if (!drive || !fileId) return null;

  try {
    const response = (await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    )) as unknown as { data: ArrayBuffer | Buffer | Uint8Array | string };

    const data = response.data;

    if (Buffer.isBuffer(data)) return data;
    if (data instanceof ArrayBuffer) return Buffer.from(data);
    if (ArrayBuffer.isView(data)) {
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    if (typeof data === "string") return Buffer.from(data, "binary");

    return null;
  } catch (error) {
    console.warn("Drive API PDF fetch failed, falling back to public URL:", error);
    return null;
  }
}
async function fetchPdfBufferFromPublicUrl(rawTarget: string): Promise<Buffer> {
  const target = sanitizeOptionalUrl(rawTarget);
  if (!target) throw new ApiError("PDF URL is missing", 404);

  const driveFileId = extractGoogleDriveFileId(target);
  const downloadTarget = driveFileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}`
    : target;

  const response = await fetch(downloadTarget, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
      "user-agent": "TrackFlowPro-PDF-Preview/1.0",
    },
  });

  if (!response.ok) {
    throw new ApiError(`PDF fetch failed from storage (${response.status}).`, response.status >= 500 ? 502 : 400);
  }

  return Buffer.from(await response.arrayBuffer());
}

function getReportB2PdfKey(report: AnyRecord): string {
  return sanitizeB2Key(
    report.b2Key ||
      report.b2_key ||
      report.pdfStorageKey ||
      report.pdf_storage_key ||
      (String(report.storageProvider || report.storage_provider || "").toLowerCase() === "backblaze_b2" ? report.blobPathname || report.pdfFileId : ""),
  );
}

async function resolveReportPdfBuffer(report: AnyRecord, preferDownload = false): Promise<Buffer> {
  const b2Key = getReportB2PdfKey(report);
  if (b2Key) {
    const viaB2 = await readPdfFromB2(b2Key);
    if (viaB2?.buffer && isPdfBuffer(viaB2.buffer)) return viaB2.buffer;
  }

  const target = getReportPdfRedirectTarget(report, preferDownload);
  const fileId = String(report.pdfFileId || report.driveFileId || extractGoogleDriveFileId(target) || "").trim();

  const viaDriveApi = await fetchPdfBufferFromDriveApi(fileId);
  if (viaDriveApi && isPdfBuffer(viaDriveApi)) return viaDriveApi;

  const viaPublicUrl = await fetchPdfBufferFromPublicUrl(target);
  if (!isPdfBuffer(viaPublicUrl)) {
    throw new ApiError("Stored PDF could not be streamed. Check Backblaze B2, Vercel Blob URL, Google Drive sharing, or OAuth credentials.", 502);
  }

  return viaPublicUrl;
}

function pdfErrorHtml(message: string) {
  const safeMessage = escapeHtml(message || "The PDF preview is temporarily unavailable.");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PDF preview unavailable</title>
    <style>
      body{margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;}
      .wrap{min-height:460px;display:flex;align-items:center;justify-content:center;padding:28px;}
      .card{max-width:520px;border:1px solid #e2e8f0;border-radius:22px;background:#fff;box-shadow:0 18px 60px rgba(15,23,42,.08);padding:26px;}
      .eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;color:#2563eb;margin:0 0 12px;}
      h1{font-size:22px;line-height:1.2;margin:0 0 12px;font-weight:900;letter-spacing:-.03em;}
      p{font-size:14px;line-height:1.7;margin:0;color:#475569;font-weight:600;}
      .note{margin-top:14px;border-radius:16px;background:#eff6ff;color:#1e3a8a;padding:12px;font-size:12px;line-height:1.6;}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <p class="eyebrow">TrackFlow Pro PDF preview</p>
        <h1>PDF preview is temporarily unavailable</h1>
        <p>${safeMessage}</p>
        <p class="note">Use the Open PDF or Download PDF button below this preview area. If the issue continues, reply to the email and I will resend the report.</p>
      </div>
    </div>
  </body>
</html>`;
}

function pdfStreamResponse(buffer: Buffer, filename: string, disposition: "inline" | "attachment") {
  const safeFilename = String(filename || "trackflow-report.pdf")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "trackflow-report.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(buffer.byteLength),
      "content-disposition": `${disposition}; filename=\"${safeFilename}\"`,
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}


function cleanVisitorHeader(value: string | null, maxLength = 120): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanVisitorCountryCode(value: string | null): string {
  const code = cleanVisitorHeader(value, 8).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  if (code === "XX" || code === "ZZ") return "";
  return code;
}

function decodeVisitorLocationHeader(value: string | null, maxLength = 120): string {
  const cleaned = cleanVisitorHeader(value, maxLength);
  if (!cleaned) return "";

  try {
    return decodeURIComponent(cleaned.replace(/\+/g, " ")).slice(0, maxLength);
  } catch {
    return cleaned;
  }
}

function detectReportVisitorBrowser(userAgent: string): string {
  const ua = String(userAgent || "").toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("crios")) return "Chrome iOS";
  if (ua.includes("chrome/") || ua.includes("chromium/")) return "Chrome";
  if (ua.includes("safari/")) return "Safari";

  return "Unknown";
}

function detectReportVisitorOs(userAgent: string): string {
  const ua = String(userAgent || "").toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  return "Unknown";
}

function detectReportVisitorDeviceType(userAgent: string): string {
  const ua = String(userAgent || "").toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile";

  return "Desktop";
}

function existingVisitorField(report: AnyRecord = {}, ...keys: string[]): string {
  for (const key of keys) {
    const value = cleanVisitorHeader(report[key] == null ? "" : String(report[key]), 120);
    if (value) return value;
  }

  return "";
}

function setFirstAndLastVisitorField(
  update: AnyRecord,
  report: AnyRecord,
  firstKey: string,
  lastKey: string,
  value: string,
  ...fallbackFirstKeys: string[]
) {
  const cleanValue = cleanVisitorHeader(value, 120);
  if (!cleanValue || cleanValue === "Unknown") return;

  const existingFirst = existingVisitorField(report, firstKey, ...fallbackFirstKeys);
  const existingLast = existingVisitorField(report, lastKey, firstKey, ...fallbackFirstKeys);

  // Keep the original/first visitor value stable. Only backfill it when it is missing.
  if (!existingFirst) update[firstKey] = cleanValue;

  // Keep the latest visitor value useful for follow-up. Write only when it is missing or changed.
  if (existingLast !== cleanValue) update[lastKey] = cleanValue;
}

function buildReportViewVisitorSummary(req: Request, report: AnyRecord = {}): AnyRecord {
  const userAgent = cleanVisitorHeader(req.headers.get("user-agent"), 600);
  const countryCode = cleanVisitorCountryCode(
    req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("cloudfront-viewer-country"),
  );
  const countryRegion = decodeVisitorLocationHeader(req.headers.get("x-vercel-ip-country-region"), 120);
  const countryCity = decodeVisitorLocationHeader(req.headers.get("x-vercel-ip-city"), 120);
  const deviceType = detectReportVisitorDeviceType(userAgent);
  const browser = detectReportVisitorBrowser(userAgent);
  const os = detectReportVisitorOs(userAgent);
  const update: AnyRecord = {};

  setFirstAndLastVisitorField(update, report, "visitorCountry", "lastVisitorCountry", countryCode, "visitor_country");
  setFirstAndLastVisitorField(update, report, "visitorDeviceType", "lastVisitorDeviceType", deviceType, "visitor_device_type", "deviceType", "device_type", "device");
  setFirstAndLastVisitorField(update, report, "visitorBrowser", "lastVisitorBrowser", browser, "visitor_browser", "browser");
  setFirstAndLastVisitorField(update, report, "visitorOs", "lastVisitorOs", os, "visitor_os", "os");

  if (countryRegion) {
    const previousRegion = existingVisitorField(report, "lastVisitorRegion", "last_visitor_region");
    if (previousRegion !== countryRegion) update.lastVisitorRegion = countryRegion;
  }

  if (countryCity) {
    const previousCity = existingVisitorField(report, "lastVisitorCity", "last_visitor_city");
    if (previousCity !== countryCity) update.lastVisitorCity = countryCity;
  }

  return update;
}


function reportPdfFilename(report: AnyRecord, token: string) {
  const company = String(report.companyName || report.businessName || report.domain || "client")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "client";

  return `TrackFlow-Pro-${company}-${token.slice(0, 10)}.pdf`;
}

async function handleReportPreview(req: Request) {
  try {
    const token = await getReportTokenFromRequest(req);
    const { report } = await getActiveReportByToken(token);
    const buffer = await resolveReportPdfBuffer(report, false);
    return pdfStreamResponse(buffer, reportPdfFilename(report, token), "inline");
  } catch (error: any) {
    console.error("Report PDF preview failed:", error);
    const message = error?.message || "The PDF could not be loaded from storage right now.";
    return htmlResponse(pdfErrorHtml(message), 200);
  }
}

async function handleReportView(req: Request) {
  const token = await getReportTokenFromRequest(req);
  const { ref, report } = await getActiveReportByToken(token);

  // Free-limit friendly + scanner-resistant:
  // the report page should call this from a client-side beacon after a short delay.
  // We only write the first verified view to Firestore/Sheet. Later page loads return success without extra writes.
  // If an older report was viewed before visitor summary fields existed, backfill the safe device/country summary once.
  const visitorSummary = buildReportViewVisitorSummary(req, report);
  const shouldBackfillVisitorSummary = Object.keys(visitorSummary).length > 0;
  const alreadyViewed = Boolean(report.lastViewedAt || report.firstViewedAt || report.reportPageViewedAt);
  if (alreadyViewed) {
    if (shouldBackfillVisitorSummary) {
      const nowTs = admin.firestore.Timestamp.now();
      await ref.set(
        {
          lastSeenAt: nowTs,
          lastActivityAt: nowTs,
          ...visitorSummary,
        },
        { merge: true },
      );

      return json({ success: true, viewed: true, alreadyRecorded: true, visitorSummaryBackfilled: true });
    }

    return json({ success: true, viewed: true, alreadyRecorded: true });
  }

  const nowTs = admin.firestore.Timestamp.now();
  await ref.set(
    {
      viewCount: admin.firestore.FieldValue.increment(1),
      firstViewedAt: nowTs,
      lastViewedAt: nowTs,
      reportPageViewedAt: nowTs,
      reportPageViewed: true,
      lastSeenAt: nowTs,
      lastActivityAt: nowTs,
      ...visitorSummary,
    },
    { merge: true },
  );

  if (report.leadId) {
    await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
      {
        reportPageViewed: true,
        reportViewedAt: nowTs,
        lastReportViewedAt: nowTs,
        tracking_history: admin.firestore.FieldValue.arrayUnion({
          event: "report_page_viewed",
          reportToken: normalizeReportToken(report.token || token),
          time: nowTs,
        }),
      },
      { merge: true },
    );
  }

  if (Number(report.sheetRowNumber || 0) > 1) {
    await patchSheetRowSafely(Number(report.sheetRowNumber), {
      reportPageViewed: "Yes",
      lastReportViewedAt: nowDhaka(),
    });
  }

  return json({ success: true, viewed: true, alreadyRecorded: false });
}

async function handleReportDownload(req: Request) {
  const token = await getReportTokenFromRequest(req);
  const { ref, report } = await getActiveReportByToken(token);
  const target = getReportPdfRedirectTarget(report, true);
  if (!target) throw new ApiError("PDF download link is missing", 404);

  let buffer: Buffer;

  try {
    buffer = await resolveReportPdfBuffer(report, true);
  } catch (error: any) {
    console.error("Report PDF download failed:", error);
    throw new ApiError(error?.message || "PDF download failed", 502);
  }

  const nowTs = admin.firestore.Timestamp.now();
  const alreadyDownloaded = Boolean(report.lastDownloadedAt || report.firstDownloadedAt || report.pdfDownloadedAt);

  try {
    await ref.set(
      {
        downloadCount: admin.firestore.FieldValue.increment(1),
        lastDownloadedAt: nowTs,
        pdfDownloadedAt: nowTs,
        ...(alreadyDownloaded ? {} : { firstDownloadedAt: nowTs }),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Report PDF Firestore download tracking failed:", error);
  }

  try {
    if (report.leadId) {
      await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
        {
          pdfDownloadedAt: nowTs,
          lastPdfDownloadedAt: nowTs,
        },
        { merge: true },
      );
    }
  } catch (error) {
    console.warn("Report PDF lead download tracking failed:", error);
  }

  try {
    if (Number(report.sheetRowNumber || 0) > 1) {
      await patchSheetRowSafely(Number(report.sheetRowNumber), {
        pdfDownloaded: "Yes",
        lastPdfDownloadedAt: nowDhaka(),
      });
    }
  } catch (error) {
    console.warn("Report PDF Sheet download tracking failed:", error);
  }

  try {
    await markReportPdfDownloaded({
      reportToken: token,
      domainSlug: report.domainSlug || report.domain_slug,
      domain: report.domain,
      companyName: report.companyName || report.company_name || report.businessName || report.business_name,
      reportUrl: report.reportUrl || report.report_url || buildPublicReportUrl(token, report.domainSlug || report.domain_slug || report.domain || "website"),
    });
  } catch (error) {
    console.warn("Report PDF Supabase dashboard tracking failed:", error);
  }

  return pdfStreamResponse(buffer, reportPdfFilename(report, token), "attachment");
}

async function handleReportCta(req: Request) {
  const url = new URL(req.url);
  const { token, ref, report } = await getActiveReportByToken(url.searchParams.get("token"));
  const target = sanitizeLocalRedirectTarget(url.searchParams.get("target") || "/contact");

  const alreadyClicked = Boolean(report.lastCtaClickedAt || report.firstCtaClickedAt || report.reportCtaClickedAt);
  if (!alreadyClicked) {
    const nowTs = admin.firestore.Timestamp.now();
    await ref.set(
      {
        ctaClickCount: admin.firestore.FieldValue.increment(1),
        firstCtaClickedAt: nowTs,
        lastCtaClickedAt: nowTs,
      },
      { merge: true },
    );

    if (report.leadId) {
      await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
        {
          reportCtaClickedAt: nowTs,
          lastReportCtaClickedAt: nowTs,
        },
        { merge: true },
      );
    }

    if (Number(report.sheetRowNumber || 0) > 1) {
      await patchSheetRowSafely(Number(report.sheetRowNumber), {
        ctaClicked: "Yes",
        lastCtaClickedAt: nowDhaka(),
      });
    }
  }

  return NextResponse.redirect(new URL(target, appBaseUrl()).toString());
}



function formatPostmasterDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function getPostmasterPolicy() {
  return {
    spamRateWarning: "0.10%",
    spamRatePause: "0.30%",
    lowReputationAction: "Pause cold follow-ups and reduce new sends",
  };
}

function getGoogleApiErrorInfo(error: any) {
  const status = Number(error?.code || error?.response?.status || error?.status || 500);
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.errors?.[0]?.message ||
    error?.message ||
    "Google Postmaster API request failed";

  return {
    status: Number.isFinite(status) ? status : 500,
    message: String(message),
  };
}


async function withPostmasterTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Google Postmaster API request timed out");
      (error as any).code = 504;
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isPostmasterNoDataError(error: any) {
  const info = getGoogleApiErrorInfo(error);
  const message = info.message.toLowerCase();

  return (
    info.status === 404 ||
    message.includes("not found") ||
    message.includes("requested entity was not found") ||
    message.includes("trafficstats") ||
    message.includes("traffic stats")
  );
}

function isPostmasterAuthError(error: any) {
  const info = getGoogleApiErrorInfo(error);
  const message = info.message.toLowerCase();

  return (
    info.status === 400 ||
    info.status === 401 ||
    info.status === 403 ||
    message.includes("unauthorized_client") ||
    message.includes("invalid_grant") ||
    message.includes("invalid_client") ||
    message.includes("invalid_scope") ||
    message.includes("access_denied") ||
    message.includes("insufficient") ||
    message.includes("permission") ||
    message.includes("forbidden")
  );
}

function postmasterAuthErrorPayload(options: {
  domain: string;
  date?: string;
  daysBack?: number;
  checkedDates?: string[];
  googleStatus?: number;
  googleMessage?: string;
}) {
  const googleMessage = options.googleMessage || "Google Postmaster OAuth authorization failed";

  return {
    success: true,
    configured: true,
    noData: true,
    authError: true,
    needsCredentialRefresh: true,
    domain: options.domain,
    date: options.date || null,
    daysBack: options.daysBack ?? null,
    checkedDates: options.checkedDates || [],
    googleStatus: options.googleStatus || null,
    googleMessage,
    message:
      "Postmaster API route is working, but Google rejected the OAuth credentials. Generate a fresh Client ID/Client Secret/Refresh Token with the Postmaster readonly scope and use the Google account that has access to this verified domain.",
    spamRate: null,
    domainReputation: null,
    ipReputations: [],
    spfSuccessRatio: null,
    dkimSuccessRatio: null,
    dmarcSuccessRatio: null,
    deliveryErrors: [],
    raw: null,
    policy: getPostmasterPolicy(),
  };
}

type PostmasterTrafficStatsResponse = {
  data?: {
    userReportedSpamRatio?: number | string | null;
    domainReputation?: string | null;
    spfSuccessRatio?: number | string | null;
    dkimSuccessRatio?: number | string | null;
    dmarcSuccessRatio?: number | string | null;
    ipReputations?: any[];
    deliveryErrors?: any[];
    [key: string]: any;
  } | null;
  [key: string]: any;
};

function emptyPostmasterStatsPayload(options: {
  domain: string;
  date?: string;
  daysBack?: number;
  checkedDates?: string[];
  message: string;
}) {
  return {
    success: true,
    configured: true,
    noData: true,
    domain: options.domain,
    date: options.date || null,
    daysBack: options.daysBack ?? null,
    checkedDates: options.checkedDates || [],
    message: options.message,
    spamRate: null,
    domainReputation: null,
    ipReputations: [],
    spfSuccessRatio: null,
    dkimSuccessRatio: null,
    dmarcSuccessRatio: null,
    deliveryErrors: [],
    raw: null,
    policy: getPostmasterPolicy(),
  };
}

async function handlePostmasterHealth(req: Request) {
  await requireAdmin(req);

  const domain = String(process.env.POSTMASTER_DOMAIN || "trackflowpro.com").trim();
  const clientId = process.env.GOOGLE_POSTMASTER_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_POSTMASTER_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_POSTMASTER_REFRESH_TOKEN || "";

  if (!clientId || !clientSecret || !refreshToken) {
    return json({
      success: true,
      configured: false,
      noData: true,
      domain,
      message: "Postmaster API credentials are not configured yet. Verify the domain in Google Postmaster Tools and add OAuth refresh-token env vars to enable live dashboard data.",
      policy: getPostmasterPolicy(),
    });
  }

  const url = new URL(req.url);
  const requestedDaysBackRaw = Number(url.searchParams.get("daysBack") || 1);
  const requestedDaysBack = Math.max(
    0,
    Math.min(Number.isFinite(requestedDaysBackRaw) ? requestedDaysBackRaw : 1, 14)
  );
 const maxLookbackRaw = Number(url.searchParams.get("maxLookback") || 3);
const maxLookback = Math.max(
  requestedDaysBack,
  Math.min(Number.isFinite(maxLookbackRaw) ? Math.floor(maxLookbackRaw) : 3, 14)
);

  // Postmaster data often appears late and fresh domains may have no stats yet.
  // Try the requested day first, then walk backward so "no data" never becomes a 500.
  const daysToTry = Array.from(
    new Set([requestedDaysBack, ...Array.from({ length: maxLookback + 1 }, (_, index) => index)])
  ).filter((daysBack) => daysBack >= 0 && daysBack <= maxLookback);

  const checkedDates: string[] = [];

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  if (typeof (google as any).gmailpostmastertools !== "function") {
    return json(
      {
        success: false,
        configured: true,
        domain,
        error: "Google Postmaster Tools client is not available in the installed googleapis package. Update the googleapis package or migrate this route to the latest Postmaster Tools API client.",
        policy: getPostmasterPolicy(),
      },
      500
    );
  }

  const postmaster = (google as any).gmailpostmastertools({ version: "v1beta1", auth });

  for (const daysBack of daysToTry) {
    const date = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const trafficStatsId = formatPostmasterDate(date);
    checkedDates.push(trafficStatsId);

    try {
      const name = `domains/${domain}/trafficStats/${trafficStatsId}`;
      const response = await withPostmasterTimeout<PostmasterTrafficStatsResponse>(
        postmaster.domains.trafficStats.get({ name }) as Promise<PostmasterTrafficStatsResponse>,
        12000
      );
      const stats = response?.data || {};

      const hasStats = Boolean(
        stats.userReportedSpamRatio != null ||
          stats.domainReputation != null ||
          stats.spfSuccessRatio != null ||
          stats.dkimSuccessRatio != null ||
          stats.dmarcSuccessRatio != null ||
          (Array.isArray(stats.ipReputations) && stats.ipReputations.length > 0) ||
          (Array.isArray(stats.deliveryErrors) && stats.deliveryErrors.length > 0)
      );

      if (!hasStats) {
        return json(
          emptyPostmasterStatsPayload({
            domain,
            date: trafficStatsId,
            daysBack,
            checkedDates,
            message: "Postmaster API connected, but Google returned an empty stats object for this date. This is normal for a newly verified domain or low Gmail traffic.",
          })
        );
      }

      return json({
        success: true,
        configured: true,
        noData: false,
        domain,
        date: trafficStatsId,
        daysBack,
        checkedDates,
        message: "Postmaster health loaded.",
        spamRate: stats.userReportedSpamRatio ?? null,
        domainReputation: stats.domainReputation ?? null,
        ipReputations: stats.ipReputations ?? [],
        spfSuccessRatio: stats.spfSuccessRatio ?? null,
        dkimSuccessRatio: stats.dkimSuccessRatio ?? null,
        dmarcSuccessRatio: stats.dmarcSuccessRatio ?? null,
        deliveryErrors: stats.deliveryErrors ?? [],
        raw: stats,
        policy: getPostmasterPolicy(),
      });
    } catch (error: any) {
      const info = getGoogleApiErrorInfo(error);

      if (isPostmasterNoDataError(error)) {
        console.info("No Postmaster traffic stats for date:", {
          domain,
          trafficStatsId,
          daysBack,
          status: info.status,
          message: info.message,
        });
        continue;
      }

      if (isPostmasterAuthError(error)) {
        console.warn("Google Postmaster OAuth/config error:", {
          domain,
          trafficStatsId,
          daysBack,
          status: info.status,
          message: info.message,
        });

        // This is not an application crash. Keep the dashboard stable and show a clear setup message.
        return json(
          postmasterAuthErrorPayload({
            domain,
            date: trafficStatsId,
            daysBack,
            checkedDates,
            googleStatus: info.status,
            googleMessage: info.message,
          }),
          200
        );
      }

      console.error("Google Postmaster API Error:", {
        domain,
        trafficStatsId,
        daysBack,
        status: info.status,
        message: info.message,
      });

      return json(
        {
          success: false,
          configured: true,
          noData: false,
          domain,
          date: trafficStatsId,
          daysBack,
          checkedDates,
          error: info.message,
          policy: getPostmasterPolicy(),
        },
        info.status >= 400 && info.status < 600 ? info.status : 500
      );
    }
  }

  return json(
    emptyPostmasterStatsPayload({
      domain,
      date: checkedDates[0],
      daysBack: requestedDaysBack,
      checkedDates,
      message: "Postmaster domain/API is connected, but no traffic stats are available yet. Send some Gmail traffic and check again after Google has processed the data.",
    })
  );
}

function normalizeSheetServiceForSend(value: string): string {
  const text = String(value || "").toLowerCase();
  if (text.includes("signature")) return "Email Signature";
  if (text.includes("server") || text.includes("sst")) return "Server Side Tracking";
  return "Google Ads";
}

async function handleReleaseTemplateBlockedFollowups(req: Request) {
  await requireAdmin(req);

  const nowTs = admin.firestore.Timestamp.now();
  const snap = await adminDb
    .collection("outreach_leads")
    .where("stopAutomation", "==", false)
    .where("nextFollowupStatus", "==", "template_blocked")
    .limit(200)
    .get();

  const batch = adminDb.batch();
  let requeuedCount = 0;
  let finishedCount = 0;

  snap.docs.forEach((docSnap: any) => {
    const lead = docSnap.data() || {};
    const followUpCount = Number(lead.follow_up_count || 0);

    if (Number.isFinite(followUpCount) && followUpCount >= MAX_AUTOMATED_FOLLOWUPS) {
      batch.update(docSnap.ref, {
        status: "finished",
        nextFollowupStatus: "finished",
        nextFollowupReason: "max_followups_reached",
        nextFollowupAt: admin.firestore.FieldValue.delete(),
        nextFollowupStep: admin.firestore.FieldValue.delete(),
        lastFollowupEvaluatedAt: nowTs,
        automationLock: admin.firestore.FieldValue.delete(),
      });
      finishedCount += 1;
      return;
    }

    batch.update(docSnap.ref, {
      nextFollowupStatus: "scheduled",
      nextFollowupReason: "template_settings_updated_requeued",
      lastFollowupEvaluatedAt: nowTs,
      automationLock: admin.firestore.FieldValue.delete(),
    });
    requeuedCount += 1;
  });

  if (!snap.empty) await batch.commit();
  return json({ success: true, requeuedCount, finishedCount });
}

function validateSheetQueuedSendReadiness(row: AnyRecord): string[] {
  const blockers: string[] = [];
  const approvalStatus = clean(row["Approval Status"]).toLowerCase();
  const finalEmail = clean(row["Final Email"]);
  const subject = clean(row["Email Subject"]);
  const emailBody = clean(row["Email Body"]);
  const mainIssue = clean(row["Main Issue"]);
  const rawReportUrl = clean(row["Report URL"]);
  const reportUrl = sanitizePublicReportUrl(rawReportUrl);
  const reportToken = normalizeReportToken(row["Report Token"]);
  const urlToken = extractReportTokenFromUrl(reportUrl || rawReportUrl);
  const pdfFileId = clean(row["PDF File ID"]);
  const pdfViewUrl = sanitizeOptionalUrl(clean(row["PDF View URL"]));
  const pdfDownloadUrl = sanitizeOptionalUrl(clean(row["PDF Download URL"]));
  const pdfExpiresAtMs = toMillis(row["PDF Expires At"]);

  if (!isValidEmail(finalEmail)) blockers.push("Final Email is invalid or missing");
  if (!["approved", "send ready"].includes(approvalStatus)) blockers.push("Approval Status must be Approved or Send Ready");
  if (!subject) blockers.push("Email Subject is missing");
  if (!plainTextFromHtml(emailBody)) blockers.push("Email Body is missing");
  if (!mainIssue) blockers.push("Main Issue is missing");
  if (!reportUrl) blockers.push("secure TrackFlow tracking-review report URL is missing");
  if (!urlToken) blockers.push("Report URL must be a branded /tracking-review/{domainSlug}/{token} page");
  if (!reportToken) blockers.push("Report Token is missing");
  if (urlToken && reportToken && urlToken !== reportToken) blockers.push("Report Token does not match the tracking-review URL token");
  if (!pdfFileId) blockers.push("PDF file ID is missing");
  if (!pdfViewUrl && !pdfDownloadUrl) blockers.push("PDF View URL or PDF Download URL is missing");
  if ((pdfViewUrl && isUnsafeStoredPdfUrl(pdfViewUrl)) || (pdfDownloadUrl && isUnsafeStoredPdfUrl(pdfDownloadUrl))) {
    blockers.push("PDF URLs must point to Drive/storage, not localhost/Python audit endpoints");
  }
  if (pdfExpiresAtMs && Date.now() > pdfExpiresAtMs) blockers.push("PDF/report link is expired");

  return blockers;
}

/** GET /api/trackflow/cron/sheet-queued-sends */
async function handleCronSheetQueuedSends(req: Request) {
  /**
   * SHEET QUEUE CRON
   * বাংলা ব্যাখ্যা: Google Sheet realtime DB না। তাই send করার আগে row-কে Processing + Queue Lock ID দিয়ে
   * lock করা হয়। এরপর row আবার read করে নিজের lock confirm করা হয়। এতে duplicate email যাওয়ার risk কমে।
   */
  requireCronSecret(req);
  if (automationPaused()) return json(pausedPayload("sheet_queue_send_cron"), 423);
  if (!sheetQueueSendEnabled()) return json({ success: true, skipped: true, disabled: true, feature: "sheet_queue_send", message: "SHEET_QUEUE_SEND_ENABLED=false" });

  const cronLock = await acquireCronLock("sheet_queued_sends", 10);
  if (!cronLock.acquired) {
    const skippedPayload = {
      success: true,
      skipped: true,
      locked: true,
      message: "Sheet queued sends cron is already running. Skipping this overlapping run.",
      lockedBy: cronLock.lockedBy || "unknown",
      lockedAt: cronLock.lockedAt || "",
    };

    await writeCronStatus("sheetQueuedSends", {
      success: true,
      locked: true,
      skipped: true,
      reason: "sheet_queued_sends_cron_already_running",
      lockedBy: skippedPayload.lockedBy,
      lockedAt: skippedPayload.lockedAt,
    });

    return json(skippedPayload);
  }

  try {
    const startedAtMs = Date.now();
    const url = new URL(req.url);
    const max = requestLimit(req, "limit", "SHEET_QUEUE_BATCH_PER_RUN", 5, 1, 20);
    const defaultSender = getDefaultSender();
    if (!defaultSender) throw new ApiError("No default sender configured", 500);

    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);

    const rows = await loadRows(sheets, spreadsheetId);
    const candidates: Array<{ rowNumber: number; obj: AnyRecord }> = rows
      .map((row: any[], index: number): { rowNumber: number; obj: AnyRecord } => {
        const rowNumber = index + 2;
        return { rowNumber, obj: rowToObject(row, rowNumber) };
      })
      .filter((item: { rowNumber: number; obj: AnyRecord }) => {
        const status = clean(item.obj["Send Status"]).toLowerCase();
        if (status === "queued") return true;
        if (status === "processing") return isSheetProcessingLockStale(item.obj);
        return false;
      })
      .slice(0, max);

    const sent: any[] = [];
    const failed: any[] = [];
    const skipped: any[] = [];

    for (const { rowNumber, obj } of candidates) {
      const previousStatus = clean(obj["Send Status"]).toLowerCase();
      const previousAttempts = Number(obj["Attempt Count"] || 0);
      const attempts = previousAttempts + 1;
      const senderId = clean(obj["Sender ID"]) || defaultSender.id;
      const finalEmail = clean(obj["Final Email"]);
      const lockId = randomUUID();
      const attemptId = randomUUID();
      const lockedAt = sheetLockTimestamp();

      if (previousStatus === "processing" && !isSheetProcessingLockStale(obj)) {
        skipped.push({ rowNumber, email: finalEmail, reason: "fresh_processing_lock" });
        continue;
      }

      if (!isValidEmail(finalEmail)) {
        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...obj,
          "Send Status": "Failed",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: "Invalid email while processing queued send.",
        });
        failed.push({ rowNumber, email: finalEmail, error: "invalid_email" });
        continue;
      }

      // Lock first, then re-read. This is not a perfect database transaction, but it is much safer than batch-lock-after-send.
      await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
        ...obj,
        "Send Status": "Processing",
        "Attempt Count": String(attempts),
        "Queue Lock ID": lockId,
        "Queue Locked At": lockedAt,
        "Queue Attempt ID": attemptId,
        Notes: `Cron locked row at ${nowDhaka()}. Previous status: ${previousStatus || "queued"}.`,
      });

      const freshObj = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
      if (clean(freshObj["Queue Lock ID"]) !== lockId || clean(freshObj["Send Status"]).toLowerCase() !== "processing") {
        skipped.push({ rowNumber, email: finalEmail, reason: "lock_not_owned" });
        continue;
      }

      const readinessBlockers = validateSheetQueuedSendReadiness(freshObj);
      if (readinessBlockers.length) {
        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Send Status": "Needs Review",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: `Queue blocked before send: ${readinessBlockers.join("; ").slice(0, 450)}`,
        });

        failed.push({
          rowNumber,
          email: finalEmail,
          attempts,
          error: "readiness_blocked",
          reasons: readinessBlockers,
        });
        continue;
      }

      try {
        const response = await sendInitialFromBody({
          email: finalEmail,
          subject: clean(freshObj["Email Subject"]),
          message: clean(freshObj["Email Body"]),
          selectedService: normalizeSheetServiceForSend(freshObj["Service Type"]),
          senderId,
          clientName: clean(freshObj["Decision Maker"]),
          companyName: clean(freshObj["Business Name"]),
          website: clean(freshObj["Website URL"]),
          businessType: clean(freshObj["Lead Label"]) || clean(freshObj["Lead Status"]),
          includeSignature: true,
          signatureMode: "full",
          reportUrl: sanitizePublicReportUrl(clean(freshObj["Report URL"])),
          reportButtonText: "View short audit note",
          reportToken: clean(freshObj["Report Token"]),
          pdfFileId: clean(freshObj["PDF File ID"]),
          pdfViewUrl: clean(freshObj["PDF View URL"]),
          pdfDownloadUrl: clean(freshObj["PDF Download URL"]),
          pdfExpiresAt: clean(freshObj["PDF Expires At"]),
          sheetRowNumber: rowNumber,
          sheetWebsiteUrl: clean(freshObj["Website URL"]),
          sheetFinalEmail: finalEmail,
          source: "google_sheet_queue",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || `send-email failed with status ${response.status}`);
        }

        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Approval Status": "Approved",
          "Send Status": data.scheduled ? "Scheduled" : "Sent",
          "Firestore Lead ID": data.leadId || "",
          "Tracking ID": data.trackingId || "",
          "Reply Status": "No Reply",
          "Open Count": "0",
          "Click Count": "0",
          "Attempt Count": String(attempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: data.scheduled ? "Scheduled by sheet queue cron." : "Sent by sheet queue cron.",
        });
        sent.push({ rowNumber, email: finalEmail, leadId: data.leadId || "" });
      } catch (error: any) {
        const errorMessage = String(error?.message || error);
        const retryBecauseDailyLimit = isRetryableDailyLimitError(error);
        const finalAttempts = retryBecauseDailyLimit ? previousAttempts : attempts;
        const finalStatus = retryBecauseDailyLimit ? "Queued" : attempts >= 3 ? "Failed" : "Queued";

        await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
          ...freshObj,
          "Send Status": finalStatus,
          "Attempt Count": String(finalAttempts),
          "Queue Lock ID": "",
          "Queue Locked At": "",
          "Queue Attempt ID": attemptId,
          Notes: retryBecauseDailyLimit
            ? `Daily limit reached. Kept queued for next cron/day without increasing permanent attempts: ${errorMessage.slice(0, 220)}`
            : `Queue send failed${attempts >= 3 ? " permanently" : "; will retry"}: ${errorMessage.slice(0, 300)}`,
        });

        failed.push({
          rowNumber,
          email: finalEmail,
          attempts: finalAttempts,
          retryBecauseDailyLimit,
          error: errorMessage,
        });
      }
    }

    const result = {
      success: true,
      checked: candidates.length,
      sentCount: sent.length,
      failedCount: failed.length,
      skippedCount: skipped.length,
      durationMs: Date.now() - startedAtMs,
      sent,
      failed,
      skipped,
    };

    await writeCronStatus("sheetQueuedSends", {
      success: true,
      checked: result.checked,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      durationMs: result.durationMs,
    });

    return json(result);
  } finally {
    await releaseCronLock(cronLock).catch((error: any) => console.warn("Sheet queued sends cron lock release failed:", error));
  }
}


function serializeApiMillis(value: any): number | null {
  const ms = toMillis(value);
  if (ms) return ms;
  if (typeof value?._seconds === "number") return value._seconds * 1000;
  return null;
}

function serializeScheduledLead(docSnap: FirestoreQueryDocSnap | FirestoreDocSnap) {
  const data: any = docSnap.data() || {};
  return {
    id: docSnap.id,
    email: data.email || "",
    emailLower: data.emailLower || "",
    name: data.name || "",
    company_name: data.company_name || "",
    website: data.website || "",
    business_type: data.business_type || "",
    service: data.service || "",
    sender_id: data.sender_id || data.senderId || "",
    sender_email: data.sender_email || "",
    sender_name: data.sender_name || "",
    subject: data.subject || "",
    message: data.message || "",
    status: data.status || "",
    scheduledAt: serializeApiMillis(data.scheduledAt),
    scheduledProvider: data.scheduledProvider || "",
    providerScheduleStatus: data.providerScheduleStatus || "",
    brevoScheduled: data.brevoScheduled === true,
    brevoScheduledAt: serializeApiMillis(data.brevoScheduledAt),
    brevoScheduledAtIso: data.brevoScheduledAtIso || "",
    scheduledAcceptedAt: serializeApiMillis(data.scheduledAcceptedAt),
    brevoMessageId: data.brevoMessageId || "",
    sentAt: serializeApiMillis(data.sentAt),
    lastSentAt: serializeApiMillis(data.lastSentAt),
    createdAt: serializeApiMillis(data.createdAt),
    updatedAt: serializeApiMillis(data.updatedAt),
    reportUrl: data.reportUrl || "",
    reportButtonText: data.reportButtonText || "View short audit note",
    include_signature: data.include_signature !== false,
    signatureMode: data.signatureMode || "full",
    sheetRowNumber: data.sheetRowNumber || null,
    source: data.source || "",
    error: data.error || "",
    automationLock: data.automationLock || null,
  };
}


type LeadManagementView = "active" | "archived" | "trash" | "all";

function serializeRecentTrackingHistory(value: any, maxItems = 10) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map((entry: any) => ({
      event: String(entry?.event || entry?.type || "activity"),
      time: serializeApiMillis(entry?.time || entry?.createdAt || entry?.at),
      link: entry?.link || entry?.url || "",
      step: entry?.step ?? null,
      step_tag: entry?.step_tag || entry?.trackingTag || "",
      source: entry?.source || "",
    }))
    .filter((entry: any) => entry.time || entry.event)
    .sort((a: any, b: any) => Number(b.time || 0) - Number(a.time || 0))
    .slice(0, maxItems);
}

function serializeSentMessages(value: any, maxItems = 8) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map((entry: any) => ({
      step: Number(entry?.step || 0) || 0,
      subject: String(entry?.subject || ""),
      sentAt: serializeApiMillis(entry?.sentAt || entry?.time || entry?.createdAt),
      trackingTag: entry?.trackingTag || entry?.step_tag || "",
    }))
    .filter((entry: any) => entry.sentAt || entry.subject)
    .sort((a: any, b: any) => Number(b.sentAt || 0) - Number(a.sentAt || 0))
    .slice(0, maxItems);
}

function serializeManagedLead(docSnap: FirestoreQueryDocSnap | FirestoreDocSnap) {
  const data: any = docSnap.data() || {};
  return {
    id: docSnap.id,
    email: data.email || "",
    emailLower: data.emailLower || "",
    name: data.name || "",
    company_name: data.company_name || "",
    website: data.website || "",
    business_type: data.business_type || "",
    service: data.service || "",
    sender_id: data.sender_id || data.senderId || "",
    sender_email: data.sender_email || "",
    sender_name: data.sender_name || "",
    subject: data.subject || "",
    message: data.message || "",
    status: data.status || "",
    stopAutomation: data.stopAutomation === true,
    follow_up_count: Number(data.follow_up_count || 0),
    open_count: Number(data.open_count || 0),
    click_count: Number(data.click_count || 0),
    createdAt: serializeApiMillis(data.createdAt),
    sentAt: serializeApiMillis(data.sentAt),
    firstOpenedAt: serializeApiMillis(data.firstOpenedAt),
    lastOpenedAt: serializeApiMillis(data.lastOpenedAt),
    firstClickedAt: serializeApiMillis(data.firstClickedAt),
    lastClickedAt: serializeApiMillis(data.lastClickedAt),
    lastClickedUrl: data.lastClickedUrl || "",
    lastEngagedAt: serializeApiMillis(data.lastEngagedAt),
    lastFollowUp: serializeApiMillis(data.lastFollowUp),
    nextFollowupAt: serializeApiMillis(data.nextFollowupAt),
    nextFollowupStep: Number(data.nextFollowupStep || 0) || null,
    nextFollowupStatus: data.nextFollowupStatus || "",
    nextFollowupReason: data.nextFollowupReason || "",
    archived: data.archived === true,
    archivedAt: serializeApiMillis(data.archivedAt),
    archiveReason: data.archiveReason || "",
    deleted: data.deleted === true,
    deletedAt: serializeApiMillis(data.deletedAt),
    deleteReason: data.deleteReason || "",
    source: data.source || "",
    sourceOrigin: data.sourceOrigin || "",
    sourceRole: data.sourceRole || "",
    keepUnderSheetAudit: data.keepUnderSheetAudit === true,
    parentSheetRowNumber: data.parentSheetRowNumber || null,
    parentSheetEmail: data.parentSheetEmail || "",
    parentSheetWebsiteUrl: data.parentSheetWebsiteUrl || "",
    parentReportToken: data.parentReportToken || "",
    sourceKind: getLeadSourceKind(data as LeadData),
    sheetRowNumber: data.sheetRowNumber || null,
    sheetFinalEmail: data.sheetFinalEmail || "",
    sheetWebsiteUrl: data.sheetWebsiteUrl || "",
    reportToken: data.reportToken || "",
    reportUrl: data.reportUrl || "",
    trackingId: data.trackingId || "",
    tracking_history: serializeRecentTrackingHistory(data.tracking_history, 10),
    sent_messages: serializeSentMessages(data.sent_messages, 8),
  };
}

function parseMonthRange(month: string) {
  const value = String(month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  return {
    start: admin.firestore.Timestamp.fromDate(start),
    end: admin.firestore.Timestamp.fromDate(end),
  };
}

function isLeadInManagementView(data: any, view: LeadManagementView) {
  const archived = data?.archived === true;
  const deleted = data?.deleted === true;
  if (view === "archived") return archived && !deleted;
  if (view === "trash") return deleted;
  if (view === "all") return true;
  return !archived && !deleted;
}

function isLikelyTestLead(data: any) {
  const text = [data.email, data.emailLower, data.name, data.company_name, data.source, data.subject]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /(^|[^a-z])(test|dummy|sample|fake|example)([^a-z]|$)/i.test(text) || text.includes("@example.") || text.includes("test@");
}

/** GET /api/trackflow/leads */
async function handleLeadsGet(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const limitParam = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 20), 50));
  const view = (String(url.searchParams.get("view") || "active").trim() || "active") as LeadManagementView;
  const status = String(url.searchParams.get("status") || "All").trim();
  const sourceFilter = String(url.searchParams.get("source") || "all").trim().toLowerCase();
  const month = String(url.searchParams.get("month") || "").trim();
  const cursor = Number(url.searchParams.get("cursor") || 0);
  const fetchLimit = Math.min(Math.max(limitParam * 6, limitParam), 300);

  let baseQuery: FirestoreQueryRef = adminDb.collection("outreach_leads");
  const monthRange = parseMonthRange(month);
  if (monthRange) {
    baseQuery = baseQuery.where("createdAt", ">=", monthRange.start).where("createdAt", "<", monthRange.end);
  }
  if (Number.isFinite(cursor) && cursor > 0) {
    baseQuery = baseQuery.where("createdAt", "<", admin.firestore.Timestamp.fromMillis(cursor));
  }

  const snap = await baseQuery.orderBy("createdAt", "desc").limit(fetchLimit).get();
  const rows: any[] = [];
  let nextCursor: string | null = null;

  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    if (!isLeadInManagementView(data, view)) continue;
    if (status && status !== "All" && String(data.status || "") !== status) continue;
    const leadSourceKind = getLeadSourceKind(data as LeadData);
    const leadSourceRole = getLeadSourceRole(data as LeadData);
    const normalizedSourceFilter = sourceFilter === "manual" ? "cold" : sourceFilter;
    if (["cold", "sheet", "test"].includes(normalizedSourceFilter) && leadSourceKind !== normalizedSourceFilter) continue;
    if (normalizedSourceFilter === "manual_report_linked" && leadSourceRole !== "manual_report_linked") continue;
    if (normalizedSourceFilter === "sheet_primary" && leadSourceRole !== "sheet_primary") continue;
    if (normalizedSourceFilter === "sheet_additional" && leadSourceRole !== "sheet_additional") continue;
    rows.push(serializeManagedLead(docSnap));
    if (rows.length >= limitParam) break;
  }

  const lastDoc = snap.docs[snap.docs.length - 1];
  if (lastDoc) {
    const lastCreatedAt = serializeApiMillis((lastDoc.data() || {}).createdAt);
    nextCursor = lastCreatedAt ? String(lastCreatedAt) : null;
  }

  return json({
    success: true,
    count: rows.length,
    rows,
    view,
    status,
    source: sourceFilter || "all",
    month: month || "All",
    hasMore: snap.docs.length === fetchLimit && Boolean(nextCursor),
    nextCursor,
  });
}

async function updateLeadsInChunks(ids: string[], buildUpdate: (id: string) => Record<string, any>) {
  let updated = 0;
  for (let start = 0; start < ids.length; start += 450) {
    const chunk = ids.slice(start, start + 450);
    const batch = adminDb.batch();
    for (const id of chunk) {
      batch.set(adminDb.collection("outreach_leads").doc(id), buildUpdate(id), { merge: true });
      updated += 1;
    }
    await batch.commit();
  }
  return updated;
}



function getLeadContactMemoryPayload(lead: LeadData, actor: string, mode: "manual_delete" | "report_cleanup" = "manual_delete"): Record<string, any> {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  const now = Date.now();
  const lastContactedMs = Math.max(
    toMillis(lead.lastEngagedAt),
    toMillis(lead.lastClickedAt),
    toMillis(lead.lastOpenedAt),
    toMillis(lead.sentAt),
    toMillis(lead.createdAt),
    now,
  );

  return {
    emailLower,
    lastOutcome: String(lead.status || "manual_deleted_keep_memory"),
    lastContactedAt: admin.firestore.Timestamp.fromMillis(lastContactedMs),
    cooldownUntil: admin.firestore.Timestamp.fromMillis(now + 45 * 86_400_000),
    memoryExpiresAt: admin.firestore.Timestamp.fromMillis(now + 45 * 86_400_000),
    companyName: lead.company_name || "",
    website: lead.website || lead.sheetWebsiteUrl || "",
    service: lead.service || "",
    openCount: Number(lead.open_count || 0),
    clickCount: Number(lead.click_count || 0),
    sourceLeadId: lead.id || "",
    source: mode,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor,
  };
}

async function deleteManualLeadRecord(leadId: string, lead: LeadData, options: { actor: string; keepMemory: boolean; reason: string }) {
  const sourceKind = getLeadSourceKind(lead);
  if (sourceKind === "sheet") {
    return { leadId, ok: false, skipped: true, reason: "sheet_audit_lead_use_report_cleanup" };
  }

  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  if (options.keepMemory && emailLower) {
    await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).set(getLeadContactMemoryPayload({ ...lead, id: leadId }, options.actor), { merge: true });
  } else if (emailLower) {
    await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).delete().catch(() => undefined);
  }

  const emailEventCleanup = await cleanupEmailEventsForLeadBeforeDelete(leadId, lead, 2000).catch((error: any) => ({
    ok: false,
    reason: String(error?.message || error || "email_event_cleanup_best_effort_failed").slice(0, 500),
  }));

  await adminDb.collection("outreach_leads").doc(leadId).delete();

  return {
    leadId,
    ok: true,
    skipped: false,
    email: emailLower,
    keptMemory: options.keepMemory,
    reason: options.reason,
    emailEventCleanup,
  };
}

/** POST /api/trackflow/leads/bulk-action */
async function handleLeadsBulkAction(req: Request) {
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const action = String(body.action || "").trim().toLowerCase();
  const ids: string[] = Array.isArray(body.ids)
    ? Array.from(new Set<string>(body.ids.map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 500)
    : [];

  if (!ids.length) throw new ApiError("Select at least one lead", 400);
  if (!["archive", "restore", "trash", "delete_permanent", "delete_manual_keep_memory", "delete_manual_no_footprint"].includes(action)) throw new ApiError("Invalid bulk action", 400);

  const actor = normalizeEmail(adminUser.email || "admin");

  if (action === "delete_manual_keep_memory" || action === "delete_manual_no_footprint") {
    const keepMemory = action === "delete_manual_keep_memory";
    const reason = String(body.reason || action).slice(0, 160);
    const results: any[] = [];

    for (const leadId of ids) {
      const ref = adminDb.collection("outreach_leads").doc(leadId);
      const snap = await ref.get();
      if (!snap.exists) {
        results.push({ leadId, ok: false, reason: "lead_not_found" });
        continue;
      }

      const lead = { id: snap.id, ...(snap.data() || {}) } as LeadData;
      results.push(await deleteManualLeadRecord(leadId, lead, { actor, keepMemory, reason }));
    }

    const deletedIds = results.filter((item) => item.ok && !item.skipped).map((item) => item.leadId);
    const skippedCount = results.filter((item) => item.skipped).length;

    return json({
      success: true,
      action,
      count: deletedIds.length,
      skippedCount,
      failedCount: results.filter((item) => !item.ok && !item.skipped).length,
      deletedIds,
      results,
      message: `${deletedIds.length} manual/test lead(s) deleted.${skippedCount ? ` ${skippedCount} sheet audit lead(s) skipped; use Report Cleanup.` : ""}`,
    });
  }

  if (action === "delete_permanent") {
    const sheetMode = ["delete", "mark", "skip"].includes(String(body.sheetMode || process.env.PERMANENT_DELETE_SHEET_MODE || "mark"))
      ? (String(body.sheetMode || process.env.PERMANENT_DELETE_SHEET_MODE || "mark") as "delete" | "mark" | "skip")
      : "mark";
    const dryRun = body.dryRun === true;
    const allowAssetCleanupFailure = body.allowAssetCleanupFailure === true;
    const reason = String(body.reason || "permanently_deleted_by_admin").slice(0, 160);
    const results: any[] = [];

    for (const leadId of ids) {
      const ref = adminDb.collection("outreach_leads").doc(leadId);
      const snap = await ref.get();
      if (!snap.exists) {
        results.push({ leadId, ok: false, reason: "lead_not_found" });
        continue;
      }

      const lead = { id: snap.id, ...(snap.data() || {}) } as LeadData;
      if (getLeadSourceKind(lead) === "sheet") {
        results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, skipped: true, reason: "sheet_audit_lead_use_report_cleanup" });
        continue;
      }
      if (dryRun) {
        results.push({
          leadId,
          email: lead.emailLower || lead.email || "",
          ok: true,
          dryRun: true,
          pdfFileId: getLeadDrivePdfFileIdForCleanup(lead),
          reportToken: getLeadReportTokenForCleanup(lead),
          sheetLinked: getLeadSourceKind(lead) === "sheet",
        });
        continue;
      }

      try {
        const assetCleanup = await cleanupLeadExternalAssetsBeforePermanentDelete(lead, {
          actor,
          reason,
          allowAssetCleanupFailure,
        });
        const sheet = await deleteOrMarkSheetRowForLead(lead, { mode: sheetMode, actor });
        const emailEventCleanup = await cleanupEmailEventsForLeadBeforeDelete(leadId, lead, 2000).catch((error: any) => ({
          ok: false,
          reason: String(error?.message || error || "email_event_cleanup_best_effort_failed").slice(0, 500),
        }));
        await ref.delete();

        results.push({
          leadId,
          email: lead.emailLower || lead.email || "",
          ok: true,
          sheet,
          assets: assetCleanup,
          emailEventCleanup,
        });
      } catch (error: any) {
        results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: error?.message || String(error) });
      }
    }

    const deleted = results.filter((item) => item.ok && !item.dryRun).length;
    return json({
      success: true,
      action,
      count: deleted,
      failedCount: results.filter((item) => !item.ok).length,
      dryRun,
      sheetMode,
      drivePdfDeleteMode: drivePdfDeleteMode(),
      requireDriveCleanup: shouldRequireDrivePdfCleanupOnLeadDelete(),
      results,
      message: dryRun ? `Dry-run checked ${results.length} lead(s).` : `Permanently deleted ${deleted} lead(s).`,
    });
  }

  const updated = await updateLeadsInChunks(ids, () => {
    const base: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === "archive") {
      return {
        ...base,
        archived: true,
        deleted: false,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        archivedBy: actor,
        archiveReason: String(body.reason || "archived_by_admin").slice(0, 120),
        stopAutomation: true,
        nextFollowupStatus: "blocked",
        nextFollowupReason: "archived_by_admin",
        automationLock: admin.firestore.FieldValue.delete(),
      };
    }

    if (action === "restore") {
      return {
        ...base,
        archived: false,
        deleted: false,
        restoredAt: admin.firestore.FieldValue.serverTimestamp(),
        restoredBy: actor,
        nextFollowupReason: "restored_by_admin_manual_review_required",
      };
    }

    return {
      ...base,
      archived: true,
      deleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: actor,
      deleteReason: String(body.reason || "moved_to_trash_by_admin").slice(0, 120),
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "deleted_by_admin",
      automationLock: admin.firestore.FieldValue.delete(),
    };
  });

  return json({ success: true, action, count: updated, message: `${action} applied to ${updated} lead(s).` });
}

async function countQuerySafe(queryRef: FirestoreQueryRef): Promise<number> {
  try {
    return await getCount(queryRef);
  } catch (error) {
    console.warn("Count query failed, returning 0:", error);
    return 0;
  }
}

/** GET /api/trackflow/system/usage-summary */
async function handleUsageSummary(req: Request) {
  await requireAdmin(req);
  const today = todayKey();
  const now = Date.now();
  const startOfToday = admin.firestore.Timestamp.fromDate(new Date(new Date().toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" })));

  const leadsRef = adminDb.collection("outreach_leads");
  const eventsRef = adminDb.collection("email_events");

  const [
    leadCount,
    archivedLeadCount,
    trashedLeadCount,
    emailEventCount,
    suppressionCount,
    eventsToday,
    dailyStatsSnap,
  ] = await Promise.all([
    countQuerySafe(leadsRef),
    countQuerySafe(leadsRef.where("archived", "==", true)),
    countQuerySafe(leadsRef.where("deleted", "==", true)),
    countQuerySafe(eventsRef),
    countQuerySafe(adminDb.collection("suppression_list")),
    countQuerySafe(eventsRef.where("createdAt", ">=", startOfToday)),
    adminDb.collection("daily_sending_stats").where("dateKey", "==", today).get(),
  ]);

  let initialSentToday = 0;
  let followupSentToday = 0;
  dailyStatsSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    initialSentToday += Number(data.initialSent || 0);
    followupSentToday += Number(data.followupSent || 0);
  });

  const activeLeadCount = Math.max(0, leadCount - archivedLeadCount - trashedLeadCount);
  const estimatedWritesToday = initialSentToday * 4 + followupSentToday * 5 + eventsToday * 2;
  const estimatedReadsToday = Math.max(0, Math.round((initialSentToday + followupSentToday) * 3 + eventsToday + 20));
  const estimatedDeletesToday = 0;
  const estimatedStorageMb = Math.round(((leadCount * 14 + emailEventCount * 1.5 + suppressionCount * 2) / 1024) * 10) / 10;

  return json({
    success: true,
    generatedAt: now,
    quota: {
      readsPerDay: 50_000,
      writesPerDay: 20_000,
      deletesPerDay: 20_000,
      storageMb: 1024,
    },
    usage: {
      estimatedReadsToday,
      estimatedWritesToday,
      estimatedDeletesToday,
      estimatedStorageMb,
      readPercent: Math.round((estimatedReadsToday / 50_000) * 1000) / 10,
      writePercent: Math.round((estimatedWritesToday / 20_000) * 1000) / 10,
      deletePercent: 0,
      storagePercent: Math.round((estimatedStorageMb / 1024) * 1000) / 10,
    },
    counts: {
      leadCount,
      activeLeadCount,
      archivedLeadCount,
      trashedLeadCount,
      emailEventCount,
      suppressionCount,
      initialSentToday,
      followupSentToday,
      eventsToday,
    },
    note: "Usage values are practical TrackFlowPro estimates. Firebase Console remains the final billing/quota source.",
  });
}

/** POST /api/trackflow/system/cleanup */
async function handleSystemCleanup(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const action = String(body.action || "").trim().toLowerCase();
  const days = Math.max(1, Math.min(Number(body.days || 30), 730));
  const threshold = admin.firestore.Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);

  if (!["archive_replied", "archive_finished", "trash_test_leads", "delete_old_events"].includes(action)) {
    throw new ApiError("Invalid cleanup action", 400);
  }

  if (action === "delete_old_events") {
    const snap = await adminDb.collection("email_events").where("createdAt", "<", threshold).limit(300).get();
    const batch = adminDb.batch();
    snap.docs.forEach((docSnap: any) => batch.delete(docSnap.ref));
    await batch.commit();
    return json({ success: true, action, count: snap.size, message: `Deleted ${snap.size} old email event(s).` });
  }

  const snap = await adminDb.collection("outreach_leads").where("createdAt", "<", threshold).orderBy("createdAt", "asc").limit(500).get();
  const ids: string[] = [];

  snap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    if (action === "archive_replied" && String(data.status || "") === "replied" && data.deleted !== true) ids.push(docSnap.id);
    if (action === "archive_finished" && ["finished", "cancelled", "bounced", "spam", "unsubscribed"].includes(String(data.status || "")) && data.deleted !== true) ids.push(docSnap.id);
    if (action === "trash_test_leads" && isLikelyTestLead(data)) ids.push(docSnap.id);
  });

  if (!ids.length) return json({ success: true, action, count: 0, message: "No matching records found." });

  if (action === "trash_test_leads") {
    const count = await updateLeadsInChunks(ids, () => ({
      archived: true,
      deleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deleteReason: "cleanup_test_leads",
      stopAutomation: true,
      nextFollowupStatus: "blocked",
      nextFollowupReason: "cleanup_test_leads",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));
    return json({ success: true, action, count, message: `Moved ${count} test lead(s) to trash.` });
  }

  const count = await updateLeadsInChunks(ids, () => ({
    archived: true,
    deleted: false,
    archivedAt: admin.firestore.FieldValue.serverTimestamp(),
    archiveReason: action,
    stopAutomation: true,
    nextFollowupStatus: "blocked",
    nextFollowupReason: action,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, action, count, message: `Archived ${count} lead(s).` });
}



/**
 * LEAD CLEANUP + FOOTPRINT MEMORY SYSTEM
 * বাংলা ব্যাখ্যা:
 * - Full lead data 45/60/90 দিন পরে Firebase + Google Sheet থেকে clean করা যাবে।
 * - Delete করার আগে contact_memory বা suppression_list-এ ছোট footprint রাখা হয়।
 * - Queued/Processing lead কখনো hard delete করা হয় না, যাতে automation নষ্ট না হয়।
 */

type CleanupOutcome =
  | "cold_no_reply"
  | "warm_no_reply"
  | "replied_review"
  | "suppression_required"
  | "not_due"
  | "blocked";

type CleanupDecision = {
  eligible: boolean;
  outcome: CleanupOutcome;
  reason: string;
  daysOld: number;
  lastContactedMs: number;
  dueAtMs: number;
  cooldownMonths: number;
  memoryMonths: number;
  protectedLead: boolean;
  blockedReasons: string[];
};

const COLD_NO_REPLY_DELETE_DAYS = 45;
const WARM_NO_REPLY_DELETE_DAYS = 90;
const REPLIED_REVIEW_DAYS = 365;
const COLD_NO_REPLY_COOLDOWN_MONTHS = 6;
const WARM_NO_REPLY_COOLDOWN_MONTHS = 12;
const REPLIED_MEMORY_MONTHS = 36;

function addMonthsMs(anchorMs: number, months: number): number {
  const date = new Date(anchorMs || Date.now());
  date.setMonth(date.getMonth() + months);
  return date.getTime();
}

function getLeadLastContactedMs(lead: LeadData): number {
  return Math.max(
    toMillis(lead.lastFollowUp),
    toMillis(lead.lastSentAt),
    toMillis(lead.sentAt),
    toMillis(lead.createdAt)
  );
}

function getLeadLastEngagedMsForCleanup(lead: LeadData): number {
  return Math.max(toMillis(lead.lastEngagedAt), toMillis(lead.lastClickedAt), toMillis(lead.lastOpenedAt || lead.last_opened));
}

function leadHasEngagementForCleanup(lead: LeadData): boolean {
  return Number(lead.open_count || 0) > 0 || Number(lead.click_count || 0) > 0 || getLeadLastEngagedMsForCleanup(lead) > 0;
}

function isCleanupProcessingBlocked(lead: LeadData): string[] {
  const blockers: string[] = [];
  const status = String(lead.status || "").toLowerCase();
  const next = String(lead.nextFollowupStatus || "").toLowerCase();

  if (["processing_initial", "processing_followup"].includes(status)) blockers.push(`status:${status}`);
  if (next === "processing") blockers.push("next_followup_processing");
  if (lead.automationLock) blockers.push("automation_lock_present");

  return blockers;
}

function getLeadSourceRole(lead: LeadData): "manual" | "manual_report_linked" | "sheet_primary" | "sheet_additional" | "test" {
  const source = String(lead.source || "").toLowerCase();
  const sourceOrigin = String(lead.sourceOrigin || "").toLowerCase();
  const sourceRole = String(lead.sourceRole || "").toLowerCase();
  const email = normalizeEmail(lead.emailLower || lead.email || "");

  if (sourceRole === "test" || source.includes("test") || email.includes("test@") || email === normalizeEmail(MAIN_INBOX_EMAIL)) return "test";
  if (sourceRole === "sheet_primary") return "sheet_primary";
  if (sourceRole === "sheet_additional_recipient" || sourceRole === "sheet_additional") return "sheet_additional";
  if (sourceRole === "manual_report_linked") return "manual_report_linked";
  if (lead.keepUnderSheetAudit === true || sourceOrigin === "sheet") {
    const sheetEmail = normalizeEmail(lead.sheetFinalEmail || lead.parentSheetEmail || "");
    return sheetEmail && sheetEmail !== email ? "sheet_additional" : "sheet_primary";
  }
  if (source.includes("google_sheet") && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (Number(lead.sheetRowNumber || 0) > 0 && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (lead.reportToken || lead.reportUrl) return "manual_report_linked";
  return "manual";
}

function getLeadSourceKind(lead: LeadData): "sheet" | "cold" | "test" {
  const role = getLeadSourceRole(lead);
  if (role === "test") return "test";
  if (role === "sheet_primary" || role === "sheet_additional") return "sheet";
  return "cold";
}

function getCleanupDecision(lead: LeadData, nowMs = Date.now()): CleanupDecision {
  const blockedReasons = isCleanupProcessingBlocked(lead);
  const lastContactedMs = getLeadLastContactedMs(lead);
  const daysOld = lastContactedMs ? Math.floor((nowMs - lastContactedMs) / 86_400_000) : 0;
  const status = String(lead.status || "").toLowerCase();
  const hasEngagement = leadHasEngagementForCleanup(lead);
  const hardStop = ["unsubscribed", "spam", "bounced", "not_interested", "blocked_suppressed"].includes(status);

  if (blockedReasons.length > 0) {
    return {
      eligible: false,
      outcome: "blocked",
      reason: blockedReasons.join(","),
      daysOld,
      lastContactedMs,
      dueAtMs: 0,
      cooldownMonths: 0,
      memoryMonths: 0,
      protectedLead: true,
      blockedReasons,
    };
  }

  if (!lastContactedMs) {
    return {
      eligible: false,
      outcome: "not_due",
      reason: "missing_last_contacted_time",
      daysOld,
      lastContactedMs,
      dueAtMs: 0,
      cooldownMonths: 0,
      memoryMonths: 0,
      protectedLead: false,
      blockedReasons: ["missing_last_contacted_time"],
    };
  }

  if (hardStop) {
    return {
      eligible: true,
      outcome: "suppression_required",
      reason: `hard_stop:${status}`,
      daysOld,
      lastContactedMs,
      dueAtMs: lastContactedMs,
      cooldownMonths: 0,
      memoryMonths: 120,
      protectedLead: false,
      blockedReasons,
    };
  }

  if (status === "replied" || status === "interested") {
    const dueAtMs = lastContactedMs + REPLIED_REVIEW_DAYS * 86_400_000;
    return {
      eligible: nowMs >= dueAtMs,
      outcome: nowMs >= dueAtMs ? "replied_review" : "not_due",
      reason: nowMs >= dueAtMs ? "replied_one_year_review_due" : "replied_keep_until_one_year",
      daysOld,
      lastContactedMs,
      dueAtMs,
      cooldownMonths: 0,
      memoryMonths: REPLIED_MEMORY_MONTHS,
      protectedLead: true,
      blockedReasons,
    };
  }

  if (hasEngagement) {
    const dueAtMs = lastContactedMs + WARM_NO_REPLY_DELETE_DAYS * 86_400_000;
    return {
      eligible: nowMs >= dueAtMs,
      outcome: nowMs >= dueAtMs ? "warm_no_reply" : "not_due",
      reason: nowMs >= dueAtMs ? "warm_no_reply_cleanup_due" : "warm_no_reply_not_due",
      daysOld,
      lastContactedMs,
      dueAtMs,
      cooldownMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
      memoryMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
      protectedLead: false,
      blockedReasons,
    };
  }

  const dueAtMs = lastContactedMs + COLD_NO_REPLY_DELETE_DAYS * 86_400_000;
  return {
    eligible: nowMs >= dueAtMs,
    outcome: nowMs >= dueAtMs ? "cold_no_reply" : "not_due",
    reason: nowMs >= dueAtMs ? "cold_no_reply_cleanup_due" : "cold_no_reply_not_due",
    daysOld,
    lastContactedMs,
    dueAtMs,
    cooldownMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
    memoryMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
    protectedLead: false,
    blockedReasons,
  };
}

function serializeCleanupCandidate(docSnap: any, nowMs = Date.now()) {
  const lead = { id: docSnap.id, ...(docSnap.data() || {}) } as LeadData;
  const decision = getCleanupDecision(lead, nowMs);
  const sourceKind = getLeadSourceKind(lead);
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");

  return {
    leadId: docSnap.id,
    email: emailLower,
    name: lead.name || "",
    company: lead.company_name || "",
    website: lead.website || lead.sheetWebsiteUrl || "",
    service: lead.service || "",
    status: lead.status || "",
    source: lead.source || "",
    sourceKind,
    sheetLinked: sourceKind === "sheet",
    sheetRowNumber: Number(lead.sheetRowNumber || 0) || null,
    openCount: Number(lead.open_count || 0),
    clickCount: Number(lead.click_count || 0),
    followUpCount: Number(lead.follow_up_count || 0),
    lastContactedAt: decision.lastContactedMs ? new Date(decision.lastContactedMs).toISOString() : "",
    dueAt: decision.dueAtMs ? new Date(decision.dueAtMs).toISOString() : "",
    daysOld: decision.daysOld,
    eligible: decision.eligible,
    outcome: decision.outcome,
    reason: decision.reason,
    protectedLead: decision.protectedLead,
    cooldownMonths: decision.cooldownMonths,
    memoryMonths: decision.memoryMonths,
    blockedReasons: decision.blockedReasons,
  };
}

async function handleCleanupCandidates(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const bucket = String(url.searchParams.get("bucket") || "due").toLowerCase();
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 50), 100));
  const nowMs = Date.now();

  // Free-limit friendly: only read older leads that can realistically be near cleanup.
  const oldestNeededDays = bucket === "replied" ? REPLIED_REVIEW_DAYS : bucket === "warm" ? WARM_NO_REPLY_DELETE_DAYS : COLD_NO_REPLY_DELETE_DAYS;
  const threshold = admin.firestore.Timestamp.fromMillis(nowMs - oldestNeededDays * 86_400_000);

  const snap = await adminDb
    .collection("outreach_leads")
    .where("createdAt", "<=", threshold)
    .orderBy("createdAt", "asc")
    .limit(Math.min(max * 4, 300))
    .get();

  let rows = snap.docs.map((docSnap: any) => serializeCleanupCandidate(docSnap, nowMs));

  if (bucket === "due") rows = rows.filter((row: any) => row.eligible && !row.protectedLead);
  if (bucket === "cold") rows = rows.filter((row: any) => row.outcome === "cold_no_reply");
  if (bucket === "warm") rows = rows.filter((row: any) => row.outcome === "warm_no_reply");
  if (bucket === "replied") rows = rows.filter((row: any) => row.outcome === "replied_review");
  if (bucket === "protected") rows = rows.filter((row: any) => row.protectedLead || row.outcome === "suppression_required");
  if (bucket === "upcoming") rows = rows.filter((row: any) => !row.eligible && row.dueAt && row.outcome === "not_due");

  rows = rows.slice(0, max);

  return json({
    success: true,
    bucket,
    checked: snap.size,
    count: rows.length,
    generatedAt: new Date(nowMs).toISOString(),
    policy: {
      coldNoReplyDeleteDays: COLD_NO_REPLY_DELETE_DAYS,
      warmNoReplyDeleteDays: WARM_NO_REPLY_DELETE_DAYS,
      repliedReviewDays: REPLIED_REVIEW_DAYS,
      coldCooldownMonths: COLD_NO_REPLY_COOLDOWN_MONTHS,
      warmCooldownMonths: WARM_NO_REPLY_COOLDOWN_MONTHS,
    },
    rows,
  });
}

function buildContactMemoryPayload(lead: LeadData, decision: CleanupDecision, actor: string, nowMs = Date.now()) {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  const lastContactedMs = decision.lastContactedMs || getLeadLastContactedMs(lead) || nowMs;
  const cooldownUntilMs =
    decision.cooldownMonths > 0 ? addMonthsMs(lastContactedMs, decision.cooldownMonths) : addMonthsMs(nowMs, 120);
  const memoryExpiresAtMs =
    decision.memoryMonths > 0 ? addMonthsMs(lastContactedMs, decision.memoryMonths) : addMonthsMs(nowMs, 120);

  return {
    emailLower,
    sourceLeadId: lead.id || "",
    companyName: lead.company_name || "",
    website: lead.website || lead.sheetWebsiteUrl || "",
    service: lead.service || "",
    source: lead.source || "",
    lastOutcome: decision.outcome,
    lastContactedAt: admin.firestore.Timestamp.fromMillis(lastContactedMs),
    cooldownUntil: admin.firestore.Timestamp.fromMillis(cooldownUntilMs),
    memoryExpiresAt: admin.firestore.Timestamp.fromMillis(memoryExpiresAtMs),
    openCount: Number(lead.open_count || 0),
    clickCount: Number(lead.click_count || 0),
    followUpCount: Number(lead.follow_up_count || 0),
    cleanupReason: decision.reason,
    createdByCleanupActor: actor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function getSheetIdByTitle(sheets: any, spreadsheetId: string, title = SHEET_NAME): Promise<number | null> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const found = (meta.data.sheets || []).find((sheet: any) => sheet?.properties?.title === title);
  return typeof found?.properties?.sheetId === "number" ? found.properties.sheetId : null;
}

async function findSheetRowNumberForLead(sheets: any, spreadsheetId: string, lead: LeadData): Promise<number> {
  const rows = await loadRows(sheets, spreadsheetId);
  const targetLeadId = clean(lead.id);
  const targetTrackingId = clean(lead.trackingId);
  const targetEmail = normalizeEmail(lead.sheetFinalEmail || lead.emailLower || lead.email || "");
  const targetWebsite = normalizeUrlForSheet(lead.sheetWebsiteUrl || lead.website || "");

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const obj = rowToObject(row, rowNumber);

    if (targetLeadId && clean(obj["Firestore Lead ID"]) === targetLeadId) return rowNumber;
    if (targetTrackingId && clean(obj["Tracking ID"]) === targetTrackingId) return rowNumber;

    const rowEmail = normalizeEmail(obj["Final Email"]);
    const rowWebsite = normalizeUrlForSheet(obj["Website URL"]);
    if (targetEmail && targetWebsite && rowEmail === targetEmail && rowWebsite === targetWebsite) return rowNumber;
  }

  const fallbackRow = Number(lead.sheetRowNumber || 0);
  if (fallbackRow > 1 && rows[fallbackRow - 2]) return fallbackRow;
  return 0;
}

async function deleteOrMarkSheetRowForLead(
  lead: LeadData,
  options: { mode?: "delete" | "mark" | "skip"; actor?: string } = {}
): Promise<{ ok: boolean; mode: string; rowNumber?: number; reason?: string }> {
  const mode = options.mode || "delete";
  if (mode === "skip") return { ok: true, mode: "skip", reason: "sheet_skipped" };
  if (getLeadSourceKind(lead) !== "sheet") return { ok: true, mode: "not_linked", reason: "lead_not_linked_to_sheet" };

  const { sheets, spreadsheetId } = await getSheetsClient();
  await ensureHeaderRow(sheets, spreadsheetId);
  const rowNumber = await findSheetRowNumberForLead(sheets, spreadsheetId, lead);

  if (!rowNumber) return { ok: false, mode, reason: "sheet_row_not_found" };

  if (mode === "mark") {
    const existing = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
    await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, {
      ...existing,
      "Archive Status": "Deleted",
      "Send Status": "Deleted",
      "Report Token": "",
      "Report URL": "",
      "PDF File ID": "",
      "PDF View URL": "",
      "PDF Download URL": "",
      "PDF Expires At": "",
      "Queue Lock ID": "",
      "Queue Locked At": "",
      "Queue Attempt ID": "",
      Notes: `Deleted from Firebase with footprint memory by ${options.actor || "admin"} at ${nowDhaka()}`,
    });
    return { ok: true, mode: "mark", rowNumber };
  }

  const sheetId = await getSheetIdByTitle(sheets, spreadsheetId);
  if (sheetId === null) return { ok: false, mode, rowNumber, reason: "sheet_id_not_found" };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  return { ok: true, mode: "delete", rowNumber };
}

async function saveFootprintBeforeDelete(lead: LeadData, decision: CleanupDecision, actor: string) {
  const emailLower = normalizeEmail(lead.emailLower || lead.email || "");
  if (!isValidEmail(emailLower)) throw new ApiError("Cannot save footprint: invalid email", 400);

  const status = String(lead.status || "").toLowerCase();
  if (["unsubscribed", "spam", "bounced", "not_interested", "blocked_suppressed"].includes(status)) {
    await addSuppression(emailLower, status || "suppressed_by_cleanup", {
      sourceLeadId: lead.id || "",
      cleanupReason: decision.reason,
      createdByCleanupActor: actor,
    });
  }

  await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).set(
    buildContactMemoryPayload(lead, decision, actor),
    { merge: true }
  );
}

async function handleCleanupDeleteFullKeepMemory(req: Request) {
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 50)
    : [];

  if (!ids.length) throw new ApiError("Select at least one cleanup candidate", 400);

  const actor = normalizeEmail(adminUser.email || "admin");
  const sheetMode = ["delete", "mark", "skip"].includes(String(body.sheetMode || "delete")) ? String(body.sheetMode || "delete") as "delete" | "mark" | "skip" : "delete";
  const force = body.force === true;
  const dryRun = body.dryRun === true;

  const results: any[] = [];

  for (const leadId of ids) {
    const ref = adminDb.collection("outreach_leads").doc(leadId);
    const snap = await ref.get();

    if (!snap.exists) {
      results.push({ leadId, ok: false, reason: "lead_not_found" });
      continue;
    }

    const lead = { id: snap.id, ...(snap.data() || {}) } as LeadData;
    const decision = getCleanupDecision(lead);
    if ((!decision.eligible || decision.protectedLead) && !force) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: decision.reason, decision });
      continue;
    }

    if (isCleanupProcessingBlocked(lead).length > 0) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: "processing_or_locked", blockers: isCleanupProcessingBlocked(lead) });
      continue;
    }

    if (dryRun) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: true, dryRun: true, decision });
      continue;
    }

    try {
      await saveFootprintBeforeDelete(lead, decision, actor);
      const assetCleanup = await cleanupLeadExternalAssetsBeforePermanentDelete(lead, {
        actor,
        reason: decision.reason,
        allowAssetCleanupFailure: body.allowAssetCleanupFailure === true,
      });
      const sheetResult = await deleteOrMarkSheetRowForLead(lead, { mode: sheetMode, actor });
      await ref.delete();

      results.push({
        leadId,
        email: lead.emailLower || lead.email || "",
        ok: true,
        outcome: decision.outcome,
        sheet: sheetResult,
        assets: assetCleanup,
        message: "Full lead deleted after footprint memory was saved, Drive PDF cleanup was attempted, and the report page was deactivated.",
      });
    } catch (error: any) {
      results.push({ leadId, email: lead.emailLower || lead.email || "", ok: false, reason: error?.message || String(error) });
    }
  }

  const deletedCount = results.filter((item) => item.ok && !item.dryRun).length;
  await writeCronStatus("manualCleanup", {
    success: true,
    checked: ids.length,
    deletedCount,
    failedCount: results.filter((item) => !item.ok).length,
    lastError: "",
    source: "dashboard_manual_button",
  });

  return json({ success: true, count: results.length, deletedCount, results });
}

function serializeTimestampIso(value: any): string {
  const ms = toMillis(value);
  return ms ? new Date(ms).toISOString() : "";
}

function getFootprintDocActivityMs(data: Record<string, any> = {}): number {
  // Use real touch/contact timestamps only.
  // Do not use cooldownUntil or memoryExpiresAt here because those are future
  // safety-window dates; including them makes old-footprint filters never match.
  return Math.max(
    toMillis(data.updatedAt),
    toMillis(data.createdAt),
    toMillis(data.lastContactedAt),
    toMillis(data.allowedAgainAt),
    toMillis(data.allowAgainAt)
  );
}

function getLeadFootprintActivityMs(lead: Record<string, any> = {}): number {
  return Math.max(
    toMillis(lead.updatedAt),
    toMillis(lead.createdAt),
    toMillis(lead.sentAt),
    toMillis(lead.scheduledAt),
    toMillis(lead.lastOpenedAt),
    toMillis(lead.lastClickedAt),
    toMillis(lead.lastEngagedAt),
    toMillis(lead.lastFollowUp)
  );
}

function isActiveFootprintLead(lead: Record<string, any> = {}): boolean {
  const status = String(lead.status || "").trim().toLowerCase();
  if (["failed", "cancelled", "blocked_daily_limit", "draft"].includes(status)) return false;
  if (lead.deleted === true) return false;

  // Manual maintenance rule: when the operator uses Cleanup → Allow again
  // or Delete footprint, old outreach rows should stop blocking a new send.
  // The lead document can still stay for reporting/history unless the operator
  // deletes it from the Leads tab/report cleanup flow.
  if (
    lead.footprintAllowedAgain === true ||
    lead.footprintIgnored === true ||
    lead.allowedAgain === true ||
    lead.allowRecontact === true ||
    toMillis(lead.footprintAllowedAgainAt) ||
    toMillis(lead.footprintIgnoredAt)
  ) {
    return false;
  }

  return Boolean(lead.id || lead.emailLower || lead.email);
}

function serializeFootprintMemoryRow(
  emailKey: string,
  memory: Record<string, any> | null,
  suppression: Record<string, any> | null,
  leads: Record<string, any>[] = [],
) {
  const primaryLead = leads
    .slice()
    .sort((a, b) => getLeadFootprintActivityMs(b) - getLeadFootprintActivityMs(a))[0] || null;
  const emailLower = normalizeEmail(
    String(memory?.emailLower || suppression?.emailLower || primaryLead?.emailLower || primaryLead?.email || decodeURIComponent(emailKey || "").replace(/%2E/gi, ".")),
  );
  const cooldownMs = toMillis(memory?.cooldownUntil);
  const memoryExpiresMs = toMillis(memory?.memoryExpiresAt);
  const nowMs = Date.now();
  const suppressionAllowedAgain = Boolean(suppression?.allowedAgain || suppression?.allowedAgainAt || suppression?.allowAgainAt);
  const memoryAllowedAgain = Boolean(memory?.allowedAgain || memory?.allowedAgainAt || memory?.allowAgainAt);
  const suppressionActive = Boolean(suppression && !suppressionAllowedAgain);
  const contactMemoryActive = Boolean(memory && cooldownMs > nowMs && (!memoryExpiresMs || memoryExpiresMs > nowMs) && !memoryAllowedAgain);
  const activeLeadCount = leads.filter(isActiveFootprintLead).length;
  const leadBlocked = activeLeadCount > 0;
  const allowedAgain = !leadBlocked && (memoryAllowedAgain || suppressionAllowedAgain || (!suppressionActive && !contactMemoryActive));
  const status = suppressionActive ? "requires_permission" : allowedAgain ? "allowed_again" : "blocked";
  const lastActivityMs = Math.max(
    getFootprintDocActivityMs(memory || {}),
    getFootprintDocActivityMs(suppression || {}),
    ...leads.map(getLeadFootprintActivityMs),
  );

  const hasMemory = Boolean(memory);
  const hasSuppression = Boolean(suppression);
  const hasLeads = leads.length > 0;
  const source = hasSuppression && (hasMemory || hasLeads)
    ? "combined"
    : hasSuppression
      ? "suppression_list"
      : hasMemory
        ? "contact_memory"
        : "outreach_lead";

  return {
    email: emailLower,
    emailLower,
    companyName: String(memory?.companyName || suppression?.companyName || primaryLead?.company_name || primaryLead?.companyName || ""),
    website: String(memory?.website || suppression?.website || primaryLead?.website || primaryLead?.sheetWebsiteUrl || ""),
    service: String(memory?.service || primaryLead?.service || ""),
    reason: String(memory?.cleanupReason || suppression?.reason || memory?.lastOutcome || (hasLeads ? "existing_outreach_lead" : "safety_memory")),
    lastOutcome: String(memory?.lastOutcome || suppression?.reason || primaryLead?.status || (hasLeads ? "existing_outreach_lead" : "safety_memory")),
    status,
    statusLabel: status === "allowed_again" ? "Allowed again" : status === "requires_permission" ? "Suppression protected" : hasLeads ? "Lead record exists" : "Blocked",
    source,
    lastActivityAt: lastActivityMs ? new Date(lastActivityMs).toISOString() : "",
    lastContactedAt: serializeTimestampIso(memory?.lastContactedAt || primaryLead?.sentAt || primaryLead?.createdAt),
    cooldownUntil: serializeTimestampIso(memory?.cooldownUntil),
    memoryExpiresAt: serializeTimestampIso(memory?.memoryExpiresAt),
    updatedAt: serializeTimestampIso(memory?.updatedAt || suppression?.updatedAt || primaryLead?.updatedAt),
    openCount: Number(memory?.openCount || primaryLead?.open_count || 0),
    clickCount: Number(memory?.clickCount || primaryLead?.click_count || 0),
    sourceLeadId: String(memory?.sourceLeadId || suppression?.sourceLeadId || primaryLead?.id || ""),
    suppressionReason: String(suppression?.reason || ""),
    leadCount: leads.length,
    activeLeadCount,
    protected: hasSuppression,
    deletable: hasMemory && !hasSuppression,
  };
}
function footprintMatchesSearch(row: any, queryText: string): boolean {
  const q = queryText.trim().toLowerCase();
  if (!q) return true;
  return [row.emailLower, row.companyName, row.website, row.reason, row.lastOutcome, row.suppressionReason]
    .map((value) => String(value || "").toLowerCase())
    .some((value) => value.includes(q));
}

function normalizeFootprintEmails(input: any): string[] {
  const raw: unknown[] = Array.isArray(input?.emails) ? input.emails : [input?.email];
  const emails = raw
    .map((value) => normalizeEmail(String(value || "")))
    .filter((email): email is string => isValidEmail(email));

  return Array.from(new Set<string>(emails)).slice(0, 100);
}

async function handleFootprintMemoryList(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const queryText = String(url.searchParams.get("q") || url.searchParams.get("query") || "").trim();
  const filter = String(url.searchParams.get("filter") || "blocked").toLowerCase();
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const olderThanDays = Math.max(1, Math.min(Number(url.searchParams.get("olderThanDays") || 90), 3650));
  const olderThanCutoffMs = Date.now() - olderThanDays * 86_400_000;

  const maybeEmailQuery = isValidEmail(queryText) ? normalizeEmail(queryText) : "";
  const memoryLimit = maybeEmailQuery ? 1 : Math.min(max * 4, 800);
  const suppressionLimit = maybeEmailQuery ? 1 : Math.min(max * 4, 800);
  const leadLimit = maybeEmailQuery ? 25 : Math.min(max * 6, 1000);

  const [memorySnap, suppressionSnap, leadSnap] = await Promise.all([
    maybeEmailQuery
      ? adminDb.collection("contact_memory").where("emailLower", "==", maybeEmailQuery).limit(memoryLimit).get()
      : adminDb.collection("contact_memory").limit(memoryLimit).get(),
    maybeEmailQuery
      ? adminDb.collection("suppression_list").where("emailLower", "==", maybeEmailQuery).limit(suppressionLimit).get()
      : adminDb.collection("suppression_list").limit(suppressionLimit).get(),
    maybeEmailQuery
      ? adminDb.collection("outreach_leads").where("emailLower", "==", maybeEmailQuery).limit(leadLimit).get()
      : adminDb.collection("outreach_leads").limit(leadLimit).get(),
  ]);

  const byEmail = new Map<string, { memory: Record<string, any> | null; suppression: Record<string, any> | null; leads: Record<string, any>[] }>();
  const ensureEntry = (emailLower: string) => {
    const current = byEmail.get(emailLower) || { memory: null, suppression: null, leads: [] };
    byEmail.set(emailLower, current);
    return current;
  };

  memorySnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    const emailLower = normalizeEmail(data.emailLower || decodeURIComponent(docSnap.id).replace(/%2E/gi, "."));
    if (!emailLower) return;
    ensureEntry(emailLower).memory = data;
  });

  suppressionSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    const emailLower = normalizeEmail(data.emailLower || decodeURIComponent(docSnap.id).replace(/%2E/gi, "."));
    if (!emailLower) return;
    ensureEntry(emailLower).suppression = data;
  });

  leadSnap.docs.forEach((docSnap: any) => {
    const data = { id: docSnap.id, ...(docSnap.data() || {}) };
    const emailLower = normalizeEmail(data.emailLower || data.email || "");
    if (!emailLower) return;

    // Only active/blocking outreach rows should appear as footprint rows.
    // Rows already allowed/ignored by cleanup are historical lead records,
    // not active send blockers. Keeping them here made deleted footprints
    // reappear as "Allowed again" forever.
    if (!isActiveFootprintLead(data)) return;

    ensureEntry(emailLower).leads.push(data);
  });

  let rows = Array.from(byEmail.entries()).map(([email, value]) => serializeFootprintMemoryRow(email, value.memory, value.suppression, value.leads));

  if (filter === "blocked") {
    rows = rows.filter(
      (row: any) =>
        row.status !== "allowed_again" && row.source !== "suppression_list" && row.source !== "combined",
    );
  }
  if (filter === "old") {
    rows = rows.filter(
      (row: any) =>
        row.source !== "suppression_list" &&
        row.source !== "combined" &&
        row.status !== "allowed_again" &&
        toMillis(row.lastActivityAt) > 0 &&
        toMillis(row.lastActivityAt) <= olderThanCutoffMs,
    );
  }
  if (filter === "suppression") rows = rows.filter((row: any) => row.source === "suppression_list" || row.source === "combined");
  if (filter === "allowed") rows = rows.filter((row: any) => row.status === "allowed_again");
  rows = rows.filter((row: any) => footprintMatchesSearch(row, queryText));
  rows.sort((a: any, b: any) => toMillis(b.lastActivityAt) - toMillis(a.lastActivityAt));
  rows = rows.slice(0, max);

  return json({
    success: true,
    count: rows.length,
    checked: byEmail.size,
    filter,
    query: queryText,
    olderThanDays,
    rows,
  });
}

async function getOutreachLeadDocsForEmails(emails: string[], limitPerEmail = 50) {
  const rows: Array<{ id: string; ref: any; data: AnyRecord }> = [];
  const seen = new Set<string>();

  for (const emailLower of emails) {
    const snap = await adminDb.collection("outreach_leads").where("emailLower", "==", emailLower).limit(limitPerEmail).get();
    snap.docs.forEach((docSnap: any) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      rows.push({ id: docSnap.id, ref: docSnap.ref, data: docSnap.data() || {} });
    });
  }

  return rows;
}

async function getOutreachLeadRefsForEmails(emails: string[], limitPerEmail = 50) {
  const rows = await getOutreachLeadDocsForEmails(emails, limitPerEmail);
  return rows.map((row) => row.ref);
}

async function markOutreachLeadFootprintsForEmails(
  emails: string[],
  actor: string,
  mode: "allow" | "ignore",
) {
  const refs = await getOutreachLeadRefsForEmails(emails);
  let updated = 0;

  for (let index = 0; index < refs.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = refs.slice(index, index + 450);
    chunk.forEach((ref) => {
      batch.set(
        ref,
        {
          ...(mode === "allow"
            ? {
                footprintAllowedAgain: true,
                footprintAllowedAgainAt: admin.firestore.FieldValue.serverTimestamp(),
                footprintAllowedAgainBy: actor,
              }
            : {
                footprintIgnored: true,
                footprintIgnoredAt: admin.firestore.FieldValue.serverTimestamp(),
                footprintIgnoredBy: actor,
              }),
          // Stop the old automation when this row is being treated as no longer
          // blocking a new email. This prevents an old sequence and a new send
          // from running together for the same contact.
          stopAutomation: true,
          nextFollowupStatus: mode === "allow" ? "stopped_allow_again" : "stopped_footprint_deleted",
          nextFollowupReason: mode === "allow" ? "allowed_again_from_cleanup" : "footprint_deleted_from_cleanup",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
    await batch.commit();
    updated += chunk.length;
  }

  return updated;
}

async function deleteOutreachLeadDocsForEmails(emails: string[], actor: string, reason = "footprint_selected_delete") {
  const rows = await getOutreachLeadDocsForEmails(emails);
  const deletedLeadIds: string[] = [];
  const emailEventCleanupResults: AnyRecord[] = [];

  for (const row of rows) {
    const lead = { id: row.id, ...(row.data || {}) } as LeadData;
    await cleanupEmailEventsForLeadBeforeDelete(row.id, lead, 2000)
      .then((result: any) => emailEventCleanupResults.push({ leadId: row.id, ok: true, result }))
      .catch((error: any) =>
        emailEventCleanupResults.push({
          leadId: row.id,
          ok: false,
          reason: String(error?.message || error || "email_event_cleanup_failed").slice(0, 500),
        }),
      );
  }

  for (let index = 0; index < rows.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = rows.slice(index, index + 450);
    chunk.forEach((row) => {
      batch.delete(row.ref);
      deletedLeadIds.push(row.id);
    });
    await batch.commit();
  }

  return {
    leadDeletedCount: deletedLeadIds.length,
    deletedLeadIds,
    emailEventCleanupResults,
    actor,
    reason,
  };
}

async function deleteFootprintDocsForEmails(emails: string[]) {
  const batch = adminDb.batch();
  let count = 0;
  emails.forEach((emailLower) => {
    const docId = emailDocId(emailLower);
    batch.delete(adminDb.collection("contact_memory").doc(docId));
    count += 1;
  });
  if (count > 0) await batch.commit();
  return count;
}

async function deleteSuppressionDocsForEmails(emails: string[]) {
  const batch = adminDb.batch();
  let count = 0;
  emails.forEach((emailLower) => {
    const docId = emailDocId(emailLower);
    batch.delete(adminDb.collection("suppression_list").doc(docId));
    count += 1;
  });
  if (count > 0) await batch.commit();
  return count;
}

async function allowFootprintDocsForEmails(emails: string[], actor: string) {
  const batch = adminDb.batch();
  const now = admin.firestore.Timestamp.now();
  emails.forEach((emailLower) => {
    const docId = emailDocId(emailLower);
    batch.set(
      adminDb.collection("contact_memory").doc(docId),
      {
        emailLower,
        allowedAgain: true,
        allowedAgainAt: admin.firestore.FieldValue.serverTimestamp(),
        allowAgainAt: admin.firestore.FieldValue.serverTimestamp(),
        allowedAgainBy: actor,
        allowAgainBy: actor,
        cooldownUntil: now,
        memoryExpiresAt: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
  await batch.commit();
  const leadUpdatedCount = await markOutreachLeadFootprintsForEmails(emails, actor, "allow");
  return { memoryCount: emails.length, leadUpdatedCount };
}

async function forgetFootprintDocsOlderThan(days: number, actor = "admin") {
  const cutoffMs = Date.now() - days * 86_400_000;
  const [memorySnap, leadSnap] = await Promise.all([
    adminDb.collection("contact_memory").limit(500).get(),
    adminDb.collection("outreach_leads").limit(800).get(),
  ]);

  const memoryRefs: any[] = [];
  memorySnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    const activityMs = getFootprintDocActivityMs(data);
    if (activityMs && activityMs <= cutoffMs) memoryRefs.push(docSnap.ref);
  });

  const leadRefs: any[] = [];
  leadSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    if (!isActiveFootprintLead({ id: docSnap.id, ...data })) return;
    const activityMs = getLeadFootprintActivityMs(data);
    if (activityMs && activityMs <= cutoffMs) leadRefs.push(docSnap.ref);
  });

  let deleted = 0;
  for (let index = 0; index < memoryRefs.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = memoryRefs.slice(index, index + 450);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }

  let leadUpdated = 0;
  for (let index = 0; index < leadRefs.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = leadRefs.slice(index, index + 450);
    chunk.forEach((ref) =>
      batch.set(
        ref,
        {
          footprintIgnored: true,
          footprintIgnoredAt: admin.firestore.FieldValue.serverTimestamp(),
          footprintIgnoredBy: actor,
          stopAutomation: true,
          nextFollowupStatus: "stopped_old_footprint_cleanup",
          nextFollowupReason: "old_footprint_cleanup",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    );
    await batch.commit();
    leadUpdated += chunk.length;
  }

  return { deleted, leadUpdated };
}
async function deleteSuppressionDocsOlderThan(days: number) {
  // Protected suppression cleanup is intentionally separate from normal footprint cleanup.
  // It only removes old suppression_list rows after a strong confirmation phrase.
  const safeDays = Math.max(30, Math.min(Number(days || 365), 3650));
  const cutoffMs = Date.now() - safeDays * 86_400_000;
  const suppressionSnap = await adminDb.collection("suppression_list").limit(500).get();

  const refs: any[] = [];
  suppressionSnap.docs.forEach((docSnap: any) => {
    const data = docSnap.data() || {};
    const activityMs = getFootprintDocActivityMs(data);
    if (activityMs && activityMs <= cutoffMs) refs.push(docSnap.ref);
  });

  let deleted = 0;
  for (let index = 0; index < refs.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = refs.slice(index, index + 450);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return { deleted, days: safeDays };
}

async function deleteSelectedFootprintsForEmails(emails: string[], actor: string, includeSuppression: boolean) {
  const memoryDeletedCount = await deleteFootprintDocsForEmails(emails);
  const leadDeleteResult = await deleteOutreachLeadDocsForEmails(emails, actor, "footprint_selected_delete");
  const suppressionDeletedCount = includeSuppression ? await deleteSuppressionDocsForEmails(emails) : 0;

  return {
    memoryDeletedCount,
    leadDeletedCount: leadDeleteResult.leadDeletedCount,
    deletedLeadIds: leadDeleteResult.deletedLeadIds,
    emailEventCleanupResults: leadDeleteResult.emailEventCleanupResults,
    suppressionDeletedCount,
    totalChanged: memoryDeletedCount + leadDeleteResult.leadDeletedCount + suppressionDeletedCount,
  };
}
const SUPPRESSION_ALLOWABLE_REASONS = new Set([
  "replied",
  "reply",
  "manual",
  "manual_block",
  "previous_contact",
  "not_interested",
]);

const HARD_SUPPRESSION_REASONS = new Set([
  "unsubscribed",
  "unsubscribe",
  "spam",
  "hard_bounce",
  "bounced",
  "bounce",
  "blocked_suppressed",
]);

function normalizeSuppressionReason(value: any): string {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

async function allowSuppressionDocsForEmails(emails: string[], actor: string) {
  const results: AnyRecord[] = [];

  for (const emailLower of emails) {
    const docId = emailDocId(emailLower);
    const ref = adminDb.collection("suppression_list").doc(docId);
    const snap = await ref.get();

    if (!snap.exists) {
      results.push({ email: emailLower, ok: true, skipped: true, reason: "suppression_not_found" });
      continue;
    }

    const data = snap.data() || {};
    const reason = normalizeSuppressionReason(data.reason || data.status || data.lastOutcome || "");

    if (HARD_SUPPRESSION_REASONS.has(reason) && !SUPPRESSION_ALLOWABLE_REASONS.has(reason)) {
      results.push({
        email: emailLower,
        ok: false,
        skipped: true,
        reason: `protected_hard_suppression:${reason || "unknown"}`,
      });
      continue;
    }

    await ref.set(
      {
        emailLower,
        allowedAgain: true,
        allowedAgainAt: admin.firestore.FieldValue.serverTimestamp(),
        allowAgainAt: admin.firestore.FieldValue.serverTimestamp(),
        allowedAgainBy: actor,
        allowAgainBy: actor,
        previousReason: data.reason || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    results.push({ email: emailLower, ok: true, skipped: false, reason: reason || "suppression_allowed" });
  }

  return results;
}

async function handleFootprintMemoryAction(req: Request) {
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const action = String(body.action || "").trim().toLowerCase();
  const actor = normalizeEmail(adminUser.email || "admin");

  if (action === "allow") {
    if (String(body.confirm || "").trim().toUpperCase() !== "ALLOW") throw new ApiError("Type ALLOW to allow this email again", 400);
    const emails = normalizeFootprintEmails(body);
    if (!emails.length) throw new ApiError("At least one valid email is required", 400);
    const result = await allowFootprintDocsForEmails(emails, actor);
    return json({
      success: true,
      action,
      count: result.memoryCount,
      leadUpdatedCount: result.leadUpdatedCount,
      message: `Allowed ${emails.length} email(s) again. ${result.leadUpdatedCount} old outreach record(s) will no longer block a new send.`,
    });
  }

  if (action === "allow_suppression") {
    if (String(body.confirm || "").trim().toUpperCase() !== "ALLOW SUPPRESSION") {
      throw new ApiError("Type ALLOW SUPPRESSION to allow this protected footprint again", 400);
    }
    const emails = normalizeFootprintEmails(body);
    if (!emails.length) throw new ApiError("At least one valid email is required", 400);

    await allowFootprintDocsForEmails(emails, actor);
    const results = await allowSuppressionDocsForEmails(emails, actor);
    const allowedCount = results.filter((item) => item.ok && !item.skipped).length;
    const blockedCount = results.filter((item) => !item.ok).length;

    return json({
      success: true,
      action,
      count: allowedCount,
      blockedCount,
      results,
      message: blockedCount
        ? `${allowedCount} protected footprint(s) allowed. ${blockedCount} hard suppression record(s) stayed protected.`
        : `Allowed ${allowedCount} protected footprint(s) again.`,
    }, blockedCount ? 207 : 200);
  }

  if (action === "forget") {
    if (String(body.confirm || "").trim().toUpperCase() !== "FORGET") throw new ApiError("Type FORGET to delete footprint memory", 400);
    const emails = normalizeFootprintEmails(body);
    if (!emails.length) throw new ApiError("At least one valid email is required", 400);
    const result = await deleteSelectedFootprintsForEmails(emails, actor, false);
    return json({
      success: true,
      action,
      count: result.totalChanged,
      ...result,
      message: `Deleted ${result.totalChanged} footprint item(s), including linked outreach lead rows. Suppression records were not deleted by this action.`,
    });
  }

  if (action === "forget_older") {
    if (String(body.confirm || "").trim().toUpperCase() !== "FORGET") throw new ApiError("Type FORGET to delete old footprint memories", 400);
    const days = Math.max(1, Math.min(Number(body.olderThanDays || 90), 3650));
    const result = await forgetFootprintDocsOlderThan(days, actor);
    const count = result.deleted + result.leadUpdated;
    return json({
      success: true,
      action,
      count,
      olderThanDays: days,
      memoryDeletedCount: result.deleted,
      leadUpdatedCount: result.leadUpdated,
      message: `Cleaned ${count} old footprint item(s) older than ${days} days.`,
    });
  }

  if (action === "delete_selected") {
    if (String(body.confirm || "").trim().toUpperCase() !== "DELETE SELECTED") {
      throw new ApiError("Type DELETE SELECTED to delete selected footprint records", 400);
    }
    const emails = normalizeFootprintEmails(body);
    if (!emails.length) throw new ApiError("At least one valid email is required", 400);
    const includeSuppression = body.includeSuppression === true;
    const result = await deleteSelectedFootprintsForEmails(emails, actor, includeSuppression);
    return json({
      success: true,
      action,
      count: result.totalChanged,
      ...result,
      includeSuppression,
      message: includeSuppression
        ? `Deleted ${result.totalChanged} selected footprint item(s), including linked outreach lead rows and protected suppression rows.`
        : `Deleted ${result.totalChanged} selected footprint item(s), including linked outreach lead rows. Suppression rows were kept protected.`,
    });
  }

  if (action === "delete_suppression_older") {
    if (String(body.confirm || "").trim().toUpperCase() !== "DELETE SUPPRESSION") {
      throw new ApiError("Type DELETE SUPPRESSION to delete protected suppression records", 400);
    }
    const result = await deleteSuppressionDocsOlderThan(Number(body.olderThanDays || 365));
    return json({
      success: true,
      action,
      count: result.deleted,
      olderThanDays: result.days,
      message: `Deleted ${result.deleted} protected suppression record${result.deleted === 1 ? "" : "s"} older than ${result.days} days.`,
    });
  }

  throw new ApiError("Unknown footprint memory action", 400);
}

async function handleCleanupSkip(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 100)
    : [];
  const days = Math.max(1, Math.min(Number(body.days || 30), 365));
  if (!ids.length) throw new ApiError("Select at least one lead", 400);

  const skippedUntil = admin.firestore.Timestamp.fromMillis(Date.now() + days * 86_400_000);
  const count = await updateLeadsInChunks(ids, () => ({
    cleanupSkippedUntil: skippedUntil,
    cleanupReason: `skipped_${days}_days`,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, count, message: `Skipped ${count} lead(s) for ${days} days.` });
}

async function handleCleanupProtect(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids || body.leadIds)
    ? Array.from(new Set<string>((body.ids || body.leadIds).map((id: any) => String(id || "").trim()).filter(Boolean))).slice(0, 100)
    : [];
  const reason = String(body.reason || "protected_by_admin").slice(0, 120);
  if (!ids.length) throw new ApiError("Select at least one lead", 400);

  const count = await updateLeadsInChunks(ids, () => ({
    lifecycleStatus: "protected",
    cleanupProtected: true,
    cleanupReason: reason,
    stopAutomation: true,
    nextFollowupStatus: "blocked",
    nextFollowupReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  return json({ success: true, count, message: `Protected ${count} lead(s).` });
}

async function handleCleanupManualRun(req: Request) {
  // Manual button version of cleanup automation: returns candidates without deleting anything.
  // বাংলা ব্যাখ্যা: Cron deploy করার আগে dashboard থেকে এই button দিয়ে due list refresh করা যাবে।
  return await handleCleanupCandidates(req);
}

function shouldShowInScheduledTab(row: AnyRecord = {}) {
  const status = String(row.status || "").trim().toLowerCase();
  if (status !== "scheduled") return false;
  if (row.sentAt || row.lastSentAt) return false;

  const providerStatus = String(row.providerScheduleStatus || "").trim().toLowerCase();
  if (["sent", "delivered", "opened", "clicked", "processed", "cancelled", "failed"].includes(providerStatus)) return false;

  const scheduledProvider = String(row.scheduledProvider || "").trim().toLowerCase();
  const isBrevoProviderScheduled = row.brevoScheduled === true || scheduledProvider === "brevo";
  const scheduledAtMs = Number(row.scheduledAt || row.brevoScheduledAt || 0);

  // Brevo owns the actual delivery time. If the provider scheduled time is already
  // safely in the past, the Scheduled tab should not keep showing the row while
  // waiting for an open/click webhook to arrive.
  if (isBrevoProviderScheduled && scheduledAtMs > 0 && scheduledAtMs <= Date.now() - BREVO_INITIAL_SCHEDULE_TAB_GRACE_MS) return false;

  return true;
}

/** GET /api/trackflow/scheduled-emails */
async function handleScheduledEmailsGet(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const max = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const status = String(url.searchParams.get("status") || "scheduled").trim() || "scheduled";

  const snap = await adminDb
    .collection("outreach_leads")
    .where("status", "==", status)
    .limit(max)
    .get();

  const serializedRows = snap.docs.map(serializeScheduledLead);
  const rows = serializedRows
    .filter(shouldShowInScheduledTab)
    .sort((a: any, b: any) => Number(a.scheduledAt || 0) - Number(b.scheduledAt || 0));

  return json({ success: true, status, count: rows.length, rawCount: serializedRows.length, rows });
}

/** PATCH /api/trackflow/scheduled-emails */
async function handleScheduledEmailsPatch(req: Request) {
  await requireAdmin(req);
  const body = await readJson(req);
  const leadId = String(body.leadId || body.id || "").trim();
  const action = String(body.action || "update").trim().toLowerCase();

  if (!leadId) throw new ApiError("leadId is required", 400);

  const ref = adminDb.collection("outreach_leads").doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError("Scheduled lead not found", 404);

  const current = snap.data() as LeadData;
  if (String(current.status || "") !== "scheduled") {
    throw new ApiError("Only scheduled emails can be edited or queued for immediate send", 400);
  }

  const isBrevoProviderScheduled = current.brevoScheduled === true || String(current.scheduledProvider || "").toLowerCase() === "brevo";

  if (action === "send_soon" || action === "send_now") {
    if (isBrevoProviderScheduled) {
      return await sendBrevoScheduledInitialNow(ref, leadId, current);
    }

    await ref.update({
      scheduledAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(),
    });
    return json({ success: true, message: "Legacy Firestore-scheduled email moved to the immediate-send queue. The scheduled-initials cron will send it on the next run." });
  }

  const updates: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    error: admin.firestore.FieldValue.delete(),
  };

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const nextEmailLower = normalizeEmail(String(body.email || ""));
    if (!isValidEmail(nextEmailLower)) throw new ApiError("Invalid target email", 400);

    const suppressed = await isSuppressed(nextEmailLower);
    if (suppressed) throw new ApiError(`Email is suppressed: ${suppressed.reason || "blocked"}`, 409);

    if (nextEmailLower !== normalizeEmail(current.emailLower || current.email || "")) {
      const duplicateSnap = await adminDb.collection("outreach_leads").where("emailLower", "==", nextEmailLower).limit(5).get();
      const duplicate = duplicateSnap.docs.find((item: any) => {
        if (item.id === leadId) return false;
        const data = item.data() || {};
        const status = String(data.status || "").trim().toLowerCase();
        if (["failed", "cancelled", "blocked_daily_limit"].includes(status)) return false;
        if (data.footprintAllowedAgain === true || data.footprintIgnored === true || data.allowedAgain === true || data.allowRecontact === true) return false;
        if (toMillis(data.footprintAllowedAgainAt) || toMillis(data.footprintIgnoredAt)) return false;
        return true;
      });
      if (duplicate) throw new ApiError("Duplicate email already exists in outreach leads.", 409);
    }

    updates.email = String(body.email || "").trim();
    updates.emailLower = nextEmailLower;
    updates.sheetFinalEmail = String(body.email || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "clientName") || Object.prototype.hasOwnProperty.call(body, "name")) {
    updates.name = String(body.clientName || body.name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "companyName") || Object.prototype.hasOwnProperty.call(body, "company_name")) {
    updates.company_name = String(body.companyName || body.company_name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "website")) {
    updates.website = String(body.website || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "businessType") || Object.prototype.hasOwnProperty.call(body, "business_type")) {
    updates.business_type = String(body.businessType || body.business_type || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "selectedService") || Object.prototype.hasOwnProperty.call(body, "service")) {
    const service = body.selectedService || body.service;
    if (!SERVICES.has(service)) throw new ApiError("Invalid service", 400);
    updates.service = service;
  }

  if (Object.prototype.hasOwnProperty.call(body, "senderId") || Object.prototype.hasOwnProperty.call(body, "sender_id")) {
    const sender = getSenderById(String(body.senderId || body.sender_id || ""));
    if (!sender) throw new ApiError("Invalid sender selected", 400);
    const apiSender = mapSharedSender(sender);
    updates.sender_id = apiSender.id || "";
    updates.sender_email = apiSender.email;
    updates.sender_name = apiSender.name;
    updates.reply_to_email = apiSender.replyToEmail || DEFAULT_REPLY_TO_EMAIL;
    updates.reply_to_name = apiSender.replyToName || apiSender.name || DEFAULT_REPLY_TO_NAME;
    updates.sender_daily_limit = apiSender.dailyLimit || DEFAULT_DAILY_LIMIT;
  }

  if (Object.prototype.hasOwnProperty.call(body, "subject")) {
    const subject = String(body.subject || "").trim();
    if (!subject) throw new ApiError("Subject is required", 400);
    updates.subject = subject;
  }

  if (Object.prototype.hasOwnProperty.call(body, "message")) {
    const message = String(body.message || "").trim();
    if (!plainTextFromHtml(message)) throw new ApiError("Message body cannot be empty", 400);
    updates.message = stripDangerousHtml(message);
  }

  if (Object.prototype.hasOwnProperty.call(body, "scheduledAt")) {
    const scheduledAt = timestampFromAny(body.scheduledAt);
    if (!scheduledAt) throw new ApiError("Invalid scheduledAt", 400);
    if (scheduledAt.toMillis() <= Date.now() + 30_000) {
      throw new ApiError("Scheduled time must be at least 30 seconds in the future. Use Send Now for immediate sending.", 400);
    }
    updates.scheduledAt = scheduledAt;
  }

  if (Object.prototype.hasOwnProperty.call(body, "includeSignature")) {
    updates.include_signature = body.includeSignature !== false;
  }
  if (Object.prototype.hasOwnProperty.call(body, "signatureMode") || Object.prototype.hasOwnProperty.call(body, "signature_mode")) {
    updates.signatureMode = normalizeSignatureMode(body.signatureMode || body.signature_mode || "full", "full");
  }

  if (Object.prototype.hasOwnProperty.call(body, "reportUrl")) {
    const rawReportUrl = String(body.reportUrl || "").trim();
    const reportUrl = sanitizeOptionalUrl(rawReportUrl);
    if (rawReportUrl && !reportUrl) throw new ApiError("Invalid report URL", 400);
    updates.reportUrl = reportUrl;
  }

  if (Object.prototype.hasOwnProperty.call(body, "reportButtonText")) {
    updates.reportButtonText = String(body.reportButtonText || "View short audit note").trim().slice(0, 80);
  }

  if (isBrevoProviderScheduled) {
    return await rescheduleBrevoInitialEmail(ref, leadId, current, updates);
  }

  await ref.update(updates);
  const updated = await ref.get();
  return json({ success: true, message: "Scheduled email updated", lead: serializeScheduledLead(updated) });
}

async function handleAdminMarkLeadReplied(req: Request) {
  /**
   * ADMIN WRITE THROUGH BACKEND
   * বাংলা ব্যাখ্যা: Dashboard থেকে direct Firestore write না করে backend API দিয়ে lead replied করা হয়।
   * এতে admin auth/validation backend-এ থাকে, কিন্তু Firestore write count আগের মতোই প্রায় একই থাকে।
   */
  const adminUser: any = await requireAdmin(req);
  const body = await readJson(req);
  const leadId = String(body.leadId || body.id || "").trim();
  if (!leadId) throw new ApiError("leadId is required", 400);

  const ref = adminDb.collection("outreach_leads").doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError("Lead not found", 404);

  await ref.update({
    status: "replied",
    stopAutomation: true,
    repliedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextFollowupStatus: "blocked",
    nextFollowupReason: "manual_marked_replied",
    nextFollowupAt: admin.firestore.FieldValue.delete(),
    nextFollowupStep: admin.firestore.FieldValue.delete(),
    automationLock: admin.firestore.FieldValue.delete(),
    manualUpdatedBy: normalizeEmail(adminUser.email || "admin"),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return json({ success: true, leadId, status: "replied" });
}

function normalizeFollowupConfigForSave(body: any): Record<string, any> {
  const rawConfig = body?.config && typeof body.config === "object" ? body.config : body;
  const payload: Record<string, any> = {};

  for (const service of SERVICES) {
    const serviceConfig = rawConfig?.[service];
    if (!serviceConfig || typeof serviceConfig !== "object") continue;

    payload[service] = {};
    for (let stepNumber = 1; stepNumber <= MAX_CONFIGURED_FOLLOWUP_STEPS; stepNumber += 1) {
      const stepKey = `step${stepNumber}`;
      const stepConfig = serviceConfig?.[stepKey] || {};
      const variantsRaw = Array.isArray(stepConfig.variants) ? stepConfig.variants : [];
      const variants = variantsRaw
        .map((variant: any, index: number) => ({
          id: String(variant?.id || `V${index + 1}`).slice(0, 50),
          content: stripDangerousHtml(String(variant?.content || "")).slice(0, 12000),
        }))
        .filter((variant: any) => plainTextFromHtml(variant.content));

      payload[service][stepKey] = {
        variants: variants.length > 0 ? variants : [{ id: "V1", content: "" }],
        delay: Math.max(1, Math.min(Number(stepConfig.delay || 1440), 60 * 24 * 30)),
      };
    }
  }

  payload.daily_followup_limit = Math.max(1, Math.min(Number(body?.daily_followup_limit || body?.dailyFollowupLimit || 50), 500));
  payload.followup_batch_per_run = Math.max(1, Math.min(Number(body?.followup_batch_per_run || body?.followupBatchPerRun || 5), MAX_FOLLOWUP_BATCH_PER_RUN));
  payload.followup_trigger_mode = "open_required";
  payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  return payload;
}

function hasUsableFollowupVariants(stepConfig: any): boolean {
  return Array.isArray(stepConfig?.variants) && stepConfig.variants.some((variant: any) => plainTextFromHtml(String(variant?.content || "")));
}

function preserveExistingFollowupTemplatesWhenIncomingIsBlank(payload: Record<string, any>, existingData: AnyRecord = {}) {
  /**
   * বাংলা ব্যাখ্যা: Dashboard state/cache কোনো কারণে blank variant পাঠালে যেন পুরনো saved
   * follow-up message হারিয়ে না যায়। Days gap update করা যাবে, কিন্তু non-empty template
   * blank দিয়ে overwrite হবে না।
   */
  for (const service of SERVICES) {
    const servicePayload = payload?.[service];
    const serviceExisting = existingData?.[service];
    if (!servicePayload || typeof servicePayload !== "object" || !serviceExisting || typeof serviceExisting !== "object") continue;

    for (let stepNumber = 1; stepNumber <= MAX_CONFIGURED_FOLLOWUP_STEPS; stepNumber += 1) {
      const stepKey = `step${stepNumber}`;
      const incomingStep = servicePayload?.[stepKey];
      const existingStep = serviceExisting?.[stepKey];
      if (!incomingStep || !existingStep) continue;

      if (!hasUsableFollowupVariants(incomingStep) && hasUsableFollowupVariants(existingStep)) {
        servicePayload[stepKey] = {
          ...incomingStep,
          variants: existingStep.variants,
        };
      }
    }
  }

  return payload;
}

async function handleGetFollowupConfig(req: Request) {
  /**
   * FOLLOW-UP SETTINGS LOAD
   * বাংলা ব্যাখ্যা: Dashboard client-side Firestore rules/admin email mismatch হলে direct getDoc
   * fail করতে পারে। তাই config backend admin API দিয়ে load করা হয়।
   */
  await requireAdmin(req);
  const runtimeConfig = await loadFollowupRuntimeConfig();

  return json({
    success: true,
    config: runtimeConfig.data,
    source: runtimeConfig.source,
    exists: runtimeConfig.exists,
    dailyFollowupLimit: Number(runtimeConfig.data?.daily_followup_limit || 50),
    batchPerRun: Number(runtimeConfig.data?.followup_batch_per_run || DEFAULT_FOLLOWUP_BATCH_PER_RUN),
    triggerMode: "open_required",
  });
}

function serializeFollowupCandidateTime(value: any): string | null {
  const millis = toMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function hasFollowupEngagementForCandidate(lead: LeadData): boolean {
  const openCount = Number(lead.open_count || 0);
  const clickCount = Number(lead.click_count || 0);
  const lastOpenedMs = toMillis(lead.lastOpenedAt || (lead as any).last_opened);
  const lastClickedMs = toMillis(lead.lastClickedAt);
  const lastEngagedMs = toMillis(lead.lastEngagedAt);
  return openCount > 0 || clickCount > 0 || lastOpenedMs > 0 || lastClickedMs > 0 || lastEngagedMs > 0 || String(lead.status || "").toLowerCase() === "clicked";
}

function isFollowupCandidateForStep(lead: LeadData, service: string, stepNumber: number): boolean {
  if (!lead || lead.stopAutomation === true || (lead as any).archived === true || (lead as any).deleted === true) return false;
  if (!isReschedulableLeadStatus(lead.status)) return false;
  if (getServiceId(lead.service) !== service) return false;

  const followUpCount = Number(lead.follow_up_count || 0);
  if (followUpCount !== stepNumber - 1) return false;
  if (!hasFollowupEngagementForCandidate(lead)) return false;

  const lastSentMs = toMillis(lead.lastFollowUp || (lead as any).lastSentAt || lead.sentAt || lead.createdAt);
  const lastEngagedMs = Math.max(
    toMillis(lead.lastEngagedAt),
    toMillis(lead.lastOpenedAt || (lead as any).last_opened),
    toMillis(lead.lastClickedAt)
  );

  if (stepNumber > 1 && (!lastSentMs || !lastEngagedMs || lastEngagedMs <= lastSentMs)) return false;

  return true;
}

async function handleFollowupCandidates(req: Request) {
  /**
   * FIRESTORE FOLLOW-UP CANDIDATES
   * বাংলা ব্যাখ্যা: Automation tab-এর Active Leads Google Sheet বা Leads tab cache থেকে নয়,
   * Firestore outreach_leads source-of-truth থেকে load হবে।
   */
  await requireAdmin(req);

  const url = new URL(req.url);
  const service = getServiceId(url.searchParams.get("service"));
  const { stepKey, stepNumber } = normalizeRescheduleStep(url.searchParams.get("step") || "step1");
  const limitCount = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
  const scanLimit = Math.max(limitCount, Math.min(Number(url.searchParams.get("scanLimit") || 500), 1000));

  const runtimeConfig = await loadFollowupRuntimeConfig();
  const stepConfig = runtimeConfig.data?.[service]?.[stepKey] || null;
  const delayMinutes = Number(stepConfig?.delay || 1440);

  const snap = await adminDb.collection("outreach_leads").limit(scanLimit).get();
  const rows: AnyRecord[] = [];

  for (const docSnap of snap.docs) {
    const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;
    if (!isFollowupCandidateForStep(lead, service, stepNumber)) continue;

    const lastSentMs = toMillis(lead.lastFollowUp || (lead as any).lastSentAt || lead.sentAt || lead.createdAt);
    const lastEngagedMs = Math.max(
      toMillis(lead.lastEngagedAt),
      toMillis(lead.lastOpenedAt || (lead as any).last_opened),
      toMillis(lead.lastClickedAt)
    );
    const calculatedNextMs = lastEngagedMs ? buildRescheduleTimestampForLead(lead, delayMinutes) : 0;

    rows.push({
      id: docSnap.id,
      email: lead.email || lead.emailLower || "",
      emailLower: lead.emailLower || normalizeEmail(lead.email || ""),
      name: lead.name || "",
      company_name: lead.company_name || "",
      website: lead.website || "",
      service: getServiceId(lead.service),
      status: lead.status || "",
      open_count: Number(lead.open_count || 0),
      click_count: Number(lead.click_count || 0),
      follow_up_count: Number(lead.follow_up_count || 0),
      sentAt: serializeFollowupCandidateTime(lead.sentAt),
      lastFollowUp: serializeFollowupCandidateTime(lead.lastFollowUp || (lead as any).lastSentAt),
      lastOpenedAt: serializeFollowupCandidateTime(lead.lastOpenedAt || (lead as any).last_opened),
      lastClickedAt: serializeFollowupCandidateTime(lead.lastClickedAt),
      lastEngagedAt: serializeFollowupCandidateTime(lead.lastEngagedAt),
      nextFollowupAt: serializeFollowupCandidateTime(lead.nextFollowupAt) || (calculatedNextMs ? new Date(calculatedNextMs).toISOString() : null),
      nextFollowupStep: Number(lead.nextFollowupStep || stepNumber),
      nextFollowupStatus: lead.nextFollowupStatus || "",
      nextFollowupReason: lead.nextFollowupReason || "",
      nextFollowupNumber: stepNumber,
      lastSentMs,
      lastEngagedMs,
      score: Number(lead.open_count || 0) * 10 + Number(lead.click_count || 0) * 25 + Number(lead.follow_up_count || 0) * 3,
    });

    if (rows.length >= limitCount) break;
  }

  rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  return json({
    success: true,
    source: "firestore",
    configSource: runtimeConfig.source,
    service,
    step: stepKey,
    stepNumber,
    checked: snap.size,
    returned: rows.length,
    generatedAt: new Date().toISOString(),
    rows,
  });
}

async function handleSaveFollowupConfig(req: Request) {
  /**
   * FOLLOW-UP SETTINGS SAVE
   * বাংলা ব্যাখ্যা: Follow-up template/settings frontend থেকে সরাসরি Firestore-এ না গিয়ে backend দিয়ে save হয়।
   * Sender config এখানে save হয় না; sender source সবসময় lib/senders.ts.
   */
  await requireAdmin(req);
  const body = await readJson(req);
  const configRef = adminDb.collection("automation_settings").doc("followup_config");
  const existingSnap = await configRef.get();
  const payload = preserveExistingFollowupTemplatesWhenIncomingIsBlank(
    normalizeFollowupConfigForSave(body),
    existingSnap.exists ? existingSnap.data() || {} : {},
  );

  await configRef.set(payload, { merge: true });

  return json({
    success: true,
    message: "Follow-up settings saved through backend API.",
    config: sanitizeFollowupRuntimeConfig(payload),
    dailyFollowupLimit: payload.daily_followup_limit,
    batchPerRun: payload.followup_batch_per_run,
  });
}

function normalizeRescheduleStep(value: any): { stepKey: string; stepNumber: number } {
  const raw = String(value || "step1").trim().toLowerCase();
  const match = raw.match(/^step([1-5])$/);
  const parsedStepNumber = match ? Number(match[1]) : 1;
  const stepNumber = Math.max(1, Math.min(parsedStepNumber, MAX_AUTOMATED_FOLLOWUPS));
  return { stepKey: `step${stepNumber}`, stepNumber };
}

type FollowupRescheduleResult = {
  checked: number;
  matched: number;
  updated: number;
  skipped: number;
  skippedEarlier: number;
  skippedNoEngagement: number;
  skippedInactive: number;
  skippedWrongStep: number;
  skippedMissingSchedule: number;
  samples: Array<{ leadId: string; email: string; previousAt?: string; nextAt: string }>;
};

function isReschedulableLeadStatus(status: any): boolean {
  const normalized = String(status || "").toLowerCase();
  return ACTIVE_STATUSES.has(normalized) && !HARD_STOP_STATUSES.has(normalized);
}

function buildRescheduleTimestampForLead(lead: LeadData, delayMinutes: number): number {
  const lastSentMs = toMillis(lead.lastFollowUp || lead.lastSentAt || lead.sentAt || lead.createdAt);
  const lastOpenedMs = toMillis(lead.lastOpenedAt || lead.last_opened);
  const lastClickedMs = toMillis(lead.lastClickedAt);
  const explicitEngagedMs = toMillis(lead.lastEngagedAt);
  const lastEngagedMs = Math.max(explicitEngagedMs, lastOpenedMs, lastClickedMs);

  if (!lastSentMs || !lastEngagedMs) return 0;
  if (lastEngagedMs <= lastSentMs) return 0;

  const scheduledMsRaw = scheduleBeforeEngagementTime(lastEngagedMs, delayMinutes);
  return Math.max(lastEngagedMs, scheduledMsRaw || 0);
}

async function handleRescheduleFollowupsAfterConfigChange(req: Request) {
  /**
   * SAFE RESCHEDULE AFTER DAYS GAP CHANGE
   * বাংলা ব্যাখ্যা: Follow-up config save করলে already scheduled/ready lead-এর stored
   * nextFollowupAt নিজে নিজে বদলায় না। এই endpoint selected service + step-এর
   * active scheduled leads নতুন delay দিয়ে exact nextFollowupAt-এ sync করে।
   */
  await requireAdmin(req);
  const body = await readJson(req).catch(() => ({}));
  const service = getServiceId(body?.service);
  const { stepKey, stepNumber } = normalizeRescheduleStep(body?.step || body?.stepKey);
  const updateMode = String(body?.updateMode || "recalculate_all").toLowerCase();
  const shouldAllowEarlier = updateMode === "recalculate_all" || body?.allowEarlier === true;
  const max = Math.max(1, Math.min(Number(body?.limit || 500), 500));

  const runtimeConfig = await loadFollowupRuntimeConfig();
  const stepConfig = runtimeConfig.data?.[service]?.[stepKey];
  if (!stepConfig) throw new ApiError(`Missing follow-up config for ${service} ${stepKey}`, 400);
  if (!hasSafeFollowupVariant(stepConfig)) throw new ApiError(`No safe variant configured for ${service} ${stepKey}`, 400);

  const delayMinutesRaw = Number(stepConfig.delay || 1440);
  const delayMinutes = Number.isFinite(delayMinutesRaw) && delayMinutesRaw > 0 ? delayMinutesRaw : 1440;
  const nowMs = Date.now();
  const result: FollowupRescheduleResult = {
    checked: 0,
    matched: 0,
    updated: 0,
    skipped: 0,
    skippedEarlier: 0,
    skippedNoEngagement: 0,
    skippedInactive: 0,
    skippedWrongStep: 0,
    skippedMissingSchedule: 0,
    samples: [],
  };

  const snap = await adminDb
    .collection("outreach_leads")
    .where("nextFollowupStatus", "==", "scheduled")
    .limit(max)
    .get();

  let batch = adminDb.batch();
  let batchCount = 0;
  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = adminDb.batch();
    batchCount = 0;
  };

  for (const docSnap of snap.docs) {
    result.checked += 1;
    const lead = { id: docSnap.id, ...docSnap.data() } as LeadData;

    if (lead.stopAutomation === true || lead.archived === true || lead.deleted === true || !isReschedulableLeadStatus(lead.status)) {
      result.skipped += 1;
      result.skippedInactive += 1;
      continue;
    }

    if (getServiceId(lead.service) !== service) {
      result.skipped += 1;
      continue;
    }

    const followUpCount = Number(lead.follow_up_count || 0);
    const expectedFollowupCount = stepNumber - 1;
    const storedStep = Number(lead.nextFollowupStep || 0);
    if (followUpCount !== expectedFollowupCount || (storedStep && storedStep !== stepNumber)) {
      result.skipped += 1;
      result.skippedWrongStep += 1;
      continue;
    }

    result.matched += 1;
    const existingMs = toMillis(lead.nextFollowupAt);
    if (!existingMs) {
      result.skipped += 1;
      result.skippedMissingSchedule += 1;
      continue;
    }

    const nextMs = buildRescheduleTimestampForLead(lead, delayMinutes);
    if (!nextMs) {
      result.skipped += 1;
      result.skippedNoEngagement += 1;
      continue;
    }

    if (!shouldAllowEarlier && nextMs <= existingMs + 60_000) {
      result.skipped += 1;
      result.skippedEarlier += 1;
      continue;
    }

    batch.update(docSnap.ref, {
      nextFollowupAt: admin.firestore.Timestamp.fromMillis(nextMs),
      nextFollowupStep: stepNumber,
      nextFollowupStatus: "scheduled",
      nextFollowupDelayMinutes: delayMinutes,
      nextFollowupConfigStepKey: stepKey,
      nextFollowupReason: nextMs > nowMs ? "rescheduled_after_followup_gap_change" : "ready_after_followup_gap_recalculation",
      lastFollowupEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      automationLock: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    result.updated += 1;
    batchCount += 1;
    if (result.samples.length < 10) {
      result.samples.push({
        leadId: docSnap.id,
        email: lead.emailLower || lead.email || "",
        previousAt: existingMs ? new Date(existingMs).toISOString() : undefined,
        nextAt: new Date(nextMs).toISOString(),
      });
    }

    if (batchCount >= 400) await commitBatch();
  }

  await commitBatch();

  return json({
    success: true,
    service,
    step: stepKey,
    stepNumber,
    delayMinutes,
    updateMode: shouldAllowEarlier ? "recalculate_all" : "extend_only",
    configSource: runtimeConfig.source,
    generatedAt: new Date().toISOString(),
    ...result,
  });
}

async function handleAdminHealth(req: Request) {
  await requireAdmin(req);

  const runtimeConfig = await loadFollowupRuntimeConfig().catch(() => ({ data: sanitizeFollowupRuntimeConfig({}), source: "code_default" as const, exists: false }));
  const cronSnap = await adminDb.collection("system_status").doc("cron").get().catch(() => null);
  const cronStatus = cronSnap?.exists ? cronSnap.data() || {} : {};

  const requiredEnv = [
    "BREVO_API_KEY",
    "CRON_SECRET",
    "BREVO_WEBHOOK_SECRET",
    "REPLY_WEBHOOK_SECRET",
    "UNSUBSCRIBE_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "ALLOWED_ADMIN_EMAILS",
    "GOOGLE_SHEET_ID",
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "REPORT_REGISTER_SECRET",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
  ];

  return json({
    success: true,
    mode: "free_limit_friendly",
    senderSource: "lib/senders.ts",
    sheetRole: "lead_queue_and_status_mirror_only",
    automationSource: "Firestore outreach_leads",
    followupConfigSource: runtimeConfig.source,
    followupConfigSavedInFirestore: runtimeConfig.exists,
    followupDailyLimit: Number(runtimeConfig.data?.daily_followup_limit || 50),
    followupBatchPerRun: getFollowupBatchPerRun(runtimeConfig.data),
    sheetLockMode: "google_sheet_columns",
    cronStatus,
    env: requiredEnv.reduce((acc: Record<string, boolean>, key) => {
      acc[key] = Boolean(process.env[key]);
      return acc;
    }, {}),
    switches: {
      automationPaused: automationPaused(),
      sheetQueueSendEnabled: sheetQueueSendEnabled(),
      followupsEnabled: followupsEnabled(),
      storeLowValueEmailEvents: envFlag("STORE_LOW_VALUE_EMAIL_EVENTS", false),
      storeSentEmailEvents: envFlag("STORE_SENT_EMAIL_EVENTS", false),
      storeLowValueTrackingHistory: envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false),
    },
    drivePdfCleanup: {
      enabled: shouldDeleteDrivePdfOnLeadDelete(),
      requireSuccessBeforePermanentDelete: shouldRequireDrivePdfCleanupOnLeadDelete(),
      mode: drivePdfDeleteMode(),
    },
    notes: [
      "Sender emails are not loaded from Firebase.",
      "Sheet queue locks are stored in Google Sheet columns, not a Firestore lock collection.",
      "Follow-up timing remains based on Firestore open/click timestamps.",
    ],
  });
}


async function handleTrackflowHealth(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "true";

  const requiredEnv = [
    "BREVO_API_KEY",
    "CRON_SECRET",
    "BREVO_WEBHOOK_SECRET",
    "REPLY_WEBHOOK_SECRET",
    "UNSUBSCRIBE_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "ALLOWED_ADMIN_EMAILS",
    "REPORT_REGISTER_SECRET",
    "GOOGLE_SHEET_ID",
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
  ];

  const optionalEnv = [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "SHEET_API_SECRET",
  ];

  const envStatus = [...requiredEnv, ...optionalEnv].reduce((acc: Record<string, boolean>, key) => {
    acc[key] = Boolean(process.env[key]);
    return acc;
  }, {});

  const checks: Record<string, any> = {
    route: { ok: true },
    requiredEnv: { ok: requiredEnv.every((key) => envStatus[key]), missing: requiredEnv.filter((key) => !envStatus[key]) },
    driveOAuth: { ok: Boolean(getGoogleDriveOAuthClient()), configured: Boolean(getGoogleDriveOAuthClient()) },
    automation: {
      ok: !automationPaused(),
      paused: automationPaused(),
      sheetQueueSendEnabled: sheetQueueSendEnabled(),
      followupsEnabled: followupsEnabled(),
    },
    firebaseAdmin: { ok: true, checked: false },
    googleSheet: { ok: Boolean(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY), checked: false },
    googleDrive: { ok: Boolean(getGoogleDriveOAuthClient()), checked: false },
  };

  if (deep) {
    await requireAdmin(req);

    try {
      await adminDb.collection("system_status").doc("health_check").set(
        {
          checkedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "trackflow_health_deep",
        },
        { merge: true },
      );
      checks.firebaseAdmin = { ok: true, checked: true };
    } catch (error: any) {
      checks.firebaseAdmin = { ok: false, checked: true, error: String(error?.message || error) };
    }

    try {
      const { sheets, spreadsheetId } = await getSheetsClient();
      await sheets.spreadsheets.get({ spreadsheetId, fields: "spreadsheetId,properties.title" });
      checks.googleSheet = { ok: true, checked: true };
    } catch (error: any) {
      checks.googleSheet = { ok: false, checked: true, error: String(error?.message || error) };
    }

    try {
      const drive = getGoogleDriveOAuthClient();
      if (!drive) throw new Error("Google Drive OAuth credentials are missing");
      await drive.about.get({ fields: "user(emailAddress)" });
      checks.googleDrive = { ok: true, checked: true };
    } catch (error: any) {
      checks.googleDrive = { ok: false, checked: true, error: String(error?.message || error) };
    }
  }

  const ok = Object.values(checks).every((check: any) => check?.ok !== false);

  return json({
    success: true,
    service: "TrackFlowPro API",
    status: ok ? "ok" : "needs_attention",
    deep,
    generatedAt: new Date().toISOString(),
    appBaseUrl: appBaseUrl(),
    env: envStatus,
    switches: {
      automationPaused: automationPaused(),
      sheetQueueSendEnabled: sheetQueueSendEnabled(),
      followupsEnabled: followupsEnabled(),
      deleteDrivePdfOnLeadDelete: shouldDeleteDrivePdfOnLeadDelete(),
      drivePdfDeleteMode: drivePdfDeleteMode(),
      requireDrivePdfCleanupOnLeadDelete: shouldRequireDrivePdfCleanupOnLeadDelete(),
      webhookOpenDedupeMinutes: webhookOpenDedupeMs() / 60_000,
      webhookClickDedupeMinutes: webhookClickDedupeMs() / 60_000,
      storeLowValueEmailEvents: envFlag("STORE_LOW_VALUE_EMAIL_EVENTS", false),
      storeSentEmailEvents: envFlag("STORE_SENT_EMAIL_EVENTS", false),
      storeLowValueTrackingHistory: envFlag("STORE_LOW_VALUE_TRACKING_HISTORY", false),
    },
    checks,
  });
}

async function handleReportHealth(req: Request) {
  await requireReportRegisterAccess(req);
  return json({
    success: true,
    action: "reports/health",
    reportRegisterReady: true,
    debugVersion: TFP_REPORT_REGISTER_DEBUG_VERSION,
    appBaseUrl: appBaseUrl(),
    requiredLocalRegisterUrl: `${appBaseUrl()}/api/trackflow/reports/register`,
    env: {
      NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      REPORT_REGISTER_SECRET: Boolean(process.env.REPORT_REGISTER_SECRET),
      GOOGLE_SHEET_ID: Boolean(process.env.GOOGLE_SHEET_ID),
      GOOGLE_CLIENT_EMAIL: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
      GOOGLE_PRIVATE_KEY: Boolean(process.env.GOOGLE_PRIVATE_KEY),
    },
  });
}

async function handleError(error: any) {
  console.error("[TFP_REPORT_REGISTER_DEBUG]", JSON.stringify({ version: TFP_REPORT_REGISTER_DEBUG_VERSION, stage: "error", message: error?.message || String(error || "") }));
  console.error("TrackFlow API Error:", error);
  if (error instanceof ApiError) return json({ success: false, error: error.message }, error.status);
  return json({ success: false, error: "Internal Server Error" }, 500);
}

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "reports/debug") return await handleReportDebug(req);
    if (["reports/register", "report/register", "reports/upsert", "reports/create"].includes(action)) return await handleReportRegister(req);
    if (action === "reports/view") return await handleReportView(req);
    if (action === "send-email") return await handleSendInitial(req);
    if (action === "sheets/leads") return await handleSheetLeadsPost(req);
    if (action === "webhooks/brevo") return await handleBrevoWebhook(req);
    if (action === "webhooks/reply") return await handleReplyWebhook(req);
    if (action === "automation/followups/config") return await handleSaveFollowupConfig(req);
    if (action === "automation/followups/reschedule") return await handleRescheduleFollowupsAfterConfigChange(req);
    if (action === "automation/followups/release-template-blocked") return await handleReleaseTemplateBlockedFollowups(req);
    if (action === "admin/leads/mark-replied") return await handleAdminMarkLeadReplied(req);
    if (action === "scheduled-emails/send-now") return await handleScheduledEmailsPatch(req);
    if (action === "leads/bulk-action") return await handleLeadsBulkAction(req);
    if (action === "system/cleanup") return await handleSystemCleanup(req);
    if (action === "cleanup/delete-full-keep-memory") return await handleCleanupDeleteFullKeepMemory(req);
    if (action === "cleanup/footprint-memory") return await handleFootprintMemoryAction(req);
    if (action === "cleanup/skip") return await handleCleanupSkip(req);
    if (action === "cleanup/protect") return await handleCleanupProtect(req);
    if (action === "cleanup/manual-run") return await handleCleanupManualRun(req);
    if (action === "cleanup/report") return await handleReportCleanup(req);
    if (action === "cleanup/reports/bulk") return await handleBulkReportCleanup(req);
    if (action === "cleanup/daily-sending-stats") return await handleDailySendingStatsCleanup(req);
    if (action === "unsubscribe") return await handleUnsubscribePost(req);

    return json({ success: false, error: `Unknown POST action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function GET(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "reports/health") return await handleReportHealth(req);
    if (action === "reports/debug") return await handleReportDebug(req);
    if (action === "reports/view") return await handleReportView(req);
    if (action === "reports/preview") return await handleReportPreview(req);
    if (action === "reports/download") return await handleReportDownload(req);
    if (action === "reports/cta") return await handleReportCta(req);
    if (action === "track/open" || action === "email/open") return await handleSelfHostedEmailOpen(req);
    if (action === "track/click" || action === "email/click") return await handleSelfHostedEmailClick(req);
    if (action === "cron/scheduled-initials") return await handleCronScheduledInitials(req);
    if (action === "cron/sheet-queued-sends") return await handleCronSheetQueuedSends(req);
    if (action === "cron/followups") return await handleCronFollowups(req);
    if (action === "cron/recover-locks") return await handleCronRecoverLocks(req);
    if (action === "automation/followups/config") return await handleGetFollowupConfig(req);
    if (action === "automation/followups/candidates") return await handleFollowupCandidates(req);
    if (action === "automation/followups/dry-run") return await handleFollowupDryRun(req);
    if (action === "automation/followups/summary") return await handleFollowupSummary(req);
    if (action === "sender-stats") return await handleSenderStats(req);
    if (action === "postmaster/health") return await handlePostmasterHealth(req);
    if (action === "admin/health") return await handleAdminHealth(req);
    if (action === "unsubscribe") return await handleUnsubscribeGet(req);
    if (action === "sheets/leads") return await handleSheetLeadsGet(req);
    if (action === "scheduled-emails") return await handleScheduledEmailsGet(req);
    if (action === "leads") return await handleLeadsGet(req);
    if (action === "system/usage-summary") return await handleUsageSummary(req);
    if (action === "cleanup/candidates") return await handleCleanupCandidates(req);
    if (action === "cleanup/footprint-memory") return await handleFootprintMemoryList(req);
    if (action === "cleanup/reports") return await handleSecureReportsListWithCleanupFilters(req);
    if (action === "cleanup/report") return await handleReportCleanupPreview(req);
    if (action === "cleanup/daily-sending-stats") return await handleDailySendingStatsCleanupPreview(req);
    if (action === "cron/cleanup-expired-reports") return await handleExpiredReportCleanupCron(req);

    if (action === "health" || action === "") return await handleTrackflowHealth(req);

    return json({ success: false, error: `Unknown GET action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}


export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "sheets/leads") return await handleSheetLeadsPatch(req);
    if (action === "scheduled-emails") return await handleScheduledEmailsPatch(req);

    return json({ success: false, error: `Unknown PATCH action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const action = await getAction(ctx);

    if (action === "send-email") return await handleCancelInitial(req);

    return json({ success: false, error: `Unknown DELETE action: ${action}` }, 404);
  } catch (error: any) {
    return handleError(error);
  }
}
