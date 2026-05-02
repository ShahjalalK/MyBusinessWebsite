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

export const metadata: Metadata = {
  // টাইটেলে 'Global Leaders' এর সাথে আপনার মেইন কিওয়ার্ড ব্যালেন্স করা হয়েছে
  title: 'About TrackFlowPro | Experts in Web Analytics & High-ROI Data Tracking',
  
  description: 'TrackFlowPro is a premier data tracking agency founded by Shahjalal. We empower Shopify & SaaS brands to scale using GTM Server-Side, Facebook CAPI, and GA4 precision for maximum ROI.',
  
  keywords: [
    'TrackFlowPro agency',
    'hire google ads expert',           // KD 5% - আপনার রিসার্চ ফাইলের মেইন কিওয়ার্ড
    'web analytics company',
    'server side tracking experts',
    'Shahjalal web analyst',
    'conversion tracking solutions',
    'ecommerce data optimization'
  ],
  
  openGraph: {
    title: 'TrackFlowPro | Precision-Driven Data Tracking & Analytics Agency',
    description: 'Bypass data loss and drive profitable growth. Founded by tracking specialist Shahjalal, we provide global businesses with 100% data accuracy.',
    url: 'https://trackflowpro.com/about',
    siteName: 'TrackFlowPro',
    images: [
      {
        url: '/agency-about-banner.jpg', 
        width: 1200,
        height: 630,
        alt: 'TrackFlowPro - Expert Data Tracking Agency',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // ক্যানোনিকাল লিঙ্ক
  alternates: {
    canonical: 'https://trackflowpro.com/about',
  },
}

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