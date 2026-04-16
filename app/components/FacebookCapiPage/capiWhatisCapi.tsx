"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaGlobe, FaServer, FaExchangeAlt, FaShieldVirus } from 'react-icons/fa'
import { BsArrowRightCircleFill } from 'react-icons/bs'

export default function CapiWhatIsCAPI() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/20 relative">
      <div className="container mx-auto px-6">
        
        {/* Title Section */}
        <div className="max-w-3xl mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            What Exactly is <br /> 
            <span className="text-blue-600">Facebook CAPI?</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium italic">
            "In simple words: It's the bridge that connects your website directly to Facebook, bypassing browser blockers."
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Browser Tracking Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] relative"
          >
            <div className="absolute -top-4 left-8 px-4 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
              The Old Way
            </div>
            <FaGlobe className="text-4xl text-slate-300 mb-6" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 italic strike-through opacity-60">Browser Pixel</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Tracking happens in the user's browser (Chrome, Safari). 
              <span className="block mt-2 font-bold text-red-500/70">✖ Blocked by Ad-blockers</span>
              <span className="block font-bold text-red-500/70">✖ Blocked by iOS 14+</span>
              <span className="block font-bold text-red-500/70">✖ Data disappears in 7 days</span>
            </p>
          </motion.div>

          {/* Connection Animation Icon */}
          <div className="flex justify-center items-center text-blue-600 text-4xl hidden lg:flex animate-pulse">
            <FaExchangeAlt />
          </div>

          {/* CAPI Tracking Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 bg-[#041f60] text-white rounded-[2.5rem] shadow-2xl shadow-blue-900/30 relative"
          >
            <div className="absolute -top-4 left-8 px-4 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase text-white shadow-lg">
              The CAPI Way (Recommended)
            </div>
            <FaServer className="text-4xl text-blue-400 mb-6" />
            <h3 className="text-xl font-black mb-4">Conversion API</h3>
            <p className="text-sm text-blue-100 leading-relaxed opacity-90">
              Data is sent directly from your <span className="font-bold text-white uppercase">Server</span> to Facebook.
              <span className="block mt-2 font-bold text-green-400 flex items-center gap-2">
                <BsArrowRightCircleFill /> 100% Signal Accuracy
              </span>
              <span className="block font-bold text-green-400 flex items-center gap-2">
                <BsArrowRightCircleFill /> Bypasses Ad-blockers
              </span>
              <span className="block font-bold text-green-400 flex items-center gap-2">
                <BsArrowRightCircleFill /> Precise Ad Optimization
              </span>
            </p>
          </motion.div>

        </div>

        {/* Why it Matters Point */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-t border-slate-200 dark:border-slate-800 pt-12"
        >
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Why is this important for you?</h4>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Imagine running a store but only seeing 6 out of every 10 customers who buy something. 
              Facebook's algorithm needs to know <strong>exactly</strong> who is buying so it can find more people just like them. 
              CAPI gives Facebook the full picture.
            </p>
          </div>
          <div className="bg-blue-600/5 p-8 rounded-3xl border border-blue-600/10 flex items-center gap-6">
             <FaShieldVirus className="text-5xl text-blue-600 shrink-0" />
             <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
               CAPI is no longer an "option"—it's a requirement to stay competitive in 2026's privacy-first digital world.
             </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}