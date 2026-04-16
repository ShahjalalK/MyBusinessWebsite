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