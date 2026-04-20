import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক (GitHub Action থেকে পাঠানো x-cron-auth চেক করা)
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন ডাটা নিয়ে আসা
    const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
    if (!configDoc.exists()) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    const categoryVariants = configDoc.data();

    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি করা (যাদের মেইল খোলা হয়েছে বা যারা আগ্রহী এবং ৫টির কম ফলো-আপ হয়েছে)
    const q = query(
      collection(db, "outreach_leads"),
      where("status", "in", ["opened", "interested"]),
      where("follow_up_count", "<", 5) 
    );

    const querySnapshot = await getDocs(q);
    const sentEmails: string[] = [];

    for (const leadDoc of querySnapshot.docs) {
      const lead = { id: leadDoc.id, ...leadDoc.data() } as any;
      
      // ৪. Preferred Hour চেক
      // ক্লায়েন্ট যেই টাইমে মেইল দেখেছে (UTC), ঠিক সেই টাইমেই ফলো-আপ যাবে
      const preferredHour = lead.preferred_hour !== undefined ? lead.preferred_hour : 14; 
      
      if (currentHourUTC !== preferredHour) continue;

      const nextStepCount = (lead.follow_up_count || 0) + 1;
      const currentStepKey = `step${nextStepCount}`;
      
      // ৫. দিন অনুযায়ী ডিলে (Delay) নির্ধারণ
      // আপনার নতুন UI থেকে আসা দিনগুলো মিনিট হিসেবে সেভ আছে (১ দিন = ১৪৪০)
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440;
      
      // ৬. বেস টাইম নির্ধারণ
      // ২য় বা ৩য় ফলো-আপ হলে 'lastFollowUp' থেকে হিসাব হবে, আর ১ম ফলো-আপ হলে 'last_opened' থেকে।
      const baseTime = lead.lastFollowUp ? lead.lastFollowUp.toMillis() : (lead.last_opened ? lead.last_opened.toMillis() : null);
      
      if (!baseTime) continue;

      const diffInMinutes = (now.getTime() - baseTime) / (1000 * 60);

      // ৭. টাইমিং ম্যাচ লজিক (৩০ মিনিটের মার্জিন রাখা হয়েছে ক্রন জবের সামান্য দেরির জন্য)
      if (diffInMinutes >= (delayMinutes - 30)) {
        const service = lead.service || 'Email Signature';
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        
        // এসাইন করা ভেরিয়েন্ট বা ডিফল্ট ১ম ভেরিয়েন্ট বাছাই
        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const finalVariant = stepConfig?.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig?.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        // মেইল বডি পারসোনালাইজেশন
        const personalizedMessage = finalVariant.content.replace(/{name}/g, lead.name || 'there');
        const senderName = lead.sender_name || "Shahjalal Khan";
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";

        // ৮. Brevo API এর মাধ্যমে মেইল পাঠানো
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
          // ৯. ডাটাবেস আপডেট (ফলো-আপ কাউন্ট বাড়ানো এবং টাইমস্ট্যাম্প রাখা)
          await updateDoc(doc(db, "outreach_leads", lead.id), {
            lastFollowUp: serverTimestamp(),
            follow_up_count: nextStepCount,
            status: nextStepCount === 5 ? 'finished' : lead.status
          });
          sentEmails.push(lead.email);
        }
      }
    }

    return NextResponse.json({ success: true, totalSent: sentEmails.length, emails: sentEmails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}