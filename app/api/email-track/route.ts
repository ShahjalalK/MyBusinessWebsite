import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id')?.replace(/['"]+/g, '').trim();

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const leadData = leadDoc.data();
      const docRef = outreachRef.doc(leadDoc.id);

      // নতুন ফিল্ড নেম: tracking_history (সম্পূর্ণ স্ট্যাটিক ডাটা দিয়ে টেস্ট)
      const activityEntry = {
        device: "Email/Browser",
        ip: "Tracking IP",
        location: "Tracking Location",
        time: admin.firestore.Timestamp.now()
      };

      // আপডেট অবজেক্ট
      const updatePayload: any = {
        open_count: admin.firestore.FieldValue.increment(1),
        lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'opened'
      };

      // যদি tracking_history ফিল্ডটি না থাকে, তবে নতুন অ্যারে সেট করবে
      if (!leadData.tracking_history || !Array.isArray(leadData.tracking_history)) {
        updatePayload.tracking_history = [activityEntry];
      } else {
        // যদি থাকে, তবে arrayUnion করবে
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion(activityEntry);
      }

      await docRef.update(updatePayload);
      console.log("Activity logged successfully for ID:", trackingId);
    }
  } catch (error) {
    console.error("Critical Tracking Error:", error);
  }

  return new NextResponse(pixel, { headers });
}