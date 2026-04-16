"use client"
import React from 'react'
import { InlineWidget } from "react-calendly"
import { CheckCircle2, Video, Globe, ShieldCheck, ArrowRight } from 'lucide-react'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

export default function BookingPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 pt-16 pb-20 lg:pt-20 lg:pb-32">
        <div className="container mx-auto px-6">
          
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-800">
                <Globe className="w-3.5 h-3.5" /> Strategy & Audit Session
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
                Stop Losing Data. <br />
                <span className="text-blue-600">Start Scaling Fast.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                Fix your tracking gaps caused by iOS 14+ and ad-blockers. Book a 15-minute consultation to reclaim 100% of your conversion data.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: Value Propositions */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" /> What we'll cover:
                  </h3>
                  <ul className="space-y-5">
                    {[
                      "Technical GTM & GA4 Audit",
                      "Server-Side Tracking Setup",
                      "Facebook CAPI Validation",
                      "Data-Driven Growth Roadmap"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-600 p-8 rounded-[2rem] text-white relative overflow-hidden group">
                  <Video className="w-12 h-12 opacity-20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-bold mb-2 italic">Quick Note:</h4>
                  <p className="text-blue-100 text-sm leading-relaxed font-medium">
                    This isn't a sales pitch. It's a deep dive into your tracking infrastructure to find where you're losing money.
                  </p>
                </div>
              </div>

              {/* Right Side: Calendly Widget */}
              <div className="lg:col-span-8 bg-white dark:bg-white rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 overflow-hidden">
                <InlineWidget 
                  url="https://calendly.com/webanalystshahjalal/freeconsultation" 
                  styles={{ height: '700px' }}
                  pageSettings={{
                    backgroundColor: 'ffffff',
                    hideEventTypeDetails: true,
                    hideLandingPageDetails: false,
                    primaryColor: '2563eb',
                    textColor: '1e293b'
                  }}
                />
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-12 text-center text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
               Trusted by E-commerce Brands Worldwide <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}