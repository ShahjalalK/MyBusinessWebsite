import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import ReportChatAssistant from "@/app/components/trackflow/ReportChatAssistant";
import SecureReportAnalytics from "@/app/components/trackflow/SecureReportAnalytics";
import type { ReportChatQuestionContext } from "@/app/components/trackflow/reportChatQuestions";
import Image from "next/image";

export const dynamic = "force-dynamic";

const DEFAULT_METADATA: Metadata = {
  title: "Private Tracking Review | TrackFlow Pro",
  description: "A private browser-visible tracking review prepared by TrackFlow Pro.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type ReportPageProps = {
  params: Promise<{ domainSlug: string; token: string }> | { domainSlug: string; token: string };
};

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
  target?: string;
  rel?: string;
  analyticsEvent?: string;
  analyticsSection?: string;
  analyticsLabel?: string;
};

type ManualAdsTransparency = {
  checked: boolean;
  adsFound: "yes" | "no" | "unknown";
  source: string;
  note: string;
  checkedAt: string;
};

type EvidenceVideoDisplay = {
  title: string;
  description: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  videoId: string;
  provider: "youtube";
};

const DEFAULT_CHECKS = [
  "GA4 and Google Tag Manager browser-visible signals",
  "Google Ads conversion and remarketing request signals",
  "Lead form or enquiry-path tracking indicators",
  "Server-side or first-party tracking-like request signals",
];

const DEFAULT_PROOF_POINTS = [
  "The review is based on public browser-visible evidence captured from the website.",
  "Final account-level confirmation requires access to GA4, GTM, Google Ads, CRM, or server logs.",
];

const DEFAULT_RECOMMENDATIONS = [
  "Verify the main lead journey inside GTM Preview, GA4 DebugView, and Google Ads conversion diagnostics.",
  "Confirm final lead recording inside the ad account, analytics property, CRM, or server logs before making final tracking decisions.",
];

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_TRACKFLOW_CONTACT_EMAIL || "shahjalal@trackflowpro.com";
const LINKEDIN_URL = process.env.NEXT_PUBLIC_TRACKFLOW_LINKEDIN_URL || "https://www.linkedin.com/in/shahjalal-khan/";
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_TRACKFLOW_CALENDLY_URL ||
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "";
const MAILING_ADDRESS =
  process.env.NEXT_PUBLIC_TRACKFLOW_MAILING_ADDRESS ||
  process.env.TRACKFLOW_MAILING_ADDRESS ||
  process.env.BUSINESS_MAILING_ADDRESS ||
  "Business mailing address available on request";

const TRUST_SIGNALS = [
  "Prepared from public browser-visible evidence",
  "No GA4, GTM, Google Ads, CRM, or server login was used",
  "Final confirmation requires account-level access",
];


function normalizeToken(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function normalizeSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function containsBengali(value: unknown): boolean {
  return /[\u0980-\u09FF]/.test(String(value || ""));
}

function cleanText(value: unknown, fallback = ""): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || containsBengali(text)) return fallback;
  return text;
}

function normalizeYouTubeId(value: unknown): string {
  const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return /^[a-zA-Z0-9_-]{8,32}$/.test(id) ? id : "";
}

function extractYouTubeId(value: unknown): string {
  const raw = cleanText(value, "");
  if (!raw) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") return normalizeYouTubeId(url.pathname.split("/").filter(Boolean)[0]);

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return normalizeYouTubeId(watchId);

      const parts = url.pathname.split("/").filter(Boolean);
      const markerIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part.toLowerCase()));
      if (markerIndex >= 0) return normalizeYouTubeId(parts[markerIndex + 1]);
    }
  } catch {}

  return normalizeYouTubeId(raw);
}

function getYouTubeThumbnailUrl(videoId: string): string {
  const cleanId = normalizeYouTubeId(videoId);
  if (!cleanId) return "";

  // hqdefault is more reliable than maxresdefault because not every YouTube upload
  // has a generated max-resolution thumbnail. This keeps the audit video preview visible.
  return `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
}

function getEvidenceVideoDisplay(report: Record<string, any>): EvidenceVideoDisplay | null {
  const raw = getObjectCandidate(report.evidenceVideo, report.evidence_video, report.videoEvidence, report.video_evidence, report.video);
  const status = cleanText(report.evidenceVideoStatus || report.evidence_video_status || raw.status, "").toLowerCase();
  if (status === "removed" || raw.enabled === false) return null;

  const videoId =
    extractYouTubeId(report.evidenceVideoUrl || report.evidence_video_url || raw.videoUrl || raw.video_url || raw.youtubeUrl || raw.youtube_url || raw.url) ||
    normalizeYouTubeId(report.youtubeVideoId || report.youtube_video_id || raw.youtubeVideoId || raw.youtube_video_id || raw.videoId || raw.video_id);

  if (!videoId) return null;

  return {
    provider: "youtube",
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`,
    thumbnailUrl: getYouTubeThumbnailUrl(videoId),
    title: cleanText(report.evidenceVideoTitle || report.evidence_video_title || raw.title, "Short browser-side evidence walkthrough"),
    description: cleanText(
      report.evidenceVideoDescription || report.evidence_video_description || raw.description,
      "This optional video shows browser-visible evidence from the review. Final confirmation still requires GA4, GTM, Google Ads, CRM, or server access.",
    ),
  };
}

function escapeHtmlAttribute(value: unknown): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getPdfLitePreviewSrcDoc(previewHref: string): string {
  const href = escapeHtmlAttribute(previewHref);

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a}.wrap{height:100%;display:grid;place-items:center;padding:24px;box-sizing:border-box}.card{max-width:420px;width:100%;border:1px solid #e2e8f0;border-radius:24px;background:white;padding:24px;box-sizing:border-box;text-align:center;box-shadow:0 18px 50px rgba(15,23,42,.08)}.icon{display:grid;place-items:center;width:54px;height:54px;margin:0 auto 14px;border-radius:18px;background:#eff6ff;color:#2563eb;font-size:24px;font-weight:900}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#2563eb}.title{margin:9px 0 0;font-size:20px;font-weight:900;line-height:1.15;letter-spacing:-.03em}.text{margin:10px 0 18px;font-size:14px;font-weight:700;line-height:1.65;color:#64748b}.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;width:100%;border-radius:16px;background:#0f172a;color:white;font-size:13px;font-weight:900;text-decoration:none}.note{margin-top:12px;font-size:12px;font-weight:700;color:#94a3b8}</style></head><body><div class="wrap"><div class="card"><div class="icon">PDF</div><div class="eyebrow">Secure document</div><h1 class="title">Load PDF preview</h1><p class="text">The PDF preview is loaded only when needed to keep this secure review fast.</p><a class="button" href="${href}">Load preview here</a><div class="note">Open PDF and Download PDF are also available below.</div></div></div></body></html>`;
}



function getObjectCandidate(...values: unknown[]): Record<string, any> {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  }
  return {};
}

function getPrivateReportCopy(report: Record<string, any>): Record<string, any> {
  return getObjectCandidate(
    report.privateReportCopy,
    report.private_report_copy,
    report.privateReportPage,
    report.private_report_page,
    report.aiPrivateReportCopy,
    report.ai_private_report_copy,
  );
}

type ManualEvidenceHero = {
  enabled: boolean;
  title: string;
  summary: string;
  verificationMessage: string;
  businessImpact: string;
  actionLabel: string;
  expectedEvent: string;
  observedEvent: string;
  tool: string;
  actionCompleted: string;
  ga4Status: string;
  googleAdsStatus: string;
  gtmStatus: string;
  testUrl: string;
  operatorNote: string;
  disclaimer: string;
  severity: "high" | "medium" | "low" | string;
};

