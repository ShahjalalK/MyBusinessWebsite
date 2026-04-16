"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Clock, ShieldCheck, Zap, BellRing } from 'lucide-react'

export default function ContactQuickResponsePromise() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden"
        >
          {/* Animated Pulse Dot */}
          <div className="absolute top-8 right-8 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Online Now</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left Icon Section */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <Clock size={44} className="text-white animate-pulse" />
              </div>
            </div>

            {/* Content Section */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-3">
                <ShieldCheck size={14} /> Quick Response Promise
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                No More Waiting for Days.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed">
                I value your time as much as you do. Whether it's a project inquiry or a technical question, <span className="text-blue-600 dark:text-blue-400 font-bold">I usually respond within 24 hours.</span>
              </p>

              {/* Confidence Badges */}
              <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Zap size={16} className="text-orange-500" /> Instant Notification
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <BellRing size={16} className="text-blue-500" /> Dedicated Attention
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
        </motion.div>
      </div>
    </section>
  )
}