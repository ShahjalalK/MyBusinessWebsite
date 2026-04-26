"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaShieldAlt, FaInfoCircle } from 'react-icons/fa'
import { HiLightningBolt } from 'react-icons/hi'
import { CheckCircle2, TrendingUp } from 'lucide-react'

export default function CapiWinningStrategy() {
  return (
    /* ১. pt-36 যোগ করা হয়েছে যাতে উপরের সেকশন থেকে টাইটেলটির জন্য পর্যাপ্ত জায়গা থাকে */
    /* ২. z-10 যোগ করা হয়েছে যাতে এই সেকশনটি ওপরের লেয়ারে থাকে */
    <section className="py-24 pt-36 bg-[#fafbfc] dark:bg-slate-950/20 relative z-10">
      <div className="container mx-auto px-6">
        
        <div className="max-w-6xl mx-auto">
          {/* ৩. overflow-visible করা হয়েছে, এতে -top-6 এ থাকা ব্যাজটি আর কেটে যাবে না */}
          <div className="relative p-10 md:p-20 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(37,99,235,0.05)] overflow-visible">
            
            {/* Background Glow Effect */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Strategy Badge */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/40 flex items-center gap-3 z-20 whitespace-nowrap"
            >
              <HiLightningBolt className="text-lg animate-pulse" /> My Winning Strategy
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
              
              {/* Left Content: The Hook */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center gap-3 text-blue-600">
                  <FaInfoCircle className="text-xl" />
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">Data Intelligence Insight</span>
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tighter">
                  Recover What <br /> 
                  <span className="text-blue-600">iOS 14+ Stole </span> 
                  From You.
                </h2>

                <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg md:text-xl leading-relaxed">
                  My specialized approach to <strong>gtm server side tracking</strong> doesn't just "fix" a pixel—it restores the broken intelligence of your marketing ecosystem. 
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {[
                    "Bypass Browser Limitations",
                    "Improve Ad Optimization AI",
                    "100% Data Privacy Compliance",
                    "Advanced Event Matching"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content: Advanced Visual Metric */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div className="w-56 h-56 md:w-64 md:h-64 bg-slate-50 dark:bg-slate-800/50 rounded-[3.5rem] flex flex-col items-center justify-center relative z-10 border border-slate-100 dark:border-slate-800 transition-transform group-hover:-translate-y-2 duration-500">
                    <TrendingUp className="text-blue-600 mb-4" size={40} />
                    <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                      +40%
                    </span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">
                      Accuracy Boost
                    </span>
                    
                    {/* Floating Shield Icon */}
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                       <FaShieldAlt size={24} />
                    </div>
                  </div>
                  
                  {/* Outer Animated Ring */}
                  <div className="absolute -inset-4 border-2 border-dashed border-blue-600/20 rounded-[4rem] animate-[spin_20s_linear_infinite]" />
                  <div className="absolute -inset-8 border border-blue-600/5 rounded-[4.5rem]" />
                </motion.div>
              </div>

            </div>

            {/* Bottom Proof Line */}
            <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400 italic">
                        User
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[11px] font-black text-white">
                      +50
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden md:block" />
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    Trusted by Global <br /> <span className="text-blue-600">E-commerce Brands</span>
                  </p>
                </div>

                <div className="px-6 py-3 bg-blue-600/5 dark:bg-blue-600/10 rounded-2xl border border-blue-600/10">
                   <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                     Scaling precision with ga4 server side tracking
                   </p>
                </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}