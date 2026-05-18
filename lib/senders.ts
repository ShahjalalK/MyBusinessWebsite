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