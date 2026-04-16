import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import GoogleAdsHero from '../../components/GoolgeAdsServicePage/googleAdsHeroSection'
import GoogleAdsProblemSection from '../../components/GoolgeAdsServicePage/googleAdsProblemSection'
import GoogleAdsSolutionSection from '../../components/GoolgeAdsServicePage/googleAdsSolutionSection'
import GoogleAdsBenefitsSection from '../../components/GoolgeAdsServicePage/GoogleAdsBenifeteSection'
import GoogleAdsServicesBreakdown from '../../components/GoolgeAdsServicePage/googleAdsServiceBrokeDown'
import GoogleAdsUniqueAdvantage from '../../components/GoolgeAdsServicePage/GoogleAdsUniqeAdvantage'
import ResultsProof from '../../components/HeroSection/results'
import OurProcess from '../../components/AboutUsSection/ourProcess'
import TestimonialSwiper from '../../components/HeroSection/testimonial'
import CTASection from '../../components/ctaSection'
import GoogleAdsFAQSection from '../../components/GoolgeAdsServicePage/googleAdsFaqSection'

type Props = {}

export default function GoogleAdsExpert({}: Props) {
  return (
    <>
    <Navbar />
        <GoogleAdsHero />

        <GoogleAdsProblemSection />

        <GoogleAdsSolutionSection />

        <GoogleAdsBenefitsSection />

        <GoogleAdsServicesBreakdown />

        <GoogleAdsUniqueAdvantage />

        

        <OurProcess />

        <ResultsProof />

        <TestimonialSwiper />

        <GoogleAdsFAQSection />

        <CTASection />

    <Footer />
    
    </>
  )
}