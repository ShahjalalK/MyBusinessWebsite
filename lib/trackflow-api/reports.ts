import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readPdfFromB2, sanitizeB2Key } from "@/lib/trackflow-storage/b2";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import {
  AnyRecord,
  appBaseUrl,
  escapeHtml,
  isLocalOrUnsafeReportUrl,
  normalizeReportPayload,
  normalizeReportSlug,
  normalizeReportToken,
  sanitizeLocalRedirectTarget,
  sanitizeOptionalUrl,
  toMillis,
} from "./report-normalizers";

const TFP_MODULAR_REPORT_DEBUG_VERSION = "v18.26-og-modular-register-debug-2026-05-23";

type ApiErrorInstance = Error & { status: number };
type ApiErrorConstructor = new (message: string, status?: number) => ApiErrorInstance;

export type ReportHandlerDeps = {
  ApiError: ApiErrorConstructor;
  requireReportRegisterAccess: (req: Request) => Promise<any>;
  readJson: (req: Request) => Promise<any>;
  json: (payload: any, status?: number) => Response;
  htmlResponse: (html: string, status?: number) => Response;
  patchSheetRowSafely: (rowNumber: number, updates: AnyRecord) => Promise<void>;
  nowDhaka: () => string;
};


function pickManualEvidenceDebugFields(value: AnyRecord = {}): AnyRecord {
  const manual = (value?.manualConversionEvidence || value?.manual_conversion_evidence || {}) as AnyRecord;
  const hero = (value?.manualEvidenceHero || value?.manual_evidence_hero || {}) as AnyRecord;
  const primary = (manual?.primaryAction || manual?.primary_action || manual?.primary || {}) as AnyRecord;

  return {
    hasManualConversionEvidence: Boolean(manual && typeof manual === "object" && Object.keys(manual).length),
    manualEvidenceEnabled: Boolean(manual?.enabled || manual?.manualEvidenceProvided || manual?.manual_evidence_provided || manual?.primaryAction || manual?.primary_action || manual?.primary),
    manualActionLabel: String(primary?.label || hero?.actionLabel || hero?.action_label || hero?.label || ""),
    manualExpectedEvent: String(primary?.expectedEvent || primary?.expected_event || hero?.expectedEvent || hero?.expected_event || ""),
    manualObservedEvent: String(primary?.observedEventName || primary?.observed_event_name || primary?.observedEvent || primary?.observed_event || hero?.observedEvent || hero?.observed_event || ""),
    manualHeroTitle: String(hero?.title || hero?.headline || ""),
    auditSnapshotTitle: String(value?.auditSnapshotTitle || value?.audit_snapshot_title || ""),
    auditSnapshotQuestionsCount: Array.isArray(value?.auditSnapshotQuestions) ? value.auditSnapshotQuestions.length : 0,
  };
}


const TFP_V2749_SETUP_FIRST_MODES = new Set(["tracking_foundation_setup", "ga4_setup_needed"]);

function tfpV2749ReportModeForFirestore(report: AnyRecord = {}, body: AnyRecord = {}): string {
  return String(
    report.reportMode ||
      report.report_mode ||
      report.trackingCase?.mode ||
      report.tracking_case?.mode ||
      body.reportMode ||
      body.report_mode ||
      body.trackingCase?.mode ||
      body.tracking_case?.mode ||
      "",
  ).trim();
}

function tfpV2749TrackingCaseForFirestore(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord | null {
  const raw =
    (report.trackingCase && typeof report.trackingCase === "object" ? report.trackingCase : null) ||
    (report.tracking_case && typeof report.tracking_case === "object" ? report.tracking_case : null) ||
    (body.trackingCase && typeof body.trackingCase === "object" ? body.trackingCase : null) ||
    (body.tracking_case && typeof body.tracking_case === "object" ? body.tracking_case : null) ||
    null;
  const mode = tfpV2749ReportModeForFirestore(report, body);
  if (!raw && !mode) return null;
  return {
    ...(raw || {}),
    mode,
    reportMode: mode,
    report_mode: mode,
  };
}

function pickModularReportDebugFields(value: AnyRecord = {}): AnyRecord {
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
    b2Key: String(raw.b2Key || raw.b2_key || raw.pdfStorageKey || raw.pdf_storage_key || ""),
    storageProvider: String(raw.storageProvider || raw.storage_provider || ""),
    ogImageUrl: String(raw.ogImageUrl || raw.og_image_url || ""),
    openGraphImageUrl: String(raw.openGraphImageUrl || raw.open_graph_image_url || ""),
    previewImageUrl: String(raw.previewImageUrl || raw.preview_image_url || ""),
    homepageScreenshotUrl: String(raw.homepageScreenshotUrl || raw.homepage_screenshot_url || ""),
    emailPreviewImageUrl: String(raw.emailPreviewImageUrl || raw.email_preview_image_url || raw.emailPreviewImage?.publicUrl || raw.email_preview_image?.public_url || ""),
    emailPreviewImageB2Key: String(raw.emailPreviewImageB2Key || raw.email_preview_image_b2_key || raw.emailPreviewImage?.b2Key || raw.email_preview_image?.b2_key || ""),
    emailPreviewImageMimeType: String(raw.emailPreviewImageMimeType || raw.email_preview_image_mime_type || raw.emailPreviewImage?.mimeType || raw.email_preview_image?.mime_type || ""),
    emailPreviewImageSizeBytes: Number(raw.emailPreviewImageSizeBytes || raw.email_preview_image_size_bytes || raw.emailPreviewImage?.sizeBytes || raw.email_preview_image?.size_bytes || 0) || 0,
    evidenceVideoUrl: String(raw.evidenceVideoUrl || raw.evidence_video_url || raw.evidenceVideo?.videoUrl || raw.evidence_video?.video_url || ""),
    evidenceVideoStatus: String(raw.evidenceVideoStatus || raw.evidence_video_status || raw.evidenceVideo?.status || raw.evidence_video?.status || ""),
    securePageEvidenceAssetCount: secureAssets.length,
    securePageEvidenceRoles: secureAssets.map((item: AnyRecord) => String(item?.role || item?.type || "")).filter(Boolean),
    ogImagePathname: String(raw.ogImagePathname || raw.og_image_pathname || raw.previewImagePathname || raw.preview_image_pathname || ""),
    sourceType: String(raw.sourceType || raw.source_type || ""),
    outreachChannel: String(raw.outreachChannel || raw.outreach_channel || ""),
    leadSource: String(raw.leadSource || raw.lead_source || ""),
    emailOutreachAllowed: raw.emailOutreachAllowed ?? raw.email_outreach_allowed,
    linkedinOutreachAllowed: raw.linkedinOutreachAllowed ?? raw.linkedin_outreach_allowed,
    ...pickManualEvidenceDebugFields(raw),
  };
}

function logModularReportDebug(stage: string, details: AnyRecord = {}) {
  try {
    console.log("[TFP_MODULAR_REPORT_DEBUG]", JSON.stringify({ version: TFP_MODULAR_REPORT_DEBUG_VERSION, stage, ...details }));
  } catch {
    console.log("[TFP_MODULAR_REPORT_DEBUG]", TFP_MODULAR_REPORT_DEBUG_VERSION, stage, details);
  }
}

function reportCleanString(value: any, fallback = ""): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replace(/\s+/g, " ").trim() || fallback;
}

function reportFirstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = reportCleanString(value);
    if (text) return text;
  }
  return "";
}

function reportImageUrlFrom(value: any): string {
  const direct = sanitizeOptionalUrl(typeof value === "string" || typeof value === "number" ? String(value) : "");
  if (direct) return direct;

  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as AnyRecord;
  const candidates = [
    record.url,
    record.publicUrl,
    record.public_url,
    record.src,
    record.href,
    record.imageUrl,
    record.image_url,
    record.ogImageUrl,
    record.og_image_url,
    record.openGraphImageUrl,
    record.open_graph_image_url,
    record.previewImageUrl,
    record.preview_image_url,
  ];

  for (const candidate of candidates) {
    const url = sanitizeOptionalUrl(typeof candidate === "string" || typeof candidate === "number" ? String(candidate) : "");
    if (url) return url;
  }

  return "";
}

function firstReportImageUrl(...values: any[]): string {
  for (const value of values) {
    const url = reportImageUrlFrom(value);
    if (url) return url;
  }
  return "";
}

