import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ফর্ম থেকে আসা ডাটা সংগ্রহ
    const { name, email, service, clientId, sessionId, pageTitle } = body;

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // ১. ইউজারের আসল IP এবং User Agent (সার্ভার থেকে সরাসরি নেওয়া হচ্ছে)
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // ২. গুগল এনালাইটিক্স কালেকশন URL (লাইভ মোড)
    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    // route.ts এর আপডেট করা অংশ
const payload = {
  client_id: clientId || '123456789.123456789', // ফরম্যাটটি সবসময় numeric রাখার চেষ্টা করুন
  non_personalized_ads: false,
  events: [
    {
      name: 'generate_lead',
      params: {
        session_id: sessionId || Date.now().toString(),
        engagement_time_msec: "100", // এটি যোগ করলে গুগল ডাটাকে সিরিয়াসলি নেয়
        page_location: "https://www.trackflowpro.com/contact", // সরাসরি ইউআরএল দিন
        page_title: pageTitle || 'Contact Page',
        ip_override: userIp,
        user_agent: userAgent,
        service_type: service,
        method: 'server_side_proxy'
      },
    },
  ],
};

    // ৪. আপনার সার্ভার থেকে গুগলের সার্ভারে ডাটা পাঠানো (এটি অ্যাড-ব্লকার দেখবে না)
    const response = await fetch(GA4_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "GA4 Rejected" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Internal Error:", error.message);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}