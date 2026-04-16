"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, ShieldCheck, Target, Zap } from 'lucide-react'

export default function GoogleAdsUniqueAdvantage() {
  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
      
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-64" />

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Side: The "Power Duo" Visual */}
          <div className="lg:w-1/2 w-full">
            <div className="relative">
              {/* Card 1: Google Ads */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl relative z-20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <h4 className="text-xl font-black">Google Ads Expertise</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Advanced bidding strategies, high-intent keyword research, and compelling ad copy that drives clicks.
                </p>
              </motion.div>

              {/* The Plus Icon */}
              <div className="flex justify-center my-[-20px] relative z-30">
                <div className="w-12 h-12 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Plus size={28} strokeWidth={3} />
                </div>
              </div>

              {/* Card 2: Server-Side Tracking */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-blue-600 rounded-[2rem] shadow-2xl relative z-20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xl font-black text-white">Server-Side Tracking</h4>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Bypassing ad-blockers and iOS privacy restrictions to ensure 100% data accuracy for Google's AI.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Side: The Copy */}
          <div className="lg:w-1/2 w-full">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
            >
              Why Choose Us
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-tight">
              We Don’t Just Run Ads. <br />
              <span className="text-blue-500 text-outline">We Engineer Growth.</span>
            </h2>
            
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Most agencies focus only on the ads, leaving your tracking broken and your data inaccurate. We bridge the gap between marketing and technical precision.
            </p>

            <ul className="space-y-6">
              {[
                { title: "Smart Optimization", desc: "Our ads get better faster because we feed them 100% accurate data." },
                { title: "Privacy-First Setup", desc: "Completely GDPR/CCPA compliant tracking using Server-Side GTM." },
                { title: "Reduced Ad Waste", desc: "No more paying for duplicate conversions or untracked sales." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center shrink-0 mt-1 group-hover:bg-blue-600 transition-colors">
                    <Check size={14} className="text-blue-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-1">{item.title}</h5>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      <style jsx>{`
        .text-outline {
          -webkit-text-stroke: 1px #3b82f6;
          color: transparent;
        }
      `}</style>
    </section>
  )
}