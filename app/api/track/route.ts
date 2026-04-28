import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ১. অরিজিন চেক (Updated for Cloudflare)
    const origin = request.headers.get('origin') || "";
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";

    // হুবহু চেক না করে 'includes' ব্যবহার করা নিরাপদ এবং স্লাশ বা www এর ঝামেলা থাকে না
    const isAllowed = origin.replace(/\/$/, "") === allowedOrigin.replace(/\/$/, "");

    if (process.env.NODE_ENV === 'production' && !isAllowed) {
      console.log("Blocked Origin:", origin, "Expected:", allowedOrigin); // লগে চেক করার জন্য
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const body = await request.json();
    const { eventName, clientId, sessionId, pageTitle, pageLocation, eventParams } = body;

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.error("GA4 Config Missing");
      return NextResponse.json({ error: "Config missing" }, { status: 500 });
    }

    // ২. ইউজার ইনফো সংগ্রহ
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    // ৩. পেলোড তৈরি (ডাইনামিক প্যারামিটারসহ)
    const payload = {
      client_id: clientId || 'anonymous_user',
      events: [{
        name: eventName || 'page_view',
        params: {
          session_id: sessionId || Date.now().toString(),
          page_title: pageTitle || 'Unknown Page',
          page_location: pageLocation || '',
          ip_override: userIp,
          user_agent: userAgent,
          engagement_time_msec: "100",
          method: 'server_side_direct',
          ...eventParams, // যদি ফ্রন্টএন্ড থেকে আরও বাড়তি ডাটা পাঠান
        },
      }],
    };

    // ৪. GA4-এ ডাটা পাঠানো (Await করা হয়েছে ডাটা সেফ রাখার জন্য)
    const response = await fetch(GA4_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ success: response.ok }, { status: 200 });

  } catch (error: any) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}