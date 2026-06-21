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
  description: "A private tracking review prepared by TrackFlow Pro.",
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


type SecureEvidenceAssetDisplay = {
  id: string;
  role: string;
  roleLabel: string;
  caption: string;
  fileName: string;
  mimeType: string;
  sizeLabel: string;
  pageUrl: string;
  src: string;
  displayOrder: number;
  redacted: boolean;
};

type SecureEvidenceSectionCopy = {
  eyebrow: string;
  title: string;
  introText: string;
  noteTitle: string;
  noteText: string;
  summaryCards: { label: string; value: string }[];
  analyticsLabel: string;
};

type BusinessImpactArticleSection = {
  title: string;
  body: string[];
};

type BusinessImpactArticle = {
  eyebrow: string;
  title: string;
  summary: string;
  highlights: { label: string; value: string }[];
  modalIntro: string[];
  sections: BusinessImpactArticleSection[];
  recommendedStep: string;
  analyticsLabel: string;
};

const DEFAULT_CHECKS = [
  "GA4 and Google Tag Manager signals checked with Tag Assistant",
  "Google Ads conversion and remarketing request signals",
  "Lead form or enquiry-path tracking indicators",
  "Server-side or first-party tracking-like request signals",
];

const DEFAULT_PROOF_POINTS = [
  "The review is based on Tag Assistant and browser test evidence captured during the review.",
  "Approved account access can confirm the same signals in GA4, GTM, Google Ads, CRM, or server records.",
];

const DEFAULT_RECOMMENDATIONS = [
  "Verify the main lead journey inside GTM Preview, GA4 DebugView, and Google Ads conversion diagnostics.",
  "Compare the same test inside GA4, GTM, Google Ads, CRM, or server records before making final tracking decisions.",
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
  "Reviewed with Tag Assistant and browser testing",
  "No GA4, GTM, Google Ads, CRM, or server login was used",
  "Approved account check can confirm final recording",
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
    title: cleanText(report.evidenceVideoTitle || report.evidence_video_title || raw.title, "Short Tag Assistant evidence walkthrough"),
    description: cleanText(
      report.evidenceVideoDescription || report.evidence_video_description || raw.description,
      "This optional video shows the review evidence captured during the test. Approved account access can confirm the same recording in GA4, GTM, Google Ads, CRM, or server records.",
    ),
  };
}


const SECURE_EVIDENCE_ROLE_LABELS: Record<string, string> = {
  form_success: "Website / selected action screenshot",
  tag_assistant_after_submission: "Tag Assistant / browser review screenshot",
  ga4_debugview: "GA4 DebugView screenshot",
  gtm_preview: "GTM Preview screenshot",
  ga4_debugview_or_gtm_preview: "GA4 DebugView / GTM Preview screenshot",
  google_ads_diagnostics: "Google Ads diagnostics screenshot",
  proof_screenshot: "Review proof screenshot",
};

function normalizeSecureEvidenceRole(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "proof_screenshot";
}

function getSecureEvidenceRoleLabel(role: string, fallback = "Review proof screenshot"): string {
  return SECURE_EVIDENCE_ROLE_LABELS[normalizeSecureEvidenceRole(role)] || fallback;
}

function isAllowedSecureEvidenceMimeType(value: unknown): boolean {
  const type = cleanText(value, "").toLowerCase();
  return ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(type);
}

function formatBytes(value: unknown): string {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function firstArrayCandidate(...values: unknown[]): any[] {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

type SecureEvidenceDisplayCopyInput = {
  role: string;
  index: number;
  fallbackRoleLabel: string;
  fallbackCaption: string;
  isSetupFirst: boolean;
  manualEvidenceHero: ManualEvidenceHero | null;
  setupActionLabel?: string;
  reviewFocusLabel?: string;
  reportMode?: string;
};

function getModeAwareSecureEvidenceDisplayCopy({
  role,
  index,
  fallbackRoleLabel,
  fallbackCaption,
  isSetupFirst,
  manualEvidenceHero,
  setupActionLabel,
  reviewFocusLabel,
  reportMode,
}: SecureEvidenceDisplayCopyInput): { roleLabel: string; caption: string } {
  const normalizedRole = normalizeSecureEvidenceRole(role);
  const actionLabel = cleanText(manualEvidenceHero?.actionLabel || setupActionLabel || reviewFocusLabel, "selected customer action");
  const expectedEvent = cleanText(manualEvidenceHero?.expectedEvent, "");
  const observedEvent = cleanText(manualEvidenceHero?.observedEvent, "Not clearly observed");
  const cleanMode = cleanText(reportMode, "").toLowerCase();
  const looksLikeTagAssistant =
    normalizedRole.includes("tag_assistant") ||
    normalizedRole.includes("debugview") ||
    normalizedRole.includes("gtm_preview") ||
    index === 1;
  const looksLikeActionContext = normalizedRole === "form_success" || normalizedRole === "browser_side_proof" || index === 0;

  if (isSetupFirst) {
    if (looksLikeTagAssistant) {
      return {
        roleLabel: "Tag Assistant setup check",
        caption: "The Tag Assistant/browser review did not clearly confirm the GA4/GTM foundation needed before conversion-event testing.",
      };
    }

    if (looksLikeActionContext) {
      return {
        roleLabel: "Future test target context",
        caption: "This screenshot shows the selected customer action that should be tested after the GA4/GTM foundation is installed or confirmed.",
      };
    }
  }

  if (looksLikeTagAssistant) {
    if (expectedEvent && cleanMode === "event_positive_snapshot") {
      return {
        roleLabel: `Tag Assistant after ${actionLabel}`,
        caption: `Expected event ${expectedEvent} was observed during the browser-visible/manual review. Final account-side confirmation is still recommended.`,
      };
    }

    if (expectedEvent) {
      return {
        roleLabel: `Tag Assistant after ${actionLabel}`,
        caption: `Expected event ${expectedEvent} was not clearly observed. Observed result: ${observedEvent}.`,
      };
    }

    return {
      roleLabel: `Tag Assistant after ${actionLabel}`,
      caption: `The Tag Assistant result should be compared with GA4/GTM and account-side records for ${actionLabel}.`,
    };
  }

  if (looksLikeActionContext) {
    return {
      roleLabel: `${actionLabel} test context`,
      caption: `This screenshot shows the selected ${actionLabel} action context from the manual review.`,
    };
  }

  return {
    roleLabel: fallbackRoleLabel,
    caption: fallbackCaption || fallbackRoleLabel,
  };
}

function getSecureEvidenceAssetDisplays(
  report: Record<string, any>,
  token: string,
  options: {
    isSetupFirst: boolean;
    manualEvidenceHero: ManualEvidenceHero | null;
    setupActionLabel?: string;
    reviewFocusLabel?: string;
    reportMode?: string;
  },
): SecureEvidenceAssetDisplay[] {
  const privateReportCopy = getPrivateReportCopy(report);
  const rawAssets = firstArrayCandidate(
    report.securePageEvidenceAssets,
    report.secure_page_evidence_assets,
    privateReportCopy.securePageEvidenceAssets,
    privateReportCopy.secure_page_evidence_assets,
  );

  const seen = new Set<string>();
  const output: SecureEvidenceAssetDisplay[] = [];

  rawAssets.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const raw = item as Record<string, any>;
    const assetId = cleanText(raw.id || raw.assetId || raw.asset_id, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
    const b2Key = cleanText(raw.b2Key || raw.b2_key || raw.key || raw.storageKey || raw.storage_key, "");
    const mimeType = cleanText(raw.mimeType || raw.mime_type, "").toLowerCase();

    if (!assetId || !b2Key || !isAllowedSecureEvidenceMimeType(mimeType)) return;
    if (!b2Key.includes(`/${token}/secure-evidence/`)) return;
    if (seen.has(assetId)) return;
    seen.add(assetId);

    const role = normalizeSecureEvidenceRole(raw.role);
    const fallbackRoleLabel = getSecureEvidenceRoleLabel(role);
    const fallbackCaption = cleanText(raw.caption || raw.title || raw.label, fallbackRoleLabel);
    const { roleLabel, caption } = getModeAwareSecureEvidenceDisplayCopy({
      role,
      index,
      fallbackRoleLabel,
      fallbackCaption,
      isSetupFirst: options.isSetupFirst,
      manualEvidenceHero: options.manualEvidenceHero,
      setupActionLabel: options.setupActionLabel,
      reviewFocusLabel: options.reviewFocusLabel,
      reportMode: options.reportMode,
    });
    const fileName = cleanText(raw.fileName || raw.file_name || raw.name, "Proof screenshot");
    const pageUrl = normalizeManualHeroUrl(raw.pageUrl || raw.page_url || raw.url);
    const displayOrder = Number.isFinite(Number(raw.displayOrder ?? raw.display_order)) ? Number(raw.displayOrder ?? raw.display_order) : index + 1;

    output.push({
      id: assetId,
      role,
      roleLabel,
      caption,
      fileName,
      mimeType,
      sizeLabel: formatBytes(raw.sizeBytes ?? raw.size_bytes),
      pageUrl,
      src: `/api/report-evidence?token=${encodeURIComponent(token)}&assetId=${encodeURIComponent(assetId)}`,
      displayOrder,
      redacted: raw.redacted !== false,
    });
  });

  return output.sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 2);
}

