import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, service, clientId, sessionId, pageTitle } = body;

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.error("GA4 Credentials missing in .env.local");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // ১. ইউজারের আসল IP এবং Browser Info সংগ্রহ
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Measurement Protocol URL
    // const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    const GA4_URL = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    const payload = {
      client_id: clientId || '123456.789012',
      user_properties: {
        user_id: { value: email } 
      },
      events: [
        {
          name: 'generate_lead',
          params: {
            debug_mode: 1, 
            engagement_time_msec: 100, 
            session_id: sessionId || Date.now().toString(), 
            ip_override: userIp,   
            user_agent: userAgent, 
            name: name,
            service_type: service,
            page_location: request.headers.get('referer') || '', 
            page_title: pageTitle || 'Unknown Page',
          },
        },
      ],
    };

    const response = await fetch(GA4_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.ok) {
        return NextResponse.json({ success: true }, { status: 200 });
    } else {
        const errorText = await response.text();
        console.error("GA4 Response Error:", errorText);
        return NextResponse.json({ error: "GA4 Rejected Request" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Internal Server Error:", error.message);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}