import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TrackFlowPro Drive Report Export API
 *
 * File path recommendation:
 *   app/api/export/drive-reports/route.ts
 *
 * Purpose:
 * - Called from the local audit dashboard after you select approved audited leads.
 * - Fetches the reviewed PDF from the local Python audit engine.
 * - Uploads the PDF to Google Drive, or replaces the existing file for the same lead/domain.
 * - Registers a secure public TrackFlow report page on the Vercel email automation app.
 * - Returns report/PDF fields that LeadList.tsx then sends to Google Sheet.
 *
 * Required ENV on the local dashboard app for Google Drive OAuth upload:
 *   NEXT_PUBLIC_AUDIT_API_URL=http://127.0.0.1:8000
 *   TRACKFLOW_REPORT_REGISTER_URL=https://your-vercel-domain.com/api/trackflow/reports/register
 *   TRACKFLOW_REPORT_REGISTER_SECRET=same-value-as-vercel-REPORT_REGISTER_SECRET
 *   GOOGLE_OAUTH_CLIENT_ID=
 *   GOOGLE_OAUTH_CLIENT_SECRET=
 *   GOOGLE_OAUTH_REFRESH_TOKEN=
 *   GOOGLE_DRIVE_REPORT_FOLDER_ID=personal-drive-folder-id
 *   GOOGLE_DRIVE_PUBLIC_SHARING=true  // keep true unless your deployed /reports/preview + /download routes proxy private Drive files
 *
 * Notes:
 * - GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY may still be used by the Google Sheet route.
 * - This Drive route intentionally uses OAuth, not service account auth, so PDF uploads use the configured Drive account quota.
 * - The email must only expose the branded /r/{token} report page. Direct Drive/PDF URLs are kept for backend report preview/download only.
 */

type AnyRecord = Record<string, any>;

type DriveUploadResult = {
  fileId: string;
  viewUrl: string;
  downloadUrl: string;
  name: string;
};

const PDF_MIME_TYPE = 'application/pdf';

type HealthCheckStatus = 'ok' | 'warning' | 'error' | 'skipped';

type HealthCheckResult = {
  name: string;
  status: HealthCheckStatus;
  message: string;
  details?: AnyRecord;
};

function boolEnv(name: string, fallback = false): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(raw);
}

function errorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

function maskValue(value: string): string {
  const cleanValue = clean(value);
  if (!cleanValue) return '';
  if (cleanValue.length <= 8) return 'configured';
  return `${cleanValue.slice(0, 4)}…${cleanValue.slice(-4)}`;
}

function envConfigured(...names: string[]): boolean {
  return names.some((name) => Boolean(clean(process.env[name] || '')));
}

function envValue(...names: string[]): string {
  for (const name of names) {
    const value = clean(process.env[name] || '');
    if (value) return value;
  }
  return '';
}

function makeCheck(
  name: string,
  status: HealthCheckStatus,
  message: string,
  details?: AnyRecord,
): HealthCheckResult {
  return {
    name,
    status,
    message,
    ...(details ? { details } : {}),
  };
}

function isDriveReportExportAllowedHere(): { allowed: boolean; reason: string } {
  if (!isProductionRuntime()) {
    return { allowed: true, reason: 'Local/development runtime.' };
  }

  if (boolEnv('ALLOW_DRIVE_REPORT_EXPORT_IN_PRODUCTION', false)) {
    return {
      allowed: true,
      reason: 'Production export explicitly enabled by ALLOW_DRIVE_REPORT_EXPORT_IN_PRODUCTION=true.',
    };
  }

  return {
    allowed: false,
    reason:
      'Drive report export is local-only by default. Run this route on the local audit dashboard, or set ALLOW_DRIVE_REPORT_EXPORT_IN_PRODUCTION=true intentionally.',
  };
}

function assertDriveReportExportRuntimeAllowed() {
  const gate = isDriveReportExportAllowedHere();
  if (!gate.allowed) {
    throw new Error(gate.reason);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      cache: init.cache || 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isFutureIsoDate(value: any, minimumMsFromNow = 60_000): boolean {
  const raw = clean(value);
  if (!raw) return false;

  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return false;

  return parsed > Date.now() + minimumMsFromNow;
}

function checkRequiredEnv(): HealthCheckResult {
  const groups = [
    {
      label: 'Python audit API URL',
      names: ['NEXT_PUBLIC_AUDIT_API_URL', 'PYTHON_AUDIT_BASE_URL'],
      required: true,
    },
    {
      label: 'TrackFlow report register URL/base',
      names: ['TRACKFLOW_REPORT_REGISTER_URL', 'TRACKFLOW_APP_URL', 'NEXT_PUBLIC_TRACKFLOW_APP_URL', 'NEXT_PUBLIC_APP_URL'],
      required: true,
    },
    {
      label: 'TrackFlow report register secret',
      names: ['TRACKFLOW_REPORT_REGISTER_SECRET', 'REPORT_REGISTER_SECRET'],
      required: true,
    },
    {
      label: 'Google OAuth client ID',
      names: ['GOOGLE_OAUTH_CLIENT_ID'],
      required: true,
    },
    {
      label: 'Google OAuth client secret',
      names: ['GOOGLE_OAUTH_CLIENT_SECRET'],
      required: true,
    },
    {
      label: 'Google OAuth refresh token',
      names: ['GOOGLE_OAUTH_REFRESH_TOKEN'],
      required: true,
    },
    {
      label: 'Google Drive report folder ID',
      names: ['GOOGLE_DRIVE_REPORT_FOLDER_ID', 'GOOGLE_DRIVE_FOLDER_ID'],
      required: false,
    },
    {
      label: 'Sheet API secret',
      names: ['SHEET_API_SECRET'],
      required: isProductionRuntime(),
    },
  ];

  const missing = groups
    .filter((group) => group.required && !envConfigured(...group.names))
    .map((group) => group.label);

  const warnings = groups
    .filter((group) => !group.required && !envConfigured(...group.names))
    .map((group) => group.label);

  const configured = groups.reduce<Record<string, string>>((acc, group) => {
    const value = envValue(...group.names);
    acc[group.label] = value ? maskValue(value) : '';
    return acc;
  }, {});

  if (missing.length) {
    return makeCheck('required_env', 'error', `Missing required ENV: ${missing.join(', ')}`, {
      missing,
      warnings,
      configured,
    });
  }

  if (warnings.length) {
    return makeCheck('required_env', 'warning', `Required ENV configured. Optional/recommended ENV missing: ${warnings.join(', ')}`, {
      warnings,
      configured,
    });
  }

  return makeCheck('required_env', 'ok', 'Required ENV variables are configured.', { configured });
}

async function checkPythonAuditHealth(): Promise<HealthCheckResult> {
  const base = pythonBaseUrl();
  if (!base) {
    return makeCheck('python_audit_api', 'error', 'Python audit base URL is missing.');
  }

  try {
    const url = `${base}/health`;
    const response = await fetchWithTimeout(url, { method: 'GET' }, 5000);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return makeCheck('python_audit_api', 'ok', 'Python audit API is reachable.', {
        url,
        response: data,
      });
    }

    if (response.status === 404) {
      return makeCheck(
        'python_audit_api',
        'warning',
        'Python API is reachable, but /health is missing. Add a small /health endpoint to audit.py.',
        { url, status: response.status },
      );
    }

    return makeCheck('python_audit_api', 'error', `Python audit API health failed with HTTP ${response.status}.`, {
      url,
      status: response.status,
    });
  } catch (error) {
    return makeCheck('python_audit_api', 'error', `Python audit API is not reachable: ${errorMessage(error)}`, {
      base,
    });
  }
}

async function checkGoogleDriveAccess(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];

  try {
    const drive = getOAuthDriveClient();

    const about = await drive.about.get({
      fields: 'user(emailAddress),storageQuota',
    });

    checks.push(
      makeCheck('google_drive_oauth', 'ok', 'Google Drive OAuth credentials can authenticate.', {
        user: about?.data?.user?.emailAddress || 'unknown',
      }),
    );

    const folderId = clean(process.env.GOOGLE_DRIVE_REPORT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '');
    if (!folderId) {
      checks.push(
        makeCheck(
          'google_drive_folder',
          'warning',
          'Google Drive folder ID is missing. Reports will upload to the OAuth account root Drive.',
        ),
      );
      return checks;
    }

    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType,driveId',
      supportsAllDrives: true,
    });

    const mimeType = clean(folder?.data?.mimeType || '');
    const isFolder = mimeType === 'application/vnd.google-apps.folder';

    checks.push(
      makeCheck(
        'google_drive_folder',
        isFolder ? 'ok' : 'warning',
        isFolder
          ? 'Google Drive report folder is accessible.'
          : 'Google Drive folder ID is accessible but is not a standard Drive folder.',
        {
          id: folder?.data?.id || folderId,
          name: folder?.data?.name || '',
          mimeType,
        },
      ),
    );
  } catch (error) {
    checks.push(makeCheck('google_drive_oauth', 'error', `Google Drive check failed: ${errorMessage(error)}`));
  }

  return checks;
}

