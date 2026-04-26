"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaRocket, FaCode, FaChartLine, FaCheckCircle, FaServer } from 'react-icons/fa'
import { HiLightningBolt } from 'react-icons/hi'

export default function CapiUniqueAdvantage() {
  return (
    <section className="py-24 bg-[#041f60] dark:bg-slate-950 relative overflow-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-0 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-0 -translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Column: The Full-Stack Visual Grid */}
          <div className="relative order-2 lg:order-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="space-y-6 pt-12">
                <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] flex flex-col items-center text-center space-y-4 hover:bg-white/10 transition-colors duration-500">
                  <div className="p-4 bg-blue-500/20 rounded-2xl">
                    <FaChartLine className="text-blue-400 text-3xl" />
                  </div>
                  <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Ads Strategy</span>
                </div>
                <div className="p-8 bg-blue-600 rounded-[3rem] flex flex-col items-center text-center space-y-4 shadow-[0_20px_50px_rgba(37,99,235,0.3)] group hover:-translate-y-2 transition-transform duration-500">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <FaRocket className="text-white text-3xl animate-bounce" />
                  </div>
                  <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">CAPI Specialist</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-8 bg-cyan-500 rounded-[3rem] flex flex-col items-center text-center space-y-4 shadow-[0_20px_50px_rgba(6,182,212,0.3)] group hover:-translate-y-2 transition-transform duration-500">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <FaCode className="text-white text-3xl" />
                  </div>
                  <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Custom Dev</span>
                </div>
                <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] flex flex-col items-center text-center space-y-4 hover:bg-white/10 transition-colors duration-500">
                  <div className="p-4 bg-orange-500/20 rounded-2xl">
                    <HiLightningBolt className="text-orange-400 text-3xl" />
                  </div>
                  <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Fast Delivery</span>
                </div>
              </div>
            </motion.div>
            
            {/* Center Floating Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-5 rounded-[2rem] shadow-2xl hidden md:block z-20 border-4 border-blue-600/10"
            >
               <p className="text-[#041f60] font-black text-[11px] uppercase tracking-tighter text-center leading-none">
                The Full-Stack <br/> <span className="text-blue-600 text-lg">Advantage</span>
               </p>
            </motion.div>
          </div>

          {/* Right Column: SEO Optimized Content */}
          <div className="space-y-8 text-white order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.3em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Why I am Different
              </div>

              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] lg:max-w-xl">
                I Don’t Just Setup, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">I Engineer Growth.</span>
              </h2>

              <p className="text-blue-100/70 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                Most freelancers only follow tutorials. I leverage my background in **JavaScript development** and **Media Buying** to build a <span className="text-white border-b-2 border-cyan-500/50">gtm server side tracking</span> ecosystem that is bypass-proof and privacy-compliant.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              {[
                { text: "Expertise in Meta Conversions API", icon: <FaCheckCircle /> },
                { text: "Custom GA4 Server-Side logic", icon: <FaServer /> },
                { text: "Next.js & GTM Integration", icon: <FaCode /> },
                { text: "First-party data optimization", icon: <FaRocket /> }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-[13px] font-black text-blue-100 uppercase tracking-tight"
                >
                  <span className="text-cyan-400 text-lg">{item.icon}</span> {item.text}
                </motion.div>
              ))}
            </div>

            <div className="pt-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-8 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-[2.5rem] border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FaRocket size={80} />
                </div>
                <p className="text-lg font-bold italic text-blue-50 relative z-10 leading-relaxed">
                  "Stop hiring 'button-clickers'. Get a technical partner who understands both your code and your conversions."
                </p>
                <div className="mt-4 flex items-center gap-2">
                   <div className="w-8 h-1 bg-cyan-400 rounded-full"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">The TrackFlowPro Promise</span>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}