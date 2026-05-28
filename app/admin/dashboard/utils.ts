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

export function decodeHtmlEntities(value: string) {
  let text = String(value || "");

  for (let i = 0; i < 2; i += 1) {
    const before = text;

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text;
      text = textarea.value;
    } else {
      text = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'");
    }

    if (text === before) break;
  }

  return text.replace(/\u00a0/g, " ");
}

function escapeHtmlForEditor(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextFromHtmlish(value: string) {
  return stripHtml(
    decodeHtmlEntities(value)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<\/li\s*>/gi, "\n"),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function hasHtmlTags(value: string) {
  return /<[a-z][\s\S]*>/i.test(decodeHtmlEntities(value));
}

function looksLikeEmailBody(value: string) {
  const decoded = decodeHtmlEntities(value);
  const plain = plainTextFromHtmlish(decoded);

  if (!plain) return false;
  if (hasHtmlTags(decoded)) return true;
  if (/\n{2,}/.test(decoded) || decoded.split(/\r?\n/).length >= 3) return true;
  if (plain.length > 160) return true;
  if (/\b(hi|hello|dear)\b[\s,!.:-]/i.test(plain)) return true;
  if (/\b(regards|best regards|thanks|thank you)\b/i.test(plain)) return true;
  if (/\b(view|open|review)\b.{0,80}\b(report|audit|tracking review)\b/i.test(plain)) return true;

  return false;
}

function looksLikeEmailSubject(value: string) {
  const plain = plainTextFromHtmlish(value);
  return Boolean(plain && plain.length <= 150 && !looksLikeEmailBody(value));
}

function extractSubjectLine(value: string) {
  const decoded = decodeHtmlEntities(value);
  const match = decoded.match(/^\s*(?:email\s*)?subject\s*[:\-]\s*(.+)$/im);
  if (!match) return "";

  return plainTextFromHtmlish(match[1] || "")
    .replace(/^subject\s*[:\-]\s*/i, "")
    .slice(0, 180)
    .trim();
}

function removeSubjectAndBodyLabels(value: string) {
  return decodeHtmlEntities(value)
    .replace(/^\s*(?:email\s*)?subject\s*[:\-].*?(?:\r?\n|$)/im, "")
    .replace(/^\s*(?:email\s*)?(?:body|message)\s*[:\-]\s*/im, "")
    .trim();
}

export function normalizeEmailSubjectForComposer(value: string) {
  const extracted = extractSubjectLine(value);
  const plain = plainTextFromHtmlish(extracted || value)
    .replace(/^\s*(?:email\s*)?subject\s*[:\-]\s*/i, "")
    .replace(/^\s*(?:email\s*)?(?:body|message)\s*[:\-]\s*/i, "")
    .trim();

  return plain.replace(/\s+/g, " ").slice(0, 180).trim();
}


export function isLikelyPlaceholderEmailSubject(
  value: string,
  context: {
    email?: string;
    name?: string;
    company?: string;
    website?: string;
    service?: string;
    mainIssue?: string;
    leadLabel?: string;
  } = {},
) {
  const subject = normalizeEmailSubjectForComposer(value);
  const lower = subject.toLowerCase();
  if (!lower) return true;
  if (lower.length < 6) return true;
  if (looksLikeEmailBody(value)) return true;
  if (/@/.test(lower) || /(?:https?:\/\/|www\.)/i.test(subject)) return true;

  const emailLocal = String(context.email || "").split("@")[0] || "";
  const websiteHost = String(context.website || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  const exactBadValues = [
    context.email,
    emailLocal,
    context.name,
    context.company,
    context.website,
    websiteHost,
    context.service,
    context.mainIssue,
    context.leadLabel,
  ]
    .map((item) => plainTextFromHtmlish(String(item || "")).toLowerCase())
    .filter(Boolean);

  if (exactBadValues.some((item) => item === lower)) return true;

  const genericRoleSubjects = new Set([
    "helpdesk",
    "help desk",
    "support",
    "info",
    "sales",
    "admin",
    "office",
    "contact",
    "enquiry",
    "enquiries",
    "inquiries",
    "possible contact person",
    "decision maker",
    "unknown",
    "not found",
    "n/a",
    "na",
    "none",
    "website",
    "homepage",
    "google ads",
    "server side tracking",
    "email signature",
  ]);

  if (genericRoleSubjects.has(lower)) return true;

  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2 && /\b(helpdesk|support|info|sales|admin|office|contact|enquir|inquir|person|website|homepage)\b/i.test(lower)) {
    return true;
  }

  return false;
}

export function normalizeEmailBodyHtmlForComposer(value: string) {
  const decoded = removeSubjectAndBodyLabels(value);
  if (!plainTextFromHtmlish(decoded)) return "";

  if (hasHtmlTags(decoded)) {
    return sanitizePreviewHtml(decoded) || decoded;
  }

  return decoded
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtmlForEditor(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function normalizeSheetEmailCopy(subjectValue: string, bodyValue: string) {
  let rawSubject = decodeHtmlEntities(subjectValue || "").trim();
  let rawBody = decodeHtmlEntities(bodyValue || "").trim();

  // Some Sheet rows can be shifted or can store the full generated email in the subject column.
  // If the subject column looks like a full message and the body column looks like a short subject, swap them safely.
  if (looksLikeEmailBody(rawSubject) && looksLikeEmailSubject(rawBody)) {
    const originalSubject = rawSubject;
    rawSubject = rawBody;
    rawBody = originalSubject;
  }

  const extractedSubject = extractSubjectLine(rawSubject) || extractSubjectLine(rawBody);
  const subjectCandidate = extractedSubject || rawSubject;
  const subject = looksLikeEmailBody(subjectCandidate) && !extractedSubject
    ? ""
    : normalizeEmailSubjectForComposer(subjectCandidate);

  let bodySource = rawBody;
  if (!plainTextFromHtmlish(bodySource) && looksLikeEmailBody(rawSubject)) {
    bodySource = rawSubject;
  }

  // If the body column only contains a short subject but the subject column has a full email, use the full email as body.
  if (looksLikeEmailSubject(rawBody) && looksLikeEmailBody(rawSubject)) {
    bodySource = rawSubject;
  }

  return {
    subject,
    bodyHtml: normalizeEmailBodyHtmlForComposer(bodySource),
  };
}
