import React from 'react'
import CapiHero from '../../components/FacebookCapiPage/capiHero'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import CapiProblemSection from '../../components/FacebookCapiPage/capiProblem'
import CapiSolutionSection from '../../components/FacebookCapiPage/capiSolution'
import CapiWhatIsCAPI from '../../components/FacebookCapiPage/capiWhatisCapi'
import CapiBenefitsSection from '../../components/FacebookCapiPage/capiBenefite'
import CapiServicesBreakdown from '../../components/FacebookCapiPage/capiServiceBrokeDown'
import CapiUniqueAdvantage from '../../components/FacebookCapiPage/capiAdvantage'
import CapiProcessSection from '../../components/FacebookCapiPage/capiProcess'
import CapiProofSection from '../../components/FacebookCapiPage/capiProf'
import CapiFAQSection from '../../components/FacebookCapiPage/capiFaq'
import CapiFinalCTA from '../../components/FacebookCapiPage/capiCta'
import CapiWinningStrategy from '../../components/FacebookCapiPage/fapiWarning'


export const metadata = {
  title: 'Facebook CAPI & GTM Server Side Tracking Expert | Setup & Audit',
  description: 'Bypass iOS 14+ updates with professional Facebook CAPI and GTM server side tracking. Get a deep Google Ads account audit to scale your ROAS today.',
  keywords: [
    'facebook capi', 
    'gtm server side tracking', 
    'google ads account audit', 
    'hire google ads expert', 
    'ga4 server side tracking',
    'conversion api setup'
  ],
  openGraph: {
    title: 'Expert Facebook CAPI & Server Side Tagging GTM Setup',
    description: 'Recover your lost data and fix tracking leaks with a proven 4-step framework.',
    images: ['/your-og-image.jpg'], // আপনার একটি প্রফেশনাল থাম্বনেইল ইমেজের লিঙ্ক দিবেন
  },
}


type Props = {}

export default function FacebookCapi({}: Props) {
  return (
    <>
    <Navbar />
    <CapiHero />
    <CapiProblemSection />
    <CapiSolutionSection />
    <CapiWhatIsCAPI />
    <CapiWinningStrategy />
    <CapiBenefitsSection />
    <CapiServicesBreakdown />
    <CapiUniqueAdvantage />
    <CapiProcessSection />
    <CapiProofSection />
    <CapiFAQSection />
    <CapiFinalCTA />
    
    <Footer />
    </>
  )
}