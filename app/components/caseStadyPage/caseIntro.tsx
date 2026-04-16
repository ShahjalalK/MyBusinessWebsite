"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Info, ShieldCheck, Cpu } from 'lucide-react'

export default function CaseStudyIntro() {
  return (
    <section className="py-12 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative p-8 md:p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
            
            {/* Left Side: Icon Decor */}
            <div className="flex-shrink-0 w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
              <Cpu size={32} className="animate-pulse" />
            </div>

            {/* Right Side: Content */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] mb-3">
                <ShieldCheck size={14} /> Transparency Note
              </div>
              
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-3">
                How We Showcase Our Expertise
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                These case studies are based on <span className="text-slate-900 dark:text-white font-bold underline decoration-blue-500/30">demo implementations</span> created to demonstrate exactly how our tracking systems work in real-world scenarios. Our goal is to show you the technical precision and data accuracy we bring to every project.
              </p>
            </div>

            {/* Floating Badge (Visual Polish) */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
              <Info size={12} /> Technical Audit Ready
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}