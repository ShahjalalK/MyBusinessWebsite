import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id');

  // ১. পিক্সেল রিটার্ন করার ফাংশন (এটি সবার আগে রাখা ভালো যাতে এরর আসলেও পিক্সেল লোড হয়)
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const pixelResponseHeaders = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (!trackingId) {
    return new NextResponse(pixel, { headers: pixelResponseHeaders });
  }

  // ২. ডিভাইস এবং লোকেশন ডাটা কালেক্ট করা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown IP';
  
  // Vercel এর স্পেসিফিক হেডার
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown Country';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    // ৩. ফায়ারবেসে ওই trackingId দিয়ে লিডটি খুঁজে বের করা
    const outreachRef = collection(db, "outreach_leads");
    const q = query(outreachRef, where("trackingId", "==", trackingId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // যদি একাধিক ডকুমেন্ট পাওয়া যায় (সাধারণত ১টিই পাওয়ার কথা), তবে প্রথমটি আপডেট হবে
      const leadDoc = querySnapshot.docs[0];
      const leadRef = doc(db, "outreach_leads", leadDoc.id);

      await updateDoc(leadRef, {
        open_count: increment(1),
        last_opened: Timestamp.now(),
        // device_info অ্যারেতে নতুন অবজেক্ট পুশ করা
        device_info: arrayUnion({
          device: userAgent,
          ip: ip,
          location: locationText,
          time: new Date().toISOString()
        }),
        status: 'opened'
      });
      console.log(`Successfully tracked: ${trackingId}`);
    } else {
      console.log(`No lead found in Firebase for trackingId: ${trackingId}`);
    }

    // পিক্সেল রিটার্ন
    return new NextResponse(pixel, { headers: pixelResponseHeaders });

  } catch (error) {
    console.error("Firebase Tracking Error:", error);
    // এরর হলেও পিক্সেল রিটার্ন করুন যাতে ইউজার বুঝতে না পারে
    return new NextResponse(pixel, { headers: pixelResponseHeaders });
  }
}