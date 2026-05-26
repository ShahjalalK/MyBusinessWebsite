import { createHash, createHmac } from "node:crypto";

type B2Config = {
  endpoint: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
  region: string;
};

export type B2UploadResult = {
  key: string;
  bucket: string;
  etag: string;
  size: number;
};

export type B2ReadResult = {
  key: string;
  bucket: string;
  contentType: string;
  contentLength: number;
  etag: string;
  buffer: Buffer;
};

function clean(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function envValue(...names: string[]): string {
  for (const name of names) {
    const value = clean(process.env[name]);
    if (value) return value;
  }
  return "";
}

function inferRegionFromEndpoint(endpoint: string): string {
  try {
    const host = new URL(endpoint).hostname;
    const match = host.match(/^s3[.-]([a-z0-9-]+)\.backblazeb2\.com$/i);
    if (match?.[1]) return match[1];
  } catch {}
  return envValue("B2_REGION", "BACKBLAZE_B2_REGION") || "us-west-004";
}

function getB2Config(): B2Config {
  const endpoint = envValue("B2_ENDPOINT", "BACKBLAZE_B2_ENDPOINT").replace(/\/+$/, "");
  const bucket = envValue("B2_BUCKET_NAME", "BACKBLAZE_B2_BUCKET_NAME");
  const keyId = envValue("B2_KEY_ID", "BACKBLAZE_B2_KEY_ID", "B2_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const applicationKey = envValue(
    "B2_APPLICATION_KEY",
    "BACKBLAZE_B2_APPLICATION_KEY",
    "B2_SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
  );

  if (!endpoint) throw new Error("Missing B2_ENDPOINT. Example: https://s3.us-west-004.backblazeb2.com");
  if (!bucket) throw new Error("Missing B2_BUCKET_NAME.");
  if (!keyId) throw new Error("Missing B2_KEY_ID.");
  if (!applicationKey) throw new Error("Missing B2_APPLICATION_KEY.");

  return {
    endpoint,
    bucket,
    keyId,
    applicationKey,
    region: inferRegionFromEndpoint(endpoint),
  };
}

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}


function toBuffer(value: Buffer | ArrayBuffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(value)) return value;
  return Buffer.from(value);
}

function toFetchBody(buffer: Buffer): BodyInit {
  // Buffer is valid at runtime in Node fetch, but some DOM/Node type combinations
  // flag it. Uint8Array keeps the same bytes and satisfies BodyInit reliably.
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as BodyInit;
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function signingKey(secret: string, dateStamp: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function amzDateParts(date = new Date()): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function encodeS3Key(key: string): string {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join("/");
}

function normalizeObjectKey(key: string): string {
  const cleaned = clean(key)
    .replace(/\\/g, "/")
    .replace(/^\/+/g, "")
    .replace(/\/+/g, "/");

  if (!cleaned) throw new Error("B2 object key is required.");
  if (cleaned.includes("..")) throw new Error("Unsafe B2 object key.");
  return cleaned;
}


export function sanitizeB2Key(key: string): string {
  return normalizeObjectKey(key);
}

function signedHeadersFrom(headers: Record<string, string>): string {
  return Object.keys(headers)
    .map((name) => name.toLowerCase())
    .sort()
    .join(";");
}

function canonicalHeadersFrom(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), String(value).trim().replace(/\s+/g, " ")] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");
}

