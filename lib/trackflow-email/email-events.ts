import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

type AnyRecord = Record<string, any>;

function envFlag(name: string, fallback = false): boolean {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

function cleanId(value: unknown, maxLength = 160): string {
  return String(value || "")
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^a-zA-Z0-9_@.<>\-:/]+/g, "")
    .slice(0, maxLength);
}

function cleanToken(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function cleanEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase().slice(0, 320);
}

function uniqueStrings(values: unknown[], max = 100): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= max) break;
  }
  return output;
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
    name === "manual_action" ||
    name === "brevo_open_ignored" ||
    name === "trackflow_open_ignored"
  );
}

export async function addEmailEvent(leadId: string, event: string, payload: AnyRecord = {}) {
  const cleanLeadId = cleanToken(leadId);
  const reportToken = cleanToken(payload.reportToken || payload.report_token || "");
  const messageId = cleanId(payload.messageId || payload.message_id || payload.customMessageId || payload.custom_message_id || "");
  const trackingId = cleanId(payload.trackingId || payload.tracking_id || "");
  const trackingTag = cleanId(payload.trackingTag || payload.tracking_tag || payload.tag || "", 180);
  const emailLower = cleanEmail(payload.emailLower || payload.email_lower || payload.email || "");

  // Keep old storage policy, but allow report-token indexed manual/important events
  // to be stored even when the lead document was already cleaned.
  if (!shouldStoreRawEmailEvent(event) && payload.forceStore !== true) return;
  if (!cleanLeadId && !reportToken && !messageId && !trackingId) return;

  await adminDb.collection("email_events").add({
    ...payload,
    leadId: cleanLeadId,
    reportToken,
    report_token: reportToken,
    messageId,
    message_id: messageId,
    trackingId,
    tracking_id: trackingId,
    trackingTag,
    tracking_tag: trackingTag,
    emailLower,
    event,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function collectEmailEventDocIds(query: any, limitCount = 500): Promise<string[]> {
  const ids: string[] = [];
  try {
    const snap = await query.limit(limitCount).get();
    for (const docSnap of (snap.docs || []) as Array<{ id: string }>) {
    if (docSnap?.id) ids.push(docSnap.id);
  }
  } catch {
    // Best-effort cleanup only. A missing index or field should not break report cleanup.
  }
  return ids;
}

async function deleteEmailEventIds(ids: string[]): Promise<number> {
  const uniqueIds = uniqueStrings(ids, 1000);
  let deleted = 0;

  for (let index = 0; index < uniqueIds.length; index += 450) {
    const batch = adminDb.batch();
    const chunk = uniqueIds.slice(index, index + 450);
    chunk.forEach((id) => batch.delete(adminDb.collection("email_events").doc(id)));
    if (chunk.length) {
      await batch.commit();
      deleted += chunk.length;
    }
  }

  return deleted;
}

export async function deleteEmailEventsForReport(input: {
  reportToken?: string;
  leadIds?: string[];
  dryRun?: boolean;
  maxDocs?: number;
  /**
   * Defaults to true for old callers.
   * Set to false when report cleanup must protect Manual + Report leads that share
   * the same report token but are not under the Sheet audit/report.
   */
  matchReportToken?: boolean;
}) {
  const reportToken = cleanToken(input.reportToken || "");
  const leadIds = uniqueStrings((input.leadIds || []).map((value) => cleanToken(value)).filter(Boolean), 100);
  const maxDocs = Math.max(1, Math.min(Number(input.maxDocs || 1000), 2000));
  const matchReportToken = input.matchReportToken !== false;
  const docIds: string[] = [];
  const eventsRef = adminDb.collection("email_events");

  if (reportToken && matchReportToken) {
    docIds.push(...(await collectEmailEventDocIds(eventsRef.where("reportToken", "==", reportToken), maxDocs)));
    docIds.push(...(await collectEmailEventDocIds(eventsRef.where("report_token", "==", reportToken), maxDocs)));
  }

  for (let index = 0; index < leadIds.length; index += 10) {
    const chunk = leadIds.slice(index, index + 10);
    if (!chunk.length) continue;
    docIds.push(...(await collectEmailEventDocIds(eventsRef.where("leadId", "in", chunk), maxDocs)));
  }

  const uniqueIds = uniqueStrings(docIds, maxDocs);

  if (input.dryRun) {
    return {
      ok: true,
      dryRun: true,
      reportToken,
      leadIds,
      matchReportToken,
      matchedByReportToken: Boolean(reportToken && matchReportToken),
      matchedCount: uniqueIds.length,
      deletedCount: 0,
      capped: uniqueIds.length >= maxDocs,
    };
  }

  const deletedCount = await deleteEmailEventIds(uniqueIds);
  return {
    ok: true,
    dryRun: false,
    reportToken,
    leadIds,
    matchReportToken,
    matchedByReportToken: Boolean(reportToken && matchReportToken),
    matchedCount: uniqueIds.length,
    deletedCount,
    capped: uniqueIds.length >= maxDocs,
  };
}
