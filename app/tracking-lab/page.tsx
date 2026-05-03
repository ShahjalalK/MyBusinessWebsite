import { Metadata } from 'next'
import TrackingLabClient from '../components/tracking-lab/tracking-section'
import Navbar from '../components/navbar'
import Footer from '../components/footer'


export const metadata = {
  // টাইটেলে রিসার্চ করা মেইন কিওয়ার্ড এবং টুলের নাম ব্যালেন্স করা হয়েছে
  title: 'Precision Intelligence | Server-Side Tracking Lab | TrackFlow Pro',
  description: 'Experience 100% data accuracy. Verify your tracking integrity with our GA4 and GTM Server-Side diagnostic report. Expert solutions for high-ROI campaigns.',
  
  keywords: [
    'ga4 server side tracking',         //
    'google ads audit service',         //
    'facebook capi expert',             //
    'gtm specialist',                   //
    'tracking diagnostic report',
    'itp restriction bypass',
    'server side tracking lab'
  ],

  openGraph: {
    title: 'Precision Intelligence | Live Tracking Engine v2.0 | TrackFlow Pro',
    description: 'Bypass ITP restrictions and recover lost conversion signals. Test your server-side tracking accuracy live.',
    url: 'https://trackflowpro.com/tracking-lab', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        url: '/meta/precision-intelligence-server-side-tracking-diagnostic-lab.webp', 
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro - Server-Side Tracking Lab and Diagnostic Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Precision Intelligence | Live Tracking Engine v2.0',
    description: 'Verify your tracking integrity and recover lost data with our diagnostic lab.',
    images: ['/meta/precision-intelligence-server-side-tracking-diagnostic-lab.webp'], 
  },

  alternates: {
    canonical: 'https://trackflowpro.com/tracking-lab',
  },

  // ইনডেক্সিং এবং সার্চ রেজাল্ট প্রিভিউ নিশ্চিত করা
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

export default function Page() {
  return (
    <>
    <Navbar />
    <TrackingLabClient />

    <Footer />
    
    </>
  )
  

}