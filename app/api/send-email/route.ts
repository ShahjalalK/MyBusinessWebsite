import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message, sender, clientName, trackingId, scheduledAt, cf_token } = await req.json();

    // ১. ডাটা চেক
    if (!email || !subject || !message || !cf_token) {
      return NextResponse.json({ success: false, error: 'Missing required data or token' }, { status: 400 });
    }

    // ২. ক্লাউডফেয়ার টার্নস্টাইল ভেরিফিকেশন
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: cf_token,
      }),
    });

    const verification = await verifyResponse.json();
    if (!verification.success) {
      return NextResponse.json({ success: false, error: 'Security check failed' }, { status: 403 });
    }

    // ৩. ট্র্যাকিং আইডি জেনারেশন (আপনার অরিজিনাল লজিক অপরিবর্তিত)
    const baseTrackingId = trackingId || Buffer.from(`${email}-${Date.now()}`).toString('base64').substring(0, 12);
    const stepTrackingId = `${baseTrackingId}_step1`;
    const uniqueMessageId = `<${Date.now()}.${baseTrackingId}@mail.trackflowpro.com>`;

    // ৪. ব্রেভো API কল
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
        tags: [stepTrackingId], 
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              
              ${message}
              <br />
              <br>
              Best Regards,
              <br>
              --
              <br>
   <table>
 <tr>
    <td style="padding-right: 5px; border-right: 2px solid #ddd;"><img src="https://cdn.jsdelivr.net/gh/ShahjalalK/mayparsonal-signature@master/shahjalal-khan.webp" width="100" height="100" 
                    style="object-fit:cover; border: 2px solid #ebebeb; display: block; text-decoration: none; outline: none; border-radius: 50%;" 
                    alt="Shahjalal Khan" title="Shahjalal"></td>
    <td style="padding-left: 5px;">
        <span style="font-size: 16px; font-weight: bold; text-transform: uppercase; color: #222;">Shahjalal Khan</span><br>
                <span style="font-size: 14px; color: #666;">Founder Of TrackFlowPro</span><br>
               <div style="font-size: 10px; color : transparent !important">.</div>
                <div style="font-size: 14px; vertical-align: middle;">
                    <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/mayparsonal-signature@master/web2.webp" alt="W" width="16">
                    
                    <a href="https://trackflowpro.com" target="_blank" style=" color: #0056b3; text-decoration: none;"><i>www.trackflowpro.com</i></a>
                </div>
                <div style="font-size: 10px; color : transparent !important">.</div>
                <div style="font-size: 10px; color: #bbbbbb; letter-spacing: 0.5px; font-family: monospace;">
                  REF: ${stepTrackingId.toUpperCase()} | SECURE_TRACK_VERIFIED
                </div>
    </td>
 </tr>
   </table>
              

            </body>
          </html>
        `,
        headers: {
          "X-Mailin-Tag": stepTrackingId,
          "Message-ID": uniqueMessageId,
          "X-Entity-Ref-ID": baseTrackingId,
        },
        ...(scheduledAt && { scheduledAt: scheduledAt }),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        messageId: data.messageId, 
        trackingId: baseTrackingId 
      });
    } else {
      return NextResponse.json({ success: false, error: 'Brevo API Error' }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Email sending error:", error);   
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}