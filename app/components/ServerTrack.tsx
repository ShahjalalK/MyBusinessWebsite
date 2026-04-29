"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ServerTrack() {
  const pathname = usePathname()

  useEffect(() => {
    // ১. কুকি থেকে আইডি খোঁজা
    let gaClientId = document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1];
    
    if (!gaClientId) {
      gaClientId = 'gen.' + Math.random().toString(36).substring(2, 15);
    }

    // ২. এপিআই রিকোয়েস্ট
    fetch('/api/track', { // নিশ্চিত হয়ে নিন আপনার এপিআই রুট ফাইলের নাম 'track' কি না
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        clientId: gaClientId,
        sessionId: Date.now().toString(),
        pageTitle: document.title,
        pageLocation: window.location.href,
        // ৩. টেস্ট করার সময় নিচের লাইনটি আনকমেন্ট করুন
        testEventCode: "TEST85792" // ফেসবুক থেকে পাওয়া কোডটি এখানে দিন
        
      })
    });
  }, [pathname]);

  return null
}