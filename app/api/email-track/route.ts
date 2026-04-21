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

  const userAgent = req.headers.get('user-agent') || 'Email Client';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
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

      // ডিভাইস ডিটেকশন
      let deviceType = "Desktop/Other";
      if (/mobile|android|iphone|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = "Mobile";
      } else if (/googleimageproxy/i.test(userAgent.toLowerCase())) {
        deviceType = "Gmail/Proxy";
      }

      const newEntry = {
        device: String(deviceType),
        ip: String(ip),
        location: String(locationText || "Private"),
        time: admin.firestore.Timestamp.now()
      };

      // সমাধান: যদি device_info আগে থেকেই স্ট্রিং থাকে, তবে সেটাকে অ্যারেতে কনভার্ট করা
      let updateData: any = {
        open_count: admin.firestore.FieldValue.increment(1),
        lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'opened'
      };

      if (typeof leadData.device_info === 'string' || !leadData.device_info) {
        // যদি ফিল্ডটি স্ট্রিং হয় বা না থাকে, তবে নতুন অ্যারে তৈরি করুন
        updateData.device_info = [newEntry];
      } else {
        // যদি অলরেডি অ্যারে থাকে, তবে নতুন আইটেম যোগ করুন
        updateData.device_info = admin.firestore.FieldValue.arrayUnion(newEntry);
      }

      await docRef.update(updateData);
    }
  } catch (error) {
    console.error("Tracking Error:", error);
  }

  return new NextResponse(pixel, { headers });
}