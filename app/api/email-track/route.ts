import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id');
  const trackingId = rawId ? rawId.replace(/['"]+/g, '').trim() : null;

  // ১x১ স্বচ্ছ ট্র্যাকিং পিক্সেল
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  // রিকোয়েস্ট থেকে ডেটা সংগ্রহ
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
  
  // Vercel Geolocation হেডারস
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown Country';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  // ১. উন্নত ফিল্টারিং লজিক (বট এবং প্রক্সি)
  // 'google' শব্দটি সাধারণ ইউজার এজেন্ট থেকে বাদ দেওয়া হয়েছে যাতে জিমেইল অ্যাপে কাজ করে
  const isBot = /bot|scanner|preview|cloud|brevo|mailers|headless|crawler|facebook|whatsapp|bing|yahoo/i.test(userAgent.toLowerCase());
  const isGoogleProxy = userAgent.includes('GoogleImageProxy');

  // যদি নিশ্চিত বট হয়, তবে ডেটা সেভ না করে পিক্সেল রিটার্ন করবে
  if (isBot || isGoogleProxy) {
    return new NextResponse(pixel, { headers });
  }

  // সময় এবং তারিখ
  const now = new Date();
  const currentHourUTC = now.getUTCHours();

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const leadData = leadDoc.data();

      // ২. ডিভাইস ডিটেকশন (Case-insensitive)
      let deviceType = "Desktop/Web";
      if (/android|iphone|kindle|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = "Mobile Device";
      }

      // ৩. ডাবল হিট প্রোটেকশন (৫ সেকেন্ড গ্যাপ)
      const lastOpened = leadData.last_opened?.toMillis() || 0;
      const timeDiff = now.getTime() - lastOpened;

      if (timeDiff > 5000) {
        // ফায়ারবেস আপডেট
        await outreachRef.doc(leadDoc.id).update({
          open_count: admin.firestore.FieldValue.increment(1),
          last_opened: admin.firestore.FieldValue.serverTimestamp(),
          preferred_hour: currentHourUTC,
          status: 'opened', // স্ট্যাটাস সরাসরি আপডেট
          device_info: admin.firestore.FieldValue.arrayUnion({
            device: deviceType,
            ip: ip,
            location: locationText,
            time: now.toISOString(),
            ua: userAgent.substring(0, 150) // ডিবাগিং এর জন্য ইউজার এজেন্ট রাখা হলো
          })
        });
      }
    }
  } catch (error) {
    // এরর হলেও পিক্সেল লোড হতে বাধা দেবে না
    console.error("Tracking Storage Error:", error);
  }

  return new NextResponse(pixel, { headers });
}