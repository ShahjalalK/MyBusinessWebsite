import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      console.error("Unauthorized access attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন ডাটা রিড (TypeScript Error Fixed)
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }
    
    // টাইপস্ক্রিপ্ট এরর এড়াতে 'any' কাস্টিং
    const categoryVariants = configDoc.data() as any;

    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested"])
      .where("follow_up_count", "<", 5)
      .get();

    const sentEmails: string[] = [];

    for (const doc of querySnapshot.docs) {
      const lead = { id: doc.id, ...doc.data() } as any;
      
      // Preferred Hour চেক
      const preferredHour = typeof lead.preferred_hour === 'number' ? lead.preferred_hour : 14; 
      if (currentHourUTC !== preferredHour) continue;

      const nextStepCount = (lead.follow_up_count || 0) + 1;
      const currentStepKey = `step${nextStepCount}`;
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440;
      
      // বেস টাইম চেক
      const baseTimeObj = lead.lastFollowUp || lead.lastOpenedAt || lead.last_opened;
      if (!baseTimeObj) continue;

      // Firestore Timestamp সেফ কনভারশন
      const baseTimeMillis = baseTimeObj.toMillis ? baseTimeObj.toMillis() : new Date(baseTimeObj).getTime();
      const diffInMinutes = (now.getTime() - baseTimeMillis) / (1000 * 60);

      // ৪. টাইমিং ম্যাচ হলে মেইল পাঠানো
      if (diffInMinutes >= (delayMinutes - 30)) {
        const service = lead.service || 'Email Signature';
        
        // এখানে আপনার এররটি আসছিল, যা এখন ফিক্সড
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        if (!stepConfig) continue;

        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        const personalizedMessage = finalVariant.content.replace(/{name}/g, lead.name || 'there');
        const senderName = lead.sender_name || "Shahjalal Khan";
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";

        // ৫. Brevo API কল
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY as string,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: lead.email }],
            subject: `Re: ${lead.subject}`,
            htmlContent: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  ${personalizedMessage}
                  <br/><p>Best Regards,<br><strong>${senderName}</strong></p>
                  <img src="https://www.trackflowpro.com/api/email-track?id=${lead.trackingId || lead.id}" width="1" height="1" />
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          // ৬. ডাটাবেস আপডেট
          await adminDb.collection("outreach_leads").doc(lead.id).update({
            lastFollowUp: admin.firestore.FieldValue.serverTimestamp(),
            follow_up_count: nextStepCount,
            status: nextStepCount === 5 ? 'finished' : lead.status
          });
          sentEmails.push(lead.email);
        }
      }
    }

    return NextResponse.json({ success: true, totalSent: sentEmails.length, emails: sentEmails });
  } catch (error: any) {
    console.error("CRON ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}