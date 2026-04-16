"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaRocket, FaCode, FaChartLine, FaCheckCircle } from 'react-icons/fa'
import { HiLightningBolt } from 'react-icons/hi'

export default function CapiUniqueAdvantage() {
  return (
    <section className="py-24 bg-[#041f60] relative overflow-hidden">
      
      {/* Background Abstract Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-0 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-0 -translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: The Combo Visual */}
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 pt-12">
                <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col items-center text-center space-y-3">
                  <FaChartLine className="text-blue-400 text-3xl" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Ads Strategy</span>
                </div>
                <div className="p-8 bg-blue-600 rounded-[2.5rem] flex flex-col items-center text-center space-y-3 shadow-2xl shadow-blue-600/20">
                  <FaRocket className="text-white text-3xl" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">CAPI Expert</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-8 bg-cyan-500 rounded-[2.5rem] flex flex-col items-center text-center space-y-3 shadow-2xl shadow-cyan-500/20">
                  <FaCode className="text-white text-3xl" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Custom Dev</span>
                </div>
                <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col items-center text-center space-y-3">
                  <HiLightningBolt className="text-orange-400 text-3xl" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Fast Execution</span>
                </div>
              </div>
            </motion.div>
            
            {/* Center Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-3xl shadow-2xl hidden md:block">
               <p className="text-[#041f60] font-black text-sm uppercase">The Ultimate Combo</p>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
                My Biggest Strength
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
                I Don’t Just Setup <br />
                <span className="text-cyan-400">I Engineer Success.</span>
              </h2>
              <p className="text-blue-100/70 text-lg font-medium leading-relaxed max-w-lg">
                Most freelancers only know how to click buttons in GTM. I combine **Media Buying, Server-Side Tracking, and Web Development** to build a data ecosystem that is 100% accurate and unblockable.
              </p>
            </motion.div>

            <ul className="space-y-4">
              {[
                "Deep understanding of Facebook Ads algorithms.",
                "Custom Server-side tracking (Docker/GTM).",
                "Advanced deduplication & matching optimization.",
                "Technical problem solving (JavaScript & Next.js)."
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-sm font-bold text-blue-100"
                >
                  <FaCheckCircle className="text-cyan-400 shrink-0" /> {item}
                </motion.li>
              ))}
            </ul>

            <div className="pt-6">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl inline-block">
                <p className="text-sm font-black italic">
                  "Stop hiring specialists who only see half the picture. Get the full-stack advantage."
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}