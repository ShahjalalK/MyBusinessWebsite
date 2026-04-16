"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Target, Lightbulb, Rocket, Users2, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* --- Section 1: Agency Intro Hero --- */}
      <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32">
        {/* Background Accents */}
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
              The Next Evolution of Data Tracking
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[1.1]"
            >
              We Bridge the Gap Between <span className="text-blue-600">Privacy & Performance.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto font-medium"
            >
              TrackFlow Pro is a premier data-intelligence agency. We specialize in **Server-Side Tracking**, **High-ROI Google Ads**, and **Clickable Brand Identity** to help global brands recover lost revenue in a cookieless world.
            </motion.p>

            {/* Specialized Skill Badges */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="flex flex-wrap justify-center gap-6 md:gap-12"
            >
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">01</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">SST Experts</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Server-Side</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">02</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Ads Strategists</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Google Ads</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold border border-slate-200 dark:border-slate-700">03</div>
                  <div className="text-left leading-none">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Brand Designers</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Email Assets</p>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Section 2: Our Mission (The Core Values) --- */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center -mx-4">
            
            {/* Left side: Mission Title */}
            <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
               <div className="max-w-md">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Our Mission</h2>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                    Empowering Agencies with <span className="italic text-slate-400">Actionable Data.</span>
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                    Our mission is to provide businesses with a bulletproof tracking ecosystem. In an era of privacy updates and ad-blockers, we ensure every marketing dollar is accounted for with 100% precision.
                  </p>
                  <button className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-blue-600 group">
                    Scale Your Tracking Now <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>

            {/* Right side: Mission Cards */}
            <div className="w-full lg:w-1/2 px-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MissionCard 
                    icon={<Target className="text-blue-600" />}
                    title="Absolute Precision"
                    desc="We eliminate data gaps, ensuring 100% accurate conversion tracking for your campaigns."
                  />
                  <MissionCard 
                    icon={<Lightbulb className="text-yellow-500" />}
                    title="Future-Proofing"
                    desc="Stay ahead of iOS updates and cookieless browsing with our advanced SST infrastructure."
                  />
                  <MissionCard 
                    icon={<Users2 className="text-indigo-500" />}
                    title="Direct Partnership"
                    desc="We function as an extension of your internal team, not just another outside vendor."
                  />
                  <MissionCard 
                    icon={<Rocket className="text-orange-500" />}
                    title="Growth Focused"
                    desc="Beyond technical setup, we provide the strategy needed to scale your business ROI."
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