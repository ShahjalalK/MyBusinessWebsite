import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ১. অরিজিন চেক
    const origin = request.headers.get('origin') || "";
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
    const isAllowed = origin.replace(/\/$/, "") === allowedOrigin.replace(/\/$/, "");

    if (process.env.NODE_ENV === 'production' && !isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { eventName, clientId, sessionId, pageTitle, pageLocation, eventParams, testEventCode } = body;

    // কনফিগারেশন সংগ্রহ
    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;
    const FB_PIXEL_ID = process.env.FB_PIXEL_ID; // আপনার নতুন পিক্সেল আইডি
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN; // আপনার নতুন টোকেন

    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // --- ৩. ফেসবুক কনভার্সন এপিআই (FB CAPI) পেলোড ---
    const fbPayload = {
      data: [{
        event_name: eventName || 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: pageLocation,
        user_data: {
          client_ip_address: userIp,
          client_user_agent: userAgent,
          // আপনি চাইলে এখানে ইমেইল/ফোন হ্যাশ করে পাঠাতে পারেন (Advanced)
        },
        custom_data: {
          ...eventParams
        },
        // টেস্ট করার সময় এই কোডটি কাজে লাগবে
        test_event_code: testEventCode || "" 
      }]
    };

    // --- ৪. গুগল অ্যানালিটিক্স (GA4) পেলোড ---
    const ga4Payload = {
      client_id: clientId || 'anonymous_user',
      events: [{
        name: eventName || 'page_view',
        params: {
          session_id: sessionId,
          page_title: pageTitle,
          page_location: pageLocation,
          ip_override: userIp,
          user_agent: userAgent,
          ...eventParams,
        },
      }],
    };

    // --- ৫. ডাটা পাঠানো (Parallel execution) ---
    const FB_URL = `https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;
    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

    // একই সাথে দুই জায়গায় ডাটা পাঠানো হচ্ছে
    const [fbRes, gaRes] = await Promise.all([
      fetch(FB_URL, { method: 'POST', body: JSON.stringify(fbPayload) }),
      fetch(GA4_URL, { method: 'POST', body: JSON.stringify(ga4Payload) })
    ]);

    const fbData = await fbRes.json();

    return NextResponse.json({ 
      success: true, 
      fbStatus: fbRes.ok, 
      gaStatus: gaRes.ok,
      fbResponse: fbData 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}