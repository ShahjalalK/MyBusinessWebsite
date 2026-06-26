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
    videoUrl: watchUrl,
    youtubeUrl: watchUrl,
    embedUrl,
    embedProvider: "youtube_nocookie",
    addedAt: firstCleanString(raw.addedAt, raw.added_at, body.evidenceVideoAddedAt, body.evidence_video_added_at),
    optional: true,
  };
}

function normalizeEvidenceAssetRole(value: any, fallback = "browser_side_proof"): string {
  const role = firstCleanString(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return role || fallback;
}

function normalizeSecurePageEvidenceAsset(item: any, index = 0): AnyRecord | null {
  const raw = getObjectCandidate(item);
  if (!Object.keys(raw).length) return null;

  // Do not allow raw images/base64 into Firestore. Only stored-asset metadata is kept.
  const b2Key = firstCleanString(raw.b2Key, raw.b2_key, raw.storageKey, raw.storage_key, raw.key);
  if (!b2Key) return null;

  const id = firstCleanString(raw.id, raw.assetId, raw.asset_id, `asset_${index + 1}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96) || `asset_${index + 1}`;
  const role = normalizeEvidenceAssetRole(raw.role || raw.kind || raw.type || raw.slot);
  const fileName = firstCleanString(raw.fileName, raw.file_name, raw.name, "secure-page-evidence.png").replace(/[\r\n"]/g, "").slice(0, 180);
  const mimeType = firstCleanString(raw.mimeType, raw.mime_type, raw.contentType, raw.content_type, "image/png").toLowerCase().slice(0, 80);
  const sizeBytes = Number(raw.sizeBytes || raw.size_bytes || raw.size || raw.contentLength || raw.content_length || 0) || 0;
  const pageUrl = sanitizeOptionalUrl(firstCleanString(raw.pageUrl, raw.page_url, raw.url, raw.testUrl, raw.test_url));
  const caption = firstCleanString(raw.caption, raw.title, raw.label, "Browser-side evidence screenshot").replace(/\s+/g, " " ).slice(0, 240);
  const source = firstCleanString(raw.source, "manual_secure_page_evidence_upload").replace(/\s+/g, " " ).slice(0, 120);
  const bucket = firstCleanString(raw.b2Bucket, raw.b2_bucket, raw.bucket);

  return {
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
    source,
    storageProvider: firstCleanString(raw.storageProvider, raw.storage_provider, "backblaze_b2"),
    storage_provider: firstCleanString(raw.storageProvider, raw.storage_provider, "backblaze_b2"),
    b2Bucket: bucket,
    b2_bucket: bucket,
    b2Key,
    b2_key: b2Key,
    etag: firstCleanString(raw.etag, raw.eTag, raw.b2Etag, raw.b2_etag),
    uploadedAt: firstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at),
    uploaded_at: firstCleanString(raw.uploadedAt, raw.uploaded_at, raw.createdAt, raw.created_at),
    redacted: raw.redacted !== false,
    displayOrder: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
    display_order: Number(raw.displayOrder || raw.display_order || index + 1) || index + 1,
    publicUrl: sanitizeOptionalUrl(firstCleanString(raw.publicUrl, raw.public_url, raw.proxyUrl, raw.proxy_url)),
    public_url: sanitizeOptionalUrl(firstCleanString(raw.publicUrl, raw.public_url, raw.proxyUrl, raw.proxy_url)),
    note: firstCleanString(raw.note, "Private evidence image metadata only. Rendering can be enabled on the secure page UI separately.").replace(/\s+/g, " " ).slice(0, 260),
  };
}

function normalizeSecurePageEvidenceAssetsPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord[] {
  const rawItems = [
    body.securePageEvidenceAssets,
    body.secure_page_evidence_assets,
    body.secureEvidenceAssets,
    body.secure_evidence_assets,
    privatePage.securePageEvidenceAssets,
    privatePage.secure_page_evidence_assets,
    privatePage.secureEvidenceAssets,
    privatePage.secure_evidence_assets,
  ].find((item) => Array.isArray(item)) as any[] | undefined;

  if (!rawItems?.length) return [];

  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const [index, item] of rawItems.entries()) {
    const asset = normalizeSecurePageEvidenceAsset(item, index);
    if (!asset) continue;
    const key = String(asset.b2Key || asset.b2_key).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(asset);
    // TrackFlow secure evidence currently supports two client-facing proof images:
    // 1) website / selected-action context, and 2) Tag Assistant / browser review.
    // Keep the Firestore metadata payload aligned with that UI so old optional slots
    // do not reappear through alternate register/export paths.
    if (output.length >= 2) break;
  }

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

function publicImageUrlFrom(value: any): string {
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

function firstPublicImageUrl(...values: any[]): string {
  for (const value of values) {
    const url = publicImageUrlFrom(value);
    if (url) return url;
  }
  return "";
}


function normalizeDisplaySentence(value: any, fallback = ""): string {
  return cleanCell(value || fallback)
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function isGenericReportText(value: any): boolean {
  const text = normalizeDisplaySentence(value).toLowerCase();
  if (!text) return true;
  return (
    /lead form, phone, email, booking/.test(text) ||
    /lead form, contact, and enquiry/.test(text) ||
    /lead form tracking snapshot/.test(text) ||
    /form\s*\/\s*phone\s*\/\s*booking/.test(text) ||
    /ga4\s*\/\s*gtm\s*\/\s*google ads/.test(text) ||
    /google ads, ga4, gtm, meta pixel, and first-party\/server-side tracking/.test(text) ||
    /what needs confirmation inside ga4, gtm, google ads, crm, call-tracking, booking-platform, or server logs/.test(text) ||
    /what this review is designed to clarify/.test(text)
  );
}

function titleCaseClientLabel(value: string): string {
  return normalizeDisplaySentence(value)
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      const upper = new Set(["ga4", "gtm", "crm", "ads", "cta", "url", "pdf"]);
      if (upper.has(lower)) return lower.toUpperCase();
      if (["and", "or", "the", "on", "in", "for", "of", "to", "a", "an"].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function cleanActionLabel(value: any): string {
  const text = normalizeDisplaySentence(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b(not sure|auto|unknown|key conversion actions|lead, form, and key cta actions|lead form and key cta actions)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || isGenericReportText(text)) return "";
  if (text.length > 96) return text.slice(0, 96).replace(/\s+\S*$/, "").trim();
  return text;
}

function inferActionLabelFromText(...values: any[]): string {
  const blob = values.map((value) => normalizeDisplaySentence(value)).filter(Boolean).join("\n");
  const patterns = [
    /Primary conversion focus:\s*([^\n.]+?)(?:\s+on\s+the\s+[^\n.]+?\s+page|\s+should|\s+needs|[.\n]|$)/i,
    /focused on\s+(?:the\s+)?([^\n.]+?)(?:\s+journey|\s+on\s+the\s+[^\n.]+?\s+page|[.\n]|$)/i,
    /for\s+([^\n.]+?)\s+journey/i,
    /controlled\s+([^\n.]+?)\s+test/i,
  ];
  for (const pattern of patterns) {
    const match = blob.match(pattern);
    const candidate = cleanActionLabel(match?.[1] || "");
    if (candidate) return candidate;
  }
  return "";
}

function inferPageLabelFromText(...values: any[]): string {
  const blob = values.map((value) => normalizeDisplaySentence(value)).filter(Boolean).join("\n");
  const patterns = [
    /on\s+the\s+([^\n.]+?)\s+page/i,
    /reviewed page:\s*([^\n.]+)/i,
    /page reviewed:\s*([^\n.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = blob.match(pattern);
    const candidate = normalizeDisplaySentence(match?.[1] || "");
    if (candidate && !candidate.includes("http") && candidate.length <= 60) return titleCaseClientLabel(candidate.replace(/\bpage$/i, "").trim()) + " page";
  }
  return "";
}

function normalizeReportUrlLabel(url: string): string {
  const cleanUrl = sanitizeOptionalUrl(url || "");
  if (!cleanUrl) return "";
  try {
    const parsed = new URL(cleanUrl);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return cleanUrl;
  }
}

function normalizeReviewedPages(value: any, fallbackWebsiteUrl = "", primaryPageUrl = "", primaryPageLabel = "", primaryActionLabel = ""): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  const push = (item: AnyRecord) => {
    const url = normalizeReportUrlLabel(firstCleanString(item.url, item.pageUrl, item.page_url, item.href));
    if (!url) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push({
      role: firstCleanString(item.role, item.type, output.length === 0 ? "homepage" : "primary"),
      label: firstCleanString(item.label, item.pageLabel, item.page_label, output.length === 0 ? "Homepage" : primaryPageLabel || "Reviewed page"),
      url,
      ...(firstCleanString(item.actionLabel, item.action_label, primaryActionLabel) ? { actionLabel: firstCleanString(item.actionLabel, item.action_label, primaryActionLabel) } : {}),
    });
  };

  for (const item of rawItems) {
    if (item && typeof item === "object" && !Array.isArray(item)) push(item as AnyRecord);
    else if (typeof item === "string") push({ url: item });
  }

  if (fallbackWebsiteUrl) push({ role: "homepage", label: "Homepage", url: fallbackWebsiteUrl });
  if (primaryPageUrl) push({ role: "primary", label: primaryPageLabel || "Reviewed page", url: primaryPageUrl, actionLabel: primaryActionLabel });

  return output.slice(0, 4);
}

type TrackingSignalStatus = "found" | "observed" | "needs_verification" | "not_confirmed";

function normalizeTrackingSignalCard(label: string, status: TrackingSignalStatus = "observed", detail = ""): AnyRecord {
  return {
    label: normalizeDisplaySentence(label),
    status,
    ...(detail ? { detail: normalizeDisplaySentence(detail) } : {}),
  };
}

function hasSignalCard(cards: AnyRecord[], contains: RegExp): boolean {
  return cards.some((card) => contains.test(String(card.label || "")));
}

function buildTrackingSignalCardsFromText(rawCards: any, ...values: any[]): AnyRecord[] {
  const output: AnyRecord[] = [];
  const seen = new Set<string>();
  const add = (label: string, status: TrackingSignalStatus = "observed", detail = "") => {
    const cleanLabel = normalizeDisplaySentence(label);
    if (!cleanLabel) return;
    const key = cleanLabel.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalizeTrackingSignalCard(cleanLabel, status, detail));
  };

  if (Array.isArray(rawCards)) {
    for (const item of rawCards) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const label = firstCleanString(item.label, item.title, item.name, item.text, item.finding);
        const status = firstCleanString(item.status, item.state, item.type, "observed") as TrackingSignalStatus;
        const detail = firstCleanString(item.detail, item.description, item.summary);
        add(label, ["found", "observed", "needs_verification", "not_confirmed"].includes(status) ? status : "observed", detail);
      } else {
        add(firstCleanString(item), "observed");
      }
    }
  }

  const blob = values
    .map((value) => {
      if (Array.isArray(value)) return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
      if (value && typeof value === "object") return JSON.stringify(value);
      return String(value || "");
    })
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (/\b(gtm|google tag manager)\b[^.\n]*(found|loaded|observed|visible)|tag manager[^.\n]*(found|loaded|observed|visible)/i.test(blob)) add("GTM tag found", "found");
  if (/\bga4\b[^.\n]*(request|event|collect)[^.\n]*(observed|visible|found)|analytics[^.\n]*request[^.\n]*(observed|visible|found)/i.test(blob)) add("GA4 request observed", "observed");
  if (/google ads[^.\n]*(conversion|remarketing)?[^.\n]*request[^.\n]*(observed|visible|found)|google ads[^.\n]*conversion[^.\n]*(observed|visible|found)/i.test(blob)) add("Google Ads conversion request observed", "observed");
  if (/meta pixel[^.\n]*(found|observed|visible)|meta event[^.\n]*(observed|visible|found)/i.test(blob)) add("Meta Pixel found", "found");
  if (/first-party[^.\n]*(tracking-like|tracking|collection)?[^.\n]*request[^.\n]*(observed|visible|found)/i.test(blob)) add("First-party tracking-like request observed", "observed");
  if (/click id[^.\n]*(test)?[^.\n]*(performed|observed|captured)|\bgclid\b|\bgbraid\b|\bwbraid\b/i.test(blob)) add("Click ID persistence test performed", "observed");
  if (/lead-related\s+ga4\s+event[^.\n]*(not clearly|needs|still)|no lead-related ga4 event/i.test(blob)) add("Lead-related GA4 event still needs account-level verification", "needs_verification");
  if (/server-side[^.\n]*(not confirmed|not detected|cannot be proven|needs verification)|server forwarding cannot be proven/i.test(blob)) add("Server-side tracking not confirmed from browser evidence", "not_confirmed");

  const idMatches = Array.from(blob.matchAll(/(?:conversion\/(\d{6,})|conversion id[^\d]{0,24}(\d{6,})|aw-(\d{6,}))/gi));
  const firstId = idMatches.map((match) => match[1] || match[2] || match[3]).find(Boolean);
  if (firstId && hasSignalCard(output, /google ads conversion request/i)) add(`Google Ads conversion ID observed: ${firstId}`, "observed");

  return output.slice(0, 8);
}

function buildActionAwareVerificationPlan(actionLabel: string, pageLabel: string, cards: AnyRecord[]): AnyRecord[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel ? ` on the ${pageLabel}` : "";
  const hasGoogleAds = hasSignalCard(cards, /google ads/i);
  const hasGa4 = hasSignalCard(cards, /ga4/i);
  const hasGtm = hasSignalCard(cards, /gtm/i);
  const plan = [
    `Run one controlled ${action} test${page}.`,
  ];
  if (hasGtm) plan.push("Confirm the same test in GTM Preview.");
  if (hasGa4) plan.push("Check GA4 DebugView for the expected lead-related event.");
  if (hasGoogleAds) plan.push("Review Google Ads conversion diagnostics for the same action.");
  plan.push("Match the test with CRM, email notification, call-tracking, or server records where relevant.");
  return normalizeVerificationPlan(plan, [], 4);
}

function buildActionAwareWhatChecked(actionLabel: string, pageLabel: string, cards: AnyRecord[], existing: string[]): string[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel || "reviewed page";
  const items = [
    `The ${page} ${action} journey.`,
    ...cards.map((card) => String(card.label || "")).filter(Boolean),
    ...existing.filter((item) => item && !isGenericReportText(item)),
    "Browser-visible request evidence and conversion-path context.",
    "Account-level confirmation still needed for final recording.",
  ];
  return normalizeStringArray(items, 8);
}

function buildActionAwareSnapshotQuestions(actionLabel: string, pageLabel: string): string[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel || "reviewed page";
  return [
    `Was the ${action} journey reviewed safely on the ${page}?`,
    "Which tracking signals were visible during the browser-side review?",
    "What should be confirmed inside the actual tracking accounts?",
  ];
}


// TrackFlow Pro v27.63 - Manual evidence secure-page hero support
// This keeps operator-provided manual conversion evidence safe and structured
// for the secure report page. It does not change visitor tracking, PDF storage,
// video tracking, email automation, or cleanup behavior.
type ManualEvidenceNormalizedAction = {
  slot: "primary" | "secondary";
  label: string;
  actionType: string;
  action_type: string;
  tool: string;
  actionCompleted: string;
  action_completed: string;
  ga4EventObserved: string;
  ga4_event_observed: string;
  googleAdsConversionObserved: string;
  google_ads_conversion_observed: string;
  gtmTriggerObserved: string;
  gtm_trigger_observed: string;
  testUrl: string;
  test_url: string;
  expectedEvent: string;
  expected_event: string;
  observedEventName: string;
  observed_event_name: string;
  evidenceNote: string;
  evidence_note: string;
  trackingObserved: boolean;
  tracking_observed: boolean;
};

function normalizeManualEvidenceActionType(value: any, fallback = "form_submission"): string {
  const raw = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

function defaultManualEvidenceLabel(actionType: any): string {
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
  return labels[normalizeManualEvidenceActionType(actionType)] || "Selected Conversion Action";
}

function normalizeManualEvidenceStatus(value: any, fallback = "not_sure"): string {
  const raw = String(value === undefined || value === null || value === "" ? fallback : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliases: Record<string, string> = {
    true: "yes",
    "1": "yes",
    yes_observed: "yes",
    observed: "yes",
    found: "yes",
    fired: "yes",
    confirmed: "yes",
    completed: "yes",
    passed: "yes",
    false: "no",
    "0": "no",
    no_not_observed: "no",
    not_observed: "no",
    not_found: "no",
    not_fired: "no",
    failed: "no",
    unclear: "not_sure",
    not_clear: "not_sure",
    not_sure_unclear: "not_sure",
    unknown: "not_sure",
    maybe: "not_sure",
    untested: "not_tested",
  };
  const normalized = aliases[raw] || raw;
  return ["yes", "no", "not_sure", "not_tested"].includes(normalized) ? normalized : fallback;
}

function manualEvidenceStatusLabel(value: any): string {
  const status = normalizeManualEvidenceStatus(value);
  if (status === "yes") return "Observed";
  if (status === "no") return "Not clearly observed";
  if (status === "not_tested") return "Not tested";
  return "Unclear / needs verification";
}

function defaultManualExpectedEvent(actionType: any): string {
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
  return defaults[normalizeManualEvidenceActionType(actionType)] || "generate_lead";
}

function manualExpectedEventLooksLikeResult(value: any): boolean {
  const text = normalizeDisplaySentence(value).toLowerCase();
  if (!text) return false;
  return /\b(no|not|nothing|none)\b.*\b(event|observed|found|fired|visible)\b|\bpage[_\s-]*view\s+only\b|\bonly\s+page[_\s-]*view\b|\bnot\s+clearly\b|\bno\s+clear\b/i.test(text);
}

function sanitizeManualExpectedObserved(actionType: string, expected: any, observed: any): { expectedEvent: string; observedEventName: string } {
  let expectedEvent = normalizeDisplaySentence(expected).slice(0, 140);
  let observedEventName = normalizeDisplaySentence(observed).slice(0, 180);
  if (manualExpectedEventLooksLikeResult(expectedEvent)) {
    if (!observedEventName) observedEventName = expectedEvent;
    expectedEvent = defaultManualExpectedEvent(actionType);
  }
  if (!expectedEvent) expectedEvent = defaultManualExpectedEvent(actionType);
  return { expectedEvent, observedEventName };
}

function normalizeManualActionEvidence(rawValue: any, slot: "primary" | "secondary", fallbackActionType = "form_submission"): ManualEvidenceNormalizedAction {
  const raw = getObjectCandidate(rawValue);
  const actionType = normalizeManualEvidenceActionType(
    firstCleanString(raw.actionType, raw.action_type, raw.type, raw.action, raw.conversionAction, raw.conversion_action),
    fallbackActionType,
  );
  const label = cleanActionLabel(firstCleanString(raw.label, raw.actionLabel, raw.action_label, raw.name)) || defaultManualEvidenceLabel(actionType);
  const { expectedEvent, observedEventName } = sanitizeManualExpectedObserved(
    actionType,
    firstCleanString(raw.expectedEvent, raw.expected_event, raw.expected, raw.expectedEventName, raw.expected_event_name),
    firstCleanString(raw.observedEventName, raw.observed_event_name, raw.observedEvent, raw.observed_event, raw.eventName, raw.event_name),
  );
  const actionCompleted = normalizeManualEvidenceStatus(firstCleanString(raw.actionCompleted, raw.action_completed, raw.completed), "not_tested");
  const ga4EventObserved = normalizeManualEvidenceStatus(firstCleanString(raw.ga4EventObserved, raw.ga4_event_observed, raw.ga4Event, raw.ga4_event, raw.eventObserved, raw.event_observed), "not_sure");
  const googleAdsConversionObserved = normalizeManualEvidenceStatus(firstCleanString(raw.googleAdsConversionObserved, raw.google_ads_conversion_observed, raw.googleAdsObserved, raw.google_ads_observed, raw.googleAdsConversion, raw.google_ads_conversion), "not_sure");
  const gtmTriggerObserved = normalizeManualEvidenceStatus(firstCleanString(raw.gtmTriggerObserved, raw.gtm_trigger_observed, raw.gtmObserved, raw.gtm_observed, raw.gtmTrigger, raw.gtm_trigger), "not_sure");
  const testUrl = sanitizeOptionalUrl(firstCleanString(raw.testUrl, raw.test_url, raw.url, raw.pageUrl, raw.page_url));
  const evidenceNote = normalizeDisplaySentence(firstCleanString(raw.evidenceNote, raw.evidence_note, raw.operatorNote, raw.operator_note, raw.note, raw.notes)).slice(0, 520);
  const trackingObserved = ga4EventObserved === "yes" || googleAdsConversionObserved === "yes" || gtmTriggerObserved === "yes";

  return {
    slot,
    label,
    actionType,
    action_type: actionType,
    tool: normalizeDisplaySentence(firstCleanString(raw.tool, raw.toolUsed, raw.tool_used, "Tag Assistant")).slice(0, 90),
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

function manualActionHasMeaningfulEvidence(action: ManualEvidenceNormalizedAction, slot: "primary" | "secondary"): boolean {
  if (slot === "primary" && action.actionType) return true;
  if (["yes", "no"].includes(action.actionCompleted)) return true;
  return Boolean(action.testUrl || action.observedEventName || action.evidenceNote);
}

function normalizeManualConversionEvidenceForReport(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
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
    return {
      enabled: false,
      source: "operator_manual_tracking_review",
      primaryAction: {},
      primary_action: {},
      secondaryEnabled: false,
      secondary_enabled: false,
      secondaryAction: {},
      secondary_action: {},
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const primaryRaw = getObjectCandidate(manual.primary_action, manual.primaryAction, manual.primary, manual);
  const primary = normalizeManualActionEvidence(primaryRaw, "primary", firstCleanString(manual.actionType, manual.action_type, "form_submission"));
  const secondaryRaw = getObjectCandidate(manual.secondary_action, manual.secondaryAction, manual.secondary);
  const secondary = normalizeManualActionEvidence(secondaryRaw, "secondary", "phone_call");
  const secondaryEnabled = Boolean(manual.secondary_enabled || manual.secondaryEnabled) && manualActionHasMeaningfulEvidence(secondary, "secondary");
  const enabled = manualActionHasMeaningfulEvidence(primary, "primary") || secondaryEnabled;

  return {
    enabled,
    source: normalizeDisplaySentence(firstCleanString(manual.source, "operator_manual_tracking_review")).slice(0, 90),
    primaryAction: primary,
    primary_action: primary,
    secondaryEnabled,
    secondary_enabled: secondaryEnabled,
    secondaryAction: secondaryEnabled ? secondary : {},
    secondary_action: secondaryEnabled ? secondary : {},
    updatedAt: firstCleanString(manual.updatedAt, manual.updated_at, new Date().toISOString()),
    updated_at: firstCleanString(manual.updatedAt, manual.updated_at, new Date().toISOString()),
  };
}

function manualEvidenceActionPhrase(actionType: string): string {
  if (actionType === "phone_call") return "phone click action";
  if (actionType === "booking_appointment") return "booking journey";
  if (actionType === "add_to_cart") return "add-to-cart action";
  if (actionType === "begin_checkout") return "checkout-start action";
  if (actionType === "purchase") return "purchase / checkout action";
  if (actionType === "email_click") return "email click action";
  if (actionType === "whatsapp_click") return "WhatsApp click action";
  return "contact form action";
}

function manualEvidenceBusinessRiskPhrase(actionType: string): string {
  if (actionType === "phone_call") return "If calls are an important lead source, Google Ads and GA4 may need a clear phone-click or call-tracking conversion signal.";
  if (actionType === "booking_appointment") return "If bookings are the main revenue action, campaigns may need a clear booking, begin-checkout, or lead event to optimize reliably.";
  if (["add_to_cart", "begin_checkout", "purchase"].includes(actionType)) return "If paid traffic depends on ecommerce optimization, the selected cart, checkout, or purchase event should be confirmed before relying on campaign reporting.";
  if (actionType === "email_click") return "If email clicks are a lead source, the event should be confirmed before using it for reporting or campaign optimization.";
  if (actionType === "whatsapp_click") return "If WhatsApp enquiries are a lead source, the click event should be confirmed before using it for reporting or campaign optimization.";
  return "If this form is the main lead source, Google Ads optimization may rely on weaker signals unless the lead event is confirmed inside the tracking accounts.";
}


function normalizeIncomingManualEvidenceHero(rawValue: any): AnyRecord | null {
  const raw = getObjectCandidate(rawValue);
  if (!Object.keys(raw).length || raw.enabled === false) return null;

  const actionType = normalizeManualEvidenceActionType(firstCleanString(raw.actionType, raw.action_type), "form_submission");
  const label = cleanActionLabel(firstCleanString(raw.actionLabel, raw.action_label, raw.label, defaultManualEvidenceLabel(actionType))) || defaultManualEvidenceLabel(actionType);
  const expectedEvent = normalizeDisplaySentence(firstCleanString(raw.expectedEvent, raw.expected_event, defaultManualExpectedEvent(actionType))).slice(0, 140);
  const observedEvent = normalizeDisplaySentence(firstCleanString(raw.observedEvent, raw.observed_event, "Not clearly observed")).slice(0, 180);
  const title = normalizeDisplaySentence(firstCleanString(raw.title, raw.headline, `${label} tracking should be verified`)).slice(0, 180);
  const summary = normalizeDisplaySentence(firstCleanString(
    raw.summary,
    `The selected ${label.toLowerCase()} was reviewed from the browser side. The visible result should still be confirmed inside the actual tracking accounts before making final decisions.`,
  )).slice(0, 520);
  const businessImpact = normalizeDisplaySentence(firstCleanString(raw.businessImpact, raw.business_impact, manualEvidenceBusinessRiskPhrase(actionType))).slice(0, 420);
  const tool = normalizeDisplaySentence(firstCleanString(raw.tool, "Tag Assistant")).slice(0, 90);
  const testUrl = sanitizeOptionalUrl(firstCleanString(raw.testUrl, raw.test_url));
  const operatorNote = normalizeDisplaySentence(firstCleanString(raw.operatorNote, raw.operator_note, raw.note)).slice(0, 520);

  if (!label && !expectedEvent && !observedEvent && !title && !summary) return null;

  return {
    enabled: true,
    source: normalizeDisplaySentence(firstCleanString(raw.source, "operator_manual_tracking_review")).slice(0, 90),
    label,
    actionLabel: label,
    action_label: label,
    actionType,
    action_type: actionType,
    title,
    headline: firstCleanString(raw.headline, title),
    summary,
    verificationMessage: normalizeDisplaySentence(firstCleanString(raw.verificationMessage, raw.verification_message, `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent}. Final account-side confirmation is still required.`)).slice(0, 520),
    verification_message: normalizeDisplaySentence(firstCleanString(raw.verificationMessage, raw.verification_message, `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent}. Final account-side confirmation is still required.`)).slice(0, 520),
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

function buildManualEvidenceHero(manualEvidence: AnyRecord = {}): AnyRecord | null {
  if (!manualEvidence.enabled) return null;
  const primary = getObjectCandidate(manualEvidence.primaryAction, manualEvidence.primary_action);
  const actionType = normalizeManualEvidenceActionType(primary.actionType || primary.action_type, "form_submission");
  const label = cleanActionLabel(primary.label) || defaultManualEvidenceLabel(actionType);
  const actionCompleted = normalizeManualEvidenceStatus(primary.actionCompleted || primary.action_completed, "not_tested");
  const ga4Status = normalizeManualEvidenceStatus(primary.ga4EventObserved || primary.ga4_event_observed, "not_sure");
  const adsStatus = normalizeManualEvidenceStatus(primary.googleAdsConversionObserved || primary.google_ads_conversion_observed, "not_sure");
  const gtmStatus = normalizeManualEvidenceStatus(primary.gtmTriggerObserved || primary.gtm_trigger_observed, "not_sure");
  const expectedEvent = normalizeDisplaySentence(primary.expectedEvent || primary.expected_event || defaultManualExpectedEvent(actionType));
  const observedEvent = normalizeDisplaySentence(primary.observedEventName || primary.observed_event_name || "Not clearly observed");
  const actionWasCompleted = actionCompleted === "yes";
  const conversionNotClear = actionWasCompleted && (adsStatus === "no" || ga4Status === "no" || (!primary.trackingObserved && !primary.tracking_observed));
  const title = conversionNotClear
    ? `${label} expected event was not clearly observed`
    : actionCompleted === "not_tested"
      ? `${label} still needs a controlled verification test`
      : `${label} conversion signal should be verified`;
  const summary = conversionNotClear
    ? `The selected ${manualEvidenceActionPhrase(actionType)} was completed from the browser side. The expected event (${expectedEvent}) was not clearly found during the manual review.`
    : actionCompleted === "not_tested"
      ? `The selected ${manualEvidenceActionPhrase(actionType)} is the main review target, but the action has not been completed in a controlled manual test yet.`
      : `The selected ${manualEvidenceActionPhrase(actionType)} was reviewed from the browser side. The visible result should still be confirmed inside the actual tracking accounts before making final decisions.`;
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
    businessImpact: manualEvidenceBusinessRiskPhrase(actionType),
    expectedEvent,
    expected_event: expectedEvent,
    observedEvent,
    observed_event: observedEvent,
    tool: normalizeDisplaySentence(primary.tool || "Tag Assistant"),
    actionCompleted: manualEvidenceStatusLabel(actionCompleted),
    action_completed: manualEvidenceStatusLabel(actionCompleted),
    ga4Status: manualEvidenceStatusLabel(ga4Status),
    ga4_status: manualEvidenceStatusLabel(ga4Status),
    googleAdsStatus: adsStatus === "yes" ? "Observed (verify conversion label)" : manualEvidenceStatusLabel(adsStatus),
    google_ads_status: adsStatus === "yes" ? "Observed (verify conversion label)" : manualEvidenceStatusLabel(adsStatus),
    gtmStatus: manualEvidenceStatusLabel(gtmStatus),
    gtm_status: manualEvidenceStatusLabel(gtmStatus),
    testUrl: primary.testUrl || primary.test_url || "",
    test_url: primary.testUrl || primary.test_url || "",
    operatorNote: normalizeDisplaySentence(primary.evidenceNote || primary.evidence_note).slice(0, 520),
    operator_note: normalizeDisplaySentence(primary.evidenceNote || primary.evidence_note).slice(0, 520),
    disclaimer: "This is browser-visible manual evidence only. Final recording must be confirmed inside GA4, GTM, Google Ads, CRM, call-tracking, booking engine, or server records.",
    severity: conversionNotClear ? "high" : "medium",
  };
}


function buildManualEvidenceRegisterFields(manualEvidenceHero: AnyRecord | null, params: { websiteUrl: string; whatChecked: string[]; verificationPlan: AnyRecord[] }): AnyRecord | null {
  if (!manualEvidenceHero) return null;

  const actionLabel = cleanActionLabel(firstCleanString(manualEvidenceHero.actionLabel, manualEvidenceHero.action_label, manualEvidenceHero.label, "Selected customer action"));
  const expectedEvent = firstCleanString(manualEvidenceHero.expectedEvent, manualEvidenceHero.expected_event, "generate_lead / form_submit");
  const observedEvent = firstCleanString(manualEvidenceHero.observedEvent, manualEvidenceHero.observed_event, "Not clearly observed");
  const tool = firstCleanString(manualEvidenceHero.tool, "Tag Assistant");
  const testUrl = sanitizeOptionalUrl(firstCleanString(manualEvidenceHero.testUrl, manualEvidenceHero.test_url, params.websiteUrl));
  const pageLabel = testUrl ? "Reviewed page" : "Reviewed page";

  const observedPhrase = observedEvent ? `The observed browser-visible result was ${observedEvent}.` : "The observed browser-visible result was not clearly confirmed.";
  const expectedPhrase = expectedEvent ? `The expected event was ${expectedEvent}.` : "The expected event should be confirmed inside the tracking accounts.";
  const headline = `${actionLabel} tracking should be verified`;
  const mainFinding = `During the manual ${actionLabel} review, ${expectedPhrase} ${observedPhrase}`;
  let businessImpact = firstCleanString(
    manualEvidenceHero.businessImpact,
    `If this ${actionLabel.toLowerCase()} is used for paid traffic or lead reporting, campaign attribution and optimization may be less reliable until the final conversion action is confirmed inside GA4, GTM, Google Ads, CRM, or server records.`,
  );

  const whatChecked = normalizeStringArray([
    `Manual ${actionLabel} review was provided by the operator.`,
    tool ? `Tool used: ${tool}` : "Operator-provided manual evidence was reviewed.",
    expectedEvent ? `Expected event: ${expectedEvent}` : "Expected event should be confirmed.",
    observedEvent ? `Observed event: ${observedEvent}` : "Observed event was not clearly confirmed.",
    testUrl ? `Reviewed page: ${testUrl}` : "Reviewed page conversion-path context.",
    ...(params.whatChecked || []),
  ], 8);

  const auditSnapshotQuestions = normalizeStringArray([
    `Was ${expectedEvent} observed after the ${actionLabel} review?`,
    `Why does the observed result (${observedEvent}) matter for Google Ads reporting?`,
    `What should be checked inside GA4, GTM, and Google Ads for this ${actionLabel}?`,
    "Could this affect optimization if ads are active?",
  ], 4);

  const verificationPlan = [
    {
      priority: "Priority 1",
      title: `Run one controlled ${actionLabel} test on the reviewed page.`,
      description: testUrl ? `Start from ${testUrl} and complete the same customer action once.` : "Complete the same customer action once in a controlled test.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 2",
      title: `Confirm whether ${expectedEvent} appears in GA4 DebugView or GA4 events.`,
      description: "Do not count ordinary page_view only as the selected conversion action.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 3",
      title: `Confirm the matching ${actionLabel} trigger in GTM Preview.`,
      description: "Check whether a matching form, click, booking, cart, checkout, or purchase trigger fires for the selected action.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 4",
      title: "Review Google Ads conversion diagnostics for the same action.",
      description: "Confirm whether a matching lead/conversion action is recording; generic remarketing or page-view activity is not final conversion proof.",
      estimatedEffort: "Short review",
    },
  ];

  return {
    headline,
    mainFinding,
    businessImpact,
    primaryActionLabel: actionLabel,
    primaryPageLabel: pageLabel,
    primaryPageUrl: testUrl,
    auditSnapshotTitle: `${titleCaseClientLabel(actionLabel)} tracking snapshot`,
    auditSnapshotQuestions,
    whatChecked,
    verificationPlan,
  };
}

function buildReportAwareSecureFields(params: {
  body: AnyRecord;
  privatePage: AnyRecord;
  websiteUrl: string;
  mainFinding: string;
  businessImpact: string;
  proofPoints: string[];
  whatChecked: string[];
  auditSnapshotQuestions: string[];
  verificationPlan: AnyRecord[];
  problemCards: AnyRecord[];
}): AnyRecord {
  const { body, privatePage } = params;
  const sourceBlob = [
    params.mainFinding,
    params.businessImpact,
    ...(params.proofPoints || []),
    ...(params.whatChecked || []),
    ...(params.auditSnapshotQuestions || []),
    ...(params.verificationPlan || []).map((item) => JSON.stringify(item)),
    ...(params.problemCards || []).map((item) => JSON.stringify(item)),
  ];
  const actionLabel = cleanActionLabel(firstCleanString(
    body.primaryActionLabel,
    body.primary_action_label,
    body.customConversionLabel,
    body.custom_conversion_label,
    body.conversionActionLabel,
    body.conversion_action_label,
    body.primaryConversionLabel,
    body.primary_conversion_label,
    body.primaryConversionAction,
    body.primary_conversion_action,
    body.conversionActionContext,
    body.conversion_action_context,
    privatePage.primaryActionLabel,
    privatePage.primary_action_label,
    privatePage.primaryConversionLabel,
    privatePage.primary_conversion_label,
    privatePage.primaryConversion,
    privatePage.primary_conversion,
  )) || inferActionLabelFromText(...sourceBlob);

  const pageLabel = firstCleanString(
    body.primaryPageLabel,
    body.primary_page_label,
    body.targetPageLabel,
    body.target_page_label,
    privatePage.primaryPageLabel,
    privatePage.primary_page_label,
    privatePage.selectedPageLabel,
    privatePage.selected_page_label,
    inferPageLabelFromText(...sourceBlob),
  );

  const primaryPageUrl = normalizeReportUrlLabel(firstCleanString(
    body.primaryPageUrl,
    body.primary_page_url,
    body.priorityPageUrl,
    body.priority_page_url,
    body.selectedPageUrl,
    body.selected_page_url,
    privatePage.primaryPageUrl,
    privatePage.primary_page_url,
    privatePage.selectedPageUrl,
    privatePage.selected_page_url,
  ));

  const trackingSignalCards = buildTrackingSignalCardsFromText(
    body.trackingSignalCards || body.tracking_signal_cards || privatePage.trackingSignalCards || privatePage.tracking_signal_cards,
    ...sourceBlob,
  );

  const reviewedPageUrls = normalizeReviewedPages(
    body.reviewedPageUrls || body.reviewed_page_urls || privatePage.reviewedPageUrls || privatePage.reviewed_page_urls,
    params.websiteUrl,
    primaryPageUrl,
    pageLabel,
    actionLabel,
  );

  const cleanedWhatChecked = buildActionAwareWhatChecked(actionLabel, pageLabel, trackingSignalCards, params.whatChecked || []);
  const cleanedQuestions = (params.auditSnapshotQuestions || []).filter((item) => !isGenericReportText(item));
  const auditSnapshotQuestions = cleanedQuestions.length >= 2 ? cleanedQuestions.slice(0, 3) : buildActionAwareSnapshotQuestions(actionLabel, pageLabel);
  const needsPlan = !(params.verificationPlan || []).length || (params.verificationPlan || []).every((item) => isGenericReportText(item?.title || item?.description || item));
  const verificationPlan = needsPlan ? buildActionAwareVerificationPlan(actionLabel, pageLabel, trackingSignalCards) : params.verificationPlan;
  const auditSnapshotTitle = firstCleanString(
    privatePage.auditSnapshotTitle && !isGenericReportText(privatePage.auditSnapshotTitle) ? privatePage.auditSnapshotTitle : "",
    body.auditSnapshotTitle && !isGenericReportText(body.auditSnapshotTitle) ? body.auditSnapshotTitle : "",
    actionLabel ? `${titleCaseClientLabel(actionLabel)} tracking snapshot` : "Tracking review snapshot",
  );

  return {
    primaryActionLabel: actionLabel,
    primaryPageLabel: pageLabel,
    primaryPageUrl,
    reviewedPageUrls,
    trackingSignalCards,
    whatChecked: cleanedWhatChecked,
    auditSnapshotTitle,
    auditSnapshotQuestions,
    verificationPlan,
  };
}


type ReportSourceType = "search" | "linkedin" | "manual" | "unknown";
type ReportOutreachChannel = "email" | "linkedin" | "manual" | "unknown";

function cleanLowerString(...values: any[]): string {
  return firstCleanString(...values).toLowerCase();
}

function normalizeWorkflowText(value: any, fallback = ""): string {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isValidEmailAddress(value: any): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function optionalBoolean(...values: any[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value > 0;
    const text = cleanLowerString(value);
    if (!text) continue;
    if (["1", "true", "yes", "y", "allowed", "allow", "enabled", "enable"].includes(text)) return true;
    if (["0", "false", "no", "n", "blocked", "block", "disabled", "disable"].includes(text)) return false;
  }
  return null;
}

function normalizeReportWorkflow(body: AnyRecord, normalizedEmail: string): AnyRecord {
  const rawSource = firstCleanString(body.source, body.audit_source, body.auditSource, body.source_context, body.sourceContext);
  const auditSource = firstCleanString(body.auditSource, body.audit_source, body.sourceAuditType, body.source_audit_type, rawSource);
  const sourceContext = firstCleanString(body.sourceContext, body.source_context, body.auditContextSource, body.audit_context_source, auditSource);
  const sourceText = [
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
  ]
    .map((value) => cleanLowerString(value))
    .filter(Boolean)
    .join(" ");

  const linkedinProfileUrl = sanitizeOptionalUrl(firstCleanString(body.linkedinProfileUrl, body.linkedin_profile_url, body.linkedinUrl, body.linkedin_url));
  const linkedinCompanyUrl = sanitizeOptionalUrl(firstCleanString(body.linkedinCompanyUrl, body.linkedin_company_url, body.linkedinCompanyPageUrl, body.linkedin_company_page_url));
  const linkedinContactName = firstCleanString(body.linkedinContactName, body.linkedin_contact_name, body.linkedinContact, body.linkedin_contact);
  const hasLinkedInContext = Boolean(linkedinProfileUrl || linkedinCompanyUrl || linkedinContactName || sourceText.includes("linkedin"));

  const explicitSourceType = normalizeWorkflowText(body.sourceType || body.source_type);
  const sourceType: ReportSourceType =
    explicitSourceType === "linkedin" || explicitSourceType === "search" || explicitSourceType === "manual" || explicitSourceType === "unknown"
      ? (explicitSourceType as ReportSourceType)
      : hasLinkedInContext
        ? "linkedin"
        : sourceText.includes("search") || sourceText.includes("lead_row") || sourceText.includes("selected_export") || sourceText.includes("python")
          ? "search"
          : sourceText.includes("manual")
            ? "manual"
            : "unknown";

  const explicitChannel = normalizeWorkflowText(body.outreachChannel || body.outreach_channel);
  const outreachChannel: ReportOutreachChannel =
    explicitChannel === "email" || explicitChannel === "linkedin" || explicitChannel === "manual" || explicitChannel === "unknown"
      ? (explicitChannel as ReportOutreachChannel)
      : sourceType === "linkedin"
        ? "linkedin"
        : sourceType === "search"
          ? "email"
          : sourceType === "manual"
            ? "manual"
            : isValidEmailAddress(normalizedEmail)
              ? "email"
              : "unknown";

  const explicitLeadSource = normalizeWorkflowText(body.leadSource || body.lead_source);
  const leadSource = explicitLeadSource || (sourceType === "linkedin" ? "linkedin_audit" : sourceType === "search" ? "python_search" : sourceType === "manual" ? "manual_audit" : "unknown");
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

  const emailValid = optionalBoolean(body.emailValid, body.email_valid, body.validEmail, body.valid_email) ?? isValidEmailAddress(normalizedEmail);
  const emailOutreachAllowed =
    optionalBoolean(body.emailOutreachAllowed, body.email_outreach_allowed, body.emailAllowed, body.email_allowed) ??
    (outreachChannel === "email" && emailValid);
  const linkedinOutreachAllowed =
    optionalBoolean(body.linkedinOutreachAllowed, body.linkedin_outreach_allowed, body.linkedinAllowed, body.linkedin_allowed) ??
    outreachChannel === "linkedin";

  return {
    sourceType,
    source_type: sourceType,
    outreachChannel,
    outreach_channel: outreachChannel,
    leadSource,
    lead_source: leadSource,
    emailValid,
    email_valid: emailValid,
    emailOutreachAllowed,
    email_outreach_allowed: emailOutreachAllowed,
    linkedinOutreachAllowed,
    linkedin_outreach_allowed: linkedinOutreachAllowed,
    auditSource,
    audit_source: auditSource,
    sourceContext,
    source_context: sourceContext,
    sourceGroup,
    source_group: sourceGroup,
    sourceLabel,
    source_label: sourceLabel,
    channel: outreachChannel,
    linkedinProfileUrl,
    linkedin_profile_url: linkedinProfileUrl,
    linkedinCompanyUrl,
    linkedin_company_url: linkedinCompanyUrl,
    linkedinContactName,
    linkedin_contact_name: linkedinContactName,
  };
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

export function isBlockedPublicReportCopyKey(key: string): boolean {
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

export function sanitizePublicReportCopyObject(value: any, maxKeys = 40): AnyRecord {
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

function displayNameFromDomainValue(value: any): string {
  const raw = firstCleanString(value).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].split("?")[0];
  const base = raw.split(".")[0] || raw;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function isBadReportCompanyName(value: string, domain = ""): boolean {
  const text = firstCleanString(value).toLowerCase();
  if (!text) return true;
  if (/https?:\/\//i.test(text) || /www\./i.test(text) || /\bhttps?\b/i.test(text)) return true;
  if (/\.(com|net|org|co|io|us|uk|ca|au)(\/|$|\s)/i.test(text)) return true;
  if (/\b(event catering https|event catering|restaurant food service|food service|local service|lead generation|professional service)\b/i.test(text) && !/\balsies\b/i.test(text)) return true;
  if (/^(home|homepage|official site|menu|shop|store|cart|checkout|about|contact|services?|privacy|terms|book|books)$/i.test(text)) return true;
  if (text.length > 72) return true;
  const root = firstCleanString(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(".")[0].toLowerCase();
  if (root && text.includes(root)) return false;
  return false;
}

function cleanReportCompanyName(value: any, domain = ""): string {
  const fallback = displayNameFromDomainValue(domain) || "Website";
  let text = firstCleanString(value);
  const exactInput = text.replace(/\s+/g, " ").trim();
  if (exactInput && !/^https?:\/\//i.test(exactInput) && !/^www\./i.test(exactInput) && exactInput.length <= 90) {
    if (/\.[a-z]{2,}$/i.test(exactInput) || /^[A-Z0-9][A-Z0-9 .&'’.-]{1,90}$/i.test(exactInput)) {
      return exactInput;
    }
  }
  text = text
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/\bhttps?\b/gi, " ")
    .replace(/\b(event catering service|event catering|restaurant food service|restaurant|food service|local service|lead generation|professional service|ecommerce|online store|prepared for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—|•.,]+|[\s\-–—|•.,]+$/g, "");
  if (!text || isBadReportCompanyName(text, domain)) return fallback;
  const root = firstCleanString(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(".")[0];
  if (root && new RegExp(`\\b${root.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i").test(text)) return displayNameFromDomainValue(domain);
  return text || fallback;
}

function isAlertSignupReportPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): boolean {
  const blob = [
    body.primaryConversion,
    body.primary_conversion,
    body.primaryConversionAction,
    body.primary_conversion_action,
    body.primaryConversionLabel,
    body.primary_conversion_label,
    body.headline,
    body.mainFinding,
    body.main_finding,
    privatePage.primaryConversion,
    privatePage.primaryConversionLabel,
    privatePage.headline,
    privatePage.mainFinding,
    privatePage.auditSnapshotTitle,
    ...(Array.isArray(privatePage.auditSnapshotQuestions) ? privatePage.auditSnapshotQuestions : []),
    ...(Array.isArray(privatePage.recommendations) ? privatePage.recommendations.map((item: any) => typeof item === "string" ? item : JSON.stringify(item)) : []),
  ].filter(Boolean).join(" ").toLowerCase();
  return /newsletter[_\s-]*subscription|alert signup|notification form|sign up for alerts|register to be notified|sms\/email|customer opt-in|customer opt in|subscribe/.test(blob);
}