async function checkReportRegisterEndpoint(deep = false): Promise<HealthCheckResult> {
  let registerUrl = '';

  try {
    registerUrl = buildRegisterUrl();
  } catch (error) {
    return makeCheck('report_register_config', 'error', errorMessage(error));
  }

  const registerSecret = clean(process.env.TRACKFLOW_REPORT_REGISTER_SECRET || process.env.REPORT_REGISTER_SECRET || '');

  if (!registerSecret) {
    return makeCheck(
      'report_register_config',
      'error',
      'Missing TRACKFLOW_REPORT_REGISTER_SECRET. It must match the Vercel REPORT_REGISTER_SECRET.',
      { registerUrl },
    );
  }

  try {
    const parsed = new URL(registerUrl);
    const lower = registerUrl.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return makeCheck('report_register_config', 'error', 'Report register URL must use http/https.', { registerUrl });
    }

    if (isProductionRuntime() && (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('0.0.0.0'))) {
      return makeCheck('report_register_config', 'error', 'Production report register URL cannot point to localhost.', {
        registerUrl,
      });
    }
  } catch {
    return makeCheck('report_register_config', 'error', 'Report register URL is invalid.', { registerUrl });
  }

  if (!deep) {
    return makeCheck('report_register_config', 'ok', 'Report register URL and secret are configured.', {
      registerUrl,
      secret: maskValue(registerSecret),
    });
  }

  try {
    const response = await fetchWithTimeout(
      registerUrl,
      {
        method: 'HEAD',
        headers: {
          'x-report-register-secret': registerSecret,
        },
      },
      5000,
    );

    if ([200, 204, 405].includes(response.status)) {
      return makeCheck('report_register_endpoint', 'ok', 'Report register endpoint is reachable.', {
        registerUrl,
        status: response.status,
      });
    }

    if ([401, 403].includes(response.status)) {
      return makeCheck('report_register_endpoint', 'error', 'Report register endpoint is reachable but rejected the secret.', {
        registerUrl,
        status: response.status,
      });
    }

    return makeCheck('report_register_endpoint', 'warning', `Report register endpoint returned HTTP ${response.status} to HEAD. POST may still work.`, {
      registerUrl,
      status: response.status,
    });
  } catch (error) {
    return makeCheck('report_register_endpoint', 'error', `Report register endpoint is not reachable: ${errorMessage(error)}`, {
      registerUrl,
    });
  }
}

function checkSheetConfig(): HealthCheckResult {
  const sheetSecret = clean(process.env.SHEET_API_SECRET || '');
  const sheetUrl = '/api/export/sheet';

  if (isProductionRuntime() && !sheetSecret) {
    return makeCheck('sheet_sync_config', 'error', 'Missing SHEET_API_SECRET. Production Sheet sync must fail closed.', {
      sheetUrl,
    });
  }

  if (!sheetSecret) {
    return makeCheck(
      'sheet_sync_config',
      'warning',
      'SHEET_API_SECRET is not set. This is acceptable only if the local Sheet route is intentionally secretless in dev.',
      { sheetUrl },
    );
  }

  return makeCheck('sheet_sync_config', 'ok', 'Sheet sync secret is configured.', {
    sheetUrl,
    secret: maskValue(sheetSecret),
  });
}


function json(payload: any, status = 200) {
  return NextResponse.json(payload, { status });
}

function clean(value: any, fallback = ''): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => clean(item)).join(', ');
  return String(value).trim();
}

function cleanCell(value: any, fallback = ''): string {
  return clean(value, fallback).replace(/\s+/g, ' ').trim();
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a || '');
  const bBuf = Buffer.from(b || '');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function cleanLower(value: any): string {
  return clean(value).toLowerCase();
}

function normalizeEmail(value: any): string {
  return clean(value).toLowerCase();
}

function normalizeDomain(value: any): string {
  const raw = clean(value).toLowerCase();
  if (!raw) return '';

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
  }
}

function appBaseUrl(): string {
  return clean(
    process.env.TRACKFLOW_APP_URL ||
      process.env.NEXT_PUBLIC_TRACKFLOW_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '',
  ).replace(/\/+$/, '');
}

