"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaPlayCircle, FaChartBar, FaUserCheck, FaAward } from 'react-icons/fa'
import { HiTrendingUp } from 'react-icons/hi'

const stats = [
  { label: "Data Accuracy", value: "99.9%", icon: <HiTrendingUp /> },
  { label: "Projects Completed", value: "50+", icon: <FaAward /> },
  { label: "Client Satisfaction", value: "100%", icon: <FaUserCheck /> },
  { label: "ROAS Boost Up to", value: "35%", icon: <FaChartBar /> },
];

export default function CapiProofSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Video Audit / Project Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
              {/* Replace the URL with your actual thumbnail image */}
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                alt="Tracking Audit Proof" 
                className="w-full h-auto grayscale-[20%] group-hover:grayscale-0 transition-all"
              />
              <a 
                href="https://youtu.be/AJkLYgQM4Aw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-[#041f60]/40 group hover:bg-[#041f60]/20 transition-all"
              >
                <div className="flex flex-col items-center gap-4">
                  <FaPlayCircle className="text-white text-7xl drop-shadow-2xl animate-pulse" />
                  <span className="bg-white text-[#041f60] px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-xl">
                    Watch Audit Proof
                  </span>
                </div>
              </a>
            </div>
            
            {/* Decorative Card over image */}
            <div className="absolute -bottom-10 -right-6 md:-right-10 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl z-20 max-w-[240px] border border-slate-100 dark:border-slate-800">
               <p className="text-xs font-black text-blue-600 uppercase mb-2">Case Study</p>
               <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                 Toledo Dog Training Audit
               </h4>
               <p className="text-[11px] text-slate-500 mt-2 font-medium">
                 Identified 40% data loss and fixed event deduplication issues.
               </p>
            </div>
          </motion.div>

          {/* Right: Content & Stats */}
          <div className="space-y-10">
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]"
              >
                Proven Track Record
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                I Don't Just Claim. <br />
                <span className="text-blue-600">I Deliver Real Results.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                With years of experience in Server-Side tracking, I have helped businesses recover lost data and improve their ad performance by fixing fundamental tracking issues.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="text-blue-600 text-2xl mb-3">{stat.icon}</div>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {stat.value}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}