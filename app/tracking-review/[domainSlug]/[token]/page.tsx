import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import ReportChatAssistant from "@/app/components/trackflow/ReportChatAssistant";
import type { ReportChatQuestionContext } from "@/app/components/trackflow/reportChatQuestions";

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
    title: cleanText(report.evidenceVideoTitle || report.evidence_video_title || raw.title, "Short browser-side evidence walkthrough"),
    description: cleanText(
      report.evidenceVideoDescription || report.evidence_video_description || raw.description,
      "This optional video shows browser-visible evidence from the review. Final confirmation still requires GA4, GTM, Google Ads, CRM, or server access.",
    ),
  };
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

function LinkButton({
  href,
  children,
  variant = "primary",
  target,
  rel,
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
      className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-center text-sm font-black transition focus:outline-none focus:ring-4 sm:w-auto ${styles}`}
    >
      {children}
    </a>
  );
}

function ReportNavbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="TrackFlow Pro home">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-slate-950" />
            <span className="relative text-xl font-black tracking-tight">T</span>
          </span>

          <span className="leading-none">
            <span className="block whitespace-nowrap text-[21px] font-black tracking-[-0.04em] text-slate-950">
              TrackFlow<span className="text-blue-600">Pro</span>
            </span>
            <span className="mt-1 hidden whitespace-nowrap text-[9px] font-black uppercase tracking-[0.22em] text-slate-400 sm:block">
              Tracking & Attribution
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
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
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
    <section className={`rounded-[1.75rem] border p-5 shadow-sm sm:p-6 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div className="mt-4">{children}</div>
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
          className="flex gap-3 text-sm font-semibold leading-6 text-slate-700"
        >
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${markerClass}`} />
          <span>{item}</span>
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
          className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-2xl border border-amber-100 bg-white/70 p-4 shadow-sm shadow-amber-950/5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-500/20">
            {index + 1}
          </span>
          <span className="text-sm font-bold leading-6 text-slate-700">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ReportFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="TrackFlow Pro home">
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-slate-950" />
                <span className="relative text-xl font-black tracking-tight">T</span>
              </span>

              <span>
                <span className="block text-2xl font-black tracking-[-0.04em] text-slate-950">
                  TrackFlow<span className="text-blue-600">Pro</span>
                </span>
                <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Google Ads · GA4 · Server-Side Tracking
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
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                Email TrackFlow Pro
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                LinkedIn Profile
              </a>
            </div>

            <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
              {MAILING_ADDRESS}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrackFlow Pro. Conversion tracking and attribution support.</p>
          <p className="max-w-3xl leading-6">Not affiliated with Google, Meta, or the reviewed business. Audit notes are based on browser-visible evidence first.</p>

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
  const headline = getDisplayHeadline(report, companyName, domain);
  const pageSubheadline = sentenceCaseFirst(cleanText(
    privateReportCopy.subheadline ||
      privateReportCopy.privatePageSubheadline ||
      report.subheadline ||
      report.privatePageSubheadline,
    "This page summarizes the most important browser-visible tracking evidence before any account-level review.",
  ));
  const ctaText = getDisplayCtaText(privateReportCopy.ctaText || report.ctaText || report.cta_text);

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
  const enhancedProofPoints = manualAdsSummary ? cleanList([manualAdsSummary, ...proofPoints], DEFAULT_PROOF_POINTS, 6) : proofPoints;
  const howToReadTitle = cleanText(privateReportCopy.howToReadTitle || report.howToReadTitle || report.how_to_read_title, "How to read this review");
  const howToReadParagraphs = cleanList(
    privateReportCopy.howToReadParagraphs || report.howToReadParagraphs || report.how_to_read_paragraphs || report.howToReadThisReview,
    [
      "This is an initial tracking review, not an account audit. It highlights what can be seen from the website/browser side and where account-level verification should be done.",
      `TrackFlow Pro is not affiliated with Google, Meta, or ${companyName}.`,
    ],
    3,
  );
  const expiresLabel = formatDate(report.pdfExpiresAt || report.expiresAt);
  const previewHref = `/api/trackflow/reports/preview?token=${encodeURIComponent(token)}`;
  const downloadHref = `/api/trackflow/reports/download?token=${encodeURIComponent(token)}`;

  const ctaTarget = cleanCtaTarget(report.ctaUrl);
  const ctaHref = `/api/trackflow/reports/cta?token=${encodeURIComponent(token)}&target=${encodeURIComponent(ctaTarget)}`;
  const bookingUrl = getBookingUrl(report, privateReportCopy);
  const bookingHref = bookingUrl || ctaHref;
  const bookingHeadline = cleanText(
    privateReportCopy.bookingHeadline || report.bookingHeadline || report.booking_headline,
    "Ready to verify this tracking setup live?",
  );
  const bookingDescription = cleanText(
    privateReportCopy.bookingDescription || report.bookingDescription || report.booking_description,
    "Book a short verification call to review GA4, Google Ads, GTM, CRM, or server-side recording with approved account access.",
  );

  const reportDate =
    formatDate(report.createdAt || report.registeredAt || report.uploadedAt) ||
    formatDate(new Date().toISOString());

  const primaryConversionFocus = cleanText(privateReportCopy.primaryActionLabel || report.primaryActionLabel || "", "") || getPrimaryConversionFocus(report, privateReportCopy);
  const businessTypeLabel = getBusinessTypeLabel(report, privateReportCopy);
  const reviewFocusLabel = primaryConversionFocus || businessTypeLabel || "Conversion path review";
  const evidenceVideo = getEvidenceVideoDisplay(report);
  const heroSummaryCards = [
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
      value: "Ask the assistant, then book verification",
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
    primaryConversionFocus,
    businessType: businessTypeLabel,
    whatChecked,
    proofPoints: enhancedProofPoints,
    recommendations,
    auditSnapshotQuestions,
    manualAdsSummary,
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ReportViewBeacon token={token} />
      <PdfDownloadExperienceScript />
      <ReportNavbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-12rem] top-[-12rem] h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-16">
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
              Private tracking review
            </div>

            <h1 className="mt-6 max-w-4xl break-words text-4xl font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              Prepared for <span className="font-black text-slate-950">{companyName}</span>
              {domain ? <span> · {domain}</span> : null}. {pageSubheadline}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {heroSummaryCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-slate-200 bg-white/85 p-4 shadow-sm shadow-slate-950/5 backdrop-blur"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-black leading-5 text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <LinkButton href="#findings" variant="dark">
                View findings
              </LinkButton>

              <LinkButton href="#ask-this-review" variant="primary">
                Ask about this review
              </LinkButton>

              <LinkButton href="#book-verification" variant="secondary">
                Book a verification call
              </LinkButton>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
              <a href="#pdf-report" className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-blue-200 hover:text-blue-700">
                Full PDF report available
              </a>
              {evidenceVideo ? (
                <a href="#evidence-video" className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-blue-700 transition hover:border-blue-200 hover:bg-white">
                  Short evidence video available
                </a>
              ) : null}
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
                Report-aware assistant included
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                Prepared by TrackFlow Pro
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                Browser-visible evidence
              </span>
              {reportDate ? (
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {reportDate}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                No account access used
              </span>
              {manualAds.checked ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
                  Ads Transparency: {manualAds.adsFound === "yes" ? "Ads found" : manualAds.adsFound === "no" ? "No ads found" : "Checked"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10 lg:p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Questions this review can answer
              </p>

              <p className="mt-4 text-2xl font-black tracking-[-0.04em]">
                {auditSnapshotTitle}
              </p>

              <div className="mt-6 grid gap-3">
                {auditSnapshotQuestions.map((item) => (
                  <a
                    key={item}
                    href="#ask-this-review"
                    className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold leading-6 text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-300/40 hover:bg-blue-500/15 hover:text-white"
                  >
                    <span>{item}</span>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.16em] text-blue-200 opacity-80 group-hover:text-blue-100">
                      Ask the assistant
                    </span>
                  </a>
                ))}
              </div>

              <a
                href="#ask-this-review"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
              >
                Ask about this review
              </a>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                Evidence-safe assistant
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-blue-950">
                The assistant explains this review using the saved report context. Final confirmation still requires approved access to GA4, Google Ads, GTM, CRM, or server-side tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:p-5">
          {trustSignals.map((item, index) => (
            <div key={item} className="flex items-start gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                {index + 1}
              </span>
              <p className="text-sm font-black leading-6 text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="findings"
        className="mx-auto grid max-w-7xl scroll-mt-24 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16"
      >
        <div className="space-y-6">
          <SectionCard label="Primary finding" tone="blue">
            <p className="text-lg font-black leading-8 text-slate-950">{mainFinding}</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-blue-950/70">
              This section summarizes the main browser-visible point to review before relying on the data for reporting or optimisation decisions.
            </p>
          </SectionCard>

          <SectionCard label="Business impact" tone="green">
            <p className="text-base font-bold leading-8 text-emerald-950">{businessImpact}</p>
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
            <BulletList items={enhancedProofPoints} marker="slate" />
          </SectionCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard label="Recommended verification plan" tone="amber">
            <NumberedStepList items={recommendations} />
          </SectionCard>



          {evidenceVideo ? (
            <section
              id="evidence-video"
              className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-xl shadow-blue-950/5 sm:rounded-[2rem]"
            >
              <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 sm:text-[11px] sm:tracking-[0.2em]">
                  Short evidence video
                </p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 sm:mt-3 sm:text-2xl">
                  Watch the browser-side walkthrough
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 sm:mt-3 sm:leading-7">
                  {evidenceVideo.description}
                </p>
              </div>

              <div className="bg-slate-100 p-2 sm:p-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-950 shadow-inner sm:rounded-[1.25rem]">
                  <iframe
                    title={evidenceVideo.title}
                    src={evidenceVideo.embedUrl}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-xs font-semibold leading-6 text-slate-500">
                  Video is optional evidence support. The PDF report and account-level verification remain the main source of truth.
                </p>
              </div>
            </section>
          ) : null}

          <SectionCard label={howToReadTitle}>
            <div className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
              {howToReadParagraphs.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </SectionCard>

          <section id="pdf-report" className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
            <div className="border-b border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-slate-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                    Full PDF report
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Review the full audit document
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    Preview the audit document directly on this page, or download it securely without leaving the review.
                  </p>
                </div>

                {expiresLabel ? (
                  <p className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                    Available until {expiresLabel}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-3">
                <span className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-700 shadow-sm">
                  Secure PDF stream
                </span>
                <span className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-emerald-700 shadow-sm">
                  Download stays on page
                </span>
                <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  Account access not used
                </span>
              </div>
            </div>

            <div className="bg-slate-100 p-3 sm:p-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-blue-600"
                  >
                    Open full screen
                  </a>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 md:hidden">
                  <p className="text-sm font-black text-slate-950">PDF preview is ready</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Mobile browsers display PDFs differently. Use Open full screen or Download PDF for the best reading experience.
                  </p>
                </div>

                <iframe
                  title="TrackFlow Pro audit PDF preview"
                  src={previewHref}
                  loading="lazy"
                  className="hidden h-[640px] w-full rounded-2xl border border-slate-200 bg-white md:block lg:h-[720px]"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-5">
              <div
                data-trackflow-pdf-status
                role="status"
                aria-live="polite"
                className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span data-trackflow-pdf-status-icon className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Ready
                  </span>
                  <span data-trackflow-pdf-status-message className="text-sm font-bold leading-6">
                    Click Download PDF — the file will prepare here without leaving this secure page.
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LinkButton href={previewHref} variant="dark" target="_blank" rel="noopener noreferrer">
                  Open PDF
                </LinkButton>

                <a
                  href={downloadHref}
                  download
                  data-trackflow-pdf-download="true"
                  data-download-state="idle"
                  data-default-label="Download PDF"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/15 sm:w-auto"
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


      <ReportChatAssistant
        token={token}
        domainSlug={domainSlug}
        companyName={companyName}
        headline={headline}
        ctaHref={ctaHref}
        ctaText={ctaText}
        chatContext={chatQuestionContext}
      />

      <section id="book-verification" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-8 lg:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Verification call
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                {bookingHeadline}
              </h2>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
                {bookingDescription}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  "Review the finding",
                  "Check account-side evidence",
                  "Confirm the next action",
                ].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-black leading-6 text-white">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.04] p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200">
                  Best after reading the review
                </p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  Use the assistant first if you want a plain-English explanation. Then book a call when you are ready to verify the conversion path inside the actual tools.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <a
                  href={bookingHref}
                  target={bookingUrl ? "_blank" : undefined}
                  rel={bookingUrl ? "noopener noreferrer" : undefined}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  Book a verification call
                </a>

                <a
                  href="#ask-this-review"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Ask the assistant first
                </a>

                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Tracking Review Request - ${companyName === "this website" ? "Website" : companyName}`)}`}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Reply by Email
                </a>
              </div>

              <p className="mt-4 text-xs font-semibold leading-6 text-slate-400">
                {bookingUrl ? "Booking opens securely in a new tab." : "Booking link is not configured yet, so this button uses the current review CTA."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReportFooter />
    </main>
  );
}