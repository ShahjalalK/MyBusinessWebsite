import React from 'react'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import ContactHero from '../components/contactUsPage/contactHero'
import ContactForm from '../components/contactUsPage/contactForm'
import ContactDirectContactInfo from '../components/contactUsPage/contactDirect'
import ContactQuickResponsePromise from '../components/contactUsPage/contactResponse'
import WhatHappensNext from '../components/contactUsPage/contactWhatHappen'
import ContactFAQShort from '../components/contactUsPage/contactFaq'
import ContactFinalContactStep from '../components/contactUsPage/contactCta'

type Props = {}

export default function Contact({}: Props) {
  return (
    <>
    <Navbar />
        <ContactHero />
        <ContactForm />
        <ContactDirectContactInfo />
        <ContactQuickResponsePromise />
        <WhatHappensNext />
        <ContactFAQShort />

        <ContactFinalContactStep />
    <Footer />
    </>
  )
}