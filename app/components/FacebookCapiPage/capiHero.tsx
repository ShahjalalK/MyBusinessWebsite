"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, BarChart3, Zap, ArrowRight, MousePointerClick, DatabaseZap } from 'lucide-react'
import { FaFacebook } from 'react-icons/fa'
import Link from 'next/link'

export default function CapiHero() {
  return (
    <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-36 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Premium Background Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] -z-10 translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] -z-10 -translate-x-1/4 translate-y-1/4"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Column: SEO Optimized Content */}
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.25em]"
            >
              <FaFacebook size={18} className="text-[#1877F2] animate-pulse" /> 
              Meta Conversions API Specialist
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85]"
              >
                Fix Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1877F2] via-blue-500 to-cyan-400">
                  Facebook CAPI.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-600 dark:text-slate-400 max-w-xl font-medium leading-relaxed"
              >
                Don't let iOS 14+ and ad-blockers kill your ROAS. I provide professional <strong>Facebook Conversion API (CAPI)</strong> and <strong>Meta Conversions API</strong> setup via GTM Server-Side to recover 100% of your lost data signals.
              </motion.p>
            </div>

            {/* Optimized CTA Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-5"
            >
              <Link 
                href="/book-audit" 
                className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-blue-500/25 hover:scale-[1.03] active:scale-95 w-fit"
              >
                Book Free CAPI Audit <ArrowRight size={22} />
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white px-10 py-5 rounded-[2rem] font-black text-lg transition-all border border-slate-200 dark:border-slate-800 w-fit"
              >
                Get Consultation
              </Link>
            </motion.div>

            {/* Live Trust Metrics */}
            <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                <ShieldCheck size={18} className="text-emerald-500" /> Server-Side Verified
              </div>
              <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                <DatabaseZap size={18} className="text-blue-500" /> Meta Partner Level
              </div>
              <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                <Zap size={18} className="text-orange-500" /> Lower CPA
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Visual Comparison */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-[520px]"
            >
              {/* Background Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 rounded-full blur-[80px] animate-pulse"></div>
              
              <div className="relative z-10 flex flex-col gap-6">
                
                {/* Error/Browser Pixel Card */}
                <motion.div 
                  whileHover={{ x: -10 }}
                  className="p-8 bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-red-100 dark:border-red-900/20 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 transition-transform group-hover:rotate-12">
                      <Activity size={28} />
                    </div>
                    <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-600 px-3 py-1 rounded-full uppercase tracking-tighter">Unreliable</span>
                  </div>
                  <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2">Standard Browser Pixel</h4>
                  <p className="text-sm text-slate-500 mb-6 leading-snug">Blocked by ITP, iOS 14, and Ad-Blockers.</p>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "55%" }}
                      className="h-full bg-red-500"
                    />
                  </div>
                  <p className="mt-3 text-xs font-black text-red-500 uppercase tracking-widest">~45% Signal Loss</p>
                </motion.div>

                {/* Success/CAPI Card */}
                <motion.div 
                  whileHover={{ x: 10 }}
                  className="p-8 bg-[#041f60] rounded-[2.5rem] shadow-[0_20px_60px_rgba(4,31,96,0.3)] border border-blue-400/20 relative overflow-hidden self-end w-[90%] -mt-12 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-300 transition-transform group-hover:-rotate-12">
                      <BarChart3 size={28} />
                    </div>
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter">100% Signal Match</span>
                  </div>
                  <h4 className="font-black text-xl text-white mb-2">Meta Conversions API</h4>
                  <p className="text-sm text-blue-200/70 mb-6 leading-snug">Direct Server-to-Server tracking with zero data loss.</p>
                  <div className="h-2 w-full bg-white/10 rounded-full">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-emerald-400 shadow-[0_0_15px_#34d399]"
                    />
                  </div>
                  <p className="mt-3 text-xs font-black text-emerald-400 uppercase tracking-widest italic">Accurate Attribution</p>
                </motion.div>
              </div>

              {/* Central Sync Icon */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-dashed border-blue-500/30 flex items-center justify-center z-20 bg-white dark:bg-slate-950 shadow-2xl"
              >
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <Zap size={32} className="fill-current" />
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}