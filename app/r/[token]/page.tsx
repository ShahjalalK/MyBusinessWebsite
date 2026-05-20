import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Tracking Review | TrackFlow Pro",
  description: "A private browser-visible tracking review prepared by TrackFlow Pro.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type ReportPageProps = {
  params: Promise<{ token: string }> | { token: string };
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
  if (/https?:\/\//i.test(text) || /www\./i.test(text)) return true;
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
    report.preparedFor,
    report.prepared_for,
    report.displayCompanyName,
    report.display_company_name,
    report.clientName,
    report.client_name,
    report.businessName,
    report.business_name,
    report.companyName,
    report.company_name,
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
  if (/https?:\/\//i.test(text) || /www\./i.test(text)) return true;
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
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition focus:outline-none focus:ring-4 ${styles}`}
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
    <section className={`rounded-[1.75rem] border p-6 shadow-sm ${toneClass}`}>
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

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const token = normalizeToken(resolvedParams.token);

  if (!token) notFound();

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

  const mainFinding = sentenceCaseFirst(cleanText(
    privateReportCopy.mainFinding || report.mainFinding || report.mainIssue,
    "A conversion tracking review may be useful based on public browser-visible evidence.",
  ));

  const businessImpact = sentenceCaseFirst(cleanText(
    privateReportCopy.businessImpact || report.businessImpact,
    "If important lead actions are not measured clearly, it can be harder to know which marketing channels are creating enquiries.",
  ));

  const whatChecked = cleanList(privateReportCopy.whatChecked || report.whatChecked || report.auditScope, DEFAULT_CHECKS, 6);
  const proofPoints = cleanList(privateReportCopy.proofPoints || report.proofPoints || report.evidencePoints, DEFAULT_PROOF_POINTS, 6);
  const recommendations = cleanList(privateReportCopy.recommendations || report.recommendations || report.nextSteps, DEFAULT_RECOMMENDATIONS, 6);
  const auditSnapshotTitle = cleanText(
    privateReportCopy.auditSnapshotTitle || report.auditSnapshotTitle || report.audit_snapshot_title,
    "What this review is designed to clarify",
  );
  const auditSnapshotQuestions = cleanList(
    privateReportCopy.auditSnapshotQuestions || report.auditSnapshotQuestions || report.audit_snapshot_questions,
    [
      "Are key tracking tags visible from the browser?",
      "Does the lead path show clear conversion evidence?",
      "Is account-level verification recommended?",
    ],
    3,
  );
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
  const ctaHeadline = cleanText(privateReportCopy.ctaHeadline || report.ctaHeadline || report.cta_headline, "Want this verified inside your actual accounts?");
  const ctaDescription = cleanText(
    privateReportCopy.ctaDescription || report.ctaDescription || report.cta_description,
    "I can check the conversion path inside GA4, Google Ads, GTM, CRM, or server tools and confirm whether your lead tracking is recording correctly.",
  );

  const expiresLabel = formatDate(report.pdfExpiresAt || report.expiresAt);
  const previewHref = `/api/trackflow/reports/preview?token=${encodeURIComponent(token)}`;
  const downloadHref = `/api/trackflow/reports/download?token=${encodeURIComponent(token)}`;

  const ctaTarget = cleanCtaTarget(report.ctaUrl);
  const ctaHref = `/api/trackflow/reports/cta?token=${encodeURIComponent(token)}&target=${encodeURIComponent(ctaTarget)}`;

  const reportDate =
    formatDate(report.createdAt || report.registeredAt || report.uploadedAt) ||
    formatDate(new Date().toISOString());

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ReportViewBeacon token={token} />
      <ReportNavbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-12rem] top-[-12rem] h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-16">
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
              Private tracking review
            </div>

            <h1 className="mt-6 max-w-4xl break-words text-4xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Prepared for <span className="font-black text-slate-950">{companyName}</span>
              {domain ? <span> · {domain}</span> : null}. {pageSubheadline}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#findings" variant="dark">
                View findings
              </LinkButton>

              <LinkButton href="#pdf-report" variant="secondary">
                View PDF report
              </LinkButton>
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
                Audit snapshot
              </p>

              <p className="mt-4 text-2xl font-black tracking-[-0.04em]">
                {auditSnapshotTitle}
              </p>

              <div className="mt-6 grid gap-3">
                {auditSnapshotQuestions.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold leading-6 text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
                Important note
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-amber-950">
                This is a public browser-visible review. Final confirmation requires access to GA4,
                Google Ads, GTM, CRM, or server-side tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3 lg:p-6">
          {trustSignals.map((item) => (
            <div key={item} className="rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 h-2 w-10 rounded-full bg-blue-600" />
              <p className="text-sm font-black leading-6 text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="findings"
        className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16"
      >
        <div className="space-y-6">
          <SectionCard label="Main finding" tone="blue">
            <p className="text-lg font-black leading-8 text-slate-950">{mainFinding}</p>
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

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <SectionCard label="Recommended next step" tone="amber">
            <BulletList items={recommendations} marker="green" />
          </SectionCard>

          <SectionCard label={howToReadTitle}>
            <div className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
              {howToReadParagraphs.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </SectionCard>

          <section id="pdf-report" className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                Full PDF report
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Review the full audit document
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                The PDF preview is streamed through TrackFlow Pro, so the client should not see a Google Drive login screen. Previewing does not count as a download; only the download button records a PDF download signal.
              </p>

              {expiresLabel ? (
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Available until {expiresLabel}
                </p>
              ) : null}
            </div>

            <div className="bg-slate-100 p-4">
              <iframe
                title="TrackFlow Pro audit PDF preview"
                src={previewHref}
                loading="lazy"
                className="h-[520px] w-full rounded-2xl border border-slate-200 bg-white"
              />
            </div>

            <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2">
              <LinkButton href={previewHref} variant="dark" target="_blank" rel="noopener noreferrer">
                Open PDF
              </LinkButton>

              <LinkButton href={downloadHref} variant="secondary" target="_blank" rel="noopener noreferrer">
                Download PDF
              </LinkButton>
            </div>
          </section>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Next step
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                {ctaHeadline}
              </h2>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
                {ctaDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                {ctaText}
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Tracking Review Request - ${companyName === "this website" ? "Website" : companyName}`)}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                Reply by Email
              </a>
            </div>
          </div>
        </div>
      </section>

      <ReportFooter />
    </main>
  );
}