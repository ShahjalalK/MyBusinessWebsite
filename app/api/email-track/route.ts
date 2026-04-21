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

  // রিকোয়েস্ট থেকে ডাটা সংগ্রহ
  const userAgent = req.headers.get('user-agent') || 'Unknown Client';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const leadData = leadDoc.data();
      const docRef = outreachRef.doc(leadDoc.id);

      // ডিভাইস ডিটেকশন লজিক
      let deviceType = "Desktop";
      const ua = userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad/i.test(ua)) {
        deviceType = "Mobile";
      } else if (/tablet/i.test(ua)) {
        deviceType = "Tablet";
      } else if (/googleimageproxy/i.test(ua)) {
        deviceType = "Gmail/Proxy"; // ইমেইল থেকে ওপেন হলে এটি ধরবে
      }

      // অবজেক্টটি স্ট্রিং এ কনভার্ট করা নিশ্চিত করা (যাতে undefined এরর না দেয়)
      const newEntry = {
        device: String(deviceType),
        ip: String(ip),
        location: String(locationText || "Private"),
        time: admin.firestore.Timestamp.now()
      };

      // আপডেট ডেটা অবজেক্ট
      const updatePayload: any = {
        open_count: admin.firestore.FieldValue.increment(1),
        lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'opened'
      };

      // গুরুত্বপূর্ণ: device_info যদি না থাকে বা ভুল ফরম্যাটে থাকে তবে নতুন অ্যারে তৈরি করবে
      if (!leadData.device_info || !Array.isArray(leadData.device_info)) {
        updatePayload.device_info = [newEntry];
      } else {
        updatePayload.device_info = admin.firestore.FieldValue.arrayUnion(newEntry);
      }

      await docRef.update(updatePayload);
    }
  } catch (error) {
    console.error("Tracking Update Failed:", error);
  }

  return new NextResponse(pixel, { headers });
}