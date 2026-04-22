import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন রিড
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
    const categoryVariants = configDoc.data() as any;
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active", "sent"]) 
      .where("follow_up_count", "<", 5)
      .get();

    const sentEmails: string[] = [];

    for (const doc of querySnapshot.docs) {
      const lead = { id: doc.id, ...doc.data() } as any;
      const followUpCount = lead.follow_up_count || 0;
      const history = lead.tracking_history || [];

      // --- লজিক ১: প্রথম ফলো-আপের জন্য (২ বার ওপেন + ৩০ সেকেন্ড গ্যাপ) ---
      if (followUpCount === 0) {
        if (!lead.name || !lead.company_name) continue;

        // অন্তত ২টা ওপেন ইভেন্ট থাকতে হবে
        const openEvents = history.filter((h: any) => h.event === 'opened');
        if (openEvents.length < 2) continue;

        // ৩০ সেকেন্ড গ্যাপ চেক (প্রথম এবং শেষ ওপেনের মধ্যে)
        const firstOpen = openEvents[0].time;
        const lastOpen = openEvents[openEvents.length - 1].time;
        const firstMillis = firstOpen.toMillis ? firstOpen.toMillis() : new Date(firstOpen).getTime();
        const lastMillis = lastOpen.toMillis ? lastOpen.toMillis() : new Date(lastOpen).getTime();

        if ((lastMillis - firstMillis) / 1000 < 30) continue; 
      }

      // --- লজিক ২: পরবর্তী ফলো-আপের জন্য (১ বার ওপেন রিসেন্সি চেক) ---
      if (followUpCount >= 1) {
        const lastFollowUpTime = lead.lastFollowUp;
        const lastOpenedTime = lead.lastOpenedAt;

        if (lastFollowUpTime && lastOpenedTime) {
          const lastFollowUpMillis = lastFollowUpTime.toMillis ? lastFollowUpTime.toMillis() : new Date(lastFollowUpTime).getTime();
          const lastOpenedMillis = lastOpenedTime.toMillis ? lastOpenedTime.toMillis() : new Date(lastOpenedTime).getTime();
          
          // যদি শেষ ফলো-আপের পর আর ওপেন না করে, তবে পরবর্তী ইমেল যাবে না
          if (lastOpenedMillis <= lastFollowUpMillis) continue;
        } else {
          continue;
        }
      }

      // --- লজিক ৩: টাইমিং এবং ডিলে চেক ---
      const preferredHour = typeof lead.preferred_hour === 'number' ? lead.preferred_hour : 14; 
      if (currentHourUTC !== preferredHour) continue;

      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440;
      
      const baseTimeObj = lead.lastFollowUp || lead.lastOpenedAt || lead.sentAt;
      if (!baseTimeObj) continue;

      const baseTimeMillis = baseTimeObj.toMillis ? baseTimeObj.toMillis() : new Date(baseTimeObj).getTime();
      const diffInMinutes = (now.getTime() - baseTimeMillis) / (1000 * 60);

      if (diffInMinutes >= (delayMinutes - 10)) {
        const service = lead.service || 'Email Signature';
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        if (!stepConfig) continue;

        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        // ৪. পার্সোনালাইজেশন
        let personalizedMessage = finalVariant.content
          .replace(/{name}/g, lead.name || 'there')
          .replace(/{company}/g, lead.company_name || 'your company');

        const senderName = lead.sender_name || "Shahjalal Khan";
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";
        const subject = `Re: ${lead.subject || "Our Discussion"}`;

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
            tags: [lead.trackingId || lead.id], // ট্র্যাকিং ট্যাগ যোগ
            htmlContent: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  ${personalizedMessage}
                  <br/><p>Best Regards,<br><strong>${senderName}</strong></p>
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
            status: nextStepCount === 5 ? 'finished' : 'active',
            sent_messages: admin.firestore.FieldValue.arrayUnion({
              step: nextStepCount,
              subject: subject,
              sentAt: admin.firestore.Timestamp.now()
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