import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName } = await req.json();

    // সমাধান: ইমেইল পাঠানোর আগেই একটি ইউনিক ট্র্যাকিং আইডি জেনারেট করা
    // ব্রেভো মেসেজ আইডি আসার আগে আমরা এটি দিয়ে ট্র্যাক করব
    const trackingId = Buffer.from(`${email}-${Date.now()}`).toString('base64').substring(0, 12);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { 
          name: sender.name, 
          email: sender.email 
        },
        to: [{ 
          email: email, 
          name: clientName || "" 
        }],
        subject: subject,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
              <div style="max-width: 600px;">
                ${message.replace(/\n/g, '<br>')}
                <br><br>
                <img src="https://www.trackflowpro.com/api/email-track?id=${trackingId}" width="1" height="1" style="display:none !important;" />
              </div>
            </body>
          </html>
        `,
        headers: { 
          "List-Unsubscribe": `<mailto:${sender.email}?subject=unsubscribe>` 
        }
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // আমরা trackingId এবং Brevo-র messageId দুটোই ফেরত পাঠাবো
      return NextResponse.json({ 
        success: true, 
        messageId: data.messageId, // এটি ব্রেভোর আইডি
        trackingId: trackingId     // এটি আমাদের কাস্টম আইডি যা পিক্সেল এ ব্যবহার হয়েছে
      });
    } else {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}