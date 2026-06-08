import { randomUUID } from "crypto";
import admin from "firebase-admin";
import { BRAND_WEBSITE, MAIN_INBOX_EMAIL } from "@/lib/senders";

export type AnyRecord = Record<string, any>;

function cleanCell(value: any, fallback = ""): string {
  if (value === null || value === undefined || value === "") return fallback;
  const text = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  return text || fallback;
}

export function normalizeEmail(email: any): string {
  return String(email || "").trim().toLowerCase();
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function timestampFromAny(value: any): any | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

export function sanitizeOptionalUrl(value: string): string {
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

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || BRAND_WEBSITE || "https://trackflowpro.com").replace(/\/+$/, "");
}

export function normalizeReportToken(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

export function createReportToken(): string {
  return randomUUID().replace(/-/g, "");
}

export function normalizeReportSlug(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "website";
}

export function buildPublicReportUrl(token: string, domainSlug = "website"): string {
  const slug = normalizeReportSlug(domainSlug || "website");
  return `${appBaseUrl()}/tracking-review/${encodeURIComponent(slug)}/${encodeURIComponent(token)}`;
}

export function isLocalOrUnsafeReportUrl(value: string): boolean {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return true;
  if (raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("0.0.0.0")) return true;
  if (raw.includes("/audit/pdf/") || raw.includes(":8000/")) return true;
  // Email/report URL must be the branded TrackFlow /tracking-review/{domainSlug}/{token} page, not a direct PDF/Drive link.
  if (raw.includes("drive.google.com") || raw.includes("googleusercontent.com")) return true;
  if (/\.pdf(?:$|[?#])/.test(raw)) return true;
  return false;
}

export function sanitizePublicReportUrl(value: any): string {
  const url = sanitizeOptionalUrl(String(value || ""));
  if (!url || isLocalOrUnsafeReportUrl(url)) return "";
  return url;
}

function normalizeYouTubeVideoId(value: any): string {
  const raw = cleanCell(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return /^[a-zA-Z0-9_-]{8,32}$/.test(raw) ? raw : "";
}

function extractYouTubeVideoId(value: any): string {
  const raw = cleanCell(value);
  if (!raw) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return normalizeYouTubeVideoId(url.pathname.split("/").filter(Boolean)[0] || "");
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return normalizeYouTubeVideoId(watchId);

      const parts = url.pathname.split("/").filter(Boolean);
      const markerIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part.toLowerCase()));
      if (markerIndex >= 0 && parts[markerIndex + 1]) return normalizeYouTubeVideoId(parts[markerIndex + 1]);
    }
  } catch {}

  return normalizeYouTubeVideoId(raw);
}

function normalizeEvidenceVideoPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
  const raw = getObjectCandidate(
    body.evidenceVideo,
    body.evidence_video,
    body.videoEvidence,
    body.video_evidence,
    body.video,
    privatePage.evidenceVideo,
    privatePage.evidence_video,
  );

  const clear = Boolean(
    body.clearEvidenceVideo ||
      body.clear_evidence_video ||
      body.removeEvidenceVideo ||
      body.remove_evidence_video ||
      body.deleteEvidenceVideo ||
      body.delete_evidence_video ||
      raw.clear === true ||
      raw.remove === true ||
      raw.delete === true,
  );

  if (clear) {
    return { enabled: false, clear: true, status: "removed" };
  }

  const incomingUrl = firstCleanString(
    raw.videoUrl,
    raw.video_url,
    raw.youtubeUrl,
    raw.youtube_url,
    raw.url,
    typeof body.evidenceVideo === "string" ? body.evidenceVideo : "",
    typeof body.evidence_video === "string" ? body.evidence_video : "",
    typeof body.videoEvidence === "string" ? body.videoEvidence : "",
    typeof body.video_evidence === "string" ? body.video_evidence : "",
    typeof body.video === "string" ? body.video : "",
    body.evidenceVideoUrl,
    body.evidence_video_url,
    body.videoUrl,
    body.video_url,
    body.youtubeUrl,
    body.youtube_url,
    privatePage.evidenceVideoUrl,
    privatePage.evidence_video_url,
  );
  const videoId =
    extractYouTubeVideoId(incomingUrl) ||
    normalizeYouTubeVideoId(firstCleanString(raw.youtubeVideoId, raw.youtube_video_id, raw.videoId, raw.video_id, body.youtubeVideoId, body.youtube_video_id));

  if (!videoId) {
    return { enabled: false, clear: false, status: firstCleanString(raw.status, body.evidenceVideoStatus, body.evidence_video_status, "not_added") };
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return {
    enabled: true,
    provider: "youtube",
    status: firstCleanString(raw.status, body.evidenceVideoStatus, body.evidence_video_status, "ready"),
    title: firstCleanString(raw.title, body.evidenceVideoTitle, body.evidence_video_title, "Short browser-side evidence walkthrough"),
    description: firstCleanString(
      raw.description,
      body.evidenceVideoDescription,
      body.evidence_video_description,
      "This optional video shows browser-visible evidence only. Final confirmation still requires account-level access.",
    ),
    videoId,
    videoUrl: watchUrl,
    youtubeUrl: watchUrl,
    embedUrl,
    embedProvider: "youtube_nocookie",
    addedAt: firstCleanString(raw.addedAt, raw.added_at, body.evidenceVideoAddedAt, body.evidence_video_added_at),
    optional: true,
  };
}

export function sanitizeLocalRedirectTarget(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "/contact";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  const safe = sanitizeOptionalUrl(raw);
  if (!safe) return "/contact";
  try {
    const url = new URL(safe);
    const app = new URL(appBaseUrl());
    if (url.hostname === app.hostname) return `${url.pathname}${url.search}${url.hash}`;
  } catch {}
  return "/contact";
}

export function firstCleanString(...values: any[]): string {
  for (const value of values) {
    const text = cleanCell(value || "");
    if (text) return text;
  }
  return "";
}


function normalizeDisplaySentence(value: any, fallback = ""): string {
  return cleanCell(value || fallback)
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function isGenericReportText(value: any): boolean {
  const text = normalizeDisplaySentence(value).toLowerCase();
  if (!text) return true;
  return (
    /lead form, phone, email, booking/.test(text) ||
    /lead form, contact, and enquiry/.test(text) ||
    /lead form tracking snapshot/.test(text) ||
    /form\s*\/\s*phone\s*\/\s*booking/.test(text) ||
    /ga4\s*\/\s*gtm\s*\/\s*google ads/.test(text) ||
    /google ads, ga4, gtm, meta pixel, and first-party\/server-side tracking/.test(text) ||
    /what needs confirmation inside ga4, gtm, google ads, crm, call-tracking, booking-platform, or server logs/.test(text) ||
    /what this review is designed to clarify/.test(text)
  );
}

function titleCaseClientLabel(value: string): string {
  return normalizeDisplaySentence(value)
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      const upper = new Set(["ga4", "gtm", "crm", "ads", "cta", "url", "pdf"]);
      if (upper.has(lower)) return lower.toUpperCase();
      if (["and", "or", "the", "on", "in", "for", "of", "to", "a", "an"].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function cleanActionLabel(value: any): string {
  const text = normalizeDisplaySentence(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b(not sure|auto|unknown|key conversion actions|lead, form, and key cta actions|lead form and key cta actions)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || isGenericReportText(text)) return "";
  if (text.length > 96) return text.slice(0, 96).replace(/\s+\S*$/, "").trim();
  return text;
}

function inferActionLabelFromText(...values: any[]): string {
  const blob = values.map((value) => normalizeDisplaySentence(value)).filter(Boolean).join("\n");
  const patterns = [
    /Primary conversion focus:\s*([^\n.]+?)(?:\s+on\s+the\s+[^\n.]+?\s+page|\s+should|\s+needs|[.\n]|$)/i,
    /focused on\s+(?:the\s+)?([^\n.]+?)(?:\s+journey|\s+on\s+the\s+[^\n.]+?\s+page|[.\n]|$)/i,
    /for\s+([^\n.]+?)\s+journey/i,
    /controlled\s+([^\n.]+?)\s+test/i,
  ];
  for (const pattern of patterns) {
    const match = blob.match(pattern);
    const candidate = cleanActionLabel(match?.[1] || "");
    if (candidate) return candidate;
  }
  return "";
}

function inferPageLabelFromText(...values: any[]): string {
  const blob = values.map((value) => normalizeDisplaySentence(value)).filter(Boolean).join("\n");
  const patterns = [
    /on\s+the\s+([^\n.]+?)\s+page/i,
    /reviewed page:\s*([^\n.]+)/i,
    /page reviewed:\s*([^\n.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = blob.match(pattern);
    const candidate = normalizeDisplaySentence(match?.[1] || "");
    if (candidate && !candidate.includes("http") && candidate.length <= 60) return titleCaseClientLabel(candidate.replace(/\bpage$/i, "").trim()) + " page";
  }
  return "";
}

function normalizeReportUrlLabel(url: string): string {
  const cleanUrl = sanitizeOptionalUrl(url || "");
  if (!cleanUrl) return "";
  try {
    const parsed = new URL(cleanUrl);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return cleanUrl;
  }
}

function normalizeReviewedPages(value: any, fallbackWebsiteUrl = "", primaryPageUrl = "", primaryPageLabel = "", primaryActionLabel = ""): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  const push = (item: AnyRecord) => {
    const url = normalizeReportUrlLabel(firstCleanString(item.url, item.pageUrl, item.page_url, item.href));
    if (!url) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push({
      role: firstCleanString(item.role, item.type, output.length === 0 ? "homepage" : "primary"),
      label: firstCleanString(item.label, item.pageLabel, item.page_label, output.length === 0 ? "Homepage" : primaryPageLabel || "Reviewed page"),
      url,
      ...(firstCleanString(item.actionLabel, item.action_label, primaryActionLabel) ? { actionLabel: firstCleanString(item.actionLabel, item.action_label, primaryActionLabel) } : {}),
    });
  };

  for (const item of rawItems) {
    if (item && typeof item === "object" && !Array.isArray(item)) push(item as AnyRecord);
    else if (typeof item === "string") push({ url: item });
  }

  if (fallbackWebsiteUrl) push({ role: "homepage", label: "Homepage", url: fallbackWebsiteUrl });
  if (primaryPageUrl) push({ role: "primary", label: primaryPageLabel || "Reviewed page", url: primaryPageUrl, actionLabel: primaryActionLabel });

  return output.slice(0, 4);
}

type TrackingSignalStatus = "found" | "observed" | "needs_verification" | "not_confirmed";

function normalizeTrackingSignalCard(label: string, status: TrackingSignalStatus = "observed", detail = ""): AnyRecord {
  return {
    label: normalizeDisplaySentence(label),
    status,
    ...(detail ? { detail: normalizeDisplaySentence(detail) } : {}),
  };
}

function hasSignalCard(cards: AnyRecord[], contains: RegExp): boolean {
  return cards.some((card) => contains.test(String(card.label || "")));
}

function buildTrackingSignalCardsFromText(rawCards: any, ...values: any[]): AnyRecord[] {
  const output: AnyRecord[] = [];
  const seen = new Set<string>();
  const add = (label: string, status: TrackingSignalStatus = "observed", detail = "") => {
    const cleanLabel = normalizeDisplaySentence(label);
    if (!cleanLabel) return;
    const key = cleanLabel.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalizeTrackingSignalCard(cleanLabel, status, detail));
  };

  if (Array.isArray(rawCards)) {
    for (const item of rawCards) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const label = firstCleanString(item.label, item.title, item.name, item.text, item.finding);
        const status = firstCleanString(item.status, item.state, item.type, "observed") as TrackingSignalStatus;
        const detail = firstCleanString(item.detail, item.description, item.summary);
        add(label, ["found", "observed", "needs_verification", "not_confirmed"].includes(status) ? status : "observed", detail);
      } else {
        add(firstCleanString(item), "observed");
      }
    }
  }

  const blob = values
    .map((value) => {
      if (Array.isArray(value)) return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
      if (value && typeof value === "object") return JSON.stringify(value);
      return String(value || "");
    })
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (/\b(gtm|google tag manager)\b[^.\n]*(found|loaded|observed|visible)|tag manager[^.\n]*(found|loaded|observed|visible)/i.test(blob)) add("GTM tag found", "found");
  if (/\bga4\b[^.\n]*(request|event|collect)[^.\n]*(observed|visible|found)|analytics[^.\n]*request[^.\n]*(observed|visible|found)/i.test(blob)) add("GA4 request observed", "observed");
  if (/google ads[^.\n]*(conversion|remarketing)?[^.\n]*request[^.\n]*(observed|visible|found)|google ads[^.\n]*conversion[^.\n]*(observed|visible|found)/i.test(blob)) add("Google Ads conversion request observed", "observed");
  if (/meta pixel[^.\n]*(found|observed|visible)|meta event[^.\n]*(observed|visible|found)/i.test(blob)) add("Meta Pixel found", "found");
  if (/first-party[^.\n]*(tracking-like|tracking|collection)?[^.\n]*request[^.\n]*(observed|visible|found)/i.test(blob)) add("First-party tracking-like request observed", "observed");
  if (/click id[^.\n]*(test)?[^.\n]*(performed|observed|captured)|\bgclid\b|\bgbraid\b|\bwbraid\b/i.test(blob)) add("Click ID persistence test performed", "observed");
  if (/lead-related\s+ga4\s+event[^.\n]*(not clearly|needs|still)|no lead-related ga4 event/i.test(blob)) add("Lead-related GA4 event still needs account-level verification", "needs_verification");
  if (/server-side[^.\n]*(not confirmed|not detected|cannot be proven|needs verification)|server forwarding cannot be proven/i.test(blob)) add("Server-side tracking not confirmed from browser evidence", "not_confirmed");

  const idMatches = Array.from(blob.matchAll(/(?:conversion\/(\d{6,})|conversion id[^\d]{0,24}(\d{6,})|aw-(\d{6,}))/gi));
  const firstId = idMatches.map((match) => match[1] || match[2] || match[3]).find(Boolean);
  if (firstId && hasSignalCard(output, /google ads conversion request/i)) add(`Google Ads conversion ID observed: ${firstId}`, "observed");

  return output.slice(0, 8);
}

function buildActionAwareVerificationPlan(actionLabel: string, pageLabel: string, cards: AnyRecord[]): AnyRecord[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel ? ` on the ${pageLabel}` : "";
  const hasGoogleAds = hasSignalCard(cards, /google ads/i);
  const hasGa4 = hasSignalCard(cards, /ga4/i);
  const hasGtm = hasSignalCard(cards, /gtm/i);
  const plan = [
    `Run one controlled ${action} test${page}.`,
  ];
  if (hasGtm) plan.push("Confirm the same test in GTM Preview.");
  if (hasGa4) plan.push("Check GA4 DebugView for the expected lead-related event.");
  if (hasGoogleAds) plan.push("Review Google Ads conversion diagnostics for the same action.");
  plan.push("Match the test with CRM, email notification, call-tracking, or server records where relevant.");
  return normalizeVerificationPlan(plan, [], 4);
}

function buildActionAwareWhatChecked(actionLabel: string, pageLabel: string, cards: AnyRecord[], existing: string[]): string[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel || "reviewed page";
  const items = [
    `The ${page} ${action} journey.`,
    ...cards.map((card) => String(card.label || "")).filter(Boolean),
    ...existing.filter((item) => item && !isGenericReportText(item)),
    "Browser-visible request evidence and conversion-path context.",
    "Account-level confirmation still needed for final recording.",
  ];
  return normalizeStringArray(items, 8);
}

function buildActionAwareSnapshotQuestions(actionLabel: string, pageLabel: string): string[] {
  const action = actionLabel || "selected customer action";
  const page = pageLabel || "reviewed page";
  return [
    `Was the ${action} journey reviewed safely on the ${page}?`,
    "Which tracking signals were visible during the browser-side review?",
    "What should be confirmed inside the actual tracking accounts?",
  ];
}

function buildReportAwareSecureFields(params: {
  body: AnyRecord;
  privatePage: AnyRecord;
  websiteUrl: string;
  mainFinding: string;
  businessImpact: string;
  proofPoints: string[];
  whatChecked: string[];
  auditSnapshotQuestions: string[];
  verificationPlan: AnyRecord[];
  problemCards: AnyRecord[];
}): AnyRecord {
  const { body, privatePage } = params;
  const sourceBlob = [
    params.mainFinding,
    params.businessImpact,
    ...(params.proofPoints || []),
    ...(params.whatChecked || []),
    ...(params.auditSnapshotQuestions || []),
    ...(params.verificationPlan || []).map((item) => JSON.stringify(item)),
    ...(params.problemCards || []).map((item) => JSON.stringify(item)),
  ];
  const actionLabel = cleanActionLabel(firstCleanString(
    body.primaryActionLabel,
    body.primary_action_label,
    body.customConversionLabel,
    body.custom_conversion_label,
    body.conversionActionLabel,
    body.conversion_action_label,
    body.primaryConversionLabel,
    body.primary_conversion_label,
    body.primaryConversionAction,
    body.primary_conversion_action,
    body.conversionActionContext,
    body.conversion_action_context,
    privatePage.primaryActionLabel,
    privatePage.primary_action_label,
    privatePage.primaryConversionLabel,
    privatePage.primary_conversion_label,
    privatePage.primaryConversion,
    privatePage.primary_conversion,
  )) || inferActionLabelFromText(...sourceBlob);

  const pageLabel = firstCleanString(
    body.primaryPageLabel,
    body.primary_page_label,
    body.targetPageLabel,
    body.target_page_label,
    privatePage.primaryPageLabel,
    privatePage.primary_page_label,
    privatePage.selectedPageLabel,
    privatePage.selected_page_label,
    inferPageLabelFromText(...sourceBlob),
  );

  const primaryPageUrl = normalizeReportUrlLabel(firstCleanString(
    body.primaryPageUrl,
    body.primary_page_url,
    body.priorityPageUrl,
    body.priority_page_url,
    body.selectedPageUrl,
    body.selected_page_url,
    privatePage.primaryPageUrl,
    privatePage.primary_page_url,
    privatePage.selectedPageUrl,
    privatePage.selected_page_url,
  ));

  const trackingSignalCards = buildTrackingSignalCardsFromText(
    body.trackingSignalCards || body.tracking_signal_cards || privatePage.trackingSignalCards || privatePage.tracking_signal_cards,
    ...sourceBlob,
  );

  const reviewedPageUrls = normalizeReviewedPages(
    body.reviewedPageUrls || body.reviewed_page_urls || privatePage.reviewedPageUrls || privatePage.reviewed_page_urls,
    params.websiteUrl,
    primaryPageUrl,
    pageLabel,
    actionLabel,
  );

  const cleanedWhatChecked = buildActionAwareWhatChecked(actionLabel, pageLabel, trackingSignalCards, params.whatChecked || []);
  const cleanedQuestions = (params.auditSnapshotQuestions || []).filter((item) => !isGenericReportText(item));
  const auditSnapshotQuestions = cleanedQuestions.length >= 2 ? cleanedQuestions.slice(0, 3) : buildActionAwareSnapshotQuestions(actionLabel, pageLabel);
  const needsPlan = !(params.verificationPlan || []).length || (params.verificationPlan || []).every((item) => isGenericReportText(item?.title || item?.description || item));
  const verificationPlan = needsPlan ? buildActionAwareVerificationPlan(actionLabel, pageLabel, trackingSignalCards) : params.verificationPlan;
  const auditSnapshotTitle = firstCleanString(
    privatePage.auditSnapshotTitle && !isGenericReportText(privatePage.auditSnapshotTitle) ? privatePage.auditSnapshotTitle : "",
    body.auditSnapshotTitle && !isGenericReportText(body.auditSnapshotTitle) ? body.auditSnapshotTitle : "",
    actionLabel ? `${titleCaseClientLabel(actionLabel)} tracking snapshot` : "Tracking review snapshot",
  );

  return {
    primaryActionLabel: actionLabel,
    primaryPageLabel: pageLabel,
    primaryPageUrl,
    reviewedPageUrls,
    trackingSignalCards,
    whatChecked: cleanedWhatChecked,
    auditSnapshotTitle,
    auditSnapshotQuestions,
    verificationPlan,
  };
}


type ReportSourceType = "search" | "linkedin" | "manual" | "unknown";
type ReportOutreachChannel = "email" | "linkedin" | "manual" | "unknown";

function cleanLowerString(...values: any[]): string {
  return firstCleanString(...values).toLowerCase();
}

function normalizeWorkflowText(value: any, fallback = ""): string {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isValidEmailAddress(value: any): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function optionalBoolean(...values: any[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value > 0;
    const text = cleanLowerString(value);
    if (!text) continue;
    if (["1", "true", "yes", "y", "allowed", "allow", "enabled", "enable"].includes(text)) return true;
    if (["0", "false", "no", "n", "blocked", "block", "disabled", "disable"].includes(text)) return false;
  }
  return null;
}

function normalizeReportWorkflow(body: AnyRecord, normalizedEmail: string): AnyRecord {
  const rawSource = firstCleanString(body.source, body.audit_source, body.auditSource, body.source_context, body.sourceContext);
  const auditSource = firstCleanString(body.auditSource, body.audit_source, body.sourceAuditType, body.source_audit_type, rawSource);
  const sourceContext = firstCleanString(body.sourceContext, body.source_context, body.auditContextSource, body.audit_context_source, auditSource);
  const sourceText = [
    body.source,
    body.sourceType,
    body.source_type,
    body.outreachChannel,
    body.outreach_channel,
    body.leadSource,
    body.lead_source,
    body.auditSource,
    body.audit_source,
    body.sourceContext,
    body.source_context,
  ]
    .map((value) => cleanLowerString(value))
    .filter(Boolean)
    .join(" ");

  const linkedinProfileUrl = sanitizeOptionalUrl(firstCleanString(body.linkedinProfileUrl, body.linkedin_profile_url, body.linkedinUrl, body.linkedin_url));
  const linkedinCompanyUrl = sanitizeOptionalUrl(firstCleanString(body.linkedinCompanyUrl, body.linkedin_company_url, body.linkedinCompanyPageUrl, body.linkedin_company_page_url));
  const linkedinContactName = firstCleanString(body.linkedinContactName, body.linkedin_contact_name, body.linkedinContact, body.linkedin_contact);
  const hasLinkedInContext = Boolean(linkedinProfileUrl || linkedinCompanyUrl || linkedinContactName || sourceText.includes("linkedin"));

  const explicitSourceType = normalizeWorkflowText(body.sourceType || body.source_type);
  const sourceType: ReportSourceType =
    explicitSourceType === "linkedin" || explicitSourceType === "search" || explicitSourceType === "manual" || explicitSourceType === "unknown"
      ? (explicitSourceType as ReportSourceType)
      : hasLinkedInContext
        ? "linkedin"
        : sourceText.includes("search") || sourceText.includes("lead_row") || sourceText.includes("selected_export") || sourceText.includes("python")
          ? "search"
          : sourceText.includes("manual")
            ? "manual"
            : "unknown";

  const explicitChannel = normalizeWorkflowText(body.outreachChannel || body.outreach_channel);
  const outreachChannel: ReportOutreachChannel =
    explicitChannel === "email" || explicitChannel === "linkedin" || explicitChannel === "manual" || explicitChannel === "unknown"
      ? (explicitChannel as ReportOutreachChannel)
      : sourceType === "linkedin"
        ? "linkedin"
        : sourceType === "search"
          ? "email"
          : sourceType === "manual"
            ? "manual"
            : isValidEmailAddress(normalizedEmail)
              ? "email"
              : "unknown";

  const explicitLeadSource = normalizeWorkflowText(body.leadSource || body.lead_source);
  const leadSource = explicitLeadSource || (sourceType === "linkedin" ? "linkedin_audit" : sourceType === "search" ? "python_search" : sourceType === "manual" ? "manual_audit" : "unknown");

  const emailValid = optionalBoolean(body.emailValid, body.email_valid, body.validEmail, body.valid_email) ?? isValidEmailAddress(normalizedEmail);
  const emailOutreachAllowed =
    optionalBoolean(body.emailOutreachAllowed, body.email_outreach_allowed, body.emailAllowed, body.email_allowed) ??
    (outreachChannel === "email" && emailValid);
  const linkedinOutreachAllowed =
    optionalBoolean(body.linkedinOutreachAllowed, body.linkedin_outreach_allowed, body.linkedinAllowed, body.linkedin_allowed) ??
    outreachChannel === "linkedin";

  return {
    sourceType,
    source_type: sourceType,
    outreachChannel,
    outreach_channel: outreachChannel,
    leadSource,
    lead_source: leadSource,
    emailValid,
    email_valid: emailValid,
    emailOutreachAllowed,
    email_outreach_allowed: emailOutreachAllowed,
    linkedinOutreachAllowed,
    linkedin_outreach_allowed: linkedinOutreachAllowed,
    auditSource,
    audit_source: auditSource,
    sourceContext,
    source_context: sourceContext,
    linkedinProfileUrl,
    linkedin_profile_url: linkedinProfileUrl,
    linkedinCompanyUrl,
    linkedin_company_url: linkedinCompanyUrl,
    linkedinContactName,
    linkedin_contact_name: linkedinContactName,
  };
}

export function normalizeStringArray(value: any, maxItems = 8): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of rawItems) {
    const text = cleanCell(
      item && typeof item === "object"
        ? item.text || item.label || item.title || item.description || item.name || ""
        : item || "",
    );
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= maxItems) break;
  }

  return output;
}

