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
import EmailSignatureTestimonialSection from '../../components/EmailSignatureServicePage/emailSigantureTestimonail'

import EmailSignatureInteractiveGmailPreview from '../../components/EmailSignatureServicePage/EmailSignatureGenerator'
import EmailSignatureFinalCTA from '../../components/EmailSignatureServicePage/emailSignatureCTA'
import VideoGuideSection from '@/app/components/EmailSignatureServicePage/emailSignatureVideo'

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

        <EmailSignatureTestimonialSection />

        <EmailSignatureFinalCTA />

        
    

    <Footer />
    
    </>
  )
}