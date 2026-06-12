export const MAIN_INBOX_EMAIL = "shahjalal@trackflowpro.com";
export const MAIN_INBOX_NAME = "Shahjalal Khan";
export const BRAND_NAME = "TrackFlowPro";
export const BRAND_WEBSITE = "https://trackflowpro.com";
export const BRAND_WEBSITE_LABEL = "trackflowpro.com";

export type SenderAccount = {
  id: string;
  name: string;
  email: string;
  replyToEmail: string;
  replyToName: string;
  limit: number;
  active: boolean;
};

export type ApiSenderAccount = {
  id: string;
  name: string;
  email: string;
  replyToEmail: string;
  replyToName: string;
  dailyLimit: number;
};

/**
 * TrackFlowPro verified sender allowlist.
 *
 * Keep this file as the single source of truth for both:
 * - frontend sender dropdown / preview
 * - backend Brevo sender validation
 *
 * No Firestore sender collection is required, so this does not add reads.
 * After changing this file, redeploy the app so both frontend and API use the update.
 */
export const SENDERS: SenderAccount[] = [
  {
    id: "shahjalal-mail",
    name: "Shahjalal Khan",
    email: "shahjalal@mail.trackflowpro.com",
    replyToEmail: MAIN_INBOX_EMAIL,
    replyToName: MAIN_INBOX_NAME,
    limit: 50,
    active: true,
  },
  {
    id: "hello-mail",
    name: "Shahjalal Khan",
    email: "hello@mail.trackflowpro.com",
    replyToEmail: MAIN_INBOX_EMAIL,
    replyToName: MAIN_INBOX_NAME,
    limit: 50,
    active: true,
  },
  {
    id: "support-mail",
    name: "Shahjalal Khan",
    email: "support@mail.trackflowpro.com",
    replyToEmail: MAIN_INBOX_EMAIL,
    replyToName: MAIN_INBOX_NAME,
    limit: 50,
    active: true,
  },
  {
    id: "shahjalal-main",
    name: "Shahjalal Khan",
    email: "shahjalal@trackflowpro.com",
    replyToEmail: MAIN_INBOX_EMAIL,
    replyToName: MAIN_INBOX_NAME,
    limit: 50,
    active: true,
  },
];

export const ACTIVE_SENDERS = SENDERS.filter((sender) => sender.active);

export function normalizeSenderEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export function getSenderById(senderId: string): SenderAccount | null {
  const id = String(senderId || "").trim();
  if (!id) return null;
  return ACTIVE_SENDERS.find((sender) => sender.id === id) || null;
}

export function getSenderByEmail(email: string): SenderAccount | null {
  const normalized = normalizeSenderEmail(email);
  if (!normalized) return null;
  return ACTIVE_SENDERS.find((sender) => normalizeSenderEmail(sender.email) === normalized) || null;
}

export function getDefaultSender(): SenderAccount | null {
  return ACTIVE_SENDERS[0] || null;
}

export function toApiSenderConfig(sender: SenderAccount): ApiSenderAccount {
  return {
    id: sender.id,
    name: sender.name,
    email: normalizeSenderEmail(sender.email),
    replyToEmail: normalizeSenderEmail(sender.replyToEmail || sender.email),
    replyToName: sender.replyToName || sender.name,
    dailyLimit: Math.max(1, Math.min(Number(sender.limit || 50), 500)),
  };
}

export function getVisibleContactEmail(): string {
  return MAIN_INBOX_EMAIL;
}

export function getVisibleContactName(): string {
  return MAIN_INBOX_NAME;
}

export type ColdEmailTemplateId =
  | "google_ads_tracking_note"
  | "server_side_tracking_note"
  | "email_signature_tracking_note";

export type ColdEmailTemplate = {
  id: ColdEmailTemplateId;
  service: "Google Ads" | "Server Side Tracking" | "Email Signature";
  subject: string;
  body: string;
  reportButtonText: string;
};

/**
 * Code-based initial cold email defaults.
 *
 * Purpose:
 * - Keep default outreach copy in code instead of Firestore to avoid extra reads.
 * - Dashboard/manual compose can still edit before sending.
 * - Sheet queue should normally send the reviewed Email Subject/Email Body saved in Google Sheet.
 */
export const COLD_EMAIL_TEMPLATES: Record<ColdEmailTemplateId, ColdEmailTemplate> = {
  google_ads_tracking_note: {
    id: "google_ads_tracking_note",
    service: "Google Ads",
    subject: "Quick tracking note for {company}",
    reportButtonText: "View private tracking review",
    body:
      "<p>Hi {name},</p><p>I was reviewing {company} and noticed one tracking item worth checking on {website}.</p><p>If important lead actions are not measured clearly, it can be harder to know which campaigns are actually creating enquiries.</p><p>I put the short browser-visible note on a private report page.</p><p>Would it be useful if I verified this inside GA4, GTM, or Google Ads before you make any tracking changes?</p>",
  },
  server_side_tracking_note: {
    id: "server_side_tracking_note",
    service: "Server Side Tracking",
    subject: "Tracking check for {company}",
    reportButtonText: "View private tracking review",
    body:
      "<p>Hi {name},</p><p>I checked {website} from the public browser side and noticed a tracking signal that may be worth verifying.</p><p>This does not prove the account-level setup by itself, but it is a useful starting point before checking GTM, GA4, server logs, or ad platform diagnostics.</p><p>I shared the short note on a private report page.</p><p>Would a quick verification be useful?</p>",
  },
  email_signature_tracking_note: {
    id: "email_signature_tracking_note",
    service: "Email Signature",
    subject: "Small tracking note for {company}",
    reportButtonText: "View private tracking review",
    body:
      "<p>Hi {name},</p><p>I noticed a small tracking opportunity around {company}'s outbound email or website journey.</p><p>If email signature clicks or enquiry-path visits are not labelled clearly, it can be hard to tell which conversations came from outbound activity.</p><p>I put the short note on a private report page.</p><p>Worth a quick check?</p>",
  },
};

export function getColdEmailTemplateForService(service: string): ColdEmailTemplate {
  const value = String(service || "").toLowerCase();
  if (value.includes("server") || value.includes("sst")) return COLD_EMAIL_TEMPLATES.server_side_tracking_note;
  if (value.includes("signature")) return COLD_EMAIL_TEMPLATES.email_signature_tracking_note;
  return COLD_EMAIL_TEMPLATES.google_ads_tracking_note;
}

export function applyColdEmailMergeTags(template: string, data: { name?: string; company?: string; website?: string; service?: string }) {
  return String(template || "")
    .replace(/{name}/g, data.name || "there")
    .replace(/{company}/g, data.company || "your company")
    .replace(/{website}/g, data.website || "your website")
    .replace(/{service}/g, data.service || "Google Ads tracking");
}
