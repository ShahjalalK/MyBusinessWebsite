import admin from "firebase-admin";
import { del } from "@vercel/blob";
import { adminDb } from "@/lib/firebase-admin";
import { deletePdfFromB2, sanitizeB2Key } from "@/lib/trackflow-storage/b2";
import { deleteReportChatHistory } from "@/lib/supabase-admin";
import { cleanupGoogleSheetReportRow, type SheetCleanupMode } from "@/lib/trackflow-cleanup/sheet-cleanup";

type AnyRecord = Record<string, any>;

type ApiErrorInstance = Error & { status: number };
type ApiErrorConstructor = new (message: string, status?: number) => ApiErrorInstance;

type CleanupMode = "soft" | "hard" | "assets_only";
type LeadCleanupMode = "none" | "archive" | "trash" | "delete";

type StepStatus = "planned" | "skipped" | "ok" | "warning" | "error";

type CleanupStep = {
  service: string;
  action: string;
  status: StepStatus;
  target?: string;
  message?: string;
  error?: string;
  details?: AnyRecord;
};

type CleanupManifest = {
  reportToken: string;
  reportFound: boolean;
  domainSlug: string;
  normalizedDomain: string;
  reportUrl: string;
  leadId: string;
  leadFound: boolean;
  emailLower: string;
  sheetRowNumber: number | null;
  b2PdfKey: string;
  blobImageTargets: string[];
  domainIndexIds: string[];
  pdfExpiresAt: string;
  cleanupStatus: string;
};

export type ReportCleanupHandlerDeps = {
  ApiError: ApiErrorConstructor;
  requireAdmin: (req: Request) => Promise<any> | any;
  requireCronSecret: (req: Request) => Promise<any> | any;
  readJson: (req: Request) => Promise<any>;
  json: (payload: any, status?: number) => Response;
};

function clean(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function cleanId(value: unknown, maxLength = 96): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, maxLength);
}

function cleanEmail(value: unknown): string {
  return clean(value).toLowerCase().slice(0, 320);
}

function normalizeDomainKey(...values: any[]): string {
  for (const value of values) {
    const raw = clean(value).toLowerCase();
    if (!raw) continue;

    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./i, "").replace(/:\d+$/g, "").trim();
      if (host) return host.slice(0, 180);
    } catch {}

    const fallback = raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .replace(/:\d+$/g, "")
      .trim();

    if (fallback) return fallback.slice(0, 180);
  }

  return "";
}

function normalizeSlug(value: unknown): string {
  return clean(value, "website")
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "website";
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value.toMillis === "function") return Number(value.toMillis()) || 0;
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

function toIso(value: any): string {
  const ms = toMillis(value);
  return ms ? new Date(ms).toISOString() : "";
}

function uniqueStrings(values: unknown[], max = 20): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= max) break;
  }

  return output;
}

function safeError(error: any): string {
  return String(error?.message || error || "Unknown error").slice(0, 700);
}

function firstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function getReportTokenFromAny(...values: any[]): string {
  for (const value of values) {
    const token = cleanId(value);
    if (token) return token;
  }
  return "";
}

function extractReportTokenFromUrl(value: any): string {
  const raw = clean(value);
  if (!raw) return "";

  const directMatch = raw.match(/\/tracking-review\/[^/]+\/([a-zA-Z0-9_-]{8,128})\/?/);
  if (directMatch?.[1]) return cleanId(directMatch[1]);

  const shortMatch = raw.match(/\/r\/([a-zA-Z0-9_-]{8,128})\/?/);
  if (shortMatch?.[1]) return cleanId(shortMatch[1]);

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://trackflowpro.com${raw.startsWith("/") ? "" : "/"}${raw}`);
    const pathMatch = url.pathname.match(/\/tracking-review\/[^/]+\/([a-zA-Z0-9_-]{8,128})\/?/);
    if (pathMatch?.[1]) return cleanId(pathMatch[1]);
  } catch {}

  return "";
}

function safeB2Key(...values: any[]): string {
  for (const value of values) {
    const raw = clean(value);
    if (!raw) continue;
    try {
      return sanitizeB2Key(raw);
    } catch {}
  }
  return "";
}

function isLikelyPdfTarget(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.endsWith(".pdf") || lower.includes("/pdf/") || lower.includes("application/pdf");
}

function normalizeBlobDeleteTarget(value: any): string {
  const raw = clean(value);
  if (!raw || isLikelyPdfTarget(raw)) return "";

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (!host.includes("blob.vercel-storage.com")) return "";
      return url.toString();
    } catch {
      return "";
    }
  }

  const pathname = raw.replace(/^\/+/, "");
  if (!pathname || pathname.includes("..")) return "";
  if (!/\.(png|jpe?g|webp|gif)$/i.test(pathname) && !/(og|preview|card|screenshot)/i.test(pathname)) return "";

  return pathname;
}

