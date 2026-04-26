"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Send, Search, Rocket, ArrowRight, BarChart3, Fingerprint } from 'lucide-react'

export default function WhatHappensNext() {
  const steps = [
    {
      icon: <Send className="text-blue-600" size={30} />,
      title: "Direct Outreach",
      label: "Step 01",
      description: "Drop a message with your website URL or tracking goals. I'll acknowledge your request instantly.",
      gradient: "from-blue-500/20 to-transparent"
    },
    {
      icon: <Search className="text-orange-600" size={30} />,
      title: "Technical Analysis",
      label: "Step 02",
      description: "I perform a deep-dive audit of your current GTM/GA4 setup or Ad accounts to find leakages.",
      gradient: "from-orange-500/20 to-transparent"
    },
    {
      icon: <Rocket className="text-emerald-600" size={30} />,
      title: "Execution Plan",
      label: "Step 03",
      description: "Receive a transparent roadmap, fixed pricing, and a timeline to scale your business tracking.",
      gradient: "from-emerald-500/20 to-transparent"
    }
  ];

  return (
    <section className="py-28 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Subtle Patterns */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <Fingerprint size={12} /> Workflow Transparency
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-none"
          >
            How We Get <br />
            <span className="text-blue-600">Things Started.</span>
          </motion.h2>
          
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            A seamless 3-step process designed to take your tracking from <br className="hidden md:block" /> broken to high-performing in record time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto relative">
          {/* Decorative Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[22%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent z-0">
             <motion.div 
               initial={{ width: "0%" }}
               whileInView={{ width: "100%" }}
               transition={{ duration: 1.5, ease: "easeInOut" }}
               className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
             />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              {/* Icon Container with Glow */}
              <div className="relative mb-10">
                <div className={`absolute inset-0 bg-gradient-to-b ${step.gradient} blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative w-24 h-24 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                   {/* Step Number Badge */}
                   <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg">
                     0{index + 1}
                   </div>
                   {step.icon}
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {step.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed px-2">
                  {step.description}
                </p>
              </div>

              {/* Mobile Arrow */}
              {index < 2 && (
                <div className="md:hidden mt-12 mb-4 text-blue-500/30 animate-bounce">
                  <BarChart3 size={32} className="rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA for Reassurance */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 text-center"
        >
          <div className="inline-flex items-center gap-3 text-slate-400 dark:text-slate-500 text-sm font-bold bg-slate-50 dark:bg-slate-900/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            No upfront payment required for the initial technical review.
          </div>
        </motion.div>
      </div>
    </section>
  )
}