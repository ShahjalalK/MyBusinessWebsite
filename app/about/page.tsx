"use client" // Framer motion ব্যবহারের জন্য এটি জরুরি
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