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
  // আপনার রিসার্চ ফাইল অনুযায়ী 'hire google ads expert' কিওয়ার্ডটিকে বেশি গুরুত্ব দেওয়া হয়েছে
  title: 'Hire Google Ads Expert | Facebook CAPI & GTM Server-Side Specialist',
  
  description: 'Scale your ROAS by bypassing iOS 14+ restrictions. Hire a Google Ads expert for professional Facebook CAPI setup, GTM server-side tracking, and deep account audits.',
  
  keywords: [
    'hire google ads expert',      // KD 5% (Primary Keyword)
    'facebook capi expert',        // Service focus
    'gtm server side tracking',    // Technical expertise
    'google ads account audit',    // Offer focus
    'ga4 server side tracking',    // Platform focus
    'conversion api setup',        // Specific task
    'hiring google ads specialist' // Intent-based variation
  ],
  
  openGraph: {
    title: 'TrackFlow Pro | Expert Facebook CAPI & GTM Server-Side Setup',
    description: 'Stop losing data. Recover tracking accuracy and scale your campaigns with our proven server-side framework.',
    url: 'https://trackflowpro.com', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        url: '/og-image.png', // আপনার একটি প্রফেশনাল ড্যাশবোর্ড বা কাজের ছবির লিঙ্ক দিন
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro - Digital Tracking Excellence',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // সার্চ ইঞ্জিনের জন্য অতিরিক্ত নিরাপত্তা
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