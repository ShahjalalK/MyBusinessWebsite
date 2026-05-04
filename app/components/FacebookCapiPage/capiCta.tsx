"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaCalendarCheck, FaArrowRight, FaShieldAlt, FaRocket, FaClock } from 'react-icons/fa'
import Link from 'next/link'

export default function CapiFinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-[#020617]">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent opacity-40"></div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-[#041f60] via-[#063292] to-[#041f60] rounded-[4rem] p-10 md:p-20 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(4,31,96,0.5)] border border-white/10"
        >
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"
          />
          
          <div className="max-w-4xl mx-auto space-y-10 relative z-10">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-cyan-300 text-[11px] font-black uppercase tracking-[0.3em]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Next Step: Domain Dominance
            </motion.div>

            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] lg:px-10">
              Why Wait? <span className="text-cyan-400 italic font-medium">Hire a Certified</span> <br /> 
              <span className="underline decoration-blue-400/30 underline-offset-8">Google Ads Expert.</span>
            </h2>

            <p className="text-blue-100/80 text-xl font-bold max-w-2xl mx-auto leading-relaxed">
              Stop guessing and start tracking. Whether you need a <span className="text-white">google ads account audit</span> or a full-scale <span className="text-white text-underline decoration-cyan-400">facebook capi</span> implementation—I'm here to scale your ROAS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
              <Link 
                href="/book-audit" // আপনার ক্যালেন্ডলি লিঙ্ক এখানে দিন
                className="group relative bg-white text-[#041f60] px-12 py-6 rounded-[2rem] font-black text-xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 w-full sm:w-auto justify-center overflow-hidden"
              >
                <FaCalendarCheck className="text-blue-600 group-hover:scale-110 transition-transform" /> 
                Free Strategy Call
              </Link>
              
              <Link 
                href="/contact" 
                className="text-white font-black text-xl hover:text-cyan-400 transition-colors flex items-center gap-3 group"
              >
                Direct Message <FaArrowRight className="group-hover:translate-x-3 transition-transform text-cyan-400" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/10">
               <div className="flex items-center justify-center gap-3 text-white/60">
                 <FaShieldAlt className="text-cyan-400" />
                 <span className="text-[11px] font-black uppercase tracking-widest">100% Secure Data</span>
               </div>
               <div className="flex items-center justify-center gap-3 text-white/60">
                 <FaClock className="text-cyan-400" />
                 <span className="text-[11px] font-black uppercase tracking-widest">3-5 Day Delivery</span>
               </div>
               <div className="flex items-center justify-center gap-3 text-white/60">
                 <FaRocket className="text-cyan-400" />
                 <span className="text-[11px] font-black uppercase tracking-widest">ROAS Focused Audit</span>
               </div>
            </div>
          </div>
        </motion.div>
        
        {/* Final SEO Footer Hint */}
        <p className="text-center mt-12 text-slate-400 dark:text-slate-600 text-xs font-medium italic">
          Partner with a professional <span className="text-blue-500">google ads specialist</span> to implement <span className="text-blue-500">ga4 server side tracking</span> and scale your business globally.
        </p>
      </div>
    </section>
  )
}