import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headerList = headers();
  const userAgent = headerList.get('user-agent') || '';
  
  // Vercel-এ অরিজিনাল আইপি ধরার সঠিক উপায়
  let ip = headerList.get('x-forwarded-for')?.split(',')[0] || 
           headerList.get('x-real-ip') || 
           '';

  // লোকালহোস্ট টেস্ট লজিক
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    ip = '103.178.1.1'; 
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });

    const geo = await res.json();

    return NextResponse.json({
      ip: geo.ip || ip,
      location: geo.city ? `${geo.city}, ${geo.country_name}` : "Dhaka, Bangladesh",
      device: /mobile/i.test(userAgent) ? "Mobile Device" : "Desktop Workstation",
      browser: userAgent.includes("Chrome") ? "Google Chrome" : "Browser Detected",
      os: userAgent.includes("Windows") ? "Windows OS" : "macOS/Linux",
      isp: geo.org || "Verified Network",
      currency: geo.currency || "USD",
      timezone: geo.timezone || "UTC"
    });

  } catch (error) {
    return NextResponse.json({
      ip: ip,
      location: "Dhaka, Bangladesh",
      device: "Desktop",
      browser: "Chrome",
      os: "Windows",
      isp: "Enterprise Route"
    });
  }
}