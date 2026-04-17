import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id'); // নিশ্চিত করুন send-email এ ?id=${trackingId} দিয়েছেন

  if (!trackingId) return new NextResponse('Missing ID', { status: 400 });

  // ১. ডিভাইস এবং আইপি ডাটা এক্সট্র্যাক্ট করা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 'Unknown IP';
  
  // ভেরসেল লোকেশন হেডার (Vercel এ হোস্ট করলে এটি কাজ করবে)
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';

  try {
    // ২. ফায়ারবেসে ওই trackingId দিয়ে লিডটি খুঁজে বের করা
    const q = query(collection(db, "outreach_leads"), where("trackingId", "==", trackingId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const leadDoc = querySnapshot.docs[0];
      const leadRef = doc(db, "outreach_leads", leadDoc.id);

      // ৩. ডাটা আপডেট করা (device_info ফিল্ডে ডাটা পুশ করা)
      await updateDoc(leadRef, {
        open_count: increment(1),
        last_opened: Timestamp.now(),
        device_info: arrayUnion({
          device: userAgent,
          ip: ip,
          location: city ? `${city}, ${country}` : country,
          time: new Date().toISOString()
        }),
        status: 'opened'
      });
    }

    // ৪. ১x১ ট্রান্সপারেন্ট পিক্সেল রিটার্ন করা
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    return new NextResponse('Error', { status: 500 });
  }
}