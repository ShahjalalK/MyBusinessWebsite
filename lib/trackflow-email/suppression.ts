import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import { emailDocId } from "@/lib/trackflow-api/core";

export async function isSuppressed(emailLower: string) {
  const snap = await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).get();
  return snap.exists ? snap.data() : null;
}

export async function addSuppression(emailLower: string, reason: string, extra: Record<string, any> = {}) {
  if (!emailLower) return;
  await adminDb.collection("suppression_list").doc(emailDocId(emailLower)).set(
    {
      emailLower,
      reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true },
  );
}
