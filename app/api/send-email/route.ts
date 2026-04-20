import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName, scheduledAt } = await req.json();

    // ট্র্যাকিং আইডি জেনারেট
    const trackingId = Buffer.from(`${email}-${Date.now()}`).toString('base64').substring(0, 12);

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
        ...(scheduledAt && { scheduledAt: scheduledAt }),
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                ${message}
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  <img src="https://www.trackflowpro.com/api/email-track?id=${trackingId}" width="1" height="1" style="display:none !important;" alt="" />
                </div>
              </div>
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
        trackingId: trackingId 
      });
    } else {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}