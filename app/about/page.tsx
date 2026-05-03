import React from 'react'
import { motion } from 'framer-motion' // ইমপোর্ট করুন
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import AboutHero from '../components/AboutUsSection/aboutHero'
import WhatWeDo from '../components/AboutUsSection/whatWeDo'
import OurExpertis from '../components/AboutUsSection/ourExpertis'
import OurProcess from '../components/AboutUsSection/ourProcess'
import WhyChooseUs from '../components/AboutUsSection/whyChoseUs'
import OurResults from '../components/AboutUsSection/ourResult'
import AgencyTeamSection from '../components/agencyTeamSection'
import AboutCTA from '../components/AboutUsSection/aboutCta'

import { Metadata } from 'next'

export const metadata = {
  // টাইটেল এবং ডেসক্রিপশন আপনার মেইন কিওয়ার্ড 'hire google ads expert' এবং ব্র্যান্ডের মিশন অনুযায়ী সাজানো হয়েছে
  title: 'About TrackFlow Pro | Experts in Web Analytics & High-ROI Data Tracking',
  description: 'TrackFlow Pro is a premier data tracking agency. We empower Shopify & SaaS brands to scale using GTM Server-Side, Facebook CAPI, and GA4 precision for maximum ROI.',
  
  keywords: [
    'TrackFlow Pro agency',
    'hire google ads expert',           // Primary Keyword (KD 5%)
    'web analytics company',
    'server side tracking experts',
    'Shahjalal web analyst',            // Personal Branding
    'conversion tracking solutions',
    'ecommerce data optimization'
  ],

  openGraph: {
    title: 'TrackFlow Pro | Precision-Driven Data Tracking & Analytics Agency',
    description: 'Bypass data loss and drive profitable growth. Founded by tracking specialist Shahjalal, we provide global businesses with 100% data accuracy.',
    url: 'https://trackflowpro.com/about',
    siteName: 'TrackFlow Pro',
    images: [
      {
        // আপনার ফোল্ডার পাথ অনুযায়ী আপডেট করা হয়েছে
        url: 'https://www.trackflowpro.com/meta/about-trackflowpro-web-analytics-and-tracking-experts.webp', 
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro Agency - Expert Web Analytics and Tracking Team',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'About TrackFlow Pro | Empowering Brands with Data Accuracy',
    description: 'Learn how TrackFlow Pro helps businesses scale using advanced server-side tracking solutions.',
    images: ['/meta/about-trackflowpro-web-analytics-and-tracking-experts.webp'],
  },

  alternates: {
    canonical: 'https://trackflowpro.com/about',
  },

  // ইনডেক্সিং এবং সার্চ রেজাল্ট অপ্টিমাইজেশন
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

export default function About() {
  return (
    <>
      <Navbar />
        <AboutHero />
        <WhatWeDo />
        <OurExpertis />
       <AgencyTeamSection />
        <OurResults />
        <OurProcess />
        <WhyChooseUs />
        <AboutCTA />
      <Footer />
    </>
  )
}