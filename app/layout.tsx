import { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import Script from "next/script";
import ServerTrack from "./components/ServerTrack";
import ClientWrapper from "./ClientWrapper"; // নতুন ফাইলটি ইম্পোর্ট করুন

export const metadata: Metadata = {
  title: 'TrackFlow Pro | Advanced Tracking Solutions',
  description: 'Boost your business with Server-Side Tracking, GA4, and Google Ads expert solutions by Shahjalal.',
  icons: { icon: '/icon.png' },
  verification: {
    other: { 'facebook-domain-verification': ['8mo0hos8jalxa1f08pc0mgnws10c7u'] },
  },
}

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
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

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
          
          {/* সব ভারি কম্পোনেন্ট এখন এখান থেকে স্মুথলি লোড হবে */}
          <ClientWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}