"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, ArrowRight, ShieldCheck, TrendingUp, Mail, Sparkles } from 'lucide-react'

export default function AboutCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic Background Decor */}
      <div className="absolute inset-0 bg-blue-600 dark:bg-blue-700 z-0" />
      <div className="absolute inset-0 opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row items-center gap-16 border border-white/10"
        >
          
          <div className="flex-1 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">Partner with an expert agency</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[1.05]">
              Stop Guessing. <br /> 
              <span className="text-blue-600">Start Scaling.</span>
            </h2>
            
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-2xl">
              From performing deep-dive <span className="text-slate-900 dark:text-white font-bold">Google Ads audits</span> to deploying advanced <span className="text-slate-900 dark:text-white font-bold">Server-Side tracking</span>—we provide the technical infrastructure your business needs to drive sustainable growth.
            </p>

            {/* Service Tags Optimized for USA Market */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-12">
              {[
                { icon: <TrendingUp size={14} />, label: "Ads Management" },
                { icon: <ShieldCheck size={14} />, label: "Tracking & CAPI" },
                { icon: <Mail size={14} />, label: "Email Solutions" }
              ].map((tag, i) => (
                <span key={i} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest transition-colors hover:border-blue-500/50">
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link href="/book-audit" className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 group">
                Book a Technical Audit <Calendar size={22} className="group-hover:rotate-12 transition-transform" />
              </Link>
              
              <Link href="/contact" className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-6 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-blue-500/50">
                Contact Our Team <ArrowRight size={22} />
              </Link>
            </div>
          </div>

          {/* Right Side: Agency Trust Metrics */}
          <div className="w-full lg:w-80 space-y-6">
            <motion.div 
              whileHover={{ x: 10 }}
              className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] border border-blue-100 dark:border-blue-800 transition-all"
            >
              <div className="text-5xl font-black text-blue-600 mb-2 tracking-tighter">High</div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-tight">Data Integrity <br />& Tracking</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ x: 10 }}
              className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-all"
            >
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Fast</div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-tight">Agency Support <br />Turnaround</div>
            </motion.div>

            <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
              Trusted by 50+ Global Clients
            </p>
          </div>

        </motion.div>
      </div>
    </section>
  )
}