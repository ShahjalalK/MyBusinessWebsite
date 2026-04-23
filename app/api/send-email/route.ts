import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName, companyName, trackingId, scheduledAt } = await req.json();

    // মেইন আইডি জেনারেট করা
    const baseTrackingId = trackingId || Buffer.from(`${email}-${Date.now()}`).toString('base64').substring(0, 12);
    
    // প্রথম ইমেইলের জন্য ইউনিক ট্যাগ (step1)
    const stepTrackingId = `${baseTrackingId}_step1`;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: email, name: clientName || "" }],
        replyTo: { email: "shahjalal@trackflowpro.com", name: "Shahjalal Khan" },
        subject: subject,
        
        // Tags এ আমরা ইউনিক আইডি দিচ্ছি
        tags: [stepTrackingId], 
        
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              ${message}
              <div style="display:none; visibility:hidden; font-size:1px;">${stepTrackingId}</div>
            </body>
          </html>
        `,
        headers: {
          "X-Mailin-Tag": stepTrackingId // হেডার এবং বডি একই আইডি শেয়ার করছে
        },
        ...(scheduledAt && { scheduledAt: scheduledAt }),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        messageId: data.messageId, 
        trackingId: baseTrackingId // আমরা মেইন আইডিটি রিটার্ন দিচ্ছি ডাটাবেসে সেভ করার জন্য
      });
    } else {
      console.error("Brevo API Error:", data);
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}