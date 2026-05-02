"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  MessageSquare, 
  SearchCode 
} from 'lucide-react'
import Link from 'next/link'

// ১. MotionLink initialization
const MotionLink = motion(Link);

const SalesCounter = ({ target = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target.toString());
    const duration = 2000;
    const totalFrames = duration / 16;
    const increment = end / totalFrames;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span>${count.toLocaleString()}</span>;
};

export default function MainSection() {
  return (
    <main className="relative min-h-screen flex items-center bg-[#fcfdfe] dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-[#f1f5fe] dark:bg-blue-900/5 -skew-x-12 transform origin-top translate-x-32 -z-0 hidden lg:block" />

      <div className="container mx-auto px-6 relative z-10 py-12">
        <div className="flex flex-wrap items-center justify-center lg:justify-between -mx-4">
          
          <div className="w-full lg:w-[52%] px-4 mb-12 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 py-1.5 px-4 mb-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-[#4285F4] animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-slate-600 dark:text-slate-400 uppercase">
                    Google Marketing Platform & GA4 Specialist
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                Advanced <span className="text-[#4285F4]">GA4 Server Side</span> Tracking Expert.
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                Stop losing 30%+ data to iOS 14 updates. We bridge the gap between <span className="font-bold text-slate-900 dark:text-slate-200">client vs server side tracking</span> to maximize your Ad ROAS and conversion accuracy.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2 mb-10 max-w-md">
                {[
                  "GA4 Server-Side Setup",
                  "Facebook CAPI Expert",
                  "Conversion Tracking Audit",
                  "GTM & Data Layer Fix"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-bold text-[13px]">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4285F4]" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* Updated Buttons Section */}
              <div className="flex flex-wrap gap-4">
                <MotionLink href="/book-audit" 
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-3 transition-all text-sm group"
                >
                  <SearchCode className="w-5 h-5 opacity-90 group-hover:rotate-12 transition-transform" />
                  Get Free Tracking Audit 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </MotionLink>
                
                <MotionLink href="/contact"
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 text-sm shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-[#4285F4]" />
                    Consult With Expert
                  </MotionLink>
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-[45%] px-4 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[420px]" 
            >
              <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 overflow-hidden">
                
                <div className="flex justify-between items-center mb-8 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#4285F4] rounded-lg flex items-center justify-center shadow-md">
                        <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-tighter leading-none mb-1">Tracking Accuracy</h4>
                      <p className="text-slate-900 dark:text-white text-sm font-black leading-none">Server-Side Data</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#34a853] text-[13px] font-black flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +100%
                    </p>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-tighter">Verified Result</p>
                  </div>
                </div>

                <div className="relative h-44 mb-6 px-1">
                  <div className="absolute inset-0 flex flex-col justify-between z-0">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full border-t border-slate-100 dark:border-slate-800 h-0" />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex justify-between z-0">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-full border-l border-slate-100 dark:border-slate-800 w-0" />
                    ))}
                  </div>

                  <svg className="absolute inset-0 w-full h-full z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                      d="M 0 85 C 20 80, 35 60, 50 50 C 65 40, 80 25, 100 10"
                      fill="none"
                      stroke="#4285F4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                    />
                  </svg>

                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2 }}
                    className="absolute top-[8%] right-[0%] w-3 h-3 bg-[#4285F4] rounded-full border-2 border-white shadow-lg z-30" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-50 dark:border-white/5 text-center shadow-sm">
                    <p className="text-slate-400 text-[8px] font-black uppercase mb-1">Recovered Revenue</p>
                    <div className="text-md font-black text-slate-900 dark:text-white">
                      <SalesCounter target={24500} />
                    </div>
                  </div>
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-50 dark:border-white/5 text-center shadow-sm">
                    <p className="text-slate-400 text-[8px] font-black uppercase mb-1">Data Precision</p>
                    <p className="text-md font-black text-[#4285F4]">99.9%</p>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-3 bg-[#34a853] text-white py-2.5 px-5 rounded-xl shadow-xl shadow-green-500/20 flex items-center gap-2 z-30 border border-white/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">CAPI Verified</span>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </main>
  )
}