function collectBlobImageTargets(report: AnyRecord, lead: AnyRecord): string[] {
  return uniqueStrings(
    [
      report.ogImagePathname,
      report.og_image_pathname,
      report.previewImagePathname,
      report.preview_image_pathname,
      report.openGraphImagePathname,
      report.open_graph_image_pathname,
      report.ogImageUrl,
      report.og_image_url,
      report.openGraphImageUrl,
      report.open_graph_image_url,
      report.previewImageUrl,
      report.preview_image_url,
      report.homepageScreenshotUrl,
      report.homepage_screenshot_url,
      lead.ogImagePathname,
      lead.previewImagePathname,
      lead.ogImageUrl,
      lead.previewImageUrl,
    ].map(normalizeBlobDeleteTarget),
    12,
  );
}

function getReportB2Key(report: AnyRecord, lead: AnyRecord): string {
  const provider = firstCleanString(
    report.storageProvider,
    report.storage_provider,
    report.pdfStorageProvider,
    report.pdf_storage_provider,
    lead.storageProvider,
    lead.pdfStorageProvider,
  ).toLowerCase();

  const explicit = safeB2Key(
    report.b2Key,
    report.b2_key,
    report.pdfB2Key,
    report.pdf_b2_key,
    report.pdfObjectKey,
    report.pdf_object_key,
    report.pdfStorageKey,
    report.pdf_storage_key,
    lead.b2Key,
    lead.pdfB2Key,
    lead.pdfObjectKey,
    lead.pdfStorageKey,
  );

  if (explicit) return explicit;

  if (provider.includes("backblaze") || provider.includes("b2")) {
    return safeB2Key(
      report.blobPathname,
      report.blob_pathname,
      report.pdfFileId,
      report.pdf_file_id,
      lead.blobPathname,
      lead.pdfFileId,
    );
  }

  return "";
}

async function getLeadByIdOrReportToken(leadId: string, reportToken: string): Promise<{ id: string; data: AnyRecord } | null> {
  if (leadId) {
    const snap = await adminDb.collection("outreach_leads").doc(leadId).get();
    if (snap.exists) return { id: snap.id, data: asRecord(snap.data()) };
  }

  if (!reportToken) return null;

  const fields = ["reportToken", "report_token", "token"];
  for (const field of fields) {
    const snap = await adminDb.collection("outreach_leads").where(field, "==", reportToken).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, data: asRecord(doc.data()) };
    }
  }

  return null;
}

async function collectDomainIndexIds(report: AnyRecord, token: string): Promise<string[]> {
  const directIds = uniqueStrings(
    [
      report.domainSlug,
      report.domain_slug,
      normalizeSlug(report.domainSlug || report.domain_slug || report.domain || report.websiteUrl || report.website),
      normalizeDomainKey(report.normalizedDomain, report.domain, report.websiteUrl, report.website),
    ],
    8,
  );

  const ids = new Set<string>(directIds.filter(Boolean));

  for (const field of ["token", "reportToken"]) {
    try {
      const snap = await adminDb.collection("audit_report_domains").where(field, "==", token).limit(10).get();
      snap.docs.forEach((doc: any) => ids.add(doc.id));
    } catch {
      // Domain index lookup is best-effort only.
    }
  }

  return Array.from(ids).filter(Boolean);
}

async function buildCleanupManifest(token: string): Promise<{ manifest: CleanupManifest; report: AnyRecord; lead: AnyRecord }> {
  const reportSnap = await adminDb.collection("audit_reports").doc(token).get();
  const reportFound = Boolean(reportSnap.exists);
  const report: AnyRecord = reportFound ? asRecord(reportSnap.data()) : {};

  const leadId = firstCleanString(
    report.leadId,
    report.lead_id,
    report.firestoreLeadId,
    report.firestore_lead_id,
    report.outreachLeadId,
    report.outreach_lead_id,
  );

  const leadResult = await getLeadByIdOrReportToken(leadId, token);
  const leadFound = Boolean(leadResult);
  const lead: AnyRecord = leadResult ? { ...asRecord(leadResult.data), id: leadResult.id } : {};

  const domainSlug = normalizeSlug(report.domainSlug || report.domain_slug || report.domain || report.websiteUrl || lead.website || "website");
  const normalizedDomain = normalizeDomainKey(report.normalizedDomain, report.domain, report.websiteUrl, report.website, lead.website);
  const domainIndexIds = await collectDomainIndexIds(report, token);
  const sheetRowNumber = Number(report.sheetRowNumber || report.sheet_row_number || lead.sheetRowNumber || lead.sheet_row_number || 0) || null;

  const manifest: CleanupManifest = {
    reportToken: token,
    reportFound,
    domainSlug,
    normalizedDomain,
    reportUrl: firstCleanString(report.reportUrl, report.report_url, lead.reportUrl, lead.report_url),
    leadId: firstCleanString(lead.id, leadId),
    leadFound,
    emailLower: cleanEmail(lead.emailLower || lead.email_lower || lead.email || report.emailLower || report.email_lower || report.email),
    sheetRowNumber,
    b2PdfKey: getReportB2Key(report, lead),
    blobImageTargets: collectBlobImageTargets(report, lead),
    domainIndexIds,
    pdfExpiresAt: toIso(report.pdfExpiresAt || report.pdf_expires_at || lead.pdfExpiresAt || lead.pdf_expires_at),
    cleanupStatus: firstCleanString(report.cleanupStatus, report.cleanup_status),
  };

  return { manifest, report, lead };
}

