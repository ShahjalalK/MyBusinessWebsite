import { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import dynamic from 'next/dynamic'; // Dynamic import এর জন্য
import Script from "next/script";
import ServerTrack from "./components/ServerTrack";

// স্লাইডারের মতো এগুলোকেও অলসভাবে (Lazy) লোড করাচ্ছি যাতে শুরুতে স্পিড না কমে
const ScrollToTop = dynamic(() => import("./components/scrollToTop"), { ssr: false });
const LiveNotificationMap = dynamic(() => import("./components/HeroSection/liveTracking"), { ssr: false });

export const metadata: Metadata = {
  title: 'TrackFlow Pro | Advanced Tracking Solutions', // SEO এর জন্য টাইটেল উন্নত করা হয়েছে
  description: 'Boost your business with Server-Side Tracking, GA4, and Google Ads expert solutions by Shahjalal.',
  keywords: ['Google Ads', 'GA4', 'Server Side Tracking', 'GTM Expert'],
  icons: { icon: '/icon.png' },
  verification: {
    other: { 'facebook-domain-verification': ['8mo0hos8jalxa1f08pc0mgnws10c7u'] },
  },
}

// ফন্ট অপ্টিমাইজেশন: display: 'swap' যোগ করা হয়েছে যাতে টেক্সট সাথে সাথে দেখা যায়
const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: 'swap', 
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
        {/* DNS Prefetch: কানেকশন দ্রুত করার জন্য */}
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Google Tag Initializer: lazyOnload ব্যবহার করা হয়েছে */}
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

        {/* Microsoft Clarity: এটি এখন অলসভাবে লোড হবে, তাই স্পিড কমবে না */}
        <Script id="clarity-setup" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wd3r4mftjy");
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-white transition-colors duration-500">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ServerTrack />
          {children}
          
          {/* নিচের কম্পোনেন্টগুলো এখন মেইন থ্রেড ব্লক করবে না */}
          <ScrollToTop />
          <LiveNotificationMap />
        </ThemeProvider>
      </body>
    </html>
  );
}