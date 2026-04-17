import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id'); // ইমেইল আইডি

  if (!messageId) return new NextResponse('Missing ID', { status: 400 });

  // ১. ইউজারের ইনফরমেশন কালেক্ট করা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
  // কান্ট্রি ডিটেকশন (Vercel/Cloudflare এ অটোমেটিক হেডার থাকে)
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown Location';

  try {
    // ২. ফায়ারবেসে ওই Message ID দিয়ে লিডটি খুঁজে বের করা
    const q = query(collection(db, "outreach_leads"), where("originalMessageId", "==", messageId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const leadDoc = querySnapshot.docs[0];
      const leadRef = doc(db, "outreach_leads", leadDoc.id);

      // ৩. ডাটা আপডেট করা
      await updateDoc(leadRef, {
        open_count: increment(1),
        last_opened: new Date(),
        device_info: arrayUnion({
          device: userAgent,
          ip: ip,
          location: country,
          time: new Date()
        }),
        status: 'opened'
      });
    }

    // ৪. একটি ১x১ ট্রান্সপারেন্ট পিক্সেল রিটার্ন করা (যাতে ক্লায়েন্ট কিছু না বোঝে)
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    return new NextResponse('Error', { status: 500 });
  }
}