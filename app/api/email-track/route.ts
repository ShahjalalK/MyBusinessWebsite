import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id');
  const trackingId = rawId ? rawId.replace(/['"]+/g, '').trim() : null;

  // স্বচ্ছ ১x১ পিক্সেল গিফ (GIF)
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';

  // ১. উন্নত বট এবং সার্ভার ফিল্টারিং (শক্তিশালী করা হয়েছে)
  // google বাদ দিন, শুধু google-proxy বা bot-এর নির্দিষ্ট নাম রাখুন
const isBot = /bot|scanner|preview|cloud|brevo|mailers|paris|headless|crawler|facebook|whatsapp|bing|yahoo/i.test(userAgent);

// Gmail-এর জন্য স্পেসিফিক GoogleImageProxy ব্লক রাখুন
const isGoogleProxy = userAgent.includes('GoogleImageProxy');

if (isBot || isGoogleProxy) {
    return new NextResponse(pixel, { headers });
}

  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;
  
  // ইউজারের কারেন্ট আওয়ার (UTC) সংগ্রহ
  const now = new Date();
  const currentHourUTC = now.getUTCHours();

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const leadData = leadDoc.data();

      // ডিভাইস ডিটেকশন
      let deviceType = "Desktop/Web";
      if (/android|iphone|kindle|ipad/i.test(userAgent)) {
        deviceType = "Mobile Device";
      }

      // ২. ডাবল হিট প্রোটেকশন (Bulletproof Logic)
      // যদি শেষ ওপেন টাইম ৫ সেকেন্ডের মধ্যে হয়, তবে সেটিকে ইগনোর করুন (একই ওপেন দুবার কাউন্ট হবে না)
      const lastOpened = leadData.last_opened?.toMillis() || 0;
      const timeDiff = now.getTime() - lastOpened;

      if (timeDiff > 5000) { // ৫ সেকেন্ডের গ্যাপ
        await outreachRef.doc(leadDoc.id).update({
          open_count: admin.firestore.FieldValue.increment(1),
          last_opened: admin.firestore.FieldValue.serverTimestamp(),
          preferred_hour: currentHourUTC, // পরবর্তী ফলো-আপের জন্য এই সময়টিই মেইন
          status: (leadData.status === 'sent' || !leadData.status) ? 'opened' : leadData.status,
          device_info: admin.firestore.FieldValue.arrayUnion({
            device: deviceType,
            ip: ip,
            location: locationText,
            time: now.toISOString(),
            ua: userAgent.substring(0, 100) // ট্রাবলশুটিংয়ের জন্য ছোট করে UA সেভ করা
          })
        });
      }
    }
  } catch (error) {
    console.error("Tracking Error:", error);
  }

  return new NextResponse(pixel, { headers });
}