"use client"
import dynamic from 'next/dynamic';

// এখানে ssr: false কাজ করবে কারণ এটি একটি Client Component
const ScrollToTop = dynamic(() => import("./components/scrollToTop"), { ssr: false });
const LiveNotificationMap = dynamic(() => import("./components/HeroSection/liveTracking"), { ssr: false });

export default function ClientWrapper() {
  return (
    <>
      <ScrollToTop />
      <LiveNotificationMap />
    </>
  );
}