function pythonBaseUrl(): string {
  return clean(process.env.NEXT_PUBLIC_AUDIT_API_URL || process.env.PYTHON_AUDIT_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

function buildRegisterUrl(): string {
  const explicit = clean(process.env.TRACKFLOW_REPORT_REGISTER_URL || '');
  if (explicit) return explicit;

  const base = appBaseUrl();
  if (!base) {
    throw new Error('Missing TRACKFLOW_REPORT_REGISTER_URL. Example: TRACKFLOW_REPORT_REGISTER_URL=https://your-vercel-domain.com/api/trackflow/reports/register');
  }

  return `${base}/api/trackflow/reports/register`;
}

function requireDriveReportSecret(req: Request) {
  /**
   * LOCAL-FIRST EXPORT GUARD
   * বাংলা ব্যাখ্যা:
   * এই route normally আপনার নিজের laptop/local audit dashboard থেকে call হয়।
   * তাই REQUIRE_DRIVE_REPORT_SECRET=false হলে local/dev mode-এ header secret লাগবে না,
   * even if DRIVE_REPORT_EXPORT_SECRET accidentally .env.local-এ set থাকে।
   *
   * Production/Vercel-এ always fail-closed রাখা হয়েছে।
   */
  const requireSecret =
    isProductionRuntime() || String(process.env.REQUIRE_DRIVE_REPORT_SECRET || '').toLowerCase() === 'true';

  if (!requireSecret) {
    return;
  }

  const expected = clean(process.env.DRIVE_REPORT_EXPORT_SECRET || '');
  if (!expected) {
    throw new Error('Missing DRIVE_REPORT_EXPORT_SECRET. Production export routes must fail closed.');
  }

  const url = new URL(req.url);
  const received = req.headers.get('x-drive-report-secret') || url.searchParams.get('secret') || '';

  if (!received || !safeEqual(received, expected)) {
    throw new Error('Unauthorized drive report export request.');
  }
}

function getOAuthDriveClient(): any {
  const clientId = clean(process.env.GOOGLE_OAUTH_CLIENT_ID || '');
  const clientSecret = clean(process.env.GOOGLE_OAUTH_CLIENT_SECRET || '');
  const refreshToken = clean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google Drive OAuth credentials. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN.',
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

function sanitizeFilePart(value: string): string {
  return clean(value, 'trackflow-report')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'trackflow-report';
}

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function buildPdfFileName(companyName: string, domain: string) {
  const company = sanitizeFilePart(companyName || domain || 'client');
  const domainPart = sanitizeFilePart(domain || 'website');
  return `TrackFlow-Audit-Report_${company}_${domainPart}_${todayKey()}.pdf`;
}

function toAbsolutePythonPdfUrl(value: any, auditId = ''): string {
  const raw = clean(value);
  const base = pythonBaseUrl();

  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${base}${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  if (auditId) return `${base}/audit/pdf/${encodeURIComponent(auditId)}`;

  return '';
}


function assertSafeAuditPdfUrl(pdfUrl: string) {
  if (!pdfUrl) return;

  let parsed: URL;
  try {
    parsed = new URL(pdfUrl);
  } catch {
    throw new Error('Invalid audit PDF URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Audit PDF URL must use http/https.');
  }

  const allowedBase = pythonBaseUrl();
  const allowedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  try {
    allowedHosts.add(new URL(allowedBase).hostname.toLowerCase());
  } catch {}

  const host = parsed.hostname.toLowerCase();
  const privateNetworkOk = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(host);
  const explicitAllowExternal = String(process.env.ALLOW_EXTERNAL_AUDIT_PDF_URL || 'false').toLowerCase() === 'true';

  if (!allowedHosts.has(host) && !privateNetworkOk && !explicitAllowExternal) {
    throw new Error(
      'Blocked external audit PDF URL. Use NEXT_PUBLIC_AUDIT_API_URL/PYTHON_AUDIT_BASE_URL or set ALLOW_EXTERNAL_AUDIT_PDF_URL=true intentionally.',
    );
  }
}

function getAuditId(audit: AnyRecord): string {
  return clean(
    audit?.audit_id ||
      audit?.auditId ||
      audit?.evidence?.audit_id ||
      audit?.evidence?.evidence_id ||
      '',
  );
}

function getWebsiteUrl(lead: AnyRecord, audit: AnyRecord): string {
  return clean(
    lead?.websiteUrl ||
      lead?.website ||
      lead?.homepage ||
      lead?.link ||
      audit?.homepage_url ||
      audit?.url ||
      audit?.domain ||
      '',
  );
}

function getCompanyName(lead: AnyRecord, audit: AnyRecord, domain: string): string {
  return cleanCell(
    lead?.companyName ||
      lead?.businessName ||
      lead?.title ||
      audit?.company_name ||
      audit?.business_name ||
      audit?.email_intelligence?.company_name ||
      domain ||
      'Client website',
  );
}

function getFinalEmail(lead: AnyRecord, audit: AnyRecord): string {
  const manual = audit?.manual_decision_maker_update || audit?.manual_contact_update || lead?.manualContact || {};
  const candidates = [
    lead?.finalEmail,
    lead?.email,
    manual?.email,
    audit?.person1?.web_email,
    ...(Array.isArray(audit?.contact?.web_emails) ? audit.contact.web_emails : []),
  ];

  const found = candidates.find((item) => {
    const email = normalizeEmail(item);
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  return normalizeEmail(found || '');
}

function normalizeStringArray(value: any, maxItems = 8): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\n|\||;/g)
      : [];
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of rawItems) {
    const text = cleanCell(item);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= maxItems) break;
  }

  return output;
}

function getMainFinding(lead: AnyRecord, audit: AnyRecord): string {
  return cleanCell(
    lead?.mainIssue ||
      audit?.pdf_manual_overrides?.main_finding ||
      audit?.dashboard_verdict?.main_opportunity ||
      audit?.top_opportunity?.problem ||
      audit?.client_dashboard_message?.headline ||
      audit?.email_intelligence?.problem_title ||
      'A tracking review may be useful based on browser-visible audit evidence.',
  );
}

function getHeadline(lead: AnyRecord, audit: AnyRecord): string {
  return cleanCell(
    lead?.headline ||
      audit?.client_dashboard_message?.headline ||
      audit?.email_intelligence?.problem_title ||
      getMainFinding(lead, audit) ||
      'Tracking audit note',
  );
}

function getBusinessImpact(lead: AnyRecord, audit: AnyRecord): string {
  return cleanCell(
    lead?.businessImpact ||
      audit?.dashboard_verdict?.message_angle ||
      audit?.email_intelligence?.business_risk ||
      audit?.top_opportunity?.outreach_angle ||
      'If important lead actions are not measured clearly, it can be harder to know which marketing channels are creating enquiries.',
  );
}

function getProofPoints(lead: AnyRecord, audit: AnyRecord): string[] {
  return normalizeStringArray(
    lead?.proofPoints ||
      audit?.proof_points ||
      audit?.top_opportunity?.proof_points ||
      audit?.client_dashboard_message?.proof_points ||
      audit?.email_intelligence?.evidence_points ||
      audit?.opportunity_score?.problem_opportunity_score?.reasons ||
      [],
    10,
  );
}

function getRecommendations(lead: AnyRecord, audit: AnyRecord): string[] {
  return normalizeStringArray(
    lead?.recommendations ||
      audit?.fix_recommendations ||
      audit?.client_dashboard_message?.recommendations ||
      [
        'Verify the main lead journey in GA4, GTM Preview, and Google Ads diagnostics.',
        'Confirm final lead recording inside the account or CRM before making final tracking decisions.',
      ],
    8,
  );
}


function getPrivateReportCopy(audit: AnyRecord): AnyRecord {
  const reportOverrides = audit?.report_overrides || {};
  const pdfOverrides = audit?.pdf_manual_overrides || {};

  // The local Python audit engine may return the polished client copy under
  // different names depending on whether it came from Gemini, the safe fallback,
  // the PDF preview, or the private report page layer. Keep this tolerant so the
  // hosted /r/{token} page never falls back to generic wording when professional
  // copy already exists on the audit object.
  const candidates = [
    audit?.privateReportCopy,
    audit?.private_report_copy,
    audit?.privateReportPage,
    audit?.private_report_page,
    audit?.aiPrivateReportCopy,
    audit?.ai_private_report_copy,
    audit?.ai_report_copy,
    audit?.gemini_report_copy,
    audit?.pdf_ai_report_copy,
    reportOverrides.privateReportCopy,
    reportOverrides.private_report_copy,
    reportOverrides.privateReportPage,
    reportOverrides.private_report_page,
    reportOverrides.ai_report_copy,
    pdfOverrides.privateReportCopy,
    pdfOverrides.private_report_copy,
    pdfOverrides.ai_report_copy,
  ];

  const found = candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item));
  return found ? (found as AnyRecord) : {};
}

function cleanPrivateText(value: any, fallback = '', maxLength = 500): string {
  const text = cleanCell(value, fallback);
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function normalizePrivateStringArray(value: any, fallback: string[] = [], maxItems = 6): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of rawItems) {
    const text = cleanPrivateText(
      typeof item === 'object' && item
        ? item.title || item.description || item.text || item.label || item.name || ''
        : item,
      '',
      240,
    );
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= maxItems) break;
  }

  return output.length ? output : fallback.slice(0, maxItems);
}

function normalizePrivateRecommendations(value: any, fallback: string[] = [], maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\n|\||;/g)
      : [];

  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    if (item && typeof item === 'object') {
      const title = cleanPrivateText(item.title || item.step || item.name || item.description || '', '', 140);
      const description = cleanPrivateText(item.description || item.detail || item.summary || '', '', 240);
      const priority = cleanPrivateText(item.priority || `Priority ${output.length + 1}`, `Priority ${output.length + 1}`, 40);
      const estimatedEffort = cleanPrivateText(item.estimatedEffort || item.effort || 'Short review', 'Short review', 60);
      const key = `${title}|${description}`.toLowerCase();
      if ((title || description) && !seen.has(key)) {
        seen.add(key);
        output.push({ priority, title: title || description, description, estimatedEffort });
      }
    } else {
      const title = cleanPrivateText(item, '', 180);
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority: `Priority ${output.length + 1}`,
          title,
          description: '',
          estimatedEffort: 'Short review',
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  if (!output.length) {
    return fallback.slice(0, maxItems).map((item, index) => ({
      priority: `Priority ${index + 1}`,
      title: cleanPrivateText(item, 'Tracking verification step', 160),
      description: '',
      estimatedEffort: 'Short review',
    }));
  }

  return output;
}


type ManualAdsTransparencyExport = {
  checked: boolean;
  adsFound: 'yes' | 'no' | 'unknown';
  source: string;
  note: string;
  checkedAt: string;
};

function normalizeManualAdsFound(value: any): 'yes' | 'no' | 'unknown' {
  const raw = clean(value).toLowerCase();
  if (['yes', 'y', 'true', '1', 'found', 'active', 'running', 'ads_found', 'ads found'].includes(raw)) return 'yes';
  if (['no', 'n', 'false', '0', 'not_found', 'none', 'no_ads', 'no ads', 'not running'].includes(raw)) return 'no';
  return 'unknown';
}

