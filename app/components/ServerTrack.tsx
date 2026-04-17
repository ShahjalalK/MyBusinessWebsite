"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ServerTrack() {
  const pathname = usePathname()

  useEffect(() => {
    // ১. কুকি থেকে আইডিগুলো খুঁজে বের করা
    const gaClientId = typeof document !== 'undefined' 
      ? document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1] 
      : null;
    
    const gaSessionId = typeof document !== 'undefined'
      ? document.cookie.match(/_ga_Y0XEPCVC6L=GS1\.1\.([\d]+)/)?.[1]
      : null;

    // ২. সার্ভার রুটে ডাটা পাঠানো
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        clientId: gaClientId || 'anonymous',
        sessionId: gaSessionId || Date.now().toString(),
        pageTitle: document.title,
        pageLocation: window.location.href
      })
    }).catch(err => console.error("Tracking Error:", err));

  }, [pathname]) // প্রতিবার ইউআরএল চেঞ্জ হলে এটি কল হবে

  return null // এটি স্ক্রিনে কিছু দেখাবে না
}