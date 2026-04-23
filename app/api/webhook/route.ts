import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; 
    const email = body.email;
    const rawMessageId = body['message-id'] || body.messageId;
    const tags = body.tags || [];
    const receivedTag = tags.length > 0 ? tags[0] : null;

    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    let leadDoc = null;

    // ১. আইডি প্রসেসিং (trackingId দিয়ে সার্চ)
    if (receivedTag) {
      const originalTrackingId = receivedTag.split('_step')[0];
      const tagSnapshot = await outreachRef
        .where("trackingId", "==", originalTrackingId)
        .limit(1)
        .get();

      if (!tagSnapshot.empty) {
        leadDoc = tagSnapshot.docs[0];
      }
    }

    // ২. ব্যাকআপ সার্চ (Message ID দিয়ে সার্চ)
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

    if (leadDoc) {
      const docRef = outreachRef.doc(leadDoc.id);
      const leadData = leadDoc.data();
      let updatePayload: any = {};

      // ৩. ডেলিভারি লজিক (সংশোধিত)
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
        updatePayload.lastFollowUp = eventTime; 
        updatePayload.followUpReady = false; 

        if (receivedTag && receivedTag.includes('_step')) {
          // 'step1' -> 1, 'step2' -> 2
          const stepNumber = parseInt(receivedTag.split('_step')[1]); 
          
          /**
           * লজিক সংশোধন: 
           * প্রথম আউটরিচ (step1) হলে count হবে 0 (যাতে F-1 ট্যাবে থাকে)
           * দ্বিতীয় আউটরিচ (step2) হলে count হবে 1 (যাতে F-2 ট্যাবে থাকে)
           */
          const targetCount = stepNumber - 1; 

          if (targetCount > (leadData.follow_up_count || 0)) {
            updatePayload.follow_up_count = targetCount;
          }
        }
      } else if (event === 'hard_bounce' || event === 'soft_bounce') {
        updatePayload.status = 'bounced';
        updatePayload.stopAutomation = true; 
      } else if (event === 'spam') {
        updatePayload.status = 'spam';
        updatePayload.stopAutomation = true;
      }

      // ৪. ওপেন ট্র্যাকিং আপডেট
      if (event === 'opened') {
        const lastOpened = leadData.lastOpenedAt ? leadData.lastOpenedAt.toMillis() : 0;
        const currentRequestTime = eventTime.toMillis();

        // ২০ সেকেন্ডের মধ্যে মাল্টিপল ওপেন ইগনোর করা
        if (currentRequestTime - lastOpened > 20000) { 
          updatePayload.status = 'opened';
          updatePayload.open_count = admin.firestore.FieldValue.increment(1);
          updatePayload.lastOpenedAt = eventTime;

          const dateObj = new Date(timestamp * 1000);
          updatePayload.preferred_hour = dateObj.getUTCHours();
          
          updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
            event: 'opened',
            time: eventTime,
            step_tag: receivedTag || 'initial',
            ip: body.ip || 'unknown',
            device: body['user-agent'] || 'unknown'
          });
        }
      }

      // ৫. ক্লিক ট্র্যাকিং আপডেট
      if (event === 'click') {
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: 'clicked',
          time: eventTime,
          step_tag: receivedTag || 'initial',
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