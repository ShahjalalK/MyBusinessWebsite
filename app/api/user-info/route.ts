import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headerList = await headers(); 
  const userAgent = headerList.get('user-agent') || '';
  
  // ১. আইপি বের করার সবচেয়ে নির্ভরযোগ্য উপায় (Vercel-এর জন্য)
  let ip = headerList.get('x-forwarded-for')?.split(',')[0] || 
           headerList.get('x-real-ip') || 
           '';

  // ২. যদি কোনো আইপি না পায় বা লোকালহোস্ট হয়, তবেই কেবল ডিফল্ট আইপি বসবে
  const isLocal = !ip || ip === '127.0.0.1' || ip === '::1';
  if (isLocal) {
    ip = '103.178.1.1'; // টেস্ট আইপি
  }

  try {
    // ৩. এপিআই কল (আমরা ipapi.co এর বদলে ip-api.com ব্যবহার করতে পারি যা অনেক সময় বেশি স্টেবল)
    // এখানে আমরা ইউজার আইপি দিয়ে কল করছি
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,isp,org,as,query`, { 
      cache: 'no-store'
    });

    const geo = await res.json();

    if (geo.status === 'fail') {
        throw new Error('IP lookup failed');
    }

    return NextResponse.json({
      ip: geo.query || ip,
       // এই লাইনটি খুঁজে পরিবর্তন করুন
      location: geo.city && geo.country ? `${geo.city}, ${geo.country}` : "Location Verified",
      device: /mobile/i.test(userAgent) ? "Mobile Device" : "Desktop Workstation",
      browser: userAgent.includes("Chrome") ? "Google Chrome" : "Browser Detected",
      os: userAgent.includes("Windows") ? "Windows OS" : "macOS/Linux",
      isp: geo.isp || "Verified Network",
    });

  } catch (error) {
    // ৪. যদি এপিআই ফেইল করে, তবে আমরা অন্তত আইপি-টা দেখাবো
    return NextResponse.json({
      ip: ip,
      location: isLocal ? "Dhaka, Bangladesh" : "Location Detected (API Limit)",
      device: "Desktop",
      browser: "Chrome",
      os: "Windows",
      isp: "Server Connection"
    });
  }
}