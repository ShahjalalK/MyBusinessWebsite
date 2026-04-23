import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
    const categoryVariants = configDoc.data() as any;
    const now = new Date();
    
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active", "sent"]) 
      .where("follow_up_count", "<", 5)
      .where("stopAutomation", "==", false)
      .get();

    const sentEmails: string[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const lead = { id: docSnapshot.id, ...docSnapshot.data() } as any;
      const followUpCount = lead.follow_up_count || 0;
      const history = lead.tracking_history || [];

      // --- লজিক ১: ওপেনিং কোয়ালিফিকেশন ---
      if (followUpCount === 0) {
        const openEvents = history.filter((h: any) => h.event === 'opened');
        if (openEvents.length === 2) {
          const firstMillis = openEvents[0].time?.toMillis ? openEvents[0].time.toMillis() : new Date(openEvents[0].time).getTime();
          const lastMillis = openEvents[openEvents.length - 1].time?.toMillis ? openEvents[openEvents.length - 1].time.toMillis() : new Date(openEvents[openEvents.length - 1].time).getTime();
          if ((lastMillis - firstMillis) / 1000 < 120) continue; 
        } else if (openEvents.length < 2) continue;
      }

      // --- লজিক ২: রিসেন্সি চেক ---
      if (followUpCount >= 1) {
        const lastSent = lead.lastFollowUp || lead.sentAt;
        const lastOpened = lead.lastOpenedAt || lead.last_opened;
        if (lastSent && lastOpened) {
          const lastSentMillis = lastSent.toMillis ? lastSent.toMillis() : new Date(lastSent).getTime();
          const lastOpenedMillis = lastOpened.toMillis ? lastOpened.toMillis() : new Date(lastOpened).getTime();
          if (lastOpenedMillis <= lastSentMillis) continue;
        } else continue;
      }

      // --- লজিক ৩: ৩০ মিনিটের স্লট (Rounding Down Logic) ---
      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440; 
      
      const baseTimeObj = lead.lastOpenedAt || lead.last_opened || lead.sentAt;
      if (!baseTimeObj) continue;

      const baseTimeDate = new Date(baseTimeObj.toMillis ? baseTimeObj.toMillis() : baseTimeObj);
      
      // রাউন্ড ডাউন লজিক: মিনিটকে ৩০ দিয়ে ভাগ করে ফ্লোর করা হচ্ছে
      // উদাহরণ: ১২:১৯ হলে মিনিট হবে ০, ১২:৪১ হলে মিনিট হবে ৩০।
      const roundedMinutes = Math.floor(baseTimeDate.getMinutes() / 30) * 30;
      const roundedBaseTime = new Date(baseTimeDate);
      roundedBaseTime.setMinutes(roundedMinutes, 0, 0);

      const diffInMinutes = (now.getTime() - roundedBaseTime.getTime()) / (1000 * 60);

      // যদি রাউন্ডেড টাইম থেকে নির্ধারিত ডিলে (যেমন ১ দিন) পার হয়
      // ৫ মিনিটের একটি ছোট বাফার রাখা হয়েছে যেন ক্রন জব ঠিক সময়ে রান হলে মিস না হয়
      if (diffInMinutes < (delayMinutes - 5)) continue;

      // ৪. কন্টেন্ট সিলেকশন
      const service = lead.service || 'Email Signature';
      const stepConfig = categoryVariants[service]?.[currentStepKey];
      if (!stepConfig) continue;

      const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
      const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

      if (!finalVariant || !finalVariant.content) continue;

      // ৫. পার্সোনালাইজেশন ও Brevo API কল
      const senderName = lead.sender_name || "Shahjalal Khan";
      const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";
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
    return NextResponse.json({ success: true, totalSent: sentEmails.length, emails: sentEmails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}