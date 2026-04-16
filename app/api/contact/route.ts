import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, service, message } = await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // 587 পোর্টের জন্য false
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

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Email API Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}