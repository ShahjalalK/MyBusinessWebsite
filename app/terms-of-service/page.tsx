import React from 'react'
import { Metadata } from 'next'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { Scale, CheckCircle, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

// ১. SEO Meta Tags: প্রফেশনাল সার্ভিসের জন্য অপ্টিমাইজড
export const metadata = {
  title: 'Terms of Service | TrackFlow Pro',
  description: 'Read the terms and conditions for using TrackFlow Pro services. We provide professional Google Ads, GA4, and Server-Side Tracking solutions with technical precision.',
  
  keywords: [
    'Terms of Service', 
    'TrackFlow Pro terms', 
    'service agreement', 
    'digital marketing contract', 
    'tracking service terms'
  ],

  openGraph: {
    title: 'Terms of Service | TrackFlow Pro',
    description: 'The legal agreement and service terms for TrackFlow Pro clients.',
    url: 'https://trackflowpro.com/terms-of-service',
    siteName: 'TrackFlow Pro',
    images: [
      {
        url: '/meta/trackflowpro-terms-of-service.webp', 
        width: 1200,
        height: 630,
        alt: 'TrackFlow Pro Terms of Service and Service Agreement',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | TrackFlow Pro',
    description: 'Read our service terms for Google Ads and Advanced Tracking solutions.',
    images: ['https://trackflowpro.com/meta/trackflowpro-terms-of-service.webp'],
  },

  alternates: {
    canonical: 'https://trackflowpro.com/terms-of-service',
  },

  // ইনডেক্সিং এবং সার্চ রেজাল্ট নিশ্চিত করা (Trust Factor এর জন্য জরুরি)
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

export default function TermsOfService() {
  const lastUpdated = "April 27, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-slate-950 py-20">
        <div className="container mx-auto px-6">
          
          {/* Header Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <Scale size={14} /> Legal Agreement
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Terms of <span className="text-blue-600">Service</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Content Section */}
          <div className="max-w-3xl mx-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
            
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
              
              {/* 1. Acceptance of Terms */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <CheckCircle size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">1. Acceptance of Terms</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  By accessing and using TrackFlowPro, you accept and agree to be bound by the terms and provisions of this agreement. Our services are designed to provide technical excellence in data tracking and digital advertising.
                </p>
              </section>

              {/* 2. Service Scope */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <HelpCircle size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">2. Services Scope</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">
                  TrackFlowPro offers specialized technical services, including but not limited to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 font-medium">
                  <li><strong>Google Tag Manager (GTM):</strong> Web and Server-side container setup.</li>
                  <li><strong>GA4 & Meta CAPI:</strong> Advanced conversion tracking and data modeling.</li>
                  <li><strong>Google Ads:</strong> Account audits, strategy, and management.</li>
                  <li><strong>Brand Identity:</strong> Clickable HTML email signatures and professional stamps.</li>
                </ul>
              </section>

              {/* 3. Results Disclaimer */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                    <AlertCircle size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">3. Results & Liability</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  TrackFlowPro guarantees industry-standard technical implementations. However, digital marketing results (such as ROAS or Sales) depend on various external factors like market trends and product quality. We are not liable for business losses but committed to fixing any technical tracking discrepancies.
                </p>
              </section>

              {/* 4. Data Privacy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">4. Confidentiality</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  We maintain strict confidentiality regarding your business data and account access. All credentials provided for GTM, GA4, or Google Ads are handled with the highest level of security.
                </p>
              </section>

              {/* Contact Footer */}
              <section className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6">
                  Have questions regarding our terms? Feel free to reach out.
                </p>
                <Link
                  href="/contact" 
                  className="inline-block px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                >
                  Contact Legal Support
                </Link>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}