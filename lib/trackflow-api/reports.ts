import { NextResponse } from "next/server";
import { google } from "googleapis";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import {
  AnyRecord,
  appBaseUrl,
  escapeHtml,
  isLocalOrUnsafeReportUrl,
  normalizeReportPayload,
  normalizeReportToken,
  sanitizeLocalRedirectTarget,
  sanitizeOptionalUrl,
  toMillis,
} from "./report-normalizers";

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

  async function handleReportRegister(req: Request) {
    await requireReportRegisterAccess(req);
    const rawBody = await readJson(req);
    const body = rawBody?.report || rawBody;
    const report = normalizeReportPayload(body || {});
  
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
  
    const payload: AnyRecord = {
      token: report.token,
      domainSlug: report.domainSlug,
      domain_slug: report.domainSlug,
      reportUrl: report.reportUrl,
      domain: report.domain,
      websiteUrl: report.websiteUrl,
      companyName: report.companyName,
      email: report.email,
      headline: report.headline,
      subheadline: report.subheadline,
      mainFinding: report.mainFinding,
      businessImpact: report.businessImpact,
      proofPoints: report.proofPoints,
      recommendations: report.recommendations,
      problemCards: report.problemCards,
      businessProblems: report.businessProblems,
      verificationPlan: report.verificationPlan,
      verification_plan: report.verification_plan,
      websiteSpeed: report.websiteSpeed,
      website_speed: report.website_speed,
      ctaInteractionTest: report.ctaInteractionTest,
      cta_interaction_test: report.cta_interaction_test,
      whatChecked: report.whatChecked,
      auditSnapshotTitle: report.auditSnapshotTitle,
      auditSnapshotQuestions: report.auditSnapshotQuestions,
      trustNotes: report.trustNotes,
      howToReadTitle: report.howToReadTitle,
      howToReadParagraphs: report.howToReadParagraphs,
      ctaHeadline: report.ctaHeadline,
      privateReportCopy: report.privateReportCopy,
      private_report_copy: report.privateReportCopy,
      privateReportVersion: report.privateReportVersion,
      manualAdsTransparency: report.manualAdsTransparency,
      manual_ads_transparency: report.manual_ads_transparency,
      manual_ads_checked: report.manual_ads_checked,
      manual_ads_found: report.manual_ads_found,
      manual_ads_source: report.manual_ads_source,
      manual_ads_note: report.manual_ads_note,
      manual_ads_checked_at: report.manual_ads_checked_at,
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      blobUrl: report.blobUrl,
      blobDownloadUrl: report.blobDownloadUrl,
      blobPathname: report.blobPathname,
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
  
    if (!existing.exists) {
      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
  
    await reportRef.set(payload, { merge: true });
  
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
      domain_slug: report.domainSlug,
      reportUrl: report.reportUrl,
      pdfFileId: report.pdfFileId,
      pdfViewUrl: report.pdfViewUrl,
      pdfDownloadUrl: report.pdfDownloadUrl,
      blobUrl: report.blobUrl,
      blobDownloadUrl: report.blobDownloadUrl,
      blobPathname: report.blobPathname,
      pdfExpiresAt: report.pdfExpiresAt,
      leadId: report.leadId,
      sheetRowNumber: report.sheetRowNumber,
      sheetUpdated,
      storageProvider: report.storageProvider,
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

  async function resolveReportPdfBuffer(report: AnyRecord, preferDownload = false): Promise<Buffer> {
    const target = getReportPdfRedirectTarget(report, preferDownload);
    const fileId = String(report.pdfFileId || report.driveFileId || extractGoogleDriveFileId(target) || "").trim();
  
    const viaDriveApi = await fetchPdfBufferFromDriveApi(fileId);
    if (viaDriveApi && isPdfBuffer(viaDriveApi)) return viaDriveApi;
  
    const viaPublicUrl = await fetchPdfBufferFromPublicUrl(target);
    if (!isPdfBuffer(viaPublicUrl)) {
      throw new ApiError("Stored PDF could not be streamed. Check the Vercel Blob URL or storage sharing settings.", 502);
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
