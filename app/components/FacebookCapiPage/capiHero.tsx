"use client"
import React from 'react'
import { motion } from 'framer-motion'
// Lucide icons for functional UI
import { ShieldCheck, Activity, BarChart3, Zap, ArrowRight } from 'lucide-react'
// React Icons (FontAwesome) for Branding
import { FaFacebook } from 'react-icons/fa'
import Link from 'next/link'

export default function CapiHero() {
  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Background Decor: Facebook Blue Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Problem & Solution */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em]"
            >
              {/* React Icons version of Facebook */}
              <FaFacebook size={16} className="text-[#1877F2]" /> iOS 14+ Tracking Solution
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]"
              >
                Recover Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Lost Conversions.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-500 dark:text-slate-400 max-w-lg font-medium leading-relaxed"
              >
                Stop losing data to ad blockers and browser restrictions. I implement **Facebook Conversion API (CAPI)** to ensure 100% data accuracy and boost your ROAS.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link 
                href="/book-audit" 
                className="bg-[#041f60] hover:bg-blue-800 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl shadow-blue-900/20"
              >
                Book Free Audit <ArrowRight size={20} />
              </Link>
              <Link 
                href="/book-audit" 
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-black text-lg transition-all border border-slate-200 dark:border-slate-700"
              >
                Get Consultation
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={16} className="text-green-500" /> Server-Side Secured
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Zap size={16} className="text-orange-500" /> Lower CPA
              </div>
            </div>
          </div>

          {/* Right Column: Visual Concept */}
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10 w-full">
                {/* Pixel Data Card */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                    <Activity size={24} />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tighter">Browser Pixel</h4>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-[60%] animate-pulse"></div>
                  </div>
                  <p className="text-[10px] font-bold text-red-500">40% Data Loss</p>
                </motion.div>

                {/* CAPI Data Card */}
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="p-6 bg-[#041f60] rounded-[2rem] shadow-2xl border border-blue-500/20 space-y-4 translate-y-12"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                    <BarChart3 size={24} />
                  </div>
                  <h4 className="font-black text-sm text-white uppercase tracking-tighter">Server API</h4>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[100%]"></div>
                  </div>
                  <p className="text-[10px] font-bold text-green-400">100% Signal Match</p>
                </motion.div>
              </div>

              {/* Central Connection Icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white dark:bg-slate-950 rounded-full shadow-xl flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 z-20">
                <Zap className="text-orange-500 fill-current" size={24} />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}