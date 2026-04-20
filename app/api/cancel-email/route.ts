// api/cancel-email/route.ts
export async function POST(req: Request) {
  const { messageId } = await req.json();
  
  // ব্রেভো API কল করে শিডিউল ডিলিট করা
  const res = await fetch(`https://api.brevo.com/v3/smtp/emails/${messageId}`, {
    method: 'DELETE',
    headers: { 'api-key': process.env.BREVO_API_KEY as string }
  });
  
  if (res.ok) return Response.json({ success: true });
  return Response.json({ success: false });
}