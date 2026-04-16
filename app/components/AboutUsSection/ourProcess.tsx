"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, PenTool, Activity, Rocket } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "Audit & Discovery",
    desc: "We dive deep into your current tracking setup and ad accounts to identify data leaks and ROI bottlenecks.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Strategic Blueprint",
    desc: "Our team designs a custom Server-Side architecture and ad strategy tailored to your specific business goals.",
    icon: <PenTool className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Deployment",
    desc: "We implement the setup using GTM, Docker, and API integrations with 100% precision and zero downtime.",
    icon: <Activity className="w-6 h-6" />,
  },
  {
    number: "04",
    title: "Scale & Optimize",
    desc: "With clean data flowing in, we continuously optimize your ads to maximize conversions and lower CPA.",
    icon: <Rocket className="w-6 h-6" />,
  }
]

export default function OurProcess() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
          >
            How We Work
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            A Proven Framework for <span className="text-blue-600">Digital Dominance.</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            We follow a systematic 4-step process to ensure your data is accurate and your campaigns are profitable.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group-hover:border-blue-500 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  
                  {/* Number & Icon */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform">
                      {step.icon}
                    </div>
                    <span className="text-4xl font-black text-slate-100 dark:text-slate-800 transition-colors group-hover:text-blue-500/20">
                      {step.number}
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              Currently accepting new projects for Q2 2026
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}