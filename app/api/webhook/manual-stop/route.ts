import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import admin from "firebase-admin"; // এটি নিশ্চিত করুন

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // গুগল স্ক্রিপ্ট থেকে পাঠানো ইমেইলটি ধরছি
    // আপনার গুগল স্ক্রিপ্টে যদি 'email' নামে প্রপার্টি থাকে তবে এটি কাজ করবে
    const clientEmail = body.email || body.sender; 

    if (!clientEmail) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    const outreachRef = adminDb.collection("outreach_leads");
    
    // ১. ইমেইলটি ছোট হাতের অক্ষরে কনভার্ট করে সার্চ করা (নিরাপত্তার জন্য)
    const formattedEmail = clientEmail.toLowerCase().trim();
    
    // ২. ওই ইমেইল দিয়ে ডাটাবেজে লিড খুঁজে বের করা
    const snapshot = await outreachRef.where("email", "==", formattedEmail).get();

    if (!snapshot.empty) {
      const batch = adminDb.batch();

      snapshot.docs.forEach((doc) => {
        // ৩. স্ট্যাটাস 'replied' করে দেওয়া যেন ফলো-আপ ক্রন জব এটি এড়িয়ে যায়
        batch.update(doc.ref, { 
          status: 'replied',
          repliedAt: admin.firestore.FieldValue.serverTimestamp(),
          stopAutomation: true // একটি এক্সট্রা ফ্ল্যাগ রাখলাম যেন ভবিষ্যতে ফিল্টার করা সহজ হয়
        });
      });
      
      await batch.commit();
      console.log(`✅ Automation stopped for: ${formattedEmail}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Status updated to replied for ${formattedEmail}` 
      });
    } else {
      console.log(`ℹ️ Lead not found for email: ${formattedEmail}`);
      return NextResponse.json({ success: false, message: 'Lead not found' });
    }

  } catch (error: any) {
    console.error('🔥 Webhook Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}