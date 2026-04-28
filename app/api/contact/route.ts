import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, service, message, 
      clientId, sessionId, pageTitle, pageLocation,
      captchaToken 
    } = body;

    // ১. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন
    if (!captchaToken) {
      return NextResponse.json({ error: "Security check is missing" }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey || "",
          response: captchaToken,
        }),
      });

    const verificationData = await verifyResponse.json();

    if (!verificationData.success) {
      return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 403 });
    }

    // ২. Brevo SMTP কনফিগারেশন (Updated)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // smtp-relay.brevo.com
      port: Number(process.env.SMTP_PORT), // 587
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Brevo-র জন্য TLS নিশ্চিত করা জরুরি
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // ৩. ইমেইল পাঠানো
    const info = await transporter.sendMail({
      // "from" হিসেবে ভেরিফাইড ইমেইলটি ব্যবহার করা হয়েছে
      from: `"TrackFlow Inquiry" <shahjalal@trackflowpro.com>`, 
      to: "shahjalalk.web@gmail.com",
      replyTo: email, // ইউজার যাতে রিপ্লাই দিলে কাস্টমারের কাছে যায়
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
          <p style="font-size: 11px; color: #999;">Client ID: ${clientId || 'N/A'}</p>
          <p style="font-size: 12px; color: #666;">Source: Contact Page Form</p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);

    // ৪. GA4 সার্ভার-সাইড ট্র্যাকিং (বাকি অংশ ঠিক আছে)
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