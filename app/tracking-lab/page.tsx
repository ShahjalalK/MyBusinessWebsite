import { Metadata } from 'next'
import TrackingLabClient from '../components/tracking-lab/tracking-section'
import Navbar from '../components/navbar'
import Footer from '../components/footer'


export const metadata: Metadata = {
  title: 'Precision Intelligence | Server-Side Tracking Lab',
  description: 'Experience 100% data accuracy. Verify your tracking integrity with our GA4 and GTM Server-Side diagnostic report.',
  keywords: ['ga4 server side tracking', 'google ads audit service', 'facebook capi', 'gtm specialist'],
  openGraph: {
    title: 'Precision Intelligence | Live Tracking Engine v2.0',
    description: 'Bypass ITP restrictions and recover lost conversion signals.',
    images: ['/tracking-lab-preview.jpg'], 
  },
}

export default function Page() {
  return (
    <>
    <Navbar />
    <TrackingLabClient />

    <Footer />
    
    </>
  )
  

}