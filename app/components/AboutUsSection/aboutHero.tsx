"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Target, Lightbulb, Rocket, Users2, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#020617] overflow-hidden">
      
      {/* --- Section 1: Agency Intro Hero (SEO & Policy Optimized) --- */}
      <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-36">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] mb-8 border border-blue-100 dark:border-blue-800/50"
            >
              <ShieldCheck size={14} /> Future-Proof Measurement Infrastructure
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-[0.9] lg:px-10"
            >
              High-Performance <span className="text-blue-600">Google Ads</span> & Tracking Agency.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-14 max-w-3xl mx-auto font-medium"
            >
              TrackFlow Pro is a data-intelligence agency led by a certified <span className="text-slate-900 dark:text-white font-bold">Google Ads expert</span>. We specialize in GTM Server-Side Tracking, Meta Conversions API (CAPI), and comprehensive audits to help brands scale with maximum data transparency.
            </motion.p>

            {/* Specialized Skill Badges */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="flex flex-wrap justify-center gap-8 md:gap-16"
            >
               <BadgeItem num="01" title="SST Specialists" sub="Server-Side Tracking" />
               <BadgeItem num="02" title="Ads Audit Experts" sub="Google Ads Strategy" />
               <BadgeItem num="03" title="Brand Ecosystem" sub="Email Signatures" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Section 2: Our Mission (Updated for Compliance) --- */}
      <section className="py-28 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden border-y border-slate-100 dark:border-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center -mx-4">
            
            <div className="w-full lg:w-1/2 px-4 mb-20 lg:mb-0">
               <div className="max-w-xl">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-6">Our Mission</h2>
                  <h3 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-none">
                    Restoring Data Integrity with <span className="italic text-slate-400">Advanced Tagging.</span>
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                    We empower businesses to <span className="text-blue-600 font-bold">hire a Google Ads expert</span> infrastructure that adapts to evolving privacy standards and browser restrictions. Our goal is to ensure your growth is fueled by reliable, compliant, and actionable conversion data.
                  </p>
                  <Link href="/book-audit" className="inline-flex items-center gap-3 font-black text-xs uppercase tracking-widest bg-blue-600 text-white px-8 py-5 rounded-2xl hover:bg-blue-700 transition-all group shadow-xl shadow-blue-600/20 active:scale-95">
                    Get Your Free Ads Audit <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
               </div>
            </div>

            <div className="w-full lg:w-1/2 px-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MissionCard 
                    icon={<Target className="text-blue-600" />}
                    title="GA4 Audit Mastery"
                    desc="We identify measurement gaps through professional audits, ensuring your event tracking is seamless and robust."
                  />
                  <MissionCard 
                    icon={<Lightbulb className="text-yellow-500" />}
                    title="SST Infrastructure"
                    desc="Stay ahead of the cookieless future with GTM Server-Side solutions designed for better performance."
                  />
                  <MissionCard 
                    icon={<Users2 className="text-indigo-500" />}
                    title="Conversion API"
                    desc="Deepen platform integration with Meta/Facebook CAPI to improve attribution and campaign efficiency."
                  />
                  <MissionCard 
                    icon={<Rocket className="text-orange-500" />}
                    title="ROI Driven Growth"
                    desc="As your strategic partner, we focus on scaling your business through verified data and optimized ad spends."
                  />
               </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}

function BadgeItem({ num, title, sub }: { num: string, title: string, sub: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 font-black border border-slate-200 dark:border-slate-700 shadow-sm">{num}</div>
      <div className="text-left">
        <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{title}</p>
        <p className="text-[9px] text-slate-500 font-bold tracking-[0.15em] uppercase">{sub}</p>
      </div>
    </div>
  )
}

function MissionCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8, backgroundColor: "rgba(255, 255, 255, 0.02)" }}
      className="p-10 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300"
    >
      <div className="w-14 h-14 bg-slate-50 dark:bg-[#020617] rounded-2xl flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-800">
        {icon}
      </div>
      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  )
}