function normalizeManualHeroUrl(value: unknown): string {
  const raw = cleanText(value, "");
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return `${url.protocol}//${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
  }
}

function normalizeManualEvidenceActionKey(actionType: unknown, actionLabel: unknown): string {
  const text = `${cleanText(actionType, "")} ${cleanText(actionLabel, "")}`
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (/phone|call|click to call/.test(text)) return "phone_call";
  if (/booking|appointment|reservation|schedule/.test(text)) return "booking";
  if (/purchase|checkout|begin checkout|cart|add to cart|order|ecommerce|shop/.test(text)) return "ecommerce";
  if (/whatsapp/.test(text)) return "whatsapp";
  if (/email click|mailto|email enquiry/.test(text)) return "email_click";
  return "form_submission";
}

function isGenericManualEvidenceDisclaimer(value: string): boolean {
  const text = cleanText(value, "").toLowerCase();
  if (!text) return true;

  return (
    /browser-visible manual evidence only/.test(text) ||
    /call-tracking/.test(text) ||
    /booking engine/.test(text) ||
    /crm, call-tracking, booking engine/.test(text) ||
    /actual tracking accounts/.test(text)
  );
}

function getActionSpecificManualDisclaimer(rawDisclaimer: unknown, actionKey: string): string {
  const provided = cleanText(rawDisclaimer, "");

  const dynamicDisclaimer =
    actionKey === "phone_call"
      ? "This is browser-visible manual evidence only. Final call tracking should be confirmed inside GA4, GTM, Google Ads call conversions, the call-tracking platform, CRM, or server records."
      : actionKey === "booking"
        ? "This is browser-visible manual evidence only. Final booking recording should be confirmed inside GA4, GTM, Google Ads, the booking platform, CRM, or server records."
        : actionKey === "ecommerce"
          ? "This is browser-visible manual evidence only. Final cart, checkout, or purchase recording should be confirmed inside GA4, GTM, Google Ads, the ecommerce platform, order records, or server records."
          : actionKey === "whatsapp"
            ? "This is browser-visible manual evidence only. Final WhatsApp enquiry recording should be confirmed inside GA4, GTM, Google Ads, WhatsApp or CRM records, and server records where relevant."
            : actionKey === "email_click"
              ? "This is browser-visible manual evidence only. Final email enquiry recording should be confirmed inside GA4, GTM, Google Ads, the CRM, inbox records, or server records."
              : "This is browser-visible manual evidence only. Final lead/form submission recording should be confirmed inside GA4, GTM, Google Ads, the CRM, form inbox, email notification records, or server records.";

  if (provided && !isGenericManualEvidenceDisclaimer(provided)) return provided;
  return dynamicDisclaimer;
}

function getManualEvidenceHero(report: Record<string, any>, privateReportCopy: Record<string, any>): ManualEvidenceHero | null {
  const raw = getObjectCandidate(
    privateReportCopy.manualEvidenceHero,
    privateReportCopy.manual_evidence_hero,
    report.manualEvidenceHero,
    report.manual_evidence_hero,
  );

  if (!raw.enabled) return null;

  const title = cleanText(raw.title || raw.headline, "");
  const summary = cleanText(raw.summary || raw.description, "");
  const expectedEvent = cleanText(raw.expectedEvent || raw.expected_event, "");
  const observedEvent = cleanText(raw.observedEvent || raw.observed_event || raw.observedEventName || raw.observed_event_name, "");
  const actionLabel = cleanText(raw.actionLabel || raw.action_label || raw.label, "Selected conversion action");
  const actionKey = normalizeManualEvidenceActionKey(raw.actionType || raw.action_type, actionLabel);

  if (!title || !summary) return null;

  return {
    enabled: true,
    title,
    summary,
    verificationMessage: cleanText(
      raw.verificationMessage || raw.verification_message,
      expectedEvent
        ? `Expected event to verify: ${expectedEvent}. Observed result: ${observedEvent || "Not clearly observed"}. This should be confirmed inside GA4, GTM, Google Ads, and the relevant backend/account systems.`
        : "The selected conversion action should be verified inside GA4, GTM, Google Ads, and the relevant backend/account systems.",
    ),
    businessImpact: cleanText(
      raw.businessImpact || raw.business_impact,
      "If this is a key customer action, the tracking setup should be verified before relying on campaign optimization or reporting.",
    ),
    actionLabel,
    expectedEvent,
    observedEvent: observedEvent || "Not clearly observed",
    tool: cleanText(raw.tool, "Manual Tag Assistant / GA4 / GTM review"),
    actionCompleted: cleanText(raw.actionCompleted || raw.action_completed, "Unclear / needs verification"),
    ga4Status: cleanText(raw.ga4Status || raw.ga4_status, "Unclear / needs verification"),
    googleAdsStatus: cleanText(raw.googleAdsStatus || raw.google_ads_status, "Unclear / needs verification"),
    gtmStatus: cleanText(raw.gtmStatus || raw.gtm_status, "Unclear / needs verification"),
    testUrl: normalizeManualHeroUrl(raw.testUrl || raw.test_url),
    operatorNote: cleanText(raw.operatorNote || raw.operator_note, ""),
    disclaimer: getActionSpecificManualDisclaimer(raw.disclaimer, actionKey),
    severity: cleanText(raw.severity, "medium"),
  };
}

function cleanListItemText(item: unknown): string {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const record = item as Record<string, any>;
    const title = cleanText(record.title || record.label || record.name || record.text, "");
    const description = cleanText(record.description || record.summary || record.detail, "");
    if (title && description && title.toLowerCase() !== description.toLowerCase()) return `${title}: ${description}`;
    return title || description;
  }

  return cleanText(item, "");
}


function normalizeDisplayText(value: unknown): string {
  return cleanText(value, "")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUrlNoise(value: string): string {
  return normalizeDisplayText(value)
    .replace(/https?:\/\/[^\s›>]+/gi, " ")
    .replace(/www\.[^\s›>]+/gi, " ")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s›>]*)?/gi, " ")
    .replace(/[›»]+\s*[^|,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      const upperWords = new Set(["dds", "dmd", "md", "pc", "llc", "pllc", "inc", "ltd", "ga4", "gtm"]);
      if (upperWords.has(lower)) return lower.toUpperCase();
      if (lower.length <= 2 && ["of", "at", "in", "on", "by", "to", "&"].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\bAnd\b/g, "and")
    .trim();
}

function splitCompactDomainName(value: string): string[] {
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!compact) return [];

  const knownWords = [
    "orthodontics",
    "orthodontic",
    "chiropractic",
    "pediatrics",
    "consultants",
    "consulting",
    "construction",
    "restaurant",
    "technology",
    "solutions",
    "marketing",
    "madison",
    "dentistry",
    "dental",
    "medical",
    "wellness",
    "physical",
    "therapy",
    "pediatric",
    "security",
    "cleaning",
    "services",
    "service",
    "digital",
    "design",
    "studio",
    "agency",
    "center",
    "centre",
    "health",
    "clinic",
    "smiles",
    "smile",
    "group",
    "legal",
    "lawyers",
    "repair",
    "roofing",
    "plumbing",
    "electric",
    "beauty",
    "travel",
    "estate",
    "finance",
    "insurance",
    "media",
    "tech",
    "auto",
    "care",
    "home",
    "homes",
    "real",
    "spa",
    "art",
    "arts",
    "law",
  ].sort((a, b) => b.length - a.length);

  const output: string[] = [];
  let index = 0;

  while (index < compact.length) {
    const match = knownWords.find((word) => compact.startsWith(word, index));
    if (match) {
      output.push(match);
      index += match.length;
      continue;
    }

    const nextKnownIndex = knownWords
      .map((word) => compact.indexOf(word, index + 1))
      .filter((pos) => pos > index)
      .sort((a, b) => a - b)[0];

    if (nextKnownIndex && nextKnownIndex > index) {
      output.push(compact.slice(index, nextKnownIndex));
      index = nextKnownIndex;
      continue;
    }

    output.push(compact.slice(index));
    break;
  }

  return output.filter(Boolean);
}

function domainToDisplayName(domain: string): string {
  const cleanDomain = getDomainLabel({ domain });
  if (!cleanDomain) return "";

  const withoutTld = cleanDomain.split(".")[0] || cleanDomain;
  const spaced = withoutTld.replace(/[._-]+/g, " ").trim();

  if (spaced.includes(" ")) return titleCaseWords(spaced);

  const parts = splitCompactDomainName(spaced);
  const readable = parts.length > 1 ? parts.join(" ") : spaced;
  return titleCaseWords(readable);
}

function isGenericBusinessNameSegment(value: string): boolean {
  const text = normalizeDisplayText(value).toLowerCase();
  if (!text) return true;
  if (/^\(?\+?\d[\d\s().-]{6,}\)?$/.test(text)) return true;
  if (/^(home|homepage|blog|articles?|news|privacy|terms|contact|contact us|about|services?|reviews?)$/.test(text)) return true;
  if (/^(request|book|schedule|make|apply|get|view|download)\b/i.test(text) && text.length < 45) return true;
  if (/\b(appointment|appoinment|consultation|quote|call now|new patients?|apply for financing|request an?)\b/i.test(text) && text.length < 60) return true;
  if (/^[\d\s()+.-]+$/.test(text)) return true;
  return false;
}

function pickBestNameSegment(value: string): string {
  const raw = normalizeDisplayText(value);
  if (!raw) return "";

  const segments = raw
    .split(/\s*[|·•»›]\s*/g)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (segments.length <= 1) return raw;

  const cleanSegments = segments
    .map((item) => item.replace(/\(?\+?\d[\d\s().-]{6,}\)?/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((item) => !isGenericBusinessNameSegment(item));

  if (cleanSegments.length) return cleanSegments[cleanSegments.length - 1];
  return segments[0];
}

function isMessyBusinessName(value: string, domain = ""): boolean {
  const text = normalizeDisplayText(value);
  const lower = text.toLowerCase();
  const domainLower = domain.toLowerCase();

  if (!text) return true;
  if (isGenericBusinessNameSegment(text)) return true;
  if (/https?:\/\//i.test(text) || /www\./i.test(text) || /\bhttps?\b/i.test(text)) return true;
  if (/\b(event catering https|event catering|restaurant food service|food service|local service|lead generation|professional service)\b/i.test(text) && !/\balsies\b/i.test(text)) return true;
  if (/[›»]/.test(text)) return true;
  if (domainLower && lower.includes(domainLower)) return true;
  if (/\.com|\.net|\.org|\.co|\.io|\.us|\.uk/i.test(text)) return true;
  if (text.length > 72) return true;
  if (/\bnear me\b/i.test(text)) return true;
  if (/\bservices?\b/i.test(text) && text.length > 45) return true;
  if (/\bspecialist\b/i.test(text) && text.length > 45) return true;
  return false;
}


function preserveExactCompanyDisplayName(value: unknown): string {
  const text = normalizeDisplayText(value)
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.length < 2 || text.length > 90) return "";
  if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) return "";
  if (/\b(homepage|official site|contact|services|privacy|terms)\b/i.test(text) && text.length < 30) return "";
  if (/\.[a-z]{2,}$/i.test(text) || /^[A-Z0-9][A-Z0-9 .&'’.-]{1,90}$/i.test(text)) return text;
  return "";
}

function cleanBusinessNameCandidate(value: unknown, domain = ""): string {
  let text = pickBestNameSegment(stripUrlNoise(normalizeDisplayText(value)));
  if (!text) return "";

  if (domain) {
    const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escapedDomain, "ig"), " ");
  }

  text = pickBestNameSegment(text)
    .replace(/\s+-\s+(?:Home|Official Site|Services?|About|Contact|Blog)\b.*$/gi, "")
    .replace(/\s+\b(?:Home|Homepage|Official Site|Blog|Articles?)\b$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function getDisplayCompanyName(report: Record<string, any>, domain: string): string {
  const candidates = [
    report.companyName,
    report.company_name,
    report.businessName,
    report.business_name,
    report.displayCompanyName,
    report.display_company_name,
    report.clientName,
    report.client_name,
    report.preparedFor,
    report.prepared_for,
  ];

  for (const candidate of candidates) {
    const exact = preserveExactCompanyDisplayName(candidate);
    if (exact) return exact;

    const cleaned = cleanBusinessNameCandidate(candidate, domain);
    if (cleaned && !isMessyBusinessName(cleaned, domain)) return cleaned;
  }

  const fromDomain = domainToDisplayName(domain);
  return fromDomain || "this website";
}

function isMessyHeadline(value: string, domain = ""): boolean {
  const text = normalizeDisplayText(value);
  const lower = text.toLowerCase();
  const domainLower = domain.toLowerCase();

  if (isGenericHeadline(text)) return true;
  if (/https?:\/\//i.test(text) || /www\./i.test(text) || /\bhttps?\b/i.test(text)) return true;
  if (/\b(event catering https|event catering|restaurant food service|food service|local service|lead generation|professional service)\b/i.test(text) && !/\balsies\b/i.test(text)) return true;
  if (/[›»]/.test(text)) return true;
  if (domainLower && lower.includes(domainLower)) return true;
  if (/\.com|\.net|\.org|\.co|\.io|\.us|\.uk/i.test(text)) return true;
  if (text.length > 92) return true;
  if (/\bservices?\b/i.test(text) && text.length > 60) return true;
  if (/\bspecialist\b/i.test(text) && text.length > 45) return true;
  return false;
}

function getDisplayHeadline(report: Record<string, any>, companyName: string, domain: string): string {
  const privateCopy = getPrivateReportCopy(report);
  const raw = cleanBusinessNameCandidate(
    privateCopy.headline ||
      privateCopy.privatePageHeadline ||
      report.headline ||
      report.reportHeadline ||
      report.report_headline,
    domain,
  );
  if (raw && !isMessyHeadline(raw, domain)) return raw;

  const label = companyName === "this website" ? "This Website" : companyName;
  return `Tracking Review for ${label}`;
}

function getDisplayCtaText(value: unknown): string {
  const text = cleanText(value, "");
  if (!text || text.length > 70) return "Check if your enquiry tracking is working";
  return text;
}

function getReportScoreValue(report: Record<string, any>): number | undefined {
  const candidates = [
    report.score,
    report.auditScore,
    report.audit_score,
    report.trackingScore,
    report.tracking_score,
    report.trackingOpportunityScore,
    report.tracking_opportunity_score,
    report.opportunityScore,
    report.opportunity_score,
  ];

  for (const candidate of candidates) {
    const numberValue =
      typeof candidate === "number"
        ? candidate
        : Number.parseFloat(String(candidate || "").replace(/[^0-9.]/g, ""));

    if (Number.isFinite(numberValue)) {
      return Math.max(0, Math.min(100, Math.round(numberValue)));
    }
  }

  return undefined;
}

function getReportScoreLabel(report: Record<string, any>): string {
  return cleanText(
    report.scoreLabel ||
      report.score_label ||
      report.auditScoreLabel ||
      report.audit_score_label ||
      report.priorityLabel ||
      report.priority_label ||
      report.trackingOpportunityLabel ||
      report.tracking_opportunity_label,
    "",
  );
}

function getPrimaryConversionFocus(report: Record<string, any>, privateReportCopy: Record<string, any>): string {
  return cleanText(
    privateReportCopy.primaryConversionLabel ||
      privateReportCopy.primary_conversion_label ||
      report.primaryConversionLabel ||
      report.primary_conversion_label ||
      privateReportCopy.primaryConversionFocus ||
      privateReportCopy.primary_conversion_focus ||
      report.primaryConversionFocus ||
      report.primary_conversion_focus ||
      report.primaryConversionAction ||
      report.primary_conversion_action ||
      report.conversionActionContext ||
      report.conversion_action_context ||
      report.primaryConversion ||
      report.primary_conversion,
    "",
  );
}

function getBusinessTypeLabel(report: Record<string, any>, privateReportCopy: Record<string, any>): string {
  return cleanText(
    privateReportCopy.businessType ||
      privateReportCopy.business_type ||
      report.businessType ||
      report.business_type ||
      report.businessCategory ||
      report.business_category ||
      report.category ||
      "",
    "",
  );
}

function isAlertSignupReview(report: Record<string, any>, privateReportCopy: Record<string, any>): boolean {
  const blob = [
    report.headline,
    report.mainFinding,
    report.mainIssue,
    report.primaryConversionFocus,
    report.primary_conversion_focus,
    report.primaryConversion,
    report.primary_conversion,
    report.primaryConversionAction,
    report.primary_conversion_action,
    privateReportCopy.headline,
    privateReportCopy.mainFinding,
    privateReportCopy.primaryConversionFocus,
    privateReportCopy.primaryConversionLabel,
    privateReportCopy.primaryConversion,
    privateReportCopy.actionLabel,
    privateReportCopy.pathLabel,
    privateReportCopy.auditSnapshotTitle,
    ...(Array.isArray(privateReportCopy.auditSnapshotQuestions) ? privateReportCopy.auditSnapshotQuestions : []),
    ...(Array.isArray(privateReportCopy.recommendations) ? privateReportCopy.recommendations.map((item) => cleanListItemText(item)) : []),
  ].filter(Boolean).join(" ").toLowerCase();

  return /newsletter[_\s-]*subscription|alert signup|notification form|sign up for alerts|register to be notified|sms\/email|sms|customer opt-in|customer opt in|subscribe/.test(blob);
}

function normalizeAlertSignupText(value: string): string {
  return normalizeDisplayText(value)
    .replace(/\blead form, contact, and enquiry actions\b/gi, "alert signup and notification form actions")
    .replace(/\blead form and contact journey\b/gi, "alert signup / notification form journey")
    .replace(/\blead form tracking snapshot\b/gi, "Alert Signup Form tracking snapshot")
    .replace(/\blead form tracking\b/gi, "alert signup form tracking")
    .replace(/\blead form and enquiry-path tracking\b/gi, "alert signup and notification form tracking")
    .replace(/\blead form submissions\b/gi, "alert signup and notification form submissions")
    .replace(/\blead path\b/gi, "alert signup path")
    .replace(/\blead journey\b/gi, "alert signup journey")
    .replace(/\benquiry actions\b/gi, "notification form actions")
    .replace(/\bcontact journey\b/gi, "notification form journey")
    .trim();
}

function alertSignupVerificationPlan(): string[] {
  return [
    "Run one controlled alert signup / notification form test from the website.",
    "Confirm sign_up, subscribe, generate_lead, or form_submit signals in GTM Preview, GA4 DebugView, and Google Ads diagnostics.",
    "Match the same test with the CRM, form platform, SMS/email platform, or server records where relevant.",
    "Separate browser-visible evidence from final account-side confirmation.",
  ];
}

function alertSignupCheckedItems(existing: string[]): string[] {
  return cleanList(
    [
      "Alert signup and notification form journey signals.",
      "GA4, Google Tag Manager, Google Ads, and first-party/server-side tracking signals.",
      ...existing.map(normalizeAlertSignupText),
    ],
    DEFAULT_CHECKS,
    6,
  );
}

function alertSignupSnapshotQuestions(): string[] {
  return [
    "Are alert signup and notification form actions recorded clearly inside the relevant accounts?",
    "Which browser-visible tracking signals were observed?",
    "What needs confirmation inside GA4, GTM, Google Ads, CRM, SMS/email platform, or server logs?",
  ];
}


function cleanList(value: unknown, fallback: string[] = [], maxItems = 8): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const text = cleanListItemText(item);
    if (!text || seen.has(text.toLowerCase())) continue;

    seen.add(text.toLowerCase());
    output.push(text);

    if (output.length >= maxItems) break;
  }

  return output.length ? output : fallback.slice(0, maxItems);
}


function polishClientFacingEvidenceText(value: string, hasCallTrackingContext = false): string {
  let text = normalizeDisplayText(value);
  if (!text) return "";

  if (!hasCallTrackingContext) {
    text = text
      .replace(/,?\s*call-tracking,?\s*or\s+server logs\s+where relevant/gi, " and lead records")
      .replace(/,?\s*call-tracking,?\s*or\s+server records\s+where relevant/gi, " and lead records")
      .replace(/,?\s*call-tracking\s+where relevant/gi, "")
      .replace(/\bCRM,\s*call-tracking,\s*or\s*server logs\s*where relevant\b/gi, "CRM or lead notification records")
      .replace(/\bCRM,\s*call-tracking,\s*or\s*server records\s*where relevant\b/gi, "CRM or lead notification records");
  }

  return text.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

function cleanSignalCards(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    const label = cleanListItemText(item);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    output.push(label);
    if (output.length >= 8) break;
  }
  return output;
}

function cleanReviewedPageLabels(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [];
  const output: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, any>;
    const url = cleanText(record.url || record.pageUrl || record.page_url, "");
    if (!url) continue;
    const label = cleanText(record.label || record.pageLabel || record.page_label || record.role, "Reviewed page");
    const action = cleanText(record.actionLabel || record.action_label, "");
    const text = action ? `${label}: ${url} (${action})` : `${label}: ${url}`;
    if (seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= 4) break;
  }
  return output;
}


function normalizeAdsFound(value: unknown): "yes" | "no" | "unknown" {
  const text = cleanText(value, "").toLowerCase();
  if (["yes", "true", "1", "found", "ads_found", "active", "running"].includes(text)) return "yes";
  if (["no", "false", "0", "not_found", "none", "no_ads"].includes(text)) return "no";
  return "unknown";
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = cleanText(value, "").toLowerCase();
  return ["1", "true", "yes", "y", "checked", "found", "active", "running"].includes(text);
}

function getManualAdsTransparency(report: Record<string, any>): ManualAdsTransparency {
  const privateCopy = getPrivateReportCopy(report);
  const raw = getObjectCandidate(
    report.manualAdsTransparency,
    report.manual_ads_transparency,
    privateCopy.manualAdsTransparency,
    privateCopy.manual_ads_transparency,
  );

  const adsFound = normalizeAdsFound(
    raw.adsFound ?? raw.ads_found ?? report.manual_ads_found ?? report.manualAdsFound,
  );
  const checked = Boolean(
    raw.checked === true ||
      toBoolean(raw.checked) ||
      toBoolean(report.manual_ads_checked) ||
      toBoolean(report.manualAdsChecked) ||
      adsFound !== "unknown",
  );

  return {
    checked,
    adsFound,
    source: cleanText(raw.source || raw.manual_ads_source || report.manual_ads_source || "Google Ads Transparency", "Google Ads Transparency"),
    note: cleanText(raw.note || raw.manual_ads_note || report.manual_ads_note, ""),
    checkedAt: cleanText(raw.checkedAt || raw.checked_at || report.manual_ads_checked_at || report.manualAdsCheckedAt, ""),
  };
}

function getManualAdsSummary(manualAds: ManualAdsTransparency): string {
  if (!manualAds.checked) return "";
  if (manualAds.adsFound === "yes") {
    return "Google Ads activity was manually checked through Ads Transparency. This adds paid-traffic context, but final conversion recording still requires account-level verification.";
  }
  if (manualAds.adsFound === "no") {
    return "Ads Transparency was manually checked and no active Google Ads were noted at the time of review. Browser-visible tracking evidence should still be verified where needed.";
  }
  return "Ads Transparency was manually checked, but the ad activity result was left as unsure. Account-level verification is still recommended before making final tracking decisions.";
}

function formatDate(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return "";

  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDomainLabel(report: Record<string, any>): string {
  const raw = cleanText(report.domain || report.websiteUrl || report.website, "");
  if (!raw) return "";

  const urlLike = raw.match(/https?:\/\/[^\s›>]+/i)?.[0];
  const domainLike = raw.match(/(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+/i)?.[0];
  const candidate = urlLike || domainLike || raw;

  try {
    const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return candidate
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("›")[0]
      .trim();
  }
}

function sentenceCaseFirst(value: string): string {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isGenericHeadline(value: string): boolean {
  const text = value.toLowerCase().trim();
  return !text || text === "private tracking audit review" || text === "private tracking audit note" || text === "tracking audit note";
}

function cleanCtaTarget(value: unknown): string {
  const raw = cleanText(value, "/contact");
  if (!raw) return "/contact";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, 500);

  try {
    const url = new URL(raw);
    if (["http:", "https:"].includes(url.protocol)) return url.toString().slice(0, 700);
  } catch {}

  return "/contact";
}

function cleanExternalBookingUrl(value: unknown): string {
  const raw = cleanText(value, "");
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (["http:", "https:"].includes(url.protocol)) return url.toString().slice(0, 700);
  } catch {}

  return "";
}

function getBookingUrl(report: Record<string, any>, privateReportCopy: Record<string, any>): string {
  return cleanExternalBookingUrl(
    privateReportCopy.bookingUrl ||
      privateReportCopy.booking_url ||
      privateReportCopy.calendlyUrl ||
      privateReportCopy.calendly_url ||
      report.bookingUrl ||
      report.booking_url ||
      report.calendlyUrl ||
      report.calendly_url ||
      CALENDLY_URL,
  );
}

function buildReportRedirectHref({
  token,
  domainSlug,
  kind,
  destinationUrl,
  label,
  eventSection,
  primaryActionLabel,
}: {
  token: string;
  domainSlug: string;
  kind: "booking" | "email" | "linkedin" | "whatsapp" | "cta";
  destinationUrl: string;
  label: string;
  eventSection?: string;
  primaryActionLabel?: string;
}) {
  const params = new URLSearchParams({
    token,
    domainSlug,
    kind,
    url: destinationUrl,
    label,
    eventSection: eventSection || kind,
    primaryActionLabel: primaryActionLabel || label,
    primaryPageLabel: "Secure tracking review",
  });

  return `/api/report-redirect?${params.toString()}`;
}

function ReportServedPixel({
  token,
  domainSlug,
  primaryActionLabel,
}: {
  token: string;
  domainSlug: string;
  primaryActionLabel: string;
}) {
  const params = new URLSearchParams({
    eventName: "secure_report_served",
    token,
    domainSlug,
    eventSection: "server_pixel",
    buttonLabel: "Report HTML served",
    primaryActionLabel,
    primaryPageLabel: "Secure tracking review",
    transport: "server_pixel",
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/report-event?${params.toString()}`}
      alt=""
      aria-hidden="true"
      width={1}
      height={1}
      style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    />
  );
}

