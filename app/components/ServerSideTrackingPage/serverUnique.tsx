"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Target, BarChart, ShieldCheck, CheckCircle2, Workflow } from 'lucide-react'

const advantages = [
  {
    title: "Full-Funnel Optimization",
    desc: "We don't just fix pixels; we ensure every stage of your customer journey is captured correctly for maximum ROAS."
  },
  {
    title: "Privacy-First Approach",
    desc: "Our setups are fully GDPR & CCPA compliant, protecting your business from future browser and legal changes."
  },
  {
    title: "Direct Marketing Insight",
    desc: "As Google Ads experts, we know exactly what data your ad campaigns need to perform at their peak."
  }
];

export default function ServerUniqueAdvantage() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Side: Visual Element */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10 bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3rem] shadow-2xl shadow-blue-500/20"
            >
              <div className="bg-slate-900 rounded-[2.8rem] p-8 md:p-12">
                <div className="flex flex-col gap-6">
                  {/* Animated Tracking Lines */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                      <Workflow size={20} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 bg-blue-500/20 rounded" />
                      <div className="h-2 w-1/2 bg-blue-500/40 rounded" />
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 ml-8">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <Target size={20} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-2/3 bg-indigo-500/20 rounded" />
                      <div className="h-2 w-1/3 bg-indigo-500/40 rounded" />
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>

                  <div className="flex items-center gap-4 bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-600/30">
                    <Zap size={24} className="text-white animate-pulse" />
                    <div>
                      <p className="text-white font-black text-lg leading-tight">Funnel Synced</p>
                      <p className="text-blue-100 text-xs">All tracking signals active</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full" />
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
                The TrackFlow Edge
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                We don’t just implement tracking—we <span className="text-blue-600 italic">perfect</span> your funnel.
              </h2>
              
              <div className="space-y-8">
                {advantages.map((item, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="mt-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                        <CheckCircle2 size={14} className="text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="mt-12 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Guaranteed Accuracy</p>
                  <p className="text-xs text-slate-500 font-medium">Verified data streams or your money back.</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}