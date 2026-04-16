"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Clock, BookOpen, ShieldCheck } from 'lucide-react'

export default function FeaturedPost() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-xs mb-8">
          <Sparkles size={16} /> Featured Guide
        </div>

        {/* Main Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
          
          <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row items-center">
            
            {/* Left Side: Content */}
            <div className="flex-1 p-8 md:p-16">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase">
                  Technical Guide
                </span>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Clock size={14} /> 12 min read
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tighter">
                How to Set Up Accurate Tracking <br />
                <span className="text-blue-600">for Better Ad Performance</span>
              </h2>

              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-2xl">
                A complete step-by-step guide to setting up reliable tracking systems using GTM, GA4, and server-side tracking to improve your marketing results. Bypass ad-blockers and recover lost data easily.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  href="/blog/accurate-tracking-guide" 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 group/btn"
                >
                  Read Full Guide <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                
                {/* Micro Trust Factors */}
                <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                   <div className="flex items-center gap-1.5 text-emerald-500">
                      <ShieldCheck size={18} /> Verified Setup
                   </div>
                   <div className="w-1 h-1 bg-slate-300 rounded-full" />
                   <div className="flex items-center gap-1.5">
                      <BookOpen size={18} /> Detailed Docs
                   </div>
                </div>
              </div>
            </div>

            {/* Right Side: Visual Element (Fiverr Style Image/Design) */}
            <div className="w-full lg:w-[40%] h-[300px] lg:h-[600px] bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
               {/* এখানে আপনি আপনার GTM বা GA4 ড্যাশবোর্ডের একটি সুন্দর স্ক্রিনশট দিতে পারেন */}
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent z-10" />
               <img 
                  src="/blogFeature.png" 
                  alt="Tracking Setup Guide" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               />
               
               {/* Floating Icon Decor */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center z-20">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-2xl">
                     <BookOpen size={28} />
                  </div>
               </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}