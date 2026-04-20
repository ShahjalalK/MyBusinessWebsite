import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ব্রেভো থেকে পাঠানো message-id বা messageId ধরছি
    const messageId = body['message-id'] || body['messageId'];

    if (!messageId) {
      return NextResponse.json({ message: 'No Message ID found' }, { status: 200 });
    }

    // ১. ফায়ারবেসে ওই originalMessageId দিয়ে ডকুমেন্ট খুঁজে বের করা
    const outreachRef = collection(db, "outreach_leads");
    const q = query(outreachRef, where("originalMessageId", "==", messageId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No lead found for Message ID: ${messageId}`);
      return NextResponse.json({ message: 'Lead not found' }, { status: 200 });
    }

    const docRef = querySnapshot.docs[0].ref;
    const event = body.event;

    // ২. ইভেন্ট অনুযায়ী ডাটাবেস আপডেট
    switch (event) {
      case 'opened':
      case 'unique_opened':
        await updateDoc(docRef, {
          open_count: increment(1),
          lastOpenedAt: serverTimestamp(),
          status: 'opened'
        });
        break;

      case 'request':
        await updateDoc(docRef, { status: 'sent' });
        break;

      case 'deferred':
        await updateDoc(docRef, { status: 'delayed' });
        break;

      case 'hard_bounce':
      case 'soft_bounce':
        await updateDoc(docRef, { status: 'bounced' });
        break;

      case 'spam':
      case 'complaint':
        await updateDoc(docRef, { status: 'spam/complaint' });
        break;

      case 'invalid_email':
        await updateDoc(docRef, { status: 'invalid' });
        break;

      default:
        console.log(`Event: ${event} ignored.`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}