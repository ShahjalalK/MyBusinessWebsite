import React from 'react'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import CaseStudiesHero from '../components/caseStadyPage/caseHero'
import CaseStudyIntro from '../components/caseStadyPage/caseIntro'
import CaseStudyFilter from '../components/caseStadyPage/caseFilter'
import CaseStudyGrid from '../components/caseStadyPage/caseStadyGrid'
import MoreComingSoon from '../components/caseStadyPage/caseMoreComming'
import TrustSection from '../components/caseStadyPage/caseWhyTisMetter'
import CaseStudyCTA from '../components/caseStadyPage/caseCta'

type Props = {}

export default function CaseStady({}: Props) {
  return (
    <>
    <Navbar />
    <CaseStudiesHero />
    <CaseStudyIntro />

    <CaseStudyFilter />

    <CaseStudyGrid />

    <MoreComingSoon />

    <TrustSection />

    <CaseStudyCTA />

    <Footer />
    
    </>
  )
}