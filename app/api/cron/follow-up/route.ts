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
    // এখানে আমরা 'stopAutomation' ফিল্টারটি ফিরিয়ে আনছি কারণ এটি থাকা ভালো। 
    // যদি আপনার ডাটাবেসে এই ফিল্ড না থাকে, তবে টেস্টের জন্য এটি কমেন্ট রাখতে পারেন।
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
      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;

      // --- লজিক: টাইমিং ক্যালকুলেশন (rounding to 30 mins) ---
      // বেস টাইম হিসেবে আমরা শেষ ওপেনিং টাইম অথবা পাঠানো টাইম নেব
      const baseTimeObj = lead.lastOpenedAt || lead.last_opened || lead.sentAt;
      if (!baseTimeObj) continue;

      const baseTimeDate = new Date(baseTimeObj.toMillis ? baseTimeObj.toMillis() : baseTimeObj);
      
      // আপনার চাহিদা অনুযায়ী ৩০ মিনিটের রাউন্ডিং লজিক (১০:২৩ -> ১০:০০, ১০:৩৭ -> ১০:৩০)
      const roundedMinutes = Math.floor(baseTimeDate.getMinutes() / 30) * 30;
      const roundedBaseTime = new Date(baseTimeDate);
      roundedBaseTime.setMinutes(roundedMinutes, 0, 0);

      // কতদিন পর (Delay) ইমেইল যাবে তা বের করা (ডিফল্ট ১ দিন বা ১৪৪০ মিনিট)
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440; 
      const scheduledTimeMillis = roundedBaseTime.getTime() + (delayMinutes * 60000);

      // এখনকার সময়ের সাথে তুলনা
      if (now.getTime() < scheduledTimeMillis) {
        console.log(`Skipping ${lead.email}: Not scheduled yet.`);
        continue;
      }

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