export function normalizeRecommendationArray(value: any, maxItems = 8): AnyRecord[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|\||;/g)
      : [];

  const seen = new Set<string>();
  const output: AnyRecord[] = [];

  for (const item of rawItems) {
    if (item && typeof item === "object") {
      const title = cleanCell(item.title || item.step || item.name || item.description || "");
      const description = cleanCell(item.description || item.detail || item.summary || "");
      const priority = cleanCell(item.priority || `Priority ${output.length + 1}`);
      const estimatedEffort = cleanCell(item.estimatedEffort || item.estimated_effort || item.effort || "Short review");
      const key = `${title}|${description}`.toLowerCase();
      if ((title || description) && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority,
          title: title || description,
          description,
          estimatedEffort,
        });
      }
    } else {
      const title = cleanCell(item || "");
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority: `Priority ${output.length + 1}`,
          title,
          description: "",
          estimatedEffort: "Short review",
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  return output;
}

export function normalizeAdsFoundValue(value: any): "yes" | "no" | "unknown" {
  const text = cleanCell(value || "").toLowerCase();
  if (["yes", "true", "1", "found", "ads_found", "active", "running"].includes(text)) return "yes";
  if (["no", "false", "0", "not_found", "none", "no_ads"].includes(text)) return "no";
  return "unknown";
}

