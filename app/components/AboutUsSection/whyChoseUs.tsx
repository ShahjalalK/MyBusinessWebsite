"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, BarChart4, Headphones, CheckCircle2 } from 'lucide-react'

const reasons = [
  {
    title: "Privacy-First Precision",
    desc: "In a cookieless world, we use Server-Side Tracking to ensure your data is 100% compliant and accurate.",
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
  },
  {
    title: "ROI-Driven Strategy",
    desc: "We don't just set up tags; we optimize your entire funnel to lower CPA and increase your profit margins.",
    icon: <BarChart4 className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Ultra-Fast Implementation",
    desc: "Our streamlined workflow allows us to deploy complex tracking architectures in record time without errors.",
    icon: <Zap className="w-6 h-6 text-amber-500" />,
  },
  {
    title: "Dedicated Support",
    desc: "You get direct access to our specialists. No account managers—just experts solving your problems.",
    icon: <Headphones className="w-6 h-6 text-cyan-600" />,
  }
]

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center -mx-4">
          
          {/* Left Side: Text Content */}
          <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
            <div className="max-w-xl">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
              >
                The TrackFlow Advantage
              </motion.span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                Why Top Agencies <span className="text-blue-600 underline underline-offset-8">Trust Us</span> With Their Data.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                Most agencies guess. We track. We provide the technical backbone that allows your marketing team to make decisions based on facts, not assumptions.
              </p>

              {/* Quick Checklist */}
              <div className="space-y-4">
                {["100% Data Ownership", "iOS 14+ Impact Mitigation", "Custom API Integrations"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-widest">{item}</span>
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
                  whileHover={{ y: -5 }}
                  className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none"
                >
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-6">
                    {reason.icon}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
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