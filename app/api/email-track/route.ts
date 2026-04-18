import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; // Admin SDK ইমপোর্ট করুন
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id')?.trim();

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  // ক্যাশ কন্ট্রোল হেডার
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  // লোকেশন এবং ডিভাইস ডাটা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown IP';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    // Admin SDK ব্যবহার করে কোয়েরি করা
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      
      // সরাসরি ডকুমেন্ট আপডেট
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
      console.log("✅ Device Info Updated for:", trackingId);
    } else {
      console.log("❌ No document found for trackingId:", trackingId);
    }
  } catch (error) {
    
    console.error("Firebase Admin Error:", error);
  }

  return new NextResponse(pixel, { headers });
}