export function boolFromAny(value: any): boolean {
  if (typeof value === "boolean") return value;
  const text = cleanCell(value || "").toLowerCase();
  return ["1", "true", "yes", "y", "checked", "found", "active", "running"].includes(text);
}

export function normalizeManualAdsTransparency(body: AnyRecord = {}, privatePage: AnyRecord = {}): AnyRecord {
  const raw = getObjectCandidate(
    body.manualAdsTransparency,
    body.manual_ads_transparency,
    privatePage.manualAdsTransparency,
    privatePage.manual_ads_transparency,
  );

  const adsFound = normalizeAdsFoundValue(
    raw.adsFound ?? raw.ads_found ?? body.manualAdsFound ?? body.manual_ads_found,
  );

  const checked = Boolean(
    raw.checked === true ||
      boolFromAny(raw.checked) ||
      boolFromAny(body.manualAdsChecked) ||
      boolFromAny(body.manual_ads_checked) ||
      adsFound !== "unknown",
  );

  return {
    checked,
    adsFound,
    ads_found: adsFound,
    source: firstCleanString(raw.source, raw.manual_ads_source, body.manualAdsSource, body.manual_ads_source, "Google Ads Transparency"),
    note: firstCleanString(raw.note, raw.manual_ads_note, body.manualAdsNote, body.manual_ads_note),
    checkedAt: firstCleanString(raw.checkedAt, raw.checked_at, body.manualAdsCheckedAt, body.manual_ads_checked_at),
    checked_at: firstCleanString(raw.checkedAt, raw.checked_at, body.manualAdsCheckedAt, body.manual_ads_checked_at),
  };
}