function isConfirmed(body: AnyRecord, mode: CleanupMode): boolean {
  const confirm = clean(body.confirm || body.confirmation).toUpperCase();
  if (mode === "hard") return confirm === "DELETE_REPORT_ASSETS";
  return confirm === "CLEANUP_REPORT_ASSETS" || confirm === "DELETE_REPORT_ASSETS";
}

function parseMode(value: any): CleanupMode {
  const raw = clean(value || "soft").toLowerCase();
  if (raw === "hard" || raw === "assets_only" || raw === "soft") return raw;
  return "soft";
}

function parseLeadMode(value: any): LeadCleanupMode {
  const raw = clean(value || "none").toLowerCase();
  if (["none", "archive", "trash", "delete"].includes(raw)) return raw as LeadCleanupMode;
  return "none";
}

function parseSheetMode(value: any): SheetCleanupMode {
  const raw = clean(value || "mark").toLowerCase();
  if (["skip", "mark", "clear"].includes(raw)) return raw as SheetCleanupMode;
  return "mark";
}
function isVercelBlobCleanupConfigured(): boolean {
  return Boolean(clean(process.env.BLOB_READ_WRITE_TOKEN));
}

function isAlreadyCleanedStatus(value: string): boolean {
  const status = clean(value).toLowerCase();
  return [
    "assets_cleaned",
    "soft_cleaned",
    "hard_cleaned",
    "report_deleted",
    "deleted",
    "cleaned",
  ].includes(status);
}


function plannedStep(service: string, action: string, target?: string, message?: string, details?: AnyRecord): CleanupStep {
  return { service, action, status: "planned", target, message, details };
}

async function deleteB2PdfStep(manifest: CleanupManifest): Promise<CleanupStep> {
  if (!manifest.b2PdfKey) {
    return { service: "backblaze_b2", action: "delete_pdf", status: "skipped", message: "No B2 PDF key found." };
  }

  try {
    const deleted = await deletePdfFromB2(manifest.b2PdfKey);
    return {
      service: "backblaze_b2",
      action: "delete_pdf",
      status: "ok",
      target: manifest.b2PdfKey,
      message: deleted ? "B2 PDF deleted." : "B2 PDF was already missing.",
    };
  } catch (error: any) {
    return {
      service: "backblaze_b2",
      action: "delete_pdf",
      status: "error",
      target: manifest.b2PdfKey,
      error: safeError(error),
    };
  }
}

async function deleteBlobImagesStep(manifest: CleanupManifest): Promise<CleanupStep> {
  if (!manifest.blobImageTargets.length) {
    return { service: "vercel_blob", action: "delete_preview_images", status: "skipped", message: "No Vercel Blob preview image target found." };
  }

  if (!isVercelBlobCleanupConfigured()) {
    return {
      service: "vercel_blob",
      action: "delete_preview_images",
      status: "warning",
      message: "Blob preview image cleanup skipped because BLOB_READ_WRITE_TOKEN is not configured on the deployed server.",
      details: { targets: manifest.blobImageTargets },
    };
  }

  try {
    await del(manifest.blobImageTargets);
    return {
      service: "vercel_blob",
      action: "delete_preview_images",
      status: "ok",
      message: `Deleted ${manifest.blobImageTargets.length} Blob preview image target(s).`,
      details: { targets: manifest.blobImageTargets },
    };
  } catch (error: any) {
    return {
      service: "vercel_blob",
      action: "delete_preview_images",
      status: "error",
      error: safeError(error),
      details: { targets: manifest.blobImageTargets },
    };
  }
}

async function deleteSupabaseChatStep(manifest: CleanupManifest): Promise<CleanupStep> {
  try {
    const result = await deleteReportChatHistory({ reportToken: manifest.reportToken, dryRun: false });
    if (!result.configured) {
      return {
        service: "supabase",
        action: "delete_report_chat",
        status: "skipped",
        message: "Supabase chat logging is not configured.",
        details: result as unknown as AnyRecord,
      };
    }

    const ok = result.messages.ok && result.sessions.ok;
    return {
      service: "supabase",
      action: "delete_report_chat",
      status: ok ? "ok" : "error",
      message: ok ? "Supabase report chat rows deleted." : "Supabase chat cleanup had an error.",
      details: result as unknown as AnyRecord,
      error: ok ? undefined : [result.messages.error, result.sessions.error].filter(Boolean).join(" | "),
    };
  } catch (error: any) {
    return { service: "supabase", action: "delete_report_chat", status: "error", error: safeError(error) };
  }
}

