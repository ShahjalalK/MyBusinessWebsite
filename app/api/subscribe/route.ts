import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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
        updateEnabled: true, // যদি ইউজার আগে থেকেই থাকে তবে ডাটা আপডেট হবে
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