import type { ServiceId } from "./types";

export function stripHtml(html: string) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePreviewHtml(html: string) {
  if (typeof window === "undefined") return "";

  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  template.content.querySelectorAll("script, iframe, object, embed, link, meta, style").forEach((node) => node.remove());

  template.content.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
        return;
      }

      if (["href", "src", "xlink:href"].includes(name)) {
        const lower = value.toLowerCase();
        const isSafe =
          lower.startsWith("http://") ||
          lower.startsWith("https://") ||
          lower.startsWith("mailto:") ||
          lower.startsWith("tel:") ||
          lower.startsWith("#") ||
          lower.startsWith("/");

        if (!isSafe) element.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

export function countWordsFromHtml(html: string) {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

export function countLinksFromHtml(html: string) {
  return (String(html || "").match(/<a\s/gi) || []).length;
}

export function getFollowupRiskLabel(html: string) {
  const words = countWordsFromHtml(html);
  const links = countLinksFromHtml(html);
  if (words > 120 || links > 1) return { label: "Needs cleanup", tone: "bg-red-50 text-red-600 border-red-100" };
  if (words > 80 || links === 1) return { label: "Review", tone: "bg-amber-50 text-amber-700 border-amber-100" };
  return { label: "Clean", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" };
}

export function isEmailPatternValid(inputEmail: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail);
}

export function makeNameFromEmail(email: string) {
  const local = email.split("@")[0] || "Sender";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}

export function normalizeOptionalUrl(value: string) {
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

export function emailStatsDocId(email: string) {
  return encodeURIComponent(String(email || "").trim().toLowerCase()).replace(/\./g, "%2E");
}

export function todayKeyDhaka(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function toMillis(time: any): number {
  if (!time) return 0;
  if (typeof time.toMillis === "function") return time.toMillis();
  if (typeof time.seconds === "number") return time.seconds * 1000;
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function monthKeyFromMillis(value: any) {
  const millis = toMillis(value);
  if (!millis) return "";
  const date = new Date(millis);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getRecentMonthOptions(count = 18) {
  const options: { value: string; label: string }[] = [];
  const start = new Date();
  start.setDate(1);

  for (let i = 0; i < count; i += 1) {
    const date = new Date(start);
    date.setMonth(start.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-GB", { month: "short", year: "numeric" });
    options.push({ value, label });
  }

  return options;
}

export function formatDate(timestamp: any) {
  const millis = toMillis(timestamp);
  if (millis === 0) return "N/A";
  return new Date(millis).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function toDateTimeLocalInput(timestamp: any) {
  const millis = toMillis(timestamp);
  if (!millis) return "";
  const date = new Date(millis);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function normalizeSheetService(value: string): ServiceId {
  const text = String(value || "").toLowerCase();
  if (text.includes("signature")) return "Email Signature";
  if (text.includes("server") || text.includes("sst")) return "Server Side Tracking";
  return "Google Ads";
}

export function applyMergeTags(html: string, data: { name?: string; company?: string; website?: string; service?: string }) {
  return String(html || "")
    .replace(/{name}/g, data.name || "there")
    .replace(/{company}/g, data.company || "your company")
    .replace(/{website}/g, data.website || "your website")
    .replace(/{service}/g, data.service || "our service");
}
