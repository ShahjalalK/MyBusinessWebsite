import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    // ১. কনফিগ লোড করা
    const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
    if (!configDoc.exists()) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    const categoryVariants = configDoc.data();

    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // শুধুমাত্র আগ্রহী (opened/interested) লিড যাদের রিপ্লাই আসেনি
    const q = query(
      collection(db, "outreach_leads"),
      where("status", "in", ["opened", "interested"]),
      where("follow_up_count", "<", 5) 
    );

    const querySnapshot = await getDocs(q);
    const sentEmails: string[] = [];

    for (const leadDoc of querySnapshot.docs) {
      const lead = { id: leadDoc.id, ...leadDoc.data() } as any;
      
      // ২. Preferred Hour চেক
      // Note: যেহেতু ক্রন প্রতি ৩০ মিনিটে চলে, তাই নির্দিষ্ট ঘণ্টার যেকোনো সময়ে এটি রান করবে।
      const preferredHour = lead.preferred_hour !== undefined ? lead.preferred_hour : 14; 
      if (currentHour !== preferredHour) continue;

      // ৩. বর্তমান কোন স্টেপ চলবে তা নির্ধারণ
      const nextStepCount = (lead.follow_up_count || 0) + 1;
      const currentStepKey = `step${nextStepCount}`;
      
      // ৪. মিনিট (Delay) ক্যালকুলেশন (PRO Logic)
      const delayMinutes = lead[`${currentStepKey}Delay`] || 60; // ড্যাশবোর্ড থেকে আসা টোটাল মিনিট
      const lastActionTime = lead.lastFollowUp ? lead.lastFollowUp.toMillis() : lead.last_opened?.toMillis();
      
      if (!lastActionTime) continue;

      // মিলি-সেকেন্ড থেকে মিনিটে রূপান্তর
      const diffInMinutes = (now.getTime() - lastActionTime) / (1000 * 60);

      // যদি নির্ধারিত মিনিট পার হয়ে যায়
      if (diffInMinutes >= delayMinutes) {
        const service = lead.service || 'Email Signature';
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        
        // লিডের জন্য নির্ধারিত ভেরিয়েন্ট আইডি
        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const leadVariant = stepConfig?.variants?.find((v: any) => v.id === assignedVariantId);

        // যদি ভেরিয়েন্ট না থাকে, তবে প্রথম ভেরিয়েন্টটি ডিফল্ট হিসেবে নেওয়া (সেফটি)
        const finalVariant = leadVariant || stepConfig?.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        // ৫. পার্সোনালাইজেশন
        const personalizedMessage = finalVariant.content.replace(/{name}/g, lead.name || 'there');
        const senderName = lead.sender_name || "Shahjalal Khan"; // outreach.tsx এর সাথে মিল রেখে
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";

        // ৬. Brevo API call
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
                  <br/>
                  <p>Best Regards,<br><strong>${senderName}</strong></p>
                  <img src="https://www.trackflowpro.com/api/email-track?id=${lead.trackingId || lead.id}" width="1" height="1" />
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          // ৭. ডাটাবেস আপডেট (পরবর্তী স্টেপের জন্য)
          await updateDoc(doc(db, "outreach_leads", lead.id), {
            lastFollowUp: serverTimestamp(),
            follow_up_count: nextStepCount,
            status: nextStepCount === 5 ? 'finished' : lead.status
          });
          sentEmails.push(lead.email);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalSent: sentEmails.length, 
      emails: sentEmails,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}