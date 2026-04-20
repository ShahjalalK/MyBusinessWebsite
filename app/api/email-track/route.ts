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

  // ১. উন্নত এবং নিরাপদ বট ফিল্টারিং
  // আমরা 'google', 'paris', 'brevo' এই শব্দগুলো সরিয়ে দিয়েছি যা আপনার নিজের ওপেনকে ব্লক করছিল
  const isBot = /bot|scanner|headless|crawler|bing|yahoo|preview|mailers|cloud/i.test(userAgent.toLowerCase());
  
  // Google Proxy চেক (জিমেইল অনেক সময় মেইল আসার সাথে সাথে নিজে একবার চেক করে, আমরা সেটা রেকর্ড করব না)
  const isGoogleProxy = userAgent.includes('GoogleImageProxy');

  // যদি সেটি নিশ্চিতভাবে কোনো বট বা গুগল প্রক্সি হয়, তবে ডাটাবেস আপডেট না করে শুধু পিক্সেল ফেরত যাবে
  if (isBot || isGoogleProxy) {
    return new NextResponse(pixel, { headers });
  }

  // লোকেশন সংগ্রহ (Vercel Headers)
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown Country';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;
  
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
      if (/android|iphone|kindle|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = "Mobile Device";
      }

      // ২. টাইম ডিস্ট্যান্স চেক (৩ সেকেন্ডে নামিয়ে আনা হয়েছে টেস্টের সুবিধার্থে)
      const lastOpened = leadData.last_opened?.toMillis() || 0;
      const timeDiff = now.getTime() - lastOpened;

      if (timeDiff > 3000) { 
        // ৩. ডাটাবেস আপডেট - এবার device_info নিশ্চিতভাবে পুশ হবে
        await outreachRef.doc(leadDoc.id).update({
          open_count: admin.firestore.FieldValue.increment(1),
          last_opened: admin.firestore.FieldValue.serverTimestamp(),
          preferred_hour: currentHourUTC,
          status: 'opened',
          device_info: admin.firestore.FieldValue.arrayUnion({
            device: deviceType,
            ip: ip || 'No IP',
            location: locationText || 'Unknown Location',
            time: now.toISOString(),
            ua: userAgent.substring(0, 100)
          })
        });
      }
    }
  } catch (error) {
    console.error("Tracking Error:", error);
  }

  return new NextResponse(pixel, { headers });
}