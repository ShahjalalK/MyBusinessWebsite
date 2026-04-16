"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaCalendarCheck, FaArrowRight } from 'react-icons/fa'
import Link from 'next/link'

export default function CapiFinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-white dark:bg-slate-950"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent opacity-50"></div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-[#041f60] rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-900/40"
        >
          {/* Subtle Abstract Shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-3xl mx-auto space-y-8">
            <motion.div 
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Ready to Recover Your Data?
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Stop Losing Valuable Data. <br />
              <span className="text-cyan-400 italic">Fix Your Tracking Today.</span>
            </h2>

            <p className="text-blue-100/70 text-lg font-medium max-w-2xl mx-auto">
              Don't let ad-blockers and iOS updates burn your budget. Get a professional Facebook CAPI setup and start scaling your ads with 100% confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link 
                href="/book-audit" 
                className="group bg-white text-[#041f60] px-10 py-5 rounded-2xl font-black text-xl hover:bg-cyan-400 hover:text-[#041f60] transition-all duration-300 flex items-center gap-3 shadow-xl active:scale-95 w-full sm:w-auto justify-center"
              >
                <FaCalendarCheck /> Book Free Consultation
              </Link>
              
              <Link 
                href="/contact" 
                className="text-white font-black text-lg hover:text-cyan-400 transition-colors flex items-center gap-2 group"
              >
                Contact Us <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-8 opacity-50 grayscale contrast-125">
               {/* এখানে আপনি ছোট ছোট টেক্সট বা ট্রাস্ট ব্যাজ দিতে পারেন */}
               <span className="text-white text-[10px] font-black uppercase tracking-widest">No Hidden Costs</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">100% Data Security</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">Fast 5-Day Setup</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}