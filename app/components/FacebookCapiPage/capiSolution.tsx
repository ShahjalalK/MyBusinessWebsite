"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaServer, FaCheckDouble, FaSync, FaShieldAlt } from 'react-icons/fa'
import { HiOutlineLightBulb } from 'react-icons/hi'
import { Database, Laptop, Layers, BarChart3 } from 'lucide-react'

const solutions = [
  {
    icon: FaServer,
    title: "Meta Conversions API (CAPI)",
    desc: "Implementing a robust server-to-server connection that bypasses browser restrictions, ensuring 100% of your customer actions are tracked accurately."
  },
  {
    icon: FaSync,
    title: "Server-Side Tagging via GTM",
    desc: "Setting up a secure GTM Server-Side container to create a private data stream, improving website speed and data privacy compliance."
  },
  {
    icon: FaCheckDouble,
    title: "Advanced Event Deduplication",
    desc: "Configuring redundant tracking (Browser + Server) with smart deduplication to prevent double-counting while ensuring zero data loss."
  },
  {
    icon: FaShieldAlt,
    title: "High Event Match Quality (EMQ)",
    desc: "Optimizing user data parameters like FBP, FBC, and hashed emails to achieve a high Match Quality Score for better Facebook Ad targeting."
  }
];

export default function CapiSolutionSection() {
  return (
    <section className="py-28 bg-white dark:bg-slate-950 relative overflow-hidden">
      
      {/* Dynamic Background Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-20 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.25em]"
          >
            <HiOutlineLightBulb size={16} className="animate-bounce" /> The CAPI Framework
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
            Bulletproof Data <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              For Your Meta Ads.
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            I help you migrate to a high-performance <strong>server side tagging GTM</strong> infrastructure, ensuring your pixel delivers the data Meta's algorithm needs to scale.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {solutions.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="group p-10 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] hover:bg-white dark:hover:bg-slate-900 hover:shadow-[0_30px_100px_rgba(37,99,235,0.08)] transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Icon Container */}
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shrink-0">
                  <item.icon />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {item.desc}
                  </p>
                  
                  {/* Subtle Link/Indicator */}
                  <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Technical Excellence <BarChart3 size={12} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech Stack Indicator */}
        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-900 flex flex-wrap justify-center gap-10 opacity-40 grayscale group-hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Database size={16}/> Stape.io / Google Cloud</div>
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Layers size={16}/> GTM Server-Side</div>
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Laptop size={16}/> Meta Business SDK</div>
        </div>
      </div>
    </section>
  )
}