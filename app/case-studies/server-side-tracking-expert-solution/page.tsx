import Footer from '@/app/components/footer';
import Navbar from '@/app/components/navbar';
import Image from 'next/image';
import Link from 'next/link';
import ServerSideTrackingCaseStady from './server-side-tracking-expert-solutionComponent';

export const metadata = {
  title: 'How We Fixed 30% Data Loss with Server-Side Tracking | Hire Google Ads Agency',
  description: 'Case study on how our team implemented Facebook Conversions API & GA4 Server-Side tracking for TrackFlowPro. Discover our method to bypass ad-blockers and boost ROAS.',
  keywords: [
    'hire google ads expert', 
    'server side tracking expert', 
    'facebook conversions api specialist', 
    'GA4 server side setup', 
    'fix data loss google ads',
    'conversion tracking expert'
  ],
  openGraph: {
    title: 'Server-Side Tracking Case Study: Recovering Lost Conversions',
    description: 'See how TrackFlowPro recovered 30% lost leads using custom Next.js server-side tracking logic.',
    images: [
      {
        url: '/case-stady/facebook-conversions-api-server-side-tracking-proof.png',
        width: 1200,
        height: 630,
        alt: 'Facebook CAPI Proof',
      },
    ],
    type: 'website',
  },
};

export default function CaseStudyPage() {
  return (
    <>
      <Navbar />
      <ServerSideTrackingCaseStady />
      <Footer />
    </>
  );
}