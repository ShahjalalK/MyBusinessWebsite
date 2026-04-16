"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, ArrowRight, ShieldCheck, TrendingUp, Mail } from 'lucide-react'

export default function AboutCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-blue-600 dark:bg-blue-700 z-0" />
      <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl flex flex-col lg:flex-row items-center gap-12">
          
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Let’s Scale Your Business <br /> 
              <span className="text-blue-600">With Precision.</span>
            </h2>
            
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-8">
              Whether it's data-driven **Google Ads**, privacy-first **Server-Side Tracking**, or a high-converting **Email Signature**—I bridge the gap between technical complexity and business growth.
            </p>

            {/* Service Tags */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10">
              {[
                { icon: <TrendingUp size={14} />, label: "Google Ads" },
                { icon: <ShieldCheck size={14} />, label: "GTM Server-Side" },
                { icon: <Mail size={14} />, label: "HTML Signature" }
              ].map((tag, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/booking" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/25 group">
                Book a Free Consultation <Calendar size={20} />
              </Link>
              
              <Link href="/contact" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Contact Me <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Right Side Stats/Trust Box */}
          <div className="w-full lg:w-72 space-y-4">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
              <div className="text-4xl font-black text-blue-600 mb-1">100%</div>
              <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Data Accuracy</div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">24/7</div>
              <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Server Uptime</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}