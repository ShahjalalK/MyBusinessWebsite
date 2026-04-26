"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

export default function FiverrStyleVideo() {
  const [isOpen, setIsOpen] = useState(false);

  // ইউটিউব ভিডিও আইডি
  const videoId = "cjefWqlJQVY"; 

  return (
    <section className="py-24 bg-white dark:bg-[#020617] overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] mb-4 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-md"
            >
              <Zap size={14} fill="currentColor" /> Service in Action
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
              Watch How We <br /> <span className="text-blue-600 italic font-serif">Build Your Brand.</span>
            </h2>
          </div>
          <p className="max-w-xs text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed border-l-2 border-blue-600 pl-4">
            A quick walk-through of our clickable email signature features and the high-conversion setup process.
          </p>
        </div>

        {/* Main Video Section */}
        <div className="relative group">
          
          {/* Floating Experience Badge */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-10 -left-6 md:-left-10 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl z-30 border border-slate-100 dark:border-slate-800 hidden md:flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/40">
                <ShieldCheck size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Pro Setup</span>
          </motion.div>

          {/* Video Container */}
          <motion.div 
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 0.99 }}
            className="relative cursor-pointer aspect-video md:aspect-[21/9] overflow-hidden rounded-[2.5rem] md:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-white dark:border-slate-900 ring-1 ring-slate-100 dark:ring-slate-800"
          >
            {/* Thumbnail */}
            <img 
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="Video Preview"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            
            {/* Dark Overlay with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500" />

            {/* Pulsing Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-600/30 rounded-full blur-2xl" 
                />
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative w-24 h-24 md:w-32 md:h-32 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-2xl z-10 group/play"
                >
                  <Play size={44} fill="currentColor" className="ml-2 group-hover:scale-110 transition-transform" />
                </motion.div>
              </div>
            </div>

            {/* Text Overlay on Video */}
            <div className="absolute bottom-10 left-10 md:bottom-16 md:left-20">
              <div className="flex items-center gap-3 mb-4">
                 <span className="w-12 h-[2px] bg-blue-600" />
                 <span className="text-white text-xs font-black uppercase tracking-[0.4em]">Feature Presentation</span>
              </div>
              <h3 className="text-white text-3xl md:text-6xl font-black tracking-tighter drop-shadow-2xl">
                The Anatomy of a <br /> <span className="text-blue-500">Perfect Signature.</span>
              </h3>
            </div>
          </motion.div>
        </div>

        {/* Feature Tags Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
                { text: "1-Click Contact Save", icon: <CheckCircle2 size={16}/> },
                { text: "Social Proof Boost", icon: <Sparkles size={16}/> },
                { text: "Gmail & Outlook Ready", icon: <Zap size={16}/> },
                { text: "100% Responsive", icon: <CheckCircle2 size={16}/> }
            ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-600/30 transition-colors group">
                    <div className="text-blue-600 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <span className="font-black text-[10px] md:text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">{item.text}</span>
                </div>
            ))}
        </div>

        {/* Video Lightbox (Modal) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/98 flex items-center justify-center p-4 md:p-12 backdrop-blur-2xl"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 md:top-12 md:right-12 text-white/40 hover:text-white transition-all hover:rotate-90"
              >
                <X size={48} />
              </button>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] bg-black border border-white/10"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&hd=1`}
                  title="Service Demo Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
}