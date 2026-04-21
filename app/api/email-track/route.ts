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
      const docRef = outreachRef.doc(leadDoc.id);

      // একদম স্ট্যাটিক অবজেক্ট - কোনো হেডার বা ডাইনামিক ডেটা নেই
      const staticEntry = {
        device: "Test Device",
        ip: "1.1.1.1",
        location: "Test Location, BD",
        time: admin.firestore.Timestamp.now()
      };

      // আপডেট অপারেশন
      await docRef.update({
        open_count: admin.firestore.FieldValue.increment(1),
        lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'opened',
        // সরাসরি অ্যারে ইউনিয়ন (স্ট্যাটিক ডেটা দিয়ে)
        device_info: admin.firestore.FieldValue.arrayUnion(staticEntry)
      });
      
      console.log("Tracking Success for ID:", trackingId);
    }
  } catch (error) {
    // এররটি কনসোলে প্রিন্ট হবে যাতে আপনি Vercel Logs-এ দেখতে পারেন
    console.error("Firebase Update Error:", error);
  }

  return new NextResponse(pixel, { headers });
}