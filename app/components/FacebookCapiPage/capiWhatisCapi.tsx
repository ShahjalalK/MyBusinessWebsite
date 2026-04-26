"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaGlobe, FaServer, FaExchangeAlt, FaShieldVirus } from 'react-icons/fa'
import { BsArrowRightCircleFill, BsCheck2Circle } from 'react-icons/bs'
import { ShieldAlert, Zap } from 'lucide-react'

export default function CapiWhatIsCAPI() {
  return (
    <section className="py-28 bg-[#f8fafc] dark:bg-slate-950/50 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Title Section */}
        <div className="max-w-4xl mb-20 space-y-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]"
          >
            Decoding <br /> 
            <span className="text-blue-600">Meta Conversions API.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed"
          >
            Think of it as a <span className="text-slate-900 dark:text-white font-bold italic">Private Data Bridge</span> that connects your website server directly to Meta, bypassing browser restrictions and ad-blockers.
          </motion.p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Browser Tracking Card (The Problem) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">
              <ShieldAlert size={120} className="text-red-500" />
            </div>
            
            <div className="inline-block px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-500 mb-8 tracking-widest">
              Legacy Method
            </div>
            
            <FaGlobe className="text-5xl text-slate-300 mb-8" />
            <h3 className="text-2xl font-black text-slate-400 dark:text-slate-600 mb-6 line-through decoration-red-500/50 decoration-4">Standard Browser Pixel</h3>
            
            <ul className="space-y-4">
              {['Blocked by Ad-blockers', 'Killed by Apple iOS 14+', '7-Day Cookie Limitation'].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-xs">✕</span>
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connection Animation - Hidden on mobile */}
          <div className="lg:col-span-2 flex flex-col justify-center items-center gap-4 text-blue-600/30 hidden lg:flex">
             <Zap size={32} className="animate-pulse text-blue-500" />
             <div className="w-[2px] h-32 bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
          </div>

          {/* CAPI Tracking Card (The Solution) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 p-10 bg-[#041f60] text-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(4,31,96,0.4)] relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:-rotate-12 transition-transform">
              <FaServer size={120} className="text-blue-400" />
            </div>

            <div className="inline-block px-4 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase text-white mb-8 tracking-widest shadow-lg">
              2026 Recommended
            </div>
            
            <FaServer className="text-5xl text-blue-400 mb-8" />
            <h3 className="text-3xl font-black mb-6 tracking-tight">Meta Conversion API</h3>
            
            <ul className="space-y-4">
              {[
                '100% Reliable Server-Side Tracking',
                'Zero Impact from Ad-blockers',
                'Extended Data Retention (Up to 180 Days)',
                'Enhanced Event Match Quality'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-blue-100 font-bold text-sm">
                  <BsCheck2Circle className="text-green-400 text-xl shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Analogy & Why it matters */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                 <FaShieldVirus className="text-blue-600" /> Why it matters for your ROI?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Imagine running a shop where 4 out of 10 customers are invisible. You wouldn't know which products are selling or who to invite back. 
                <br /><br />
                <strong>Facebook CAPI</strong> removes that blindfold. It tells Meta exactly who bought what, so the AI can find you more high-value customers at a lower cost.
              </p>
            </div>
            <div className="bg-blue-600/5 p-8 rounded-[2rem] border border-blue-600/10">
              <p className="text-blue-700 dark:text-blue-300 font-black text-lg leading-snug">
  "Without CAPI, your pixel is only seeing 60% of the truth. In {new Date().getFullYear()}, data accuracy is your biggest competitive advantage."
</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}