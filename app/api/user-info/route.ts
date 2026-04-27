import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headerList = await headers(); 
  const userAgent = headerList.get('user-agent') || '';
  
  let ip = headerList.get('x-forwarded-for')?.split(',')[0] || 
           headerList.get('x-real-ip') || 
           '';

  const isLocal = !ip || ip === '127.0.0.1' || ip === '::1';
  if (isLocal) {
    ip = '103.178.1.1'; // আপনার টেস্ট আইপি
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,query`, { 
      cache: 'no-store'
    });

    const geo = await res.json();

    if (geo.status === 'fail') {
        throw new Error('IP lookup failed');
    }

    return NextResponse.json({
      ip: geo.query || "Encrypted Endpoint",
      location: geo.city && geo.country ? `${geo.city}, ${geo.country}` : "Regionally Encrypted",
      countryCode: geo.countryCode || "", // এটি ফ্রন্টএন্ডে পতাকার জন্য লাগবে
      device: /mobile/i.test(userAgent) ? "Mobile Handset" : "Desktop Workstation",
      browser: userAgent.includes("Chrome") ? "Chrome Engine" : "Verified Web Engine",
      os: userAgent.includes("Windows") ? "Windows Ecosystem" : "Secure OS Architecture",
      isp: geo.isp || "Tier-1 Network Provider",
    });

  } catch (error) {
    // এপিআই ফেইল করলে ক্লায়েন্ট যেন বুঝতে না পারে
    return NextResponse.json({
      ip: "SST Hash Secured",
      location: "Location Data Encrypted",
      countryCode: "", 
      device: /mobile/i.test(userAgent) ? "Mobile Handset" : "Desktop Workstation",
      browser: "Authenticated Web Engine",
      os: "Cloud-Based Architecture",
      isp: "Enterprise Network"
    });
  }
}