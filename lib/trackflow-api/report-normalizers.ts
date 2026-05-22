import { randomUUID } from "crypto";
import admin from "firebase-admin";
import { BRAND_WEBSITE, MAIN_INBOX_EMAIL } from "@/lib/senders";

export type AnyRecord = Record<string, any>;

function cleanCell(value: any, fallback = ""): string {
  if (value === null || value === undefined || value === "") return fallback;
  const text = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  return text || fallback;
}

export function normalizeEmail(email: any): string {
  return String(email || "").trim().toLowerCase();
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function timestampFromAny(value: any): any | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

export function sanitizeOptionalUrl(value: string): string {
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

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || BRAND_WEBSITE || "https://trackflowpro.com").replace(/\/+$/, "");
}

export function normalizeReportToken(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

export function createReportToken(): string {
  return randomUUID().replace(/-/g, "");
}

export function normalizeReportSlug(value: any): string {
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

export function buildPublicReportUrl(token: string, domainSlug = "website"): string {
  const slug = normalizeReportSlug(domainSlug || "website");
  return `${appBaseUrl()}/tracking-review/${encodeURIComponent(slug)}/${encodeURIComponent(token)}`;
}

export function isLocalOrUnsafeReportUrl(value: string): boolean {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return true;
  if (raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("0.0.0.0")) return true;
  if (raw.includes("/audit/pdf/") || raw.includes(":8000/")) return true;
  // Email/report URL must be the branded TrackFlow /tracking-review/{domainSlug}/{token} page, not a direct PDF/Drive link.
  if (raw.includes("drive.google.com") || raw.includes("googleusercontent.com")) return true;
  if (/\.pdf(?:$|[?#])/.test(raw)) return true;
  return false;
}

export function sanitizePublicReportUrl(value: any): string {
  const url = sanitizeOptionalUrl(String(value || ""));
  if (!url || isLocalOrUnsafeReportUrl(url)) return "";
  return url;
}

export function sanitizeLocalRedirectTarget(value: any): string {
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

export function firstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = cleanCell(value || "");
    if (text) return text;
  }
  return "";
}

export function normalizeStringArray(value: any, maxItems = 8): string[] {
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

export function normalizeRecommendationArray(value: any, maxItems = 8): AnyRecord[] {
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

export function normalizeAdsFoundValue(value: any): "yes" | "no" | "unknown" {
  const text = cleanCell(value || "").toLowerCase();
  if (["yes", "true", "1", "found", "ads_found", "active", "running"].includes(text)) return "yes";
  if (["no", "false", "0", "not_found", "none", "no_ads"].includes(text)) return "no";
  return "unknown";
}

export function boolFromAny(value: any): boolean {
  if (typeof value === "boolean") return value;
  const text = cleanCell(value || "").toLowerCase();
  return ["1", "true", "yes", "y", "checked", "found", "active", "running"].includes(text);
}

export function normalizeManualAdsTransparency(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
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

export function getObjectCandidate(...values: any[]): AnyRecord {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as AnyRecord;
  }
  return {};
}

export function sanitizePlainObject(value: any, maxKeys = 30): AnyRecord {
  /**
   * Firestore-safe public report object sanitizer.
   * Keeps only JSON-safe values from the register payload so the public tracking-review page
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

export function normalizeReportCards(value: any, fallbackEvidence: string[] = [], maxItems = 4): AnyRecord[] {
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
      ...sanitizePlainObject(record, 24),
      title: title || "Tracking item to verify",
      finding: finding || "Browser-visible evidence suggests this area is worth checking.",
      businessMeaning: businessMeaning || "This can affect how confidently marketing enquiries are measured and attributed.",
      business_meaning: businessMeaning || "This can affect how confidently marketing enquiries are measured and attributed.",
      nextCheck: nextCheck || "Confirm inside GA4, GTM, Google Ads, CRM, or server logs.",
      next_check: nextCheck || "Confirm inside GA4, GTM, Google Ads, CRM, or server logs.",
      evidence,
    });

    if (output.length >= maxItems) break;
  }

  if (output.length) return output;

  return fallbackEvidence.slice(0, Math.min(3, maxItems)).map((item, index) => ({
    title: index === 0 ? "Tracking evidence to verify" : `Evidence item ${index + 1}`,
    finding: item,
    businessMeaning: "This point should be confirmed before making budget or reporting decisions.",
    business_meaning: "This point should be confirmed before making budget or reporting decisions.",
    nextCheck: "Review inside the relevant ad, analytics, tag manager, CRM, or server-side system.",
    next_check: "Review inside the relevant ad, analytics, tag manager, CRM, or server-side system.",
    evidence: [],
  }));
}

export function normalizeVerificationPlan(value: any, fallback: AnyRecord[] | string[] = [], maxItems = 4): AnyRecord[] {
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
          ...sanitizePlainObject(record, 20),
          priority,
          title: title || description,
          description,
          estimatedEffort,
          estimated_effort: estimatedEffort,
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
          estimated_effort: "Short review",
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  return output;
}

export function normalizeWebsiteSpeedSnapshot(...values: any[]): AnyRecord | null {
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

export function normalizeCtaInteractionReport(...values: any[]): AnyRecord | null {
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

export function getReportTimestamp(value: any, fallbackDays = 30) {
  const parsed = timestampFromAny(value);
  if (parsed) return parsed;
  return admin.firestore.Timestamp.fromMillis(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

export function normalizeReportPayload(body: AnyRecord = {}) {
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

  const privateReportCopy = getObjectCandidate(body.privateReportCopy, body.private_report_copy, body.aiPrivateReportCopy, body.ai_private_report_copy);
  const privatePage = getObjectCandidate(body.privateReportPage, body.private_report_page, privateReportCopy);
  const manualAdsTransparency = normalizeManualAdsTransparency(body, privatePage);

  const headline = firstCleanString(
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
    body.mainFinding,
    body.main_finding,
    privatePage.mainFinding,
    body.mainIssue,
    body.main_issue,
    body.problemSummary,
    body.problem_summary,
  );

  const businessImpact = firstCleanString(
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

  const whatChecked = normalizeStringArray(
    privatePage.whatChecked || privatePage.what_checked || privatePage.checks || body.whatChecked || body.what_checked || body.auditScope || body.audit_scope,
    8,
  );

  const auditSnapshotQuestions = normalizeStringArray(
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

  const verificationPlan = normalizeVerificationPlan(
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
    ...privateReportCopy,
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
    auditSnapshotTitle: firstCleanString(privatePage.auditSnapshotTitle, privatePage.audit_snapshot_title, body.auditSnapshotTitle, body.audit_snapshot_title, "What this review is designed to clarify"),
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: firstCleanString(privatePage.howToReadTitle, privatePage.how_to_read_title, body.howToReadTitle, body.how_to_read_title, "How to read this review"),
    howToReadParagraphs,
    ctaHeadline: firstCleanString(privatePage.ctaHeadline, privatePage.cta_headline, body.ctaHeadline, body.cta_headline, "Want this verified inside your actual accounts?"),
    ctaText,
    manualAdsTransparency,
    manual_ads_transparency: manualAdsTransparency,
    privateReportVersion: firstCleanString(privatePage.privateReportVersion, privatePage.private_report_version, body.privateReportVersion, body.private_report_version),
  };

  return {
    token,
    domainSlug,
    domain_slug: domainSlug,
    reportUrl,
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
    privateReportVersion: normalizedPrivateReportCopy.privateReportVersion,
    manualAdsTransparency,
    manual_ads_transparency: manualAdsTransparency,
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
      body.blobUrl || body.blob_url ? "vercel_blob" : "storage",
    ),
    blobUrl: firstCleanString(body.blobUrl, body.blob_url, pdfViewUrl),
    blobDownloadUrl: firstCleanString(body.blobDownloadUrl, body.blob_download_url, pdfDownloadUrl),
    blobPathname: firstCleanString(body.blobPathname, body.blob_pathname, body.pathname),
    contactEmail: firstCleanString(body.contactEmail, body.contact_email, body.agencyEmail, body.agency_email, MAIN_INBOX_EMAIL),
    ctaUrl: firstCleanString(body.ctaUrl, body.cta_url, privatePage.ctaUrl, privatePage.cta_url, "/contact"),
    ctaText,
  };
}
