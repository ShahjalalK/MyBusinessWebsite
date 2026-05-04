"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ServerTrack() {
  const pathname = usePathname()

  useEffect(() => {
    // ১. কুকি থেকে আসল GA আইডি খোঁজা (এটি ইউজারকে চিনতে সাহায্য করবে)
    let gaClientId = document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1];
    
    if (!gaClientId) {
      gaClientId = Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000);
    }

    // ২. সেশন আইডি sessionStorage-এ রাখা (যাতে ব্রাউজার ট্যাব খোলা পর্যন্ত আইডি একই থাকে)
    let gaSessionId = sessionStorage.getItem('ga_session_id');
    if (!gaSessionId) {
      gaSessionId = Date.now().toString();
      sessionStorage.setItem('ga_session_id', gaSessionId);
    }

    // ৩. সার্ভার-সাইড API-তে ডেটা পাঠানো (Adblocker এটি সহজে ধরতে পারবে না)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        clientId: gaClientId,
        sessionId: gaSessionId,
        pageTitle: document.title,
        pageLocation: window.location.href,
        // প্রোডাকশনে যাওয়ার সময় testEventCode অবশ্যই রিমুভ করবেন
      })
    });
  }, [pathname]);

  return null
}