import React from 'react'
import Navbar from '../../components/navbar'
import ServerHeroSection from '../../components/ServerSideTrackingPage/serverHeroSection'
import CTASection from '../../components/ctaSection'
import Footer from '../../components/footer'
import ServerProblemSection from '../../components/ServerSideTrackingPage/serverProblem'
import ServerSolutionSection from '../../components/ServerSideTrackingPage/serverSolution'
import ServerSimpleExplanation from '../../components/ServerSideTrackingPage/serverSimpleExplane'
import ServerBenefitsSection from '../../components/ServerSideTrackingPage/serverBenifite'
import ServicesBreakdown from '../../components/ServerSideTrackingPage/serverServiceBrockDown'
import ServerUniqueAdvantage from '../../components/ServerSideTrackingPage/serverUnique'
import ServerProcessSection from '../../components/ServerSideTrackingPage/serverOurProcess'
import ServerResultsSection from '../../components/ServerSideTrackingPage/serverResult'
import ServerFAQSection from '../../components/ServerSideTrackingPage/serverFaq'
import TestimonialSwiper from '../../components/HeroSection/testimonial'
import ServerLiveTrackingSection from '../../components/ServerSideTrackingPage/serverLiveTracking'


type Props = {}

export default function ServerSideTracking({}: Props) {
  return (
    <>

    <Navbar />

    <ServerHeroSection />

    <ServerProblemSection />
    <ServerSolutionSection />

    <ServerSimpleExplanation />
    <ServerBenefitsSection />

    <ServerLiveTrackingSection />
    
    <ServicesBreakdown />

    <ServerUniqueAdvantage />
    <ServerProcessSection />

    

    <ServerResultsSection />

    <ServerFAQSection />

    <TestimonialSwiper />
   
    <CTASection />

    <Footer />
    
    </>
  )
}