export function getObjectCandidate(...values: any[]): AnyRecord {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as AnyRecord;
  }
  return {};
}


const PUBLIC_REPORT_COPY_BLOCKED_KEYS = new Set([
  "emailcopy",
  "emailcopyhtml",
  "emailcopytext",
  "emaildraft",
  "emaildrafthtml",
  "emaildrafttext",
  "emailmessage",
  "emailmessages",
  "emailoutreachcopy",
  "emailsubject",
  "emailbody",
  "linkedincopy",
  "linkedinmessage",
  "linkedinmessages",
  "linkedinmessagecopy",
  "linkedinoutreachcopy",
  "outreachcopy",
  "outreachcopies",
  "outreachmessage",
  "outreachmessages",
  "clientcopycontext",
  "rawgeminiresponse",
  "geminirawresponse",
  "rawauditjson",
  "rawaudit",
  "networkrequests",
  "observedrequests",
  "allrequests",
  "requestlogs",
  "debuglogs",
  "debug",
]);

function normalizePublicCopyKey(key: string): string {
  return String(key || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function isBlockedPublicReportCopyKey(key: string): boolean {
  const normalized = normalizePublicCopyKey(key);
  if (!normalized) return true;

  if (PUBLIC_REPORT_COPY_BLOCKED_KEYS.has(normalized)) return true;

  return (
    normalized.includes("emailcopy") ||
    normalized.includes("emaildraft") ||
    normalized.includes("linkedincopy") ||
    normalized.includes("linkedinmessage") ||
    normalized.includes("outreachcopy") ||
    normalized.includes("outreachmessage") ||
    normalized.includes("rawgemini") ||
    normalized.includes("networkrequests") ||
    normalized.includes("observedrequests") ||
    normalized.includes("debuglog")
  );
}

export function sanitizePublicReportCopyObject(value: any, maxKeys = 40): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const output: AnyRecord = {};
  let count = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    if (count >= maxKeys) break;
    if (!key || rawValue === undefined || typeof rawValue === "function" || isBlockedPublicReportCopyKey(key)) continue;
    if (isBlockedPublicReportCopyKey(key)) continue;

    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      output[key] = rawValue;
      count += 1;
      continue;
    }

    if (Array.isArray(rawValue)) {
      output[key] = rawValue
        .slice(0, 12)
        .map((item) => {
          if (item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") return item;
          if (item && typeof item === "object" && !Array.isArray(item)) return sanitizePublicReportCopyObject(item, 12);
          return null;
        })
        .filter((item) => item !== null && item !== undefined);
      count += 1;
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      output[key] = sanitizePublicReportCopyObject(rawValue, 12);
      count += 1;
    }
  }

  return output;
}

