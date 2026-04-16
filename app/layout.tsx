import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import ScrollToTop from "./components/scrollToTop";
import LiveNotificationMap from "./components/HeroSection/liveTracking";
import Script from "next/script"; // এটি ইমপোর্ট করুন

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrackFlow Pro - Digital Marketing Agency",
  description: "Expert in GA4 Server-Side Tracking & Google Ads",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Google Tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA4_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    // ডাইনামিক পেজ ভিউ ট্র্যাকিংয়ের জন্য config আপডেট
    gtag('config', '${process.env.GA4_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
      send_page_view: true, // এটি নিশ্চিত করে যে পেজ লোড হলে ভিউ কাউন্ট হবে
      debug_mode: true
    });
  `}
</Script>
      </head>
      <body className="min-h-screen bg-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ScrollToTop />
          {children}
          <LiveNotificationMap />
        </ThemeProvider>
      </body>
    </html>
  );
}