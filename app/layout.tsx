import { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/HeroSection/ThemeProvider";
import ScrollToTop from "./components/scrollToTop";
import LiveNotificationMap from "./components/HeroSection/liveTracking";
import Script from "next/script";
import ServerTrack from "./components/ServerTrack";

export const metadata: Metadata = {
  title: 'TrackFlow Pro',
  description: 'Advanced Tracking Solutions',
  other: {
    rel: 'preconnect',
    url: [
      'https://trackflowprow.firebaseapp.com',
      'https://www.googleapis.com'
    ],
  },
  icons: {
    icon: '/icon.png',
  },
  verification: {
    other: {
      'facebook-domain-verification': ['8mo0hos8jalxa1f08pc0mgnws10c7u'],
    },
    
  },
}


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        
        {/* Google Tag Initializer */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

        {/* Standard Microsoft Clarity Setup */}
        <Script id="clarity-setup" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
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