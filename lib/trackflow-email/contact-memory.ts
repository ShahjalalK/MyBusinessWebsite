import { adminDb } from "@/lib/firebase-admin";
import { emailDocId, toMillis } from "@/lib/trackflow-api/core";

export function serializeContactMemoryForWarning(memory: Record<string, any> = {}) {
  const cooldownMs = toMillis(memory.cooldownUntil);
  const memoryExpiresMs = toMillis(memory.memoryExpiresAt);
  const lastContactedMs = toMillis(memory.lastContactedAt);

  return {
    emailLower: memory.emailLower || "",
    lastOutcome: memory.lastOutcome || "previous_contact",
    lastContactedAt: lastContactedMs ? new Date(lastContactedMs).toISOString() : "",
    cooldownUntil: cooldownMs ? new Date(cooldownMs).toISOString() : "",
    memoryExpiresAt: memoryExpiresMs ? new Date(memoryExpiresMs).toISOString() : "",
    companyName: memory.companyName || "",
    website: memory.website || "",
    service: memory.service || "",
    openCount: Number(memory.openCount || 0),
    clickCount: Number(memory.clickCount || 0),
    sourceLeadId: memory.sourceLeadId || "",
  };
}

export async function getActiveContactMemoryWarning(emailLower: string) {
  const memorySnap = await adminDb.collection("contact_memory").doc(emailDocId(emailLower)).get();
  if (!memorySnap.exists) return null;

  const memory = memorySnap.data() || {};
  const cooldownMs = toMillis(memory.cooldownUntil);
  const memoryExpiresMs = toMillis(memory.memoryExpiresAt);
  const nowMs = Date.now();

  if (memory.allowedAgain === true || toMillis(memory.allowedAgainAt) || toMillis(memory.allowAgainAt)) return null;
  if (memoryExpiresMs && memoryExpiresMs <= nowMs) return null;
  if (!cooldownMs || cooldownMs <= nowMs) return null;

  return serializeContactMemoryForWarning(memory);
}
