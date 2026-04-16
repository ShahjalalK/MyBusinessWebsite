"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, ArrowRight, Sparkles, MousePointerClick, BarChart3 } from 'lucide-react'

export default function CaseStudyCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
      
      {/* Background Visual Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900 dark:bg-blue-600 rounded-[4rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/20"
          >
            {/* Inner Decorative Elements */}
            <div className="absolute top-0 right-0 p-10 opacity-10">
                <BarChart3 size={200} className="text-white rotate-12" />
            </div>

            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-white/20"
              >
                <Sparkles size={16} className="text-yellow-400" /> Let's Optimize Your Ads
              </motion.div>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
                Want Accurate Tracking <br />
                <span className="text-blue-400 dark:text-blue-200">for Your Business?</span>
              </h2>

              <p className="text-xl md:text-2xl text-blue-100/80 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
                If you're running ads but unsure about your data accuracy, we can help you set up a reliable tracking system that recovers lost conversions.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  href="/booking" 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-6 bg-white text-blue-600 rounded-3xl font-black text-lg transition-all hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-xl group"
                >
                  Get Free Tracking Audit 
                  <MousePointerClick size={22} className="group-hover:animate-bounce" />
                </Link>

                <Link 
                  href="/contact" 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-6 bg-transparent border-2 border-white/30 text-white rounded-3xl font-black text-lg hover:bg-white/10 transition-all group"
                >
                  Contact Me <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Bottom Trust Note */}
              <p className="mt-10 text-white/40 font-bold text-xs uppercase tracking-[0.2em]">
                ⚡ Limited availability for April technical audits
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}