import { Metadata } from 'next';
import BlogPageContent from '../components/BlogMainPage/blogPageContent';

export const metadata = {
  // টাইটেল এবং ডেসক্রিপশন আপনার রিসার্চ ফাইল অনুযায়ী হাই-সিপিসি কিওয়ার্ড ফোকাসড
  title: 'Insights & Strategies from Google Ads Experts | TrackFlow Pro Blog',
  description: 'Master the art of conversion tracking and ad optimization. Read our latest articles on GTM Server-Side tracking, GA4 audits, and scaling Google Ads ROI.',
  
  keywords: [
    'google ads expert tips', 
    'gtm server side tracking blog', 
    'hire google ads expert insights', 
    'conversion optimization strategies',
    'web analytics for ecommerce',
    'GA4 audit guide'
  ],

  openGraph: {
    title: 'TrackFlow Pro Blog | Data-Driven Marketing & Tracking Insights',
    description: 'Transforming dark data into profitable growth with expert tracking and ads strategies.',
    url: 'https://trackflowpro.com/blog',
    siteName: 'TrackFlow Pro',
    images: [
      {
        url: '/meta/google-ads-expert-blog-tracking-insights.webp', 
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro Blog - Expert Digital Marketing and Tracking Insights',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'TrackFlow Pro Blog | Master Conversion Tracking',
    description: 'Latest strategies on GA4, GTM Server-Side, and Google Ads ROI.',
    images: ['/meta/google-ads-expert-blog-tracking-insights.webp'],
  },

  alternates: {
    canonical: 'https://trackflowpro.com/blog',
  },

  // ইনডেক্সিং এবং সার্চ প্রিভিউ নিশ্চিত করা
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}