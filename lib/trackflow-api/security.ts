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

export function requireWebhookSecret(req: Request, envName: "BREVO_WEBHOOK_SECRET" | "REPLY_WEBHOOK_SECRET") {
  const secret = req.headers.get("x-webhook-secret") || "";
  const expected = env(envName);
  if (!secret || !safeEqual(secret, expected)) throw new ApiError("Unauthorized webhook request", 401);
}
