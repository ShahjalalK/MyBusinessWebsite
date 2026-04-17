import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

// ১. টাইপ ডিফাইন করা (যাতে লাল দাগ চলে যায়)
interface OutreachLead {
  id: string;
  email: string;
  subject: string;
  createdAt: Timestamp;
  lastFollowUp: Timestamp | null;
  open_count: number;
}

export async function GET(req: Request) {
  try {
    const q = query(
      collection(db, "outreach_leads"),
      where("lastFollowUp", "==", null)
    );

    const querySnapshot = await getDocs(q);
    
    // এখানে ডাটা ম্যাপ করার সময় টাইপ বলে দেওয়া হচ্ছে
    const leads = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as OutreachLead[];

    const sentEmails: string[] = [];

    for (const lead of leads) {
      const now = new Date().getTime();
      
      // এখন আর .toMillis() এ লাল দাগ থাকবে না
      const sentTime = lead.createdAt.toMillis();
      const diff = now - sentTime;

      // আপনি চাইলে টেস্ট করার জন্য ২ দিন (172800000) কমিয়ে ১ মিনিট (60000) দিয়ে দেখতে পারেন
      if (diff > 0) { 
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY as string,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: "Shahjalal Jalal", email: "shahjalal@trackflowpro.com" },
            to: [{ email: lead.email }],
            subject: `Re: ${lead.subject}`,
            htmlContent: `
              <html>
                <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
                  <p>Hi,</p>
                  <p>I'm just following up on my previous email regarding your tracking setup. I wanted to make sure it didn't get buried in your inbox.</p>
                  <p>Would you be open to a quick 5-minute chat about this?</p>
                  <p>Best regards,<br>Shahjalal Jalal</p>
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          const leadRef = doc(db, "outreach_leads", lead.id);
          await updateDoc(leadRef, {
            lastFollowUp: serverTimestamp(),
            status: 'followed-up'
          });
          sentEmails.push(lead.email);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Follow-up sent to ${sentEmails.length} leads`,
      sentTo: sentEmails 
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}