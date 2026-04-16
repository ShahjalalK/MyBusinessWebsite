"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Send, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link';

const MotionLink = motion(Link);

export default function CTASection() {
  return (
    <section className="relative py-24 bg-blue-600 overflow-hidden rounded-[3rem] mx-4 md:mx-10 mb-20 shadow-2xl shadow-blue-500/20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-[40%] h-[100%] bg-white/5 -skew-x-12 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-[100px]" />
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <motion.span 
            className="inline-block py-2 px-6 rounded-full bg-blue-500/30 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-8 border border-white/10"
          >
            Limited Availability for Q2 2026
          </motion.span>
          
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.1]">
            Ready to Recover Your <br />
            <span className="text-blue-200">Missing Data?</span>
          </h2>
          
          <p className="text-blue-50/80 mb-12 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Stop leaving money on the table. Join 50+ businesses who are already using our Server-Side setup to bypass iOS 14+ restrictions.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <MotionLink href="/book-audit"
              whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
               
              className="group flex items-center gap-3 bg-white text-blue-600 font-black py-5 px-10 rounded-2xl transition-all uppercase tracking-wider text-xs"
            >
              Get My Free Audit <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </MotionLink>

            <MotionLink href="/book-audit" 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
             
              className="group flex items-center gap-3 bg-blue-700/40 text-white border border-white/20 font-black py-5 px-10 rounded-2xl hover:bg-blue-700/60 transition-all uppercase tracking-wider text-xs"
            >
              <Calendar className="w-4 h-4" /> Book Strategy Call
            </MotionLink>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-60">
             <div className="flex flex-col items-center">
                <span className="text-white font-black text-xl">24h</span>
                <span className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Avg. Response</span>
             </div>
             <div className="w-[1px] h-10 bg-white/20" />
             <div className="flex flex-col items-center">
                <span className="text-white font-black text-xl">100%</span>
                <span className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Data Privacy</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}