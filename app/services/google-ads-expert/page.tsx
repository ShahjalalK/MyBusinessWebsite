import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import GoogleAdsHero from '../../components/GoolgeAdsServicePage/googleAdsHeroSection'
import GoogleAdsProblemSection from '../../components/GoolgeAdsServicePage/googleAdsProblemSection'
import GoogleAdsSolutionSection from '../../components/GoolgeAdsServicePage/googleAdsSolutionSection'
import GoogleAdsBenefitsSection from '../../components/GoolgeAdsServicePage/GoogleAdsBenifeteSection'
import GoogleAdsServicesBreakdown from '../../components/GoolgeAdsServicePage/googleAdsServiceBrokeDown'
import GoogleAdsUniqueAdvantage from '../../components/GoolgeAdsServicePage/GoogleAdsUniqeAdvantage'
import ResultsProof from '../../components/HeroSection/results'
import OurProcess from '../../components/AboutUsSection/ourProcess'
import TestimonialSwiper from '../../components/HeroSection/testimonial'
import CTASection from '../../components/ctaSection'
import GoogleAdsFAQSection from '../../components/GoolgeAdsServicePage/googleAdsFaqSection'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Certified Google Ads Specialist | Account Audit & Management | TrackFlowPro',
  description: 'Scale your revenue with high-ROI Google Ads campaigns. We offer expert account audits, management, and tracking to help you get more sales and lower CPA.',
  keywords: [
    'hire google ads expert',
    'google ads account audit',
    'hiring google ads specialist',
    'google ads management agency',
    'ecommerce google ads specialist',
    'google ads audit checklist',
    'pcc management services'
  ],
  openGraph: {
    title: 'Data-Driven Google Ads Management | Get More Sales & High ROAS',
    description: 'Stop wasting budget on clicks that don’t convert. Our certified experts optimize your Google Ads for maximum profit.',
    url: 'https://trackflowpro.com/services/google-ads', // আপনার আসল URL দিন
    siteName: 'TrackFlowPro',
    images: [
      {
        url: '/google-ads-og-banner.jpg', // একটি প্রফেশনাল ব্যানার পাথ দিন
        width: 1200,
        height: 630,
        alt: 'Google Ads Management and Performance Audit',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certified Google Ads Expert | Boost Your ROI Today',
    description: 'Get a professional Google Ads audit and see why 90% of accounts are wasting budget.',
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

        <TestimonialSwiper />

        <GoogleAdsFAQSection />

        <CTASection />

    <Footer />
    
    </>
  )
}