function ReportViewBeacon({ token }: { token: string }) {
  const script = `
(function () {
  try {
    var token = ${JSON.stringify(token)};
    if (!token) return;

    var storageKey = "trackflow_report_view_" + token;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(storageKey)) return;
    } catch (storageError) {}

    window.setTimeout(function () {
      try {
        try {
          if (window.sessionStorage) window.sessionStorage.setItem(storageKey, "1");
        } catch (storageError) {}

        var url = "/api/trackflow/reports/view?token=" + encodeURIComponent(token);
        var payload = JSON.stringify({ token: token, source: "report_page_beacon" });

        if (navigator.sendBeacon) {
          var body = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, body);
          return;
        }

        fetch(url, {
          method: "POST",
          keepalive: true,
          headers: { "content-type": "application/json" },
          body: payload
        }).catch(function () {});
      } catch (error) {}
    }, 3500);
  } catch (error) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}



function AssistantVisibilityScript() {
  const styles = `
html {
  scroll-behavior: smooth;
}
main[data-trackflow-secure-report] {
  overflow-x: hidden;
  overscroll-behavior-x: none;
}
main[data-trackflow-secure-report] * {
  min-width: 0;
}
main[data-trackflow-secure-report] a,
main[data-trackflow-secure-report] button {
  -webkit-tap-highlight-color: transparent;
}
main[data-trackflow-secure-report] iframe {
  max-width: 100%;
}
@media (max-width: 640px) {
  main[data-trackflow-secure-report] {
    text-rendering: optimizeLegibility;
  }
  main[data-trackflow-secure-report] section {
    scroll-margin-top: 5.25rem;
  }
  main[data-trackflow-secure-report] [data-trackflow-video-shell] {
    contain: layout paint;
  }
  main[data-trackflow-secure-report] .break-all {
    overflow-wrap: anywhere;
  }
}
[data-trackflow-sticky-assistant-shell] {
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease;
}
[data-trackflow-sticky-assistant-shell] > div.fixed {
  transform: translateY(18px) scale(0.98);
  transform-origin: bottom right;
  transition: transform 220ms ease;
}
html[data-trackflow-assistant-visible="true"] [data-trackflow-sticky-assistant-shell] {
  opacity: 1;
  pointer-events: auto;
}
html[data-trackflow-assistant-visible="true"] [data-trackflow-sticky-assistant-shell] > div.fixed {
  transform: translateY(0) scale(1);
}
@media (prefers-reduced-motion: reduce) {
  [data-trackflow-sticky-assistant-shell],
  [data-trackflow-sticky-assistant-shell] > div.fixed {
    transition: none;
  }
  [data-trackflow-sticky-assistant-shell] > div.fixed {
    transform: none;
  }
}
`;

  const script = `
(function () {
  try {
    if (window.__trackflowAssistantVisibilityReady) return;
    window.__trackflowAssistantVisibilityReady = true;

    var ticking = false;

    function getAssistantScrollThreshold() {
      var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      var hero = document.querySelector('[data-trackflow-hero]');
      var heroThreshold = viewportHeight * 0.55;

      if (hero && hero.getBoundingClientRect) {
        var rect = hero.getBoundingClientRect();
        var heroBottom = rect.bottom + scrollY;
        heroThreshold = Math.min(heroBottom - 140, viewportHeight * 0.72);
      }

      return Math.max(260, heroThreshold);
    }

    function showAssistantButton() {
      document.documentElement.setAttribute('data-trackflow-assistant-visible', 'true');
    }

    function hideAssistantButton() {
      document.documentElement.removeAttribute('data-trackflow-assistant-visible');
    }

    function updateAssistantVisibility() {
      ticking = false;
      var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      var threshold = getAssistantScrollThreshold();
      var show = scrollY > threshold;

      if (show) {
        showAssistantButton();
      } else {
        hideAssistantButton();
      }
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateAssistantVisibility);
    }

    document.addEventListener('click', function (event) {
      try {
        var target = event.target && event.target.closest ? event.target.closest('a[href="#ask-this-review"]') : null;
        if (!target) return;

        if (event.preventDefault) event.preventDefault();
        showAssistantButton();

        window.setTimeout(function () {
          try {
            var openButton = document.querySelector('[data-trackflow-sticky-assistant-shell] button[aria-label="Open tracking review chat"]');
            if (openButton && typeof openButton.click === 'function') openButton.click();
          } catch (clickError) {}
        }, 80);
      } catch (clickHandlerError) {}
    });

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('orientationchange', requestUpdate);
    window.setTimeout(updateAssistantVisibility, 150);
    window.setTimeout(updateAssistantVisibility, 900);
  } catch (error) {}
})();`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}

function PdfDownloadExperienceScript() {
  const script = `
