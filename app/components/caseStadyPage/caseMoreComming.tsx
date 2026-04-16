"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Clock, Database, ChevronRight } from 'lucide-react'

export default function MoreComingSoon() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-16 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center"
          >
            {/* Background Blur Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Animated Icons */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                <Database size={24} className="text-blue-600" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20"
              >
                <Rocket size={32} />
              </motion.div>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                <Clock size={24} className="text-slate-400" />
              </div>
            </div>

            {/* Content */}
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
              The Innovation <span className="text-blue-600">Never Stops.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed mb-10">
              More case studies are being added as we continue building and testing new tracking systems. We are currently documenting advanced <span className="text-slate-900 dark:text-white font-bold">Predictive Analytics</span> and <span className="text-slate-900 dark:text-white font-bold">Server-Side Attribution</span> models.
            </p>

            {/* Progress Bar Visual */}
            <div className="w-full max-w-md bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
               <motion.div 
                 initial={{ width: "0%" }}
                 whileInView={{ width: "75%" }}
                 transition={{ duration: 2, ease: "easeInOut" }}
                 className="h-full bg-blue-600 rounded-full"
               />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
              New Case Studies: 75% Documented
            </span>

          </motion.div>

          {/* Bottom Trust Signal */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 font-black text-slate-500">
               <ChevronRight size={16} /> DATA AUDIT
             </div>
             <div className="flex items-center gap-2 font-black text-slate-500">
               <ChevronRight size={16} /> GTM SERVER-SIDE
             </div>
             <div className="flex items-center gap-2 font-black text-slate-500">
               <ChevronRight size={16} /> ADVANCED ATTRIBUTION
             </div>
          </div>

        </div>
      </div>
    </section>
  )
}