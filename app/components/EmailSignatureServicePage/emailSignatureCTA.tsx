"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, Award, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

/**
 * SEO & CTA Optimization:
 * 1. Keywords: Professional HTML signature, Business branding, Clickable email identity.
 * 2. Focus: Instant conversion and platform trust.
 */

export default function EmailSignatureFinalCTA() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-[#041f60] rounded-[2.5rem] md:rounded-[4rem] p-10 md:p-24 relative overflow-hidden shadow-2xl shadow-blue-900/30 text-center"
        >
          {/* Background Decorative Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full -mr-40 -mt-40 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full -ml-40 -mb-40 blur-[100px]"></div>

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
              <Zap size={14} className="text-orange-400" fill="currentColor" /> Ready to transform your brand?
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[1] md:leading-[0.95]">
            Power-Up Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white italic font-serif">Email Identity.</span>
          </h2>
          
          <p className="text-blue-100/70 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop losing leads with broken or unprofessional signatures. Get a 
            <span className="text-white"> hand-coded HTML signature</span> that ensures your brand looks premium on every device.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
            <Link 
              href="/contact" 
              className="group bg-[#ff6a00] hover:bg-[#ff8c33] text-white px-12 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl shadow-orange-950/40 w-full sm:w-auto justify-center active:scale-95"
            >
              Order Your Project <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            
            <Link 
              href="/contact" 
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-2xl font-black text-lg transition-all w-full sm:w-auto justify-center flex items-center gap-2"
            >
              Consult an Expert
            </Link>
          </div>

          {/* Trust Features - USA/Global Client Focused */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/10 pt-10">
            <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={16} className="text-emerald-400" /> Spam-Safe Code
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
              <Award size={16} className="text-blue-400" /> 100% Satisfaction
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle2 size={16} className="text-orange-400" /> Outlook & Gmail Ready
            </div>
          </div>
        </motion.div>

        {/* Micro SEO Text */}
        <div className="mt-12 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-500 dark:text-slate-400">
            Clickable Signatures • Responsive HTML Coding • Digital Professionalism
          </p>
        </div>
      </div>
    </section>
  )
}