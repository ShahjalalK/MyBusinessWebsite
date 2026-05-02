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

export const metadata: Metadata = {
  title: 'Advanced GTM Server-Side Tracking & Facebook CAPI Setup | TrackFlowPro',
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
    title: 'Precision Data Tracking with Server-Side GTM | TrackFlowPro',
    description: 'Stop losing data to ad-blockers. Move your tracking to the server for 100% accuracy and better ROAS.',
    url: 'https://www.trackflowpro.com/server-side-tracking', // আপনার পেজ ইউআরএল দিন
    siteName: 'TrackFlowPro',
    images: [
      {
        url: '/server-side-og-image.jpg', // একটি ভালো প্রফেশনাল ইমেজ পাথ দিন
        width: 1200,
        height: 630,
        alt: 'Server Side Tracking Expert Services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bypass Ad-Blockers with GTM Server Side Tracking',
    description: 'Improve your Google Ads & Facebook CAPI match quality score with expert server-side setup.',
    images: ['/server-side-og-image.jpg'], 
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
}

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