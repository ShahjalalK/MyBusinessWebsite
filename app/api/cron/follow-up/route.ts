import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. অথেন্টিকেশন চেক
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন লোড করা
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
    const categoryVariants = configDoc.data() as any;
    const now = new Date();

    // ৩. ডাটাবেস থেকে যোগ্য লিডগুলো খুঁজে বের করা
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active", "sent"]) 
      .where("follow_up_count", "<", 5)
      .where("stopAutomation", "==", false)
      .get();

    const sentEmails: string[] = [];

    // ৪. প্রতিটি লিডের জন্য লজিক প্রসেস করা
    for (const docSnapshot of querySnapshot.docs) {
      const lead = { id: docSnapshot.id, ...docSnapshot.data() } as any;
      const followUpCount = lead.follow_up_count || 0;

      /** * সাময়িকভাবে ওপেন কাউন্ট লজিক এবং টাইমিং লজিক বন্ধ রাখা হয়েছে 
       * যাতে আপনি Thunder Client দিয়ে হিট করলেই ইমেইল পাঠিয়ে টেস্ট করতে পারেন।
       **/

      // --- লজিক ৩: পরবর্তী ধাপ নির্ধারণ করা ---
      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;
      
      // ৫. কন্টেন্ট সিলেকশন (Service-wise)
      const service = lead.service || 'Email Signature';
      const stepConfig = categoryVariants[service]?.[currentStepKey];
      
      if (!stepConfig) {
        console.log(`No config found for service: ${service}, step: ${currentStepKey}`);
        continue;
      }

      const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
      const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

      if (!finalVariant || !finalVariant.content) continue;

      // ৬. পার্সোনালাইজেশন ও Brevo API কল
      const senderName = lead.sender_name || "Shahjalal Khan";
      const senderEmail = lead.sender_email || "support@mail.trackflowpro.com";
      const subject = `Re: ${lead.subject || "Our Discussion"}`;
      const currentStepTag = `${lead.trackingId || lead.id}_step${nextStepCount}`;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY as string,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: lead.email }],
          replyTo: { email: "shahjalal@trackflowpro.com", name: "Shahjalal Khan" },
          subject: subject,
          tags: [currentStepTag], 
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                ${finalVariant.content.replace(/{name}/g, lead.name || 'there').replace(/{company}/g, lead.company_name || '')}
                <br/><p>Best Regards,<br><strong>${senderName}</strong></p>
                <div style="display:none; visibility:hidden; font-size:1px;">${currentStepTag}</div>
              </body>
            </html>
          `,
        }),
      });

      // ৭. ডাটাবেস আপডেট (ইমেইল সফলভাবে পাঠানো হলে)
      if (response.ok) {
        await adminDb.collection("outreach_leads").doc(lead.id).update({
          lastFollowUp: admin.firestore.FieldValue.serverTimestamp(),
          follow_up_count: nextStepCount,
          status: nextStepCount >= 5 ? 'finished' : 'active',
          sent_messages: admin.firestore.FieldValue.arrayUnion({
            step: nextStepCount,
            subject: subject,
            trackingTag: currentStepTag,
            sentAt: admin.firestore.Timestamp.now()
          })
        });
        sentEmails.push(lead.email);
      }
    }

    return NextResponse.json({ 
        success: true, 
        totalSent: sentEmails.length, 
        emails: sentEmails 
    });

  } catch (error: any) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}