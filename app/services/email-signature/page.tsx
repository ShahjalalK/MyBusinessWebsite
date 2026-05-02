import React from 'react'
import Navbar from '../../components/navbar'
import CTASection from '../../components/ctaSection'
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

// SEO Meta Data
export const metadata: Metadata = {
  title: 'Professional Clickable HTML Email Signatures | Mobile-Responsive Design',
  description: 'Elevate your professional branding with hand-coded, clickable HTML email signatures. 100% responsive, spam-safe, and compatible with Outlook, Gmail, and Apple Mail.',
  keywords: [
    'professional email signature',
    'clickable HTML signature',
    'HTML email branding',
    'Outlook email signature',
    'Gmail signature design',
    'responsive email signature',
    'HIPAA compliant email signature',
    'hand-coded email signature'
  ],
  authors: [{ name: 'Shahjalal Khan' }],
  openGraph: {
    title: 'Transform Your Emails with Clickable HTML Signatures',
    description: 'Get a premium, mobile-friendly email signature that works flawlessly on every device. Perfect for Real Estate Agents & Professionals.',
    url: 'https://yourdomain.com/email-signature', // আপনার সঠিক লিঙ্কটি দিন
    siteName: 'TrackFlowPro',
    images: [
      {
        url: 'https://yourdomain.com/og-email-signature.jpg', // আপনার প্রফেশনাল ইমেজ লিঙ্ক
        width: 1200,
        height: 630,
        alt: 'Professional Email Signature Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom HTML Email Signatures | Verified Global Expert',
    description: 'Hand-coded email signatures with clickable icons and links. Zero formatting issues on Outlook & Mobile.',
    images: ['https://yourdomain.com/og-email-signature.jpg'],
  },
  alternates: {
    canonical: 'https://www.trackflowpro.com//email-signature',
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

        <EmailSignatureServicesBreakdown />

        <EmailSignatureWhoItsFor />

        <EmailSignatureProofExperience />

        <EmailSignatureProcessSection />

        <EmailSignatureFAQSection />

        <EmailSignatureUniqueAdvantage />

       <TestimonialSection />

        <EmailSignatureFinalCTA />

        
    

    <Footer />
    
    </>
  )
}