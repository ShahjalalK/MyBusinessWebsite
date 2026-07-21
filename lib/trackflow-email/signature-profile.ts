import { BRAND_NAME, MAIN_INBOX_EMAIL, MAIN_INBOX_NAME } from "../senders";

export type EmailSignatureMode = "full" | "compact" | "minimal" | "none";

export type EmailSignatureProfile = {
  name: string;
  title: string;
  company: string;
  email: string;
};

export const DEFAULT_EMAIL_SIGNATURE_PROFILE: EmailSignatureProfile = {
  name: MAIN_INBOX_NAME,
  title: "Tracking & Analytics Specialist",
  company: BRAND_NAME,
  email: MAIN_INBOX_EMAIL,
};

function cleanSignatureText(value: unknown, maxLength: number): string {
  return String(value || "")
    .replace(/[<>\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanSignatureEmail(value: unknown, fallback: string): string {
  const email = String(value || "").trim().toLowerCase().slice(0, 160);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : fallback;
}

export function normalizeEmailSignatureProfile(
  value?: Partial<EmailSignatureProfile> | null,
  fallback: EmailSignatureProfile = DEFAULT_EMAIL_SIGNATURE_PROFILE,
): EmailSignatureProfile {
  const safeFallback: EmailSignatureProfile = {
    name: cleanSignatureText(fallback.name, 80) || DEFAULT_EMAIL_SIGNATURE_PROFILE.name,
    title: cleanSignatureText(fallback.title, 100) || DEFAULT_EMAIL_SIGNATURE_PROFILE.title,
    company: cleanSignatureText(fallback.company, 80) || DEFAULT_EMAIL_SIGNATURE_PROFILE.company,
    email: cleanSignatureEmail(fallback.email, DEFAULT_EMAIL_SIGNATURE_PROFILE.email),
  };

  return {
    name: cleanSignatureText(value?.name, 80) || safeFallback.name,
    title: cleanSignatureText(value?.title, 100) || safeFallback.title,
    company: cleanSignatureText(value?.company, 80) || safeFallback.company,
    email: cleanSignatureEmail(value?.email, safeFallback.email),
  };
}
