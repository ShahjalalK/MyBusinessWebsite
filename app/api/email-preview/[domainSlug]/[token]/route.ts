import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { readB2Object, sanitizeB2Key } from '@/lib/trackflow-storage/b2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnyRecord = Record<string, any>;

type RouteParams =
  | { domainSlug?: string; token?: string }
  | Promise<{ domainSlug?: string; token?: string }>;

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif']);
const MAX_EMAIL_PREVIEW_BYTES = 6 * 1024 * 1024;

function clean(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeToken(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 96);
}

function normalizeSlug(value: unknown): string {
  return clean(value)
    .toLowerCase()
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
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function isSafeEmailPreviewB2Key(key: string, token: string): boolean {
  const normalized = clean(key).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
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

function getEmailPreviewB2Key(report: AnyRecord, asset: AnyRecord): string {
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
  return firstCleanString(
    asset.mimeType,
    asset.mime_type,
    report.emailPreviewImageMimeType,
    report.email_preview_image_mime_type,
    report.privateReportCopy?.emailPreviewImageMimeType,
    report.privateReportCopy?.email_preview_image_mime_type,
    report.private_report_copy?.emailPreviewImageMimeType,
    report.private_report_copy?.email_preview_image_mime_type,
    'image/webp',
  ).toLowerCase();
}

function jsonError(message: string, status = 404) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(
  req: Request,
  context: { params: RouteParams },
) {
  const params = await context.params;
  const token = normalizeToken(params?.token);
  const requestedSlug = normalizeSlug(params?.domainSlug || '');

  if (!token || token.length < 12) return jsonError('Invalid preview token.', 404);

  const snapshot = await adminDb.collection('audit_reports').doc(token).get();
  if (!snapshot.exists) return jsonError('Preview image was not found.', 404);

  const report = asRecord(snapshot.data());
  const reportSlug = normalizeSlug(report.domainSlug || report.domain_slug || report.slug || '');
  if (requestedSlug && reportSlug && requestedSlug !== reportSlug) return jsonError('Preview image was not found.', 404);

  const asset = resolveEmailPreviewAsset(report);
  const rawKey = getEmailPreviewB2Key(report, asset);
  if (!rawKey || !isSafeEmailPreviewB2Key(rawKey, token)) return jsonError('Preview image is not available.', 404);

  const object = await readB2Object(sanitizeB2Key(rawKey));
  const storedMimeType = getStoredMimeType(report, asset);
  const contentType = ALLOWED_IMAGE_MIME_TYPES.has(storedMimeType)
    ? storedMimeType === 'image/jpg'
      ? 'image/jpeg'
      : storedMimeType
    : object.contentType.toLowerCase();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) return jsonError('Preview image type is not allowed.', 415);
  if (!object.buffer?.byteLength || object.buffer.byteLength > MAX_EMAIL_PREVIEW_BYTES) return jsonError('Preview image size is not allowed.', 415);

  const ifNoneMatch = req.headers.get('if-none-match');
  const etag = object.etag ? `"${object.etag.replace(/"/g, '')}"` : '';
  if (etag && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  }

  return new Response(object.buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(object.buffer.byteLength),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
      ...(etag ? { ETag: etag } : {}),
    },
  });
}