async function writeSheetCleanupStep(
  manifest: CleanupManifest,
  sheetMode: SheetCleanupMode,
  mode: CleanupMode,
  actor: string,
): Promise<CleanupStep> {
  try {
    const result = await cleanupGoogleSheetReportRow({
      rowNumber: manifest.sheetRowNumber,
      mode: sheetMode,
      cleanupMode: mode,
      actor,
      reportToken: manifest.reportToken,
    });

    if (result.skipped) {
      return {
        service: "google_sheet",
        action: sheetMode === "clear" ? "clear_report_fields" : "mark_cleanup",
        status: "skipped",
        target: result.rowNumber ? String(result.rowNumber) : undefined,
        message: result.message,
        details: result as unknown as AnyRecord,
      };
    }

    return {
      service: "google_sheet",
      action: sheetMode === "clear" ? "clear_report_fields" : "mark_cleanup",
      status: result.ok ? "ok" : "error",
      target: result.rowNumber ? String(result.rowNumber) : undefined,
      message: result.message,
      error: result.error,
      details: result as unknown as AnyRecord,
    };
  } catch (error: any) {
    return {
      service: "google_sheet",
      action: sheetMode === "clear" ? "clear_report_fields" : "mark_cleanup",
      status: "error",
      target: manifest.sheetRowNumber ? String(manifest.sheetRowNumber) : undefined,
      error: safeError(error),
    };
  }
}

async function writeContactMemoryForLead(lead: AnyRecord, manifest: CleanupManifest, actor: string, reason: string): Promise<void> {
  const emailLower = manifest.emailLower;
  if (!emailLower) return;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const lastContactedMs = Math.max(toMillis(lead.lastFollowUp), toMillis(lead.sentAt), toMillis(lead.createdAt), Date.now());
  const cooldownUntil = admin.firestore.Timestamp.fromMillis(Date.now() + 180 * 86_400_000);
  const memoryExpiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 365 * 86_400_000);

  await adminDb.collection("contact_memory").doc(encodeURIComponent(emailLower).replace(/\./g, "%2E")).set(
    {
      emailLower,
      lastOutcome: reason,
      lastContactedAt: admin.firestore.Timestamp.fromMillis(lastContactedMs),
      cooldownUntil,
      memoryExpiresAt,
      companyName: clean(lead.company_name || lead.companyName || ""),
      website: clean(lead.website || lead.sheetWebsiteUrl || ""),
      service: clean(lead.service || ""),
      sourceLeadId: manifest.leadId,
      cleanupActor: actor,
      cleanupReason: reason,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true },
  );
}

async function cleanupLeadStep(manifest: CleanupManifest, lead: AnyRecord, leadMode: LeadCleanupMode, actor: string): Promise<CleanupStep> {
  if (leadMode === "none") {
    return { service: "firestore", action: "lead_cleanup", status: "skipped", message: "Lead cleanup was skipped by request." };
  }

  if (!manifest.leadId || !manifest.leadFound) {
    return { service: "firestore", action: "lead_cleanup", status: "skipped", message: "No linked outreach lead found." };
  }

  const ref = adminDb.collection("outreach_leads").doc(manifest.leadId);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const reason = `report_cleanup_${leadMode}`;

  try {
    await writeContactMemoryForLead(lead, manifest, actor, reason);

    if (leadMode === "delete") {
      await ref.delete();
      return {
        service: "firestore",
        action: "delete_lead_keep_memory",
        status: "ok",
        target: manifest.leadId,
        message: "Lead document deleted after tiny contact memory was saved.",
      };
    }

    if (leadMode === "trash") {
      await ref.set(
        {
          archived: true,
          deleted: true,
          deletedAt: now,
          deleteReason: reason,
          stopAutomation: true,
          nextFollowupStatus: "blocked",
          nextFollowupReason: reason,
          updatedAt: now,
        },
        { merge: true },
      );

      return { service: "firestore", action: "trash_lead", status: "ok", target: manifest.leadId, message: "Lead moved to trash." };
    }

    await ref.set(
      {
        archived: true,
        deleted: false,
        archivedAt: now,
        archiveReason: reason,
        stopAutomation: true,
        nextFollowupStatus: "blocked",
        nextFollowupReason: reason,
        updatedAt: now,
      },
      { merge: true },
    );

    return { service: "firestore", action: "archive_lead", status: "ok", target: manifest.leadId, message: "Lead archived and automation stopped." };
  } catch (error: any) {
    return { service: "firestore", action: "lead_cleanup", status: "error", target: manifest.leadId, error: safeError(error) };
  }
}

async function cleanupFirestoreReportStep(manifest: CleanupManifest, mode: CleanupMode, actor: string): Promise<CleanupStep> {
  if (!manifest.reportFound) {
    return { service: "firestore", action: "cleanup_report_document", status: "skipped", message: "Report document was not found." };
  }

  const ref = adminDb.collection("audit_reports").doc(manifest.reportToken);
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    if (mode === "hard") {
      await ref.delete();
      return {
        service: "firestore",
        action: "delete_report_document",
        status: "ok",
        target: manifest.reportToken,
        message: "audit_reports document deleted.",
      };
    }

    await ref.set(
      {
        active: false,
        reportReady: false,
        pdfAvailable: false,
        cleanupStatus: mode === "assets_only" ? "assets_cleaned" : "soft_cleaned",
        cleanupMode: mode,
        cleanupAt: now,
        cleanedAt: now,
        cleanedBy: actor,
        pdfB2Key: "",
        b2Key: "",
        pdfObjectKey: "",
        pdfStorageKey: "",
        pdfViewUrl: "",
        pdfDownloadUrl: "",
        pdfFileId: "",
        blobPathname: "",
        ogImagePathname: "",
        previewImagePathname: "",
        updatedAt: now,
      },
      { merge: true },
    );

    return {
      service: "firestore",
      action: "mark_report_cleaned",
      status: "ok",
      target: manifest.reportToken,
      message: "audit_reports document marked cleaned and PDF fields cleared.",
    };
  } catch (error: any) {
    return { service: "firestore", action: "cleanup_report_document", status: "error", target: manifest.reportToken, error: safeError(error) };
  }
}

