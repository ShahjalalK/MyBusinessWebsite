import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ১. অরিজিন চেক
    const origin = request.headers.get('origin') || "";
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
    const isAllowed = origin.replace(/\/$/, "") === allowedOrigin.replace(/\/$/, "");

    if (process.env.NODE_ENV === 'production' && !isAllowed) {
      console.log("❌ Origin Blocked:", origin);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { eventName, clientId, sessionId, pageTitle, pageLocation, eventParams, testEventCode } = body;

    // ২. কনফিগারেশন সংগ্রহ
    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;
    const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // --- ৩. ফেসবুক কনভার্সন এপিআই (FB CAPI) পেলোড আপডেট করা হয়েছে ---
    const fbPayload = {
      data: [{
        event_name: eventName || 'PageView',
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
      }],
      // টেস্ট কোডটি এখন ডেটা অ্যারের বাইরে থাকবে
      test_event_code: testEventCode || "" 
    };
    console.log("🚀 Sending to FB with Test Code:", testEventCode);

    // ৪. ইউআরএল সেটআপ
    const FB_URL = `https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;
    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

    // ৫. ডাটা পাঠানো (Headers যোগ করা হয়েছে)
    const [fbRes, gaRes] = await Promise.all([
      fetch(FB_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(fbPayload) 
      }),
      fetch(GA4_URL, { 
        method: 'POST', 
        body: JSON.stringify({
          client_id: clientId || 'anonymous_user',
          events: [{
            name: eventName || 'page_view',
            params: { 
              session_id: sessionId, 
              page_title: pageTitle, 
              page_location: pageLocation,  
              ip_override: userIp, 
              user_agent: userAgent, 
              ...eventParams 
            },
          }],
        }) 
      })
    ]);

    const fbData = await fbRes.json();
    
    // টার্মিনালে চেক করার জন্য
    console.log("✅ FB Response Status:", fbRes.status);
    console.log("📝 FB Response Data:", JSON.stringify(fbData, null, 2));

    return NextResponse.json({ 
      success: true, 
      fbStatus: fbRes.ok, 
      gaStatus: gaRes.ok,
      fbResponse: fbData 
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Tracking Error:", error.message);
    return NextResponse.json({ error: "Tracking failed", details: error.message }, { status: 500 });
  }
}