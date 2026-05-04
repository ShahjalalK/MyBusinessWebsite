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
    // ১. FormData থেকে ডাটা রিসিভ করা
    const data = await request.formData();
    
    // ডাটাগুলোকে সেফলি স্ট্রিং এ কনভার্ট করা
    const name = (data.get('name') as string) || "Unknown";
    const email = (data.get('email') as string) || "";
    const website = (data.get('website') as string) || "N/A";
    const service = (data.get('service') as string) || "General Inquiry";
    const message = (data.get('message') as string) || "";
    const captchaToken = (data.get('captchaToken') as string) || "";
    const clientId = (data.get('clientId') as string) || "";
    const sessionId = (data.get('sessionId') as string) || "";
    const pageTitle = (data.get('pageTitle') as string) || "Contact Page";
    
    // ফাইল রিসিভ করা (যদি থাকে)
    const file = data.get('file') as File | null;

    // ২. ক্লায়েন্ট ইনফো সংগ্রহ (Vercel/Cloudflare Friendly)
    const forwarded = request.headers.get('x-forwarded-for');
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const pageLocation = request.headers.get('referer') || 'https://trackflowpro.com';

    // ৩. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন
    if (!captchaToken) {
        return NextResponse.json({ error: "Security token missing." }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
            secret: secretKey || "", 
            response: captchaToken,
            remoteip: userIp 
        }),
    });
    
    const verificationData = await verifyResponse.json();
    if (!verificationData.success) {
      console.error("❌ Captcha Failed:", verificationData);
      return NextResponse.json({ error: "Security check failed." }, { status: 403 });
    }

    // ৪. আইপি থেকে জিও লোকেশন (ip-api.com ব্যবহার করে)
    let geoData = { city: 'Unknown', country: 'Unknown', isp: 'Unknown', region: 'Unknown', countryCode: 'US' };
    try {
      if (userIp && userIp !== '127.0.0.1' && userIp !== '::1') {
        const geoRes = await fetch(`http://ip-api.com/json/${userIp}`);
        if (geoRes.ok) {
          const resJson = await geoRes.json();
          if (resJson.status === 'success') {
            geoData = {
              city: resJson.city || 'Unknown',
              country: resJson.country || 'Unknown',
              isp: resJson.isp || 'Unknown',
              region: resJson.regionName || 'Unknown',
              countryCode: resJson.countryCode || 'US'
            };
          }
        }
      }
    } catch (e) { console.warn("⚠️ Geo lookup failed:", e); }

    // ৫. ইমেইল সেটআপ এবং ফাইল এটাচমেন্ট
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, 
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    let attachments: any[] = [];
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      attachments.push({
        filename: file.name,
        content: buffer,
      });
    }

    // ইমেইল পাঠানো (এটিকে আমরা await করবো যাতে সাকসেস কনফার্ম হওয়া যায়)
    await transporter.sendMail({
      from: `"TrackFlow Lead" <${process.env.EMAIL_USER}>`, 
      to: "shahjalalk.web@gmail.com",
      replyTo: email,
      subject: `🔥 ${service} Inquiry from ${name}`,
      attachments: attachments,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #041f60; padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 24px;">New Strategy Inquiry</h2>
            <p style="opacity: 0.8; margin-top: 5px;">TrackFlow Pro Analytics Service</p>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Name:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Email:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${email}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Website:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${website}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Service:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${service}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>File Attached:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${file ? file.name : 'None'}</td></tr>
            </table>
            <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #041f60;">
              <strong style="color: #041f60; display: block; margin-bottom: 8px;">Message:</strong>
              <p style="color: #334155; margin: 0; line-height: 1.6;">${message}</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              <p style="margin: 2px 0;">📍 Location: ${geoData.city}, ${geoData.country} (${geoData.countryCode})</p>
              <p style="margin: 2px 0;">🌐 IP Address: ${userIp}</p>
              <p style="margin: 2px 0;">💻 Device: ${userAgent}</p>
            </div>
          </div>
        </div>
      `
    });

    // ৬. ট্র্যাকিং লজিক (FB CAPI & GA4 Measurement Protocol)

    // Facebook CAPI Payload
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
          country: [hashData(geoData.countryCode.toLowerCase())], // ISO 2 letter code
        },
        custom_data: {
          content_category: 'Service Inquiry',
          content_name: service,
          currency: 'USD',
          value: 0.00
        }
      }]
    };

    // GA4 Measurement Protocol Payload
    const gaPayload = { 
      client_id: clientId || '55555.66666', 
      events: [{ 
        name: 'generate_lead', 
        params: { 
          session_id: sessionId, 
          page_title: pageTitle, 
          service_type: service,
          country: geoData.country,
          city: geoData.city,
          engagement_time_msec: "100", 
        } 
      }] 
    };

    const gaUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`;

    // প্যারালাল ট্র্যাকিং কল
    const [fbRes, gaRes] = await Promise.allSettled([
      fetch(`https://graph.facebook.com/v19.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbPayload) 
      }),
      fetch(gaUrl, { method: 'POST', body: JSON.stringify(gaPayload) })
    ]);

    console.log(`📡 Tracking Complete | GA4 URL used: ${process.env.GA4_MEASUREMENT_ID}`);

    return NextResponse.json({ success: true, message: "Lead processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Server Error:", error.message);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}