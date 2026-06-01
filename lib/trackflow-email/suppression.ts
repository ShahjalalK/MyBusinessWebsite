import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import { emailDocId } from "@/lib/trackflow-api/core";

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value.toMillis === "function") return Number(value.toMillis()) || 0;
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

export async function isSuppressed(emailLower: string) {
  const snap = await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).get();
  if (!snap.exists) return null;

  const data = snap.data() || {};
  if (data.allowedAgain === true || toMillis(data.allowedAgainAt) || toMillis(data.allowAgainAt)) return null;

  return data;
}

export async function addSuppression(emailLower: string, reason: string, extra: Record<string, any> = {}) {
  if (!emailLower) return;
  await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).set(
    {
      emailLower,
      reason,
      allowedAgain: false,
      allowedAgainAt: admin.firestore.FieldValue.delete(),
      allowAgainAt: admin.firestore.FieldValue.delete(),
      allowedAgainBy: admin.firestore.FieldValue.delete(),
      allowAgainBy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true },
  );
}
