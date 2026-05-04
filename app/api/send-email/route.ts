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
              Best Regurds,
              --

              <table cellspacing="0" cellpadding="0" style="min-width: 600px; padding:10px;font-family: sans-serif; vertical-align: middle;" border="0">
            <tr>
              <!-- Profile Image -->
              <td style="padding-right:5px; border-right: 3px solid #ddd; mso-padding-alt: 0px 5px 0px 0px" width="120">
                
                      <img src="https://raw.githubusercontent.com/ShahjalalK/mayparsonal-signature/refs/heads/master/shahjalal.webp" 
                              width="120" height="120" 
                              style="object-fit:cover; border: 3px solid #ddd; display: block; text-decoration: none; outline: none; border-radius: 50%;" 
                              alt="Shahjalal Khan" title="Shahjalal" />
                      
              </td>
              <!-- Content -->
              <td align="left" style="padding-left: 10px; mso-padding-alt: 0px 0px 0px 10px" >   
                  

          <table cellspacing="0" cellpadding="0" border="0" style="padding-bottom: 5px;" width="100%">
            <tr>
              <td>
                <div style="font-size:14pt;font-weight:600;color:#2e2c2c; text-transform: uppercase;">
                  Shahjalal Khan
                </div>
                
                <div style="font-size: 12pt; color:#374151;">
                  <i>Digital Branding Tool Specialist</i>
                </div>
              </td>
            </tr>
          </table>
          <table cellspacing="0" cellpadding="0" border="0" style="padding-top: 5px;" width="100%">
            <tr>
              <td>
                <table cellspacing="0" cellpadding="0" border="0" width="auto%">
                  <tr>
                    <!-- <td bgcolor="#52796f" style="border: 2px solid #ddd; padding: 5px 15px; text-decoration: none !important; outline: none;">
                <a href="https://www.fiverr.com/s/VYEW0ax" target="_blank" title="View Portfolio" style=" display: inline-block;  text-decoration: none !important; text-align: center; color: #fff; font-weight: bold; font-size: 12pt;  -webkit-text-size-adjust: none;">
                        View Portfolio
                        </a>
              </td> -->
              <td style="padding-left: 5px;"><a href="https://www.linkedin.com/in/shahjalal-khan/" target="_blank" style="text-decoration:none !important;; vertical-align: middle; " >
                    <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/shahjalalkhan-signature@master/linkedin.png" width="26" height="26"  alt="linkedin" style=" vertical-align: middle;" title="linkedin">
                </a></td>
              
              
                  </tr>
                </table>
              </td>
              
                <td></td>
                
            </tr>
          </table> 
            
              </td>
              <!-- <td align="right" style="vertical-align: bottom;">
                <table cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size: 16px; color: #064729;"><i>Available on:</i></td>
                  </tr>
                </table>
                
                  <table cellspacing="0" cellpadding="0" border="0" align="right" width="100%">
                    <tr>            
                      <td style="border: 1px solid #8fb6ac; background-color: #122a36; padding: 2px 5px; font-size: 14.6px !important;" align="center"><span style="color: #6dd651;">Up</span><span style="color: #fffffa;">work</span></td>
                  <td style="border: 1px solid #8fb6ac; background-color: #01270d; padding: 2px 5px; font-size: 14.6px !important;" align="center"><span style="color: #ffffff;">Fiverr</span><span style="color: #1dbf73;">.</span></td>
                    </tr>
                  </table>
                </td> -->
            </tr>
            

            <tr>
              <td style="padding: 5px 7px; border: 1px solid #8fb6ac; background-color: #ddd; -ms-text-size-adjust: 100% !important; -webkit-text-size-adjust: 100% !important; font-size: 14.6px; line-height: 18px;" colspan="3">

              <table cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
              <td width="100%" style="vertical-align: middle; -webkit-text-size-adjust: none;"><span style="vertical-align: middle; font-size: 14.6px !important; font-weight:500; vertical-align: middle; ">Helping You Make a Lasting First Impression in Every Inbox. </td>
                                  <!-- <td width="30" style="text-decoration: none; outline: none; border: none;"><a href="mailto:shahjalalk.web@gmail.com"><img src="https://cdn.jsdelivr.net/gh/ShahjalalK/shahjalalkhan-signature@master/message.png" alt="M" width="30" style="vertical-align: middle;" /></a></td> -->
                              </tr>
            </table>
                
              </tr>
            </table>  
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