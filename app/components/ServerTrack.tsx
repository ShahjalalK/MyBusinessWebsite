"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ServerTrack() {
  const pathname = usePathname()

  // ServerTrack.tsx আপডেট
useEffect(() => {
  // কুকি থেকে আইডি খোঁজা
  let gaClientId = document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1];
  
  // যদি অ্যাড-ব্লকারের কারণে আইডি না পাওয়া যায়, তবে একটি র‍্যান্ডম আইডি তৈরি করা
  if (!gaClientId) {
    gaClientId = 'gen.' + Math.random().toString(36).substring(2, 15);
  }

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      clientId: gaClientId, // এখন আর খালি যাবে না
      sessionId: Date.now().toString(),
      pageTitle: document.title,
      pageLocation: window.location.href
    })
  });
}, [pathname]);

  return null // এটি স্ক্রিনে কিছু দেখাবে না
}