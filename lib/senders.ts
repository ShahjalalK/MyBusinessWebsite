import senderConfig from "./senders.config.json";

type RawSenderConfig = {
  mainInboxEmail?: string;
  mainInboxName?: string;
  brandName?: string;
  brandWebsite?: string;
  brandWebsiteLabel?: string;
  senders?: Array<Partial<SenderAccount>>;
};

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

const config = senderConfig as RawSenderConfig;

/**
 * TrackFlowPro sender config
 *
 * Source of truth:
 *   lib/senders.config.json
 *
 * Why this is free-limit friendly:
 * - Sender emails are NOT stored in Firebase.
 * - Frontend dropdown and backend Brevo validation both read this local config.
 * - To add/remove sender emails, edit senders.config.json and redeploy/restart.
 */

function clean(value: unknown, fallback = ""): string {
  const text = String(value || "").trim();
  return text || fallback;
}

export const MAIN_INBOX_EMAIL = clean(config.mainInboxEmail, "shahjalal@trackflowpro.com").toLowerCase();
export const MAIN_INBOX_NAME = clean(config.mainInboxName, "Shahjalal Khan");
export const BRAND_NAME = clean(config.brandName, "TrackFlowPro");
export const BRAND_WEBSITE = clean(config.brandWebsite, "https://trackflowpro.com");
export const BRAND_WEBSITE_LABEL = clean(config.brandWebsiteLabel, "trackflowpro.com");

export function normalizeSenderEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizeSender(raw: Partial<SenderAccount>, index: number): SenderAccount | null {
  const email = normalizeSenderEmail(String(raw.email || ""));
  if (!email || !email.includes("@")) return null;

  const id =
    clean(raw.id, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-") ||
    `sender-${index + 1}`;

  return {
    id,
    name: clean(raw.name, MAIN_INBOX_NAME),
    email,
    replyToEmail: normalizeSenderEmail(String(raw.replyToEmail || MAIN_INBOX_EMAIL || email)),
    replyToName: clean(raw.replyToName, MAIN_INBOX_NAME),
    limit: Math.max(1, Math.min(Number(raw.limit || 50), 500)),
    active: raw.active !== false,
  };
}

const rawSenders = Array.isArray(config.senders) ? config.senders : [];

export const SENDERS: SenderAccount[] = rawSenders
  .map((sender, index) => normalizeSender(sender, index))
  .filter((sender): sender is SenderAccount => Boolean(sender));

export const ACTIVE_SENDERS = SENDERS.filter((sender) => sender.active);

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
