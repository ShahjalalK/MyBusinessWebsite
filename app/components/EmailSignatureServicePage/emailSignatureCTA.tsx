"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

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

          {/* Heading */}
          <h2 className="text-3xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-[1.1]">
            Upgrade Your Email <br className="hidden md:block" /> 
            Signature Today
          </h2>
          
          <p className="text-blue-100/70 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Don't let a broken signature ruin your professional impression. 
            Get a high-converting, hand-coded HTML signature that works everywhere.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link 
              href="/contact" 
              className="group bg-[#ff6a00] hover:bg-[#e65f00] text-white px-12 py-5 rounded-full font-black text-lg transition-all flex items-center gap-3 shadow-xl shadow-orange-900/40 w-full sm:w-auto justify-center"
            >
              Order Now <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            
            <Link 
              href="/contact" 
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-full font-black text-lg transition-all w-full sm:w-auto justify-center"
            >
              Contact Us
            </Link>
          </div>

          {/* Trust Features - USA Client Focused */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/10 pt-10">
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-bold uppercase tracking-widest">
              <CheckCircle2 size={18} className="text-green-400" /> 100% Hand-Coded
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-bold uppercase tracking-widest">
              <CheckCircle2 size={18} className="text-green-400" /> Fully Responsive
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-bold uppercase tracking-widest">
              <CheckCircle2 size={18} className="text-green-400" /> Clickable Links
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}