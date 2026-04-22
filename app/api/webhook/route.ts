import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; // opened, request, delivered, hard_bounce, spam, etc.
    const email = body.email;
    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    const snapshot = await outreachRef.where("email", "==", email).limit(1).get();

    if (!snapshot.empty) {
      const leadDoc = snapshot.docs[0];
      const docRef = outreachRef.doc(leadDoc.id);

      let updatePayload: any = {};

      // ১. ইমেল স্ট্যাটাস আপডেট (Sent, Delivered, Bounce, Spam)
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
      } else if (event === 'hard_bounce' || event === 'soft_bounce') {
        updatePayload.status = 'bounced';
      } else if (event === 'spam') {
        updatePayload.status = 'spam';
      }

      // ২. ওপেন ট্র্যাকিং (সব ইভেন্টই সেভ হবে)
      if (event === 'opened') {
        updatePayload.status = 'opened';
        updatePayload.open_count = admin.firestore.FieldValue.increment(1);
        updatePayload.lastOpenedAt = eventTime;
        
        const newEntry = {
          event: 'opened',
          time: eventTime
        };
        // সরাসরি অ্যারেতে যোগ করা হচ্ছে
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion(newEntry);
      }

      // ৩. ক্লিক ট্র্যাকিং (যদি লিঙ্কে ক্লিক করে)
      if (event === 'click') {
        const clickEntry = {
          event: 'clicked',
          time: eventTime,
          link: body.url || "unknown link"
        };
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion(clickEntry);
      }

      if (Object.keys(updatePayload).length > 0) {
        await docRef.update(updatePayload);
      }

      return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
    }

    return NextResponse.json({ message: "Lead not found" }, { status: 404 });
  } catch (error) {
    console.error("Brevo Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}