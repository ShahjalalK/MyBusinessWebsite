"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Globe, Server, ArrowRight, ShieldCheck, Zap, HelpCircle } from 'lucide-react'

export default function ServerSimpleExplanation() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest mb-4"
          >
            <HelpCircle size={14} /> The Basics
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            What is Server-Side Tracking?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Simply put, it's moving your data collection from the customer's messy browser to your own secure cloud server.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Browser Tracking (The Old Way) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative group"
          >
            <div className="absolute -top-5 right-10 px-4 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">The Old Way</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Browser-Side Tracking</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
              Data is sent directly from the user's browser (Chrome, Safari) to platforms like Facebook or Google.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-red-500 font-bold">✕</span> Blocked by Ad-blockers easily.
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-red-500 font-bold">✕</span> iOS 14+ kills your tracking cookies.
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-red-500 font-bold">✕</span> Slows down your website speed.
              </li>
            </ul>
          </motion.div>

          {/* Server Tracking (The New Way) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-8 rounded-[2.5rem] bg-blue-600 relative group shadow-2xl shadow-blue-500/20"
          >
            <div className="absolute -top-5 right-10 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full">The New Way</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <Server size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Server-Side Tracking</h3>
            </div>
            <p className="text-blue-50 mb-6 font-medium">
              Data goes to YOUR server first, then you choose what to send to Facebook or Google Ads.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-blue-100">
                <Zap size={16} className="text-emerald-400 shrink-0" /> Invisible to Ad-blockers.
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-100">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> Full control over data privacy.
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-100">
                <ArrowRight size={16} className="text-emerald-400 shrink-0" /> Extends cookie life up to 2 years.
              </li>
            </ul>
          </motion.div>

        </div>

        {/* Why it Matters Summary */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Better ROAS</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Accurate data means ad platforms optimize better for your budget.</p>
            </div>
            <div className="text-center border-y md:border-y-0 md:border-x border-slate-200 dark:border-slate-800 py-6 md:py-0">
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Site Speed</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Fewer scripts in the browser means your website loads much faster.</p>
            </div>
            <div className="text-center">
              <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Privacy First</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Full GDPR/CCPA compliance by controlling what data is shared.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}