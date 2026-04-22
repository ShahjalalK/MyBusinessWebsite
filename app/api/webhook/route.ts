import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const event = body.event; 
    const email = body.email;
    // ব্রেভো থেকে আসা মেসেজ আইডি (ব্র্যাকেট ছাড়া হতে পারে)
    const rawMessageId = body['message-id'] || body.messageId;
    const timestamp = body.ts_event || Math.floor(Date.now() / 1000);
    const eventTime = admin.firestore.Timestamp.fromMillis(timestamp * 1000);

    const outreachRef = adminDb.collection("outreach_leads");
    let leadDoc = null;

    // ১. প্রথমে Message ID দিয়ে খুঁজি (এটি সবচেয়ে নিখুঁত)
    if (rawMessageId) {
      const cleanId = rawMessageId.replace(/[<>]/g, '');
      // ব্র্যাকেটসহ এবং ছাড়া উভয় ফরম্যাট চেক করার জন্য range query
      const idSnapshot = await outreachRef
        .where("originalMessageId", ">=", cleanId)
        .limit(1)
        .get();
        
      if (!idSnapshot.empty) {
        leadDoc = idSnapshot.docs[0];
      }
    }

    // ২. যদি আইডি দিয়ে না পাওয়া যায়, তবে ইমেইল দিয়ে খুঁজি
    if (!leadDoc && email) {
      const emailSnapshot = await outreachRef.where("email", "==", email).limit(1).get();
      if (!emailSnapshot.empty) {
        leadDoc = emailSnapshot.docs[0];
      }
    }

    if (leadDoc) {
      const docRef = outreachRef.doc(leadDoc.id);
      let updatePayload: any = {};

      // ৩. ইমেল স্ট্যাটাস লজিক
      if (event === 'request' || event === 'delivered') {
        updatePayload.status = 'sent';
        updatePayload.sentAt = eventTime;
      } else if (event === 'hard_bounce' || event === 'soft_bounce') {
        updatePayload.status = 'bounced';
      } else if (event === 'spam') {
        updatePayload.status = 'spam';
      }

      // ৪. ওপেন ট্র্যাকিং আপডেট
      if (event === 'opened') {
        updatePayload.status = 'opened';
        updatePayload.open_count = admin.firestore.FieldValue.increment(1);
        updatePayload.lastOpenedAt = eventTime;
        
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: 'opened',
          time: eventTime,
          ip: body.ip || 'unknown'
        });
      }

      // ৫. ক্লিক ট্র্যাকিং আপডেট
      if (event === 'click') {
        updatePayload.tracking_history = admin.firestore.FieldValue.arrayUnion({
          event: 'clicked',
          time: eventTime,
          link: body.url || "unknown link"
        });
      }

      if (Object.keys(updatePayload).length > 0) {
        await docRef.update(updatePayload);
      }

      return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
    }

    console.log("Lead not found for:", email, rawMessageId);
    return NextResponse.json({ message: "Lead not found" }, { status: 404 });

  } catch (error: any) {
    console.error("Brevo Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}