function getSecureEvidenceSectionCopy({
  isSetupFirst,
  manualEvidenceHero,
  setupActionLabel,
  reviewFocusLabel,
  reportMode,
}: {
  isSetupFirst: boolean;
  manualEvidenceHero: ManualEvidenceHero | null;
  setupActionLabel?: string;
  reviewFocusLabel?: string;
  reportMode?: string;
}): SecureEvidenceSectionCopy {
  const actionLabel = cleanText(manualEvidenceHero?.actionLabel || setupActionLabel || reviewFocusLabel, "selected customer action");
  const cleanMode = cleanText(reportMode, "").replace(/[_-]+/g, " ").trim();

  if (isSetupFirst) {
    return {
      eyebrow: "Tracking foundation evidence",
      title: "GA4/GTM foundation should be set up first",
      introText:
        "These screenshots support a setup-first review. They show the tracking setup context captured during the Tag Assistant/browser review before any conversion-event judgment is made.",
      noteTitle: "Setup-first note",
      noteText:
        "No event failure is being claimed here. First set up or confirm the GA4/GTM foundation, then run one controlled test for the selected business action.",
      summaryCards: [
        { label: "Report mode", value: cleanMode || "Setup first" },
        { label: "Event judgment", value: "Not claimed yet" },
        { label: "Next step", value: "Confirm setup" },
      ],
      analyticsLabel: "Tracking foundation evidence screenshots visible",
    };
  }

  return {
    eyebrow: "Tag Assistant proof screenshots",
    title: "Visual evidence from the manual test",
    introText:
      "These screenshots show the selected action context and the Tag Assistant view captured during the manual test.",
    noteTitle: "How to read this evidence",
    noteText:
      "Use these images as visual context from the test. The same action can be confirmed later inside GA4, GTM, Google Ads, and the relevant lead records.",
    summaryCards: [
      { label: "Review focus", value: actionLabel },
      { label: "Evidence type", value: "Tag Assistant screenshots" },
      { label: "Next check", value: "Confirm in accounts" },
    ],
    analyticsLabel: "Tag Assistant manual test proof screenshots visible",
  };
}

