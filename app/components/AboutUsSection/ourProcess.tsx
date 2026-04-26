"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, PenTool, Activity, Rocket, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "Deep Google Ads Audit",
    desc: "We perform a professional google ads account audit to detect data leakage and conversion gaps that drain your budget and lower your quality score.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Server-Side Blueprint",
    desc: "Our team designs a custom server side tagging gtm architecture and GA4 blueprint to bypass iOS signal loss and browser tracking blocks.",
    icon: <PenTool className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Precision Integration",
    desc: "Deployment of your measurement infrastructure using professional GTM containers and cloud hosting with 100% data accuracy for better AI learning.",
    icon: <Activity className="w-6 h-6" />,
  },
  {
    number: "04",
    title: "Scaling & ROAS Growth",
    desc: "With bulletproof data, we help you hire a google ads expert level management to optimize campaigns, lower CPA, and maximize your total ROAS.",
    icon: <Rocket className="w-6 h-6" />,
  }
]

export default function OurProcess() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent dark:from-blue-900/5 -z-0" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-6"
          >
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[9px]">Our Proven Workflow</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
            A Measurement Framework <br /> Built for <span className="text-blue-600">Global Scaling.</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            From technical auditing to complex server-to-server deployments, we provide the infrastructure needed to dominate Google Search and Shopping.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[45px] left-[10%] w-[80%] h-[2px] bg-slate-100 dark:bg-slate-800 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative flex flex-col items-center lg:items-start text-center lg:text-left group"
              >
                {/* Icon Wrapper */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-none group-hover:border-blue-500 transition-all duration-500 group-hover:-rotate-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                      {step.icon}
                    </div>
                  </div>
                  <span className="absolute -top-4 -right-4 text-5xl font-black text-slate-100 dark:text-slate-900/50 select-none group-hover:text-blue-500/10 transition-colors">
                    {step.number}
                  </span>
                </div>

                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Interactive Note: Targeted Audit Keyword */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-24 text-center"
        >
          <div className="inline-flex flex-col items-center gap-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold italic">
              Stop guessing and start measuring with 100% data accuracy.
            </p>
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-slate-900 dark:bg-blue-600 text-white shadow-2xl shadow-blue-500/20 hover:scale-105 transition-transform cursor-pointer">
              <span className="text-sm font-black uppercase tracking-widest">Get My Google Ads Audit</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}