export function sanitizePlainObject(value: any, maxKeys = 30): AnyRecord {
  /**
   * Firestore-safe public report object sanitizer.
   * Keeps only JSON-safe values from the register payload so the public tracking-review page
   * can receive richer professional report sections without storing huge raw audit objects.
   */
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const output: AnyRecord = {};
  let count = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    if (count >= maxKeys) break;
    if (!key || rawValue === undefined || typeof rawValue === "function") continue;

    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      output[key] = rawValue;
      count += 1;
      continue;
    }

    if (Array.isArray(rawValue)) {
      output[key] = rawValue
        .slice(0, 12)
        .map((item) => {
          if (item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") return item;
          if (item && typeof item === "object" && !Array.isArray(item)) return sanitizePlainObject(item, 12);
          return null;
        })
        .filter((item) => item !== null && item !== undefined);
      count += 1;
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      output[key] = sanitizePlainObject(rawValue, 12);
      count += 1;
    }
  }

  return output;
}

export function normalizeReportCards(value: any, fallbackEvidence: string[] = [], maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value) ? value : [];
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? (item as AnyRecord) : {};
    const title = firstCleanString(record.title, record.problem, record.name, record.label);
    const finding = firstCleanString(record.finding, record.summary, record.description, record.text);
    const businessMeaning = firstCleanString(
      record.businessMeaning,
      record.business_meaning,
      record.businessImpact,
      record.business_impact,
      record.whyItMatters,
      record.why_it_matters,
      record.impact,
    );
    const nextCheck = firstCleanString(
      record.nextCheck,
      record.next_check,
      record.manualCheck,
      record.manual_check,
      record.recommendation,
      record.nextStep,
      record.next_step,
    );
    const evidence = normalizeStringArray(record.evidence || record.evidencePoints || record.evidence_points, 4);
    const key = `${title}|${finding}`.toLowerCase();

    if (!title && !finding) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      title: title || "Tracking item to verify",
      finding: finding || "Browser-visible evidence suggests this area is worth checking.",
      businessMeaning: businessMeaning || "This can affect how confidently marketing enquiries are measured and attributed.",
      nextCheck: nextCheck || "Confirm this item inside the relevant tracking account, CRM, or server records.",
      evidence,
    });

    if (output.length >= maxItems) break;
  }

  if (output.length) return output;

  return fallbackEvidence.slice(0, Math.min(3, maxItems)).map((item, index) => ({
    title: index === 0 ? "Tracking evidence to verify" : `Evidence item ${index + 1}`,
    finding: item,
    businessMeaning: "This point should be confirmed before making budget or reporting decisions.",
    nextCheck: "Confirm this item inside the relevant tracking account, CRM, or server records.",
    evidence: [],
  }));
}

export function normalizeVerificationPlan(value: any, fallback: AnyRecord[] | string[] = [], maxItems = 4): AnyRecord[] {
  const rawItems = Array.isArray(value) && value.length ? value : fallback;
  const output: AnyRecord[] = [];
  const seen = new Set<string>();

  for (const item of Array.isArray(rawItems) ? rawItems : []) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as AnyRecord;
      const title = firstCleanString(record.title, record.step, record.name, record.description);
      const description = firstCleanString(record.description, record.detail, record.summary, record.text);
      const priority = firstCleanString(record.priority, `Priority ${output.length + 1}`);
      const estimatedEffort = firstCleanString(record.estimatedEffort, record.estimated_effort, record.effort, "Short review");
      const key = `${title}|${description}`.toLowerCase();

      if ((title || description) && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority,
          title: title || description,
          description,
          estimatedEffort,
        });
      }
    } else {
      const title = firstCleanString(item);
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        output.push({
          priority: `Priority ${output.length + 1}`,
          title,
          description: "",
          estimatedEffort: "Short review",
        });
      }
    }

    if (output.length >= maxItems) break;
  }

  return output;
}

export function normalizeWebsiteSpeedSnapshot(...values: any[]): AnyRecord | null {
  const raw = getObjectCandidate(...values);
  if (!Object.keys(raw).length) return null;

  const snapshot: AnyRecord = {};
  const allowedKeys = [
    "score",
    "label",
    "speedScore",
    "speed_score",
    "performance_score",
    "homepage_load_time_seconds",
    "visual_load_estimate_seconds",
    "dom_content_loaded_seconds",
    "network_idle_seconds",
    "audit_total_scan_time_seconds",
    "request_count",
    "third_party_request_count",
    "unique_host_count",
    "scanned_page_count",
    "client_facing_note",
    "note",
    "truth_note",
    "url",
    "page_url",
  ];

  for (const key of allowedKeys) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") {
      snapshot[key] = raw[key];
    }
  }

  if (!Object.keys(snapshot).length) return sanitizePlainObject(raw, 20);
  return snapshot;
}

