import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

function envFlag(name: string, fallback = false): boolean {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

export function shouldStoreRawEmailEvent(event: string): boolean {
  const name = String(event || "").toLowerCase().trim();
  if (!name) return false;
  if (envFlag("STORE_LOW_VALUE_EMAIL_EVENTS", false)) return true;

  return (
    (name === "sent" && envFlag("STORE_SENT_EMAIL_EVENTS", false)) ||
    name === "replied" ||
    name === "reply" ||
    name === "unsubscribed" ||
    name === "spam" ||
    name === "hard_bounce" ||
    name === "soft_bounce" ||
    name === "bounced" ||
    name === "failed" ||
    name === "cron_error" ||
    name === "manual_action"
  );
}

export async function addEmailEvent(leadId: string, event: string, payload: Record<string, any> = {}) {
  if (!leadId || !shouldStoreRawEmailEvent(event)) return;
  await adminDb.collection("email_events").add({
    leadId,
    event,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...payload,
  });
}
