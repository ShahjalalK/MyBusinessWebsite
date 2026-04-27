import React from 'react'
import { Metadata } from 'next'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { ShieldCheck, Eye, FileText, Lock } from 'lucide-react'

// ১. SEO Meta Tags: আপনার ব্র্যান্ডের প্রফেশনালিজম এবং ট্রাস্ট বাড়ানোর জন্য
export const metadata: Metadata = {
  title: 'Privacy Policy | TrackFlowPro',
  description: 'At TrackFlowPro, we prioritize your data security. Learn how we handle information regarding Google Ads, GA4, and Server-Side Tracking to ensure privacy and compliance.',
  keywords: ['Privacy Policy', 'Data Security', 'TrackFlowPro', 'Server-Side Tracking Privacy', 'Google Ads Data Protection'],
  openGraph: {
    title: 'Privacy Policy | TrackFlowPro',
    description: 'Our commitment to protecting your personal and business data.',
    url: 'https://trackflowpro.com/privacy-policy',
    type: 'website',
  },
}

export default function PrivacyPolicy() {
  const lastUpdated = "April 27, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-slate-950 py-20">
        <div className="container mx-auto px-6">
          
          {/* Header Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={14} /> Trust & Transparency
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Privacy <span className="text-blue-600">Policy</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Content Section */}
          <div className="max-w-3xl mx-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
            
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
              
              {/* 1. Introduction */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Eye size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">1. Introduction</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Welcome to TrackFlowPro. We respect your privacy and are committed to protecting your personal data. This privacy policy informs you about how we look after your data when you visit our website and tells you about your privacy rights.
                </p>
              </section>

              {/* 2. Data We Collect */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <FileText size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">2. Data We Collect</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">
                  We may collect, use, and store different kinds of personal data about you, including:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 font-medium">
                  <li><strong>Identity Data:</strong> Name or similar identifier.</li>
                  <li><strong>Contact Data:</strong> Email address for newsletter subscriptions or inquiries.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, and tracking identifiers (GA4, GTM cookies).</li>
                </ul>
              </section>

              {/* 3. Tracking Technologies */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Lock size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">3. Tracking Technologies</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Since TrackFlowPro specializes in tracking solutions, we use <strong>Google Analytics 4 (GA4)</strong> and <strong>Google Tag Manager (GTM)</strong> to analyze how users interact with our site. We also implement <strong>Server-Side Tracking</strong> to ensure data accuracy while respecting user privacy settings and ad-blocker preferences.
                </p>
              </section>

              {/* 4. Data Security */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight uppercase">4. Data Security</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We do not sell or share your personal data with third parties for marketing purposes.
                </p>
              </section>

              {/* Contact Information */}
              <section className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Questions?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6">
                  If you have any questions about this privacy policy, please contact us.
                </p>
                <a 
                  href="mailto:contact@trackflowpro.com" 
                  className="inline-block px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-lg"
                >
                  Contact Support
                </a>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}