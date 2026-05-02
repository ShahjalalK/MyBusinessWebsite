import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import GoogleAdsHero from '../../components/GoolgeAdsServicePage/googleAdsHeroSection'
import GoogleAdsProblemSection from '../../components/GoolgeAdsServicePage/googleAdsProblemSection'
import GoogleAdsSolutionSection from '../../components/GoolgeAdsServicePage/googleAdsSolutionSection'
import GoogleAdsBenefitsSection from '../../components/GoolgeAdsServicePage/GoogleAdsBenifeteSection'
import GoogleAdsServicesBreakdown from '../../components/GoolgeAdsServicePage/googleAdsServiceBrokeDown'
import GoogleAdsUniqueAdvantage from '../../components/GoolgeAdsServicePage/GoogleAdsUniqeAdvantage'

import OurProcess from '../../components/AboutUsSection/ourProcess'

import CTASection from '../../components/ctaSection'
import GoogleAdsFAQSection from '../../components/GoolgeAdsServicePage/googleAdsFaqSection'


import { Metadata } from 'next'
import TestimonialSection from '../../components/HeroSection/testimonial'

export const metadata: Metadata = {
  // 'Certified' এর বদলে 'Hire' এবং 'Expert' ব্যবহার করা হয়েছে যা আপনার রিসার্চ ফাইলের সাথে মিলে যায়
  title: 'Hire Google Ads Expert | Account Audit & High-ROI Management | TrackFlowPro',
  description: 'Maximize your revenue with data-driven Google Ads campaigns. We provide expert account audits and management to scale sales and lower your CPA effectively.',
  keywords: [
    'hire google ads expert', // KD 5%
    'hiring google ads specialist', // Transactional Intent
    'google ads account audit',
    'ecommerce google ads specialist',
    'google ads management services',
    'google ads audit checklist',
    'pcc management services'
  ],
  openGraph: {
    title: 'Data-Driven Google Ads Management | Scale Your Sales & ROAS',
    description: 'Stop wasting budget on clicks that don’t convert. Our experts optimize your Google Ads for maximum profit and 100% tracking accuracy.',
    url: 'https://trackflowpro.com/services/google-ads', 
    siteName: 'TrackFlowPro',
    images: [
      {
        url: '/google-ads-og-banner.jpg', 
        width: 1200,
        height: 630,
        alt: 'Google Ads Management and Performance Audit - TrackFlowPro',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire Google Ads Expert | Boost Your ROI & Sales Today',
    description: 'Get a professional Google Ads audit and fix budget leaks. Expert management for high-growth businesses.',
    images: ['/google-ads-og-banner.jpg'], 
  },
}

type Props = {}

export default function GoogleAdsExpert({}: Props) {
  return (
    <>
    <Navbar />
        <GoogleAdsHero />

        <GoogleAdsProblemSection />

        <GoogleAdsSolutionSection />

        <GoogleAdsBenefitsSection />

        <GoogleAdsServicesBreakdown />

        <GoogleAdsUniqueAdvantage />

        

        <OurProcess />

        {/* <ResultsProof /> */}
        

        <GoogleAdsFAQSection />
        <TestimonialSection />

        <CTASection />

    <Footer />
    
    </>
  )
}