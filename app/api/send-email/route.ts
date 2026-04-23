import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName, companyName, trackingId, scheduledAt } = await req.json();

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
        replyTo: { email: "shahjalal@trackflowpro.com", name: "Shahjalal Khan" },
        subject: subject,
        
        // --- ট্র্যাকিং নিশ্চিত করার অংশ ---
        tags: [finalTrackingId], 
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              ${message}
              <div style="display:none; visibility:hidden; font-size:1px;">${finalTrackingId}</div>
            </body>
          </html>
        `,
        // ব্রেভোতে ট্র্যাকিং অন করার প্যারামিটারগুলো নিচে দেওয়া হলো
        // ব্রেভোর লেটেস্ট API অনুযায়ী এগুলো ডিফল্ট থাকে, তবুও আমরা ফোর্স করছি
        headers: {
          "X-Mailin-Tag": finalTrackingId
        },
        // ট্র্যাকিং প্যারামিটার (ব্রেভোর কিছু বিশেষ মডেলে লাগে)
        // আমরা এখানে ব্রেভোর অপশনাল প্যারামিটারগুলো যোগ করছি
        ...(scheduledAt && { scheduledAt: scheduledAt }),
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