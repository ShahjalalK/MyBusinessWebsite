import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id')?.trim(); // স্পেস রিমুভ করা হয়েছে

  // ১. ১x১ ট্রান্সপারেন্ট পিক্সেল
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

  // ২. ক্যাশিং পুরোপুরি বন্ধ করার হেডার
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  // ৩. ডিভাইস এবং আইপি ডাটা এক্সট্র্যাক্ট করা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown IP';
  
  // Vercel লোকেশন হেডার
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    // ৪. ফায়ারবেসে ওই trackingId দিয়ে লিডটি খুঁজে বের করা
    const leadsRef = collection(db, "outreach_leads");
    const q = query(leadsRef, where("trackingId", "==", trackingId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const leadDoc = querySnapshot.docs[0];
      const leadRef = doc(db, "outreach_leads", leadDoc.id);

      // ৫. ডাটা আপডেট করা
      await updateDoc(leadRef, {
        open_count: increment(1),
        last_opened: Timestamp.now(),
        status: 'opened',
        device_info: arrayUnion({
          // device: userAgent.slice(0, 150),
          // ip: ip,
          // location: locationText,
          // time: new Date().toISOString()
          test: "working",
          time: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error("Firebase Tracking Error:", error);
  }

  // সবশেষে পিক্সেল রিটার্ন
  return new NextResponse(pixel, { headers });
}