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
  title: 'About TrackFlowPro | Global Leaders in Web Analytics & Data Tracking',
  description: 'TrackFlowPro is a premier data tracking agency founded by Shahjalal Khan. We help Shopify & SaaS brands scale with GTM Server-Side, Facebook CAPI, and GA4 precision.',
  keywords: [
    'TrackFlowPro team',
    'web analytics agency',
    'server side tracking company',
    'Shahjalal Khan founder',
    'conversion tracking agency',
    'ecommerce data experts',
    'USA UK tracking agency'
  ],
  openGraph: {
    title: 'TrackFlowPro - Precision-Driven Data Tracking Agency',
    description: 'Transforming dark data into profitable growth for global businesses. Founded by tracking expert Shahjalal Khan.',
    url: 'https://trackflowpro.com/about',
    siteName: 'TrackFlowPro',
    images: [
      {
        url: '/agency-about-banner.jpg', // এখানে এজেন্সির লোগো বা টিমের ব্যানার দিতে পারেন
        width: 1200,
        height: 630,
        alt: 'TrackFlowPro - Data Tracking Agency',
      },
    ],
    locale: 'en_US',
    type: 'website',
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