import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, clientId, sessionId, pageTitle, pageLocation } = body;

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      return NextResponse.json({ error: "Config missing" }, { status: 500 });
    }

    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    const payload = {
      client_id: clientId || 'anonymous_user',
      events: [{
        name: eventName || 'page_view', // ডিফল্ট পেজ ভিউ
        params: {
          session_id: sessionId || Date.now().toString(),
          page_title: pageTitle || 'Unknown Page',
          page_location: pageLocation || '', // ফ্রন্টএন্ড থেকে আসা আসল লিংক
          ip_override: userIp,
          user_agent: userAgent,
          engagement_time_msec: "100",
          method: 'server_side_general'
        },
      }],
    };

    const response = await fetch(GA4_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ success: response.ok }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}