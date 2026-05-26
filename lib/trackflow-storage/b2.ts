// ============================================================
// FILE: lib/trackflow-storage/b2.ts
// Purpose: Backblaze B2 private PDF storage via the S3-compatible API.
// Notes:
// - No AWS SDK dependency required.
// - Keeps PDF files private; secure report preview/download routes stream the file server-side.
// - Vercel Blob can still be used separately for public OG/LinkedIn preview images.
// ============================================================

import { createHash, createHmac } from "crypto";

type AnyRecord = Record<string, any>;

export type B2UploadResult = {
  key: string;
  bucket: string;
  endpoint: string;
  storageProvider: "backblaze_b2";
  contentType: string;
  size: number;
  etag?: string;
};

export type B2ReadResult = {
  key: string;
  contentType: string;
  buffer: Buffer;
  etag?: string;
};

type B2Config = {
  endpoint: string;
  host: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
};

const DEFAULT_REGION = "us-west-004";
const SERVICE = "s3";
const EMPTY_SHA256 = createHash("sha256").update("").digest("hex");

function clean(value: unknown): string {
  return String(value || "").trim();
}

function normalizeEndpoint(value: string): string {
  const raw = clean(value).replace(/\/+$/, "");
  if (!raw) return "";
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

function parseRegion(endpoint: string): string {
  try {
    const host = new URL(endpoint).hostname;
    const match = host.match(/s3[.-]([a-z0-9-]+)\.backblazeb2\.com$/i);
    if (match?.[1]) return match[1];
  } catch {}
  return clean(process.env.B2_REGION || process.env.BACKBLAZE_B2_REGION || DEFAULT_REGION) || DEFAULT_REGION;
}

function requireB2Config(): B2Config {
  const endpoint = normalizeEndpoint(process.env.B2_ENDPOINT || process.env.BACKBLAZE_B2_ENDPOINT || "");
  const bucket = clean(process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_B2_BUCKET_NAME || "");
  const keyId = clean(process.env.B2_KEY_ID || process.env.BACKBLAZE_B2_KEY_ID || "");
  const applicationKey = clean(process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_B2_APPLICATION_KEY || "");

  const missing = [
    !endpoint ? "B2_ENDPOINT" : "",
    !bucket ? "B2_BUCKET_NAME" : "",
    !keyId ? "B2_KEY_ID" : "",
    !applicationKey ? "B2_APPLICATION_KEY" : "",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing Backblaze B2 ENV: ${missing.join(", ")}`);
  }

  const url = new URL(endpoint);
  return {
    endpoint,
    host: url.host,
    region: parseRegion(endpoint),
    bucket,
    keyId,
    applicationKey,
  };
}

export function isB2Configured(): boolean {
  return Boolean(
    clean(process.env.B2_ENDPOINT || process.env.BACKBLAZE_B2_ENDPOINT || "") &&
      clean(process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_B2_BUCKET_NAME || "") &&
      clean(process.env.B2_KEY_ID || process.env.BACKBLAZE_B2_KEY_ID || "") &&
      clean(process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_B2_APPLICATION_KEY || ""),
  );
}

export function getB2BucketName(): string {
  return requireB2Config().bucket;
}

export function sanitizeB2Key(value: unknown): string {
  return clean(value)
    .replace(/^\/+/, "")
    .replace(/\.{2,}/g, ".")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, 900);
}

export function buildReportPdfB2Key(input: { domainSlug: string; token: string }): string {
  const domainSlug = clean(input.domainSlug || "website")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "website";
  const token = clean(input.token).replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 96);
  if (!token) throw new Error("Report token is required before building a B2 PDF key.");
  return `reports/${domainSlug}/${token}/audit-report.pdf`;
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalUri(bucket: string, key: string): string {
  return `/${encodePathSegment(bucket)}/${sanitizeB2Key(key).split("/").map(encodePathSegment).join("/")}`;
}

function hashHex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hmacHex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

function amzDates(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function signingKey(secret: string, dateStamp: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

async function signedB2Fetch({
  method,
  key,
  body,
  contentType,
  extraHeaders = {},
}: {
  method: "GET" | "PUT" | "DELETE";
  key: string;
  body?: Buffer;
  contentType?: string;
  extraHeaders?: AnyRecord;
}): Promise<Response> {
  const config = requireB2Config();
  const safeKey = sanitizeB2Key(key);
  if (!safeKey) throw new Error("B2 object key is required.");

  const payloadHash = body ? hashHex(body) : EMPTY_SHA256;
  const { amzDate, dateStamp } = amzDates();

  const headers: Record<string, string> = {
    host: config.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...Object.entries(extraHeaders).reduce<Record<string, string>>((acc, [rawKey, rawValue]) => {
      const headerName = String(rawKey || "").trim().toLowerCase();
      const headerValue = String(rawValue || "").trim();
      if (headerName && headerValue) acc[headerName] = headerValue;
      return acc;
    }, {}),
  };

  if (contentType) headers["content-type"] = contentType;

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name].replace(/\s+/g, " ").trim()}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");
  const uri = canonicalUri(config.bucket, safeKey);
  const credentialScope = `${dateStamp}/${config.region}/${SERVICE}/aws4_request`;
  const canonicalRequest = [method, uri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashHex(canonicalRequest)].join("\n");
  const signature = hmacHex(signingKey(config.applicationKey, dateStamp, config.region), stringToSign);

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const url = `${config.endpoint}${uri}`;

  return fetch(url, {
    method,
    cache: "no-store",
    headers: {
      ...headers,
      authorization,
    },
    ...(body ? { body: new Uint8Array(body) } : {}),
  });
}

export async function uploadPdfToB2(input: { key: string; buffer: Buffer; filename?: string }): Promise<B2UploadResult> {
  const key = sanitizeB2Key(input.key);
  if (!Buffer.isBuffer(input.buffer) || input.buffer.byteLength < 5) throw new Error("PDF buffer is empty.");
  if (input.buffer.subarray(0, 5).toString("utf8") !== "%PDF-") throw new Error("Only valid PDF files can be uploaded to B2.");

  const response = await signedB2Fetch({
    method: "PUT",
    key,
    body: input.buffer,
    contentType: "application/pdf",
    extraHeaders: {
      "x-amz-meta-trackflow-filename": clean(input.filename || "trackflow-report.pdf").slice(0, 180),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backblaze B2 PDF upload failed (${response.status}). ${text.slice(0, 300)}`.trim());
  }

  return {
    key,
    bucket: getB2BucketName(),
    endpoint: requireB2Config().endpoint,
    storageProvider: "backblaze_b2",
    contentType: "application/pdf",
    size: input.buffer.byteLength,
    etag: clean(response.headers.get("etag") || "").replace(/^\"|\"$/g, ""),
  };
}

export async function readPdfFromB2(keyInput: unknown): Promise<B2ReadResult> {
  const key = sanitizeB2Key(keyInput);
  if (!key) throw new Error("B2 PDF key is missing.");

  const response = await signedB2Fetch({ method: "GET", key });
  if (!response.ok) {
    throw new Error(`Backblaze B2 PDF fetch failed (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("Backblaze B2 object is not a valid PDF.");
  }

  return {
    key,
    contentType: response.headers.get("content-type") || "application/pdf",
    buffer,
    etag: clean(response.headers.get("etag") || "").replace(/^\"|\"$/g, ""),
  };
}

export async function deleteB2Object(keyInput: unknown): Promise<boolean> {
  const key = sanitizeB2Key(keyInput);
  if (!key || !isB2Configured()) return false;

  const response = await signedB2Fetch({ method: "DELETE", key });
  return response.ok || response.status === 404;
}
