import { Metadata } from 'next';
import BookingContent from './bookingContent';

export const metadata: Metadata = {
  title: 'Free Google Ads Audit & Tracking Strategy Session | TrackFlow Pro',
  description: 'Stop losing conversion data! Book a free 15-minute audit to fix iOS 14+ tracking gaps. Get expert insights on GTM Server-Side, GA4, and Meta CAPI to scale your ROAS.',
  keywords: [
    'google ads audit service',        // [cite: Keyword Research For TrackFlowProKeyword,Intent,Volume,KD%,CPC (USD),কেন এটি সেরা_ hire google ads expert,Transactional,390,5%,$27.11,_ক্লায়েন্ট যখন সরাসরি কাউকে হায়ার করতে চায়, তখন এটি লিখে সার্চ দেয়।_ hiring_53.xlsx]
    'hire google ads expert',           // [cite: Keyword Research For TrackFlowProKeyword,Intent,Volume,KD%,CPC (USD),কেন এটি সেরা_ hire google ads expert,Transactional,390,5%,$27.11,_ক্লায়েন্ট যখন সরাসরি কাউকে হায়ার করতে চায়, তখন এটি লিখে সার্চ দেয়।_ hiring_53.xlsx]
    'free tracking audit',
    'gtm server side audit',
    'facebook capi validation',
    'conversion tracking consultation',
    'scale google ads ROAS'
  ],
  openGraph: {
    title: 'Stop Data Loss: Book Your Free Google Ads & Tracking Audit',
    description: 'Reclaim 100% of your data. A deep-dive session into your GTM, GA4, and Server-Side tracking infrastructure. No sales pitch, just pure strategy.',
    url: 'https://www.trackflowpro.com/book-audit', 
    siteName: 'TrackFlow Pro',
    images: [{ url: 'https://www.trackflowpro.com/og-audit.jpg' }],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.trackflowpro.com/book-audit',
  },
};

export default function BookingPage() {
  return <BookingContent />;
}