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
  title: 'Contact Google Ads Expert & GTM Specialist | Hire Shahjalal Khan',
  description: 'Looking to hire a Google Ads expert or GTM specialist? Contact Shahjalal Khan for a free technical audit on GA4, Server-Side Tracking, and Google Ads strategy.',
  keywords: [
    'hire google ads expert',
    'google ads audit service',
    'gtm server side tracking specialist',
    'GA4 conversion API setup',
    'hiring google ads specialist',
    'Shahjalal Khan contact'
  ],
  openGraph: {
    title: 'Hire a Google Ads & Tracking Expert | Shahjalal Khan',
    description: 'Get a complimentary audit for your tracking setup and Google Ads strategy. Expert solutions for GA4, GTM, and CAPI.',
    type: 'website',
    url: 'https://www.trackflowpro.com/contact', // আপনার অরিজিনাল ইউআরএল দিন
    images: [
      {
        url: 'https://yourdomain.com/og-contact.jpg', // একটি সুন্দর ইমেজ লিংক দিন
        width: 1200,
        height: 630,
        alt: 'Contact Shahjalal Khan - Google Ads Specialist',
      },
    ],
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