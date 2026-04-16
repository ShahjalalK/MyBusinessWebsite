"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaServer, FaCheckDouble, FaSync, FaShieldAlt } from 'react-icons/fa'
import { HiOutlineLightBulb } from 'react-icons/hi'

const solutions = [
  {
    icon: FaServer, // সরাসরি কম্পোনেন্ট পাস করছি
    title: "Facebook Conversion API (CAPI)",
    desc: "I set up a robust server-to-server connection that bypasses browser restrictions and ensures every conversion is recorded."
  },
  {
    icon: FaSync,
    title: "Server-Side Tracking Integration",
    desc: "Using Google Tag Manager (GTM) Server-Side, I create a private data stream that you own, increasing data privacy and accuracy."
  },
  {
    icon: FaCheckDouble,
    title: "Accurate Event Tracking",
    desc: "Setup of essential events like Purchase, Lead, AddToCart, and PageView with 100% signal match quality for better optimization."
  },
  {
    icon: FaShieldAlt,
    title: "Event Quality Score Fix",
    desc: "I optimize your event deduplication and match keys (Email, Phone, FBP/FBC) to achieve a high Event Quality Score on Facebook."
  }
];

export default function CapiSolutionSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>

      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest"
          >
            <HiOutlineLightBulb size={14} /> The Solution
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            Advanced Tracking That <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Actually Works.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            I help you transition from old-school browser pixels to high-performance server-side tracking, ensuring your Ads Manager gets the right data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {solutions.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              {/* নিচের ডিভ-এ group-hover:text-white আইকনের কালার পরিবর্তন করবে */}
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <item.icon />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}