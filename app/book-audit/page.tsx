import { Metadata } from 'next';
import BookingContent from './bookingContent';

export const metadata = {
  // টাইটেল এবং ডেসক্রিপশন আপনার রিসার্চ করা হাই-কনভার্টিং কিওয়ার্ড অনুযায়ী সেট করা হয়েছে
  title: 'Free Google Ads Audit & Tracking Strategy Session | TrackFlow Pro',
  description: 'Stop losing conversion data! Book a free 15-minute audit to fix iOS 14+ tracking gaps. Get expert insights on GTM Server-Side, GA4, and Meta CAPI to scale your ROAS.',
  
  keywords: [
    'google ads audit service',        //
    'hire google ads expert',          //
    'free tracking audit',
    'gtm server side audit',
    'facebook capi validation',
    'conversion tracking consultation',
    'scale google ads ROAS'
  ],

  openGraph: {
    title: 'Stop Data Loss: Book Your Free Google Ads & Tracking Audit',
    description: 'Reclaim 100% of your data. A deep-dive session into your GTM, GA4, and Server-Side tracking infrastructure. No sales pitch, just pure strategy.',
    url: 'https://www.trackflowpro.com/book-audit', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        url: 'https://trackflowpro.com/meta/free-google-ads-audit-and-tracking-strategy-session.webp', 
        width: 1200,
        height: 630,
        alt: 'Free Google Ads and Tracking Strategy Audit Session - TrackFlow Pro',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Free 15-Min Google Ads & Tracking Audit',
    description: 'Fix your tracking gaps and scale your ROAS. Book your session with TrackFlow Pro today.',
    images: ['/meta/free-google-ads-audit-and-tracking-strategy-session.webp'], 
  },

  alternates: {
    canonical: 'https://www.trackflowpro.com/book-audit',
  },

  // ইনডেক্সিং এবং সার্চ প্রিভিউ অপশন
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function BookingPage() {
  return <BookingContent />;
}