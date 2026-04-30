import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ডাটা হ্যাশ করার ফাংশন (FB CAPI এর জন্য)
function hashData(data: string) {
  if (!data) return "";
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  console.log("--- New Form Submission Started ---");
  try {
    const body = await request.json();
    const { 
      name, email, website, service, message, 
      clientId, sessionId, pageTitle, 
      captchaToken 
    } = body;

    // মেটাডাটা সংগ্রহ
    const pageLocation = request.headers.get('referer') || 'https://trackflowpro.com';
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // ১. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: secretKey || "", response: captchaToken }),
    });
    const verificationData = await verifyResponse.json();
    if (!verificationData.success) {
      console.error("❌ Captcha Failed");
      return NextResponse.json({ error: "Security check failed." }, { status: 403 });
    }

    // ২. আইপি থেকে জিও লোকেশন বের করা
    let geoData = { city: 'Unknown', country_name: 'Unknown', org: 'Unknown', region: 'Unknown' };
    try {
      const geoRes = await fetch(`https://ipapi.co/${userIp}/json/`);
      if (geoRes.ok) geoData = await geoRes.json();
    } catch (e) { console.warn("⚠️ Geo lookup failed"); }

    // ৩. প্রফেশনাল ইমেইল পাঠানো (সুন্দর ডিজাইন সহ)
    try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false, 
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
          from: `"TrackFlow Lead" <shahjalal@trackflowpro.com>`, 
          to: "shahjalalk.web@gmail.com",
          replyTo: email,
          subject: `🔥 ${service} Inquiry from ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #041f60; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">New Strategy Inquiry</h2>
              </div>
              <div style="padding: 20px; background-color: #ffffff;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td>${name}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td>${email}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Website:</strong></td><td>${website || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service:</strong></td><td>${service}</td></tr>
                </table>
                <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
                  <strong>Message:</strong><br/>
                  <p style="color: #4b5563;">${message}</p>
                </div>
                <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                  <p>📍 Location: ${geoData.city}, ${geoData.country_name} | IP: ${userIp}</p>
                  <p>📱 Browser: ${userAgent}</p>
                </div>
              </div>
            </div>
          `
        });
        console.log("✅ Beautiful Email Sent");
    } catch (e) { console.error("❌ Email Failed:", e); }

    // ৪. ট্র্যাকিং লজিক (FB & GA4)

    // ফেসবুক পেলোড
    const fbPayload = {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: pageLocation,
        user_data: {
          client_ip_address: userIp,
          client_user_agent: userAgent,
          em: [hashData(email)],
          fn: [hashData(name)],
          ct: [hashData(geoData.city)],
          country: [hashData(geoData.country_name)],
        },
        custom_data: {
          content_category: 'Service Inquiry',
          content_name: service,
          currency: 'USD',
          value: 0.00
        }
      }],
      // test_event_code: "TEST85792" // টেস্ট শেষে এটি সরিয়ে দিবেন
    };

    // GA4 পেলোড
    const gaPayload = { 
      client_id: clientId || '123456789.123456789', 
      events: [{ 
        name: 'generate_lead', 
        params: { 
          session_id: sessionId, 
          page_title: pageTitle, 
          service_type: service,
          location: geoData.country_name,
          // debug_mode: 1 
        } 
      }] 
    };

    // প্রোডাকশন ইউআরএল (সরাসরি ডেটা পাঠানোর জন্য)
    const gaProductionUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`;

    // একসাথে ফেসবুক এবং গুগল অ্যানালিটিক্সে ডেটা পাঠানো
    const [fbRes, gaRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(fbPayload) 
      }),
      fetch(gaProductionUrl, { 
        method: 'POST', 
        body: JSON.stringify(gaPayload) 
      })
    ]);

    console.log(`📡 FB Status: ${fbRes.status} | GA4 Status: ${gaRes.status}`);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Server Error:", error.message);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}