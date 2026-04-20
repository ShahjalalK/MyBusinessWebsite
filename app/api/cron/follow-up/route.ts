import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';

// ... আপনার ইম্পোর্টগুলো আগের মতোই থাকবে ...

export async function GET(req: Request) {
  try {
    // ১. সিকিউরিটি চেক
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      console.error("Auth mismatch. Expected:", process.env.CRON_SECRET, "Got:", authHeader);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন চেক (Try-catch এর ভেতর রাখুন যাতে না থাকলে ক্রাশ না করে)
    const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
    if (!configDoc.exists()) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    const categoryVariants = configDoc.data();

    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // ৩. লিড কুয়েরি
    const q = query(
      collection(db, "outreach_leads"),
      where("status", "in", ["opened", "interested"]),
      where("follow_up_count", "<", 5) 
    );

    const querySnapshot = await getDocs(q);
    const sentEmails: string[] = [];

    for (const leadDoc of querySnapshot.docs) {
      const lead = { id: leadDoc.id, ...leadDoc.data() } as any;
      
      // Preferred Hour চেক (নিরাপদ ডিফল্ট ভ্যালু ১৪)
      const preferredHour = typeof lead.preferred_hour === 'number' ? lead.preferred_hour : 14; 
      if (currentHourUTC !== preferredHour) continue;

      const nextStepCount = (lead.follow_up_count || 0) + 1;
      const currentStepKey = `step${nextStepCount}`;
      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440;
      
      // ৪. বেস টাইম নির্ধারণ (আপনার ডাটাবেস ফিল্ডের নাম অনুযায়ী আপডেট করা হয়েছে)
      const baseTimeObj = lead.lastFollowUp || lead.lastOpenedAt || lead.last_opened;
      if (!baseTimeObj) continue;

      const baseTimeMillis = typeof baseTimeObj.toMillis === 'function' ? baseTimeObj.toMillis() : new Date(baseTimeObj).getTime();
      const diffInMinutes = (now.getTime() - baseTimeMillis) / (1000 * 60);

      // ৫. টাইমিং চেক
      if (diffInMinutes >= (delayMinutes - 30)) {
        const service = lead.service || 'Email Signature';
        const stepConfig = categoryVariants[service]?.[currentStepKey];
        const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
        const finalVariant = stepConfig?.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig?.variants?.[0];

        if (!finalVariant || !finalVariant.content) continue;

        const personalizedMessage = finalVariant.content.replace(/{name}/g, lead.name || 'there');
        const senderName = lead.sender_name || "Shahjalal Khan";
        const senderEmail = lead.sender_email || "shahjalal@trackflowpro.com";

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
    console.error("CRON ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}