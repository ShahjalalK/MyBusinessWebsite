"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Sparkles, CheckCircle2 } from 'lucide-react'

export default function FiverrStyleVideo() {
  const [isOpen, setIsOpen] = useState(false);

  // আপনার ইউটিউব ভিডিও আইডি এখানে দিন
  const videoId = "cjefWqlJQVY"; 

  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Header Content */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs mb-4">
            <Sparkles size={16} /> Product Demo
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Everything in <span className="text-blue-600">Action.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Watch how I build clickable, high-converting email signatures that help real estate agents close more deals.
          </p>
        </div>

        {/* Video Container (Fiverr Style Full Width) */}
        <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
          {/* Thumbnail Image */}
          <div className="relative aspect-video md:aspect-[21/9] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800">
            <img 
              src="https://img.youtube.com/vi/cjefWqlJQVY/maxresdefault.jpg" // ইউটিউব থেকে অটো থাম্বনেইল
              alt="Video Preview"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />

            {/* Custom Large Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-20 h-20 md:w-28 md:h-28 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] border-4 border-white/30"
              >
                <Play size={40} fill="currentColor" className="ml-2" />
              </motion.div>
            </div>

            {/* Bottom Text Label */}
            <div className="absolute bottom-8 left-8 md:left-12">
              <h3 className="text-white text-2xl md:text-4xl font-black tracking-tight drop-shadow-lg">
                Setup Guide & <br /> Clickable Features Demo
              </h3>
            </div>
          </div>
        </div>

        {/* Features Grid below video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
                "1-Click Contact Save",
                "Social Icon Integration",
                "Gmail Setup Tutorial"
            ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="text-blue-600" size={24} />
                    <span className="font-bold text-slate-700 dark:text-slate-300">{text}</span>
                </div>
            ))}
        </div>

        {/* Video Lightbox Modal (Full Screen Player) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              >
                <X size={40} />
              </button>

              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title="YouTube video player"
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