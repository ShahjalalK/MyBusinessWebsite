import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import EmailSignatureHero from '../../components/EmailSignatureServicePage/emailSignatureHero'
import EmailSignaturePortfolioSection from '../../components/EmailSignatureServicePage/emailSignaturePortfolio'
import EmailSignatureProblemSection from '../../components/EmailSignatureServicePage/emailSignatureProblemSection'
import EmailSignatureSolution from '../../components/EmailSignatureServicePage/emailSignatureSolution'
import EmailSignatureBenefitSection from '../../components/EmailSignatureServicePage/emailSignatureBenefite'
import EmailSignatureServicesBreakdown from '../../components/EmailSignatureServicePage/emailSignatureServiceBrokeDown'
import EmailSignatureWhoItsFor from '../../components/EmailSignatureServicePage/emailSignatureWhoItFor'
import EmailSignatureProofExperience from '../../components/EmailSignatureServicePage/EmailSignatureExpreance'
import EmailSignatureProcessSection from '../../components/EmailSignatureServicePage/emailSignatureProcess'
import EmailSignatureFAQSection from '../../components/EmailSignatureServicePage/emailSignatureFaq'
import EmailSignatureUniqueAdvantage from '../../components/EmailSignatureServicePage/EmailSignatureUnique'


import EmailSignatureInteractiveGmailPreview from '../../components/EmailSignatureServicePage/EmailSignatureGenerator'
import EmailSignatureFinalCTA from '../../components/EmailSignatureServicePage/emailSignatureCTA'
import VideoGuideSection from '@/app/components/EmailSignatureServicePage/emailSignatureVideo'

import { Metadata } from 'next'
import TestimonialSection from '@/app/components/HeroSection/testimonial'
import EmailSignaturePricingSection from '@/app/components/EmailSignatureServicePage/emailSignaturePricing'

// SEO Meta Data
export const metadata = {
  title: 'Custom Clickable HTML Email Signatures | Responsive Design | TrackFlow Pro',
  description: 'Professional, hand-coded, and clickable HTML email signatures. 100% mobile-responsive and compatible with Gmail, Outlook, and Apple Mail. Enhance your branding today.',
  keywords: [
    'clickable HTML email signature',
    'professional email signature design',
    'responsive email signature',
    'Outlook email signature expert',
    'Gmail signature setup',
    'hand-coded HTML signature',
    'email branding specialist'
  ],
  authors: [{ name: 'Shahjalal' }], 
  openGraph: {
    title: 'Professional Clickable HTML Email Signatures by TrackFlow Pro',
    description: 'Get a premium, mobile-friendly email signature that works flawlessly across all platforms. Perfect for real estate agents and business professionals.',
    url: 'https://www.trackflowpro.com/email-signature', 
    siteName: 'TrackFlow Pro',
    images: [
      {
        // ইমেজ পাথ public/meta ফোল্ডার থেকে নেওয়া হয়েছে
        url: 'https://trackflowpro.com/meta/professional-html-email-signature-service.webp', 
        width: 1200,
        height: 630,
        alt: 'Professional HTML Email Signature Showcase by TrackFlow Pro',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom HTML Email Signatures | Verified Expert Design',
    description: 'Hand-coded email signatures with clickable icons and professional formatting for Outlook & Mobile.',
    images: ['/meta/professional-html-email-signature-service.webp'],
  },
  robots: {
    index: true,   // গুগল এই পেজটি ইনডেক্স করবে
    follow: true,  // লিঙ্কগুলো ফলো করবে
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large', // সার্চে ইমেজ বড় করে দেখাবে
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.trackflowpro.com/email-signature', 
  },
  
}

type Props = {}

export default function EmailSignature({}: Props) {
  return (
    <>
   <Navbar />
      <EmailSignatureHero />
      <EmailSignaturePortfolioSection />
      <VideoGuideSection />
      <EmailSignatureInteractiveGmailPreview />
      
      <EmailSignatureProblemSection />
      <EmailSignatureSolution />
      <EmailSignatureBenefitSection />
      
      {/* ১. আগে সার্ভিস ব্রেকডাউন দেখান (আপনি কী কী দিচ্ছেন) */}
      <EmailSignatureServicesBreakdown />
      
      {/* ২. কাজ শেষ হওয়ার ধাপগুলো দেখান (ক্লায়েন্ট বুঝবে সে কীভাবে পাবে) */}
      <EmailSignatureProcessSection />
      
      {/* ৩. এবার প্রাইজ দেখান (এটিই সঠিক সময় কারণ ক্লায়েন্ট এখন মানসিকভাবে প্রস্তুত) */}
      <EmailSignaturePricingSection />

      <EmailSignatureWhoItsFor />
      <EmailSignatureProofExperience />
      
      {/* ৪. প্রাইসিং দেখার পর যদি মনে কোনো খটকা থাকে, তা FAQ মিটিয়ে দেবে */}
      <EmailSignatureFAQSection />
      
      <EmailSignatureUniqueAdvantage />
      <TestimonialSection />
      <EmailSignatureFinalCTA />
      
      <Footer />
    
    </>
  )
}