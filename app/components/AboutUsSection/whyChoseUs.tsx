"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, BarChart4, Headphones, CheckCircle2 } from 'lucide-react'

const reasons = [
  {
    title: "Server-Side Expertise",
    desc: "In a cookieless world, we deploy GTM Server-Side and Meta CAPI to ensure your data is 100% compliant and accurate.",
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
  },
  {
    title: "ROI-First Marketing",
    desc: "We don't just set up tags; we audit your Google Ads to identify ROI bottlenecks and maximize your conversion lift.",
    icon: <BarChart4 className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Rapid Deployment",
    desc: "Our technical framework allows us to implement complex tracking architectures in record time with zero measurement gaps.",
    icon: <Zap className="w-6 h-6 text-amber-500" />,
  },
  {
    title: "Specialist Support",
    desc: "You get direct access to a dedicated Google Ads Specialist. No middlemen—just experts solving your technical problems.",
    icon: <Headphones className="w-6 h-6 text-cyan-600" />,
  }
]

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950/40 overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/30 dark:bg-blue-900/5 -skew-x-12 translate-x-1/4 -z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-wrap items-center -mx-4">
          
          {/* Left Side: Text Content */}
          <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
            <div className="max-w-xl">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 inline-block"
              >
                The Professional Advantage
              </motion.span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                Why Top Agencies <span className="text-blue-600 underline underline-offset-8 decoration-2">Hire Us</span> For Data.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                Scaling Google Ads requires facts, not guesses. We provide the server-to-server infrastructure that lets your marketing team focus on winning, while we handle the tracking.
              </p>

              {/* Quick Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "100% Data Ownership", 
                  "iOS 14+ Signal Recovery", 
                  "Full GA4 Audit Service",
                  "Facebook CAPI Integration"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1 shadow-lg shadow-blue-500/30">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-black text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Feature Cards */}
          <div className="w-full lg:w-1/2 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reasons.map((reason, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-blue-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {reason.icon}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                    {reason.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {reason.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}