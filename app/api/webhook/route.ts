import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; 
    const email = body.email;
    const rawMessageId = body['message-id'] || body.messageId;
    
    // ব্রেভো থেকে ট্যাগ সংগ্রহ করা (যা এখন 'abcd123_step2' ফরম্যাটে আসবে)
    const tags = body.tags || [];
    const receivedTag = tags.length > 0 ? tags[0] : null;

    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    let leadDoc = null;

    // --- ১. আইডি প্রসেসিং (নতুন লজিক) ---
    if (receivedTag) {
      // '_step' অংশটুকু বাদ দিয়ে মূল trackingId বের করা (যেমন: 'abcd123_step2' -> 'abcd123')
      const originalTrackingId = receivedTag.split('_step')[0];

      const tagSnapshot = await outreachRef
        .where("trackingId", "==", originalTrackingId)
        .limit(1)
        .get();

      if (!tagSnapshot.empty) {
        leadDoc = tagSnapshot.docs[0];
      }
    }

    // ২. ব্যাকআপ: যদি ট্যাগ দিয়ে না পায়, তবে Message ID দিয়ে খুঁজি
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

    // ৩. যদি লিড পাওয়া যায়, আপডেট শুরু করি
    if (leadDoc) {
      const docRef = outreachRef.doc(leadDoc.id);
      const leadData = leadDoc.data();
      let updatePayload: any = {};

      // ৪. ইমেল স্ট্যাটাস লজিক
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
      } else if (event === 'hard_bounce' || event === 'soft_bounce') {
        updatePayload.status = 'bounced';
      } else if (event === 'spam') {
        updatePayload.status = 'spam';
      }

      // ৫. ওপেন ট্র্যাকিং আপডেট
      if (event === 'opened') {
        const lastOpened = leadData.lastOpenedAt ? leadData.lastOpenedAt.toMillis() : 0;
        const currentRequestTime = eventTime.toMillis();

        if (currentRequestTime - lastOpened > 20000) { 
          updatePayload.status = 'opened';
          updatePayload.open_count = admin.firestore.FieldValue.increment(1);
          updatePayload.lastOpenedAt = eventTime;

          const dateObj = new Date(timestamp * 1000);
          updatePayload.preferred_hour = dateObj.getUTCHours();
          
          updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
            event: 'opened',
            time: eventTime,
            step_tag: receivedTag, // কোন স্টেপের ইমেইল খুলল তা সেভ থাকল
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
          step_tag: receivedTag,
          link: body.url || "unknown link"
        });
      }

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