function normalizeManualAdsTransparency(...sources: AnyRecord[]): ManualAdsTransparencyExport {
  const nestedCandidates = sources
    .flatMap((source) => [
      source?.manualAdsTransparency,
      source?.manual_ads_transparency,
      source?.adsTransparency,
      source?.ads_transparency,
      source?.report_overrides?.manualAdsTransparency,
      source?.report_overrides?.manual_ads_transparency,
      source?.pdf_manual_overrides?.manualAdsTransparency,
      source?.pdf_manual_overrides?.manual_ads_transparency,
    ])
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as AnyRecord[];

  const merged = Object.assign({}, ...nestedCandidates);
  const checkedRaw =
    merged.checked ??
    merged.manual_ads_checked ??
    merged.ads_checked ??
    sources.find((source) => source?.manual_ads_checked !== undefined)?.manual_ads_checked ??
    sources.find((source) => source?.manualAdsChecked !== undefined)?.manualAdsChecked ??
    false;

  const adsFound = normalizeManualAdsFound(
    merged.adsFound ??
      merged.ads_found ??
      merged.manual_ads_found ??
      sources.find((source) => source?.manual_ads_found !== undefined)?.manual_ads_found ??
      sources.find((source) => source?.manualAdsFound !== undefined)?.manualAdsFound ??
      'unknown',
  );

  const note = clean(
    merged.note ??
      merged.manual_ads_note ??
      merged.ads_note ??
      sources.find((source) => source?.manual_ads_note !== undefined)?.manual_ads_note ??
      sources.find((source) => source?.manualAdsNote !== undefined)?.manualAdsNote ??
      '',
  );

  const checkedAt = clean(
    merged.checkedAt ??
      merged.checked_at ??
      merged.updated_at ??
      merged.manual_ads_checked_at ??
      sources.find((source) => source?.manual_ads_checked_at !== undefined)?.manual_ads_checked_at ??
      sources.find((source) => source?.manualAdsCheckedAt !== undefined)?.manualAdsCheckedAt ??
      '',
  );

  const source = clean(
    merged.source ??
      merged.manual_ads_source ??
      merged.ads_source ??
      sources.find((item) => item?.manual_ads_source !== undefined)?.manual_ads_source ??
      sources.find((item) => item?.manualAdsSource !== undefined)?.manualAdsSource ??
      'google_ads_transparency',
  );

  const checked =
    ['1', 'true', 'yes', 'y', 'on', 'checked'].includes(clean(checkedRaw).toLowerCase()) ||
    adsFound !== 'unknown' ||
    Boolean(note);

  return {
    checked,
    adsFound,
    source: source || 'google_ads_transparency',
    note,
    checkedAt,
  };
}

function hasManualAdsTransparencyContext(value: ManualAdsTransparencyExport): boolean {
  return Boolean(value?.checked || value?.adsFound !== 'unknown' || value?.note || value?.checkedAt);
}

function manualAdsTransparencyFlatFields(value: ManualAdsTransparencyExport): AnyRecord {
  if (!hasManualAdsTransparencyContext(value)) return {};

  return {
    manualAdsTransparency: value,
    manual_ads_transparency: value,
    manual_ads_checked: value.checked,
    manual_ads_found: value.adsFound,
    manual_ads_source: value.source,
    manual_ads_note: value.note,
    manual_ads_checked_at: value.checkedAt,
  };
}


type CtaInteractionExport = {
  enabled?: boolean;
  tested: boolean;
  status: string;
  ctasFound: number;
  ctasTested: number;
  trackingObserved: boolean;
  googleAdsAfterClick: boolean;
  ga4EventsAfterClick: string[];
  metaEventsAfterClick: string[];
  testedItems: AnyRecord[];
  verdict: string;
  truthNote: string;
};

function toNumberSafe(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCtaItems(value: any, maxItems = 10): AnyRecord[] {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item: AnyRecord) => ({
      type: clean(item.type || item.kind || 'cta'),
      kind: clean(item.kind || item.type || 'cta'),
      label: cleanCell(item.label || item.text || item.href || item.url || 'Lead action'),
      text: cleanCell(item.text || item.label || ''),
      href: clean(item.href || item.url || ''),
      url: clean(item.url || item.href || ''),
      page_url: clean(item.page_url || item.pageUrl || ''),
      tested: Boolean(item.tested || item.clicked),
      clicked: Boolean(item.clicked || item.tested),
      prevented_default: Boolean(item.prevented_default || item.preventedDefault),
      navigation_observed: Boolean(item.navigation_observed || item.navigationObserved),
      external_navigation: Boolean(item.external_navigation || item.externalNavigation),
      tracking_observed: Boolean(item.tracking_observed || item.trackingObserved),
      google_ads_after_click: Boolean(item.google_ads_after_click || item.googleAdsAfterClick || item.google_ads_conversion_after_click),
      google_ads_conversion_after_click: Boolean(item.google_ads_conversion_after_click || item.googleAdsConversionAfterClick || item.google_ads_after_click),
      ga4_events_after_click: normalizeStringArray(item.ga4_events_after_click || item.ga4EventsAfterClick, 8),
      ga4_lead_events_after_click: normalizeStringArray(item.ga4_lead_events_after_click || item.ga4LeadEventsAfterClick, 8),
      meta_events_after_click: normalizeStringArray(item.meta_events_after_click || item.metaEventsAfterClick, 8),
      status: clean(item.status || item.verdict || ''),
      verdict: cleanCell(item.verdict || item.note || ''),
    }))
    .slice(0, maxItems);
}

function normalizeCtaInteractionTest(...sources: AnyRecord[]): CtaInteractionExport {
  const nestedCandidates = sources
    .flatMap((source) => [
      source?.ctaInteractionTest,
      source?.cta_interaction_test,
      source?.leadActionTest,
      source?.lead_action_test,
      source?.report_overrides?.ctaInteractionTest,
      source?.report_overrides?.cta_interaction_test,
      source?.pdf_manual_overrides?.ctaInteractionTest,
      source?.pdf_manual_overrides?.cta_interaction_test,
    ])
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as AnyRecord[];

  const merged = Object.assign({}, ...nestedCandidates);
  const testedItems = normalizeCtaItems(merged.tested_items || merged.testedItems || merged.items || merged.clicked_items || merged.clickedItems, 10);
  const ctasFound = toNumberSafe(
    merged.ctas_found ?? merged.ctasFound ?? sources.find((source) => source?.cta_ctas_found !== undefined)?.cta_ctas_found,
    testedItems.length,
  );
  const ctasTested = toNumberSafe(
    merged.ctas_tested ?? merged.ctasTested ?? merged.ctas_clicked ?? merged.ctasClicked ?? sources.find((source) => source?.cta_ctas_tested !== undefined)?.cta_ctas_tested,
    testedItems.filter((item) => item.tested || item.clicked).length,
  );
  const ga4EventsAfterClick = normalizeStringArray(merged.ga4_events_after_click || merged.ga4EventsAfterClick || merged.ga4_lead_events_after_click || merged.ga4LeadEventsAfterClick, 10);
  const metaEventsAfterClick = normalizeStringArray(merged.meta_events_after_click || merged.metaEventsAfterClick, 10);
  const googleAdsAfterClick = Boolean(merged.google_ads_after_click || merged.googleAdsAfterClick || merged.google_ads_conversion_after_click || merged.googleAdsConversionAfterClick || testedItems.some((item) => item.google_ads_after_click || item.google_ads_conversion_after_click));
  const trackingObserved = Boolean(
    merged.tracking_observed ||
      merged.trackingObserved ||
      googleAdsAfterClick ||
      ga4EventsAfterClick.length > 0 ||
      metaEventsAfterClick.length > 0 ||
      testedItems.some((item) => item.tracking_observed || item.google_ads_after_click || item.google_ads_conversion_after_click || (Array.isArray(item.ga4_events_after_click) && item.ga4_events_after_click.length > 0)),
  );
  const tested = Boolean(merged.tested || ctasTested > 0 || testedItems.some((item) => item.tested || item.clicked));
  const status = clean(merged.status || (tested ? (trackingObserved ? 'event_observed' : 'no_clear_event_observed') : ctasFound > 0 ? 'cta_found_not_clicked' : 'not_tested'));

  return {
    enabled: merged.enabled !== false,
    tested,
    status,
    ctasFound,
    ctasTested,
    trackingObserved,
    googleAdsAfterClick,
    ga4EventsAfterClick,
    metaEventsAfterClick,
    testedItems,
    verdict: cleanCell(merged.verdict || (tested ? (trackingObserved ? 'Lead action CTA click tracking evidence was observed.' : 'Lead action CTA click was tested, but clear browser-visible conversion evidence was not observed.') : 'CTA click test was not completed.')),
    truthNote: cleanCell(merged.truth_note || merged.truthNote || 'CTA click evidence is browser-visible only; final account, CRM, or server-side recording still requires access.'),
  };
}

function hasCtaInteractionContext(value: CtaInteractionExport): boolean {
  return Boolean(value.tested || value.ctasFound > 0 || value.ctasTested > 0 || value.testedItems.length > 0 || value.status !== 'not_tested');
}

