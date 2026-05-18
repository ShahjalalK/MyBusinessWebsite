import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ServerTrack from "./components/ServerTrack";
import ThemeProvider from "./components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrackFlow Pro | Google Ads Conversion Tracking & Server-Side Tracking Specialist",
    template: "%s | TrackFlow Pro",
  },
  description:
    "Fix broken Google Ads conversion tracking, GA4/GTM events, Meta CAPI, enhanced conversions, and server-side tracking with an evidence-based tracking audit.",
  metadataBase: new URL("https://trackflowpro.com"),
  applicationName: "TrackFlow Pro",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TrackFlow Pro | Google Ads Conversion Tracking & Server-Side Tracking Specialist",
    description:
      "Evidence-based tracking audits for Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement.",
    url: "https://trackflowpro.com",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Google Ads Conversion Tracking and Server-Side Tracking Specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFlow Pro | Google Ads Conversion Tracking Specialist",
    description:
      "Fix conversion tracking issues across Google Ads, GA4, GTM, Meta CAPI, and server-side measurement.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon2.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "icon",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  verification: {
    google: "2hK1a1eaZwMvCF26pMFqTghSSo3OI6YSDYSQZ_-JuH4",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <ThemeProvider>
          <ServerTrack />
          {children}
        </ThemeProvider>

        <Script src="https://www.clarity.ms/tag/wd3r4mftjy" strategy="afterInteractive" />
      </body>
    </html>
  );
}
