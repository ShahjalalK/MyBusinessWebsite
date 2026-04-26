"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlayCircle, FaChartBar, FaUserCheck, FaAward, FaTimes } from 'react-icons/fa'
import { HiTrendingUp } from 'react-icons/hi'

const stats = [
  { label: "Data Accuracy", value: "99.9%", icon: <HiTrendingUp /> },
  { label: "Successful Audits", value: "120+", icon: <FaAward /> },
  { label: "Expert Satisfaction", value: "100%", icon: <FaUserCheck /> },
  { label: "Conversion Lift", value: "40%", icon: <FaChartBar /> },
];

export default function CapiProofSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617] overflow-hidden relative">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Video Audit Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative group cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <div className="relative z-10 rounded-[3.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-[12px] border-white dark:border-slate-800">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                alt="Google Ads and CAPI Audit Proof" 
                className="w-full h-auto grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
              />
              
              <div className="absolute inset-0 flex items-center justify-center bg-[#041f60]/50 backdrop-blur-[2px] group-hover:bg-[#041f60]/30 transition-all duration-500">
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                    <FaPlayCircle className="text-white text-8xl relative z-10 drop-shadow-2xl" />
                  </div>
                  <span className="bg-white text-[#041f60] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-transform group-hover:scale-110">
                    Watch Audit Proof
                  </span>
                </div>
              </div>
            </div>
            
            {/* Floating Case Study Card */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-10 -right-6 md:-right-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 max-w-[280px] border border-slate-100 dark:border-slate-800"
            >
               <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight"> Toledo Dog Training </h4>
               <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-3 font-bold">
                 Recovered 40% of conversion data by fixing duplicate triggers.
               </p>
            </motion.div>
          </motion.div>

          {/* Right: Content & Stats (SEO Optimized) */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
                Why Businesses <br /> 
                <span className="text-blue-600 italic">Hire This Google Ads Expert.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                I provide a specialized <span className="text-slate-900 dark:text-white font-black underline decoration-blue-500/30">google ads account audit</span> to find data leaks, followed by <span className="text-slate-900 dark:text-white font-black underline decoration-cyan-500/30">ga4 server side tracking</span> implementation for maximum durability.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5">
                  <div className="text-blue-600 text-2xl mb-5">{stat.icon}</div>
                  <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- IN-SITE VIDEO MODAL --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all backdrop-blur-md"
              >
                <FaTimes size={20} />
              </button>

              {/* Responsive YouTube Embed */}
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/AJkLYgQM4Aw?autoplay=1`} 
                title="Audit Proof Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}