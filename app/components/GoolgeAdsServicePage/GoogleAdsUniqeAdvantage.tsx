"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, ShieldCheck, Target } from 'lucide-react'

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
              {/* Card 1: Google Ads Expertise */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl relative z-20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <h4 className="text-xl font-black">Google Ads Specialist Expertise</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Advanced bidding, high-intent keyword research, and expert campaign setups that lower your CPC and drive sales.
                </p>
              </motion.div>

              {/* The Plus Icon */}
              <div className="flex justify-center my-[-20px] relative z-30">
                <div className="w-12 h-12 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Plus size={28} strokeWidth={3} />
                </div>
              </div>

              {/* Card 2: GTM Server-Side Tracking */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-blue-600 rounded-[2rem] shadow-2xl relative z-20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xl font-black text-white">GTM Server Side Tracking</h4>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Implementing GA4 and GTM server side tagging to bypass iOS 14+ restrictions and recover 100% of conversion data.
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
              Why Business Owners Hire Us
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-tight">
              We Don’t Just Run Ads. <br />
              <span className="text-blue-500 text-outline">We Engineer Scaling.</span>
            </h2>
            
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Most agencies focus only on clicks. When you <span className="text-white font-bold">hire a Google Ads expert</span> from our team, we bridge the gap between creative marketing and technical data precision.
            </p>

            <ul className="space-y-6">
              {[
                { title: "Smart Data Optimization", desc: "Our campaigns reach profitability faster because we feed Google’s AI with 100% accurate server-side data." },
                { title: "Server-Side Tagging", desc: "Completely secure and privacy-first setup using GTM server side tagging for better performance." },
                { title: "Maximizing ROAS", desc: "No more ad waste. We target high-intent search terms to ensure every dollar increases your ROAS." }
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