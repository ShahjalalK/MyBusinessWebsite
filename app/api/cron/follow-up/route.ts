import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক (Authorization)
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      console.error("Unauthorized access attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন ডাটা রিড
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }
    
    const categoryVariants = configDoc.data() as any;
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি (যারা একটিভ আছে এবং ৫টির কম ফলো-আপ পেয়েছে)
    // জালাল ভাই, এখানে আমরা শুধু 'opened' এবং 'interested' স্ট্যাটাসগুলোই ধরছি
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active"]) 
      .where("follow_up_count", "<", 5)
      .get();

    const sentEmails: string[] = [];

    for (const doc of querySnapshot.docs) {
      const lead = { id: doc.id, ...doc.data() } as any;
      const followUpCount = lead.follow_up_count || 0;

      // --- লজিক ১: নাম এবং কোম্পানি চেক ---
      if (followUpCount === 0) {
        if (!lead.name || lead.name.trim() === "" || !lead.company_name || lead.company_name.trim() === "") {
          continue;
        }

        // হিউম্যান ভেরিফিকেশন (২ বার ওপেন এবং ৩০ সেকেন্ড গ্যাপ)
        if ((lead.open_count || 0) < 2) continue;

        if (lead.device_info && lead.device_info.length >= 2) {
          const firstOpen = lead.device_info[0].time;
          const lastOpen = lead.device_info[lead.device_info.length - 1].time;
          const firstMillis = firstOpen.toMillis ? firstOpen.toMillis() : new Date(firstOpen).getTime();
          const lastMillis = lastOpen.toMillis ? lastOpen.toMillis() : new Date(lastOpen).getTime();
          if ((lastMillis - firstMillis) / 1000 < 30) continue; 
        } else {
          continue; 
        }
      }

      // --- লজিক ২: ওপেন রিসেন্সি চেক (পরবর্তী ফলো-আপের জন্য) ---
      if (followUpCount >= 1) {
        const lastFollowUpTime = lead.lastFollowUp;
        const lastOpenedTime = lead.lastOpenedAt || lead.last_opened;
        if (lastFollowUpTime && lastOpenedTime) {
          const lastFollowUpMillis = lastFollowUpTime.toMillis ? lastFollowUpTime.toMillis() : new Date(lastFollowUpTime).getTime();
          const lastOpenedMillis = lastOpenedTime.toMillis ? lastOpenedTime.toMillis() : new Date(lastOpenedTime).getTime();
          if (lastOpenedMillis <= lastFollowUpMillis) continue;
        } else {
          continue;
        }
      }

      // --- লজিক ৩: টাইমিং চেক ---
      const preferredHour = typeof lead.preferred_hour === 'number' ? lead.preferred_hour : 14; 
      if (currentHourUTC !== preferredHour) continue;

      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440;
      
      const baseTimeObj = lead.lastFollowUp || lead.lastOpenedAt || lead.last_opened;
      if (!baseTimeObj) continue;

      const baseTimeMillis = baseTimeObj.toMillis ? baseTimeObj.toMillis() : new Date(baseTimeObj).getTime();
      const diffInMinutes = (now.getTime() - baseTimeMillis) / (1000 * 60);

      // টাইম ডিলে চেক
      if (diffInMinutes >= (delayMinutes - 10)) { // ১০ মিনিট বাফার রাখা হয়েছে
        const service = lead.service || 'Email Signature';
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        if (!stepConfig) continue;

        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        // ৪. পার্সোনালাইজেশন
        let personalizedMessage = finalVariant.content;
        personalizedMessage = personalizedMessage.replace(/{name}/g, lead.name || 'there');
        personalizedMessage = personalizedMessage.replace(/{company}/g, lead.company_name || 'your company');

        const senderName = lead.sender_name || "Shahjalal Khan";
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";
        const subject = `Re: ${lead.subject}`;

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
            subject: subject,
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
          // ৬. Bulletproof ডাটাবেস আপডেট (Thread History সহ)
          await adminDb.collection("outreach_leads").doc(lead.id).update({
            lastFollowUp: admin.firestore.FieldValue.serverTimestamp(),
            follow_up_count: nextStepCount,
            status: nextStepCount === 5 ? 'finished' : lead.status,
            // ড্যাশবোর্ডে থ্রেড দেখানোর জন্য নিচের ডাটাগুলো পাঠানো হচ্ছে
            sent_messages: admin.firestore.FieldValue.arrayUnion({
              step: nextStepCount,
              subject: subject,
              body: personalizedMessage,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              sender_email: senderEmail
            })
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