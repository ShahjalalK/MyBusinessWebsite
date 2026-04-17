import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface OutreachLead {
  id: string;
  email: string;
  subject: string;
  createdAt: Timestamp;
  lastFollowUp: Timestamp | null;
  follow_up_count: number;
}

export async function GET(req: Request) {
  try {
    // যাদের এখনো ৩টির কম ফলো-আপ পাঠানো হয়েছে তাদের খুঁজে বের করা
    const q = query(
      collection(db, "outreach_leads"),
      where("follow_up_count", "<", 3)
    );

    const querySnapshot = await getDocs(q);
    const leads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OutreachLead[];
    const sentEmails: string[] = [];

    for (const lead of leads) {
      const now = new Date().getTime();
      const lastActionTime = lead.lastFollowUp ? lead.lastFollowUp.toMillis() : lead.createdAt.toMillis();
      const diff = now - lastActionTime;

      // ফলো-আপ পাঠানোর দিন নির্ধারণ (৩ দিন = 259200000ms)
      const waitTime = 259200000; 

      if (diff > waitTime) {
        let followUpMessage = "";
        let nextCount = lead.follow_up_count + 1;

        // ফলো-আপ অনুযায়ী মেসেজ সেট করা
        if (nextCount === 1) {
          followUpMessage = "Hi, I'm just following up to see if you had a moment to read my previous email regarding your tracking setup.";
        } else if (nextCount === 2) {
          followUpMessage = "Hi again, I noticed you might be busy, but I'm really interested in helping you fix those tracking data gaps. Did you get a chance to think about it?";
        } else if (nextCount === 3) {
          followUpMessage = "Hi, this is my final follow-up. I don't want to be a bother, so if I don't hear back, I'll assume it's not the right time. Feel free to reach out if you need help in the future!";
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY as string,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: "Shahjalal Jalal", email: "shahjalalkhan895@gmail.com" },
            to: [{ email: lead.email }],
            subject: `Re: ${lead.subject}`,
            htmlContent: `<html><body><p>${followUpMessage}</p><p>Best,<br>Shahjalal</p></body></html>`,
          }),
        });

        if (response.ok) {
          const leadRef = doc(db, "outreach_leads", lead.id);
          await updateDoc(leadRef, {
            lastFollowUp: serverTimestamp(),
            follow_up_count: nextCount,
            status: nextCount === 3 ? 'finished' : 'following-up'
          });
          sentEmails.push(lead.email);
        }
      }
    }

    return NextResponse.json({ success: true, sentTo: sentEmails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}