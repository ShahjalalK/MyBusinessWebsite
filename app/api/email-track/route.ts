import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id');

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (!trackingId) return new NextResponse(pixel, { headers });

  // ডাটা এক্সট্র্যাক্ট করা
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown IP';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    // এখানে 'outreach_leads' কালেকশনে trackingId দিয়ে সার্চ করছি
    const leadsRef = collection(db, "outreach_leads");
    const q = query(leadsRef, where("trackingId", "==", trackingId.trim())); // trim() যোগ করা হয়েছে স্পেস দূর করতে
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const leadDoc = querySnapshot.docs[0];
      const leadRef = doc(db, "outreach_leads", leadDoc.id);

      // গুরুত্বপূর্ণ: এখানে সরাসরি object আপডেট করা হচ্ছে
      await updateDoc(leadRef, {
        open_count: increment(1),
        last_opened: Timestamp.now(),
        status: 'opened',
        device_info: arrayUnion({
          device: userAgent.slice(0, 150), // খুব বড় ডাটা যেন না হয়
          ip: ip,
          location: locationText,
          time: new Date().toISOString()
        })
      });
      console.log("Successfully updated lead:", trackingId);
    }
  } catch (error) {
    console.error("Tracking Update Failed:", error);
  }

  return new NextResponse(pixel, { headers });
}