export function normalizeCtaInteractionReport(...values: any[]): AnyRecord | null {
  const raw = getObjectCandidate(...values);
  if (!Object.keys(raw).length) return null;

  const testedItems = Array.isArray(raw.testedItems)
    ? raw.testedItems
    : Array.isArray(raw.tested_items)
      ? raw.tested_items
      : [];

  return {
    ...sanitizePlainObject(raw, 24),
    enabled: raw.enabled !== false,
    tested: Boolean(raw.tested || raw.ctasTested || raw.ctas_tested || testedItems.length),
    status: firstCleanString(raw.status, raw.verdict, raw.test_status, "not_tested"),
    ctasFound: Number(raw.ctasFound ?? raw.ctas_found ?? testedItems.length ?? 0) || 0,
    ctas_found: Number(raw.ctas_found ?? raw.ctasFound ?? testedItems.length ?? 0) || 0,
    ctasTested: Number(raw.ctasTested ?? raw.ctas_tested ?? 0) || 0,
    ctas_tested: Number(raw.ctas_tested ?? raw.ctasTested ?? 0) || 0,
    trackingObserved: Boolean(raw.trackingObserved || raw.tracking_observed),
    tracking_observed: Boolean(raw.tracking_observed || raw.trackingObserved),
    googleAdsAfterClick: Boolean(raw.googleAdsAfterClick || raw.google_ads_after_click || raw.google_ads_conversion_after_click),
    google_ads_after_click: Boolean(raw.google_ads_after_click || raw.googleAdsAfterClick || raw.google_ads_conversion_after_click),
    ga4EventsAfterClick: normalizeStringArray(raw.ga4EventsAfterClick || raw.ga4_events_after_click, 10),
    ga4_events_after_click: normalizeStringArray(raw.ga4_events_after_click || raw.ga4EventsAfterClick, 10),
    metaEventsAfterClick: normalizeStringArray(raw.metaEventsAfterClick || raw.meta_events_after_click, 10),
    meta_events_after_click: normalizeStringArray(raw.meta_events_after_click || raw.metaEventsAfterClick, 10),
    testedItems: testedItems.slice(0, 10).map((item: any) => sanitizePlainObject(item, 20)),
    tested_items: testedItems.slice(0, 10).map((item: any) => sanitizePlainObject(item, 20)),
    truthNote: firstCleanString(raw.truthNote, raw.truth_note),
    truth_note: firstCleanString(raw.truth_note, raw.truthNote),
  };
}

