"use client"
import React, { useState, useEffect } from 'react'
import { motion, animate } from 'framer-motion'
import { ArrowRight, Zap, TrendingUp, DollarSign, ShieldCheck, BarChart3 } from 'lucide-react'
import Link from 'next/link';

// ১. স্মুথ নাম্বার কাউন্টার কম্পোনেন্ট
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2.5,
      ease: "circOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function GoogleAdsHero() {
  return (
    <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 bg-[#fcfdfe] dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Background Subtle Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[5%] right-[-5%] w-[35%] h-[35%] bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Side: Professional Authority Content */}
          <div className="w-full lg:w-[55%] text-center lg:text-left">
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-8"
            >
              <ShieldCheck size={14} /> Data Privacy & Tracking Specialist
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-8"
            >
              Maximize Your ROAS with <span className="text-blue-600">Precision Tracking.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10"
            >
              Stop flying blind with broken data. I help businesses bridge the iOS 14+ tracking gap using <span className="text-slate-900 dark:text-slate-200 font-bold">Advanced GA4 Server-Side & Facebook CAPI</span> to drive scalable revenue.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5"
            >
              <Link href="/book-audit" className="w-full sm:w-auto px-8 py-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3 group">
                Book My Free Audit <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="w-full sm:w-auto px-8 py-4.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm">
  <MessageSquare size={18} className="text-blue-600" /> 
  Contact Us Directly
</Link>
            </motion.div>
          </div>

          {/* Right Side: Data Evidence (Visual Trust) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full lg:w-[45%] relative"
          >
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800/50">
              
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Expert Tracking</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Server-Side Verified</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-emerald-500 text-sm font-black flex items-center justify-end gap-1">
                      <TrendingUp size={14} /> 99.9%
                   </p>
                   <p className="text-[8px] text-slate-400 font-bold uppercase">Data Accuracy</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-8">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Recovered Value</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    $<AnimatedNumber value={24850} />
                  </p>
                </div>
                <div className="p-5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <p className="text-[9px] text-blue-100 font-bold uppercase tracking-wider mb-2">Campaign ROAS</p>
                  <p className="text-2xl font-black text-white">6.4x</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Revenue Growth</span>
                    <span className="text-[10px] font-bold text-emerald-500">+142% vs Last Month</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-emerald-500" 
                    />
                 </div>
              </div>
            </div>

            {/* Floating Trust Badge */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 z-20"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">Conversion Boost</p>
                <p className="text-[10px] font-bold text-emerald-500">iOS 14+ Resolved</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}