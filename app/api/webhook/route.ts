import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; 
    const email = body.email; // Brevo থেকে আসা ইমেইল
    const rawMessageId = body['message-id'] || body.messageId;
    const tags = body.tags || [];
    const receivedTag = tags.length > 0 ? tags[0] : null;

    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    let leadDoc = null;

    // ১. আইডি প্রসেসিং (trackingId দিয়ে নিখুঁত সার্চ)
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

    // ২. ব্যাকআপ সার্চ (Message ID দিয়ে নিখুঁত সার্চ - এখানে '>=' এর বদলে '==' করা হয়েছে)
    if (!leadDoc && rawMessageId) {
      const cleanId = rawMessageId.replace(/[<>]/g, '');
      const idSnapshot = await outreachRef
        .where("originalMessageId", "==", cleanId) // এখানে '==' নিশ্চিত করা হয়েছে
        .limit(1)
        .get();
      if (!idSnapshot.empty) {
        leadDoc = idSnapshot.docs[0];
      }
    }

    // লিড পাওয়া গেলে প্রসেসিং শুরু হবে
    if (leadDoc) {
      const leadData = leadDoc.data();
      const docRef = outreachRef.doc(leadDoc.id);

      // ৩. নিরাপত্তা চেক: ইমেইল অ্যাড্রেস কি মিলছে? 
      // এটি নিশ্চিত করবে যে আইডি ম্যাচ করলেও ভুল ইমেইলের ডাটা আপডেট হবে না
      if (leadData.email !== email) {
        console.log(`Email mismatch for ID: ${leadData.trackingId}. DB: ${leadData.email}, Webhook: ${email}`);
        return NextResponse.json({ message: "Lead identity mismatch" }, { status: 403 });
      }

      let updatePayload: any = {};

      // ৪. ডেলিভারি লজিক
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
        updatePayload.lastFollowUp = eventTime; 
        updatePayload.followUpReady = false; 

        if (receivedTag && receivedTag.includes('_step')) {
          const stepNumber = parseInt(receivedTag.split('_step')[1]); 
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

      // ৫. ওপেন ট্র্যাকিং আপডেট
      if (event === 'opened') {
        const lastOpened = leadData.lastOpenedAt ? leadData.lastOpenedAt.toMillis() : 0;
        const currentRequestTime = eventTime.toMillis();

        // ২০ সেকেন্ডের সেফটি বাফার
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

      // ৬. ক্লিক ট্র্যাকিং আপডেট
      if (event === 'click') {
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: 'clicked',
          time: eventTime,
          step_tag: receivedTag || 'initial',
          link: body.url || "unknown link"
        });
      }

      // ফাইনাল ডাটা আপডেট
      if (Object.keys(updatePayload).length > 0) {
        await docRef.update(updatePayload);
      }

      return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
    }

    // যদি লিড খুঁজে না পাওয়া যায়
    return NextResponse.json({ message: "Lead not found in database" }, { status: 404 });

  } catch (error: any) {
    console.error("Brevo Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}