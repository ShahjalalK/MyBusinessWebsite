import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // ১. আইডি থেকে কোটেশন বা স্পেস পরিষ্কার করা (খুবই জরুরি)
  const rawId = searchParams.get('id');
  const trackingId = rawId ? rawId.replace(/['"]+/g, '').trim() : null;

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  if (!trackingId) {
    console.log("❌ No Tracking ID provided in URL");
    return new NextResponse(pixel, { headers });
  }

  // ২. ইউজার ডাটা সংগ্রহ
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown IP';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    
    // ৩. ফায়ারবেসে সার্চ করা
    console.log(`🔍 Searching Firestore for ID: [${trackingId}]`);
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      
      // ৪. ডাটা আপডেট করা
      await outreachRef.doc(leadDoc.id).update({
        open_count: admin.firestore.FieldValue.increment(1),
        last_opened: admin.firestore.FieldValue.serverTimestamp(),
        status: 'opened',
        device_info: admin.firestore.FieldValue.arrayUnion({
          device: userAgent.slice(0, 150),
          ip: ip,
          location: locationText,
          time: new Date().toISOString()
        })
      });
      console.log(`✅ Successfully tracked: ${trackingId}`);
    } else {
      // যদি ম্যাচ না পাওয়া যায় তবে লগে পরিষ্কার দেখা যাবে
      console.log(`⚠️ Match NOT found in Firestore for ID: [${trackingId}]`);
    }
  } catch (error: any) {
    console.error("🔥 Firebase Admin Error:", error.message);
  }

  return new NextResponse(pixel, { headers });
}