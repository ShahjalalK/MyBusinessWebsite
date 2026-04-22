import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName, companyName, trackingId, scheduledAt } = await req.json();

    // যদি কোনো কারণে ফ্রন্টএন্ড থেকে trackingId না আসে, তবে ব্যাকআপ হিসেবে একটি তৈরি করবে
    const finalTrackingId = trackingId || Buffer.from(`${email}-${Date.now()}`).toString('base64').substring(0, 12);

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
        subject: subject,
        // ব্রেভোতে 'tags' হিসেবে trackingId পাঠানো হচ্ছে যাতে ওয়েব-হুকে এটি পাওয়া যায়
        tags: [finalTrackingId], 
        // ব্রেভো অনেক সময় কাস্টম হেডার সাপোর্ট করে, এটি ট্র্যাকিং-এর জন্য নিরাপদ ব্যাকআপ
        headers: {
          "X-Mailin-Tag": finalTrackingId
        },
        ...(scheduledAt && { scheduledAt: scheduledAt }),
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              ${message}
              <div style="display:none; visibility:hidden; font-size:1px;">${finalTrackingId}</div>
            </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        messageId: data.messageId, 
        trackingId: finalTrackingId 
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