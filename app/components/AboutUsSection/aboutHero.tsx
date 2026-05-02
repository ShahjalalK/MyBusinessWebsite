"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Target, Lightbulb, Rocket, Users2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* --- Section 1: Agency Intro Hero (SEO Optimized) --- */}
      <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block py-2 px-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-6 border border-blue-100 dark:border-blue-800"
            >
              The Next Evolution of GTM Server-Side Tracking
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[1.1]"
            >
              Your Trusted <span className="text-blue-600">Google Ads Specialist</span> & Tracking Agency.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto font-medium"
            >
              TrackFlow Pro is a data-intelligence agency lead by a certified **Google Ads expert**. We specialize in **GTM Server-Side Tracking**, **Meta Conversions API (CAPI)**, and high-performance **Google Ads Audits** to help brands scale ROI with 100% data precision.
            </motion.p>

            {/* Specialized Skill Badges - High-Value Keywords Integration */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="flex flex-wrap justify-center gap-6 md:gap-12"
            >
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">01</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">SST Specialists</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Server-Side Tracking</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">02</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Ads Audit Experts</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Google Ads Audit</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">03</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Brand Branding</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Email Signatures</p>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Section 2: Our Mission (Action-Oriented Keywords) --- */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center -mx-4">
            
            <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
               <div className="max-w-md">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Our Mission</h2>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                    Fixing Lost Data with <span className="italic text-slate-400">Server Side Tagging.</span>
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                    We help businesses **hire a google ads expert** infrastructure that bypasses iOS tracking restrictions. Our mission is to ensure your marketing decisions are based on 100% accurate conversion data.
                  </p>
                  <Link href="/book-audit" className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-blue-600 group">
                    Get Your Free Ads Audit <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
               </div>
            </div>

            <div className="w-full lg:w-1/2 px-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MissionCard 
                    icon={<Target className="text-blue-600" />}
                    title="GA4 Audit Mastery"
                    desc="We identify tracking gaps through professional audits, ensuring your conversion tracking is flawless."
                  />
                  <MissionCard 
                    icon={<Lightbulb className="text-yellow-500" />}
                    title="SST Infrastructure"
                    desc="Stay ahead of cookieless browsing and iOS updates with our GTM Server-Side tracking solutions."
                  />
                  <MissionCard 
                    icon={<Users2 className="text-indigo-500" />}
                    title="Conversion API"
                    desc="Bridging the gap between server and platform with Meta/Facebook CAPI for better ad attribution."
                  />
                  <MissionCard 
                    icon={<Rocket className="text-orange-500" />}
                    title="ROI Driven Growth"
                    desc="As your ads specialist, we focus on scaling your business through precise data and optimized campaigns."
                  />
               </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}

function MissionCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
    >
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  )
}