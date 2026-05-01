"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Play, BarChart3, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default function MainSection() {
  const MotionLink = motion(Link);

  return (
    <main className="relative min-h-screen flex items-center bg-[#fdfeff] dark:bg-slate-950 overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-blue-50/40 dark:bg-blue-900/10 -skew-x-12 transform origin-top translate-x-32 -z-0 hidden lg:block" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-[140px] -z-0" />

      <div className="container mx-auto px-6 relative z-10 py-24">
        <div className="flex flex-wrap items-center -mx-4">
          
          {/* ১. লেফট কন্টেন্ট: হাই-কনভার্টিং কপিরাইটিং */}
          <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 py-2 px-4 mb-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">
                   Advanced Conversion Specialist
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-[1.05] tracking-tight">
                Scale Your Ads with <span className="text-blue-600">100% Data</span> Accuracy.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                I help businesses recover <span className="font-bold text-slate-900 dark:text-slate-200">30%+ lost data</span> due to iOS 14+ through GTM Server-Side Tracking and professional digital branding.
              </p>

              {/* Service Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  { icon: <ShieldCheck className="w-5 h-5 text-blue-500" />, text: "Server-Side Tracking" },
                  { icon: <BarChart3 className="w-5 h-5 text-indigo-500" />, text: "GA4 / GTM Specialist" },
                  { icon: <Zap className="w-5 h-5 text-amber-500" />, text: "Clickable Email Signature" },
                  { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, text: "Conversion Tracking" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <MotionLink href="/contact"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
                >
                  Get A Free Audit <ArrowRight className="w-5 h-5" />
                </MotionLink>
                
                <MotionLink href="#case-studies"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> View Case Studies
                </MotionLink>
              </div>
            </motion.div>
          </div>

          {/* ২. রাইট সাইড: গুগল অ্যাডস ড্যাশবোর্ড ইফেক্ট */}
          <div className="w-full lg:w-1/2 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Main Dashboard UI */}
              <div className="relative bg-[#0f172a] rounded-[2.5rem] p-6 shadow-2xl border-[10px] border-slate-800/50">
                
                {/* Dashboard Header */}
                <div className="flex justify-between items-center mb-10 px-2">
                  <div>
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Google Ads Campaign</h4>
                    <p className="text-white text-lg font-bold">Conversion Performance</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>

                {/* Animated Chart Bars */}
                <div className="flex items-end justify-between h-48 gap-2 mb-8 px-4">
                  {[40, 70, 45, 90, 65, 80, 95].map((height, i) => (
                    <div key={i} className="w-full bg-slate-800 rounded-t-lg relative group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className={`w-full rounded-t-lg ${i === 6 ? 'bg-blue-500' : 'bg-slate-700'} group-hover:bg-blue-400 transition-colors`}
                      />
                    </div>
                  ))}
                </div>

                {/* Real-time Metric Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">ROAS Increase</p>
                    <p className="text-2xl font-black text-green-400">+240%</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Data Mismatch</p>
                    <p className="text-2xl font-black text-blue-400">0.0%</p>
                  </div>
                </div>

                {/* Hovering Badge: Server Side Recovery */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -right-6 top-20 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Recovered</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">SST Active</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Decorative Circle */}
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>

        </div>
      </div>
    </main>
  )
}