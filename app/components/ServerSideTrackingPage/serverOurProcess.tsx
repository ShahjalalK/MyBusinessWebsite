"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, Settings2, ShieldCheck, TrendingUp, ArrowRight, Activity } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "Deep Audit & Leak Detection",
    desc: "Using our 'Google Ads Audit' framework, we identify data gaps caused by iOS restrictions and ad-blockers. We analyze event match quality to pinpoint exactly where you're losing money.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Server Architecture Setup",
    desc: "We deploy a custom GTM Server Container via Stape.io or Google Cloud. This bypasses browser limitations with first-party cookies and custom domain mapping.",
    icon: <Settings2 className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Precision Validation",
    desc: "Through real-time server debugging, we ensure that GA4 and Meta CAPI events are firing with 100% deduplication and maximized match quality scores.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    number: "04",
    title: "Campaign Scaling",
    desc: "With clean data flowing, we optimize your Google Ads conversion signals. This results in a lower CPA and provides the data needed for automated bidding success.",
    icon: <TrendingUp className="w-6 h-6" />,
  }
]

export default function ServerProcessSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#030712] overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4"
          >
            <Activity size={14} /> The Workflow
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
            Our 4-Step Framework for <br />
            <span className="text-blue-600 italic">Server-Side Mastery.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto">
            A systematic approach to migrating your tracking from the fragile browser to a secure, first-party server environment.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[45%] left-0 w-full h-[1px] bg-slate-100 dark:bg-slate-800/50 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative"
              >
                {/* Step Card */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 group-hover:border-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/5 transition-all duration-500 h-full flex flex-col">
                  
                  {/* Icon & Number */}
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500">
                      {step.icon}
                    </div>
                    <span className="text-5xl font-black text-slate-100 dark:text-slate-800/20 transition-colors group-hover:text-blue-600/10 select-none">
                      {step.number}
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                    {step.desc}
                  </p>
                </div>
                
                {/* Mobile/Tablet Arrow Visualization */}
                {index !== steps.length - 1 && (
                    <div className="hidden md:flex lg:hidden justify-center my-4 text-blue-500/20">
                        <ArrowRight size={24} />
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 flex justify-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.25em]">
              Accepting {new Date().toLocaleString('default', { month: 'long' })} Audits • 3 Spots Left
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}