function displayNameFromDomainValue(value: any): string {
  const raw = firstCleanString(value).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].split("?")[0];
  const base = raw.split(".")[0] || raw;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function isBadReportCompanyName(value: string, domain = ""): boolean {
  const text = firstCleanString(value).toLowerCase();
  if (!text) return true;
  if (/https?:\/\//i.test(text) || /www\./i.test(text) || /\bhttps?\b/i.test(text)) return true;
  if (/\.(com|net|org|co|io|us|uk|ca|au)(\/|$|\s)/i.test(text)) return true;
  if (/\b(event catering https|event catering|restaurant food service|food service|local service|lead generation|professional service)\b/i.test(text) && !/\balsies\b/i.test(text)) return true;
  if (/^(home|homepage|official site|menu|shop|store|cart|checkout|about|contact|services?|privacy|terms|book|books)$/i.test(text)) return true;
  if (text.length > 72) return true;
  const root = firstCleanString(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(".")[0].toLowerCase();
  if (root && text.includes(root)) return false;
  return false;
}

function cleanReportCompanyName(value: any, domain = ""): string {
  const fallback = displayNameFromDomainValue(domain) || "Website";
  let text = firstCleanString(value);
  text = text
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/\bhttps?\b/gi, " ")
    .replace(/\b(event catering service|event catering|restaurant food service|restaurant|food service|local service|lead generation|professional service|ecommerce|online store|prepared for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—|•.,]+|[\s\-–—|•.,]+$/g, "");
  if (!text || isBadReportCompanyName(text, domain)) return fallback;
  const root = firstCleanString(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(".")[0];
  if (root && new RegExp(`\\b${root.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i").test(text)) return displayNameFromDomainValue(domain);
  return text || fallback;
}

function isAlertSignupReportPayload(body: AnyRecord = {}, privatePage: AnyRecord = {}): boolean {
  const blob = [
    body.primaryConversion,
    body.primary_conversion,
    body.primaryConversionAction,
    body.primary_conversion_action,
    body.primaryConversionLabel,
    body.primary_conversion_label,
    body.headline,
    body.mainFinding,
    body.main_finding,
    privatePage.primaryConversion,
    privatePage.primaryConversionLabel,
    privatePage.headline,
    privatePage.mainFinding,
    privatePage.auditSnapshotTitle,
    ...(Array.isArray(privatePage.auditSnapshotQuestions) ? privatePage.auditSnapshotQuestions : []),
    ...(Array.isArray(privatePage.recommendations) ? privatePage.recommendations.map((item: any) => typeof item === "string" ? item : JSON.stringify(item)) : []),
  ].filter(Boolean).join(" ").toLowerCase();
  return /newsletter[_\s-]*subscription|alert signup|notification form|sign up for alerts|register to be notified|sms\/email|customer opt-in|customer opt in|subscribe/.test(blob);
}

function alertSignupVerificationPlanObjects(): AnyRecord[] {
  return [
    { title: "Run one controlled alert signup / notification form test from the website." },
    { title: "Confirm sign_up, subscribe, generate_lead, or form_submit signals in GTM Preview, GA4 DebugView, and Google Ads diagnostics." },
    { title: "Match the same test with the CRM, form platform, SMS/email platform, or server records where relevant." },
    { title: "Separate browser-visible evidence from final account-side confirmation." },
  ];
}

export function getReportTimestamp(value: any, fallbackDays = 30) {
  const parsed = timestampFromAny(value);
  if (parsed) return parsed;
  return admin.firestore.Timestamp.fromMillis(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

export function normalizeReportPayload(body: AnyRecord = {}) {
  const token = normalizeReportToken(body.token || body.reportToken || body.report_token) || createReportToken();
  const domain = firstCleanString(body.domain, body.websiteUrl, body.website_url, body.website, body.url);
  const companyName = cleanReportCompanyName(firstCleanString(body.companyName, body.company_name, body.businessName, body.business_name, body.preparedFor, body.prepared_for, domain), domain);
  const domainSlug = normalizeReportSlug(body.domainSlug || body.domain_slug || body.reportSlug || body.report_slug || domain || companyName || "website");
  const pdfViewUrl = sanitizeOptionalUrl(
    body.pdfViewUrl ||
      body.pdf_view_url ||
      body.blobUrl ||
      body.blob_url ||
      body.blobViewUrl ||
      body.blob_view_url ||
      body.driveViewUrl ||
      body.drive_view_url ||
      body.pdfUrl ||
      body.pdf_url ||
      "",
  );
  const pdfDownloadUrl = sanitizeOptionalUrl(
    body.pdfDownloadUrl ||
      body.pdf_download_url ||
      body.blobDownloadUrl ||
      body.blob_download_url ||
      body.downloadUrl ||
      body.download_url ||
      body.driveDownloadUrl ||
      body.drive_download_url ||
      pdfViewUrl ||
      "",
  );
  const reportUrl = sanitizePublicReportUrl(body.reportUrl || body.report_url) || buildPublicReportUrl(token, domainSlug);
  const ogImageUrl = sanitizeOptionalUrl(
    body.ogImageUrl ||
      body.og_image_url ||
      body.openGraphImageUrl ||
      body.open_graph_image_url ||
      body.previewImageUrl ||
      body.preview_image_url ||
      body.homepageScreenshotUrl ||
      body.homepage_screenshot_url ||
      body.screenshotUrl ||
      body.screenshot_url ||
      "",
  );
  const ogImagePathname = firstCleanString(
    body.ogImagePathname,
    body.og_image_pathname,
    body.previewImagePathname,
    body.preview_image_pathname,
    body.homepageScreenshotPathname,
    body.homepage_screenshot_pathname,
  );

  const rawSecurePageCopy = getObjectCandidate(
    body.securePageCopy,
    body.secure_page_copy,
    body.privateReportPage,
    body.private_report_page,
  );
  const rawPrivateReportCopy = getObjectCandidate(
    rawSecurePageCopy,
    body.privateReportCopy,
    body.private_report_copy,
    body.aiPrivateReportCopy,
    body.ai_private_report_copy,
  );
  const privateReportCopy = sanitizePublicReportCopyObject(rawPrivateReportCopy, 40);
  const privatePage = sanitizePublicReportCopyObject(getObjectCandidate(rawSecurePageCopy, privateReportCopy), 40);
  const alertSignupContext = isAlertSignupReportPayload(body, privatePage);
  const manualAdsTransparency = normalizeManualAdsTransparency(body, privatePage);
  const evidenceVideo = normalizeEvidenceVideoPayload(body, privatePage);

  const headline = firstCleanString(
    body.headline,
    privatePage.headline,
    privatePage.privatePageHeadline,
    body.clientMessageHeadline,
    body.client_message_headline,
    body.mainIssue,
    body.main_issue,
    "Private tracking audit note",
  );

  const subheadline = firstCleanString(
    body.subheadline,
    body.privatePageSubheadline,
    body.private_page_subheadline,
    privatePage.subheadline,
    privatePage.privatePageSubheadline,
    privatePage.privatePageSummary,
  );

  const mainFinding = firstCleanString(
    body.mainFinding,
    body.main_finding,
    privatePage.mainFinding,
    body.mainIssue,
    body.main_issue,
    body.problemSummary,
    body.problem_summary,
  );

  const businessImpact = firstCleanString(
    body.businessImpact,
    body.business_impact,
    privatePage.businessImpact,
    body.impact,
    body.messageAngle,
    body.message_angle,
  );

  const proofPoints = normalizeStringArray(
    privatePage.proofPoints || privatePage.proof_points || body.proofPoints || body.proof_points || body.evidencePoints || body.evidence_points,
    10,
  );

  let recommendations = normalizeRecommendationArray(
    privatePage.recommendations || privatePage.recommendedFixPlan || privatePage.recommended_fix_plan || body.recommendations || body.fixRecommendations || body.fix_recommendations,
    8,
  );

  let whatChecked = normalizeStringArray(
    privatePage.whatChecked || privatePage.what_checked || privatePage.checks || body.whatChecked || body.what_checked || body.auditScope || body.audit_scope,
    8,
  );

  let auditSnapshotQuestions = normalizeStringArray(
    privatePage.auditSnapshotQuestions || privatePage.audit_snapshot_questions || privatePage.snapshotQuestions || body.auditSnapshotQuestions || body.audit_snapshot_questions,
    4,
  );

  const trustNotes = normalizeStringArray(
    privatePage.trustNotes || privatePage.trust_notes || privatePage.trustSignals || body.trustNotes || body.trust_notes || body.trustSignals,
    4,
  );

  const howToReadParagraphs = normalizeStringArray(
    privatePage.howToReadParagraphs || privatePage.how_to_read_paragraphs || privatePage.howToReadThisReview || body.howToReadParagraphs || body.how_to_read_paragraphs || body.howToReadThisReview,
    4,
  );

  const problemCards = normalizeReportCards(
    privatePage.problemCards || privatePage.businessProblems || body.problemCards || body.businessProblems,
    proofPoints,
    4,
  );

  let verificationPlan = normalizeVerificationPlan(
    privatePage.verificationPlan ||
      privatePage.verification_plan ||
      privatePage.recommendedFixPlan ||
      privatePage.recommended_fix_plan ||
      body.verificationPlan ||
      body.verification_plan ||
      body.recommendedFixPlan ||
      body.recommended_fix_plan,
    recommendations,
    4,
  );

  const websiteSpeed = normalizeWebsiteSpeedSnapshot(
    privatePage.websiteSpeed,
    privatePage.website_speed,
    body.websiteSpeed,
    body.website_speed,
    body.speed,
  );

  const ctaInteractionTest = normalizeCtaInteractionReport(
    privatePage.ctaInteractionTest,
    privatePage.cta_interaction_test,
    privatePage.leadActionTest,
    privatePage.lead_action_test,
    body.ctaInteractionTest,
    body.cta_interaction_test,
    body.leadActionTest,
    body.lead_action_test,
  );

  const email = normalizeEmail(body.email || body.finalEmail || body.final_email || "");
  const workflow = normalizeReportWorkflow(body, email);
  const leadId = firstCleanString(body.leadId, body.firestoreLeadId, body.firestore_lead_id);
  const sheetRowNumber = Number(body.sheetRowNumber || body.sheet_row_number || 0) || null;
  const pdfExpiresAt = getReportTimestamp(body.pdfExpiresAt || body.pdf_expires_at || body.expiresAt || body.expires_at, 45);

  const ctaText = firstCleanString(
    body.ctaText,
    body.cta_text,
    privatePage.ctaText,
    privatePage.cta_text,
    "Book a tracking review",
  );

  const websiteUrl = firstCleanString(body.websiteUrl, body.website_url, body.website, domain ? `https://${domain}` : "");

  let reportAwareFields = buildReportAwareSecureFields({
    body,
    privatePage,
    websiteUrl,
    mainFinding,
    businessImpact,
    proofPoints,
    whatChecked,
    auditSnapshotQuestions,
    verificationPlan,
    problemCards,
  });

  whatChecked = reportAwareFields.whatChecked;
  auditSnapshotQuestions = reportAwareFields.auditSnapshotQuestions;
  verificationPlan = reportAwareFields.verificationPlan;

  if (alertSignupContext) {
    recommendations = normalizeRecommendationArray(
      [
        "Verify alert signup and notification form actions inside GA4 DebugView, GTM Preview, Google Ads diagnostics, CRM, SMS/email platform, or server logs where relevant.",
        "Confirm expected events such as sign_up, subscribe, generate_lead, or form_submit fire once per real customer action.",
        "Test the alert signup / notification form journey and confirm the final action inside the relevant account or server systems.",
        "Keep browser-visible evidence separate from final account-level confirmation in client communication.",
      ],
      4,
    );
    verificationPlan = alertSignupVerificationPlanObjects();
    whatChecked = normalizeStringArray([
      "Alert signup and notification form journey signals.",
      "GA4, Google Tag Manager, Google Ads, and first-party/server-side tracking signals.",
      ...whatChecked,
    ], 8);
    auditSnapshotQuestions = [
      "Are alert signup and notification form actions recorded clearly inside the relevant accounts?",
      "Which browser-visible tracking signals were observed?",
      "What needs confirmation inside GA4, GTM, Google Ads, CRM, SMS/email platform, or server logs?",
    ];
  }

  if (alertSignupContext) {
    reportAwareFields = {
      ...reportAwareFields,
      whatChecked,
      auditSnapshotTitle: "Alert Signup Form tracking snapshot",
      auditSnapshotQuestions,
      verificationPlan,
    };
  }

  const normalizedPrivateReportCopy = {
    headline,
    subheadline,
    mainFinding,
    businessImpact,
    proofPoints,
    recommendations,
    problemCards,
    businessProblems: problemCards,
    verificationPlan,
    verification_plan: verificationPlan,
    websiteSpeed,
    website_speed: websiteSpeed,
    ctaInteractionTest,
    cta_interaction_test: ctaInteractionTest,
    whatChecked,
    primaryActionLabel: reportAwareFields.primaryActionLabel,
    primaryPageLabel: reportAwareFields.primaryPageLabel,
    primaryPageUrl: reportAwareFields.primaryPageUrl,
    reviewedPageUrls: reportAwareFields.reviewedPageUrls,
    trackingSignalCards: reportAwareFields.trackingSignalCards,
    auditSnapshotTitle: reportAwareFields.auditSnapshotTitle,
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: firstCleanString(privatePage.howToReadTitle, privatePage.how_to_read_title, body.howToReadTitle, body.how_to_read_title, "How to read this review"),
    howToReadParagraphs,
    ctaHeadline: firstCleanString(privatePage.ctaHeadline, privatePage.cta_headline, body.ctaHeadline, body.cta_headline, "Want this verified inside your actual accounts?"),
    ctaText,
    manualAdsTransparency,
    evidenceVideo: evidenceVideo.enabled ? evidenceVideo : undefined,
    privateReportVersion: firstCleanString(privatePage.privateReportVersion, privatePage.private_report_version, body.privateReportVersion, body.private_report_version),
  };

  return {
    token,
    domainSlug,
    domain_slug: domainSlug,
    reportUrl,
    ogImageUrl,
    og_image_url: ogImageUrl,
    openGraphImageUrl: ogImageUrl,
    open_graph_image_url: ogImageUrl,
    previewImageUrl: ogImageUrl,
    preview_image_url: ogImageUrl,
    homepageScreenshotUrl: ogImageUrl,
    homepage_screenshot_url: ogImageUrl,
    ogImagePathname,
    og_image_pathname: ogImagePathname,
    domain,
    websiteUrl,
    companyName,
    email,
    headline,
    subheadline,
    mainFinding,
    businessImpact,
    proofPoints,
    recommendations,
    problemCards,
    businessProblems: problemCards,
    verificationPlan,
    verification_plan: verificationPlan,
    websiteSpeed,
    website_speed: websiteSpeed,
    ctaInteractionTest,
    cta_interaction_test: ctaInteractionTest,
    whatChecked,
    primaryActionLabel: reportAwareFields.primaryActionLabel,
    primaryPageLabel: reportAwareFields.primaryPageLabel,
    primaryPageUrl: reportAwareFields.primaryPageUrl,
    reviewedPageUrls: reportAwareFields.reviewedPageUrls,
    trackingSignalCards: reportAwareFields.trackingSignalCards,
    auditSnapshotTitle: normalizedPrivateReportCopy.auditSnapshotTitle,
    auditSnapshotQuestions,
    trustNotes,
    howToReadTitle: normalizedPrivateReportCopy.howToReadTitle,
    howToReadParagraphs,
    ctaHeadline: normalizedPrivateReportCopy.ctaHeadline,
    privateReportCopy: normalizedPrivateReportCopy,
    securePageCopy: normalizedPrivateReportCopy,
    secure_page_copy: normalizedPrivateReportCopy,
    privateReportVersion: normalizedPrivateReportCopy.privateReportVersion,
    manualAdsTransparency,
    manual_ads_checked: manualAdsTransparency.checked,
    manual_ads_found: manualAdsTransparency.adsFound,
    manual_ads_source: manualAdsTransparency.source,
    manual_ads_note: manualAdsTransparency.note,
    manual_ads_checked_at: manualAdsTransparency.checkedAt,
    pdfFileId: firstCleanString(
      body.pdfFileId,
      body.pdf_file_id,
      body.blobFileId,
      body.blob_file_id,
      body.blobPathname,
      body.blob_pathname,
      body.pathname,
      body.driveFileId,
      body.drive_file_id,
      body.googleDriveFileId,
    ),
    pdfViewUrl,
    pdfDownloadUrl,
    pdfExpiresAt,
    leadId,
    sheetRowNumber,
    source: firstCleanString(body.source, "python_blob_export"),
    sourceType: workflow.sourceType,
    source_type: workflow.source_type,
    outreachChannel: workflow.outreachChannel,
    outreach_channel: workflow.outreach_channel,
    leadSource: workflow.leadSource,
    lead_source: workflow.lead_source,
    emailValid: workflow.emailValid,
    email_valid: workflow.email_valid,
    emailOutreachAllowed: workflow.emailOutreachAllowed,
    email_outreach_allowed: workflow.email_outreach_allowed,
    linkedinOutreachAllowed: workflow.linkedinOutreachAllowed,
    linkedin_outreach_allowed: workflow.linkedin_outreach_allowed,
    auditSource: workflow.auditSource,
    audit_source: workflow.audit_source,
    sourceContext: workflow.sourceContext,
    source_context: workflow.source_context,
    linkedinProfileUrl: workflow.linkedinProfileUrl,
    linkedin_profile_url: workflow.linkedin_profile_url,
    linkedinCompanyUrl: workflow.linkedinCompanyUrl,
    linkedin_company_url: workflow.linkedin_company_url,
    linkedinContactName: workflow.linkedinContactName,
    linkedin_contact_name: workflow.linkedin_contact_name,
    auditId: firstCleanString(body.auditId, body.audit_id, body.sourceAuditId, body.source_audit_id),
    storageProvider: firstCleanString(
      body.storageProvider,
      body.storage_provider,
      (body.b2Key || body.b2_key || body.pdfStorageKey || body.pdf_storage_key || body.storageProvider === "backblaze_b2" || body.storage_provider === "backblaze_b2")
        ? "backblaze_b2"
        : body.blobUrl || body.blob_url
          ? "vercel_blob"
          : "storage",
    ),
    blobUrl: firstCleanString(body.blobUrl, body.blob_url, pdfViewUrl),
    blobDownloadUrl: firstCleanString(body.blobDownloadUrl, body.blob_download_url, pdfDownloadUrl),
    blobPathname: firstCleanString(body.blobPathname, body.blob_pathname, body.pathname, body.b2Key, body.b2_key, body.pdfStorageKey, body.pdf_storage_key),
    b2Key: firstCleanString(body.b2Key, body.b2_key, body.pdfStorageKey, body.pdf_storage_key, body.blobPathname, body.blob_pathname, body.pdfFileId, body.pdf_file_id),
    b2Bucket: firstCleanString(body.b2Bucket, body.b2_bucket, body.b2BucketName, body.b2_bucket_name),
    pdfStorageKey: firstCleanString(body.pdfStorageKey, body.pdf_storage_key, body.b2Key, body.b2_key, body.blobPathname, body.blob_pathname, body.pdfFileId, body.pdf_file_id),
    pdfStorageEtag: firstCleanString(body.pdfStorageEtag, body.pdf_storage_etag, body.b2Etag, body.b2_etag),
    pdfStorageSize: Number(body.pdfStorageSize || body.pdf_storage_size || body.b2Size || body.b2_size || 0) || undefined,
    evidenceVideo,
    evidenceVideoUrl: evidenceVideo.enabled ? evidenceVideo.videoUrl : "",
    evidenceVideoEmbedUrl: evidenceVideo.enabled ? evidenceVideo.embedUrl : "",
    evidenceVideoProvider: evidenceVideo.enabled ? evidenceVideo.provider : "",
    evidenceVideoStatus: evidenceVideo.status || "",
    contactEmail: firstCleanString(body.contactEmail, body.contact_email, body.agencyEmail, body.agency_email, MAIN_INBOX_EMAIL),
    ctaUrl: firstCleanString(body.ctaUrl, body.cta_url, privatePage.ctaUrl, privatePage.cta_url, "/contact"),
    ctaText,
  };
}