function buildSignedRequest(params: {
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  key: string;
  contentType?: string;
  payloadHash?: string;
  extraHeaders?: Record<string, string>;
}): { url: string; headers: Record<string, string>; bucket: string } {
  const config = getB2Config();
  const key = normalizeObjectKey(params.key);
  const endpoint = new URL(config.endpoint);
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodeS3Key(key)}`;
  const url = `${config.endpoint}${canonicalUri}`;
  const { amzDate, dateStamp } = amzDateParts();
  const payloadHash = params.payloadHash || "UNSIGNED-PAYLOAD";

  const headers: Record<string, string> = {
    host: endpoint.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...(params.contentType ? { "content-type": params.contentType } : {}),
    ...(params.extraHeaders || {}),
  };

  const signedHeaders = signedHeadersFrom(headers);
  const canonicalHeaders = canonicalHeadersFrom(headers);
  const canonicalRequest = [
    params.method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = createHmac("sha256", signingKey(config.applicationKey, dateStamp, config.region))
    .update(stringToSign)
    .digest("hex");

  headers.authorization = `${algorithm} Credential=${config.keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { url, headers, bucket: config.bucket };
}

function buildContentDisposition(filename?: string): string {
  const cleanName = clean(filename, "TrackFlow-Audit-Report.pdf")
    .replace(/[\r\n"]/g, "")
    .slice(0, 180) || "TrackFlow-Audit-Report.pdf";

  return `inline; filename="${cleanName}"`;
}

export function buildReportPdfB2Key(input: { domainSlug?: string; token: string; filename?: string }): string {
  const domainSlug = clean(input.domainSlug, "website")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96) || "website";

  const token = clean(input.token)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);

  if (!token) throw new Error("Report token is required to build a B2 PDF key.");

  return `reports/${domainSlug}/${token}/pdf/audit-report.pdf`;
}

export async function uploadPdfToB2(input: {
  key: string;
  buffer: Buffer | ArrayBuffer | Uint8Array;
  filename?: string;
}): Promise<B2UploadResult> {
  const buffer = toBuffer(input.buffer);
  if (buffer.byteLength < 500) throw new Error("PDF buffer is too small to upload to B2.");
  if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("Refusing to upload non-PDF content to B2.");
  }

  const payloadHash = sha256Hex(buffer);
  const signed = buildSignedRequest({
    method: "PUT",
    key: input.key,
    contentType: "application/pdf",
    payloadHash,
    extraHeaders: {
      "content-disposition": buildContentDisposition(input.filename),
    },
  });

  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body: toFetchBody(buffer),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backblaze B2 PDF upload failed (${response.status}): ${text.slice(0, 500)}`);
  }

  return {
    key: normalizeObjectKey(input.key),
    bucket: signed.bucket,
    etag: response.headers.get("etag")?.replace(/"/g, "") || "",
    size: buffer.byteLength,
  };
}

export async function readB2Object(key: string): Promise<B2ReadResult> {
  const objectKey = normalizeObjectKey(key);
  const signed = buildSignedRequest({
    method: "GET",
    key: objectKey,
  });

  const response = await fetch(signed.url, {
    method: "GET",
    cache: "no-store",
    headers: signed.headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backblaze B2 object read failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    key: objectKey,
    bucket: signed.bucket,
    contentType: response.headers.get("content-type") || "application/octet-stream",
    contentLength: Number(response.headers.get("content-length") || buffer.byteLength || 0),
    etag: response.headers.get("etag")?.replace(/"/g, "") || "",
    buffer,
  };
}

export async function readPdfFromB2(key: string): Promise<B2ReadResult> {
  const object = await readB2Object(key);
  if (object.buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("B2 object is not a valid PDF.");
  }
  return {
    ...object,
    contentType: "application/pdf",
  };
}

export async function deleteB2Object(key: string): Promise<boolean> {
  const objectKey = normalizeObjectKey(key);
  const signed = buildSignedRequest({
    method: "DELETE",
    key: objectKey,
  });

  const response = await fetch(signed.url, {
    method: "DELETE",
    headers: signed.headers,
  });

  if (response.status === 404) return false;
  if (!response.ok && response.status !== 204) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backblaze B2 object delete failed (${response.status}): ${text.slice(0, 500)}`);
  }

  return true;
}

export async function deletePdfFromB2(key: string): Promise<boolean> {
  return deleteB2Object(key);
}
