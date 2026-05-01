"use client"
import React, { useState, useEffect } from 'react'
import { motion, animate } from 'framer-motion'
import { ArrowRight, Target, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link';

// ১. নাম্বার কাউন্টার কম্পোনেন্ট
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function GoogleAdsHero() {
  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[110px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Side: Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start">
            
            {/* Tagline: Using keyword 'Certified Google Ads Partner' */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-8"
            >
              <Target size={14} /> Certified Google Ads Partner
            </motion.div>

            {/* H1 Optimization: Added 'Specialist' to target high volume keyword */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.05] mb-8"
            >
              Scale Your ROAS with a <span className="text-blue-600">Google Ads Specialist</span>
            </motion.h1>

            {/* Paragraph Optimization: Target 'hire google ads expert' intent and 'Audit' */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl lg:max-w-none mb-10"
            >
              Stop losing money on ineffective clicks. Hire a Google Ads expert to perform a professional account audit and build high-converting campaigns that drive real revenue.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              {/* Primary Action: Audit Keyword Focus */}
              <Link href="/book-audit" className="w-full sm:w-auto px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group">
                Free Google Ads Audit <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                View Case Studies
              </button>
            </motion.div>
          </div>

          {/* Right Side: Visual Evidence */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-blue-500/5 border border-slate-100 dark:border-slate-800/50">
              
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Ads Performance Dashboard</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time Campaign Data</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> High ROAS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Total Conversion Value</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    $<AnimatedNumber value={14500} />
                  </p>
                </div>
                <div className="p-6 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mb-1">Target ROAS</p>
                  <p className="text-3xl font-black text-white">5.8x</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Revenue Growth</p>
                    <TrendingUp className="text-emerald-500" size={18} />
                </div>
                
                <svg viewBox="0 0 100 30" className="w-full h-auto">
                    <motion.path 
                        d="M0 30 L10 25 L20 28 L30 20 L40 22 L50 12 L60 15 L70 5 L80 8 L90 0 L100 2"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                </svg>
              </div>
            </div>

            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 z-20"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">Audit Success</p>
                <p className="text-[10px] font-bold text-emerald-500">+115% Sales Increase</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}