function reportPlainObject(value: any): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function reportNormalizeWorkflowText(value: any): string {
  return reportCleanString(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function reportSourceBlob(...values: any[]): string {
  return values
    .map((value) => reportCleanString(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeReportSourceIdentity(report: AnyRecord = {}, body: AnyRecord = {}, existing: AnyRecord = {}): AnyRecord {
  const text = reportSourceBlob(
    report.sourceGroup,
    report.source_group,
    report.sourceLabel,
    report.source_label,
    report.channel,
    report.source,
    report.sourceType,
    report.source_type,
    report.outreachChannel,
    report.outreach_channel,
    report.leadSource,
    report.lead_source,
    report.auditSource,
    report.audit_source,
    report.sourceContext,
    report.source_context,
    body.sourceGroup,
    body.source_group,
    body.sourceLabel,
    body.source_label,
    body.channel,
    body.source,
    body.sourceType,
    body.source_type,
    body.outreachChannel,
    body.outreach_channel,
    body.leadSource,
    body.lead_source,
    body.auditSource,
    body.audit_source,
    body.sourceContext,
    body.source_context,
    existing.sourceGroup,
    existing.source_group,
    existing.sourceLabel,
    existing.source_label,
    existing.channel,
    existing.source,
    existing.sourceType,
    existing.source_type,
    existing.outreachChannel,
    existing.outreach_channel,
    existing.leadSource,
    existing.lead_source,
    existing.auditSource,
    existing.audit_source,
    existing.sourceContext,
    existing.source_context,
  );

  const explicitSourceType = reportNormalizeWorkflowText(
    report.sourceType || report.source_type || body.sourceType || body.source_type || existing.sourceType || existing.source_type,
  );
  const explicitChannel = reportNormalizeWorkflowText(
    report.outreachChannel || report.outreach_channel || report.channel || body.outreachChannel || body.outreach_channel || body.channel || existing.outreachChannel || existing.outreach_channel || existing.channel,
  );

  const hasLinkedIn = text.includes("linkedin") || text.includes("linked_in");
  const hasManual =
    text.includes("manual_audit") ||
    text.includes("manual_report") ||
    text.includes("operator_manual") ||
    text.includes("direct_manual") ||
    text.includes("source_type_manual");
  const hasSearch =
    text.includes("python_search") ||
    text.includes("python") ||
    text.includes("colab_direct") ||
    text.includes("colab") ||
    text.includes("search_result") ||
    text.includes("google_search") ||
    text.includes("website_search") ||
    text.includes("lead_row_secure_page") ||
    text.includes("lead_row") ||
    text.includes("local_audit_b2_report_export") ||
    text.includes("local_audit_dashboard_selected_export") ||
    text.includes("source_type_search") ||
    text.includes("lead_source_python_search") ||
    text.includes("audit_source_python");

  const sourceType =
    explicitSourceType === "linkedin" || explicitSourceType === "search" || explicitSourceType === "manual" || explicitSourceType === "unknown"
      ? explicitSourceType
      : hasLinkedIn
        ? "linkedin"
        : hasManual
          ? "manual"
          : hasSearch
            ? "search"
            : "unknown";

  const outreachChannel =
    explicitChannel === "email" || explicitChannel === "linkedin" || explicitChannel === "manual" || explicitChannel === "unknown"
      ? explicitChannel
      : sourceType === "linkedin"
        ? "linkedin"
        : sourceType === "manual"
          ? "manual"
          : sourceType === "search" || report.email || body.email || report.contactEmail || body.contactEmail
            ? "email"
            : "unknown";

  const leadSource =
    reportNormalizeWorkflowText(report.leadSource || report.lead_source || body.leadSource || body.lead_source || existing.leadSource || existing.lead_source) ||
    (sourceType === "linkedin" ? "linkedin_audit" : sourceType === "manual" ? "manual_audit" : sourceType === "search" ? "python_search" : "unknown");

  const auditSource =
    reportCleanString(report.auditSource || report.audit_source || body.auditSource || body.audit_source || existing.auditSource || existing.audit_source || report.source || body.source || existing.source) ||
    (sourceType === "search" ? "python_search" : sourceType === "linkedin" ? "linkedin_audit" : sourceType === "manual" ? "manual_audit" : "unknown");

  const sourceContext =
    reportCleanString(report.sourceContext || report.source_context || body.sourceContext || body.source_context || existing.sourceContext || existing.source_context || auditSource);

  const sourceGroup =
    sourceType === "linkedin" || sourceType === "manual"
      ? "linkedin_manual"
      : sourceType === "search" || outreachChannel === "email"
        ? "search_email"
        : "other";

  const sourceLabel =
    sourceType === "search"
      ? "Python search audit"
      : sourceType === "linkedin"
        ? "LinkedIn / manual report"
        : sourceType === "manual"
          ? "Manual audit"
          : sourceGroup === "search_email"
            ? "Search / Email lead"
            : "Secure report";

  return {
    source: reportCleanString(report.source || body.source || existing.source || auditSource),
    sourceType,
    source_type: sourceType,
    outreachChannel,
    outreach_channel: outreachChannel,
    channel: outreachChannel,
    leadSource,
    lead_source: leadSource,
    auditSource,
    audit_source: auditSource,
    sourceContext,
    source_context: sourceContext,
    sourceGroup,
    source_group: sourceGroup,
    sourceLabel,
    source_label: sourceLabel,
  };
}

function isEmailPreviewB2KeyScopedToToken(value: unknown, token: string): boolean {
  const key = reportCleanString(value).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  const safeToken = normalizeReportToken(token);
  if (!key || !safeToken || key.includes("..")) return false;
  return key.startsWith("reports/") && key.includes(`/${safeToken}/email-preview/`);
}

function buildCanonicalEmailPreviewProxyUrl(report: AnyRecord = {}, b2Key = ""): string {
  const token = normalizeReportToken(report.token || report.reportToken || report.report_token);
  const domainSlug = normalizeReportSlug(report.domainSlug || report.domain_slug || report.domain || report.websiteUrl || "website");
  if (!token || !domainSlug || !isEmailPreviewB2KeyScopedToToken(b2Key, token)) return "";
  return `${appBaseUrl()}/api/email-preview/${encodeURIComponent(domainSlug)}/${encodeURIComponent(token)}`;
}

function normalizeEmailPreviewImageForFirestore(rawValue: any, fallback: AnyRecord = {}): AnyRecord | null {
  const raw = reportPlainObject(rawValue);
  const b2Key = reportFirstCleanString(raw.b2Key, raw.b2_key, fallback.b2Key, fallback.b2_key).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  const publicUrl = sanitizeOptionalUrl(reportFirstCleanString(raw.publicUrl, raw.public_url, raw.url, fallback.publicUrl, fallback.public_url));
  if (!b2Key && !publicUrl) return null;

  const mimeType = reportFirstCleanString(raw.mimeType, raw.mime_type, fallback.mimeType, fallback.mime_type, "image/webp").toLowerCase();
  const sizeBytes = Number(raw.sizeBytes || raw.size_bytes || fallback.sizeBytes || fallback.size_bytes || 0) || 0;
  const fileName = reportFirstCleanString(raw.fileName, raw.file_name, fallback.fileName, fallback.file_name, "email-preview-thumbnail.webp");

  return {
    id: reportFirstCleanString(raw.id, fallback.id, "email_preview_thumbnail"),
    role: reportFirstCleanString(raw.role, fallback.role, "email_preview_thumbnail"),
    caption: reportFirstCleanString(raw.caption, raw.title, fallback.caption, "Clickable email preview thumbnail"),
    fileName,
    file_name: fileName,
    mimeType,
    mime_type: mimeType,
    sizeBytes,
    size_bytes: sizeBytes,
    pageUrl: sanitizeOptionalUrl(reportFirstCleanString(raw.pageUrl, raw.page_url, fallback.pageUrl, fallback.page_url)),
    page_url: sanitizeOptionalUrl(reportFirstCleanString(raw.pageUrl, raw.page_url, fallback.pageUrl, fallback.page_url)),
    source: reportFirstCleanString(raw.source, fallback.source, "manual_email_preview_upload"),
    storageProvider: reportFirstCleanString(raw.storageProvider, raw.storage_provider, fallback.storageProvider, fallback.storage_provider, "backblaze_b2"),
    storage_provider: reportFirstCleanString(raw.storageProvider, raw.storage_provider, fallback.storageProvider, fallback.storage_provider, "backblaze_b2"),
    b2Bucket: reportFirstCleanString(raw.b2Bucket, raw.b2_bucket, raw.bucket, fallback.b2Bucket, fallback.b2_bucket),
    b2_bucket: reportFirstCleanString(raw.b2Bucket, raw.b2_bucket, raw.bucket, fallback.b2Bucket, fallback.b2_bucket),
    b2Key,
    b2_key: b2Key,
    etag: reportFirstCleanString(raw.etag, raw.eTag, raw.b2Etag, raw.b2_etag, fallback.etag),
    uploadedAt: reportFirstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at, fallback.uploadedAt, fallback.uploaded_at),
    uploaded_at: reportFirstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at, fallback.uploadedAt, fallback.uploaded_at),
    redacted: raw.redacted !== false,
    publicUrl,
    public_url: publicUrl,
    optimized: Boolean(raw.optimized ?? fallback.optimized),
    optimizationFormat: reportFirstCleanString(raw.optimizationFormat, raw.optimization_format, fallback.optimizationFormat, fallback.optimization_format),
    optimization_format: reportFirstCleanString(raw.optimizationFormat, raw.optimization_format, fallback.optimizationFormat, fallback.optimization_format),
    note: reportFirstCleanString(raw.note, fallback.note, "Email-only preview thumbnail metadata. This is not secure-page proof evidence."),
  };
}

function resolveEmailPreviewImageForFirestore(report: AnyRecord = {}, existingData: AnyRecord = {}): {
  asset: AnyRecord | null;
  url: string;
  webpUrl: string;
  b2Key: string;
  mimeType: string;
  sizeBytes: number;
  hasIncoming: boolean;
  hasExisting: boolean;
} {
  const incomingAsset = normalizeEmailPreviewImageForFirestore(report.emailPreviewImage || report.email_preview_image, {
    b2Key: report.emailPreviewImageB2Key || report.email_preview_image_b2_key,
    publicUrl: report.emailPreviewImageUrl || report.email_preview_image_url || report.emailPreviewImageWebpUrl || report.email_preview_image_webp_url,
    mimeType: report.emailPreviewImageMimeType || report.email_preview_image_mime_type,
    sizeBytes: report.emailPreviewImageSizeBytes || report.email_preview_image_size_bytes,
  });

  const existingAsset = normalizeEmailPreviewImageForFirestore(existingData.emailPreviewImage || existingData.email_preview_image, {
    b2Key: existingData.emailPreviewImageB2Key || existingData.email_preview_image_b2_key,
    publicUrl: existingData.emailPreviewImageUrl || existingData.email_preview_image_url || existingData.emailPreviewImageWebpUrl || existingData.email_preview_image_webp_url,
    mimeType: existingData.emailPreviewImageMimeType || existingData.email_preview_image_mime_type,
    sizeBytes: existingData.emailPreviewImageSizeBytes || existingData.email_preview_image_size_bytes,
  });

  const hasIncoming = Boolean(
    report.emailPreviewImage ||
      report.email_preview_image ||
      report.emailPreviewImageUrl ||
      report.email_preview_image_url ||
      report.emailPreviewImageB2Key ||
      report.email_preview_image_b2_key
  );
  const selected = incomingAsset || existingAsset;
  const storedUrl = sanitizeOptionalUrl(reportFirstCleanString(
    hasIncoming ? report.emailPreviewImageUrl : "",
    hasIncoming ? report.email_preview_image_url : "",
    selected?.publicUrl,
    selected?.public_url,
    existingData.emailPreviewImageUrl,
    existingData.email_preview_image_url,
  ));
  const webpUrl = sanitizeOptionalUrl(reportFirstCleanString(
    hasIncoming ? report.emailPreviewImageWebpUrl : "",
    hasIncoming ? report.email_preview_image_webp_url : "",
    selected?.mimeType === "image/webp" ? (selected?.publicUrl || selected?.public_url) : "",
    existingData.emailPreviewImageWebpUrl,
    existingData.email_preview_image_webp_url,
  ));
  const b2Key = reportFirstCleanString(
    selected?.b2Key,
    selected?.b2_key,
    existingData.emailPreviewImageB2Key,
    existingData.email_preview_image_b2_key,
  );
  const url = storedUrl || buildCanonicalEmailPreviewProxyUrl(report, b2Key) || buildCanonicalEmailPreviewProxyUrl(existingData, b2Key);
  const mimeType = reportFirstCleanString(
    selected?.mimeType,
    selected?.mime_type,
    existingData.emailPreviewImageMimeType,
    existingData.email_preview_image_mime_type,
  );
  const sizeBytes = Number(
    selected?.sizeBytes ||
      selected?.size_bytes ||
      existingData.emailPreviewImageSizeBytes ||
      existingData.email_preview_image_size_bytes ||
      0
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

  return { asset, url, webpUrl, b2Key, mimeType, sizeBytes, hasIncoming, hasExisting: Boolean(existingAsset) };
}


function normalizeProblemCardsForFirestore(value: any, maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const title = reportCleanString(record.title || record.problem || record.name || record.label || "Tracking item to verify");
    const finding = reportCleanString(record.finding || record.summary || record.description || record.text || "");
    const businessMeaning = reportCleanString(
      record.businessMeaning || record.business_meaning || record.businessImpact || record.business_impact || record.whyItMatters || record.why_it_matters || record.impact || "",
      "This point should be confirmed before making budget or reporting decisions.",
    );
    const nextCheck = reportCleanString(
      record.nextCheck || record.next_check || record.manualCheck || record.manual_check || record.recommendation || record.nextStep || record.next_step || "",
      "Confirm this item inside the relevant tracking account, CRM, or server records.",
    );
    const evidence = Array.isArray(record.evidence || record.evidencePoints || record.evidence_points)
      ? (record.evidence || record.evidencePoints || record.evidence_points)
          .map((entry: any) => reportCleanString(entry))
          .filter(Boolean)
          .slice(0, 4)
      : [];
    const key = `${title}|${finding}`.toLowerCase();
    if ((!title && !finding) || seen.has(key)) continue;
    seen.add(key);
    output.push({ title, finding, businessMeaning, nextCheck, evidence });
    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeVerificationPlanForFirestore(value: any, maxItems = 5): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const title = reportCleanString(record.title || record.step || record.name || record.description || (typeof item === "string" ? item : ""));
    const description = reportCleanString(record.description || record.detail || record.summary || "");
    const priority = reportCleanString(record.priority || `Priority ${output.length + 1}`);
    const estimatedEffort = reportCleanString(record.estimatedEffort || record.estimated_effort || record.effort || "Short review");
    const key = `${title}|${description}`.toLowerCase();
    if ((!title && !description) || seen.has(key)) continue;
    seen.add(key);
    output.push({
      priority,
      title: title || description,
      description,
      estimatedEffort,
    });
    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeTrackingSignalCardsForFirestore(value: any, maxItems = 8): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const label = reportCleanString(record.label || record.title || record.name || record.text || (typeof item === "string" ? item : ""));
    const status = reportCleanString(record.status || record.state || record.type || "observed");
    const detail = reportCleanString(record.detail || record.description || record.summary || "");
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      label,
      status,
      ...(detail ? { detail } : {}),
    });
    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeEvidenceVideoForFirestore(value: any, report: AnyRecord = {}): AnyRecord | null {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
  const enabled = raw.enabled !== false && Boolean(raw.videoId || raw.video_id || raw.youtubeVideoId || raw.youtube_video_id || raw.videoUrl || raw.video_url || report.evidenceVideoUrl);
  if (!enabled) return null;

  const videoId = reportCleanString(raw.videoId || raw.video_id || raw.youtubeVideoId || raw.youtube_video_id || report.evidenceVideoId || "");
  const videoUrl = reportCleanString(raw.videoUrl || raw.video_url || raw.youtubeUrl || raw.youtube_url || report.evidenceVideoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""));
  const embedUrl = reportCleanString(raw.embedUrl || raw.embed_url || report.evidenceVideoEmbedUrl || (videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : ""));
  const provider = reportCleanString(raw.provider || report.evidenceVideoProvider || "youtube");
  const status = reportCleanString(raw.status || report.evidenceVideoStatus || "ready");

  return {
    enabled: true,
    provider,
    status,
    title: reportCleanString(raw.title || report.evidenceVideoTitle || "Short browser-side evidence walkthrough"),
    description: reportCleanString(raw.description || report.evidenceVideoDescription || "This optional video shows browser-visible evidence only. Final confirmation still requires account-level access."),
    videoId,
    videoUrl,
    youtubeUrl: videoUrl,
    embedUrl,
    embedProvider: reportCleanString(raw.embedProvider || raw.embed_provider || "youtube_nocookie"),
    addedAt: reportCleanString(raw.addedAt || raw.added_at || ""),
    optional: raw.optional !== false,
  };
}

function normalizeSecurePageEvidenceAssetsForFirestore(value: any, maxItems = 12): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const [index, item] of rawItems.entries()) {
    const raw = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const b2Key = reportCleanString(raw.b2Key || raw.b2_key || raw.storageKey || raw.storage_key || raw.key || "");
    if (!b2Key) continue;
    const dedupeKey = b2Key.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const id = reportCleanString(raw.id || raw.assetId || raw.asset_id || `asset_${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96) || `asset_${index + 1}`;
    const role = reportCleanString(raw.role || raw.kind || raw.type || "browser_side_proof").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "browser_side_proof";
    const fileName = reportCleanString(raw.fileName || raw.file_name || raw.name || "secure-page-evidence.png").replace(/[\r\n"]/g, "").slice(0, 180);
    const mimeType = reportCleanString(raw.mimeType || raw.mime_type || raw.contentType || raw.content_type || "image/png").toLowerCase().slice(0, 80);
    const sizeBytes = Number(raw.sizeBytes || raw.size_bytes || raw.size || raw.contentLength || raw.content_length || 0) || 0;
    const pageUrl = String(raw.pageUrl || raw.page_url || "");
    const caption = reportCleanString(raw.caption || raw.title || raw.label || "Browser-side evidence screenshot").slice(0, 240);
    const bucket = reportCleanString(raw.b2Bucket || raw.b2_bucket || raw.bucket || "");

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
      source: reportCleanString(raw.source || "manual_secure_page_evidence_upload").slice(0, 120),
      storageProvider: reportCleanString(raw.storageProvider || raw.storage_provider || "backblaze_b2"),
      storage_provider: reportCleanString(raw.storageProvider || raw.storage_provider || "backblaze_b2"),
      b2Bucket: bucket,
      b2_bucket: bucket,
      b2Key,
      b2_key: b2Key,
      etag: reportCleanString(raw.etag || raw.eTag || raw.b2Etag || raw.b2_etag || ""),
      uploadedAt: reportCleanString(raw.uploadedAt || raw.uploaded_at || raw.createdAt || raw.created_at || ""),
      uploaded_at: reportCleanString(raw.uploadedAt || raw.uploaded_at || raw.createdAt || raw.created_at || ""),
      redacted: raw.redacted !== false,
      displayOrder: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
      display_order: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
      publicUrl: reportCleanString(raw.publicUrl || raw.public_url || raw.proxyUrl || raw.proxy_url || ""),
      public_url: reportCleanString(raw.publicUrl || raw.public_url || raw.proxyUrl || raw.proxy_url || ""),
      note: reportCleanString(raw.note || "Private evidence image metadata only. Rendering can be enabled on the secure page UI separately.").slice(0, 260),
    });

    if (output.length >= maxItems) break;
  }

  return output;
}


export function createReportHandlers(deps: ReportHandlerDeps) {
  const {
    ApiError,
    requireReportRegisterAccess,
    readJson,
    json,
    htmlResponse,
    patchSheetRowSafely,
    nowDhaka,
  } = deps;


  function normalizeDomainKey(...values: any[]): string {
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

  function reportSortMs(report: AnyRecord = {}): number {
    return Math.max(
      toMillis(report.lastRegisteredAt),
      toMillis(report.updatedAt),
      toMillis(report.createdAt),
      toMillis(report.pdfExpiresAt),
      0,
    );
  }

  function serializeResolvedReport(report: AnyRecord = {}, fallbackToken = ""): AnyRecord {
    const token = normalizeReportToken(report.token || report.reportToken || report.report_token || fallbackToken);
    const domainKey = normalizeDomainKey(report.domain, report.websiteUrl, report.website_url, report.website);
    const domainSlug = String(report.domainSlug || report.domain_slug || normalizeReportSlug(domainKey || report.domain || report.websiteUrl || "website"));

    return {
      found: Boolean(token),
      token,
      reportToken: token,
      domain: domainKey || String(report.domain || ""),
      normalizedDomain: domainKey,
      domainSlug,
      domain_slug: domainSlug,
      reportUrl: String(report.reportUrl || report.report_url || ""),
      ogImageUrl: String(report.ogImageUrl || report.og_image_url || report.openGraphImageUrl || report.open_graph_image_url || report.previewImageUrl || report.preview_image_url || report.homepageScreenshotUrl || report.homepage_screenshot_url || ""),
      openGraphImageUrl: String(report.openGraphImageUrl || report.open_graph_image_url || report.ogImageUrl || report.og_image_url || report.previewImageUrl || report.preview_image_url || report.homepageScreenshotUrl || report.homepage_screenshot_url || ""),
      previewImageUrl: String(report.previewImageUrl || report.preview_image_url || report.ogImageUrl || report.og_image_url || report.openGraphImageUrl || report.open_graph_image_url || report.homepageScreenshotUrl || report.homepage_screenshot_url || ""),
      homepageScreenshotUrl: String(report.homepageScreenshotUrl || report.homepage_screenshot_url || report.previewImageUrl || report.preview_image_url || report.ogImageUrl || report.og_image_url || ""),
      emailPreviewImageUrl: String(report.emailPreviewImageUrl || report.email_preview_image_url || report.emailPreviewImage?.publicUrl || report.email_preview_image?.public_url || ""),
      email_preview_image_url: String(report.emailPreviewImageUrl || report.email_preview_image_url || report.emailPreviewImage?.publicUrl || report.email_preview_image?.public_url || ""),
      emailPreviewImageB2Key: String(report.emailPreviewImageB2Key || report.email_preview_image_b2_key || report.emailPreviewImage?.b2Key || report.email_preview_image?.b2_key || ""),
      email_preview_image_b2_key: String(report.emailPreviewImageB2Key || report.email_preview_image_b2_key || report.emailPreviewImage?.b2Key || report.email_preview_image?.b2_key || ""),
      emailPreviewImageMimeType: String(report.emailPreviewImageMimeType || report.email_preview_image_mime_type || report.emailPreviewImage?.mimeType || report.email_preview_image?.mime_type || ""),
      email_preview_image_mime_type: String(report.emailPreviewImageMimeType || report.email_preview_image_mime_type || report.emailPreviewImage?.mimeType || report.email_preview_image?.mime_type || ""),
      emailPreviewImageSizeBytes: Number(report.emailPreviewImageSizeBytes || report.email_preview_image_size_bytes || report.emailPreviewImage?.sizeBytes || report.email_preview_image?.size_bytes || 0) || 0,
      email_preview_image_size_bytes: Number(report.emailPreviewImageSizeBytes || report.email_preview_image_size_bytes || report.emailPreviewImage?.sizeBytes || report.email_preview_image?.size_bytes || 0) || 0,
      ogImagePathname: String(report.ogImagePathname || report.og_image_pathname || report.previewImagePathname || report.preview_image_pathname || ""),
      og_image_pathname: String(report.ogImagePathname || report.og_image_pathname || report.previewImagePathname || report.preview_image_pathname || ""),
      pdfFileId: String(report.pdfFileId || report.pdf_file_id || report.blobPathname || report.blob_pathname || ""),
      pdfViewUrl: String(report.pdfViewUrl || report.pdf_view_url || report.blobUrl || report.blob_url || ""),
      pdfDownloadUrl: String(report.pdfDownloadUrl || report.pdf_download_url || report.blobDownloadUrl || report.blob_download_url || ""),
      pdfExpiresAt: report.pdfExpiresAt || report.pdf_expires_at || "",
      blobPathname: String(report.blobPathname || report.blob_pathname || report.pdfFileId || report.pdf_file_id || ""),
      blobUrl: String(report.blobUrl || report.blob_url || report.pdfViewUrl || report.pdf_view_url || ""),
      blobDownloadUrl: String(report.blobDownloadUrl || report.blob_download_url || report.pdfDownloadUrl || report.pdf_download_url || ""),
      b2Key: String(report.b2Key || report.b2_key || report.pdfStorageKey || report.pdf_storage_key || report.blobPathname || report.blob_pathname || report.pdfFileId || report.pdf_file_id || ""),
      pdfStorageKey: String(report.pdfStorageKey || report.pdf_storage_key || report.b2Key || report.b2_key || report.blobPathname || report.blob_pathname || report.pdfFileId || report.pdf_file_id || ""),
      storageProvider: String(report.storageProvider || report.storage_provider || ""),
      active: report.active !== false,
      reportReady: report.reportReady !== false,
      source: "audit_reports_lookup",
      sourceType: String(report.sourceType || report.source_type || ""),
      source_type: String(report.sourceType || report.source_type || ""),
      outreachChannel: String(report.outreachChannel || report.outreach_channel || report.channel || ""),
      outreach_channel: String(report.outreachChannel || report.outreach_channel || report.channel || ""),
      channel: String(report.channel || report.outreachChannel || report.outreach_channel || ""),
      leadSource: String(report.leadSource || report.lead_source || ""),
      lead_source: String(report.leadSource || report.lead_source || ""),
      sourceGroup: String(report.sourceGroup || report.source_group || ""),
      source_group: String(report.sourceGroup || report.source_group || ""),
      sourceLabel: String(report.sourceLabel || report.source_label || ""),
      source_label: String(report.sourceLabel || report.source_label || ""),
      emailValid: report.emailValid ?? report.email_valid ?? false,
      emailOutreachAllowed: report.emailOutreachAllowed ?? report.email_outreach_allowed ?? false,
      linkedinOutreachAllowed: report.linkedinOutreachAllowed ?? report.linkedin_outreach_allowed ?? false,
      auditSource: String(report.auditSource || report.audit_source || ""),
      sourceContext: String(report.sourceContext || report.source_context || ""),
      linkedinProfileUrl: String(report.linkedinProfileUrl || report.linkedin_profile_url || ""),
      linkedinCompanyUrl: String(report.linkedinCompanyUrl || report.linkedin_company_url || ""),
      linkedinContactName: String(report.linkedinContactName || report.linkedin_contact_name || ""),
    };
  }

  async function readReportDocByToken(tokenRaw: any): Promise<AnyRecord | null> {
    const token = normalizeReportToken(tokenRaw);
    if (!token) return null;

    const snap = await adminDb.collection("audit_reports").doc(token).get();
    if (!snap.exists) return null;

    const report = snap.data() || {};
    if (report.active === false) return null;

    return serializeResolvedReport(report, token);
  }

  async function resolveReportFromDomainIndex(domainKey: string): Promise<AnyRecord | null> {
    if (!domainKey) return null;

    const indexSnap = await adminDb.collection("audit_report_domains").doc(domainKey).get();
    if (!indexSnap.exists) return null;

    const indexData = indexSnap.data() || {};
    const token = normalizeReportToken(indexData.token || indexData.reportToken || indexData.report_token);
    if (!token) return null;

    const report = await readReportDocByToken(token);
    if (report) {
      return {
        ...report,
        source: "audit_report_domains_index",
      };
    }

    return null;
  }

  async function queryReportsByField(field: string, value: any): Promise<AnyRecord[]> {
    const cleanValue = String(value || "").trim();
    if (!cleanValue) return [];

    const snap = await adminDb.collection("audit_reports").where(field, "==", cleanValue).limit(20).get();
    const reports: AnyRecord[] = [];

    snap.forEach((doc: any) => {
      const data = doc.data() || {};
      if (data.active === false) return;
      reports.push({
        ...serializeResolvedReport(data, doc.id),
        _sortMs: reportSortMs(data),
        _docId: doc.id,
        source: `audit_reports_${field}`,
      });
    });

    return reports;
  }

  async function findExistingReportByDomain(body: AnyRecord = {}): Promise<AnyRecord> {
    const domainKey = normalizeDomainKey(
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

    const indexed = await resolveReportFromDomainIndex(domainKey);
    if (indexed) {
      return {
        ...indexed,
        found: true,
        domainSlug: indexed.domainSlug || domainSlug,
        domain_slug: indexed.domain_slug || domainSlug,
      };
    }

    const candidates = [
      ...(await queryReportsByField("domain", domainKey)),
      ...(await queryReportsByField("normalizedDomain", domainKey)),
      ...(await queryReportsByField("normalized_domain", domainKey)),
      ...(await queryReportsByField("websiteUrl", websiteHttps)),
      ...(await queryReportsByField("websiteUrl", websiteHttp)),
      ...(await queryReportsByField("website_url", websiteHttps)),
      ...(await queryReportsByField("website_url", websiteHttp)),
      ...(await queryReportsByField("domainSlug", domainSlug)),
      ...(await queryReportsByField("domain_slug", domainSlug)),
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
      const notFound: AnyRecord = {
        success: true,
        found: false,
        token: "",
        reportToken: "",
        reportUrl: "",
        ogImageUrl: "",
        openGraphImageUrl: "",
        previewImageUrl: "",
        homepageScreenshotUrl: "",
        emailPreviewImageUrl: "",
        email_preview_image_url: "",
        emailPreviewImageB2Key: "",
        email_preview_image_b2_key: "",
        emailPreviewImageMimeType: "",
        email_preview_image_mime_type: "",
        emailPreviewImageSizeBytes: 0,
        email_preview_image_size_bytes: 0,
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
      return notFound;
    }

    const resolvedToken = normalizeReportToken(best.token || best.reportToken || best.report_token || best._docId || "");
    const resolvedDomainSlug = String(best.domainSlug || best.domain_slug || domainSlug || "website");

    const resolved: AnyRecord = {
      ...best,
      found: Boolean(resolvedToken),
      token: resolvedToken,
      reportToken: resolvedToken,
      reportUrl: String(best.reportUrl || best.report_url || ""),
      ogImageUrl: String(best.ogImageUrl || best.og_image_url || best.openGraphImageUrl || best.open_graph_image_url || best.previewImageUrl || best.preview_image_url || best.homepageScreenshotUrl || best.homepage_screenshot_url || ""),
      openGraphImageUrl: String(best.openGraphImageUrl || best.open_graph_image_url || best.ogImageUrl || best.og_image_url || best.previewImageUrl || best.preview_image_url || best.homepageScreenshotUrl || best.homepage_screenshot_url || ""),
      previewImageUrl: String(best.previewImageUrl || best.preview_image_url || best.ogImageUrl || best.og_image_url || best.openGraphImageUrl || best.open_graph_image_url || best.homepageScreenshotUrl || best.homepage_screenshot_url || ""),
      homepageScreenshotUrl: String(best.homepageScreenshotUrl || best.homepage_screenshot_url || best.previewImageUrl || best.preview_image_url || best.ogImageUrl || best.og_image_url || ""),
      emailPreviewImageUrl: String(best.emailPreviewImageUrl || best.email_preview_image_url || best.emailPreviewImage?.publicUrl || best.email_preview_image?.public_url || ""),
      email_preview_image_url: String(best.emailPreviewImageUrl || best.email_preview_image_url || best.emailPreviewImage?.publicUrl || best.email_preview_image?.public_url || ""),
      emailPreviewImageB2Key: String(best.emailPreviewImageB2Key || best.email_preview_image_b2_key || best.emailPreviewImage?.b2Key || best.email_preview_image?.b2_key || ""),
      email_preview_image_b2_key: String(best.emailPreviewImageB2Key || best.email_preview_image_b2_key || best.emailPreviewImage?.b2Key || best.email_preview_image?.b2_key || ""),
      emailPreviewImageMimeType: String(best.emailPreviewImageMimeType || best.email_preview_image_mime_type || best.emailPreviewImage?.mimeType || best.email_preview_image?.mime_type || ""),
      email_preview_image_mime_type: String(best.emailPreviewImageMimeType || best.email_preview_image_mime_type || best.emailPreviewImage?.mimeType || best.email_preview_image?.mime_type || ""),
      emailPreviewImageSizeBytes: Number(best.emailPreviewImageSizeBytes || best.email_preview_image_size_bytes || best.emailPreviewImage?.sizeBytes || best.email_preview_image?.size_bytes || 0) || 0,
      email_preview_image_size_bytes: Number(best.emailPreviewImageSizeBytes || best.email_preview_image_size_bytes || best.emailPreviewImage?.sizeBytes || best.email_preview_image?.size_bytes || 0) || 0,
      ogImagePathname: String(best.ogImagePathname || best.og_image_pathname || best.previewImagePathname || best.preview_image_pathname || ""),
      domain: best.domain || domainKey,
      normalizedDomain: domainKey,
      domainSlug: resolvedDomainSlug,
      domain_slug: resolvedDomainSlug,
      pdfFileId: String(best.pdfFileId || best.pdf_file_id || best.blobPathname || best.blob_pathname || ""),
      pdfViewUrl: String(best.pdfViewUrl || best.pdf_view_url || best.blobUrl || best.blob_url || ""),
      pdfDownloadUrl: String(best.pdfDownloadUrl || best.pdf_download_url || best.blobDownloadUrl || best.blob_download_url || ""),
      blobPathname: String(best.blobPathname || best.blob_pathname || best.pdfFileId || best.pdf_file_id || ""),
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
          emailPreviewImageUrl: String(resolved.emailPreviewImageUrl || resolved.email_preview_image_url || ""),
          email_preview_image_url: String(resolved.emailPreviewImageUrl || resolved.email_preview_image_url || ""),
          emailPreviewImageB2Key: String(resolved.emailPreviewImageB2Key || resolved.email_preview_image_b2_key || ""),
          email_preview_image_b2_key: String(resolved.emailPreviewImageB2Key || resolved.email_preview_image_b2_key || ""),
          emailPreviewImageMimeType: String(resolved.emailPreviewImageMimeType || resolved.email_preview_image_mime_type || ""),
          email_preview_image_mime_type: String(resolved.emailPreviewImageMimeType || resolved.email_preview_image_mime_type || ""),
          emailPreviewImageSizeBytes: Number(resolved.emailPreviewImageSizeBytes || resolved.email_preview_image_size_bytes || 0) || 0,
          email_preview_image_size_bytes: Number(resolved.emailPreviewImageSizeBytes || resolved.email_preview_image_size_bytes || 0) || 0,
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
          source: "backfilled_from_audit_reports_lookup",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return resolved;
  }

  async function handleResolveExistingReport(body: AnyRecord = {}) {
    const resolved = await findExistingReportByDomain(body);

    return json({
      success: true,
      mode: "resolve_existing_report",
      resolveOnly: true,
      ...resolved,
    });
  }


  async function handleReportRegister(req: Request) {
    await requireReportRegisterAccess(req);
    const rawBody = await readJson(req);
    const body = rawBody?.report || rawBody;

    logModularReportDebug("incoming_request", {
      rawHasReportWrapper: Boolean(rawBody?.report),
      rawKeys: rawBody && typeof rawBody === "object" ? Object.keys(rawBody).sort() : [],
      bodyKeys: body && typeof body === "object" ? Object.keys(body).sort() : [],
      incoming: pickModularReportDebugFields(body || {}),
    });

    if (body?.resolveOnly === true || body?.mode === "resolve_existing_report") {
      logModularReportDebug("resolve_only_request", { incoming: pickModularReportDebugFields(body || {}) });
      return await handleResolveExistingReport(body || {});
    }

    const report = normalizeReportPayload(body || {});

    logModularReportDebug("normalized_report", {
      normalized: pickModularReportDebugFields(report || {}),
      hasOgImageUrl: Boolean(report.ogImageUrl),
      secureEvidence: {
        incomingCount: Array.isArray(body?.securePageEvidenceAssets || body?.secure_page_evidence_assets) ? (body.securePageEvidenceAssets || body.secure_page_evidence_assets).length : 0,
        normalizedCount: Array.isArray(report.securePageEvidenceAssets || report.secure_page_evidence_assets) ? (report.securePageEvidenceAssets || report.secure_page_evidence_assets).length : 0,
      },
      manualEvidence: {
        incoming: pickManualEvidenceDebugFields(body || {}),
        normalized: pickManualEvidenceDebugFields(report || {}),
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

    const normalizedDomain = normalizeDomainKey(report.domain, report.websiteUrl);
    const previewImageUrl = firstReportImageUrl(report.previewImageUrl, report.ogImageUrl, report.openGraphImageUrl, report.homepageScreenshotUrl, existingData.previewImageUrl, existingData.ogImageUrl, existingData.openGraphImageUrl, existingData.emailPreviewImageUrl);
    const pdfStorageKey = report.pdfStorageKey || report.b2Key || report.blobPathname || report.pdfFileId;
    const sourceIdentity = normalizeReportSourceIdentity(report, body || {}, existingData);
    const existingManualConversionEvidence = existingData.manualConversionEvidence && typeof existingData.manualConversionEvidence === "object"
      ? existingData.manualConversionEvidence
      : null;
    const existingManualEvidenceHero = existingData.manualEvidenceHero && typeof existingData.manualEvidenceHero === "object"
      ? existingData.manualEvidenceHero
      : null;
    const tfpV2749RegisterMode = tfpV2749ReportModeForFirestore(report, body || {});
    const tfpV2749SetupFirstRegister = TFP_V2749_SETUP_FIRST_MODES.has(tfpV2749RegisterMode);
    const tfpV2749TrackingCase = tfpV2749TrackingCaseForFirestore(report, body || {});
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
    const sourceText = String(report.source || body?.source || "").toLowerCase();
    const shouldPreserveExistingManualEvidence = Boolean(
      !tfpV2749SetupFirstRegister &&
        !incomingManualConversionEvidence &&
        existingManualConversionEvidence &&
        /(manual|linkedin|video|youtube|secure_page_update|metadata)/.test(sourceText),
    );
    const resolvedManualConversionEvidence = incomingManualConversionEvidence || (shouldPreserveExistingManualEvidence ? existingManualConversionEvidence : null);
    const resolvedManualEvidenceHero = tfpV2749SetupFirstRegister ? null : (incomingManualEvidenceHero || (shouldPreserveExistingManualEvidence ? existingManualEvidenceHero : null));
    logModularReportDebug("manual_evidence_firestore_resolution", {
      source: sourceText,
      incoming: pickManualEvidenceDebugFields({ manualConversionEvidence: incomingManualConversionEvidence, manualEvidenceHero: incomingManualEvidenceHero }),
      existing: pickManualEvidenceDebugFields({ manualConversionEvidence: existingManualConversionEvidence, manualEvidenceHero: existingManualEvidenceHero }),
      resolved: pickManualEvidenceDebugFields({ manualConversionEvidence: resolvedManualConversionEvidence, manualEvidenceHero: resolvedManualEvidenceHero }),
      preservedExistingManualEvidence: shouldPreserveExistingManualEvidence,
    });
    const legacyReportFieldsToDelete = [
      "domain_slug",
      "normalized_domain",
      "email",
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
      "primary_action_label",
      "primary_page_label",
      "primary_page_url",
      "reviewed_page_urls",
      "tracking_signal_cards",
      "evidence_video",
      "evidence_video_url",
      "evidence_video_embed_url",
      "evidence_video_provider",
      "evidence_video_status",
      "evidence_video_id",
      "evidence_video_title",
      "evidence_video_description",
      "manual_conversion_evidence",
      "manual_evidence_hero",
    ];

    const cleanProblemCards = normalizeProblemCardsForFirestore(report.problemCards);
    const cleanVerificationPlan = normalizeVerificationPlanForFirestore(report.verificationPlan);
    const cleanTrackingSignalCards = normalizeTrackingSignalCardsForFirestore(report.trackingSignalCards);
    const cleanSecurePageEvidenceAssets = normalizeSecurePageEvidenceAssetsForFirestore(
      report.securePageEvidenceAssets || report.secure_page_evidence_assets || body?.securePageEvidenceAssets || body?.secure_page_evidence_assets,
    );

    logModularReportDebug("secure_evidence_firestore_resolution", {
      incomingCount: Array.isArray(body?.securePageEvidenceAssets || body?.secure_page_evidence_assets) ? (body.securePageEvidenceAssets || body.secure_page_evidence_assets).length : 0,
      normalizedCount: cleanSecurePageEvidenceAssets.length,
      roles: cleanSecurePageEvidenceAssets.map((item) => String(item.role || "")),
      note: "Firestore stores B2 metadata only, never dataUrl/base64 image data.",
    });

    const cleanEmailPreviewImage = resolveEmailPreviewImageForFirestore(report, existingData);

    if (cleanEmailPreviewImage.url && !cleanEmailPreviewImage.b2Key) {
      throw new ApiError(
        "Email preview URL was provided without a private B2 key. Re-upload the thumbnail so the token-scoped B2 metadata can be saved.",
        400,
      );
    }
    if (
      cleanEmailPreviewImage.b2Key &&
      !isEmailPreviewB2KeyScopedToToken(cleanEmailPreviewImage.b2Key, report.token)
    ) {
      throw new ApiError(
        "Email preview B2 key is not scoped to the current report token/email-preview folder.",
        400,
      );
    }

    logModularReportDebug("email_preview_firestore_resolution", {
      incoming: pickModularReportDebugFields(report || {}),
      existing: pickModularReportDebugFields(existingData || {}),
      resolved: {
        emailPreviewImageUrl: cleanEmailPreviewImage.url,
        emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
        emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
        emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
        preservedExisting: !cleanEmailPreviewImage.hasIncoming && cleanEmailPreviewImage.hasExisting,
      },
      note: "Email preview thumbnail is an email-only asset; it is not rendered as secure-page proof evidence.",
    });

    const payload: AnyRecord = {
      token: report.token,
      domainSlug: report.domainSlug,
      reportUrl: report.reportUrl,
      trackingCase: tfpV2749TrackingCase,
      tracking_case: tfpV2749TrackingCase,
      reportMode: tfpV2749RegisterMode,
      report_mode: tfpV2749RegisterMode,
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
      problemCards: cleanProblemCards,
      verificationPlan: cleanVerificationPlan,
      whatChecked: report.whatChecked,
      primaryActionLabel: report.primaryActionLabel || "",
      primaryPageLabel: report.primaryPageLabel || "",
      primaryPageUrl: report.primaryPageUrl || "",
      reviewedPageUrls: Array.isArray(report.reviewedPageUrls) ? report.reviewedPageUrls : [],
      trackingSignalCards: cleanTrackingSignalCards,
      manualConversionEvidence: resolvedManualConversionEvidence || null,
      manual_conversion_evidence: deleteField,
      manualEvidenceHero: resolvedManualEvidenceHero || null,
      manual_evidence_hero: deleteField,
      auditSnapshotTitle: report.auditSnapshotTitle,
      auditSnapshotQuestions: report.auditSnapshotQuestions,
      trustNotes: report.trustNotes,
      howToReadTitle: report.howToReadTitle,
      howToReadParagraphs: report.howToReadParagraphs,
      ctaHeadline: report.ctaHeadline,
      ogImageUrl: previewImageUrl,
      og_image_url: previewImageUrl,
      openGraphImageUrl: previewImageUrl,
      open_graph_image_url: previewImageUrl,
      previewImageUrl,
      preview_image_url: previewImageUrl,
      homepageScreenshotUrl: previewImageUrl,
      homepage_screenshot_url: previewImageUrl,
      emailPreviewImage: cleanEmailPreviewImage.asset || null,
      email_preview_image: cleanEmailPreviewImage.asset || null,
      emailPreviewImageUrl: cleanEmailPreviewImage.url,
      email_preview_image_url: cleanEmailPreviewImage.url,
      emailPreviewImageWebpUrl: cleanEmailPreviewImage.webpUrl,
      email_preview_image_webp_url: cleanEmailPreviewImage.webpUrl,
      emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
      email_preview_image_b2_key: cleanEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
      email_preview_image_mime_type: cleanEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
      email_preview_image_size_bytes: cleanEmailPreviewImage.sizeBytes,
      emailPreviewImageUpdatedAt: cleanEmailPreviewImage.asset ? admin.firestore.FieldValue.serverTimestamp() : deleteField,
      ogImagePathname: report.ogImagePathname,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      pdfStorageKey,
      pdfStorageEtag: report.pdfStorageEtag,
      pdfStorageSize: report.pdfStorageSize,
      pdfExpiresAt: report.pdfExpiresAt,
      leadId: report.leadId,
      sheetRowNumber: report.sheetRowNumber,
      source: sourceIdentity.source,
      sourceType: sourceIdentity.sourceType,
      source_type: sourceIdentity.source_type,
      outreachChannel: sourceIdentity.outreachChannel,
      outreach_channel: sourceIdentity.outreach_channel,
      channel: sourceIdentity.channel,
      leadSource: sourceIdentity.leadSource,
      lead_source: sourceIdentity.lead_source,
      sourceGroup: sourceIdentity.sourceGroup,
      source_group: sourceIdentity.source_group,
      sourceLabel: sourceIdentity.sourceLabel,
      source_label: sourceIdentity.source_label,
      emailValid: report.emailValid,
      email_valid: report.email_valid ?? report.emailValid,
      emailOutreachAllowed: report.emailOutreachAllowed,
      email_outreach_allowed: report.email_outreach_allowed ?? report.emailOutreachAllowed,
      linkedinOutreachAllowed: report.linkedinOutreachAllowed,
      linkedin_outreach_allowed: report.linkedin_outreach_allowed ?? report.linkedinOutreachAllowed,
      auditSource: sourceIdentity.auditSource,
      audit_source: sourceIdentity.audit_source,
      sourceContext: sourceIdentity.sourceContext,
      source_context: sourceIdentity.source_context,
      linkedinProfileUrl: report.linkedinProfileUrl,
      linkedinCompanyUrl: report.linkedinCompanyUrl,
      linkedinContactName: report.linkedinContactName,
      sourceAuditId: report.auditId,
      storageProvider: report.storageProvider,
      contactEmail: report.contactEmail,
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
    const cleanEvidenceVideo = normalizeEvidenceVideoForFirestore(report.evidenceVideo, report);
    if (cleanEvidenceVideo) {
      payload.evidenceVideo = cleanEvidenceVideo;
      payload.evidence_video = deleteField;
      payload.evidenceVideoUrl = cleanEvidenceVideo.videoUrl;
      payload.evidence_video_url = deleteField;
      payload.evidenceVideoEmbedUrl = cleanEvidenceVideo.embedUrl;
      payload.evidence_video_embed_url = deleteField;
      payload.evidenceVideoProvider = cleanEvidenceVideo.provider || "youtube";
      payload.evidence_video_provider = deleteField;
      payload.evidenceVideoStatus = cleanEvidenceVideo.status || "ready";
      payload.evidence_video_status = deleteField;
      payload.evidenceVideoUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    }
  
    if (!existing.exists) {
      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
  
    await reportRef.set(payload, { merge: true });

    const savedSnap = await reportRef.get();
    const savedData = savedSnap.exists ? savedSnap.data() || {} : {};
    logModularReportDebug("after_firestore_set", {
      saved: pickModularReportDebugFields(savedData || {}),
      savedKeys: savedData && typeof savedData === "object" ? Object.keys(savedData).sort() : [],
      hasSavedOgImageUrl: Boolean(savedData?.ogImageUrl),
      secureEvidenceSavedCount: Array.isArray(savedData?.securePageEvidenceAssets || savedData?.secure_page_evidence_assets)
        ? (savedData.securePageEvidenceAssets || savedData.secure_page_evidence_assets).length
        : 0,
    });

    if (normalizedDomain) {
      await adminDb.collection("audit_report_domains").doc(normalizedDomain).set(
        {
          token: report.token,
          reportToken: report.token,
          reportUrl: report.reportUrl,
          reportMode: tfpV2749RegisterMode,
          trackingCase: tfpV2749TrackingCase,
          domain: normalizedDomain,
          normalizedDomain,
          domainSlug: report.domainSlug,
          ogImageUrl: previewImageUrl,
          og_image_url: previewImageUrl,
          openGraphImageUrl: previewImageUrl,
          open_graph_image_url: previewImageUrl,
          previewImageUrl,
          preview_image_url: previewImageUrl,
          homepageScreenshotUrl: previewImageUrl,
          homepage_screenshot_url: previewImageUrl,
          emailPreviewImageUrl: cleanEmailPreviewImage.url,
          email_preview_image_url: cleanEmailPreviewImage.url,
          emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
          email_preview_image_b2_key: cleanEmailPreviewImage.b2Key,
          emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
          email_preview_image_mime_type: cleanEmailPreviewImage.mimeType,
          emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
          email_preview_image_size_bytes: cleanEmailPreviewImage.sizeBytes,
          ogImagePathname: report.ogImagePathname,
          pdfViewUrl: report.pdfViewUrl,
          pdfDownloadUrl: report.pdfDownloadUrl,
          pdfStorageKey,
          storageProvider: report.storageProvider,
          source: sourceIdentity.source,
          sourceType: sourceIdentity.sourceType,
          source_type: sourceIdentity.source_type,
          outreachChannel: sourceIdentity.outreachChannel,
          outreach_channel: sourceIdentity.outreach_channel,
          channel: sourceIdentity.channel,
          leadSource: sourceIdentity.leadSource,
          lead_source: sourceIdentity.lead_source,
          sourceGroup: sourceIdentity.sourceGroup,
          source_group: sourceIdentity.source_group,
          sourceLabel: sourceIdentity.sourceLabel,
          source_label: sourceIdentity.source_label,
          auditSource: sourceIdentity.auditSource,
          audit_source: sourceIdentity.audit_source,
          sourceContext: sourceIdentity.sourceContext,
          source_context: sourceIdentity.source_context,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRegisteredAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (report.leadId) {
      await adminDb.collection("outreach_leads").doc(report.leadId).set(
        {
          reportToken: report.token,
          reportUrl: report.reportUrl,
          emailPreviewImageUrl: cleanEmailPreviewImage.url,
          email_preview_image_url: cleanEmailPreviewImage.url,
          emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
          email_preview_image_b2_key: cleanEmailPreviewImage.b2Key,
          emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
          email_preview_image_mime_type: cleanEmailPreviewImage.mimeType,
          emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
          email_preview_image_size_bytes: cleanEmailPreviewImage.sizeBytes,
          domainSlug: report.domainSlug,
          pdfFileId: report.pdfFileId,
          pdfViewUrl: report.pdfViewUrl,
          pdfDownloadUrl: report.pdfDownloadUrl,
          pdfExpiresAt: report.pdfExpiresAt,
          reportReady: true,
          sourceType: report.sourceType,
          outreachChannel: report.outreachChannel,
          leadSource: report.leadSource,
          emailValid: report.emailValid,
          emailOutreachAllowed: report.emailOutreachAllowed,
          linkedinOutreachAllowed: report.linkedinOutreachAllowed,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          tracking_history: admin.firestore.FieldValue.arrayUnion({
            event: "report_registered",
            reportToken: report.token,
            time: admin.firestore.Timestamp.now(),
          }),
        },
        { merge: true },
      );
    }
  
    let sheetUpdated = false;
    if (Number(report.sheetRowNumber || 0) > 1) {
      await patchSheetRowSafely(Number(report.sheetRowNumber), {
        reportToken: report.token,
        reportUrl: report.reportUrl,
        emailPreviewImageUrl: cleanEmailPreviewImage.url,
        emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
        emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
        emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
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
  
    return json({
      success: true,
      message: "Secure report registered successfully.",
      token: report.token,
      reportToken: report.token,
      domainSlug: report.domainSlug,
      normalizedDomain: normalizeDomainKey(report.domain, report.websiteUrl),
      domain_slug: report.domainSlug,
      reportUrl: report.reportUrl,
      ogImageUrl: report.ogImageUrl,
      openGraphImageUrl: report.openGraphImageUrl,
      previewImageUrl: report.previewImageUrl,
      homepageScreenshotUrl: report.homepageScreenshotUrl,
      emailPreviewImageUrl: cleanEmailPreviewImage.url,
      email_preview_image_url: cleanEmailPreviewImage.url,
      emailPreviewImageWebpUrl: cleanEmailPreviewImage.webpUrl,
      email_preview_image_webp_url: cleanEmailPreviewImage.webpUrl,
      emailPreviewImageB2Key: cleanEmailPreviewImage.b2Key,
      email_preview_image_b2_key: cleanEmailPreviewImage.b2Key,
      emailPreviewImageMimeType: cleanEmailPreviewImage.mimeType,
      email_preview_image_mime_type: cleanEmailPreviewImage.mimeType,
      emailPreviewImageSizeBytes: cleanEmailPreviewImage.sizeBytes,
      email_preview_image_size_bytes: cleanEmailPreviewImage.sizeBytes,
      ogImagePathname: report.ogImagePathname,
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      blobUrl: report.blobUrl,
      blobDownloadUrl: report.blobDownloadUrl,
      blobPathname: report.blobPathname,
      b2Key: report.b2Key,
      b2_key: deleteField,
      b2Bucket: report.b2Bucket,
      b2_bucket: deleteField,
      pdfStorageKey: report.pdfStorageKey || report.b2Key || report.blobPathname || report.pdfFileId,
      pdf_storage_key: deleteField,
      pdfStorageEtag: report.pdfStorageEtag,
      pdf_storage_etag: deleteField,
      pdfStorageSize: report.pdfStorageSize,
      pdf_storage_size: deleteField,
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
      sourceType: report.sourceType,
      outreachChannel: report.outreachChannel,
      leadSource: report.leadSource,
      emailValid: report.emailValid,
      emailOutreachAllowed: report.emailOutreachAllowed,
      linkedinOutreachAllowed: report.linkedinOutreachAllowed,
      sheetUpdated,
      storageProvider: report.storageProvider,
      debugVersion: TFP_MODULAR_REPORT_DEBUG_VERSION,
      registerDebug: {
        incoming: pickModularReportDebugFields(body || {}),
        normalized: pickModularReportDebugFields(report || {}),
        saved: pickModularReportDebugFields(savedData || {}),
      },
    });
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
      throw new ApiError("Stored PDF could not be streamed. Check Backblaze B2, Vercel Blob URL, or storage sharing settings.", 502);
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
    const alreadyViewed = Boolean(report.lastViewedAt || report.firstViewedAt || report.reportPageViewedAt);
    if (alreadyViewed) {
      return json({ success: true, viewed: true, alreadyRecorded: true });
    }
  
    const nowTs = admin.firestore.Timestamp.now();
    await ref.set(
      {
        viewCount: admin.firestore.FieldValue.increment(1),
        firstViewedAt: nowTs,
        lastViewedAt: nowTs,
        reportPageViewedAt: nowTs,
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
  
    const alreadyDownloaded = Boolean(report.lastDownloadedAt || report.firstDownloadedAt || report.pdfDownloadedAt);
    if (!alreadyDownloaded) {
      const nowTs = admin.firestore.Timestamp.now();
      await ref.set(
        {
          downloadCount: admin.firestore.FieldValue.increment(1),
          firstDownloadedAt: nowTs,
          lastDownloadedAt: nowTs,
          pdfDownloadedAt: nowTs,
        },
        { merge: true },
      );
  
      if (report.leadId) {
        await adminDb.collection("outreach_leads").doc(String(report.leadId)).set(
          {
            pdfDownloadedAt: nowTs,
            lastPdfDownloadedAt: nowTs,
          },
          { merge: true },
        );
      }
  
      if (Number(report.sheetRowNumber || 0) > 1) {
        await patchSheetRowSafely(Number(report.sheetRowNumber), {
          pdfDownloaded: "Yes",
          lastPdfDownloadedAt: nowDhaka(),
        });
      }
    }
  
    try {
      const buffer = await resolveReportPdfBuffer(report, true);
      return pdfStreamResponse(buffer, reportPdfFilename(report, token), "attachment");
    } catch (error: any) {
      console.error("Report PDF download failed:", error);
      throw new ApiError(error?.message || "PDF download failed", 502);
    }
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

  async function handleReportHealth(req: Request) {
    await requireReportRegisterAccess(req);
    return json({
      success: true,
      action: "reports/health",
      reportRegisterReady: true,
      debugVersion: TFP_MODULAR_REPORT_DEBUG_VERSION,
      debugRoute: "lib/trackflow-api/reports.ts",
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

  return {
    handleReportRegister,
    handleReportPreview,
    handleReportView,
    handleReportDownload,
    handleReportCta,
    handleReportHealth,
  };
}
