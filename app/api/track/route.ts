import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ১. অরিজিন এবং সিকিউরিটি চেক
    const origin = request.headers.get('origin') || "";
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
    const isAllowed = origin.replace(/\/$/, "") === allowedOrigin.replace(/\/$/, "");

    if (process.env.NODE_ENV === 'production' && !isAllowed) {
      console.log("❌ Unauthorized Origin Attempt:", origin);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      eventName, 
      clientId, 
      sessionId, 
      pageTitle, 
      pageLocation, 
      eventParams, 
      testEventCode 
    } = body;

    // ২. এনভায়রনমেন্ট ভেরিয়েবল সংগ্রহ
    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;
    const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

    // ৩. ইউজার ডাটা এক্সট্রাকশন (নিখুঁত লোকেশনের জন্য)
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // --- ৪. ফেসবুক কনভার্সন এপিআই (FB CAPI) ---
    const fbPayload: any = {
      data: [{
        event_name: eventName === 'page_view' ? 'PageView' : eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: pageLocation,
        user_data: {
          client_ip_address: userIp,
          client_user_agent: userAgent,
        },
        custom_data: {
          ...eventParams
        }
      }]
    };

    // টেস্ট মোড অন থাকলে কোড যোগ হবে
    if (testEventCode) {
      fbPayload.test_event_code = testEventCode;
    }

    // ৫. ইউআরএল কনস্ট্রাকশন
    const FB_URL = `https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;
    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

    // ৬. গুগল এনালাইটিক্স ৪ (GA4 MP) পেলোড
    const ga4Payload = {
      client_id: clientId, // এটি ইউনিক না হলে গুগল কাউন্ট করবে না
      events: [{
        name: eventName || 'page_view',
        params: {
          session_id: sessionId,
          page_title: pageTitle,
          page_location: pageLocation,
          ip_override: userIp,
          user_agent: userAgent,
          engagement_time_msec: 100, // এটি অবশ্যই Number হতে হবে (গুগলকে এক্টিভেশন বোঝাতে)
          ...eventParams
        },
      }],
    };

    // ৭. প্যারালাল রিকোয়েস্ট পাঠানো
    const [fbRes, gaRes] = await Promise.all([
      fetch(FB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload)
      }),
      fetch(GA4_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ga4Payload)
      })
    ]);

    // লগিং (টার্মিনালে চেক করার জন্য)
    console.log(`📡 Event: ${eventName} | GA Status: ${gaRes.status} | FB Status: ${fbRes.status}`);

    return NextResponse.json({
      success: true,
      gaStatus: gaRes.status,
      fbStatus: fbRes.status
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Server Side Tracking Failed:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}