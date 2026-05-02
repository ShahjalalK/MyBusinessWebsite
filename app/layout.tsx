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
  icons: { icon: '/icon.png' },
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