function alertSignupVerificationPlanObjects(): AnyRecord[] {
  return [
    { title: "Run one controlled alert signup / notification form test from the website." },
    { title: "Confirm sign_up, subscribe, generate_lead, or form_submit signals in GTM Preview, GA4 DebugView, and Google Ads diagnostics." },
    { title: "Match the same test with the CRM, form platform, SMS/email platform, or server records where relevant." },
    { title: "Separate browser-visible evidence from final account-side confirmation." },
  ];
}

export function getReportTimestamp(value: any, fallbackDays = 30) {
  const parsed = timestampFromAny(value);
  if (parsed) return parsed;
  return admin.firestore.Timestamp.fromMillis(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

function tfpV2749NormalizeReportPayloadBase(body: AnyRecord = {}) {
  const token = normalizeReportToken(body.token || body.reportToken || body.report_token) || createReportToken();
  const domain = firstCleanString(body.domain, body.websiteUrl, body.website_url, body.website, body.url);
  const manualContact = getObjectCandidate(body.manualContact, body.manual_contact, body.manual_contact_update, body.manualContactUpdate);
  const manualBusiness = getObjectCandidate(body.manualBusiness, body.manual_business, body.manual_business_update, body.manualBusinessUpdate, body.manual_client_update, body.manualClientUpdate);
  const reportOverrides = getObjectCandidate(body.reportOverrides, body.report_overrides);
  const pdfOverrides = getObjectCandidate(body.pdfManualOverrides, body.pdf_manual_overrides, body.pdfOverrides, body.pdf_overrides);
  const companyName = cleanReportCompanyName(firstCleanString(
    manualContact.businessName,
    manualContact.business_name,
    manualContact.companyName,
    manualContact.company_name,
    manualBusiness.businessName,
    manualBusiness.business_name,
    manualBusiness.companyName,
    manualBusiness.company_name,
    reportOverrides.companyName,
    reportOverrides.company_name,
    reportOverrides.businessName,
    reportOverrides.business_name,
    reportOverrides.preparedFor,
    reportOverrides.prepared_for,
    pdfOverrides.companyName,
    pdfOverrides.company_name,
    pdfOverrides.businessName,
    pdfOverrides.business_name,
    pdfOverrides.preparedFor,
    pdfOverrides.prepared_for,
    body.manualBusinessName,
    body.manual_business_name,
    body.confirmedBusinessName,
    body.confirmed_business_name,
    body.companyName,
    body.company_name,
    body.businessName,
    body.business_name,
    body.preparedFor,
    body.prepared_for,
    domain,
  ), domain);
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
  const ogImageUrl = firstPublicImageUrl(
    body.ogImageUrl,
    body.og_image_url,
    body.openGraphImageUrl,
    body.open_graph_image_url,
    body.previewImageUrl,
    body.preview_image_url,
    body.homepageScreenshotUrl,
    body.homepage_screenshot_url,
    body.screenshotUrl,
    body.screenshot_url,
  );
  const ogImagePathname = firstCleanString(
    body.ogImagePathname,
    body.og_image_pathname,
    body.previewImagePathname,
    body.preview_image_pathname,
    body.homepageScreenshotPathname,
    body.homepage_screenshot_pathname,
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
  const alertSignupContext = isAlertSignupReportPayload(body, privatePage);
  const manualAdsTransparency = normalizeManualAdsTransparency(body, privatePage);
  const evidenceVideo = normalizeEvidenceVideoPayload(body, privatePage);
  const securePageEvidenceAssets = normalizeSecurePageEvidenceAssetsPayload(body, privatePage);
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
  const manualConversionEvidence = normalizeManualConversionEvidenceForReport(body, privatePage);
  const incomingManualEvidenceHero = normalizeIncomingManualEvidenceHero(
    getObjectCandidate(
      body.manualEvidenceHero,
      body.manual_evidence_hero,
      privatePage.manualEvidenceHero,
      privatePage.manual_evidence_hero,
    ),
  );
  const manualEvidenceHero = buildManualEvidenceHero(manualConversionEvidence) || incomingManualEvidenceHero;

  let headline = firstCleanString(
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

  let mainFinding = firstCleanString(
    body.mainFinding,
    body.main_finding,
    privatePage.mainFinding,
    body.mainIssue,
    body.main_issue,
    body.problemSummary,
    body.problem_summary,
  );

  let businessImpact = firstCleanString(
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

  let recommendations = normalizeRecommendationArray(
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
  const workflow = normalizeReportWorkflow(body, email);
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

  const websiteUrl = firstCleanString(body.websiteUrl, body.website_url, body.website, domain ? `https://${domain}` : "");

  let reportAwareFields = buildReportAwareSecureFields({
    body,
    privatePage,
    websiteUrl,
    mainFinding,
    businessImpact,
    proofPoints,
    whatChecked,
    auditSnapshotQuestions,
    verificationPlan,
    problemCards,
  });

  whatChecked = reportAwareFields.whatChecked;
  auditSnapshotQuestions = reportAwareFields.auditSnapshotQuestions;
  verificationPlan = reportAwareFields.verificationPlan;

  if (alertSignupContext) {
    recommendations = normalizeRecommendationArray(
      [
        "Verify alert signup and notification form actions inside GA4 DebugView, GTM Preview, Google Ads diagnostics, CRM, SMS/email platform, or server logs where relevant.",
        "Confirm expected events such as sign_up, subscribe, generate_lead, or form_submit fire once per real customer action.",
        "Test the alert signup / notification form journey and confirm the final action inside the relevant account or server systems.",
        "Keep browser-visible evidence separate from final account-level confirmation in client communication.",
      ],
      4,
    );
    verificationPlan = alertSignupVerificationPlanObjects();
    whatChecked = normalizeStringArray([
      "Alert signup and notification form journey signals.",
      "GA4, Google Tag Manager, Google Ads, and first-party/server-side tracking signals.",
      ...whatChecked,
    ], 8);
    auditSnapshotQuestions = [
      "Are alert signup and notification form actions recorded clearly inside the relevant accounts?",
      "Which browser-visible tracking signals were observed?",
      "What needs confirmation inside GA4, GTM, Google Ads, CRM, SMS/email platform, or server logs?",
    ];
  }

  if (alertSignupContext) {
    reportAwareFields = {
      ...reportAwareFields,
      whatChecked,
      auditSnapshotTitle: "Alert Signup Form tracking snapshot",
      auditSnapshotQuestions,
      verificationPlan,
    };
  }

  const manualEvidenceRegisterFields = buildManualEvidenceRegisterFields(manualEvidenceHero, {
    websiteUrl,
    whatChecked,
    verificationPlan,
  });

  if (manualEvidenceRegisterFields) {
    headline = manualEvidenceRegisterFields.headline || headline;
    mainFinding = manualEvidenceRegisterFields.mainFinding || mainFinding;
    businessImpact = manualEvidenceRegisterFields.businessImpact || businessImpact;
    whatChecked = manualEvidenceRegisterFields.whatChecked || whatChecked;
    auditSnapshotQuestions = manualEvidenceRegisterFields.auditSnapshotQuestions || auditSnapshotQuestions;
    verificationPlan = manualEvidenceRegisterFields.verificationPlan || verificationPlan;
    reportAwareFields = {
      ...reportAwareFields,
      primaryActionLabel: manualEvidenceRegisterFields.primaryActionLabel || reportAwareFields.primaryActionLabel,
      primaryPageLabel: manualEvidenceRegisterFields.primaryPageLabel || reportAwareFields.primaryPageLabel,
      primaryPageUrl: manualEvidenceRegisterFields.primaryPageUrl || reportAwareFields.primaryPageUrl,
      auditSnapshotTitle: manualEvidenceRegisterFields.auditSnapshotTitle || reportAwareFields.auditSnapshotTitle,
      auditSnapshotQuestions,
      whatChecked,
      verificationPlan,
    };
  }

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
    primaryActionLabel: reportAwareFields.primaryActionLabel,
    primaryPageLabel: reportAwareFields.primaryPageLabel,
    primaryPageUrl: reportAwareFields.primaryPageUrl,
    reviewedPageUrls: reportAwareFields.reviewedPageUrls,
    trackingSignalCards: reportAwareFields.trackingSignalCards,
    auditSnapshotTitle: reportAwareFields.auditSnapshotTitle,
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: firstCleanString(privatePage.howToReadTitle, privatePage.how_to_read_title, body.howToReadTitle, body.how_to_read_title, "How to read this review"),
    howToReadParagraphs,
    ctaHeadline: firstCleanString(privatePage.ctaHeadline, privatePage.cta_headline, body.ctaHeadline, body.cta_headline, "Want this verified inside your actual accounts?"),
    ctaText,
    manualAdsTransparency,
    manualConversionEvidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manual_conversion_evidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manualActionContext: tfpV2751ManualActionContext({ manualConversionEvidence }, body) || undefined,
    manual_action_context: tfpV2751ManualActionContext({ manualConversionEvidence }, body) || undefined,
    manualEvidenceHero: manualEvidenceHero || undefined,
    manual_evidence_hero: manualEvidenceHero || undefined,
    evidenceVideo: evidenceVideo.enabled ? evidenceVideo : undefined,
    securePageEvidenceAssets: securePageEvidenceAssets.length ? securePageEvidenceAssets : undefined,
    secure_page_evidence_assets: securePageEvidenceAssets.length ? securePageEvidenceAssets : undefined,
    securePageEvidenceAssetCount: securePageEvidenceAssets.length,
    secure_page_evidence_asset_count: securePageEvidenceAssets.length,
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
    og_image_url: ogImageUrl,
    openGraphImageUrl: ogImageUrl,
    open_graph_image_url: ogImageUrl,
    previewImageUrl: ogImageUrl,
    preview_image_url: ogImageUrl,
    homepageScreenshotUrl: ogImageUrl,
    homepage_screenshot_url: ogImageUrl,
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
    og_image_pathname: ogImagePathname,
    domain,
    websiteUrl,
    companyName,
    company_name: companyName,
    displayCompanyName: companyName,
    display_company_name: companyName,
    preparedFor: companyName,
    prepared_for: companyName,
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
    primaryActionLabel: reportAwareFields.primaryActionLabel,
    primaryPageLabel: reportAwareFields.primaryPageLabel,
    primaryPageUrl: reportAwareFields.primaryPageUrl,
    reviewedPageUrls: reportAwareFields.reviewedPageUrls,
    trackingSignalCards: reportAwareFields.trackingSignalCards,
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
    manualConversionEvidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manual_conversion_evidence: manualConversionEvidence.enabled ? manualConversionEvidence : undefined,
    manualActionContext: tfpV2751ManualActionContext({ manualConversionEvidence }, body) || undefined,
    manual_action_context: tfpV2751ManualActionContext({ manualConversionEvidence }, body) || undefined,
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
    sourceType: workflow.sourceType,
    source_type: workflow.source_type,
    outreachChannel: workflow.outreachChannel,
    outreach_channel: workflow.outreach_channel,
    leadSource: workflow.leadSource,
    lead_source: workflow.lead_source,
    emailValid: workflow.emailValid,
    email_valid: workflow.email_valid,
    emailOutreachAllowed: workflow.emailOutreachAllowed,
    email_outreach_allowed: workflow.email_outreach_allowed,
    linkedinOutreachAllowed: workflow.linkedinOutreachAllowed,
    linkedin_outreach_allowed: workflow.linkedin_outreach_allowed,
    auditSource: workflow.auditSource,
    audit_source: workflow.audit_source,
    sourceContext: workflow.sourceContext,
    source_context: workflow.source_context,
    sourceGroup: workflow.sourceGroup,
    source_group: workflow.source_group,
    sourceLabel: workflow.sourceLabel,
    source_label: workflow.source_label,
    channel: workflow.channel,
    linkedinProfileUrl: workflow.linkedinProfileUrl,
    linkedin_profile_url: workflow.linkedin_profile_url,
    linkedinCompanyUrl: workflow.linkedinCompanyUrl,
    linkedin_company_url: workflow.linkedin_company_url,
    linkedinContactName: workflow.linkedinContactName,
    linkedin_contact_name: workflow.linkedin_contact_name,
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
    evidenceVideoUrl: evidenceVideo.enabled ? evidenceVideo.videoUrl : "",
    evidenceVideoEmbedUrl: evidenceVideo.enabled ? evidenceVideo.embedUrl : "",
    evidenceVideoProvider: evidenceVideo.enabled ? evidenceVideo.provider : "",
    evidenceVideoId: evidenceVideo.enabled ? evidenceVideo.videoId : "",
    evidenceVideoVisibility: evidenceVideo.enabled ? "unlisted" : "",
    evidenceVideoTitle: evidenceVideo.enabled ? evidenceVideo.title : "",
    evidenceVideoStatus: evidenceVideo.status || "",
    securePageEvidenceAssets,
    secure_page_evidence_assets: securePageEvidenceAssets,
    securePageEvidenceAssetCount: securePageEvidenceAssets.length,
    secure_page_evidence_asset_count: securePageEvidenceAssets.length,
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


// v27.50 Press-3.2: fallback report-mode inference when local export did not pass trackingCase.
// This is intentionally conservative: text markers may infer setup-first, but manual not_sure statuses alone do not.
function tfpV2750StringifyForMode(value: any, depth = 0): string {
  if (value === null || value === undefined || depth > 3) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => tfpV2750StringifyForMode(item, depth + 1)).filter(Boolean).join(" ");
  if (typeof value === "object") {
    const obj = value as AnyRecord;
    const keys = [
      "mode", "reportMode", "report_mode", "title", "headline", "mainFinding", "main_finding",
      "auditSnapshotTitle", "audit_snapshot_title", "auditPrimaryClaim", "audit_primary_claim",
      "safePrimaryClaim", "safe_primary_claim", "businessImpact", "business_impact", "whatChecked",
      "what_checked", "proofPoints", "proof_points", "recommendations", "verificationPlan",
      "verification_plan", "privateReportCopy", "private_report_copy", "securePageCopy", "secure_page_copy",
      "trackingCase", "tracking_case", "clientCopyContext", "client_copy_context",
    ];
    return keys.map((key) => tfpV2750StringifyForMode(obj[key], depth + 1)).filter(Boolean).join(" ");
  }
  return "";
}

function tfpV2750InferModeFromTextMarkers(...values: any[]): string {
  const blob = values.map((value) => tfpV2750StringifyForMode(value)).filter(Boolean).join(" ").toLowerCase();
  if (!blob) return "";

  if (
    blob.includes("website tracking readiness review") ||
    blob.includes("private website tracking readiness review") ||
    blob.includes("tracking foundation setup") ||
    blob.includes("ga4/gtm tracking foundation was not clearly detected") ||
    blob.includes("ga4 and gtm tracking foundation was not clearly detected") ||
    (blob.includes("analytics foundation") && blob.includes("setup first"))
  ) {
    return "tracking_foundation_setup";
  }

  if (
    blob.includes("ga4 setup readiness review") ||
    blob.includes("private ga4 setup readiness review") ||
    (blob.includes("gtm/container path may exist") && blob.includes("ga4 tracking was not clearly detected"))
  ) {
    return "ga4_setup_needed";
  }

  if (blob.includes("ecommerce tracking readiness review") || blob.includes("private ecommerce tracking readiness review")) {
    return "ecommerce_measurement_readiness";
  }

  if (blob.includes("google ads conversion tracking review") || blob.includes("private google ads conversion tracking review")) {
    return "ads_conversion_verification";
  }

  if (blob.includes("browser-side tracking snapshot") || blob.includes("controlled action test was not completed")) {
    return "limited_evidence_review";
  }

  if (blob.includes("was completed manually") && blob.includes("expected event") && blob.includes("not clearly observed")) {
    return "ga4_event_verification";
  }

  if (blob.includes("appears to trigger the expected") || blob.includes("expected event was observed")) {
    return "event_positive_snapshot";
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
  let mode = tfpV2749FirstString(
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

  // v27.50 Press-3.2: when local export missed trackingCase/reportMode, recover from setup-first text markers.
  if (!mode) {
    mode = tfpV2750InferModeFromTextMarkers(body, normalized, privateCopy, normalizedPrivateCopy, rawCase);
  }

  if (!mode && !Object.keys(rawCase).length) return {};
  const title = tfpV2749FirstString(
    rawCase.title, rawCase.reportTitle, rawCase.report_title,
    normalized.auditSnapshotTitle, normalized.audit_snapshot_title, normalized.headline,
    normalizedPrivateCopy.auditSnapshotTitle, normalizedPrivateCopy.audit_snapshot_title, normalizedPrivateCopy.title,
    body.auditSnapshotTitle, body.audit_snapshot_title, body.headline,
    privateCopy.auditSnapshotTitle, privateCopy.audit_snapshot_title, privateCopy.title,
  );
  const mainFinding = tfpV2749FirstString(
    rawCase.mainFinding, rawCase.main_finding, rawCase.safePrimaryClaim, rawCase.safe_primary_claim,
    normalized.mainFinding, normalized.main_finding,
    normalizedPrivateCopy.mainFinding, normalizedPrivateCopy.main_finding,
    body.mainFinding, body.main_finding,
    privateCopy.mainFinding, privateCopy.main_finding,
  );
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


function tfpV2751CleanManualActionLabel(value: any): string {
  const text = tfpV2749CleanString(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (/^(main business action|selected conversion action|tracking foundation setup|ga4 setup readiness|website tracking foundation|conversion path review)$/i.test(text)) return "";
  if (/^browser-visible signals?$/i.test(text)) return "";
  return text.length > 90 ? text.slice(0, 87).replace(/\s+\S*$/, "").trim() : text;
}

function tfpV2751CleanExpectedEvent(value: any): string {
  const text = tfpV2749CleanString(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (/^(the selected business event|selected business event|browser-visible signal|controlled test|account check)$/i.test(text)) return "";
  return text.length > 120 ? text.slice(0, 117).replace(/\s+\S*$/, "").trim() : text;
}

function tfpV2751ManualActionContext(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord | null {
  const primary = tfpV2749ManualPrimaryAction(report, body);
  const label = tfpV2751CleanManualActionLabel(primary.label || primary.actionLabel || primary.action_label || body.primaryActionLabel || body.primary_action_label);
  const expectedEvent = tfpV2751CleanExpectedEvent(primary.expectedEvent || primary.expected_event || primary.expected || body.manualExpectedEvent || body.manual_expected_event);
  const actionCompleted = tfpV2749CleanString(primary.actionCompleted || primary.action_completed || primary.completed || "");
  const observedEvent = tfpV2749CleanString(primary.observedEventName || primary.observed_event_name || primary.observedEvent || primary.observed_event || "");
  const tool = tfpV2749CleanString(primary.tool || primary.toolUsed || primary.tool_used || "");
  if (!label && !expectedEvent && !actionCompleted && !observedEvent && !tool) return null;
  return {
    label: label || "Selected customer action",
    expectedEvent,
    expected_event: expectedEvent,
    actionCompleted,
    action_completed: actionCompleted,
    observedEvent,
    observed_event: observedEvent,
    tool,
    displayMode: "context_only_after_foundation_setup",
    display_mode: "context_only_after_foundation_setup",
    heroEnabled: false,
    hero_enabled: false,
  };
}


// ============================================================
// v27.71 - Event-verification Firestore copy guard
// Purpose:
// Preserve the old professional rule:
// - no GA4/GTM => setup-first presentation
// - GA4 present + controlled manual evidence => event-verification presentation
// This prevents generic browser-signal proofPoints from becoming the Firestore
// problemCards used by the secure page, PDF metadata, and question generator.
// ============================================================

const TFP_V2771_EVENT_MODES = new Set(["ga4_event_verification", "event_positive_snapshot"]);

function tfpV2771ManualPrimary(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord {
  const manual = tfpV2749Object(
    report.manualConversionEvidence ||
      report.manual_conversion_evidence ||
      body.manualConversionEvidence ||
      body.manual_conversion_evidence ||
      report.privateReportCopy?.manualConversionEvidence ||
      report.privateReportCopy?.manual_conversion_evidence ||
      report.private_report_copy?.manualConversionEvidence ||
      report.private_report_copy?.manual_conversion_evidence,
  );
  return tfpV2749Object(manual.primaryAction || manual.primary_action || manual.primary);
}

function tfpV2771ManualHero(report: AnyRecord = {}, body: AnyRecord = {}): AnyRecord {
  return tfpV2749Object(
    report.manualEvidenceHero ||
      report.manual_evidence_hero ||
      body.manualEvidenceHero ||
      body.manual_evidence_hero ||
      report.privateReportCopy?.manualEvidenceHero ||
      report.privateReportCopy?.manual_evidence_hero ||
      report.private_report_copy?.manualEvidenceHero ||
      report.private_report_copy?.manual_evidence_hero,
  );
}

function tfpV2771Truthy(value: any): boolean {
  return ["yes", "y", "true", "1", "observed", "found", "complete", "completed"].includes(String(value || "").trim().toLowerCase());
}

function tfpV2771CleanLabel(...values: any[]): string {
  return tfpV2751CleanManualActionLabel(tfpV2749FirstString(...values)) || "Selected conversion action";
}

function tfpV2771CleanEvent(value: any, fallback: string): string {
  return tfpV2749CleanString(value, fallback).replace(/\s+/g, " ").trim() || fallback;
}

function tfpV2771ProblemCard(title: string, finding: string, businessMeaning: string, nextCheck: string, severity = "review"): AnyRecord {
  return {
    title: tfpV2749CleanString(title, "Tracking item to verify").slice(0, 140),
    finding: tfpV2749CleanString(finding).slice(0, 280),
    summary: tfpV2749CleanString(finding).slice(0, 280),
    businessMeaning: tfpV2749CleanString(businessMeaning).slice(0, 320),
    business_meaning: tfpV2749CleanString(businessMeaning).slice(0, 320),
    whyItMatters: tfpV2749CleanString(businessMeaning).slice(0, 320),
    why_it_matters: tfpV2749CleanString(businessMeaning).slice(0, 320),
    nextCheck: tfpV2749CleanString(nextCheck).slice(0, 360),
    next_check: tfpV2749CleanString(nextCheck).slice(0, 360),
    recommendedCheck: tfpV2749CleanString(nextCheck).slice(0, 360),
    recommended_check: tfpV2749CleanString(nextCheck).slice(0, 360),
    severity,
    evidence: [],
  };
}

function tfpV2771BuildEventFields(report: AnyRecord = {}, body: AnyRecord = {}, trackingCase: AnyRecord = {}): AnyRecord | null {
  const mode = tfpV2749FirstString(trackingCase.mode, report.reportMode, report.report_mode);
  if (!TFP_V2771_EVENT_MODES.has(mode)) return null;

  const primary = tfpV2771ManualPrimary(report, body);
  const hero = tfpV2771ManualHero(report, body);
  const hasManualEvidence = Boolean(
    Object.keys(primary).length ||
      Object.keys(hero).length ||
      trackingCase.manualEvidenceStrong ||
      trackingCase.manual_evidence_strong ||
      report.manualConversionEvidence ||
      report.manual_conversion_evidence,
  );
  if (!hasManualEvidence) return null;

  const label = tfpV2771CleanLabel(
    trackingCase.customLabel,
    trackingCase.custom_label,
    trackingCase.primaryConversionLabel,
    trackingCase.primary_conversion_label,
    primary.label,
    primary.actionLabel,
    primary.action_label,
    hero.actionLabel,
    hero.action_label,
    hero.label,
    report.primaryActionLabel,
    report.primary_action_label,
  );
  const expected = tfpV2771CleanEvent(
    tfpV2749FirstString(trackingCase.expectedEvent, trackingCase.expected_event, primary.expectedEvent, primary.expected_event, hero.expectedEvent, hero.expected_event),
    "the expected event",
  );
  const observed = tfpV2771CleanEvent(
    tfpV2749FirstString(trackingCase.observedEvent, trackingCase.observed_event, primary.observedEventName, primary.observed_event_name, primary.observedEvent, primary.observed_event, hero.observedEvent, hero.observed_event),
    "not clearly observed",
  );
  const tool = tfpV2749FirstString(primary.tool, hero.tool, "Tag Assistant");
  const positive = mode === "event_positive_snapshot" || Boolean(trackingCase.trackingObserved || trackingCase.tracking_observed || primary.trackingObserved || primary.tracking_observed || tfpV2771Truthy(primary.ga4EventObserved || primary.ga4_event_observed));
  const finalMode = positive ? "event_positive_snapshot" : "ga4_event_verification";
  const mainFinding = positive
    ? tfpV2749FirstString(trackingCase.mainFinding, trackingCase.main_finding, report.mainFinding, `${label} appears to trigger the expected ${expected} event from the browser-visible/manual review.`)
    : tfpV2749FirstString(trackingCase.mainFinding, trackingCase.main_finding, report.mainFinding, `${label} was completed manually, but the expected event ${expected} was not clearly observed.`);
  const businessImpact = positive
    ? "The selected event appears visible from the manual/browser-side review, but final account-side confirmation is still recommended before relying on it."
    : "If the selected customer action is not recorded clearly, reporting and optimization decisions can become less reliable.";
  const proofPoints = [
    `${label} was completed manually using ${tool}.`,
    `Expected event: ${expected}.`,
    `Observed result: ${observed}.`,
    "Browser-visible/manual evidence should be separated from final account-side confirmation.",
  ];
  const problemCards = [
    tfpV2771ProblemCard(
      positive ? `${label} event should be confirmed account-side` : `${label} event needs verification`,
      mainFinding,
      businessImpact,
      "Run the same action in GTM Preview and GA4 DebugView, then compare it with Google Ads, CRM, and server/backend records where relevant.",
      positive ? "review" : "high",
    ),
    tfpV2771ProblemCard(
      "Expected and observed event should be compared",
      `The expected event was ${expected}; the browser-visible/manual result was ${observed}.`,
      "Clear expected/observed separation helps avoid overclaiming final conversion recording.",
      "Verify the event name, trigger, parameters, key-event/conversion marking, and downstream account reporting.",
      "review",
    ),
  ];
  const verificationPlan = [
    {
      priority: "Priority 1",
      title: `Repeat one controlled ${label} test.`,
      description: "Complete the same customer action once from the reviewed page or path.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 2",
      title: `Confirm whether ${expected} appears in GA4 DebugView or GA4 events.`,
      description: "Do not treat ordinary page_view activity as proof of the selected conversion action.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 3",
      title: "Check the matching GTM trigger and Google Ads conversion action.",
      description: "Confirm the intended trigger/label, not only general tag or remarketing activity.",
      estimatedEffort: "Short review",
    },
    {
      priority: "Priority 4",
      title: "Compare the same test with CRM, form inbox, booking/ecommerce records, call tracking, or server logs.",
      description: "Final account-side confirmation should match the browser-visible/manual test.",
      estimatedEffort: "Short review",
    },
  ];
  const whatChecked = [
    `Selected action: ${label}.`,
    `Expected event: ${expected}.`,
    `Browser-visible/manual result: ${observed}.`,
    "Whether the same action appears inside GA4, GTM, Google Ads, CRM, form/booking/ecommerce records, call tracking, or server logs.",
  ];
  const auditSnapshotQuestions = [
    `Does ${label} trigger ${expected}?`,
    `What exactly appeared as the observed event/result: ${observed}?`,
    "Does the same action appear in the final account/backend records?",
    "Could reporting or optimization decisions be affected if this action is used for campaigns?",
  ];

  return {
    headline: positive ? `Private tracking verification snapshot` : `Private conversion tracking review`,
    mainFinding,
    main_finding: mainFinding,
    businessImpact,
    business_impact: businessImpact,
    proofPoints,
    proof_points: proofPoints,
    problemCards,
    problem_cards: problemCards,
    businessProblems: problemCards,
    business_problems: problemCards,
    verificationPlan,
    verification_plan: verificationPlan,
    recommendations: verificationPlan,
    whatChecked,
    what_checked: whatChecked,
    auditSnapshotTitle: positive ? "Tracking verification snapshot" : `${label} tracking snapshot`,
    audit_snapshot_title: positive ? "Tracking verification snapshot" : `${label} tracking snapshot`,
    auditSnapshotQuestions,
    audit_snapshot_questions: auditSnapshotQuestions,
    primaryActionLabel: label,
    primary_action_label: label,
    primaryConversionLabel: label,
    primary_conversion_label: label,
    ctaHeadline: positive ? "Want the event confirmed inside the actual accounts?" : "Want this conversion event verified and fixed?",
    cta_headline: positive ? "Want the event confirmed inside the actual accounts?" : "Want this conversion event verified and fixed?",
    ctaText: positive ? "Request tracking verification" : "Request conversion tracking review",
    cta_text: positive ? "Request tracking verification" : "Request conversion tracking review",
    setupFirstOverrideApplied: false,
    setup_first_override_applied: false,
    reportMode: finalMode,
    report_mode: finalMode,
  };
}

function tfpV2749SetupFirstFields(report: AnyRecord, body: AnyRecord, trackingCase: AnyRecord): AnyRecord {
  const mode = tfpV2749FirstString(trackingCase.mode, report.reportMode, report.report_mode);
  const primary = tfpV2749ManualPrimaryAction(report, body);
  const actionLabel = tfpV2751CleanManualActionLabel(tfpV2749FirstString(primary.label, primary.actionLabel, primary.action_label));
  const expectedEvent = tfpV2751CleanExpectedEvent(tfpV2749FirstString(primary.expectedEvent, primary.expected_event));
  const manualActionContext = tfpV2751ManualActionContext(report, body);
  const foundationLabel = mode === "ga4_setup_needed" ? "GA4 setup readiness" : "Tracking foundation setup";
  const mainFinding = mode === "ga4_setup_needed"
    ? "A GTM/container path may exist, but GA4 tracking was not clearly detected from the browser-visible review."
    : "GA4/GTM tracking foundation was not clearly detected from the public browser-side review.";

  const whatChecked = [
    "Public browser-visible GA4/GTM foundation signals.",
    "Whether a clear analytics foundation was visible before event-level verification.",
    actionLabel ? `Manual target selected for future event setup: ${actionLabel}.` : "A future customer action should be configured after GA4/GTM setup.",
    "Final conversion recording was not claimed because setup/account-side confirmation is still required.",
  ].filter(Boolean);

  const auditSnapshotQuestions = [
    "Was a GA4 or GTM tracking foundation clearly visible from the public browser-side review?",
    actionLabel ? `Which customer action should be configured after setup (${actionLabel})?` : "Which customer action should be configured after setup?",
    expectedEvent ? `After setup, should ${expectedEvent} be tested in GTM Preview and GA4 DebugView?` : "What event should be tested after GA4/GTM setup?",
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
      title: actionLabel ? `Define the main business event for ${actionLabel}.` : "Define the main business event after GA4/GTM setup.",
      description: expectedEvent ? `Use an appropriate event such as ${expectedEvent}, then map it consistently in GTM/GA4.` : "Choose the correct event name after the tracking foundation is installed.",
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
    actionLabel ? `Manual conversion context was kept as secondary context: ${actionLabel}.` : "Event-level testing should happen after the tracking foundation is installed.",
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
      finding: actionLabel ? `${actionLabel} can be configured and tested after the tracking foundation is in place.` : "The selected customer action can be configured and tested after the tracking foundation is in place.",
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
      actionLabel ? `Configure the selected business event: ${actionLabel}.` : "Configure the selected customer action after GA4/GTM setup.",
      "Run one controlled conversion test after setup and confirm it in GA4/GTM plus backend records.",
    ],
    verificationPlan,
    verification_plan: verificationPlan,
    whatChecked,
    manualActionContext: manualActionContext || undefined,
    manual_action_context: manualActionContext || undefined,
    auditSnapshotTitle: "Website Tracking Readiness Snapshot",
    auditSnapshotQuestions,
    primaryActionLabel: foundationLabel,
    primaryPageLabel: "Website tracking foundation",
    primaryPageUrl: "",
    ctaHeadline: "Ready to set up and verify tracking live?",
    ctaText: "Request tracking setup review",
    setupFirstOverrideApplied: true,
    setup_first_override_applied: true,
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

  if (!tfpV2749IsSetupFirstMode(mode)) {
    const eventFields = tfpV2771BuildEventFields(output, body, trackingCaseOut);
    if (!eventFields) return output;
    const finalMode = tfpV2749FirstString(eventFields.reportMode, mode);
    const finalTrackingCase = {
      ...trackingCaseOut,
      mode: finalMode,
      reportMode: finalMode,
      report_mode: finalMode,
      customLabel: eventFields.primaryActionLabel || trackingCaseOut.customLabel,
      custom_label: eventFields.primaryActionLabel || trackingCaseOut.custom_label,
      expectedEvent: trackingCaseOut.expectedEvent || trackingCaseOut.expected_event,
      expected_event: trackingCaseOut.expected_event || trackingCaseOut.expectedEvent,
      observedEvent: trackingCaseOut.observedEvent || trackingCaseOut.observed_event,
      observed_event: trackingCaseOut.observed_event || trackingCaseOut.observedEvent,
      mainFinding: eventFields.mainFinding,
      main_finding: eventFields.mainFinding,
      manualEvidenceStrong: true,
      manual_evidence_strong: true,
    };
    const privateCopy = {
      ...(tfpV2749Object(output.privateReportCopy || output.private_report_copy)),
      ...eventFields,
      trackingCase: finalTrackingCase,
      tracking_case: finalTrackingCase,
      reportMode: finalMode,
      report_mode: finalMode,
    };
    return {
      ...output,
      ...eventFields,
      trackingCase: finalTrackingCase,
      tracking_case: finalTrackingCase,
      reportMode: finalMode,
      report_mode: finalMode,
      privateReportCopy: privateCopy,
      private_report_copy: privateCopy,
      securePageCopy: privateCopy,
      secure_page_copy: privateCopy,
    };
  }

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

export function normalizeReportPayload(body: AnyRecord = {}) {
  const report = tfpV2749NormalizeReportPayloadBase(body);
  return tfpV2749ApplyReportModeFirestoreOverrides(report, body);
}
