import { Buffer } from "node:buffer";
import * as http from "node:http";
import * as https from "node:https";
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

  if (value instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(value));
  }

  const copied = new Uint8Array(value.byteLength);
  copied.set(value);
  return Buffer.from(copied);
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  view.set(buffer);
  return arrayBuffer;
}

function toFetchBody(buffer: Buffer): ArrayBuffer {
  // Use a copied ArrayBuffer instead of Buffer/Uint8Array so TypeScript stays happy
  // across Node + DOM fetch type combinations.
  return bufferToArrayBuffer(buffer);
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


type B2NodeReadResponse = {
  status: number;
  statusText: string;
  headers: http.IncomingHttpHeaders;
  buffer: Buffer;
};

function numberEnv(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number(process.env[name]);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(value, max));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaderValue(headers: http.IncomingHttpHeaders, name: string): string {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || "";
  return String(value || "");
}

function isRetryableB2Status(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function shouldRetryB2Error(error: unknown): boolean {
  const message = String((error as any)?.message || error || "").toLowerCase();
  const code = String((error as any)?.code || (error as any)?.cause?.code || "").toLowerCase();

  return (
    code.includes("timeout") ||
    code.includes("econnreset") ||
    code.includes("etimedout") ||
    code.includes("eai_again") ||
    code.includes("enotfound") ||
    code.includes("und_err_connect_timeout") ||
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("socket") ||
    message.includes("network")
  );
}

function readSignedB2ObjectWithNodeHttp(input: {
  url: string;
  headers: Record<string, string>;
  timeoutMs: number;
}): Promise<B2NodeReadResponse> {
  return new Promise((resolve, reject) => {
    let parsed: URL;

    try {
      parsed = new URL(input.url);
    } catch (error) {
      reject(error);
      return;
    }

    const transport = parsed.protocol === "http:" ? http : https;
    const request = transport.request(
      parsed,
      {
        method: "GET",
        headers: input.headers,
        timeout: input.timeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode || 0,
            statusText: response.statusMessage || "",
            headers: response.headers,
            buffer: Buffer.concat(chunks),
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Backblaze B2 read timed out after ${input.timeoutMs}ms.`));
    });

    request.on("error", reject);
    request.end();
  });
}

async function readSignedB2ObjectWithRetry(input: {
  signedUrl: string;
  headers: Record<string, string>;
  key: string;
}): Promise<B2NodeReadResponse> {
  const attempts = numberEnv("B2_READ_RETRIES", 3, 1, 5);
  const timeoutMs = numberEnv("B2_READ_TIMEOUT_MS", 45000, 10000, 120000);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await readSignedB2ObjectWithNodeHttp({
        url: input.signedUrl,
        headers: input.headers,
        timeoutMs,
      });

      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      const shouldRetry = isRetryableB2Status(response.status) && attempt < attempts;
      if (!shouldRetry) return response;

      lastError = new Error(`Backblaze B2 object read failed (${response.status}): ${response.buffer.toString("utf8", 0, 500)}`);
    } catch (error) {
      lastError = error;

      if (!shouldRetryB2Error(error) || attempt >= attempts) {
        break;
      }
    }

    await sleep(Math.min(750 * attempt, 2500));
  }

  const message = String((lastError as any)?.message || lastError || "Backblaze B2 read failed");
  throw new Error(`Backblaze B2 object read failed for ${input.key}: ${message}`);
}

export async function readB2Object(key: string): Promise<B2ReadResult> {
  const objectKey = normalizeObjectKey(key);
  const signed = buildSignedRequest({
    method: "GET",
    key: objectKey,
  });

  const response = await readSignedB2ObjectWithRetry({
    signedUrl: signed.url,
    headers: signed.headers,
    key: objectKey,
  });

  if (response.status < 200 || response.status >= 300) {
    const text = response.buffer.toString("utf8", 0, 500);
    throw new Error(`Backblaze B2 object read failed (${response.status}): ${text}`);
  }

  const buffer = response.buffer;

  return {
    key: objectKey,
    bucket: signed.bucket,
    contentType: getHeaderValue(response.headers, "content-type") || "application/octet-stream",
    contentLength: Number(getHeaderValue(response.headers, "content-length") || buffer.byteLength || 0),
    etag: getHeaderValue(response.headers, "etag").replace(/"/g, ""),
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
