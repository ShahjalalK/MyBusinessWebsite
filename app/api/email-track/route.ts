import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('id')?.replace(/['"]+/g, '').trim();

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  });

  if (!trackingId) return new NextResponse(pixel, { headers });

  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = req.headers.get('x-vercel-ip-city') || '';
  const locationText = city ? `${city}, ${country}` : country;

  try {
    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("trackingId", "==", trackingId).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      
      // ডিভাইস ডিটেকশন (সহজ লজিক)
      let deviceType = "Desktop";
      if (/mobile|android|iphone|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = "Mobile";
      } else if (/tablet|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = "Tablet";
      }

      // আপডেট লজিক
      await outreachRef.doc(leadDoc.id).update({
        open_count: admin.firestore.FieldValue.increment(1),
        lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(), // সর্বশেষ সময়
        status: 'opened',
        // device_info না পেলেও অন্তত সময় এবং IP সেভ হবে
        device_info: admin.firestore.FieldValue.arrayUnion({
          device: deviceType || "Unknown",
          ip: ip,
          location: locationText || "Private",
          time: admin.firestore.Timestamp.now() // ফায়ারবেস ফরম্যাটে টাইম
        })
      });
    }
  } catch (error) {
    console.error("Tracking Error:", error);
  }

  return new NextResponse(pixel, { headers });
}