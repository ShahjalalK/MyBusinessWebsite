import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id');
  
  // আইডি ক্লিন করা
  const trackingId = rawId ? rawId.replace(/['"]+/g, '').trim() : null;

  // ১x১ ট্রান্সপারেন্ট পিক্সেল ইমেজ
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  });

  // আইডি না থাকলে পিক্সেল রিটার্ন করবে কিন্তু ডাটাবেসে কিছু করবে না
  if (!trackingId) return new NextResponse(pixel, { headers });

  const userAgent = req.headers.get('user-agent') || 'Unknown Device';

  // *** বট এবং প্রক্সি ফিল্টারিং (খুবই জরুরি) ***
  // গুগল বা মাইক্রোসফট তাদের সার্ভারে ইমেজ প্রক্সি করে, সেগুলোকে বাদ দেওয়ার চেষ্টা
  const isBot = /bot|google|proxy|scanner|preview|cloud/i.test(userAgent);
  if (isBot) {
    return new NextResponse(pixel, { headers });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;
  const currentHourUTC = new Date().getUTCHours();

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    
    // trackingId দিয়ে সার্চ করা
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const leadData = leadDoc.data();

      // আপডেট লজিক
      await outreachRef.doc(leadDoc.id).update({
        // ১. ওপেন কাউন্ট বাড়ানো
        open_count: admin.firestore.FieldValue.increment(1),
        
        // ২. শেষ কখন খুলেছে
        last_opened: admin.firestore.FieldValue.serverTimestamp(),
        
        // ৩. পছন্দের সময় (UTC Hour)
        preferred_hour: currentHourUTC,
        
        // ৪. স্ট্যাটাস ম্যানেজমেন্ট
        // যদি আগে 'sent' থাকে তবেই 'opened' হবে, নাহলে আগেরটাই থাকবে (যেমন: interested)
        status: leadData.status === 'sent' || leadData.status === 'scheduled' ? 'opened' : leadData.status,

        // ৫. ডিভাইস ইনফো অ্যারেতে যোগ করা
        device_info: admin.firestore.FieldValue.arrayUnion({
          device: userAgent.slice(0, 150), // একটু বেশি ক্যারেক্টার নিলাম
          ip: ip,
          location: locationText,
          time: new Date().toISOString()
        })
      });

      console.log(`✅ Tracked: ${trackingId} | Status: Updated`);
    } else {
      console.log(`⚠️ No lead found in DB for trackingId: ${trackingId}`);
    }
  } catch (error) {
    console.error("❌ Tracking API Error:", error);
  }

  return new NextResponse(pixel, { headers });
}