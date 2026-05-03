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
export const metadata = {
  // টাইটেলে সরাসরি অ্যাকশন (Hire/Contact) এবং আপনার নাম রাখা হয়েছে
  title: 'Contact Google Ads Expert | Hire Shahjalal for Tracking & Strategy',
  description: 'Ready to scale? Contact Shahjalal for a professional Google Ads audit, GTM Server-Side tracking setup, and GA4 strategy. Get expert solutions for your business today.',
  
  keywords: [
    'hire google ads expert',           // Primary Keyword
    'google ads audit service',        
    'hiring google ads specialist',    
    'gtm server side tracking expert',
    'Shahjalal contact',               
    'GA4 conversion API setup',
    'trackflow pro contact'
  ],
  
  openGraph: {
    title: 'Hire Shahjalal | Expert Google Ads & Tracking Solutions',
    description: 'Book a free technical audit for your Google Ads and tracking setup. Let’s fix your data loss and scale your ROAS.',
    url: 'https://www.trackflowpro.com/contact', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        // আপনার ফোল্ডার পাথ অনুযায়ী আপডেট করা হয়েছে
        url: '/meta/contact-shahjalal-google-ads-tracking-expert.webp', 
        width: 1200,
        height: 630,
        alt: 'Contact Shahjalal - Google Ads & GTM Specialist at TrackFlow Pro',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Contact Shahjalal | Google Ads & Tracking Specialist',
    description: 'Let’s scale your business with precision tracking and data-driven ads.',
    images: ['/meta/contact-shahjalal-google-ads-tracking-expert.webp'],
  },
  
  alternates: {
    canonical: 'https://www.trackflowpro.com/contact',
  },

  // আপনার রিকোয়েস্ট অনুযায়ী ইনডেক্সিং অপশনগুলো যোগ করা হয়েছে
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