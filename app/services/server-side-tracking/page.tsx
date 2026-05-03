import React from 'react'
import Navbar from '../../components/navbar'
import ServerHeroSection from '../../components/ServerSideTrackingPage/serverHeroSection'
import CTASection from '../../components/ctaSection'
import Footer from '../../components/footer'
import ServerProblemSection from '../../components/ServerSideTrackingPage/serverProblem'
import ServerSolutionSection from '../../components/ServerSideTrackingPage/serverSolution'
import ServerSimpleExplanation from '../../components/ServerSideTrackingPage/serverSimpleExplane'
import ServerBenefitsSection from '../../components/ServerSideTrackingPage/serverBenifite'
import ServicesBreakdown from '../../components/ServerSideTrackingPage/serverServiceBrockDown'
import ServerUniqueAdvantage from '../../components/ServerSideTrackingPage/serverUnique'
import ServerProcessSection from '../../components/ServerSideTrackingPage/serverOurProcess'
import ServerResultsSection from '../../components/ServerSideTrackingPage/serverResult'
import ServerFAQSection from '../../components/ServerSideTrackingPage/serverFaq'


import { Metadata } from 'next'
import TestimonialSection from '../../components/HeroSection/testimonial'

export const metadata = {
  // টাইটেলে 'Advanced' এবং 'Setup' শব্দগুলো রাখা হয়েছে যা সার্চ ভলিউম বাড়াতে সাহায্য করে
  title: 'Advanced GTM Server-Side Tracking & Facebook CAPI Setup | TrackFlow Pro',
  description: 'Recover 40% of lost data caused by iOS 14+ and ad-blockers. Specialized in GTM Server-Side Tracking, GA4, and Facebook Conversion API for Shopify and SaaS.',
  
  keywords: [
    'gtm server side tracking', 
    'ga4 server side tracking', 
    'facebook capi setup', 
    'meta conversions api', 
    'server side tagging gtm', 
    'google ads account audit',
    'conversion rate optimization'
  ],

  openGraph: {
    title: 'Precision Data Tracking with Server-Side GTM | TrackFlow Pro',
    description: 'Stop losing data to ad-blockers. Move your tracking to the server for 100% accuracy and better ROAS.',
    url: 'https://www.trackflowpro.com/server-side-tracking', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        // আপনার ফোল্ডার পাথ অনুযায়ী আপডেট করা হয়েছে
        url: 'https://www.trackflowpro.com/meta/gtm-server-side-tracking-and-facebook-capi-setup.webp', 
        width: 1200,
        height: 630,
        alt: 'Server-Side Tracking and Facebook CAPI Expert Solutions - TrackFlow Pro',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Bypass Ad-Blockers with GTM Server Side Tracking',
    description: 'Improve your Google Ads & Facebook CAPI match quality score with expert server-side setup.',
    images: ['/meta/gtm-server-side-tracking-and-facebook-capi-setup.webp'], 
  },

  alternates: {
    canonical: 'https://www.trackflowpro.com/server-side-tracking',
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

type Props = {}

export default function ServerSideTracking({}: Props) {
  return (
    <>

    <Navbar />

    <ServerHeroSection />

    <ServerProblemSection />
    <ServerSolutionSection />

    <ServerSimpleExplanation />
    <ServerBenefitsSection />

    {/* <ServerLiveTrackingSection /> */}
    
    <ServicesBreakdown />

    <ServerUniqueAdvantage />
    <ServerProcessSection />

    

    {/* <ServerResultsSection /> */}

    <ServerFAQSection />

    <TestimonialSection />
   
    <CTASection />

    <Footer />
    
    </>
  )
}