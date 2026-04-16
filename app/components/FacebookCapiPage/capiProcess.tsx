"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaClipboardCheck, FaPlug, FaMicroscope, FaRocket } from 'react-icons/fa'

const steps = [
  {
    icon: <FaClipboardCheck />,
    step: "01",
    title: "Detailed Tracking Audit",
    desc: "First, I analyze your existing Facebook Pixel and GTM setup to identify tracking leaks and data discrepancies.",
    color: "bg-blue-600"
  },
  {
    icon: <FaPlug />,
    step: "02",
    title: "CAPI & Server-Side Integration",
    desc: "I implement the Conversion API using GTM Server-Side and Cloud hosting to bypass browser restrictions and ad-blockers.",
    color: "bg-indigo-600"
  },
  {
    icon: <FaMicroscope />,
    step: "03",
    title: "Rigorous Testing & Validation",
    desc: "I use Facebook’s Test Events tool and GTM debugger to ensure every event is firing correctly and deduplication is perfect.",
    color: "bg-cyan-500"
  },
  {
    icon: <FaRocket />,
    step: "04",
    title: "Optimization & Final Handoff",
    desc: "Once data is flowing accurately, I optimize the Event Match Quality and provide you with a detailed technical report.",
    color: "bg-blue-800"
  }
];

export default function CapiProcessSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            My <span className="text-blue-600">4-Step</span> Proven Process.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            How I transform your broken tracking into a high-performance data engine in just a few days.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Connector Line (Hidden on Mobile) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>

          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative space-y-6 group"
            >
              {/* Step Circle */}
              <div className={`w-24 h-24 ${item.color} rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                {item.icon}
                <span className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-[#041f60] text-sm font-black shadow-lg border border-slate-100 dark:border-slate-800">
                  {item.step}
                </span>
              </div>

              {/* Step Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>

              {/* Progress Arrow (Hidden on Mobile/Last Item) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-4 text-slate-200 dark:text-slate-800 text-2xl">
                   →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Process Guarantee */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row items-center gap-6 justify-center"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
             <FaRocket />
          </div>
          <p className="text-[#041f60] dark:text-blue-300 font-bold text-center md:text-left">
            Estimated Delivery Time: <span className="text-blue-600">3 - 5 Business Days</span> for a full CAPI architecture.
          </p>
        </motion.div>

      </div>
    </section>
  )
}