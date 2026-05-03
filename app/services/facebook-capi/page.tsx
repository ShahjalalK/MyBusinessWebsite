import React from 'react'
import CapiHero from '../../components/FacebookCapiPage/capiHero'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import CapiProblemSection from '../../components/FacebookCapiPage/capiProblem'
import CapiSolutionSection from '../../components/FacebookCapiPage/capiSolution'
import CapiWhatIsCAPI from '../../components/FacebookCapiPage/capiWhatisCapi'
import CapiBenefitsSection from '../../components/FacebookCapiPage/capiBenefite'
import CapiServicesBreakdown from '../../components/FacebookCapiPage/capiServiceBrokeDown'
import CapiUniqueAdvantage from '../../components/FacebookCapiPage/capiAdvantage'
import CapiProcessSection from '../../components/FacebookCapiPage/capiProcess'
import CapiProofSection from '../../components/FacebookCapiPage/capiProf'
import CapiFAQSection from '../../components/FacebookCapiPage/capiFaq'
import CapiFinalCTA from '../../components/FacebookCapiPage/capiCta'
import CapiWinningStrategy from '../../components/FacebookCapiPage/fapiWarning'
import TestimonialSection from '@/app/components/HeroSection/testimonial'


export const metadata = {
  // টাইটেল এবং ডেসক্রিপশন আপনার কিওয়ার্ড রিসার্চ অনুযায়ী অপ্টিমাইজড
  title: 'Hire Google Ads Expert | Facebook CAPI & GTM Server-Side Specialist',
  description: 'Scale your ROAS by bypassing iOS 14+ restrictions. Hire a Google Ads expert for professional Facebook CAPI setup, GTM server-side tracking, and deep account audits.',
  
  keywords: [
    'hire google ads expert',      // KD 5% (Primary Keyword)
    'facebook capi expert',        
    'gtm server side tracking',    
    'google ads account audit',    
    'ga4 server side tracking',    
    'conversion api setup',        
    'hiring google ads specialist' 
  ],
  
  openGraph: {
    title: 'TrackFlow Pro | Expert Facebook CAPI & GTM Server-Side Setup',
    description: 'Stop losing data. Recover tracking accuracy and scale your campaigns with our proven server-side framework.',
    url: 'https://trackflowpro.com', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        // ইমেজ পাথ আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী সেট করা হয়েছে
        url: 'https://www.trackflowpro.com/meta/google-ads-and-server-side-tracking-expert.webp', 
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro - Google Ads & Advanced Tracking Solutions Showcase',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'TrackFlow Pro | Expert Google Ads & Tracking Specialist',
    description: 'Bypass iOS tracking restrictions with advanced Server-Side CAPI setup.',
    images: ['/meta/google-ads-and-server-side-tracking-expert.webp'],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

type Props = {}

export default function FacebookCapi({}: Props) {
  return (
    <>
    <Navbar />
    <CapiHero />
    <CapiProblemSection />
    <CapiSolutionSection />
    <CapiWhatIsCAPI />
    <CapiWinningStrategy />
    <CapiBenefitsSection />
    <CapiServicesBreakdown />
    <CapiUniqueAdvantage />
    <CapiProcessSection />
    <CapiProofSection />
    <CapiFAQSection />
    <TestimonialSection />
    <CapiFinalCTA />
    
    <Footer />
    </>
  )
}