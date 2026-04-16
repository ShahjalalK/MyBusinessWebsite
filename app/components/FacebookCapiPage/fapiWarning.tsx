"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaShieldAlt, FaInfoCircle } from 'react-icons/fa'
import { HiLightningBolt } from 'react-icons/hi'

export default function CapiWinningStrategy() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/10">
      <div className="container mx-auto px-6">
        
        <div className="max-w-5xl mx-auto">
          <div className="relative p-10 md:p-16 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-blue-500/5">
            
            {/* Strategy Badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
              <HiLightningBolt className="animate-pulse" /> Winning Strategy
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Content: The Hook */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3 text-blue-600">
                  <FaInfoCircle className="text-xl" />
                  <span className="font-bold text-sm uppercase tracking-widest">Industry Insight</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
                  “After iOS updates, many businesses lose a significant portion of their tracking data — <span className="text-blue-600">CAPI helps recover it.</span>”
                </h2>

                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                  Without CAPI, your Facebook Ads algorithm is forced to guess who converted. My strategy focuses on restoring that lost data connection, allowing you to scale with precision and stop wasting ad budget on invisible results.
                </p>
              </div>

              {/* Right Content: Icon/Value Prop */}
              <div className="lg:col-span-4 flex justify-center">
                <motion.div 
                  animate={{ 
                    y: [0, -15, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="w-48 h-48 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center relative"
                >
                  <FaShieldAlt className="text-8xl text-blue-600/20 absolute" />
                  <div className="text-center z-10">
                    <span className="block text-4xl font-black text-blue-600">40%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Recovered</span>
                  </div>
                  
                  {/* Rotating Border Effect */}
                  <div className="absolute inset-0 border-2 border-dashed border-blue-600/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                </motion.div>
              </div>

            </div>

            {/* Bottom Proof Line */}
            <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400 italic">
                     User
                   </div>
                 ))}
                 <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                   +50
                 </div>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 Helping businesses survive the post-iOS tracking era.
               </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}