async function cleanupDomainIndexStep(manifest: CleanupManifest, mode: CleanupMode, actor: string): Promise<CleanupStep> {
  if (!manifest.domainIndexIds.length) {
    return { service: "firestore", action: "cleanup_domain_indexes", status: "skipped", message: "No domain index IDs found." };
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const results: AnyRecord[] = [];

  for (const id of manifest.domainIndexIds) {
    try {
      const ref = adminDb.collection("audit_report_domains").doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        results.push({ id, ok: true, status: "missing" });
        continue;
      }

      if (mode === "hard") {
        await ref.delete();
        results.push({ id, ok: true, status: "deleted" });
      } else {
        await ref.set(
          {
            active: false,
            reportReady: false,
            cleanupStatus: mode === "assets_only" ? "assets_cleaned" : "soft_cleaned",
            cleanupAt: now,
            cleanedBy: actor,
            updatedAt: now,
          },
          { merge: true },
        );
        results.push({ id, ok: true, status: "marked_cleaned" });
      }
    } catch (error: any) {
      results.push({ id, ok: false, error: safeError(error) });
    }
  }

  const failed = results.filter((item) => !item.ok);
  return {
    service: "firestore",
    action: "cleanup_domain_indexes",
    status: failed.length ? "error" : "ok",
    message: failed.length ? `${failed.length} domain index cleanup item(s) failed.` : "Domain index cleanup complete.",
    details: { results },
  };
}

