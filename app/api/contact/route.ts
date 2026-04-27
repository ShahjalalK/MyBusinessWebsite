import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, service, message, 
      clientId, sessionId, pageTitle, pageLocation,
      captchaToken // ১. ফ্রন্টএন্ড থেকে পাঠানো টোকেন ধরলাম
    } = body;

    // ২. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন চেক
    if (!captchaToken) {
      return NextResponse.json({ error: "Security check is missing" }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: captchaToken,
      }),
    });

    const verificationData = await verifyResponse.json();

    if (!verificationData.success) {
      return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 403 });
    }

    // ৩. ইমেল পাঠানোর কনফিগারেশন
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TrackFlow Inquiry" <${process.env.EMAIL_USER}>`,
      to: "shahjalal@trackflowpro.com",
      replyTo: email,
      subject: `New Project: ${service} - from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #041f60;">New Lead Received</h2>
          <hr />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Message:</strong> ${message}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Source: Contact Page Form</p>
        </div>
      `,
    });

    // ৪. GA4 সার্ভার-সাইড ট্র্যাকিং (Lead Event)
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (measurementId && apiSecret) {
      const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || '';

      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId || 'anonymous_lead',
          events: [{
            name: 'generate_lead',
            params: {
              session_id: sessionId || Date.now().toString(),
              page_title: pageTitle || 'Contact Form',
              page_location: pageLocation || '',
              ip_override: userIp,
              user_agent: userAgent,
              name: name, 
              service_type: service,
              engagement_time_msec: "100"
            },
          }],
        }),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send" }, { status: 500 });
  }
}