import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; 
    const email = body.email;
    const rawMessageId = body['message-id'] || body.messageId;
    
    // ব্রেভো থেকে ট্যাগ (Unique trackingId) সংগ্রহ করা
    const tags = body.tags || [];
    const trackingIdFromTag = tags.length > 0 ? tags[0] : null;

    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    let leadDoc = null;

    // ১. প্রথমে Unique trackingId (Tag) দিয়ে খুঁজি (সবচেয়ে নির্ভুল)
    if (trackingIdFromTag) {
      const tagSnapshot = await outreachRef
        .where("trackingId", "==", trackingIdFromTag)
        .limit(1)
        .get();
      if (!tagSnapshot.empty) {
        leadDoc = tagSnapshot.docs[0];
      }
    }

    // ২. ব্যাকআপ: যদি ট্যাগ দিয়ে না পায়, তবে Message ID দিয়ে খুঁজি
    if (!leadDoc && rawMessageId) {
      const cleanId = rawMessageId.replace(/[<>]/g, '');
      const idSnapshot = await outreachRef
        .where("originalMessageId", ">=", cleanId)
        .limit(1)
        .get();
      if (!idSnapshot.empty) {
        leadDoc = idSnapshot.docs[0];
      }
    }

    // ৩. যদি লিড পাওয়া যায়, আপডেট শুরু করি
    if (leadDoc) {
      const docRef = outreachRef.doc(leadDoc.id);
      const leadData = leadDoc.data();
      let updatePayload: any = {};

      // ৪. ইমেল স্ট্যাটাস লজিক (sent/bounced/spam)
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
      } else if (event === 'hard_bounce' || event === 'soft_bounce') {
        updatePayload.status = 'bounced';
      } else if (event === 'spam') {
        updatePayload.status = 'spam';
      }

      // ৫. ওপেন ট্র্যাকিং আপডেট (উইথ ডুপ্লিকেট প্রোটেকশন)
      if (event === 'opened') {
        const lastOpened = leadData.lastOpenedAt ? leadData.lastOpenedAt.toMillis() : 0;
        const currentRequestTime = eventTime.toMillis();

        // যদি একই ইমেইল ২০ সেকেন্ডের মধ্যে আবার ওপেন হয়, তবে কাউন্ট বাড়াবো না
        if (currentRequestTime - lastOpened > 20000) { 
          updatePayload.status = 'opened';
          updatePayload.open_count = admin.firestore.FieldValue.increment(1);
          updatePayload.lastOpenedAt = eventTime;
          
          updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
            event: 'opened',
            time: eventTime,
            ip: body.ip || 'unknown',
            device: body['user-agent'] || 'unknown'
          });
        }
      }

      // ৬. ক্লিক ট্র্যাকিং আপডেট
      if (event === 'click') {
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: 'clicked',
          time: eventTime,
          link: body.url || "unknown link"
        });
      }

      // সবশেষে আপডেটগুলো ফায়ারবেসে পাঠিয়ে দেই
      if (Object.keys(updatePayload).length > 0) {
        await docRef.update(updatePayload);
      }

      return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
    }

    return NextResponse.json({ message: "Lead not found" }, { status: 404 });

  } catch (error: any) {
    console.error("Brevo Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}