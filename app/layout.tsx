import { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import Script from "next/script";
import ServerTrack from "./components/ServerTrack";
import ScrollToTop from "./components/scrollToTop";
import LiveNotificationMap from "./components/HeroSection/liveTracking";

export const metadata: Metadata = {
  title: 'TrackFlow Pro | Advanced Tracking Solutions',
  description: 'Expert Google Ads and Server-Side Tracking Solutions.',
icons: {
    icon: [
      { url: '/favicon-16x16.webp', sizes: '16x16', type: 'image/webp' },
      { url: '/favicon-32x32.webp', sizes: '32x32', type: 'image/webp' },
      { url: '/favicon.ico', sizes: 'any' }, // ব্রাউজার ব্যাকআপের জন্য
    ],
    apple: [
      { url: '/apple-touch-icon.webp', sizes: '180x180', type: 'image/webp' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
  },
}

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: 'swap', // এটি অবশ্যই রাখবেন
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* ট্র্যাকিং স্ক্রিপ্টগুলো head এর একদম শেষে রাখুন এবং strategy="afterInteractive" দিন */}
        <Script 
          src="https://www.clarity.ms/tag/wd3r4mftjy"
          strategy="afterInteractive" 
        />
      </head>
      <body className="min-h-screen bg-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ServerTrack />
          {children}
          <ScrollToTop />
          <LiveNotificationMap />
        </ThemeProvider>
      </body>
    </html>
  );
}