function getBusinessImpactArticle({
  isSetupFirst,
  manualEvidenceHero,
  setupActionLabel,
  reviewFocusLabel,
}: {
  isSetupFirst: boolean;
  manualEvidenceHero: ManualEvidenceHero | null;
  setupActionLabel?: string;
  reviewFocusLabel?: string;
}): BusinessImpactArticle {
  const actionLabel = cleanText(manualEvidenceHero?.actionLabel || setupActionLabel || reviewFocusLabel, "the selected business action");
  const expectedEvent = cleanText(manualEvidenceHero?.expectedEvent, "");
  const expectedEventPhrase = expectedEvent ? `the expected conversion event, ${expectedEvent}` : "the expected conversion event";

  if (isSetupFirst) {
    return {
      eyebrow: "Business impact",
      title: "Business impact if the GA4/GTM tracking foundation is not set up",
      summary:
        "GA4 and Google Tag Manager are not only useful for Google Ads or Facebook/Meta Ads. They are the measurement foundation that helps a business understand website activity, lead actions, channel quality, and reporting performance.",
      highlights: [
        { label: "Website clarity", value: "Visitor behavior and page performance may be harder to understand." },
        { label: "Lead tracking", value: "Key actions need the foundation before they can be measured reliably." },
        { label: "Channel reporting", value: "Search, social, referral, email, direct, and paid traffic may be harder to compare." },
        { label: "Dashboard readiness", value: "Looker Studio needs reliable GA4/GTM data behind it." },
      ],
      modalIntro: [
        "GA4 and Google Tag Manager are not only useful for Google Ads or Facebook/Meta Ads. They are the measurement foundation that helps a business understand what people are doing on the website, which pages are working, and which actions are creating real business value.",
        "In this review, the Tag Assistant check did not show a clear GA4/GTM tracking foundation for the website. Because the foundation itself needs to be set up or verified first, this review does not judge individual events such as generate_lead, form_submit, phone_click, booking, or purchase yet.",
        "The first priority is to confirm the analytics foundation. After that, the main business actions can be tested properly.",
      ],
      sections: [
        {
          title: "Website performance may be difficult to understand",
          body: [
            "The business may be getting visitors, but without a proper analytics foundation, it becomes difficult to see what those visitors are actually doing.",
            "For example, it may be unclear which pages people visit most, where they lose interest, which service pages perform better, or which pages help turn visitors into enquiries.",
          ],
        },
        {
          title: "Lead tracking may not be ready",
          body: [
            "Important actions such as form submissions, phone clicks, WhatsApp enquiries, bookings, purchases, or enquiry button clicks need a proper tracking foundation before they can be measured reliably.",
            "Without GA4/GTM in place, the business may receive leads, but those actions may not be recorded clearly inside analytics or reporting dashboards.",
          ],
        },
        {
          title: "Marketing channel reporting may be incomplete",
          body: [
            "This is not only a paid ads issue. Even if the business is not running Google Ads or Facebook Ads, GA4/GTM still helps show which channels are bringing quality visitors.",
            "That can include Google Search, Facebook, Instagram, LinkedIn, referral websites, email campaigns, direct traffic, and other marketing sources.",
            "Without this foundation, it becomes harder to understand which channels are helping the business grow.",
          ],
        },
        {
          title: "Paid ads decisions may be harder",
          body: [
            "For businesses running Google Ads, Facebook Ads, Meta Ads, or other paid campaigns, the ad platforms may still show clicks, impressions, reach, and spend.",
            "But the business also needs to know what happened after those people reached the website. Did they view the right page? Did they submit a form? Did they call? Did they book? Did they become a lead?",
            "Without GA4/GTM and properly tested events, it becomes harder to connect ad spend with real customer actions.",
          ],
        },
        {
          title: "Landing page performance may be unclear",
          body: [
            "A landing page can receive traffic but still fail to produce enquiries. Without analytics and event tracking, it becomes harder to see which pages are helping visitors take action and which pages need improvement.",
            "This can make website and campaign optimization slower and less accurate.",
          ],
        },
        {
          title: "Looker Studio reporting may not have reliable website data",
          body: [
            "Looker Studio can be a very useful reporting dashboard, but it depends on the quality of the data behind it.",
            "If GA4/GTM is not set up and key actions are not configured, the dashboard may show limited information. It may not clearly show website behavior, lead actions, conversion paths, landing page performance, or channel-level results.",
            "A stronger dashboard starts with a stronger tracking foundation.",
          ],
        },
        {
          title: "Historical data may be missed",
          body: [
            "If GA4 is not set up today, the business cannot go back later and recover the website behavior data that was missed.",
            "Setting up tracking early helps create a baseline. That baseline can be used later to compare performance before and after website updates, SEO work, advertising campaigns, landing page changes, or conversion improvements.",
          ],
        },
        {
          title: "Business decisions may depend too much on guesswork",
          body: [
            "Without a clear measurement foundation, the business may have to rely on partial signals such as inbox messages, calls, ad platform numbers, or manual assumptions.",
            "Those signals are useful, but they do not always show the full website-to-lead journey. A proper GA4/GTM setup helps connect traffic, pages, actions, and business outcomes in a more structured way.",
          ],
        },
      ],
      recommendedStep:
        "Set up or verify the GA4/GTM tracking foundation first. After the foundation is confirmed, test the selected business action in a controlled way, such as form submission, phone click, WhatsApp click, booking, checkout, purchase, or another key customer action. Once the foundation and key events are verified, the business can use the data more confidently for GA4 reporting, Google Ads and Facebook/Meta Ads optimization, Looker Studio dashboards, cost-per-lead analysis, landing page improvement, remarketing audiences, and better marketing decisions.",
      analyticsLabel: "Business impact modal for tracking foundation setup",
    };
  }

  return {
    eyebrow: "Business impact",
    title: "Business impact if the expected conversion event is not recorded",
    summary:
      `${actionLabel} reached the completion/success state during the manual test, but ${expectedEventPhrase} was not observed in the Tag Assistant result. This can affect lead reporting, paid ads optimization, cost-per-lead analysis, remarketing, and Looker Studio reporting.`,
    highlights: [
      { label: "Lead reporting", value: "Traffic may be visible, but completed lead actions may not be counted clearly." },
      { label: "Paid ads", value: "Google Ads and Meta Ads may be judged by surface-level activity instead of real enquiries." },
      { label: "Cost per lead", value: "Ad spend may be harder to connect with actual form submissions, calls, bookings, or enquiries." },
      { label: "Looker Studio", value: "Dashboards may show activity but miss the final visitor-to-lead result." },
    ],
    modalIntro: [
      "GA4 or Google Tag Manager may already be installed on the website, but installation alone does not always mean the most important business actions are being measured correctly.",
      "For a business, the real value is not only knowing that someone visited the website. The important question is whether completed actions — such as form submissions, phone clicks, WhatsApp enquiries, bookings, purchases, or other lead actions — are being recorded clearly after the visitor completes them.",
      `In this review, the selected action was tested manually. The action reached the completion/success state, but ${expectedEventPhrase} was not observed in the Tag Assistant result.`,
    ],
    sections: [
      {
        title: "Lead reporting may be incomplete",
        body: [
          "The website may still receive real enquiries or form submissions, but GA4 may not record those actions clearly as leads.",
          "This means the business can see traffic, page views, and engagement, but may not have a clear count of how many visitors actually became leads.",
        ],
      },
      {
        title: "Paid ads may be harder to optimize",
        body: [
          "For businesses running Google Ads, Facebook Ads, Meta Ads, or other paid campaigns, accurate conversion tracking is especially important.",
          "Ad platforms can show clicks, impressions, reach, and engagement, but the business still needs to know what happened after the click.",
          "If the expected lead event is not recorded, it becomes harder to understand which campaign, audience, keyword, creative, or landing page is producing real enquiries. Paid campaigns may then be judged by surface-level activity instead of completed business actions.",
        ],
      },
      {
        title: "Cost per lead may be difficult to measure",
        body: [
          "Ad spend is only meaningful when it can be connected to real outcomes.",
          "If form submissions, calls, bookings, WhatsApp clicks, or other lead actions are not passed correctly as conversions, the business may know how much was spent but may not clearly know which spend produced actual enquiries.",
          "This makes cost-per-lead reporting less reliable and can make budget decisions harder.",
        ],
      },
      {
        title: "Good traffic and weak traffic may look similar",
        body: [
          "When only page views, sessions, or engagement events are visible, a visitor who simply browses the website can look very similar to a visitor who submits a form or becomes a real lead.",
          "This can make reporting less accurate because the final business action is missing from the journey.",
        ],
      },
      {
        title: "Campaign and landing page performance may be unclear",
        body: [
          "A proper conversion event helps show which campaigns and landing pages are moving visitors toward action.",
          "Without that event, it becomes harder to identify which pages are generating enquiries and which pages need improvement.",
          "The business may see traffic coming in, but the final step from visitor to lead may remain unclear.",
        ],
      },
      {
        title: "Remarketing audiences may be less accurate",
        body: [
          "A clear lead event helps separate people who completed a key action from people who only visited the website.",
          "Without that separation, remarketing audiences may be incomplete or less useful.",
          "This can affect future Google Ads, Facebook/Meta Ads, and retargeting campaigns because the business may not be able to properly include or exclude the right users.",
        ],
      },
      {
        title: "Looker Studio reports may miss the final business result",
        body: [
          "Looker Studio can turn GA4, Google Ads, Meta Ads, and other data into a clear business dashboard. But the dashboard is only as useful as the data behind it.",
          "If the expected conversion event is missing, a Looker Studio report may still show traffic, sessions, clicks, landing pages, and engagement — but it may miss the most important step: which visitors actually became leads.",
          "This can make client reporting look complete on the surface while still missing the final business outcome.",
        ],
      },
      {
        title: "Business decisions may be based on partial data",
        body: [
          "When the selected business action is not tracked correctly, the business may make decisions using incomplete information.",
          "A campaign may look weak because the leads are not being recorded properly. Another campaign may look strong because it brings traffic, even if it does not produce real enquiries.",
          "This can make it harder to decide where to increase budget, where to reduce spend, and which parts of the website need improvement.",
        ],
      },
    ],
    recommendedStep:
      "Test the selected action again inside GTM Preview, GA4 DebugView, Google Ads conversion diagnostics, and the relevant lead records such as the form inbox, CRM, booking platform, call records, WhatsApp records, or backend records. If the expected event is missing, adjust the setup so that the correct conversion event fires only after the successful completion of the selected business action. Once the event is verified, the business can use the data more confidently for GA4 reporting, Google Ads and Facebook/Meta Ads optimization, Looker Studio dashboards, cost-per-lead analysis, remarketing audiences, and better marketing decisions.",
    analyticsLabel: "Business impact modal for expected conversion event not recorded",
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
      ? "This review used manual Tag Assistant/browser testing. Call tracking can be confirmed inside GA4, GTM, Google Ads call conversions, the call-tracking platform, CRM, or server records."
      : actionKey === "booking"
        ? "This review used manual Tag Assistant/browser testing. Booking recording can be confirmed inside GA4, GTM, Google Ads, the booking platform, CRM, or server records."
        : actionKey === "ecommerce"
          ? "This review used manual Tag Assistant/browser testing. Cart, checkout, or purchase recording can be confirmed inside GA4, GTM, Google Ads, the ecommerce platform, order records, or server records."
          : actionKey === "whatsapp"
            ? "This review used manual Tag Assistant/browser testing. WhatsApp enquiry recording can be confirmed inside GA4, GTM, Google Ads, WhatsApp or CRM records, and server records where relevant."
            : actionKey === "email_click"
              ? "This review used manual Tag Assistant/browser testing. Email enquiry recording can be confirmed inside GA4, GTM, Google Ads, the CRM, inbox records, or server records."
              : "This review used manual Tag Assistant/browser testing. Lead or form submission recording can be confirmed inside GA4, GTM, Google Ads, the CRM, form inbox, email notification records, or server records.";

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
        ? `Expected event: ${expectedEvent}. Observed result: ${observedEvent || "Not clearly observed"}. Check the same action inside GA4, GTM, Google Ads, and the relevant lead records.`
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
    "Use the screenshots as test evidence, then compare the same action with account or lead records.",
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
    "Which tracking signals were observed during the test?",
    "What should be checked inside GA4, GTM, Google Ads, CRM, SMS/email platform, or server records?",
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
    return "Google Ads activity was manually checked through Ads Transparency. This adds paid-traffic context; the matching conversion action should still be checked in the ad account.";
  }
  if (manualAds.adsFound === "no") {
    return "Ads Transparency was manually checked and no active Google Ads were noted at the time of review. Browser-visible tracking evidence should still be verified where needed.";
  }
  return "Ads Transparency was manually checked, but the ad activity result was left as unsure. Check the ad account before making final tracking decisions.";
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


function BusinessImpactSection({ article }: { article: BusinessImpactArticle }) {
  return (
    <section
      id="business-impact"
      data-trackflow-observe-event="secure_report_business_impact_preview_visible"
      data-trackflow-analytics-section="business_impact"
      data-trackflow-analytics-label={article.analyticsLabel}
      className="mx-auto w-full max-w-7xl scroll-mt-24 overflow-hidden px-4 py-4 sm:px-6 sm:py-10 lg:px-8 lg:py-14"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-950/10 sm:rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-w-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-5 sm:p-7 lg:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
              {article.eyebrow}
            </p>
            <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
              {article.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base sm:leading-8">
              {article.summary}
            </p>

            <button
              type="button"
              data-trackflow-business-impact-open="true"
              data-trackflow-analytics-event="secure_report_business_impact_open"
              data-trackflow-analytics-section="business_impact"
              data-trackflow-analytics-label="See full business impact"
              className="mt-5 inline-flex w-full min-h-[48px] items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 sm:w-auto"
            >
              See full business impact
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 border-t border-emerald-100 bg-slate-50 p-3 sm:gap-3 sm:p-5 lg:border-l lg:border-t-0 lg:p-6">
            {article.highlights.map((item) => (
              <article key={`${item.label}-${item.value}`} className="min-w-0 rounded-[1rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5 sm:rounded-[1.5rem] sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">{item.label}</p>
                <p className="mt-2 break-words text-xs font-bold leading-5 text-slate-700 sm:text-sm sm:leading-6">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div
        data-trackflow-business-impact-modal
        className="tfp-business-impact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tfp-business-impact-title"
        hidden
      >
        <div className="tfp-business-impact-modal__panel">
          <div className="tfp-business-impact-modal__header">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 sm:text-[11px]">Business impact details</p>
              <h2 id="tfp-business-impact-title" className="mt-2 break-words text-lg font-black leading-tight tracking-[-0.04em] text-white sm:text-3xl">
                {article.title}
              </h2>
            </div>
            <button
              type="button"
              data-trackflow-business-impact-close="true"
              aria-label="Close business impact details"
              className="tfp-business-impact-modal__close"
            >
              ×
            </button>
          </div>

          <div className="tfp-business-impact-modal__body">
            <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 sm:rounded-[1.5rem] sm:p-5">
              <div className="space-y-3 text-sm font-semibold leading-7 text-emerald-950 sm:text-base sm:leading-8">
                {article.modalIntro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-2">
              {article.sections.map((section) => (
                <article key={section.title} className="min-w-0 rounded-[1rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5 sm:rounded-[1.5rem] sm:p-5">
                  <h3 className="break-words text-base font-black leading-6 text-slate-950 sm:text-lg sm:leading-7">
                    {section.title}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm font-semibold leading-7 text-slate-600">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4 sm:mt-5 sm:rounded-[1.5rem] sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Recommended next step</p>
              <p className="mt-3 text-sm font-bold leading-7 text-blue-950 sm:text-base sm:leading-8">
                {article.recommendedStep}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessImpactExperienceScript() {
  const styles = `
.tfp-business-impact-modal[hidden] { display: none !important; }
.tfp-business-impact-modal { position: fixed; inset: 0; z-index: 2147482500; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(2, 6, 23, .78); backdrop-filter: blur(12px); overscroll-behavior: contain; }
.tfp-business-impact-modal__panel { display: grid; grid-template-rows: auto minmax(0, 1fr); width: min(1040px, 100%); max-height: min(92vh, 900px); overflow: hidden; border: 1px solid rgba(255,255,255,.16); border-radius: 30px; background: #f8fafc; box-shadow: 0 28px 90px rgba(0,0,0,.42); }
.tfp-business-impact-modal__header { position: relative; z-index: 2; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 18px; background: linear-gradient(135deg, #020617, #064e3b 56%, #0f172a); }
.tfp-business-impact-modal__close { display: inline-grid; place-items: center; flex: 0 0 auto; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(255,255,255,.1); color: white; font-size: 26px; line-height: 1; font-weight: 900; cursor: pointer; }
.tfp-business-impact-modal__close:hover { background: rgba(16,185,129,.72); border-color: rgba(167,243,208,.65); }
.tfp-business-impact-modal__body { min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px; }
@media (max-width: 640px) {
  .tfp-business-impact-modal { align-items: stretch; padding: 0; }
  .tfp-business-impact-modal__panel { width: 100%; max-height: none; height: 100vh; height: 100svh; height: 100dvh; border: 0; border-radius: 0; }
  .tfp-business-impact-modal__header { padding: 16px 14px 14px; padding-top: max(16px, calc(env(safe-area-inset-top) + 10px)); }
  .tfp-business-impact-modal__body { padding: 14px; padding-bottom: max(22px, calc(env(safe-area-inset-bottom) + 18px)); }
}
`;

  const script = `
(function () {
  try {
    if (window.__trackflowBusinessImpactModalReady) return;
    window.__trackflowBusinessImpactModalReady = true;

    var previousOverflow = '';

    function getModal() {
      return document.querySelector('[data-trackflow-business-impact-modal]');
    }

    function openModal() {
      var modal = getModal();
      if (!modal) return;
      previousOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      modal.hidden = false;
      window.setTimeout(function () {
        try {
          var closeButton = modal.querySelector('[data-trackflow-business-impact-close]');
          if (closeButton && typeof closeButton.focus === 'function') closeButton.focus({ preventScroll: true });
        } catch (error) {}
      }, 30);
    }

    function closeModal() {
      var modal = getModal();
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = previousOverflow;
    }

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest('[data-trackflow-business-impact-open]')) {
        event.preventDefault();
        openModal();
        return;
      }

      if (target.closest('[data-trackflow-business-impact-close]')) {
        event.preventDefault();
        closeModal();
        return;
      }

      var modal = getModal();
      if (modal && !modal.hidden && target === modal) {
        closeModal();
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeModal();
    });
  } catch (error) {}
})();`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
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

function MobileDetailCard({
  label,
  summary,
  children,
  tone = "default",
}: {
  label: string;
  summary: string;
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
    <details className={`group min-w-0 overflow-hidden rounded-[1.25rem] border shadow-sm ${toneClass}`}>
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase leading-4 tracking-[0.18em] text-slate-500">
            {label}
          </span>
          <span className="mt-1 block break-words text-sm font-black leading-5 text-slate-950">
            {summary}
          </span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-600 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-slate-200/80 px-4 py-4">{children}</div>
    </details>
  );
}

function SecureEvidenceGallery({
  assets,
  sectionCopy,
}: {
  assets: SecureEvidenceAssetDisplay[];
  sectionCopy: SecureEvidenceSectionCopy;
}) {
  if (!assets.length) return null;

  return (
    <section
      id="browser-evidence"
      data-trackflow-secure-evidence-gallery="true"
      data-trackflow-observe-event="secure_report_evidence_assets_visible"
      data-trackflow-analytics-section="browser_evidence"
      data-trackflow-analytics-label={sectionCopy.analyticsLabel}
      className="mx-auto w-full max-w-7xl scroll-mt-24 overflow-hidden px-4 py-4 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10 sm:rounded-[2rem]">
        <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-7 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                {sectionCopy.eyebrow}
              </p>
              <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                {sectionCopy.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base sm:leading-8">
                {sectionCopy.introText}
              </p>
            </div>

            <div className="hidden gap-3 sm:grid">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-7 text-slate-700 shadow-sm shadow-slate-950/5 sm:rounded-[1.5rem] sm:px-5 sm:py-4">
                <span className="font-black text-slate-950">{sectionCopy.noteTitle}: </span>
                {sectionCopy.noteText}
              </div>

              {sectionCopy.summaryCards.length ? (
                <div className="hidden gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {sectionCopy.summaryCards.map((item) => (
                    <div key={`${item.label}-${item.value}`} className="min-w-0 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-500">{item.label}</p>
                      <p className="mt-1.5 break-words text-xs font-black leading-5 text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex snap-x gap-3 overflow-x-auto bg-slate-50 p-3 pb-6 sm:grid sm:overflow-visible sm:p-5 sm:pb-9 lg:grid-cols-2 lg:p-6 lg:pb-10">
          {assets.map((asset, index) => (
            <article
              key={asset.id}
              className="w-[82vw] min-w-0 shrink-0 snap-start overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-lg shadow-slate-950/5 sm:w-auto sm:shrink sm:rounded-[1.5rem]"
            >
              <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                    {asset.roleLabel}
                  </p>
                  <h3 className="mt-2 break-words text-lg font-black leading-6 text-slate-950 sm:text-xl sm:leading-7">
                    {asset.caption}
                  </h3>
                </div>
                {asset.redacted ? (
                  <span className="hidden shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 sm:inline-flex">
                    Redacted
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                data-trackflow-evidence-open="true"
                data-evidence-src={asset.src}
                data-evidence-caption={asset.caption}
                data-evidence-role={asset.roleLabel}
                data-evidence-page-url={asset.pageUrl}
                data-evidence-index={String(index)}
                data-trackflow-analytics-event="secure_report_evidence_asset_open"
                data-trackflow-analytics-section="browser_evidence"
                data-trackflow-analytics-label={asset.roleLabel}
                className="group block w-full bg-slate-950 p-2.5 text-left focus:outline-none focus:ring-4 focus:ring-blue-500/25 sm:p-3"
              >
                <span className="relative block aspect-[16/9] w-full overflow-hidden rounded-[1rem] border border-white/10 bg-slate-900 sm:rounded-[1.25rem] lg:aspect-[16/8.8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.src}
                    alt={`${asset.caption} screenshot`}
                    loading="lazy"
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.01]"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition sm:text-xs">
                    Tap to enlarge
                  </span>
                </span>
              </button>

              {asset.pageUrl ? (
                <div className="hidden border-t border-slate-100 px-4 py-3 text-xs font-bold leading-6 text-slate-500 sm:block sm:px-5">
                  <span className="font-black uppercase tracking-[0.13em] text-slate-400">Reviewed URL: </span>
                  <span className="break-all">{asset.pageUrl}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecureEvidenceGalleryExperienceScript() {
  const styles = `
.tfp-evidence-lightbox[hidden] { display: none !important; }
.tfp-evidence-lightbox { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 14px; background: rgba(2, 6, 23, .92); backdrop-filter: blur(10px); overscroll-behavior: contain; }
.tfp-evidence-lightbox__panel { position: relative; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; width: min(1180px, 100%); height: min(92vh, 920px); overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: #020617; box-shadow: 0 28px 90px rgba(0,0,0,.48); }
.tfp-evidence-lightbox__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,.1); color: white; }
.tfp-evidence-lightbox__eyebrow { font-size: 10px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; color: #93c5fd; }
.tfp-evidence-lightbox__title { margin-top: 5px; font-size: 18px; line-height: 1.22; font-weight: 900; letter-spacing: -.03em; }
.tfp-evidence-lightbox__body { position: relative; min-height: 0; display: grid; place-items: center; padding: 10px; background: radial-gradient(circle at top, rgba(30,64,175,.28), transparent 40%), #020617; }
.tfp-evidence-lightbox__img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 18px; background: #0f172a; }
.tfp-evidence-lightbox__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.1); color: #cbd5e1; }
.tfp-evidence-lightbox__page { min-width: 0; overflow-wrap: anywhere; font-size: 12px; line-height: 1.5; font-weight: 700; color: #94a3b8; }
.tfp-evidence-lightbox__controls { display: flex; flex-shrink: 0; align-items: center; gap: 8px; }
.tfp-evidence-lightbox__button { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; background: rgba(255,255,255,.08); padding: 0 14px; color: white; font-size: 12px; font-weight: 900; cursor: pointer; }
.tfp-evidence-lightbox__button:hover { background: rgba(37,99,235,.72); border-color: rgba(147,197,253,.65); }
.tfp-evidence-lightbox__button:disabled { cursor: not-allowed; opacity: .45; }
.tfp-evidence-lightbox__close { width: 42px; padding: 0; font-size: 20px; }
.tfp-evidence-lightbox__counter { min-width: 56px; text-align: center; font-size: 12px; font-weight: 900; color: #bfdbfe; }
@media (max-width: 640px) {
  .tfp-evidence-lightbox { padding: 0; }
  .tfp-evidence-lightbox__panel { width: 100%; height: 100vh; height: 100svh; height: 100dvh; border: 0; border-radius: 0; }
  .tfp-evidence-lightbox__header { padding: 13px; padding-top: max(13px, calc(env(safe-area-inset-top) + 10px)); }
  .tfp-evidence-lightbox__title { font-size: 15px; }
  .tfp-evidence-lightbox__body { padding: 6px; }
  .tfp-evidence-lightbox__footer { align-items: stretch; flex-direction: column; padding: 10px 12px 12px; padding-bottom: max(14px, calc(env(safe-area-inset-bottom) + 12px)); }
  .tfp-evidence-lightbox__controls { justify-content: space-between; width: 100%; }
  .tfp-evidence-lightbox__button { flex: 1; min-height: 42px; }
  .tfp-evidence-lightbox__close { flex: 0 0 42px; }
}
`;

  const script = `
(function () {
  try {
    if (window.__trackflowSecureEvidenceGalleryReady) return;
    window.__trackflowSecureEvidenceGalleryReady = true;

    var state = { overlay: null, items: [], index: 0, previousOverflow: "" };

    function text(value) {
      return String(value || "").replace(/\\s+/g, " ").trim();
    }

    function createOverlay() {
      if (state.overlay) return state.overlay;
      var overlay = document.createElement("div");
      overlay.className = "tfp-evidence-lightbox";
      overlay.setAttribute("hidden", "hidden");
      overlay.innerHTML = '<div class="tfp-evidence-lightbox__panel" role="dialog" aria-modal="true" aria-label="Evidence screenshot gallery"><div class="tfp-evidence-lightbox__header"><div><div class="tfp-evidence-lightbox__eyebrow" data-tfp-evidence-role></div><div class="tfp-evidence-lightbox__title" data-tfp-evidence-title></div></div><button type="button" class="tfp-evidence-lightbox__button tfp-evidence-lightbox__close" data-tfp-evidence-close aria-label="Close evidence gallery">×</button></div><div class="tfp-evidence-lightbox__body"><img class="tfp-evidence-lightbox__img" data-tfp-evidence-img alt="Evidence screenshot" /></div><div class="tfp-evidence-lightbox__footer"><div class="tfp-evidence-lightbox__page" data-tfp-evidence-page></div><div class="tfp-evidence-lightbox__controls"><button type="button" class="tfp-evidence-lightbox__button" data-tfp-evidence-prev>Previous</button><div class="tfp-evidence-lightbox__counter" data-tfp-evidence-counter></div><button type="button" class="tfp-evidence-lightbox__button" data-tfp-evidence-next>Next</button></div></div></div>';
      document.body.appendChild(overlay);
      state.overlay = overlay;
      return overlay;
    }

    function readItemsFromSection(section) {
      var buttons = Array.prototype.slice.call(section.querySelectorAll("[data-trackflow-evidence-open]"));
      return buttons.map(function (button, index) {
        return {
          button: button,
          src: text(button.getAttribute("data-evidence-src")),
          caption: text(button.getAttribute("data-evidence-caption")) || "Evidence screenshot",
          role: text(button.getAttribute("data-evidence-role")) || "Review proof screenshot",
          pageUrl: text(button.getAttribute("data-evidence-page-url")),
          index: index
        };
      }).filter(function (item) { return item.src; });
    }

    function render() {
      var overlay = createOverlay();
      var item = state.items[state.index];
      if (!item) return;

      var img = overlay.querySelector("[data-tfp-evidence-img]");
      var title = overlay.querySelector("[data-tfp-evidence-title]");
      var role = overlay.querySelector("[data-tfp-evidence-role]");
      var page = overlay.querySelector("[data-tfp-evidence-page]");
      var counter = overlay.querySelector("[data-tfp-evidence-counter]");
      var prev = overlay.querySelector("[data-tfp-evidence-prev]");
      var next = overlay.querySelector("[data-tfp-evidence-next]");

      if (img) {
        img.src = item.src;
        img.alt = item.caption + " screenshot";
      }
      if (title) title.textContent = item.caption;
      if (role) role.textContent = item.role;
      if (page) page.textContent = item.pageUrl ? "Page URL: " + item.pageUrl : "Review screenshot evidence";
      if (counter) counter.textContent = String(state.index + 1) + " / " + String(state.items.length);
      if (prev) prev.disabled = state.items.length < 2;
      if (next) next.disabled = state.items.length < 2;
    }

    function openGallery(button) {
      var section = button.closest("[data-trackflow-secure-evidence-gallery]");
      if (!section) return;
      state.items = readItemsFromSection(section);
      state.index = Math.max(0, state.items.findIndex(function (item) { return item.button === button; }));
      if (!state.items.length) return;
      var overlay = createOverlay();
      render();
      overlay.removeAttribute("hidden");
      state.previousOverflow = document.documentElement.style.overflow || "";
      document.documentElement.style.overflow = "hidden";
      try {
        window.dispatchEvent(new CustomEvent("trackflow:secure-report-event", {
          detail: {
            eventName: "secure_report_evidence_gallery_open",
            buttonLabel: state.items[state.index].caption,
            eventSection: "browser_evidence"
          }
        }));
      } catch (error) {}
    }

    function closeGallery() {
      if (!state.overlay) return;
      state.overlay.setAttribute("hidden", "hidden");
      document.documentElement.style.overflow = state.previousOverflow || "";
    }

    function move(delta) {
      if (!state.items.length) return;
      state.index = (state.index + delta + state.items.length) % state.items.length;
      render();
    }

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var openButton = target.closest("[data-trackflow-evidence-open]");
      if (openButton) {
        event.preventDefault();
        openGallery(openButton);
        return;
      }

      if (target.closest("[data-tfp-evidence-close]")) {
        event.preventDefault();
        closeGallery();
        return;
      }

      if (target.closest("[data-tfp-evidence-prev]")) {
        event.preventDefault();
        move(-1);
        return;
      }

      if (target.closest("[data-tfp-evidence-next]")) {
        event.preventDefault();
        move(1);
      }
    }, true);

    document.addEventListener("keydown", function (event) {
      if (!state.overlay || state.overlay.hasAttribute("hidden")) return;
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    });
  } catch (error) {}
})();`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
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
          <p className="max-w-3xl break-words leading-6">Not affiliated with Google, Meta, or the reviewed business. Audit notes are based on review evidence captured during the test.</p>

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

  return polishAuthorityScopeText(text)
    .replace(/This page summarizes the most important browser-visible tracking evidence before any account-level review\.?/gi, "This private review summarizes the key tracking evidence captured during the review.")
    .replace(/This private page summarizes the browser-visible tracking setup before account-level access or final conversion confirmation\.?/gi, "This private review summarizes the tracking setup captured during the review.")
    .replace(/\s+/g, " ")
    .trim();
}

function polishAuthorityScopeText(value: unknown): string {
  const text = cleanText(value, "");
  if (!text) return "";

  return text
    .replace(/public browser-visible evidence captured from the website/gi, "Tag Assistant and browser test evidence captured during the review")
    .replace(/public browser-visible evidence/gi, "Tag Assistant/browser evidence")
    .replace(/browser-visible manual evidence only/gi, "manual Tag Assistant/browser test evidence")
    .replace(/browser-visible tracking evidence/gi, "tracking evidence captured during the review")
    .replace(/browser-visible tracking setup/gi, "tracking setup captured during the review")
    .replace(/browser-visible setup context/gi, "tracking setup context")
    .replace(/browser-visible review/gi, "Tag Assistant/browser review")
    .replace(/website\/browser side/gi, "Tag Assistant/browser test")
    .replace(/browser side/gi, "browser test")
    .replace(/browser-side manual test/gi, "Tag Assistant manual test")
    .replace(/browser-side screenshots/gi, "Tag Assistant screenshots")
    .replace(/browser-side evidence/gi, "Tag Assistant evidence")
    .replace(/browser-visible signals/gi, "tracking signals")
    .replace(/account-level verification/gi, "account check")
    .replace(/account-level confirmation/gi, "account check")
    .replace(/final account-side confirmation/gi, "account-side confirmation")
    .replace(/Final recording still needs confirmation inside/gi, "Confirm the same recording inside")
    .replace(/Final confirmation still requires/gi, "Approved access can confirm")
    .replace(/Final confirmation requires/gi, "Approved access can confirm")
    .replace(/Final call tracking should be confirmed inside/gi, "Call tracking can be confirmed inside")
    .replace(/Final booking recording should be confirmed inside/gi, "Booking recording can be confirmed inside")
    .replace(/Final cart, checkout, or purchase recording should be confirmed inside/gi, "Cart, checkout, or purchase recording can be confirmed inside")
    .replace(/Final WhatsApp enquiry recording should be confirmed inside/gi, "WhatsApp enquiry recording can be confirmed inside")
    .replace(/Final email enquiry recording should be confirmed inside/gi, "Email enquiry recording can be confirmed inside")
    .replace(/Final lead\/form submission recording should be confirmed inside/gi, "Lead or form submission recording can be confirmed inside")
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
    const description = "A private tracking and attribution review prepared by TrackFlow Pro.";
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
    "This private page summarizes the key tracking evidence captured during the review.",
  ));
  const ctaText = getDisplayCtaText(privateReportCopy.ctaText || report.ctaText || report.cta_text);
  const setupPageSubheadline = isSetupFirst
    ? 'This private review summarizes the tracking setup captured during the review.'
    : pageSubheadline;

  let mainFinding = polishAuthorityScopeText(sentenceCaseFirst(cleanText(
    privateReportCopy.mainFinding || report.mainFinding || report.mainIssue,
    "A conversion tracking review may be useful based on the tracking signals captured during this review.",
  )));

  let businessImpact = polishAuthorityScopeText(sentenceCaseFirst(cleanText(
    privateReportCopy.businessImpact || report.businessImpact,
    "If important lead actions are not measured clearly, it can be harder to know which marketing channels are creating enquiries.",
  )));

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
      "Which key tracking tags were seen during the review?",
      "Does the lead path show clear conversion evidence?",
      "What should be verified inside the tracking accounts?",
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
  const manualAdsSummary = polishAuthorityScopeText(getManualAdsSummary(manualAds));
  const trustSignals = cleanList(privateReportCopy.trustNotes || report.trustNotes || report.trustSignals, TRUST_SIGNALS, 3)
    .map(polishAuthorityScopeText)
    .filter(Boolean);
  const primaryConversionFocus = cleanText(privateReportCopy.primaryActionLabel || report.primaryActionLabel || "", "") || getPrimaryConversionFocus(report, privateReportCopy);
  const manualEvidenceHero = getManualEvidenceHero(report, privateReportCopy);
  if (isSetupFirst) {
    auditSnapshotQuestions = [
      "Was a GA4/GTM tracking foundation clearly visible?",
      "What should be set up before conversion-event testing?",
      "What should be checked next?",
    ];
  } else if (manualEvidenceHero) {
    auditSnapshotQuestions = [
      "What did the Tag Assistant test show?",
      "What should be checked inside GA4, GTM, and Google Ads?",
      "What is the safest next verification step?",
    ];
  }
  const hasCallTrackingContext = [primaryConversionFocus, ...whatChecked, ...proofPoints]
    .join(" ")
    .toLowerCase()
    .includes("call");
  const enhancedProofPoints = manualAdsSummary ? cleanList([manualAdsSummary, ...proofPoints], DEFAULT_PROOF_POINTS, 6) : proofPoints;
  const clientFacingProofPoints = cleanList(
    enhancedProofPoints.map((item) => polishAuthorityScopeText(polishClientFacingEvidenceText(item, hasCallTrackingContext))),
    DEFAULT_PROOF_POINTS,
    6,
  );
  whatChecked = cleanList(whatChecked.map(polishAuthorityScopeText), DEFAULT_CHECKS, 8);
  recommendations = cleanList(recommendations.map(polishAuthorityScopeText), DEFAULT_RECOMMENDATIONS, 6);
  const howToReadTitle = cleanText(privateReportCopy.howToReadTitle || report.howToReadTitle || report.how_to_read_title, "How to read this review");
  const howToReadParagraphs = cleanList(
    privateReportCopy.howToReadParagraphs || report.howToReadParagraphs || report.how_to_read_paragraphs || report.howToReadThisReview,
    [
      "Review scope: this page is based on Tag Assistant/browser testing and operator evidence, not a login-based account audit.",
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
  const secureEvidenceAssets = getSecureEvidenceAssetDisplays(report, token, {
    isSetupFirst,
    manualEvidenceHero,
    setupActionLabel,
    reviewFocusLabel,
    reportMode,
  });
  const secureEvidenceCopy = getSecureEvidenceSectionCopy({
    isSetupFirst,
    manualEvidenceHero,
    setupActionLabel,
    reviewFocusLabel,
    reportMode,
  });
  const businessImpactArticle = getBusinessImpactArticle({
    isSetupFirst,
    manualEvidenceHero,
    setupActionLabel,
    reviewFocusLabel,
  });
  const heroHeadline = isSetupFirst
    ? "Private tracking readiness review"
    : companyName === "this website"
      ? "Private tracking review"
      : `Private tracking review for ${companyName}`;
  const preparedForLabel = companyName === "this website" ? "the reviewed website" : companyName;
  const manualReviewContextLine = manualEvidenceHero?.actionLabel
    ? `Manual review focus: ${manualEvidenceHero.actionLabel}. Visual proof from the test is shown below.`
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
          label: "Review focus",
          value: manualEvidenceHero.actionLabel || reviewFocusLabel,
        },
        {
          label: "Evidence type",
          value: "Tag Assistant test",
        },
        {
          label: "Best next action",
          value: "Confirm in accounts",
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
            value: "Tracking signals",
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
    businessImpact: businessImpactArticle.summary,
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
      <SecureEvidenceGalleryExperienceScript />
      <BusinessImpactExperienceScript />
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
                className="mt-5 rounded-[1.25rem] border border-blue-100 bg-blue-50/70 p-4 shadow-sm shadow-blue-950/5 sm:mt-7 sm:rounded-[1.6rem] sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 sm:text-[11px]">
                      Manual review focus
                    </p>
                    <p className="mt-2 break-words text-lg font-black leading-7 text-slate-950 sm:text-2xl sm:leading-8">
                      {manualEvidenceHero.actionLabel || "Selected conversion action"}
                    </p>
                  </div>
                  <a
                    href={secureEvidenceAssets.length ? "#browser-evidence" : "#findings"}
                    data-trackflow-analytics-event="secure_report_manual_focus_evidence_click"
                    data-trackflow-analytics-section="hero"
                    data-trackflow-analytics-label="Review visual evidence"
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  >
                    Review visual evidence
                  </a>
                </div>

                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-blue-950/80">
                  The selected action was tested manually. The screenshots below show the result captured during the review, and the same action can be checked inside GA4, GTM, Google Ads, and the relevant lead records.
                </p>

                {manualEvidenceHero.tool || manualEvidenceHero.testUrl ? (
                  <div className="mt-3 hidden min-w-0 flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 sm:flex">
                    {manualEvidenceHero.tool ? (
                      <span className="max-w-full rounded-full border border-blue-100 bg-white px-3 py-2">
                        Tool: {manualEvidenceHero.tool}
                      </span>
                    ) : null}
                    {manualEvidenceHero.testUrl ? (
                      <span className="max-w-full break-all rounded-full border border-blue-100 bg-white px-3 py-2">
                        URL: {manualEvidenceHero.testUrl}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 hidden min-w-0 gap-2 sm:mt-6 sm:grid sm:grid-cols-3 sm:gap-3">
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
                    See the review evidence before the PDF.
                  </span>
                </span>
              </a>
            ) : null}

            <div className="mt-4 hidden min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-slate-500 sm:flex sm:gap-3">
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
              {secureEvidenceAssets.length ? (
                <a
                  href="#browser-evidence"
                  data-trackflow-analytics-event="secure_report_browser_evidence_anchor_click"
                  data-trackflow-analytics-section="hero"
                  data-trackflow-analytics-label={isSetupFirst ? "Setup evidence available" : "Proof screenshots available"}
                  className="max-w-full break-words rounded-full border border-purple-100 bg-purple-50 px-3 py-2 text-purple-700 transition hover:border-purple-200 hover:bg-white sm:px-4"
                >
                  {isSetupFirst ? "Setup evidence available" : "Proof screenshots available"}
                </a>
              ) : null}
              <span className="max-w-full break-words rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700 sm:px-4">
                Review assistant included
              </span>
            </div>

            <div className="mt-6 hidden min-w-0 flex-wrap gap-2 text-[10px] font-black uppercase leading-5 tracking-[0.14em] text-slate-500 sm:mt-8 sm:flex sm:gap-3 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                Prepared by TrackFlow Pro
              </span>
              <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-2 sm:px-4">
                Tag Assistant review
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
                No account login used
              </span>
              {manualAds.checked ? (
                <span className="max-w-full break-words rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 sm:px-4">
                  Ads Transparency: {manualAds.adsFound === "yes" ? "Ads found" : manualAds.adsFound === "no" ? "No ads found" : "Checked"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="hidden min-w-0 max-w-full rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 sm:rounded-[1.75rem] sm:p-4 lg:block lg:p-5">
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
                The assistant can explain this saved review in plain English and point to the next account checks when needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SecureEvidenceGallery assets={secureEvidenceAssets} sectionCopy={secureEvidenceCopy} />

      <section className="mx-auto hidden w-full max-w-7xl overflow-hidden px-4 py-4 sm:block sm:px-6 sm:py-8 lg:px-8">
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
          className="mx-auto w-full max-w-7xl scroll-mt-24 overflow-hidden px-4 py-4 sm:px-6 sm:pb-10 sm:pt-2 lg:px-8"
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
                      <span className="block text-white">Tag Assistant evidence walkthrough</span>
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.13em] text-blue-200 sm:text-[10px] sm:tracking-[0.16em]">Tap to watch the audit video</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="min-w-0 border-t border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                  Tag Assistant evidence walkthrough
                </p>
                <h2 className="mt-3 break-words text-xl font-black leading-tight tracking-[-0.045em] text-slate-950 sm:mt-4 sm:text-4xl">
                  Watch the evidence before reading the PDF.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:mt-4">
                  {evidenceVideo.description}
                </p>

                {reviewedPageBadges.length ? (
                  <div className="mt-6 hidden sm:block">
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
                  <div className="mt-6 hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Signals captured in this review
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

      <BusinessImpactSection article={businessImpactArticle} />

      <section
        id="findings"
        className="mx-auto grid w-full max-w-7xl scroll-mt-24 gap-4 overflow-hidden px-4 py-4 sm:gap-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-16"
      >
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <SectionCard label="What this means" tone="blue">
            <p className="break-words text-base font-black leading-7 text-slate-950 sm:text-lg sm:leading-8">{mainFinding}</p>
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

          <div className="space-y-3 md:hidden">
            <MobileDetailCard label="What I checked" summary={`${whatChecked.length} review areas covered`}>
              <BulletList items={whatChecked} />
            </MobileDetailCard>

            <MobileDetailCard label="Supporting evidence" summary={`${clientFacingProofPoints.length} proof points available`}>
              <BulletList items={clientFacingProofPoints} marker="slate" />
            </MobileDetailCard>
          </div>

          <div className="hidden md:block">
            <SectionCard label="What I checked">
              <BulletList items={whatChecked} />
            </SectionCard>
          </div>

          <div className="hidden md:block">
            <SectionCard label="Supporting evidence">
              <BulletList items={clientFacingProofPoints} marker="slate" />
            </SectionCard>
          </div>
        </div>

        <aside className="min-w-0 space-y-4 sm:space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-3 md:hidden">
            <MobileDetailCard label="Recommended verification plan" summary={`${recommendations.length} next checks`} tone="amber">
              <NumberedStepList items={recommendations} />
            </MobileDetailCard>

            <MobileDetailCard label={howToReadTitle} summary="Review scope and confirmation note">
              <div className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
                {howToReadParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </MobileDetailCard>
          </div>

          <div className="hidden md:block">
            <SectionCard label="Recommended verification plan" tone="amber">
              <NumberedStepList items={recommendations} />
            </SectionCard>
          </div>

          <div className="hidden md:block">
            <SectionCard label={howToReadTitle}>
              <div className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
                {howToReadParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </SectionCard>
          </div>

          <section
            id="pdf-report"
            data-trackflow-observe-event="secure_report_pdf_preview_visible"
            data-trackflow-analytics-section="pdf"
            data-trackflow-analytics-label="PDF preview visible"
            className="min-w-0 scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 sm:rounded-[2rem]"
          >
            <div className="border-b border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-slate-50 p-4 sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                    Secure review access
                  </p>

                  <h2 className="mt-3 break-words text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                    Review the full audit document
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    Open or download the full PDF when you want the complete audit document.
                  </p>
                </div>

                {expiresLabel ? (
                  <p className="max-w-full shrink-0 break-words rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase leading-5 tracking-[0.14em] text-slate-500 shadow-sm">
                    Access until {expiresLabel}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 hidden min-w-0 gap-2 text-xs font-black uppercase leading-5 tracking-[0.12em] text-slate-500 md:grid sm:grid-cols-3 sm:gap-3 sm:tracking-[0.14em]">
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

            <div className="hidden overflow-hidden bg-slate-100 p-3 md:block sm:p-4">
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
                className="mb-3 hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 md:block"
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

              <p className="mt-3 text-xs font-semibold leading-6 text-slate-500 md:hidden">
                Use Open full PDF for reading, or Download PDF to save a copy.
              </p>

              <p className="mt-3 hidden text-xs font-semibold leading-6 text-slate-500 md:block">
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