async function createCleanupJob(input: {
  token: string;
  mode: CleanupMode;
  leadMode: LeadCleanupMode;
  sheetMode: SheetCleanupMode;
  actor: string;
  manifest: CleanupManifest;
}): Promise<string> {
  const ref = adminDb.collection("cleanup_jobs").doc();
  await ref.set({
    type: "report_cleanup",
    reportToken: input.token,
    mode: input.mode,
    leadMode: input.leadMode,
    sheetMode: input.sheetMode,
    actor: input.actor,
    status: "processing",
    manifest: input.manifest,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function finishCleanupJob(jobId: string, status: "completed" | "completed_with_errors", steps: CleanupStep[]): Promise<void> {
  if (!jobId) return;
  await adminDb.collection("cleanup_jobs").doc(jobId).set(
    {
      status,
      steps,
      failedCount: steps.filter((step) => step.status === "error").length,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function dryRunSteps(manifest: CleanupManifest, mode: CleanupMode, leadMode: LeadCleanupMode, sheetMode: SheetCleanupMode): CleanupStep[] {
  const steps: CleanupStep[] = [
    manifest.b2PdfKey
      ? plannedStep("backblaze_b2", "delete_pdf", manifest.b2PdfKey, "B2 PDF would be deleted.")
      : { service: "backblaze_b2", action: "delete_pdf", status: "skipped", message: "No B2 PDF key found." },
    manifest.blobImageTargets.length
      ? plannedStep("vercel_blob", "delete_preview_images", undefined, "Blob preview image target(s) would be deleted.", { targets: manifest.blobImageTargets })
      : { service: "vercel_blob", action: "delete_preview_images", status: "skipped", message: "No Vercel Blob preview image target found." },
    plannedStep("supabase", "delete_report_chat", manifest.reportToken, "Supabase chat rows would be deleted when configured."),
    manifest.reportFound
      ? plannedStep("firestore", mode === "hard" ? "delete_report_document" : "mark_report_cleaned", manifest.reportToken)
      : { service: "firestore", action: "cleanup_report_document", status: "skipped", message: "Report document was not found." },
    manifest.domainIndexIds.length
      ? plannedStep("firestore", mode === "hard" ? "delete_domain_indexes" : "mark_domain_indexes_cleaned", undefined, undefined, { ids: manifest.domainIndexIds })
      : { service: "firestore", action: "cleanup_domain_indexes", status: "skipped", message: "No domain index IDs found." },
    sheetMode === "skip"
      ? { service: "google_sheet", action: "mark_cleanup", status: "skipped", message: "Sheet cleanup would be skipped." }
      : plannedStep("google_sheet", sheetMode === "clear" ? "clear_report_fields" : "mark_cleanup", String(manifest.sheetRowNumber || ""), "Sheet row would be updated if row number is available."),
    leadMode === "none"
      ? { service: "firestore", action: "lead_cleanup", status: "skipped", message: "Lead cleanup would be skipped." }
      : plannedStep("firestore", `${leadMode}_lead`, manifest.leadId, "Linked outreach lead would be cleaned after contact memory is saved."),
  ];

  return steps;
}

async function runCleanup(input: {
  manifest: CleanupManifest;
  report: AnyRecord;
  lead: AnyRecord;
  mode: CleanupMode;
  leadMode: LeadCleanupMode;
  sheetMode: SheetCleanupMode;
  actor: string;
  deps: ReportCleanupHandlerDeps;
}): Promise<{ jobId: string; steps: CleanupStep[] }> {
  const jobId = await createCleanupJob({
    token: input.manifest.reportToken,
    mode: input.mode,
    leadMode: input.leadMode,
    sheetMode: input.sheetMode,
    actor: input.actor,
    manifest: input.manifest,
  });

  const steps: CleanupStep[] = [];

  steps.push(await deleteB2PdfStep(input.manifest));
  steps.push(await deleteBlobImagesStep(input.manifest));
  steps.push(await deleteSupabaseChatStep(input.manifest));
  steps.push(await cleanupFirestoreReportStep(input.manifest, input.mode, input.actor));
  steps.push(await cleanupDomainIndexStep(input.manifest, input.mode, input.actor));
  steps.push(await writeSheetCleanupStep(input.manifest, input.sheetMode, input.mode, input.actor));
  steps.push(await cleanupLeadStep(input.manifest, input.lead, input.leadMode, input.actor));

  const failedCount = steps.filter((step) => step.status === "error").length;
  await finishCleanupJob(jobId, failedCount ? "completed_with_errors" : "completed", steps);

  return { jobId, steps };
}

function appBaseUrl(): string {
  return clean(process.env.NEXT_PUBLIC_APP_URL || process.env.TRACKFLOW_APP_URL || "https://trackflowpro.com").replace(/\/+$/, "");
}

function buildPublicReportUrl(token: string, domainSlug: string, explicitUrl?: string): string {
  const cleanUrl = clean(explicitUrl);
  if (cleanUrl) return cleanUrl;
  const base = appBaseUrl();
  return `${base}/tracking-review/${encodeURIComponent(domainSlug || "website")}/${encodeURIComponent(token)}`;
}

function boolFromAny(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const text = clean(value).toLowerCase();
  return ["1", "true", "yes", "y", "viewed", "downloaded", "clicked", "done"].includes(text);
}

function normalizeReportChannel(data: AnyRecord): "email" | "linkedin" | "manual" | "unknown" {
  const sourceText = firstCleanString(data.channel, data.outreachChannel, data.outreach_channel, data.source, data.audit_source).toLowerCase();
  if (sourceText.includes("linkedin")) return "linkedin";
  if (sourceText.includes("email") || sourceText.includes("brevo") || sourceText.includes("cold")) return "email";
  if (sourceText.includes("manual")) return "manual";
  return "unknown";
}

function buildSecureReportListRow(doc: any): AnyRecord {
  const data = asRecord(typeof doc.data === "function" ? doc.data() : {});
  const token = firstCleanString(data.token, data.reportToken, data.report_token, doc.id);
  const domain = firstCleanString(data.normalizedDomain, data.normalized_domain, data.domain, data.websiteUrl, data.website, data.website_url);
  const domainSlug = normalizeSlug(firstCleanString(data.domainSlug, data.domain_slug, domain, data.companyName, data.company_name, "website"));
  const reportUrl = buildPublicReportUrl(token, domainSlug, firstCleanString(data.reportUrl, data.report_url));
  const viewedCount = Number(data.reportViewCount || data.report_view_count || data.pageViewCount || data.viewCount || 0) || 0;
  const pdfDownloadCount = Number(data.pdfDownloadCount || data.pdf_download_count || data.downloadCount || 0) || 0;
  const ctaClickCount = Number(data.ctaClickCount || data.cta_click_count || data.clickCount || 0) || 0;
  const lastActivityAt = toIso(
    data.lastActivityAt ||
      data.last_activity_at ||
      data.lastReportViewedAt ||
      data.last_report_viewed_at ||
      data.lastPdfDownloadedAt ||
      data.last_pdf_downloaded_at ||
      data.lastCtaClickedAt ||
      data.last_cta_clicked_at ||
      data.updatedAt,
  );

  return {
    token,
    reportUrl,
    domain: domain || domainSlug || "website",
    domainSlug,
    companyName: firstCleanString(data.companyName, data.company_name, data.businessName, data.business_name),
    email: firstCleanString(data.emailLower, data.email_lower, data.email, data.finalEmail, data.final_email),
    source: firstCleanString(data.source, data.audit_source, data.outreachSource, data.outreach_source),
    channel: normalizeReportChannel(data),
    createdAt: toIso(data.createdAt || data.created_at),
    updatedAt: toIso(data.updatedAt || data.updated_at),
    pdfExpiresAt: toIso(data.pdfExpiresAt || data.pdf_expires_at),
    lastActivityAt,
    reportPageViewed: boolFromAny(data.reportPageViewed || data.report_page_viewed) || viewedCount > 0,
    pdfDownloaded: boolFromAny(data.pdfDownloaded || data.pdf_downloaded) || pdfDownloadCount > 0,
    ctaClicked: boolFromAny(data.ctaClicked || data.cta_clicked) || ctaClickCount > 0,
    cleanupStatus: firstCleanString(data.cleanupStatus, data.cleanup_status),
    active: data.active === undefined ? true : data.active !== false,
    leadId: firstCleanString(data.leadId, data.lead_id, data.firestoreLeadId, data.firestore_lead_id, data.outreachLeadId, data.outreach_lead_id),
    sheetRowNumber: Number(data.sheetRowNumber || data.sheet_row_number || 0) || null,
    viewedCount,
    pdfDownloadCount,
    ctaClickCount,
  };
}

function secureReportSortMs(row: AnyRecord): number {
  return Math.max(
    toMillis(row.lastActivityAt),
    toMillis(row.updatedAt),
    toMillis(row.createdAt),
    toMillis(row.pdfExpiresAt),
  );
}

function secureReportMatchesListSearch(row: AnyRecord, search: string): boolean {
  const query = clean(search).toLowerCase();
  if (!query) return true;

  return [
    row.domain,
    row.domainSlug,
    row.companyName,
    row.email,
    row.token,
    row.reportUrl,
    row.source,
    row.cleanupStatus,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function isSecureReportCleaned(row: AnyRecord): boolean {
  const status = clean(row.cleanupStatus).toLowerCase();
  return (
    !row.active ||
    ["assets_cleaned", "soft_cleaned", "hard_cleaned", "report_deleted", "deleted", "cleaned"].includes(status)
  );
}

function isSecureReportExpired(row: AnyRecord): boolean {
  const expiresMs = toMillis(row.pdfExpiresAt);
  return Boolean(expiresMs && expiresMs <= Date.now());
}

function secureReportMatchesListFilter(row: AnyRecord, filter: string): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "active") return !isSecureReportCleaned(row) && !isSecureReportExpired(row);
  if (filter === "expired") return isSecureReportExpired(row);
  if (filter === "viewed") return Boolean(row.reportPageViewed || row.pdfDownloaded || row.ctaClicked);
  if (filter === "no_view") return !row.reportPageViewed && !row.pdfDownloaded && !row.ctaClicked && !isSecureReportCleaned(row);
  if (filter === "cleaned") return isSecureReportCleaned(row);
  if (filter === "test") {
    const haystack = [row.source, row.companyName, row.domain, row.email, row.cleanupStatus].join(" ").toLowerCase();
    return haystack.includes("test") || haystack.includes("demo") || haystack.includes("fake");
  }
  return true;
}

export function createReportCleanupHandlers(deps: ReportCleanupHandlerDeps) {
  const { ApiError, json, readJson } = deps;

  async function buildPreviewFromRequest(req: Request): Promise<{
    token: string;
    mode: CleanupMode;
    leadMode: LeadCleanupMode;
    sheetMode: SheetCleanupMode;
    manifest: CleanupManifest;
    steps: CleanupStep[];
  }> {
    const url = new URL(req.url);
    const token = getReportTokenFromAny(
      url.searchParams.get("token"),
      url.searchParams.get("reportToken"),
      extractReportTokenFromUrl(url.searchParams.get("reportUrl") || ""),
    );

    if (!token) throw new ApiError("Report token is required.", 400);

    const mode = parseMode(url.searchParams.get("mode") || "soft");
    const leadMode = parseLeadMode(url.searchParams.get("leadMode") || "none");
    const sheetMode = parseSheetMode(url.searchParams.get("sheetMode") || "mark");
    const { manifest } = await buildCleanupManifest(token);

    return {
      token,
      mode,
      leadMode,
      sheetMode,
      manifest,
      steps: dryRunSteps(manifest, mode, leadMode, sheetMode),
    };
  }


  async function handleSecureReportsList(req: Request) {
    await deps.requireAdmin(req);

    const url = new URL(req.url);
    const maxLimit = 200;
    const requestedLimit = Number(url.searchParams.get("limit") || 100);
    const limitCount = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, maxLimit));
    const search = clean(url.searchParams.get("search") || "");
    const filter = clean(url.searchParams.get("filter") || "all").toLowerCase();

    let snap;

    try {
      snap = await adminDb
        .collection("audit_reports")
        .orderBy("updatedAt", "desc")
        .limit(limitCount)
        .get();
    } catch (error) {
      snap = await adminDb
        .collection("audit_reports")
        .limit(limitCount)
        .get();
    }

    const rows = snap.docs
      .map((doc) => buildSecureReportListRow(doc))
      .filter((row) => row.token)
      .filter((row) => secureReportMatchesListFilter(row, filter))
      .filter((row) => secureReportMatchesListSearch(row, search))
      .sort((a, b) => secureReportSortMs(b) - secureReportSortMs(a));

    return json({
      success: true,
      action: "cleanup/reports",
      count: rows.length,
      limit: limitCount,
      rows,
      message: rows.length ? `Loaded ${rows.length} secure report(s).` : "No secure reports found.",
    });
  }

  async function handleReportCleanupPreview(req: Request) {
    await deps.requireAdmin(req);
    const preview = await buildPreviewFromRequest(req);

    return json({
      success: true,
      dryRun: true,
      action: "cleanup/report",
      ...preview,
    });
  }

  async function handleReportCleanup(req: Request) {
    const adminUser: any = await deps.requireAdmin(req);
    const body = (await readJson(req)) || {};
    const token = getReportTokenFromAny(
      body.token,
      body.reportToken,
      body.report_token,
      extractReportTokenFromUrl(body.reportUrl || body.report_url || ""),
    );

    if (!token) throw new ApiError("Report token is required.", 400);

    const mode = parseMode(body.mode || "soft");
    const leadMode = parseLeadMode(body.leadMode || body.lead_mode || "none");
    const sheetMode = parseSheetMode(body.sheetMode || body.sheet_mode || "mark");
    const dryRun = body.dryRun !== false;
    const actor = cleanEmail(adminUser.email || "admin") || "admin";
    const { manifest, report, lead } = await buildCleanupManifest(token);
    const steps = dryRunSteps(manifest, mode, leadMode, sheetMode);

    if (dryRun) {
      return json({
        success: true,
        dryRun: true,
        action: "cleanup/report",
        token,
        mode,
        leadMode,
        sheetMode,
        manifest,
        steps,
        confirmRequired: mode === "hard" ? "DELETE_REPORT_ASSETS" : "CLEANUP_REPORT_ASSETS",
      });
    }

    if (!isConfirmed(body, mode)) {
      throw new ApiError(
        mode === "hard"
          ? "Confirmation required. Send confirm: DELETE_REPORT_ASSETS."
          : "Confirmation required. Send confirm: CLEANUP_REPORT_ASSETS.",
        400,
      );
    }

    const result = await runCleanup({
      manifest,
      report,
      lead,
      mode,
      leadMode,
      sheetMode,
      actor,
      deps,
    });

    const failedCount = result.steps.filter((step) => step.status === "error").length;

    return json({
      success: failedCount === 0,
      dryRun: false,
      action: "cleanup/report",
      token,
      mode,
      leadMode,
      sheetMode,
      jobId: result.jobId,
      manifest,
      steps: result.steps,
      failedCount,
    }, failedCount ? 207 : 200);
  }

  async function handleExpiredReportCleanupCron(req: Request) {
    await deps.requireCronSecret(req);

    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 25), 100));
    const dryRun = url.searchParams.get("dryRun") !== "false";
    const mode = parseMode(url.searchParams.get("mode") || "soft");
    const leadMode = parseLeadMode(url.searchParams.get("leadMode") || "none");
    const sheetMode = parseSheetMode(url.searchParams.get("sheetMode") || "mark");
    const confirm = clean(url.searchParams.get("confirm") || req.headers.get("x-cleanup-confirm") || "").toUpperCase();
    const actor = "cron:cleanup-expired-reports";
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now());

    if (!dryRun && confirm !== "CLEANUP_EXPIRED_REPORTS") {
      throw new ApiError("Confirmation required for cron cleanup. Send confirm=CLEANUP_EXPIRED_REPORTS or x-cleanup-confirm: CLEANUP_EXPIRED_REPORTS.", 400);
    }

    if (!dryRun && mode === "hard") {
      throw new ApiError("Hard cleanup is not allowed from the expired-report cron. Use the manual POST cleanup endpoint for hard deletes.", 400);
    }

    const snap = await adminDb
      .collection("audit_reports")
      .where("pdfExpiresAt", "<=", cutoff)
      .limit(limit)
      .get();

    const rows: AnyRecord[] = [];
    let cleanedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const doc of snap.docs) {
      const token = cleanId(doc.id);
      if (!token) continue;

      const { manifest, report, lead } = await buildCleanupManifest(token);

      if (isAlreadyCleanedStatus(manifest.cleanupStatus)) {
        skippedCount += 1;
        rows.push({
          token,
          skipped: true,
          reason: `Already cleaned: ${manifest.cleanupStatus}`,
          manifest,
        });
        continue;
      }

      if (dryRun) {
        rows.push({
          token,
          dryRun: true,
          manifest,
          steps: dryRunSteps(manifest, mode, leadMode, sheetMode),
        });
        continue;
      }

      const result = await runCleanup({
        manifest,
        report,
        lead,
        mode,
        leadMode,
        sheetMode,
        actor,
        deps,
      });

      const rowFailedCount = result.steps.filter((step) => step.status === "error").length;
      if (rowFailedCount) failedCount += 1;
      else cleanedCount += 1;

      rows.push({
        token,
        dryRun: false,
        jobId: result.jobId,
        failedCount: rowFailedCount,
        manifest,
        steps: result.steps,
      });
    }

    return json({
      success: failedCount === 0,
      action: "cron/cleanup-expired-reports",
      dryRun,
      mode,
      leadMode,
      sheetMode,
      count: rows.length,
      cleanedCount,
      skippedCount,
      failedCount,
      message: dryRun
        ? "Expired report cleanup cron preview completed. No records were changed."
        : "Expired report cleanup cron completed using deployed Vercel server helpers only.",
      rows,
    }, failedCount ? 207 : 200);
  }


  return {
    handleSecureReportsList,
    handleReportCleanupPreview,
    handleReportCleanup,
    handleExpiredReportCleanupCron,
  };
}
