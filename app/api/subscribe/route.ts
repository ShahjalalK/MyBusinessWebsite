import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, captchaToken } = await request.json(); // ফ্রন্টএন্ড থেকে পাঠানো টোকেন ধরলাম

    // ১. ইমেইল এবং টোকেন আছে কি না চেক
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!captchaToken) {
      return NextResponse.json({ error: "Security check is missing" }, { status: 400 });
    }

    // ২. ক্লাউডফ্লেয়ার টার্নস্টাইল ভেরিফিকেশন
    const secretKey = process.env.TURNSTILE_SECRET_KEY; // আপনার .env ফাইল থেকে আসবে
    
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: captchaToken,
      }),
    });

    const verificationData = await verifyResponse.json();

    // যদি ভেরিফিকেশন ফেইল করে
    if (!verificationData.success) {
      return NextResponse.json({ error: "Security check failed. Are you a bot?" }, { status: 403 });
    }

    // ৩. ভেরিফিকেশন সফল হলে Brevo-তে ডাটা পাঠানো
    const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        email: email,
        listIds: [19],
        updateEnabled: true,
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      const errorData = await response.json();
      console.error("Brevo Error:", errorData);
      return NextResponse.json({ error: "Subscription failed" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}