(function () {
  try {
    if (window.__trackflowPdfDownloadExperienceReady) return;
    window.__trackflowPdfDownloadExperienceReady = true;

    function setStatus(message, state) {
      var status = document.querySelector('[data-trackflow-pdf-status]');
      if (!status) return;

      var icon = status.querySelector('[data-trackflow-pdf-status-icon]');
      var text = status.querySelector('[data-trackflow-pdf-status-message]');
      var currentState = state || 'idle';

      status.hidden = false;

      if (text) text.textContent = message;

      if (currentState === 'loading') {
        status.className = 'mb-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800';
        if (icon) icon.textContent = 'Preparing';
        return;
      }

      if (currentState === 'success') {
        status.className = 'mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800';
        if (icon) icon.textContent = 'Download started';
        return;
      }

      if (currentState === 'error') {
        status.className = 'mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700';
        if (icon) icon.textContent = 'Action needed';
        return;
      }

      status.className = 'mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600';
      if (icon) icon.textContent = 'Ready';
    }

    function parseFileName(response) {
      var header = response.headers.get('content-disposition') || '';
      var utfMatch = header.match(/filename\\*=UTF-8''([^;]+)/i);
      if (utfMatch && utfMatch[1]) {
        try {
          return decodeURIComponent(utfMatch[1].replace(/["']/g, '').trim()) || 'trackflow-audit-report.pdf';
        } catch (error) {}
      }

      var normalMatch = header.match(/filename="?([^"]+)"?/i);
      if (normalMatch && normalMatch[1]) {
        return normalMatch[1].replace(/["']/g, '').trim() || 'trackflow-audit-report.pdf';
      }

      return 'trackflow-audit-report.pdf';
    }

    function dispatchReportEvent(detail) {
      try {
        window.dispatchEvent(new CustomEvent('trackflow:secure-report-event', { detail: detail || {} }));
      } catch (error) {}
    }

    function setButtonState(button, state, labelText) {
      var label = button.querySelector('[data-trackflow-pdf-download-label]');
      var spinner = button.querySelector('[data-trackflow-pdf-download-spinner]');
      var dot = button.querySelector('[data-trackflow-pdf-download-dot]');

      if (label) label.textContent = labelText || button.getAttribute('data-default-label') || 'Download PDF';

      if (state === 'loading') {
        button.setAttribute('aria-busy', 'true');
        button.setAttribute('data-download-state', 'loading');
        button.classList.add('pointer-events-none', 'opacity-80');
        if (spinner) spinner.hidden = false;
        if (dot) dot.hidden = true;
        return;
      }

      button.removeAttribute('aria-busy');
      button.setAttribute('data-download-state', state || 'idle');
      button.classList.remove('pointer-events-none', 'opacity-80');
      if (spinner) spinner.hidden = true;
      if (dot) dot.hidden = false;
    }

    async function downloadPdf(button, href) {
      var separator = href.indexOf('?') >= 0 ? '&' : '?';
      var url = href + separator + 'downloadRequest=' + Date.now();

      setButtonState(button, 'loading', 'Preparing secure PDF...');
      setStatus('Preparing your secure PDF. Please wait — the download will start automatically on this page.', 'loading');

      try {
        var response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('PDF download failed with HTTP ' + response.status);
        }

        var blob = await response.blob();

        if (!blob || !blob.size) {
          throw new Error('The downloaded PDF file was empty.');
        }

        var fileName = parseFileName(response);
        var objectUrl = window.URL.createObjectURL(blob);
        var link = document.createElement('a');

        link.href = objectUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        window.setTimeout(function () {
          try {
            window.URL.revokeObjectURL(objectUrl);
            link.remove();
          } catch (error) {}
        }, 2000);

        setStatus('Download started. Please check your browser downloads bar or download folder.', 'success');
        setButtonState(button, 'success', 'Download started');
        dispatchReportEvent({
          eventName: 'secure_report_pdf_download_success',
          buttonLabel: 'PDF download started',
          eventSection: 'pdf'
        });

        window.setTimeout(function () {
          setButtonState(button, 'idle', button.getAttribute('data-default-label') || 'Download PDF');
          setStatus('Ready to download again. You will stay on this secure review page.', 'idle');
        }, 4500);
      } catch (error) {
        setStatus('The PDF could not start downloading automatically. Please use Open PDF, or try Download PDF again.', 'error');
        setButtonState(button, 'error', 'Try download again');
      }
    }

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var button = target.closest('[data-trackflow-pdf-download]');
      if (!button) return;

      var href = button.getAttribute('href');
      if (!href) return;

      event.preventDefault();

      if (button.getAttribute('data-download-state') === 'loading') return;

      downloadPdf(button, href);
    }, true);
  } catch (error) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}


function EvidenceVideoExperienceScript() {
  const script = `(() => {
  try {
    function dispatchReportEvent(detail) {
      try {
        window.dispatchEvent(new CustomEvent('trackflow:secure-report-event', { detail: detail || {} }));
      } catch (error) {}
    }

    function buildEmbedUrl(rawUrl) {
      try {
        var url = new URL(rawUrl, window.location.origin);
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('enablejsapi', '1');
        url.searchParams.set('origin', window.location.origin);
        url.searchParams.set('rel', url.searchParams.get('rel') || '0');
        url.searchParams.set('modestbranding', url.searchParams.get('modestbranding') || '1');
        url.searchParams.set('playsinline', url.searchParams.get('playsinline') || '1');
        return url.toString();
      } catch (error) {
        return rawUrl || '';
      }
    }

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var button = target.closest('[data-trackflow-video-play]');
      if (!button) return;

      var shell = button.closest('[data-trackflow-video-shell]');
      if (!shell || shell.getAttribute('data-video-loaded') === 'true') return;

      var embedUrl = shell.getAttribute('data-trackflow-video-embed-url') || '';
      var videoId = shell.getAttribute('data-trackflow-video-id') || '';
      var title = shell.getAttribute('data-trackflow-video-title') || 'Evidence video';
      if (!embedUrl) return;

      event.preventDefault();
      shell.setAttribute('data-video-loaded', 'true');

      dispatchReportEvent({
        eventName: 'secure_report_evidence_video_play_click',
        buttonLabel: 'Evidence video play clicked',
        eventSection: 'evidence_video',
        videoId: videoId
      });

      var iframe = document.createElement('iframe');
      iframe.setAttribute('data-trackflow-youtube-iframe', 'true');
      iframe.title = title;
      iframe.src = buildEmbedUrl(embedUrl);
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'absolute inset-0 h-full w-full';

      shell.innerHTML = '';
      shell.appendChild(iframe);

      try {
        window.dispatchEvent(new CustomEvent('trackflow:evidence-video-loaded', { detail: { videoId: videoId } }));
      } catch (error) {}
    }, true);
  } catch (error) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function LinkButton({
  href,
  children,
  variant = "primary",
  target,
  rel,
  analyticsEvent,
  analyticsSection,
  analyticsLabel,
}: LinkButtonProps) {
  const styles = {
    primary:
      "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-500 focus:ring-blue-500/25",
    secondary:
      "border border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 focus:ring-blue-500/15",
    dark:
      "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-blue-600 focus:ring-blue-500/25",
  }[variant];

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      data-trackflow-analytics-event={analyticsEvent}
      data-trackflow-analytics-section={analyticsSection}
      data-trackflow-analytics-label={analyticsLabel}
      className={`inline-flex min-h-[46px] w-full max-w-full items-center justify-center rounded-2xl px-4 py-3.5 text-center text-sm font-black leading-5 transition focus:outline-none focus:ring-4 sm:min-h-0 sm:w-auto sm:px-5 sm:py-3 ${styles}`}
    >
      {children}
    </a>
  );
}

function ReportNavbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 overflow-x-hidden border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
  href="/"
  className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
  aria-label="TrackFlow Pro home"
>
  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-950/5 ring-1 ring-slate-200/70 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-blue-600/15 sm:h-11 sm:w-11">
    <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/90 opacity-95" />
    <Image
      src="/logo-mark.png"
      alt=""
      width={40}
      height={40}
      priority
      className="relative h-8 w-8 object-contain drop-shadow-sm sm:h-9 sm:w-9"
    />
  </span>

  <span className="flex min-w-0 flex-col leading-none">
    <span className="whitespace-nowrap text-[18px] font-black tracking-[-0.045em] text-slate-950 sm:text-[21px]">
      TrackFlow
      <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">
        Pro
      </span>
    </span>
    <span className="mt-1 hidden whitespace-nowrap text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 sm:block">
      Conversion Tracking Specialist
    </span>
  </span>
</Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/services/google-ads-conversion-tracking"
            className="rounded-xl px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            Google Ads Tracking
          </Link>
          <Link
            href="/services/ga4-gtm-audit"
            className="rounded-xl px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            GA4 & GTM Audit
          </Link>
          <Link
            href="/contact"
            className="rounded-xl px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            Contact
          </Link>
        </div>

        <Link
          href="/free-tracking-audit"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:rounded-2xl sm:px-4 sm:text-sm"
        >
          Book Review
        </Link>
      </div>
    </nav>
  );
}

function SectionCard({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  tone?: "default" | "blue" | "green" | "amber";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white",
    blue: "border-blue-100 bg-blue-50/80",
    green: "border-emerald-100 bg-emerald-50/80",
    amber: "border-amber-100 bg-amber-50/80",
  }[tone];

  return (
    <section className={`min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border p-4 shadow-sm sm:rounded-[1.75rem] sm:p-6 ${toneClass}`}>
      <p className="break-words text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
        {label}
      </p>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

function BulletList({
  items,
  marker = "blue",
}: {
  items: string[];
  marker?: "blue" | "green" | "slate";
}) {
  const markerClass =
    marker === "green"
      ? "bg-emerald-500"
      : marker === "slate"
        ? "bg-slate-400"
        : "bg-blue-600";

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex min-w-0 gap-3 text-sm font-semibold leading-6 text-slate-700"
        >
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${markerClass}`} />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedStepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-[1.25rem] border border-amber-100 bg-white/70 p-3 shadow-sm shadow-amber-950/5 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:rounded-2xl sm:p-4"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-500/20">
            {index + 1}
          </span>
          <span className="min-w-0 break-words text-sm font-bold leading-6 text-slate-700">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ReportFooter() {
  return (
    <footer className="overflow-x-hidden border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
           <Link
  href="/"
  className="group inline-flex max-w-full min-w-0 items-center gap-3"
  aria-label="TrackFlow Pro home"
>
  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-950/5 ring-1 ring-slate-200/70 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-blue-600/15">
    <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/90 opacity-95" />
    <Image
      src="/logo-mark.png"
      alt=""
      width={40}
      height={40}
      className="relative h-9 w-9 object-contain drop-shadow-sm"
    />
  </span>

  <span className="flex min-w-0 flex-col leading-none">
    <span className="whitespace-nowrap text-2xl font-black tracking-[-0.045em] text-slate-950">
      TrackFlow
      <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">
        Pro
      </span>
    </span>
    <span className="mt-1 block whitespace-nowrap text-[8px] font-black uppercase leading-5 tracking-[0.14em] text-slate-500">
      Conversion Tracking Specialist
    </span>
  </span>
</Link>

            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
              Specialist conversion tracking support for advertisers who need clearer GA4,
              Google Ads, GTM, Meta CAPI, and server-side measurement.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
              Direct contact
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Tracking%20Review%20Request`}
                data-trackflow-analytics-event="secure_report_email_click"
                data-trackflow-analytics-section="footer"
                data-trackflow-analytics-label="Email TrackFlow Pro"
                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                Email TrackFlow Pro
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-trackflow-analytics-event="secure_report_linkedin_click"
                data-trackflow-analytics-section="footer"
                data-trackflow-analytics-label="LinkedIn Profile"
                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                LinkedIn Profile
              </a>
            </div>

            <p className="mt-4 break-words text-xs font-semibold leading-6 text-slate-500">
              {MAILING_ADDRESS}
            </p>
          </div>
        </div>

        <div className="mt-8 flex min-w-0 flex-col gap-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words">© {new Date().getFullYear()} TrackFlow Pro. Conversion tracking and attribution support.</p>
          <p className="max-w-3xl break-words leading-6">Not affiliated with Google, Meta, or the reviewed business. Audit notes are based on browser-visible evidence first.</p>

          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-blue-700">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="hover:text-blue-700">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-blue-700">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_TRACKFLOW_APP_URL ||
    process.env.TRACKFLOW_APP_URL ||
    "https://www.trackflowpro.com"
  ).replace(/\/+$/, "");
}

function sanitizeMetadataImageUrl(value: unknown): string {
  const raw = cleanText(value, "");
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return "";
    if (url.pathname.toLowerCase().endsWith(".pdf")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function getReportPreviewImageUrl(report: Record<string, any>): string {
  return sanitizeMetadataImageUrl(
    report.ogImageUrl ||
      report.og_image_url ||
      report.openGraphImageUrl ||
      report.open_graph_image_url ||
      report.previewImageUrl ||
      report.preview_image_url ||
      report.homepageScreenshotUrl ||
      report.homepage_screenshot_url ||
      "",
  );
}


function getReportMode(report: Record<string, any>, privateReportCopy: Record<string, any> = {}): string {
  const trackingCase = getObjectCandidate(report.trackingCase, report.tracking_case, privateReportCopy.trackingCase, privateReportCopy.tracking_case);
  return cleanText(
    trackingCase.mode ||
      trackingCase.reportMode ||
      trackingCase.report_mode ||
      report.reportMode ||
      report.report_mode ||
      privateReportCopy.reportMode ||
      privateReportCopy.report_mode,
    "",
  ).toLowerCase();
}

function isSetupFirstReportMode(value: string): boolean {
  return value === "tracking_foundation_setup" || value === "ga4_setup_needed";
}

function getManualActionContext(report: Record<string, any>, privateReportCopy: Record<string, any> = {}): Record<string, any> {
  return getObjectCandidate(
    privateReportCopy.manualActionContext,
    privateReportCopy.manual_action_context,
    report.manualActionContext,
    report.manual_action_context,
  );
}

function cleanSetupActionLabel(value: unknown): string {
  const text = cleanText(value, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (/^(main business action|selected conversion action|tracking foundation setup|ga4 setup readiness|website tracking foundation|conversion path review)$/i.test(text)) return "";
  return text.length > 90 ? `${text.slice(0, 87).replace(/\s+\S*$/, "").trim()}...` : text;
}

function joinUniqueSentences(parts: string[]): string {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const text = cleanText(part, "");
    if (!text) continue;
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(text.replace(/[.\s]+$/, "."));
  }
  return output.join(" ").replace(/\s+/g, " ").trim();
}

function polishReviewExplainerText(value: unknown): string {
  const text = cleanText(value, "");
  if (!text) return "";

  if (/TrackFlow Pro is not affiliated with Google,\s*Meta,\s*or/i.test(text)) {
    return "TrackFlow Pro is not affiliated with Google, Meta, or the reviewed business.";
  }

  return text
    .replace(/This page summarizes the most important browser-visible tracking evidence before any account-level review\.?/gi, "This private review summarizes browser-visible tracking evidence before account-level confirmation.")
    .replace(/This private page summarizes the browser-visible tracking setup before account-level access or final conversion confirmation\.?/gi, "This private review summarizes browser-visible tracking setup before account-level confirmation.")
    .replace(/\s+/g, " ")
    .trim();
}



export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const token = normalizeToken(resolvedParams.token);

  if (!token) return DEFAULT_METADATA;

  try {
    const reportSnap = await adminDb.collection("audit_reports").doc(token).get();
    if (!reportSnap.exists) return DEFAULT_METADATA;

    const report = reportSnap.data() || {};
    const domain = getDomainLabel(report);
    const companyName = getDisplayCompanyName(report, domain);
    const title = `Tracking Review for ${companyName} | TrackFlow Pro`;
    const description = "A private browser-visible tracking and attribution review prepared by TrackFlow Pro.";
    const previewImageUrl = getReportPreviewImageUrl(report);
    const metadataDomainSlug = normalizeSlug(report.domainSlug || report.domain_slug || domain || "website") || "website";
    const reportUrl = `${getAppBaseUrl()}/tracking-review/${encodeURIComponent(metadataDomainSlug)}/${encodeURIComponent(token)}`;
    const imageAlt = `${companyName} website tracking review preview`;

    return {
      ...DEFAULT_METADATA,
      title,
      description,
      metadataBase: new URL(getAppBaseUrl()),
      alternates: {
        canonical: reportUrl,
      },
      openGraph: {
        title,
        description,
        siteName: "TrackFlow Pro",
        type: "website",
        url: reportUrl,
        ...(previewImageUrl
          ? {
              images: [
                {
                  url: previewImageUrl,
                  width: 1200,
                  height: 630,
                  alt: imageAlt,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: previewImageUrl ? "summary_large_image" : "summary",
        title,
        description,
        ...(previewImageUrl ? { images: [previewImageUrl] } : {}),
      },
    };
  } catch {
    return DEFAULT_METADATA;
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const domainSlug = normalizeSlug(resolvedParams.domainSlug);
  const token = normalizeToken(resolvedParams.token);

  if (!domainSlug || !token) notFound();

  const reportRef = adminDb.collection("audit_reports").doc(token);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) notFound();

  const report = reportSnap.data() || {};

  if (report.active === false) notFound();

  const expiresAtMs = toMillis(report.pdfExpiresAt || report.expiresAt);
  if (expiresAtMs && Date.now() > expiresAtMs) notFound();


  const domain = getDomainLabel(report);
  const companyName = getDisplayCompanyName(report, domain);
  const privateReportCopy = getPrivateReportCopy(report);
  const reportMode = getReportMode(report, privateReportCopy);
  const isSetupFirst = isSetupFirstReportMode(reportMode);
  const manualActionContext = getManualActionContext(report, privateReportCopy);
  const setupActionLabel = cleanSetupActionLabel(manualActionContext.label || manualActionContext.actionLabel || manualActionContext.action_label);
  const headline = getDisplayHeadline(report, companyName, domain);
  const pageSubheadline = sentenceCaseFirst(cleanText(
    privateReportCopy.subheadline ||
      privateReportCopy.privatePageSubheadline ||
      report.subheadline ||
      report.privatePageSubheadline,
    "This page summarizes the most important browser-visible tracking evidence before any account-level review.",
  ));
  const ctaText = getDisplayCtaText(privateReportCopy.ctaText || report.ctaText || report.cta_text);
  const setupPageSubheadline = isSetupFirst
    ? 'This private review summarizes browser-visible tracking setup before account-level confirmation.'
    : pageSubheadline;

  let mainFinding = sentenceCaseFirst(cleanText(
    privateReportCopy.mainFinding || report.mainFinding || report.mainIssue,
    "A conversion tracking review may be useful based on public browser-visible evidence.",
  ));

  let businessImpact = sentenceCaseFirst(cleanText(
    privateReportCopy.businessImpact || report.businessImpact,
    "If important lead actions are not measured clearly, it can be harder to know which marketing channels are creating enquiries.",
  ));

  const trackingSignalItems = cleanSignalCards(privateReportCopy.trackingSignalCards || report.trackingSignalCards || report.tracking_signal_cards);
  const reviewedPageItems = cleanReviewedPageLabels(privateReportCopy.reviewedPageUrls || report.reviewedPageUrls || report.reviewed_page_urls);
  let whatChecked = cleanList(
    [
      ...reviewedPageItems,
      ...cleanList(privateReportCopy.whatChecked || report.whatChecked || report.auditScope, [], 8),
      ...trackingSignalItems,
    ],
    DEFAULT_CHECKS,
    8,
  );
  let proofPoints = cleanList(privateReportCopy.proofPoints || report.proofPoints || report.evidencePoints, DEFAULT_PROOF_POINTS, 6);
  let recommendations = cleanList(
    privateReportCopy.verificationPlan ||
      privateReportCopy.verification_plan ||
      privateReportCopy.recommendedFixPlan ||
      privateReportCopy.recommended_fix_plan ||
      report.verificationPlan ||
      report.verification_plan ||
      privateReportCopy.recommendations ||
      report.recommendations ||
      report.nextSteps,
    DEFAULT_RECOMMENDATIONS,
    6,
  );
  let auditSnapshotTitle = cleanText(
    privateReportCopy.auditSnapshotTitle || report.auditSnapshotTitle || report.audit_snapshot_title,
    "What this review is designed to clarify",
  );
  let auditSnapshotQuestions = cleanList(
    privateReportCopy.auditSnapshotQuestions || report.auditSnapshotQuestions || report.audit_snapshot_questions,
    [
      "Are key tracking tags visible from the browser?",
      "Does the lead path show clear conversion evidence?",
      "Is account-level verification recommended?",
    ],
    3,
  );
  const isAlertSignup = isAlertSignupReview(report, privateReportCopy);
  if (isAlertSignup) {
    mainFinding = normalizeAlertSignupText(mainFinding || "Alert signup and notification form tracking should be verified inside GA4 and Google Ads.");
    businessImpact = normalizeAlertSignupText(
      businessImpact ||
        "If alert signup or notification form actions are not recorded clearly, campaign reports may not show which ads create real customer opt-ins or local notification requests.",
    );
    whatChecked = alertSignupCheckedItems(whatChecked);
    recommendations = alertSignupVerificationPlan();
    auditSnapshotTitle = "Alert Signup Form tracking snapshot";
    auditSnapshotQuestions = alertSignupSnapshotQuestions();
    proofPoints = cleanList(proofPoints.map(normalizeAlertSignupText), DEFAULT_PROOF_POINTS, 6);
  }

  const manualAds = getManualAdsTransparency(report);
  const manualAdsSummary = getManualAdsSummary(manualAds);
  const trustSignals = cleanList(privateReportCopy.trustNotes || report.trustNotes || report.trustSignals, TRUST_SIGNALS, 3);
  const primaryConversionFocus = cleanText(privateReportCopy.primaryActionLabel || report.primaryActionLabel || "", "") || getPrimaryConversionFocus(report, privateReportCopy);
  const manualEvidenceHero = getManualEvidenceHero(report, privateReportCopy);
  const hasCallTrackingContext = [primaryConversionFocus, ...whatChecked, ...proofPoints]
    .join(" ")
    .toLowerCase()
    .includes("call");
  const enhancedProofPoints = manualAdsSummary ? cleanList([manualAdsSummary, ...proofPoints], DEFAULT_PROOF_POINTS, 6) : proofPoints;
  const clientFacingProofPoints = cleanList(
    enhancedProofPoints.map((item) => polishClientFacingEvidenceText(item, hasCallTrackingContext)),
    DEFAULT_PROOF_POINTS,
    6,
  );
  const howToReadTitle = cleanText(privateReportCopy.howToReadTitle || report.howToReadTitle || report.how_to_read_title, "How to read this review");
  const howToReadParagraphs = cleanList(
    privateReportCopy.howToReadParagraphs || report.howToReadParagraphs || report.how_to_read_paragraphs || report.howToReadThisReview,
    [
      "This is an initial tracking review, not an account audit. It highlights what can be seen from the website/browser side and where account-level verification should be done.",
      "TrackFlow Pro is not affiliated with Google, Meta, or the reviewed business.",
    ],
    3,
  )
    .map(polishReviewExplainerText)
    .filter(Boolean);
  const expiresLabel = formatDate(report.pdfExpiresAt || report.expiresAt);
  const previewHref = `/api/trackflow/reports/preview?token=${encodeURIComponent(token)}`;
  const downloadHref = `/api/trackflow/reports/download?token=${encodeURIComponent(token)}`;

  const ctaTarget = cleanCtaTarget(report.ctaUrl);
  const ctaHref = `/api/trackflow/reports/cta?token=${encodeURIComponent(token)}&target=${encodeURIComponent(ctaTarget)}`;
  const bookingUrl = getBookingUrl(report, privateReportCopy);
  const bookingHref = bookingUrl || ctaHref;
  const bookingTrackingHref = buildReportRedirectHref({
    token,
    domainSlug,
    kind: bookingUrl ? "booking" : "cta",
    destinationUrl: bookingHref,
    label: "Book a verification call",
    eventSection: "booking",
    primaryActionLabel: ctaText,
  });
  const emailReplyDestination = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Tracking Review Request - ${companyName === "this website" ? "Website" : companyName}`)}`;
  const emailReplyTrackingHref = buildReportRedirectHref({
    token,
    domainSlug,
    kind: "email",
    destinationUrl: emailReplyDestination,
    label: "Reply by Email",
    eventSection: "booking",
    primaryActionLabel: ctaText,
  });
  const bookingHeadline = cleanText(
    privateReportCopy.bookingHeadline || report.bookingHeadline || report.booking_headline,
    isSetupFirst ? "Ready to set up and verify tracking live?" : "Ready to verify this tracking setup live?",
  );
  const bookingDescription = cleanText(
    privateReportCopy.bookingDescription || report.bookingDescription || report.booking_description,
    isSetupFirst ? "Book a setup review to confirm GA4/GTM, then define and test the next customer action with approved access." : "Book a short verification call to review GA4, Google Ads, GTM, CRM, or server-side recording with approved account access.",
  );

  const reportDate =
    formatDate(report.createdAt || report.registeredAt || report.uploadedAt) ||
    formatDate(new Date().toISOString());

  const businessTypeLabel = getBusinessTypeLabel(report, privateReportCopy);
  const reviewFocusLabel = isSetupFirst ? "Tracking setup readiness" : (primaryConversionFocus || businessTypeLabel || "Conversion path review");
  const evidenceVideo = getEvidenceVideoDisplay(report);
  const heroHeadline = isSetupFirst
    ? "Private tracking readiness review"
    : companyName === "this website"
      ? "Private tracking review"
      : `Private tracking review for ${companyName}`;
  const preparedForLabel = companyName === "this website" ? "the reviewed website" : companyName;
  const manualReviewContextLine = manualEvidenceHero
    ? [
        manualEvidenceHero.actionLabel ? `Manual review focus: ${manualEvidenceHero.actionLabel}.` : "",
        manualEvidenceHero.expectedEvent ? `Expected event: ${manualEvidenceHero.expectedEvent}.` : "",
        manualEvidenceHero.observedEvent ? `Observed result: ${manualEvidenceHero.observedEvent}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";
  const heroContextLine = manualReviewContextLine || (isSetupFirst
    ? setupPageSubheadline
    : (primaryConversionFocus ? `${primaryConversionFocus} reviewed on the selected conversion path.` : pageSubheadline));
  const heroIntroLine = polishReviewExplainerText(
    isSetupFirst ? setupPageSubheadline : joinUniqueSentences([heroContextLine, setupPageSubheadline]),
  );
  const evidenceSignalBadges = cleanList(
    [
      ...trackingSignalItems,
      ...whatChecked.filter((item) => /(?:tag found|request observed|pixel found|tracking-like|needs|not confirmed|conversion id)/i.test(item)),
    ],
    [],
    6,
  );
  const reviewedPageBadges = cleanList(
    reviewedPageItems.length
      ? reviewedPageItems
      : whatChecked.filter((item) => /^.+:\s*https?:\/\//i.test(item)),
    [],
    3,
  );
  const verificationPreviewItems = recommendations.slice(0, 3);
  const heroSummaryCards = manualEvidenceHero
    ? [
        {
          label: "Reviewed action",
          value: manualEvidenceHero.actionLabel || reviewFocusLabel,
        },
        {
          label: "Expected event",
          value: manualEvidenceHero.expectedEvent || "Needs account confirmation",
        },
        {
          label: "Observed result",
          value: manualEvidenceHero.observedEvent || "Not clearly observed",
        },
      ]
    : isSetupFirst
      ? [
          {
            label: "Review focus",
            value: "Tracking setup readiness",
          },
          {
            label: "Setup signal",
            value: "GA4/GTM foundation",
          },
          {
            label: "Best next action",
            value: "Set up GA4/GTM first",
          },
        ]
      : [
          {
            label: "Review focus",
            value: reviewFocusLabel,
          },
          {
            label: "Evidence type",
            value: "Browser-visible signals",
          },
          {
            label: "Best next action",
            value: "Controlled test + account check",
          },
        ];

  const chatQuestionContext: ReportChatQuestionContext = {
    companyName,
    domain,
    headline,
    score: getReportScoreValue(report),
    scoreLabel: getReportScoreLabel(report),
    mainFinding,
    businessImpact,
    reportMode,
    isSetupFirst,
    primaryConversionFocus: manualEvidenceHero?.actionLabel || setupActionLabel || primaryConversionFocus,
    businessType: businessTypeLabel,
    manualActionLabel: manualEvidenceHero?.actionLabel || setupActionLabel || "",
    manualExpectedEvent: manualEvidenceHero?.expectedEvent || "",
    manualObservedEvent: manualEvidenceHero?.observedEvent || "",
    manualTool: manualEvidenceHero?.tool || "",
    manualGa4Status: manualEvidenceHero?.ga4Status || "",
    manualGoogleAdsStatus: manualEvidenceHero?.googleAdsStatus || "",
    manualGtmStatus: manualEvidenceHero?.gtmStatus || "",
    manualVerificationMessage: manualEvidenceHero?.verificationMessage || "",
    whatChecked,
    proofPoints: clientFacingProofPoints,
    recommendations,
    auditSnapshotQuestions,
    manualAdsSummary,
  };

  return (
    <main data-trackflow-secure-report className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
      <ReportViewBeacon token={token} />
      <ReportServedPixel token={token} domainSlug={domainSlug} primaryActionLabel={ctaText} />
      <SecureReportAnalytics
        token={token}
        domainSlug={domainSlug}
        companyName={companyName}
        headline={headline}
        primaryActionLabel={ctaText}
        primaryPageLabel="Secure tracking review"
        evidenceVideoId={evidenceVideo?.videoId || ""}
      />
      <PdfDownloadExperienceScript />
      <EvidenceVideoExperienceScript />
      <AssistantVisibilityScript />
      <ReportNavbar />

      <section data-trackflow-hero className="relative overflow-hidden border-b border-slate-200 bg-white pt-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-16rem] top-[-12rem] h-80 w-80 rounded-full bg-blue-100 blur-3xl sm:right-[-12rem] sm:h-96 sm:w-96" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-4 px-4 pb-7 pt-5 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:pb-16 lg:pt-12">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-blue-700 sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
              {isSetupFirst ? "Private tracking readiness review" : "Private tracking review"}
            </div>

            <h1 className="mt-4 max-w-3xl break-words text-[1.9rem] font-black leading-[1.06] tracking-[-0.045em] text-slate-950 sm:mt-6 sm:text-5xl sm:leading-[0.98] lg:text-6xl">
              {heroHeadline}
            </h1>

            <p className="mt-4 max-w-2xl break-words text-[0.95rem] font-semibold leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
              Prepared for <span className="font-black text-slate-950">{preparedForLabel}</span>. {heroIntroLine}
            </p>

            {manualEvidenceHero ? (
              <div
                data-trackflow-manual-evidence-hero
                className="mt-5 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/8 sm:mt-7 sm:rounded-[1.75rem] sm:p-5 lg:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 sm:text-[11px]">
                      Manual conversion test result
                    </p>
                    <h2 className="mt-3 max-w-2xl break-words text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl">
                      {manualEvidenceHero.title}
                    </h2>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm">
                    Browser-side manual evidence
                  </span>
                </div>

                <p className="mt-4 max-w-3xl break-words text-sm font-bold leading-7 text-slate-700 sm:text-base sm:leading-8">
                  {manualEvidenceHero.summary}
                </p>

                {manualEvidenceHero.verificationMessage ? (
                  <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black leading-7 text-amber-950 shadow-sm sm:px-5 sm:py-4 sm:text-base sm:leading-8">
                    {manualEvidenceHero.verificationMessage}
                  </div>
                ) : null}

                {manualEvidenceHero.businessImpact ? (
                  <div className="mt-4 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-7 text-slate-700 sm:text-base">
                    <span className="font-black">Why this matters: </span>
                    {manualEvidenceHero.businessImpact}
                  </div>
                ) : null}

                <div className="mt-5 grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Action tested", manualEvidenceHero.actionLabel],
                    ["Expected event to verify", manualEvidenceHero.expectedEvent],
                    ["Observed result", manualEvidenceHero.observedEvent],
                    ["Google Ads conversion", manualEvidenceHero.googleAdsStatus],
                    ["GA4 event", manualEvidenceHero.ga4Status],
                    ["GTM trigger", manualEvidenceHero.gtmStatus],
                    ["Action completed", manualEvidenceHero.actionCompleted],
                    ["Tool used", manualEvidenceHero.tool],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <div key={label} className="min-w-0 rounded-[1rem] border border-slate-100 bg-slate-50 p-3 shadow-sm shadow-slate-950/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                        <p className="mt-2 break-words text-sm font-black leading-6 text-slate-950">{value}</p>
                      </div>
                    ))}
                </div>

                {manualEvidenceHero.testUrl || manualEvidenceHero.operatorNote ? (
                  <div className="mt-4 grid gap-3">
                    {manualEvidenceHero.testUrl ? (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold leading-6 text-blue-950 sm:text-sm">
                        <span className="font-black uppercase tracking-[0.14em] text-blue-700">Test URL: </span>
                        <span className="break-all">{manualEvidenceHero.testUrl}</span>
                      </div>
                    ) : null}
                    {manualEvidenceHero.operatorNote ? (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold leading-6 text-slate-600 sm:text-sm">
                        <span className="font-black text-slate-900">Operator note: </span>
                        {manualEvidenceHero.operatorNote}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-950 px-4 py-3 text-xs font-bold leading-6 text-slate-200">
                  {manualEvidenceHero.disclaimer}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid min-w-0 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
              {heroSummaryCards.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-[1.25rem] border border-slate-200 bg-white/85 p-3 shadow-sm shadow-slate-950/5 backdrop-blur sm:p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-sm font-black leading-5 text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid min-w-0 gap-3 sm:mt-7 sm:flex sm:flex-wrap">
              <LinkButton
                href="#findings"
                variant="dark"
                analyticsEvent="secure_report_findings_click"
                analyticsSection="hero"
                analyticsLabel="View findings"
              >
                View findings
              </LinkButton>

              <LinkButton
                href="#ask-this-review"
                variant="primary"
                analyticsEvent="secure_report_assistant_open"
                analyticsSection="hero"
                analyticsLabel="Ask about this review"
              >
                Ask about this review
              </LinkButton>

              <LinkButton
                href="#book-verification"
                variant="secondary"
                analyticsEvent="secure_report_booking_section_click"
                analyticsSection="hero"
                analyticsLabel="Book verification"
              >
                Book verification
              </LinkButton>
            </div>

            {evidenceVideo ? (
              <a
                href="#evidence-video"
                data-trackflow-analytics-event="secure_report_evidence_video_mobile_cta_click"
                data-trackflow-analytics-section="hero"
                data-trackflow-analytics-label="Watch evidence video mobile CTA"
                data-trackflow-video-id={evidenceVideo.videoId}
                className="mt-4 flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-blue-100 bg-blue-50/90 p-3 text-left shadow-sm shadow-blue-950/5 transition hover:border-blue-200 hover:bg-white sm:hidden"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/25">
                  ▶
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-black leading-5 text-slate-950">
                    Watch the short evidence video
                  </span>
                  <span className="mt-1 block break-words text-xs font-bold leading-5 text-blue-800">
                    See the browser-visible review before the PDF.
                  </span>
                </span>
              </a>
            ) : null}

            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-slate-500 sm:gap-3">
              <a
                href="#pdf-report"
                data-trackflow-analytics-event="secure_report_pdf_anchor_click"
                data-trackflow-analytics-section="hero"
                data-trackflow-analytics-label="Secure review access available"
                className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-blue-200 hover:text-blue-700 sm:px-4"
              >
                Secure review access available
              </a>
              {evidenceVideo ? (
                <a
                  href="#evidence-video"
                  data-trackflow-analytics-event="secure_report_evidence_video_anchor_click"
                  data-trackflow-analytics-section="hero"
                  data-trackflow-analytics-label="Short evidence video available"
                  data-trackflow-video-id={evidenceVideo.videoId}
                  className="max-w-full break-words rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700 transition hover:border-blue-200 hover:bg-white sm:px-4"
                >
                  Short evidence video available
                </a>
              ) : null}
              <span className="max-w-full break-words rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700 sm:px-4">
                Review assistant included
              </span>
            </div>

            <div className="mt-6 flex min-w-0 flex-wrap gap-2 text-[10px] font-black uppercase leading-5 tracking-[0.14em] text-slate-500 sm:mt-8 sm:gap-3 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                Prepared by TrackFlow Pro
              </span>
              <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                Browser-visible evidence
              </span>
              {domain ? (
                <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                  Website reviewed: {domain}
                </span>
              ) : null}
              {reportDate ? (
                <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                  {reportDate}
                </span>
              ) : null}
              <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                No account access used
              </span>
              {manualAds.checked ? (
                <span className="max-w-full break-words rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 sm:px-4">
                  Ads Transparency: {manualAds.adsFound === "yes" ? "Ads found" : manualAds.adsFound === "no" ? "No ads found" : "Checked"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 max-w-full rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 sm:rounded-[1.75rem] sm:p-4 lg:p-5">
            <div className="min-w-0 rounded-[1.2rem] border border-slate-200 bg-slate-950 p-4 text-white sm:rounded-[1.5rem] sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Private review snapshot
              </p>

              <p className="mt-3 break-words text-xl font-black tracking-[-0.04em] sm:text-2xl">
                {auditSnapshotTitle}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {heroSummaryCards.map((item) => (
                  <div key={`snapshot-${item.label}`} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-200/80">{item.label}</p>
                    <p className="mt-1.5 break-words text-xs font-black leading-5 text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-2">
                {auditSnapshotQuestions.slice(0, 3).map((item) => (
                  <a
                    key={item}
                    href="#ask-this-review"
                    className="group min-w-0 break-words rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-xs font-bold leading-5 text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-300/40 hover:bg-blue-500/15 hover:text-white sm:p-3.5"
                  >
                    <span>{item}</span>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.16em] text-blue-200 opacity-80 group-hover:text-blue-100">
                      Ask assistant
                    </span>
                  </a>
                ))}
              </div>

              {verificationPreviewItems.length ? (
                <div className="mt-5 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 xl:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                    What usually happens next
                  </p>
                  <div className="mt-3 space-y-2">
                    {verificationPreviewItems.map((item, index) => (
                      <p key={`${item}-${index}`} className="text-xs font-bold leading-5 text-slate-300">
                        {index + 1}. {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <a
                href="#ask-this-review"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
              >
                Ask about this review
              </a>
            </div>

            <div className="mt-4 hidden rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 sm:block">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                Private review assistant
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-blue-950">
                The assistant can explain this saved review in plain English. Final confirmation still requires approved access to the actual tracking accounts and lead records.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid min-w-0 gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-3 sm:rounded-[2rem] sm:p-4 lg:p-5">
          {trustSignals.map((item, index) => (
            <div key={item} className="flex min-w-0 items-start gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-3 sm:rounded-[1.35rem] sm:p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                {index + 1}
              </span>
              <p className="min-w-0 break-words text-sm font-black leading-6 text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {evidenceVideo ? (
        <section
          id="evidence-video"
          data-trackflow-observe-event="secure_report_evidence_video_visible"
          data-trackflow-analytics-section="evidence_video"
          data-trackflow-analytics-label="Evidence video visible"
          data-trackflow-video-id={evidenceVideo.videoId}
          className="mx-auto w-full max-w-7xl scroll-mt-24 overflow-hidden px-4 py-5 sm:px-6 sm:pb-10 sm:pt-2 lg:px-8"
        >
          <div className="min-w-0 overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10 sm:rounded-[2rem]">
            <div className="grid min-w-0 items-start gap-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
              <div className="bg-slate-950 p-2.5 sm:p-4 lg:self-start lg:p-5">
                <div
                  data-trackflow-video-shell="true"
                  data-trackflow-video-id={evidenceVideo.videoId}
                  data-trackflow-video-embed-url={evidenceVideo.embedUrl}
                  data-trackflow-video-title={evidenceVideo.title}
                  className="relative aspect-video w-full max-w-full overflow-hidden rounded-[1rem] border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/20 sm:rounded-[1.35rem]"
                >
                  <button
                    type="button"
                    data-trackflow-video-play="true"
                    className="absolute inset-0 grid h-full w-full place-items-center overflow-hidden text-white focus:outline-none focus:ring-4 focus:ring-blue-400/40"
                    aria-label={`Play ${evidenceVideo.title}`}
                    style={{
                      backgroundImage: "radial-gradient(circle at 30% 20%, rgba(59,130,246,.55), transparent 32%), radial-gradient(circle at 80% 15%, rgba(14,165,233,.28), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e3a8a 100%)",
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  >
                    {evidenceVideo.thumbnailUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evidenceVideo.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 h-full w-full object-cover opacity-95"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/10" />
                        <span className="absolute inset-0 bg-blue-950/10" />
                      </>
                    ) : (
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,.55),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,.28),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#1e3a8a_100%)]" />
                    )}

                    <span className="relative grid h-14 w-14 place-items-center rounded-full bg-blue-600 shadow-2xl shadow-blue-600/40 ring-4 ring-white/20 transition hover:scale-105 sm:h-20 sm:w-20">
                      <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[17px] border-y-transparent border-l-white sm:border-y-[15px] sm:border-l-[25px]" />
                    </span>

                    <span className="absolute bottom-3 left-3 right-3 rounded-xl bg-slate-950/80 px-3 py-2.5 text-left text-[11px] font-black leading-4 shadow-lg shadow-slate-950/30 backdrop-blur sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-5">
                      <span className="block text-white">Browser-side evidence walkthrough</span>
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.13em] text-blue-200 sm:text-[10px] sm:tracking-[0.16em]">Tap to watch the audit video</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="min-w-0 border-t border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                  Browser-side evidence walkthrough
                </p>
                <h2 className="mt-3 break-words text-xl font-black leading-tight tracking-[-0.045em] text-slate-950 sm:mt-4 sm:text-4xl">
                  Watch the evidence before reading the PDF.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:mt-4">
                  {evidenceVideo.description} The walkthrough shows the reviewed page context and visible signals before the full PDF details.
                </p>

                {reviewedPageBadges.length ? (
                  <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Reviewed page context
                    </p>
                    <div className="mt-3 grid gap-2">
                      {reviewedPageBadges.map((item) => (
                        <div key={item} className="break-all rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs font-black leading-5 text-slate-700 shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {evidenceSignalBadges.length ? (
                  <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Visible signals in this review
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {evidenceSignalBadges.map((item) => (
                        <span key={item} className="max-w-full break-words rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black leading-5 text-emerald-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <LinkButton href="#ask-this-review" variant="primary">
                    Ask about this video
                  </LinkButton>
                  <LinkButton href="#book-verification" variant="secondary">
                    Verify the setup
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="findings"
        className="mx-auto grid w-full max-w-7xl scroll-mt-24 gap-5 overflow-hidden px-4 py-8 sm:gap-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-16"
      >
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <SectionCard label="Primary finding" tone="blue">
            <p className="break-words text-base font-black leading-7 text-slate-950 sm:text-lg sm:leading-8">{mainFinding}</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-blue-950/70">
              This section summarizes the main browser-visible point to review before relying on the data for reporting or optimisation decisions.
            </p>
          </SectionCard>

          <SectionCard label="Business impact" tone="green">
            <p className="break-words text-base font-bold leading-8 text-emerald-950">{businessImpact}</p>
          </SectionCard>

          {manualAds.checked ? (
            <SectionCard label="Ads Transparency context" tone="amber">
              <div className="space-y-3 text-sm font-bold leading-7 text-amber-950">
                <p>{manualAdsSummary}</p>
                {manualAds.note ? <p className="text-amber-900/80">Manual note: {manualAds.note}</p> : null}
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Source: {manualAds.source}{manualAds.checkedAt ? ` · Checked ${manualAds.checkedAt}` : ""}
                </p>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard label="What I checked">
            <BulletList items={whatChecked} />
          </SectionCard>

          <SectionCard label="Supporting evidence">
            <BulletList items={clientFacingProofPoints} marker="slate" />
          </SectionCard>
        </div>

        <aside className="min-w-0 space-y-5 sm:space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard label="Recommended verification plan" tone="amber">
            <NumberedStepList items={recommendations} />
          </SectionCard>



          <SectionCard label={howToReadTitle}>
            <div className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
              {howToReadParagraphs.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </SectionCard>

          <section
            id="pdf-report"
            data-trackflow-observe-event="secure_report_pdf_preview_visible"
            data-trackflow-analytics-section="pdf"
            data-trackflow-analytics-label="PDF preview visible"
            className="min-w-0 scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 sm:rounded-[2rem]"
          >
            <div className="border-b border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-slate-50 p-5 sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                    Secure review access
                  </p>

                  <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Review the full audit document
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    This private review page keeps the PDF report and related review materials available during the access window.
                  </p>
                </div>

                {expiresLabel ? (
                  <p className="max-w-full shrink-0 break-words rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase leading-5 tracking-[0.14em] text-slate-500 shadow-sm">
                    Access until {expiresLabel}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 grid min-w-0 gap-2 text-xs font-black uppercase leading-5 tracking-[0.12em] text-slate-500 sm:grid-cols-3 sm:gap-3 sm:tracking-[0.14em]">
                <span className="break-words rounded-2xl border border-blue-100 bg-white px-4 py-3 text-center text-blue-700 shadow-sm sm:text-left">
                  Secure PDF preview
                </span>
                <span className="break-words rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-center text-emerald-700 shadow-sm sm:text-left">
                  Download stays here
                </span>
                <span className="break-words rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm sm:text-left">
                  Account access not used
                </span>
              </div>
            </div>

            <div className="overflow-hidden bg-slate-100 p-3 sm:p-4">
              <div className="min-w-0 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.5rem] md:p-5">
                <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Embedded PDF preview
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      Scroll inside the preview to read the full audit.
                    </p>
                  </div>

                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-trackflow-analytics-event="secure_report_pdf_open_click"
                    data-trackflow-analytics-section="pdf"
                    data-trackflow-analytics-label="Open full screen"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-blue-600 sm:w-auto sm:py-2.5"
                  >
                    Open full screen
                  </a>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 md:hidden">
                  <p className="text-sm font-black text-slate-950">PDF preview is ready</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Mobile browsers display PDFs differently. Use Open full PDF or Download PDF for the best reading experience.
                  </p>
                </div>

                <iframe
                  data-trackflow-pdf-preview="true"
                  title="TrackFlow Pro audit PDF preview"
                  srcDoc={getPdfLitePreviewSrcDoc(previewHref)}
                  loading="lazy"
                  className="hidden h-[430px] w-full max-w-full rounded-2xl border border-slate-200 bg-white md:block lg:h-[500px] xl:h-[540px]"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
              <div
                data-trackflow-pdf-status
                role="status"
                aria-live="polite"
                className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"
              >
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span data-trackflow-pdf-status-icon className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Ready
                  </span>
                  <span data-trackflow-pdf-status-message className="min-w-0 break-words text-sm font-bold leading-6">
                    Click Download PDF. The file will prepare here without leaving this secure page.
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <LinkButton
                  href={previewHref}
                  variant="dark"
                  target="_blank"
                  rel="noopener noreferrer"
                  analyticsEvent="secure_report_pdf_open_click"
                  analyticsSection="pdf"
                  analyticsLabel="Open full PDF"
                >
                  Open full PDF
                </LinkButton>

                <a
                  href={downloadHref}
                  download
                  data-trackflow-pdf-download="true"
                  data-trackflow-analytics-event="secure_report_pdf_download_click"
                  data-trackflow-analytics-section="pdf"
                  data-trackflow-analytics-label="Download PDF"
                  data-download-state="idle"
                  data-default-label="Download PDF"
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-center text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/15 sm:min-h-0 sm:w-auto sm:py-3"
                >
                  <span
                    data-trackflow-pdf-download-spinner
                    hidden
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-700"
                  />
                  <span data-trackflow-pdf-download-dot className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span data-trackflow-pdf-download-label>Download PDF</span>
                </a>
              </div>

              <p className="mt-3 text-xs font-semibold leading-6 text-slate-500">
                Download starts in the background, so the visitor stays on this secure review page.
              </p>
            </div>
          </section>
        </aside>
      </section>


      <div id="ask-this-review" className="scroll-mt-24" data-trackflow-sticky-assistant-shell>
        <ReportChatAssistant
          token={token}
          domainSlug={domainSlug}
          companyName={companyName}
          headline={headline}
          ctaHref={ctaHref}
          ctaText={ctaText}
          chatContext={chatQuestionContext}
        />
      </div>

      <section id="book-verification" className="mx-auto w-full max-w-7xl scroll-mt-24 overflow-hidden px-4 pb-24 sm:px-6 sm:pb-16 lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/15 sm:rounded-[2rem]">
          <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="min-w-0 p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Verification call
              </p>

              <h2 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">
                {bookingHeadline}
              </h2>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
                {bookingDescription}
              </p>

              <div className="mt-5 grid min-w-0 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
                {[
                  "Review the finding",
                  "Check account-side evidence",
                  "Confirm the next action",
                ].map((item, index) => (
                  <div key={item} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="mt-3 break-words text-sm font-black leading-6 text-white">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 border-t border-white/10 bg-white/[0.04] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200">
                  Best after reading the review
                </p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  Use the assistant first for a plain-English explanation. Then book a call when you are ready to confirm whether this conversion action is recorded correctly inside the approved tools.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <a
                  href={bookingTrackingHref}
                  target={bookingUrl ? "_blank" : undefined}
                  rel={bookingUrl ? "noopener noreferrer" : undefined}
                  data-trackflow-analytics-event="secure_report_booking_click"
                  data-trackflow-analytics-section="booking"
                  data-trackflow-analytics-label="Book a verification call"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  Book a verification call
                </a>

                <a
                  href="#ask-this-review"
                  data-trackflow-analytics-event="secure_report_assistant_open"
                  data-trackflow-analytics-section="booking"
                  data-trackflow-analytics-label="Ask about this review first"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Ask about this review first
                </a>

                <a
                  href={emailReplyTrackingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-trackflow-analytics-event="secure_report_email_click"
                  data-trackflow-analytics-section="booking"
                  data-trackflow-analytics-label="Reply by Email"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Reply by Email
                </a>
              </div>

              <p className="mt-4 text-xs font-semibold leading-6 text-slate-400">
                {bookingUrl ? "Booking opens securely in a new tab." : "Booking link is not configured yet, so this button uses the current review CTA."}
                {" Reply by Email opens the default email app in a separate tab with a copyable fallback."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReportFooter />
    </main>
  );
}