import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ব্রেভো যখন ইমেইল ওপেন হওয়ার খবর পাঠাবে (event: 'opened')
    if (body.event === 'opened' || body.event === 'unique_opened') {
      const messageId = body['message-id']; // ব্রেভো থেকে পাঠানো আইডি

      // ১. ফায়ারবেসে ওই originalMessageId দিয়ে ডকুমেন্ট খুঁজে বের করা
      const q = query(
        collection(db, "outreach_leads"), 
        where("originalMessageId", "==", messageId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // ২. ক্লায়েন্টকে পাওয়া গেলে তার ওপেন কাউন্ট ১ বাড়িয়ে দেওয়া
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          open_count: increment(1),
          lastOpenedAt: new Date()
        });
        console.log(`Success: Updated open count for ${messageId}`);
      }
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}