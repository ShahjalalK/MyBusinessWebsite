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


function pickModularReportDebugFields(value: AnyRecord = {}): AnyRecord {
  const raw = value || {};
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
    evidenceVideoUrl: String(raw.evidenceVideoUrl || raw.evidence_video_url || raw.evidenceVideo?.videoUrl || raw.evidence_video?.video_url || ""),
    evidenceVideoStatus: String(raw.evidenceVideoStatus || raw.evidence_video_status || raw.evidenceVideo?.status || raw.evidence_video?.status || ""),
    ogImagePathname: String(raw.ogImagePathname || raw.og_image_pathname || raw.previewImagePathname || raw.preview_image_pathname || ""),
    sourceType: String(raw.sourceType || raw.source_type || ""),
    outreachChannel: String(raw.outreachChannel || raw.outreach_channel || ""),
    leadSource: String(raw.leadSource || raw.lead_source || ""),
    emailOutreachAllowed: raw.emailOutreachAllowed ?? raw.email_outreach_allowed,
    linkedinOutreachAllowed: raw.linkedinOutreachAllowed ?? raw.linkedin_outreach_allowed,
  };
}

function logModularReportDebug(stage: string, details: AnyRecord = {}) {
  try {
    console.log("[TFP_MODULAR_REPORT_DEBUG]", JSON.stringify({ version: TFP_MODULAR_REPORT_DEBUG_VERSION, stage, ...details }));
  } catch {
    console.log("[TFP_MODULAR_REPORT_DEBUG]", TFP_MODULAR_REPORT_DEBUG_VERSION, stage, details);
  }
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
      outreachChannel: String(report.outreachChannel || report.outreach_channel || ""),
      leadSource: String(report.leadSource || report.lead_source || ""),
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

    const payload: AnyRecord = {
      token: report.token,
      domainSlug: report.domainSlug,
      reportUrl: report.reportUrl,
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
      previewImageUrl,
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
  
    await reportRef.set(payload, { merge: true });

    const savedSnap = await reportRef.get();
    const savedData = savedSnap.exists ? savedSnap.data() || {} : {};
    logModularReportDebug("after_firestore_set", {
      saved: pickModularReportDebugFields(savedData || {}),
      savedKeys: savedData && typeof savedData === "object" ? Object.keys(savedData).sort() : [],
      hasSavedOgImageUrl: Boolean(savedData?.ogImageUrl),
    });

    if (normalizedDomain) {
      await adminDb.collection("audit_report_domains").doc(normalizedDomain).set(
        {
          token: report.token,
          reportToken: report.token,
          reportUrl: report.reportUrl,
          domain: normalizedDomain,
          normalizedDomain,
          domainSlug: report.domainSlug,
          previewImageUrl,
          ogImagePathname: report.ogImagePathname,
          pdfViewUrl: report.pdfViewUrl,
          pdfDownloadUrl: report.pdfDownloadUrl,
          pdfStorageKey,
          storageProvider: report.storageProvider,
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
