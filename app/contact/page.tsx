import { Metadata } from 'next'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import ContactHero from '../components/contactUsPage/contactHero'
import ContactForm from '../components/contactUsPage/contactForm'
import ContactDirectContactInfo from '../components/contactUsPage/contactDirect'
import ContactQuickResponsePromise from '../components/contactUsPage/contactResponse'
import WhatHappensNext from '../components/contactUsPage/contactWhatHappen'
import ContactFAQShort from '../components/contactUsPage/contactFaq'
import ContactFinalContactStep from '../components/contactUsPage/contactCta'

// SEO Meta Tags
export const metadata: Metadata = {
  // টাইটেলের শুরুতে আপনার প্রধান কিওয়ার্ড এবং আপনার নাম রাখা হয়েছে
  title: 'Contact Google Ads Expert | Hire Shahjalal for Tracking & Strategy',
  
  description: 'Ready to scale? Contact Shahjalal for a professional Google Ads audit, GTM Server-Side tracking setup, and GA4 strategy. Get expert solutions for your business today.',
  
  keywords: [
    'hire google ads expert',           // KD 5%
    'google ads audit service',        // Service focus
    'hiring google ads specialist',    // Intent focus
    'gtm server side tracking expert',
    'Shahjalal Khan contact',          // Personal branding
    'GA4 conversion API setup'
  ],
  
  openGraph: {
    title: 'Hire Shahjalal | Expert Google Ads & Tracking Solutions',
    description: 'Book a free technical audit for your Google Ads and tracking setup. Let’s fix your data loss and scale your ROAS.',
    type: 'website',
    url: 'https://www.trackflowpro.com/contact', 
    images: [
      {
        url: 'https://www.trackflowpro.com/og-contact.jpg', 
        width: 1200,
        height: 630,
        alt: 'Contact Shahjalal - Google Ads & GTM Specialist',
      },
    ],
  },
  
  // কন্টাক্ট পেজের জন্য ইনডেক্সিং এবং ক্যানোনিকাল ট্যাগ নিশ্চিত করা
  alternates: {
    canonical: 'https://www.trackflowpro.com/contact',
  },
}

type Props = {}

export default function Contact({}: Props) {
  return (
    <>
      <Navbar />
      <main>
        <ContactHero />
        <ContactForm />
        <ContactDirectContactInfo />
        <ContactQuickResponsePromise />
        <WhatHappensNext />
        <ContactFAQShort />
        <ContactFinalContactStep />
      </main>
      <Footer />
    </>
  )
}