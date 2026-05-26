import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import admin from "firebase-admin";

export type RouteContext = {
  params?: { action?: string[] } | Promise<{ action?: string[] }>;
};

export type HealthJson = Record<string, any>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function json(payload: any, status = 200) {
  return NextResponse.json(payload, { status });
}

export function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function getAction(ctx: RouteContext): Promise<string> {
  const maybeParams: any = ctx?.params;
  const params = typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;
  return (params?.action || []).join("/").replace(/^\/+|\/+$/g, "").toLowerCase();
}

export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function env(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) throw new ApiError(`Missing ENV: ${name}`, 500);
  return value || "";
}

export function envFlag(name: string, fallback = false): boolean {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

export function normalizeEmail(email: any): string {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email: any): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function emailDocId(emailLower: string): string {
  return encodeURIComponent(String(emailLower || "").trim().toLowerCase()).replace(/\./g, "%2E");
}

export function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function timestampFromAny(value: any): any | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

export function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function escapeHtml(value: any): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a || "");
  const bBuf = Buffer.from(b || "");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function sanitizeOptionalUrl(value: any): string {
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

export function getComplianceMailingAddress(): string {
  return String(
    process.env.TRACKFLOW_MAILING_ADDRESS ||
      process.env.BUSINESS_MAILING_ADDRESS ||
      process.env.COMPANY_MAILING_ADDRESS ||
      "",
  ).trim();
}

export function buildComplianceAddressLine(prefix = "Mailing address: "): string {
  const address = escapeHtml(getComplianceMailingAddress());
  if (!address) return "";
  return `${prefix}${address}`;
}

export function stripDangerousHtml(input: any): string {
  let html = String(input || "");

  // Remove high-risk tags with their content.
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  // Remove self-closing or standalone high-risk tags.
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)\b[^>]*\/?\s*>/gi, "");
  // Remove inline event handlers like onclick/onload.
  html = html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  // Remove unsafe URL protocols from attributes/content.
  html = html.replace(/javascript\s*:/gi, "");
  html = html.replace(/data\s*:\s*text\/html/gi, "");
  html = html.replace(/vbscript\s*:/gi, "");

  return html.trim();
}

export function plainTextFromHtml(input: any): string {
  return String(input || "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWordsFromHtml(input: any): number {
  const text = plainTextFromHtml(input);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function countLinksFromHtml(input: any): number {
  return (String(input || "").match(/<a\s/gi) || []).length;
}

export function validateFollowupContent(html: string): { ok: boolean; reasons: string[]; words: number; links: number } {
  const words = countWordsFromHtml(html);
  const links = countLinksFromHtml(html);
  const reasons: string[] = [];

  if (!words) reasons.push("Follow-up body is empty");
  if (words > 120) reasons.push(`Follow-up is too long (${words}/120 words)`);
  if (links > 1) reasons.push(`Follow-up has too many links (${links}/1)`);

  return { ok: reasons.length === 0, reasons, words, links };
}

export function getEngagementMinuteOfDayUtc(ms: number): number {
  const date = new Date(ms);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function shiftMinuteOfDay(minuteOfDay: number, offsetMinutes: number): number {
  const total = 24 * 60;
  return ((Math.floor(minuteOfDay) + offsetMinutes) % total + total) % total;
}

export function scheduleBeforeEngagementTime(anchorEngagedMs: number, delayMinutes: number): number {
  if (!anchorEngagedMs) return 0;
  const safeDelay = Number.isFinite(delayMinutes) && delayMinutes > 0 ? delayMinutes : 1440;
  return anchorEngagedMs + (safeDelay - 60) * 60_000;
}
