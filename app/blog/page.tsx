import { Metadata } from 'next';
import BlogPageContent from '../components/BlogMainPage/blogPageContent';

export const metadata: Metadata = {
  // আপনার রিসার্চ ফাইল অনুযায়ী হাই-সিপিসি কিওয়ার্ড ফোকাস করা হয়েছে
  title: 'Insights & Strategies from Google Ads Experts | TrackFlow Pro Blog',
  description: 'Master the art of conversion tracking and ad optimization. Read our latest articles on GTM Server-Side tracking, GA4 audits, and scaling Google Ads ROI.',
  keywords: [
    'google ads expert tips', 
    'gtm server side tracking blog', 
    'hire google ads expert insights', //
    'conversion optimization strategies',
    'web analytics for ecommerce',
    'GA4 audit guide'
  ],
  openGraph: {
    title: 'TrackFlow Pro Blog | Data-Driven Marketing & Tracking Insights',
    description: 'Transforming dark data into profitable growth with expert tracking and ads strategies.',
    url: 'https://trackflowpro.com/blog',
    siteName: 'TrackFlow Pro',
    images: [{ url: '/blog-og-image.jpg' }],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://trackflowpro.com/blog',
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}