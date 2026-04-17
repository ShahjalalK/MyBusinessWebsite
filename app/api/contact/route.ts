import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // এখানে ট্র্যাকিং আইডিগুলোও রিসিভ করছি
    const { name, email, service, message, clientId, sessionId } = body;

    // --- ইমেল পাঠানোর লজিক (আপনার কোড) ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TrackFlow Inquiry" <${process.env.EMAIL_USER}>`,
      to: "shahjalal@trackflowpro.com",
      replyTo: email,
      subject: `New Project: ${service} - from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; max-width: 600px;">
          <h2 style="color: #041f60; font-size: 24px; margin-bottom: 20px;">New Contact Message</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Client Name:</strong> ${name}</p>
          <p><strong>Client Email:</strong> ${email}</p>
          <p><strong>Selected Service:</strong> <span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px;">${service}</span></p>
          <p><strong>Project Details:</strong></p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #041f60;">
            ${message}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This message was sent from TrackFlowPro Contact Form.</p>
        </div>
      `,
    };

    // ইমেল সেন্ড করা
    await transporter.sendMail(mailOptions);

    // --- সার্ভার-সাইড ট্র্যাকিং (ম্যাজিক এখানে) ---
    // ইমেল চলে যাওয়ার পর আমরা সাথে সাথে গুগলে ডাটা পাঠিয়ে দিচ্ছি
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (measurementId && apiSecret) {
      const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
      
      const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || '';

      await fetch(GA4_URL, {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId || 'anonymous',
          events: [{
            name: 'generate_lead',
            params: {
              session_id: sessionId || Date.now().toString(),
              ip_override: userIp,
              user_agent: userAgent,
              name: name,
              service_type: service,
              method: 'server_side_email_form'
            },
          }],
        }),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}