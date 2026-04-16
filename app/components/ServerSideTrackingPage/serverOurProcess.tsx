"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, Settings2, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "Audit Current Tracking",
    desc: "We analyze your existing browser-side setup to identify data leaks caused by ad-blockers and iOS restrictions. We check for pixel accuracy and duplicate events.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Setup Server-Side Tracking",
    desc: "We configure your GTM Server Container using Stape or Google Cloud. This includes custom domain mapping to bypass tracking preventions and extend cookie life.",
    icon: <Settings2 className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Testing & Validation",
    desc: "Through GTM Preview mode and real-time debugging tools, we verify that every event (Purchase, Lead, etc.) is firing correctly from the server with 100% accuracy.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    number: "04",
    title: "Final Optimization",
    desc: "Once data flows perfectly, we optimize your Facebook CAPI and Google Ads to ensure the lowest possible CPA and the highest ROAS for your campaigns.",
    icon: <TrendingUp className="w-6 h-6" />,
  }
]

export default function ServerProcessSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 inline-block"
          >
            How It Works
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            The Roadmap to <span className="text-blue-600">Data Precision.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            A systematic 4-step approach to migrating your tracking from the browser to your own secure server.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[45%] left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />

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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group-hover:border-blue-500/50 group-hover:shadow-2xl group-hover:shadow-blue-500/10 transition-all duration-500 h-full">
                  
                  {/* Icon & Number */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {step.icon}
                    </div>
                    <span className="text-5xl font-black text-slate-100 dark:text-slate-800/50 transition-colors group-hover:text-blue-600/10 select-none">
                      {step.number}
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
                
                {/* Mobile/Tablet Arrow */}
                {index !== steps.length - 1 && (
                    <div className="hidden md:flex lg:hidden justify-center my-4 text-slate-200">
                        <ArrowRight size={24} className="rotate-90 md:rotate-0" />
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-20 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
              Currently taking new tracking audits for this month
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}