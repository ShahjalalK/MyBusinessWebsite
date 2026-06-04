import { createHmac } from "crypto";
import admin from "firebase-admin";
import { ApiError, env, normalizeEmail, safeEqual } from "@/lib/trackflow-api/core";

function hmacHex(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function unsubscribeToken(emailLower: string): string {
  return hmacHex(emailLower, env("UNSUBSCRIBE_SECRET")).slice(0, 40);
}

export function unsubscribeUrl(emailLower: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://trackflowpro.com").replace(/\/+$/, "");
  const token = unsubscribeToken(emailLower);
  return `${base}/api/trackflow/unsubscribe?email=${encodeURIComponent(emailLower)}&token=${encodeURIComponent(token)}`;
}

export async function requireAdmin(req: Request) {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (process.env.ALLOW_UNAUTHENTICATED_ADMIN_API === "true") {
    if (isProduction) {
      throw new ApiError("Unsafe config: unauthenticated admin API is not allowed in production", 500);
    }
    return { uid: "dev-mode", email: "dev@local" };
  }

  const allowed = (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((x: string) => normalizeEmail(x))
    .filter(Boolean);

  if (allowed.length === 0) {
    throw new ApiError("Server misconfigured: ALLOWED_ADMIN_EMAILS must contain at least one admin email", 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new ApiError("Unauthorized: missing Firebase ID token", 401);
  }

  const idToken = authHeader.slice(7).trim();
  const decoded = await admin.auth().verifyIdToken(idToken);
  const userEmail = normalizeEmail(decoded.email || "");

  if (!userEmail || !allowed.includes(userEmail)) {
    throw new ApiError("Forbidden: this user is not allowed to use outreach API", 403);
  }

  return decoded;
}

export function requireCronSecret(req: Request) {
  const expected = env("CRON_SECRET");
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const candidates = [
    req.headers.get("x-cron-auth"),
    req.headers.get("x-cron-secret"),
    bearer,
    url.searchParams.get("secret"),
    url.searchParams.get("cron_secret"),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!candidates.some((secret) => safeEqual(secret, expected))) {
    throw new ApiError("Unauthorized cron request", 401);
  }
}

function basicAuthSecret(authHeader: string): string {
  const raw = String(authHeader || "").trim();
  if (!raw.toLowerCase().startsWith("basic ")) return "";

  try {
    const decoded = Buffer.from(raw.slice(6).trim(), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return decoded.trim();
    return decoded.slice(separatorIndex + 1).trim();
  } catch {
    return "";
  }
}

function authorizationToken(authHeader: string): string {
  const raw = String(authHeader || "").trim();
  if (!raw) return "";

  const lower = raw.toLowerCase();
  if (lower.startsWith("bearer ")) return raw.slice(7).trim();
  if (lower.startsWith("token ")) return raw.slice(6).trim();
  if (lower.startsWith("basic ")) return basicAuthSecret(raw);

  // Some webhook providers label the method as "Token" but send the token
  // as the full Authorization header value without a Bearer/Token prefix.
  return raw;
}

export function requireWebhookSecret(req: Request, envName: "BREVO_WEBHOOK_SECRET" | "REPLY_WEBHOOK_SECRET") {
  const expected = env(envName);
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization") || "";

  const candidates = [
    req.headers.get("x-webhook-secret"),
    req.headers.get("x-brevo-webhook-secret"),
    req.headers.get("x-sendinblue-webhook-secret"),
    req.headers.get("x-webhook-token"),
    req.headers.get("x-auth-token"),
    req.headers.get("x-api-key"),
    req.headers.get("token"),
    authorizationToken(authHeader),
    url.searchParams.get("secret"),
    url.searchParams.get("webhook_secret"),
    url.searchParams.get("token"),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!candidates.some((secret) => safeEqual(secret, expected))) {
    throw new ApiError("Unauthorized webhook request", 401);
  }
}