function ctaInteractionFlatFields(value: CtaInteractionExport): AnyRecord {
  if (!hasCtaInteractionContext(value)) return {};

  return {
    ctaInteractionTest: value,
    cta_interaction_test: {
      enabled: value.enabled,
      tested: value.tested,
      status: value.status,
      ctas_found: value.ctasFound,
      ctas_tested: value.ctasTested,
      tracking_observed: value.trackingObserved,
      google_ads_after_click: value.googleAdsAfterClick,
      ga4_events_after_click: value.ga4EventsAfterClick,
      meta_events_after_click: value.metaEventsAfterClick,
      tested_items: value.testedItems,
      verdict: value.verdict,
      truth_note: value.truthNote,
    },
    cta_test_status: value.status,
    cta_tracking_observed: value.trackingObserved,
    cta_ctas_found: value.ctasFound,
    cta_ctas_tested: value.ctasTested,
  };
}

async function fetchPdfBuffer(pdfUrl: string): Promise<Buffer> {
  if (!pdfUrl) {
    throw new Error('Could not find audit PDF URL. Make sure the audit completed and has audit_id/evidence.pdf_url.');
  }

  assertSafeAuditPdfUrl(pdfUrl);

  const response = await fetch(pdfUrl, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`PDF fetch failed from audit backend (${response.status}). URL: ${pdfUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength < 500) {
    throw new Error('Fetched PDF is too small or empty. Check the Python audit PDF endpoint.');
  }

  const header = buffer.subarray(0, 5).toString('utf8');
  if (header !== '%PDF-') {
    throw new Error('Fetched file is not a valid PDF. Check the Python audit PDF endpoint output.');
  }

  return buffer;
}

function driveQueryEscape(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function ensureDriveFilePublic(drive: any, fileId: string) {
  const shouldSharePublicly = String(process.env.GOOGLE_DRIVE_PUBLIC_SHARING || 'true').toLowerCase() !== 'false';
  if (!shouldSharePublicly || !fileId) return;

  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
  } catch (error: any) {
    // Google may return a duplicate permission/permission already exists error.
    // The file can still be usable, so do not fail the whole export for this case.
    const message = String(error?.message || error?.errors?.[0]?.message || '').toLowerCase();
    if (!message.includes('already') && !message.includes('duplicate')) {
      throw error;
    }
  }
}

async function findExistingDriveFileByName(drive: any, fileName: string): Promise<string> {
  const folderId = clean(process.env.GOOGLE_DRIVE_REPORT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '');
  const escapedName = driveQueryEscape(fileName);
  const q = [
    `name = '${escapedName}'`,
    `trashed = false`,
    folderId ? `'${driveQueryEscape(folderId)}' in parents` : '',
  ]
    .filter(Boolean)
    .join(' and ');

  const found = await drive.files.list({
    q,
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive',
    orderBy: 'modifiedTime desc',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return clean(found.data.files?.[0]?.id || '');
}

async function upsertPdfToDrive(buffer: Buffer, fileName: string, existingFileId = ''): Promise<DriveUploadResult> {
  const drive = getOAuthDriveClient();
  const folderId = clean(process.env.GOOGLE_DRIVE_REPORT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '');
  const targetFileId = clean(existingFileId) || (await findExistingDriveFileByName(drive, fileName));

  if (targetFileId) {
    const updated = await drive.files.update({
      fileId: targetFileId,
      requestBody: {
        name: fileName,
        mimeType: PDF_MIME_TYPE,
      },
      media: {
        mimeType: PDF_MIME_TYPE,
        body: Readable.from(buffer),
      },
      fields: 'id,name,webViewLink,webContentLink',
      supportsAllDrives: true,
    });

    const fileId = clean(updated.data.id || targetFileId);
    await ensureDriveFilePublic(drive, fileId);

    return {
      fileId,
      name: clean(updated.data.name || fileName),
      viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: PDF_MIME_TYPE,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: {
      mimeType: PDF_MIME_TYPE,
      body: Readable.from(buffer),
    },
    fields: 'id,name,webViewLink,webContentLink',
    supportsAllDrives: true,
  });

  const fileId = clean(created.data.id);
  if (!fileId) throw new Error('Google Drive upload did not return a file ID.');

  await ensureDriveFilePublic(drive, fileId);

  return {
    fileId,
    name: clean(created.data.name || fileName),
    viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

async function registerSecureReport(payload: AnyRecord) {
  const registerUrl = buildRegisterUrl();
  const registerSecret = process.env.TRACKFLOW_REPORT_REGISTER_SECRET || process.env.REPORT_REGISTER_SECRET;

  if (!registerSecret) {
    throw new Error('Missing TRACKFLOW_REPORT_REGISTER_SECRET. It must match the Vercel email automation REPORT_REGISTER_SECRET.');
  }

  const response = await fetch(registerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-report-register-secret': registerSecret,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || `Secure report register failed (${response.status}).`);
  }

  return data;
}


type ReportFields = {
  reportToken: string;
  reportUrl: string;
  pdfFileId: string;
  pdfViewUrl: string;
  pdfDownloadUrl: string;
  pdfExpiresAt: string;
};

function isUnsafeLocalUrl(value: any): boolean {
  const url = cleanLower(value);
  if (!url) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')) return true;
  if (url.includes('/audit/pdf/') || url.includes('/audit/evidence/') || url.includes(':8000/')) return true;
  return false;
}

function isSafePublicUrl(value: any): boolean {
  const url = clean(value);
  if (!url || isUnsafeLocalUrl(url)) return false;
  return /^https?:\/\//i.test(url);
}

function isSafeReportPageUrl(value: any): boolean {
  const raw = clean(value);
  if (!isSafePublicUrl(raw)) return false;
  const lower = raw.toLowerCase();
  if (lower.includes('drive.google.com') || lower.includes('googleusercontent.com') || /\.pdf(?:$|[?#])/.test(lower)) {
    return false;
  }

  try {
    const url = new URL(raw);
    return /^\/r\/[a-z0-9_-]{12,96}\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function isSafePdfStorageUrl(value: any): boolean {
  const raw = clean(value);
  if (!isSafePublicUrl(raw)) return false;
  const lower = raw.toLowerCase();
  if (lower.includes('/audit/pdf/') || lower.includes('/audit/evidence/')) return false;
  return true;
}

function getExistingReportFields(lead: AnyRecord, audit: AnyRecord): ReportFields {
  const exportsAny = audit?.exports || {};
  return {
    reportToken: clean(lead?.reportToken || lead?.report_token || audit?.reportToken || audit?.report_token || exportsAny.reportToken || exportsAny.report_token),
    reportUrl: clean(lead?.reportUrl || lead?.report_url || audit?.reportUrl || audit?.report_url || exportsAny.reportUrl || exportsAny.report_url),
    pdfFileId: clean(lead?.pdfFileId || lead?.pdf_file_id || lead?.driveFileId || audit?.pdfFileId || audit?.pdf_file_id || exportsAny.pdfFileId || exportsAny.pdf_file_id),
    pdfViewUrl: clean(lead?.pdfViewUrl || lead?.pdf_view_url || lead?.driveViewUrl || audit?.pdfViewUrl || audit?.pdf_view_url || exportsAny.pdfViewUrl || exportsAny.pdf_view_url),
    pdfDownloadUrl: clean(lead?.pdfDownloadUrl || lead?.pdf_download_url || lead?.driveDownloadUrl || audit?.pdfDownloadUrl || audit?.pdf_download_url || exportsAny.pdfDownloadUrl || exportsAny.pdf_download_url),
    pdfExpiresAt: clean(lead?.pdfExpiresAt || lead?.pdf_expires_at || audit?.pdfExpiresAt || audit?.pdf_expires_at || exportsAny.pdfExpiresAt || exportsAny.pdf_expires_at),
  };
}

function isReportReadyForSheet(fields: ReportFields): boolean {
  return Boolean(
    fields.reportToken &&
      isSafeReportPageUrl(fields.reportUrl) &&
      fields.pdfFileId &&
      isFutureIsoDate(fields.pdfExpiresAt) &&
      (isSafePdfStorageUrl(fields.pdfViewUrl) || isSafePdfStorageUrl(fields.pdfDownloadUrl)),
  );
}


function getServiceType(lead: AnyRecord, audit: AnyRecord): string {
  const raw = cleanCell(
    lead?.serviceType ||
      lead?.service ||
      audit?.service_type ||
      audit?.recommended_service ||
      audit?.offer_type ||
      audit?.top_opportunity?.service_type ||
      '',
  ).toLowerCase();

  if (raw.includes('signature')) return 'Email Signature';
  if (raw.includes('server') || raw.includes('sst')) return 'Server Side Tracking';
  return 'Google Ads';
}

function getAuditScore(lead: AnyRecord, audit: AnyRecord): string {
  return cleanCell(
    lead?.auditScore ||
      audit?.opportunity_score?.overall_score ||
      audit?.lead_score?.score ||
      audit?.audit_score ||
      '',
  );
}

function getLeadLabel(lead: AnyRecord, audit: AnyRecord): string {
  return cleanCell(
    lead?.leadLabel ||
      audit?.opportunity_score?.label ||
      audit?.lead_score?.label ||
      audit?.lead_label ||
      'Qualified',
  );
}

function getDecisionMakerName(lead: AnyRecord, audit: AnyRecord): string {
  const manual = audit?.manual_decision_maker_update || audit?.manual_contact_update || lead?.manualContact || {};
  return cleanCell(
    lead?.decisionMaker ||
      lead?.decision_maker ||
      manual?.name ||
      audit?.decision_maker_safety?.selected_name ||
      audit?.person1?.name ||
      '',
  );
}

function getDecisionMakerTitle(lead: AnyRecord, audit: AnyRecord): string {
  const manual = audit?.manual_decision_maker_update || audit?.manual_contact_update || lead?.manualContact || {};
  return cleanCell(
    lead?.decisionMakerTitle ||
      lead?.decision_maker_title ||
      manual?.title ||
      audit?.decision_maker_safety?.selected_title ||
      audit?.person1?.title ||
      '',
  );
}

function getContactQuality(lead: AnyRecord, audit: AnyRecord, finalEmail: string): string {
  return cleanCell(
    lead?.contactQuality ||
      lead?.contact_quality ||
      audit?.contact_quality?.level ||
      audit?.email_intelligence?.contact_quality ||
      (finalEmail ? 'medium' : 'none'),
  );
}

function getEmailSubject(lead: AnyRecord, audit: AnyRecord, companyName: string): string {
  return cleanCell(
    lead?.emailSubject ||
      lead?.subject ||
      audit?.email_subject ||
      audit?.email_intelligence?.subject ||
      audit?.outreach_email?.subject ||
      `Quick tracking note for ${companyName || 'your website'}`,
  ).slice(0, 180);
}

function buildAuditEmailBody(params: {
  lead: AnyRecord;
  audit: AnyRecord;
  companyName: string;
  websiteUrl: string;
  mainFinding: string;
  businessImpact: string;
  proofPoints: string[];
  reportUrl: string;
}): string {
  const direct = clean(params.lead?.emailBody || params.lead?.message || params.audit?.email_body || params.audit?.outreach_email?.body || '');
  if (direct) return direct;

  const company = params.companyName || 'your company';
  const website = params.websiteUrl || 'your website';
  const proof = params.proofPoints[0] ? `<p>One browser-visible signal: ${cleanCell(params.proofPoints[0])}</p>` : '';
  const reportLine = params.reportUrl
    ? '<p>I put the short browser-visible review on the private TrackFlow Pro report page linked below.</p>'
    : '<p>I can share the short browser-visible review if useful.</p>';

  return [
    '<p>Hi there,</p>',
    `<p>I was reviewing ${cleanCell(company)}${website ? ` (${cleanCell(website)})` : ''} and noticed one tracking item worth checking.</p>`,
    `<p>${cleanCell(params.mainFinding)}</p>`,
    proof,
    `<p>${cleanCell(params.businessImpact)}</p>`,
    reportLine,
    '<p>Would it be useful if I verified this inside GA4, GTM, or Google Ads before you make any tracking changes?</p>',
  ]
    .filter(Boolean)
    .join('\n');
}

function getApprovalStatus(lead: AnyRecord, audit: AnyRecord): string {
  const raw = cleanCell(lead?.approvalStatus || lead?.approval_status || audit?.approval_status || '');
  if (raw) return raw;
  // Safe default: export to Sheet for review, but do not let automation send until approved.
  return 'Needs Review';
}

function getSendStatus(lead: AnyRecord): string {
  return cleanCell(lead?.sendStatus || lead?.send_status || 'Not Sent');
}

function buildPreparedLeadForSheet(lead: AnyRecord, audit: AnyRecord, fields: ReportFields): AnyRecord {
  const websiteUrl = getWebsiteUrl(lead, audit);
  const domain = normalizeDomain(lead?.domain || audit?.domain || websiteUrl);
  const companyName = getCompanyName(lead, audit, domain);
  const finalEmail = getFinalEmail(lead, audit);
  const mainFinding = getMainFinding(lead, audit);
  const businessImpact = getBusinessImpact(lead, audit);
  const proofPoints = getProofPoints(lead, audit);
  const manualAdsTransparency = normalizeManualAdsTransparency(lead, audit);
  const manualAdsFields = manualAdsTransparencyFlatFields(manualAdsTransparency);
  const ctaInteraction = normalizeCtaInteractionTest(lead, audit);
  const ctaFields = ctaInteractionFlatFields(ctaInteraction);
  const emailSubject = getEmailSubject(lead, audit, companyName);
  const emailBody = buildAuditEmailBody({
    lead,
    audit,
    companyName,
    websiteUrl,
    mainFinding,
    businessImpact,
    proofPoints,
    reportUrl: fields.reportUrl,
  });

  const nextAudit = {
    ...audit,
    reportToken: fields.reportToken,
    report_token: fields.reportToken,
    reportUrl: fields.reportUrl,
    report_url: fields.reportUrl,
    pdfFileId: fields.pdfFileId,
    pdf_file_id: fields.pdfFileId,
    pdfViewUrl: fields.pdfViewUrl,
    pdf_view_url: fields.pdfViewUrl,
    pdfDownloadUrl: fields.pdfDownloadUrl,
    pdf_download_url: fields.pdfDownloadUrl,
    pdfExpiresAt: fields.pdfExpiresAt,
    pdf_expires_at: fields.pdfExpiresAt,
    email_subject: emailSubject,
    email_body: emailBody,
    main_issue: mainFinding,
    proof_points: proofPoints,
    ...manualAdsFields,
    ...ctaFields,
    exports: {
      ...(audit?.exports || {}),
      reportToken: fields.reportToken,
      report_token: fields.reportToken,
      reportUrl: fields.reportUrl,
      report_url: fields.reportUrl,
      pdfFileId: fields.pdfFileId,
      pdf_file_id: fields.pdfFileId,
      pdfViewUrl: fields.pdfViewUrl,
      pdf_view_url: fields.pdfViewUrl,
      pdfDownloadUrl: fields.pdfDownloadUrl,
      pdf_download_url: fields.pdfDownloadUrl,
      pdfExpiresAt: fields.pdfExpiresAt,
      pdf_expires_at: fields.pdfExpiresAt,
      secure_report_ready: true,
      sheet_sync_source: 'drive_reports_route',
      ...manualAdsFields,
      ...ctaFields,
    },
  };

  return {
    ...lead,
    businessName: companyName,
    companyName,
    websiteUrl,
    website: websiteUrl,
    finalEmail,
    email: finalEmail || lead?.email || '',
    leadStatus: cleanCell(lead?.leadStatus || lead?.lead_status || 'Qualified'),
    approvalStatus: getApprovalStatus(lead, audit),
    sendStatus: getSendStatus(lead),
    serviceType: getServiceType(lead, audit),
    auditScore: getAuditScore(lead, audit),
    leadLabel: getLeadLabel(lead, audit),
    mainIssue: mainFinding,
    proofPoints: proofPoints.join(' | '),
    emailSubject,
    subject: emailSubject,
    emailBody,
    message: emailBody,
    decisionMaker: getDecisionMakerName(lead, audit),
    decisionMakerTitle: getDecisionMakerTitle(lead, audit),
    contactQuality: getContactQuality(lead, audit, finalEmail),
    reportToken: fields.reportToken,
    reportUrl: fields.reportUrl,
    pdfFileId: fields.pdfFileId,
    pdfViewUrl: fields.pdfViewUrl,
    pdfDownloadUrl: fields.pdfDownloadUrl,
    pdfExpiresAt: fields.pdfExpiresAt,
    reportPageViewed: 'No',
    pdfDownloaded: 'No',
    ctaClicked: 'No',
    ...manualAdsFields,
    ...ctaFields,
    audit: nextAudit,
  };
}

function validatePreparedLeadForSheet(preparedLead: AnyRecord) {
  const blockers: string[] = [];
  if (!clean(preparedLead.email || preparedLead.finalEmail)) blockers.push('missing_final_email');
  if (!clean(preparedLead.emailSubject || preparedLead.subject)) blockers.push('missing_email_subject');
  if (!clean(preparedLead.emailBody || preparedLead.message)) blockers.push('missing_email_body');
  if (!clean(preparedLead.mainIssue)) blockers.push('missing_main_issue');
  if (!isSafeReportPageUrl(preparedLead.reportUrl)) blockers.push('unsafe_report_url');
  if (!clean(preparedLead.reportToken)) blockers.push('missing_report_token');
  if (!clean(preparedLead.pdfFileId)) blockers.push('missing_pdf_file_id');
  if (!isFutureIsoDate(preparedLead.pdfExpiresAt)) blockers.push('missing_or_expired_pdf_expires_at');
  if (!isSafePdfStorageUrl(preparedLead.pdfViewUrl) && !isSafePdfStorageUrl(preparedLead.pdfDownloadUrl)) blockers.push('missing_safe_pdf_url');

  return {
    ok: blockers.length === 0,
    blockers,
  };
}

function sheetExportUrl(req: Request): string {
  const url = new URL(req.url);
  url.pathname = '/api/export/sheet';
  url.search = '';
  return url.toString();
}

async function writePreparedLeadToSheet(req: Request, preparedLead: AnyRecord) {
  const readiness = validatePreparedLeadForSheet(preparedLead);
  if (!readiness.ok) {
    throw new Error(`Prepared lead is not Sheet-ready: ${readiness.blockers.join(', ')}`);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sheetSecret = clean(process.env.SHEET_API_SECRET || '');
  if (sheetSecret) {
    headers['x-sheet-secret'] = sheetSecret;
  } else if (isProductionRuntime()) {
    throw new Error('Missing SHEET_API_SECRET. Production Sheet sync must fail closed.');
  }

  const response = await fetch(sheetExportUrl(req), {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      leads: [preparedLead],
      requireReportExport: true,
      source: 'drive_reports_route_sheet_sync',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || `Google Sheet update failed (${response.status}).`);
  }

  return data;
}

async function deleteDriveFileSilently(fileId: string) {
  if (!fileId) return;
  if (String(process.env.DELETE_ORPHAN_DRIVE_PDF_ON_REGISTER_FAIL || 'true').toLowerCase() === 'false') return;
  try {
    const drive = getOAuthDriveClient();
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (error) {
    console.warn('Could not delete orphan Drive PDF after export failure:', error);
  }
}


export async function GET(req: Request) {
  try {
    requireDriveReportSecret(req);

    const url = new URL(req.url);
    const deep = ['1', 'true', 'yes'].includes(String(url.searchParams.get('deep') || '').toLowerCase());
    const exportGate = isDriveReportExportAllowedHere();

    const checks: HealthCheckResult[] = [
      makeCheck(
        'runtime_gate',
        exportGate.allowed ? 'ok' : 'warning',
        exportGate.reason,
        {
          nodeEnv: process.env.NODE_ENV || '',
          vercelEnv: process.env.VERCEL_ENV || '',
          production: isProductionRuntime(),
          allowProductionExport: boolEnv('ALLOW_DRIVE_REPORT_EXPORT_IN_PRODUCTION', false),
        },
      ),
      checkRequiredEnv(),
      await checkReportRegisterEndpoint(deep),
      checkSheetConfig(),
    ];

    if (deep) {
      checks.push(await checkPythonAuditHealth());
      checks.push(...(await checkGoogleDriveAccess()));
    } else {
      checks.push(
        makeCheck(
          'deep_checks',
          'skipped',
          'Deep network checks skipped. Call this endpoint with ?deep=true to test Python API and Google Drive OAuth.',
        ),
      );
    }

    const hasError = checks.some((check) => check.status === 'error');
    const hasWarning = checks.some((check) => check.status === 'warning');

    return json(
      {
        success: !hasError,
        service: 'trackflow-drive-report-export',
        mode: deep ? 'deep' : 'config',
        status: hasError ? 'error' : hasWarning ? 'warning' : 'ok',
        exportAllowed: exportGate.allowed,
        exportGate: exportGate.reason,
        pythonBaseUrl: pythonBaseUrl(),
        registerUrl: (() => {
          try {
            return buildRegisterUrl();
          } catch {
            return '';
          }
        })(),
        checks,
        checkedAt: new Date().toISOString(),
      },
      hasError ? 500 : 200,
    );
  } catch (error) {
    const message = errorMessage(error, 'Drive report export health check failed.');
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return json({ success: false, status: 'error', error: message }, status);
  }
}


export async function POST(req: Request) {
  try {
    requireDriveReportSecret(req);
    assertDriveReportExportRuntimeAllowed();

    const body = await req.json().catch(() => ({}));
    const lead = (body?.lead || {}) as AnyRecord;
    const audit = (body?.audit || lead?.audit || {}) as AnyRecord;

    if (!audit || Object.keys(audit).length === 0) {
      return json({ success: false, error: 'Audit data is required before creating a Drive report.' }, 400);
    }

    const auditId = getAuditId(audit);
    const websiteUrl = getWebsiteUrl(lead, audit);
    const domain = normalizeDomain(lead?.domain || audit?.domain || websiteUrl);
    const companyName = getCompanyName(lead, audit, domain);
    const finalEmail = getFinalEmail(lead, audit);
    const pdfUrl = toAbsolutePythonPdfUrl(body?.auditPdfUrl || audit?.evidence?.pdf_url || audit?.pdf_url, auditId);

    if (!domain) {
      return json({ success: false, error: 'Domain/website URL is required to create the report.' }, 400);
    }

    const shouldWriteToSheet = body?.writeToSheet !== false;
    const skipDriveUploadIfReady = body?.skipDriveUploadIfReady !== false;
    const existingFields = getExistingReportFields(lead, audit);
    const manualAdsTransparency = normalizeManualAdsTransparency(body, lead, audit);
    const manualAdsFields = manualAdsTransparencyFlatFields(manualAdsTransparency);
    const ctaInteraction = normalizeCtaInteractionTest(body, lead, audit);
    const ctaFields = ctaInteractionFlatFields(ctaInteraction);

    if (shouldWriteToSheet && !finalEmail) {
      return json({ success: false, error: 'Final email is required before syncing a report lead to Google Sheet.' }, 400);
    }

    if (skipDriveUploadIfReady && isReportReadyForSheet(existingFields) && !hasManualAdsTransparencyContext(manualAdsTransparency) && !hasCtaInteractionContext(ctaInteraction)) {
      const preparedLead = buildPreparedLeadForSheet(lead, audit, existingFields);
      const sheet = shouldWriteToSheet ? await writePreparedLeadToSheet(req, preparedLead) : null;

      return json({
        success: true,
        reusedExistingReport: true,
        uploadedAt: new Date().toISOString(),
        reportToken: existingFields.reportToken,
        reportUrl: existingFields.reportUrl,
        pdfFileId: existingFields.pdfFileId,
        pdfViewUrl: existingFields.pdfViewUrl,
        pdfDownloadUrl: existingFields.pdfDownloadUrl,
        pdfExpiresAt: existingFields.pdfExpiresAt,
        sheetUpdated: Boolean(sheet),
        sheet,
        report: {
          reportToken: existingFields.reportToken,
          token: existingFields.reportToken,
          reportUrl: existingFields.reportUrl,
          pdfFileId: existingFields.pdfFileId,
          pdfViewUrl: existingFields.pdfViewUrl,
          pdfDownloadUrl: existingFields.pdfDownloadUrl,
          pdfExpiresAt: existingFields.pdfExpiresAt,
        },
      });
    }

    let drive: DriveUploadResult | null = null;
    let registered: AnyRecord | null = null;

    try {
      const pdfBuffer = await fetchPdfBuffer(pdfUrl);
      drive = await upsertPdfToDrive(pdfBuffer, buildPdfFileName(companyName, domain), existingFields.pdfFileId);

      const expiresAt =
        clean(body?.pdfExpiresAt || lead?.pdfExpiresAt || audit?.pdfExpiresAt || audit?.exports?.pdfExpiresAt) ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const mainFinding = getMainFinding(lead, audit);
      const businessImpact = getBusinessImpact(lead, audit);
      const proofPoints = getProofPoints(lead, audit);
      const recommendations = getRecommendations(lead, audit);
      const privateReportCopy = getPrivateReportCopy(audit);
      const privateProofPoints = normalizePrivateStringArray(privateReportCopy.proofPoints || privateReportCopy.proof_points, proofPoints, 6);
      const privateWhatChecked = normalizePrivateStringArray(privateReportCopy.whatChecked || privateReportCopy.what_checked || privateReportCopy.checks, [], 6);
      const privateSnapshotQuestions = normalizePrivateStringArray(
        privateReportCopy.auditSnapshotQuestions || privateReportCopy.audit_snapshot_questions || privateReportCopy.snapshotQuestions,
        [],
        3,
      );
      const privateTrustNotes = normalizePrivateStringArray(privateReportCopy.trustNotes || privateReportCopy.trust_notes || privateReportCopy.trustSignals, [], 3);
      const privateHowToReadParagraphs = normalizePrivateStringArray(
        privateReportCopy.howToReadParagraphs || privateReportCopy.how_to_read_paragraphs || privateReportCopy.howToReadThisReview,
        [],
        3,
      );
      const privateRecommendations = normalizePrivateRecommendations(privateReportCopy.recommendations || privateReportCopy.recommendedFixPlan, recommendations, 4);
      const reportPrivateReportCopy = {
        ...privateReportCopy,
        ...(hasManualAdsTransparencyContext(manualAdsTransparency) ? manualAdsFields : {}),
        ...(hasCtaInteractionContext(ctaInteraction) ? ctaFields : {}),
      };
      const privateProblemCards = Array.isArray(reportPrivateReportCopy.problemCards)
        ? reportPrivateReportCopy.problemCards
        : Array.isArray(reportPrivateReportCopy.businessProblems)
          ? reportPrivateReportCopy.businessProblems
          : [];
      const privateVerificationPlan = Array.isArray(reportPrivateReportCopy.verificationPlan)
        ? reportPrivateReportCopy.verificationPlan
        : Array.isArray(reportPrivateReportCopy.recommendedFixPlan)
          ? reportPrivateReportCopy.recommendedFixPlan
          : privateRecommendations;
      const privateWebsiteSpeed =
        reportPrivateReportCopy.websiteSpeed ||
        audit?.websiteSpeed ||
        audit?.website_speed ||
        audit?.speed ||
        null;
      const emailSubject = getEmailSubject(lead, audit, companyName);
      const previewEmailBody = buildAuditEmailBody({
        lead,
        audit,
        companyName,
        websiteUrl,
        mainFinding,
        businessImpact,
        proofPoints,
        reportUrl: '', // final report URL is returned by the register API; Sheet payload below receives the final URL.
      });

      const reportPayload = {
        domain,
        websiteUrl,
        companyName,
        businessName: companyName,
        email: finalEmail,
        finalEmail,
        ...manualAdsFields,
        ...ctaFields,
        token: existingFields.reportToken || undefined,
        reportToken: existingFields.reportToken || undefined,
        headline: cleanPrivateText(privateReportCopy.headline || privateReportCopy.privatePageHeadline || getHeadline(lead, audit), getHeadline(lead, audit), 160),
        subheadline: cleanPrivateText(privateReportCopy.subheadline || privateReportCopy.privatePageSubheadline || privateReportCopy.privatePageSummary, '', 280),
        mainFinding: cleanPrivateText(privateReportCopy.mainFinding || mainFinding, mainFinding, 280),
        mainIssue: cleanPrivateText(privateReportCopy.mainFinding || mainFinding, mainFinding, 280),
        businessImpact: cleanPrivateText(privateReportCopy.businessImpact || businessImpact, businessImpact, 360),
        proofPoints: privateProofPoints,
        recommendations: privateRecommendations,
        problemCards: privateProblemCards,
        businessProblems: privateProblemCards,
        verificationPlan: privateVerificationPlan,
        websiteSpeed: privateWebsiteSpeed,
        whatChecked: privateWhatChecked,
        auditSnapshotTitle: cleanPrivateText(privateReportCopy.auditSnapshotTitle || 'What this review is designed to clarify', 'What this review is designed to clarify', 120),
        auditSnapshotQuestions: privateSnapshotQuestions,
        trustNotes: privateTrustNotes,
        howToReadTitle: cleanPrivateText(privateReportCopy.howToReadTitle || 'How to read this review', 'How to read this review', 90),
        howToReadParagraphs: privateHowToReadParagraphs,
        ctaHeadline: cleanPrivateText(privateReportCopy.ctaHeadline || 'Want this verified inside your actual accounts?', 'Want this verified inside your actual accounts?', 160),
        privateReportCopy: reportPrivateReportCopy,
        private_report_copy: reportPrivateReportCopy,
        privateReportVersion: cleanPrivateText(privateReportCopy.privateReportVersion || privateReportCopy.version || '', '', 80),
        emailSubject,
        emailBody: previewEmailBody,
        pdfFileId: drive.fileId,
        driveFileId: drive.fileId,
        pdfViewUrl: drive.viewUrl,
        driveViewUrl: drive.viewUrl,
        pdfDownloadUrl: drive.downloadUrl,
        driveDownloadUrl: drive.downloadUrl,
        pdfExpiresAt: expiresAt,
        source: clean(body?.source || 'local_audit_drive_report_export'),
        leadId: clean(lead?.leadId || lead?.firestoreLeadId || lead?.id || ''),
        sheetRowNumber: Number(lead?.sheetRowNumber || lead?.rowNumber || 0) || undefined,
        contactEmail: clean(body?.contactEmail || lead?.contactEmail || audit?.contact_email || audit?.agency_email || ''),
        ctaText: cleanPrivateText(body?.ctaText || lead?.ctaText || privateReportCopy.ctaText || audit?.cta_text || 'Book a tracking review', 'Book a tracking review', 80),
        ctaUrl: clean(body?.ctaUrl || lead?.ctaUrl || privateReportCopy.ctaUrl || audit?.cta_url || '/contact'),
      };

     const registeredResult = await registerSecureReport(reportPayload);
registered = registeredResult;

const registeredReport: AnyRecord =
  registeredResult.report && typeof registeredResult.report === 'object'
    ? registeredResult.report
    : {};

const reportToken = clean(
  registeredResult.reportToken ??
    registeredResult.token ??
    registeredReport.reportToken ??
    registeredReport.token ??
    '',
);

const reportUrl = clean(registeredResult.reportUrl ?? registeredReport.reportUrl ?? '');

      if (!reportUrl || !reportToken) {
        throw new Error('Secure report registration succeeded but did not return reportUrl/reportToken.');
      }

      if (!isSafeReportPageUrl(reportUrl)) {
        throw new Error('Secure report registration returned an unsafe report URL. Expected branded /r/{token} page.');
      }

      const fields: ReportFields = {
        reportToken,
        reportUrl,
        pdfFileId: drive.fileId,
        pdfViewUrl: drive.viewUrl,
        pdfDownloadUrl: drive.downloadUrl,
        pdfExpiresAt: expiresAt,
      };

      const preparedLead = buildPreparedLeadForSheet(lead, audit, fields);
      const sheet = shouldWriteToSheet ? await writePreparedLeadToSheet(req, preparedLead) : null;

      return json({
        success: true,
        uploadedAt: new Date().toISOString(),
        reportToken,
        reportUrl,
        pdfFileId: drive.fileId,
        pdfViewUrl: drive.viewUrl,
        pdfDownloadUrl: drive.downloadUrl,
        pdfExpiresAt: expiresAt,
        sheetUpdated: Boolean(sheet),
        sheet,
        drive,
        report: {
          reportToken,
          token: reportToken,
          reportUrl,
          pdfFileId: drive.fileId,
          pdfViewUrl: drive.viewUrl,
          pdfDownloadUrl: drive.downloadUrl,
          pdfExpiresAt: expiresAt,
        },
      });
    } catch (error) {
      // If the PDF uploaded but the secure report registration failed, remove the orphan file.
      // If registration succeeded but Sheet failed, keep the PDF because the secure report page may already exist.
      if (drive?.fileId && !registered) {
        await deleteDriveFileSilently(drive.fileId);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Drive report export error:', error);
    const message = clean(error?.message || 'Drive report export failed.');
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return json({ success: false, error: message }, status);
  }
}
