import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import ScrollToTop from "./components/scrollToTop";
import LiveNotificationMap from "./components/HeroSection/liveTracking";
import Script from "next/script";
import ServerTrack from "./components/ServerTrack";

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
        {/* অ্যাড-ব্লকার বাইপাস করার জন্য গুগল ট্যাগ ইনিশিয়ালাইজেশন */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

        {/* ১০০% অ্যাড-ব্লকার প্রুফ মাইক্রোসফট ক্ল্যারিটি সেটআপ */}
        <Script id="clarity-setup" strategy="afterInteractive">
  {`
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;
        t.src="/clarity-script/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        
        // ক্ল্যারিটিকে আপনার ডোমেইন ব্যবহার করতে বাধ্য করা (Hardcoded)
        c[a]("set", "api", "https://www.trackflowpro.com/clarity-data/collect"); 
    })(window, document, "clarity", "script", "wd3r4mftjy");
  `}
</Script>
      </head>
      <body className="min-h-screen bg-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ServerTrack />
          <ScrollToTop />
          {children}
          <LiveNotificationMap />
        </ThemeProvider>
      </body>
    </html>
  );
}