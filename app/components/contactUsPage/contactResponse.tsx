"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Clock, ShieldCheck, Zap, BellRing, Sparkles } from 'lucide-react'

export default function ContactQuickResponsePromise() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-600/5 blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative"
        >
          {/* Main Card */}
          <div className="relative z-10 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-xl border border-blue-100/50 dark:border-blue-900/20 rounded-[3.5rem] p-8 md:p-16 overflow-hidden shadow-2xl shadow-blue-900/5">
            
            {/* Online Status Badge */}
            <div className="absolute top-10 right-10 flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">System Online</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Left Side: Visual Icon */}
              <div className="flex-shrink-0 relative">
                <motion.div 
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-28 h-28 bg-[#041f60] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-900/40 relative z-10"
                >
                  <Clock size={48} className="text-white" />
                </motion.div>
                {/* Decorative Ring */}
                <div className="absolute inset-0 border-2 border-blue-500/20 rounded-[2.5rem] scale-125 animate-pulse"></div>
              </div>

              {/* Right Side: Content */}
              <div className="text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                  <Sparkles size={14} /> Efficiency Guaranteed
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
                  Your Time is Gold. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">I Don't Waste It.</span>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
                  In the world of tracking and ads, seconds matter. I guarantee a 
                  <span className="text-slate-900 dark:text-white font-black mx-1.5 underline decoration-blue-500/30">personalized response within 24 hours</span> 
                  — no automated templates, just real solutions.
                </p>

                {/* Feature Pills */}
                <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-4">
                  {[
                    { icon: <Zap size={14} className="text-orange-500" />, text: "Instant Alerts" },
                    { icon: <BellRing size={14} className="text-blue-500" />, text: "Priority Support" },
                    { icon: <ShieldCheck size={14} className="text-emerald-500" />, text: "Direct Access" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm">
                      {item.icon}
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Decorative Graphic */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px]"></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}