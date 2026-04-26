"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Globe, Server, ArrowRight, ShieldCheck, Zap, HelpCircle } from 'lucide-react'

export default function ServerSimpleExplanation() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617] overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest mb-4"
          >
            <HelpCircle size={14} /> The Concept
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            What is Server-Side Tracking?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
            Think of it as moving your data collection from the messy, restricted world of web browsers to your own private, secure cloud server.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Browser Tracking (The Old Way) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative group"
          >
            <div className="absolute -top-5 right-10 px-4 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">Legacy Method</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Browser-Side Tracking</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Data is sent directly from the user's browser (Chrome, Safari) to platforms like Facebook or Google.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <span className="text-red-500">✕</span> High Signal Loss due to Ad-blockers.
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <span className="text-red-500">✕</span> iOS 14+ / ITP kills tracking cookies.
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <span className="text-red-500">✕</span> Third-party scripts slow down site speed.
              </li>
            </ul>
          </motion.div>

          {/* Server Tracking (The New Way) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-blue-600 relative group shadow-2xl shadow-blue-500/20"
          >
            <div className="absolute -top-5 right-10 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full">Modern Solution</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <Server size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Server-Side Tagging</h3>
            </div>
            <p className="text-blue-50 mb-8 font-medium">
              Data travels to YOUR secure server first, giving you full control over what reaches Google or Meta.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-blue-50 font-bold">
                <Zap size={18} className="text-emerald-400 shrink-0" /> 100% Invisible to Ad-blockers.
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-50 font-bold">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" /> Bypasses iOS 14 & Safari ITP limits.
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-50 font-bold">
                <ArrowRight size={18} className="text-emerald-400 shrink-0" /> Extends first-party cookies for months.
              </li>
            </ul>
          </motion.div>

        </div>

        {/* Impact Cards */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center group">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Zap size={20} />
              </div>
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Better ROAS</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Clean data allows ad platform AI to optimize perfectly for your budget.</p>
            </div>
            <div className="text-center group border-y md:border-y-0 md:border-x border-slate-200 dark:border-slate-800 py-10 md:py-0">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Zap size={20} />
              </div>
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Lightning Speed</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Moving tags to the server reduces browser load, boosting Core Web Vitals.</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Privacy First</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Full compliance with GDPR/CCPA by keeping user data on your own cloud.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}