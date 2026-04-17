import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
  sender: { name: "Shahjalal Khan", email: "shahjalal@trackflowpro.com" },
  to: [{ email: email }],
  subject: subject,
  htmlContent: `<html><body>${message}</body></html>`,
  // নিচের লাইনটি যোগ করুন
  headers: { "List-Unsubscribe": "" } 
}),
    });

    const data = await response.json();

    if (response.ok) {
      // Brevo থেকে পাওয়া Message-ID ই আমাদের ট্র্যাক করার মূল চাবিকাঠি
      return NextResponse.json({ 
        success: true, 
        messageId: data.messageId 
      });
    } else {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}