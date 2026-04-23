import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক (Vercel Cron Secret)
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন রিড (Automation Settings)
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
    const categoryVariants = configDoc.data() as any;
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি (যারা আগ্রহী বা যাদের ইমেইল পাঠানো হয়েছে)
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active", "sent"]) 
      .where("follow_up_count", "<", 5)
      .get();

    const sentEmails: string[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const lead = { id: docSnapshot.id, ...docSnapshot.data() } as any;
      const followUpCount = lead.follow_up_count || 0;
      const history = lead.tracking_history || [];

      // --- লজিক ১: প্রথম ফলো-আপের জন্য (২ বার ওপেন + ২ মিনিট গ্যাপ) ---
      if (followUpCount === 0) {
        // শুধুমাত্র নাম (lead.name) থাকা বাধ্যতামূলক, কোম্পানি না থাকলেও চলবে
        if (!lead.name) continue;

        const openEvents = history.filter((h: any) => h.event === 'opened');
        
        // কন্ডিশন ১: অন্তত ২ বার ওপেন হতে হবে
        if (openEvents.length < 2) continue;

        // কন্ডিশন ২: ২ মিনিট (১২০ সেকেন্ড) বা তার বেশি গ্যাপ চেক
        const firstOpen = openEvents[0].time;
        const lastOpen = openEvents[openEvents.length - 1].time;
        
        const firstMillis = firstOpen.toMillis ? firstOpen.toMillis() : new Date(firstOpen).getTime();
        const lastMillis = lastOpen.toMillis ? lastOpen.toMillis() : new Date(lastOpen).getTime();

        const gapInSeconds = (lastMillis - firstMillis) / 1000;
        
        // যদি গ্যাপ ১২০ সেকেন্ড (২ মিনিট) এর কম হয়, তবে এটি স্কিপ করবে
        if (gapInSeconds < 120) continue; 
      }

      // --- লজিক ২: পরবর্তী ফলো-আপের জন্য রিসেন্সি চেক ---
      if (followUpCount >= 1) {
        const lastFollowUpTime = lead.lastFollowUp;
        const lastOpenedTime = lead.lastOpenedAt;

        if (lastFollowUpTime && lastOpenedTime) {
          const lastFollowUpMillis = lastFollowUpTime.toMillis ? lastFollowUpTime.toMillis() : new Date(lastFollowUpTime).getTime();
          const lastOpenedMillis = lastOpenedTime.toMillis ? lastOpenedTime.toMillis() : new Date(lastOpenedTime).getTime();
          
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

      if (diffInMinutes < (delayMinutes - 10)) continue;

      // ৪. কন্টেন্ট সিলেকশন
      const service = lead.service || 'Email Signature';
      const stepConfig = categoryVariants[service]?.[currentStepKey];
      if (!stepConfig) continue;

      const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
      const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

      if (!finalVariant || !finalVariant.content) continue;

      // ৫. পার্সোনালাইজেশন (কোম্পানি না থাকলে খালি রাখবে)
      let personalizedMessage = finalVariant.content
        .replace(/{name}/g, lead.name || 'there')
        .replace(/{company}/g, lead.company_name || '');

      const senderName = lead.sender_name || "Shahjalal Khan";
      const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";
      const subject = `Re: ${lead.subject || "Our Discussion"}`;

      // ৬. Brevo API কল
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
          tags: [lead.trackingId], 
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                ${personalizedMessage}
                <br/><p>Best Regards,<br><strong>${senderName}</strong></p>
                <div style="display:none; visibility:hidden; font-size:1px;">${lead.trackingId}</div>
              </body>
            </html>
          `,
        }),
      });

      if (response.ok) {
        // ৭. ফায়ারবেস আপডেট
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

    return NextResponse.json({ success: true, totalSent: sentEmails.length, emails: sentEmails });
  } catch (error: any) {
    console.error("CRON ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}