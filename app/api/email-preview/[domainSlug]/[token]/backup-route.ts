import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  buildEmailPreviewImageB2Key,
  readB2Object,
  sanitizeB2Key,
} from '@/lib/trackflow-storage/b2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnyRecord = Record<string, any>;
type RouteParams =
  | { domainSlug?: string; token?: string }
  | Promise<{ domainSlug?: string; token?: string }>;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
]);
const MAX_EMAIL_PREVIEW_BYTES = 6 * 1024 * 1024;

function clean(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeToken(value: unknown): string {
  return clean(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
}

function normalizeSlug(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}

function firstCleanString(...values: unknown[]): string {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return '';
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function normalizeMimeType(value: unknown): string {
  const mime = clean(value).toLowerCase();
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

function isSafeEmailPreviewB2Key(key: string, token: string): boolean {
  const normalized = clean(key)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
  if (!normalized || normalized.includes('..')) return false;
  if (!normalized.startsWith('reports/')) return false;
  return normalized.includes(`/${token}/email-preview/`);
}

function resolveEmailPreviewAsset(report: AnyRecord): AnyRecord {
  return asRecord(
    report.emailPreviewImage ||
      report.email_preview_image ||
      report.privateReportCopy?.emailPreviewImage ||
      report.privateReportCopy?.email_preview_image ||
      report.private_report_copy?.emailPreviewImage ||
      report.private_report_copy?.email_preview_image,
  );
}

function getStoredB2Key(report: AnyRecord, asset: AnyRecord): string {
  return firstCleanString(
    asset.b2Key,
    asset.b2_key,
    report.emailPreviewImageB2Key,
    report.email_preview_image_b2_key,
    report.privateReportCopy?.emailPreviewImageB2Key,
    report.privateReportCopy?.email_preview_image_b2_key,
    report.private_report_copy?.emailPreviewImageB2Key,
    report.private_report_copy?.email_preview_image_b2_key,
  );
}

function getStoredMimeType(report: AnyRecord, asset: AnyRecord): string {
  return normalizeMimeType(
    firstCleanString(
      asset.mimeType,
      asset.mime_type,
      report.emailPreviewImageMimeType,
      report.email_preview_image_mime_type,
      report.privateReportCopy?.emailPreviewImageMimeType,
      report.privateReportCopy?.email_preview_image_mime_type,
      report.private_report_copy?.emailPreviewImageMimeType,
      report.private_report_copy?.email_preview_image_mime_type,
      'image/webp',
    ),
  );
}

function jsonError(message: string, status = 404) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isMissingObjectError(error: unknown): boolean {
  const message = clean(error instanceof Error ? error.message : error).toLowerCase();
  return (
    message.includes('(404)') ||
    message.includes('nosuchkey') ||
    message.includes('not found') ||
    message.includes('file_not_present')
  );
}

function buildCandidateKeys(input: {
  report: AnyRecord;
  asset: AnyRecord;
  token: string;
  domainSlug: string;
}): string[] {
  const candidates: string[] = [];
  const add = (value: unknown) => {
    const key = clean(value).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
    if (!key || !isSafeEmailPreviewB2Key(key, input.token) || candidates.includes(key)) return;
    candidates.push(key);
  };

  add(getStoredB2Key(input.report, input.asset));

  // Recovery path for older Firestore documents where the branded URL was saved
  // but the B2 key metadata was not. These keys are deterministic and remain
  // strictly scoped to reports/{slug}/{token}/email-preview/.
  const storedMime = getStoredMimeType(input.report, input.asset);
  const mimeCandidates = [storedMime, 'image/webp', 'image/png', 'image/jpeg'];
  for (const mimeType of mimeCandidates) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) continue;
    const fileName = mimeType === 'image/webp'
      ? 'email-preview-thumbnail.webp'
      : mimeType === 'image/png'
        ? 'email-preview-thumbnail.png'
        : 'email-preview-thumbnail.jpg';
    add(
      buildEmailPreviewImageB2Key({
        domainSlug: input.domainSlug,
        token: input.token,
        fileName,
        contentType: mimeType,
      }),
    );
  }

  return candidates;
}

async function servePreview(
  req: Request,
  context: { params: RouteParams },
  headOnly = false,
) {
  const params = await context.params;
  const token = normalizeToken(params?.token);
  const requestedSlug = normalizeSlug(params?.domainSlug || '');

  if (!token || token.length < 12) return jsonError('Invalid preview token.', 404);

  const reportRef = adminDb.collection('audit_reports').doc(token);
  const snapshot = await reportRef.get();
  if (!snapshot.exists) return jsonError('Preview image was not found.', 404);

  const report = asRecord(snapshot.data());
  const reportSlug = normalizeSlug(
    report.domainSlug || report.domain_slug || report.slug || report.domain || report.websiteUrl || '',
  );
  if (requestedSlug && reportSlug && requestedSlug !== reportSlug) {
    return jsonError('Preview image was not found.', 404);
  }

  const storageSlug = reportSlug || requestedSlug || 'website';
  const asset = resolveEmailPreviewAsset(report);
  const candidates = buildCandidateKeys({ report, asset, token, domainSlug: storageSlug });
  if (!candidates.length) return jsonError('Preview image is not available.', 404);

  let selectedKey = '';
  let object: Awaited<ReturnType<typeof readB2Object>> | null = null;

  for (const key of candidates) {
    try {
      object = await readB2Object(sanitizeB2Key(key));
      selectedKey = key;
      break;
    } catch (error) {
      if (isMissingObjectError(error)) continue;
      console.error('[EMAIL_PREVIEW_B2_READ_FAILED]', {
        tokenTail: token.slice(-8),
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return jsonError('Preview image could not be loaded.', 502);
    }
  }

  if (!object || !selectedKey) return jsonError('Preview image is not available.', 404);

  const storedMimeType = getStoredMimeType(report, asset);
  const objectMimeType = normalizeMimeType(object.contentType);
  const contentType = ALLOWED_IMAGE_MIME_TYPES.has(objectMimeType)
    ? objectMimeType
    : storedMimeType;

  if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
    return jsonError('Preview image type is not allowed.', 415);
  }
  if (!object.buffer?.byteLength || object.buffer.byteLength > MAX_EMAIL_PREVIEW_BYTES) {
    return jsonError('Preview image size is not allowed.', 415);
  }

  const canonicalUrl = new URL(req.url);
  canonicalUrl.search = '';
  const healedAsset = {
    ...asset,
    id: firstCleanString(asset.id, 'email_preview_thumbnail'),
    role: firstCleanString(asset.role, 'email_preview_thumbnail'),
    caption: firstCleanString(asset.caption, 'Clickable email preview thumbnail'),
    fileName: firstCleanString(asset.fileName, asset.file_name, selectedKey.split('/').pop(), 'email-preview-thumbnail.webp'),
    file_name: firstCleanString(asset.fileName, asset.file_name, selectedKey.split('/').pop(), 'email-preview-thumbnail.webp'),
    mimeType: contentType,
    mime_type: contentType,
    sizeBytes: object.buffer.byteLength,
    size_bytes: object.buffer.byteLength,
    storageProvider: 'backblaze_b2',
    storage_provider: 'backblaze_b2',
    b2Key: selectedKey,
    b2_key: selectedKey,
    publicUrl: canonicalUrl.toString(),
    public_url: canonicalUrl.toString(),
    redacted: asset.redacted !== false,
  };

  const storedKey = getStoredB2Key(report, asset);
  if (storedKey !== selectedKey || !report.emailPreviewImageB2Key) {
    try {
      await reportRef.set(
        {
          emailPreviewImage: healedAsset,
          email_preview_image: healedAsset,
          emailPreviewImageUrl: canonicalUrl.toString(),
          email_preview_image_url: canonicalUrl.toString(),
          emailPreviewImageWebpUrl: contentType === 'image/webp' ? canonicalUrl.toString() : '',
          email_preview_image_webp_url: contentType === 'image/webp' ? canonicalUrl.toString() : '',
          emailPreviewImageB2Key: selectedKey,
          email_preview_image_b2_key: selectedKey,
          emailPreviewImageMimeType: contentType,
          email_preview_image_mime_type: contentType,
          emailPreviewImageSizeBytes: object.buffer.byteLength,
          email_preview_image_size_bytes: object.buffer.byteLength,
          emailPreviewImageUpdatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      // Serving the image is more important than metadata repair. Keep this non-fatal.
      console.warn('[EMAIL_PREVIEW_FIRESTORE_SELF_HEAL_FAILED]', {
        tokenTail: token.slice(-8),
        key: selectedKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const etag = object.etag ? `"${object.etag.replace(/"/g, '')}"` : '';
  const ifNoneMatch = req.headers.get('if-none-match');
  if (etag && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Length': String(object.buffer.byteLength),
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'X-Content-Type-Options': 'nosniff',
    ...(etag ? { ETag: etag } : {}),
  };

  if (headOnly) return new Response(null, { status: 200, headers });

  const responseBody = new ArrayBuffer(object.buffer.byteLength);
  new Uint8Array(responseBody).set(object.buffer);
  return new Response(responseBody, { status: 200, headers });
}

export async function GET(req: Request, context: { params: RouteParams }) {
  return servePreview(req, context, false);
}

export async function HEAD(req: Request, context: { params: RouteParams }) {
  return servePreview(req, context, true);
}
