import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ডাটা হ্যাশ করার ফাংশন (FB CAPI এর জন্য)
function hashData(data: string) {
  if (!data) return "";
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  console.log("--- New Form Submission with File Started ---");
  try {
    // ১. FormData থেকে ডাটা রিসিভ করা
    const data = await request.formData();
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const website = data.get('website') as string;
    const service = data.get('service') as string;
    const message = data.get('message') as string;
    const captchaToken = data.get('captchaToken') as string;
    const clientId = data.get('clientId') as string;
    const sessionId = data.get('sessionId') as string;
    const pageTitle = data.get('pageTitle') as string;
    
    // ফাইল রিসিভ করা
    const file = data.get('file') as File | null;

    // ২. নিখুঁত আইপি সংগ্রহ (Vercel/Cloudflare Friendly)
    const forwarded = request.headers.get('x-forwarded-for');
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const pageLocation = request.headers.get('referer') || 'https://trackflowpro.com';

    // ৩. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন
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

    // ৪. আইপি থেকে জিও লোকেশন
    let geoData = { city: 'Unknown', country_name: 'Unknown', org: 'Unknown', region: 'Unknown' };
    try {
      if (userIp && userIp !== '127.0.0.1' && userIp !== '::1') {
        const geoRes = await fetch(`http://ip-api.com/json/${userIp}`);
        if (geoRes.ok) {
          const resJson = await geoRes.json();
          if (resJson.status === 'success') {
            geoData = {
              city: resJson.city || 'Unknown',
              country_name: resJson.country || 'Unknown',
              org: resJson.isp || 'Unknown',
              region: resJson.regionName || 'Unknown'
            };
          }
        }
      }
    } catch (e) { console.warn("⚠️ Geo lookup failed:", e); }

    // ৫. ইমেইল সেটআপ এবং ফাইল এটাচমেন্ট
    try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false, 
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          tls: { rejectUnauthorized: false }
        });

        // ফাইলটিকে বাফারে রূপান্তর (যদি ফাইল থাকে)
        let attachments: any[] = [];
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          attachments.push({
            filename: file.name,
            content: buffer,
          });
        }

        await transporter.sendMail({
          from: `"TrackFlow Lead" <shahjalal@trackflowpro.com>`, 
          to: "shahjalalk.web@gmail.com",
          replyTo: email,
          subject: `🔥 ${service} Inquiry from ${name}`,
          attachments: attachments, // ফাইল এটাচমেন্ট যোগ করা হলো
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
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Attached:</strong></td><td>${file ? file.name : 'No file'}</td></tr>
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
        console.log("✅ Beautiful Email with Attachment Sent");
    } catch (e) { console.error("❌ Email Failed:", e); }

    // ৬. ট্র্যাকিং লজিক (FB & GA4) - আগের মতোই থাকবে
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
      }]
    };

    const gaPayload = { 
      client_id: clientId || '123456789.123456789', 
      events: [{ 
        name: 'generate_lead', 
        params: { 
          session_id: sessionId, 
          page_title: pageTitle, 
          service_type: service,
          country: geoData.country_name,
          city: geoData.city,
          debug_mode: 1 
        } 
      }] 
    };

    const gaUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`;

    const [fbRes, gaRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbPayload) 
      }),
      fetch(gaUrl, { method: 'POST', body: JSON.stringify(gaPayload) })
    ]);

    console.log(`📡 FB Status: ${fbRes.status} | GA4 Status: ${gaRes.status}`);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Server Error:", error.message);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}