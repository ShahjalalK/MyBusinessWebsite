"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Target, ShieldCheck, CheckCircle2, Workflow, BarChart3 } from 'lucide-react'

const advantages = [
  {
    title: "Performance-Driven Data",
    desc: "As Google Ads experts, we prioritize the signals your campaigns need. We don't just track; we fuel your bidding algorithms for maximum ROAS."
  },
  {
    title: "Privacy-Centric Architecture",
    desc: "Fully compliant with GDPR, CCPA, and Safari's ITP. We protect your business from future data loss while maintaining tracking integrity."
  },
  {
    title: "Full-Funnel Synchronization",
    desc: "Every touchpoint—from lead to purchase—is unified. We ensure your tracking reflects the true customer journey across all platforms."
  }
];

export default function ServerUniqueAdvantage() {
  return (
    <section className="py-24 bg-white dark:bg-[#020617] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Side: Visual Element (Animated Tracking Dashboard) */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative z-10 bg-gradient-to-br from-blue-600 to-indigo-700 p-[1.5px] rounded-[3rem] shadow-2xl shadow-blue-500/20"
            >
              <div className="bg-slate-950 rounded-[2.9rem] p-8 md:p-12">
                <div className="flex flex-col gap-6">
                  {/* Tracking Signals Visualization */}
                  <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                      <BarChart3 size={24} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 bg-blue-500/30 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          whileInView={{ width: "100%" }} 
                          transition={{ duration: 1.5 }}
                          className="h-full bg-blue-500" 
                        />
                      </div>
                      <div className="h-1.5 w-1/2 bg-blue-500/10 rounded-full" />
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 ml-8 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <Target size={24} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-2/3 bg-indigo-500/30 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          whileInView={{ width: "100%" }} 
                          transition={{ duration: 1.5, delay: 0.2 }}
                          className="h-full bg-indigo-500" 
                        />
                      </div>
                      <div className="h-1.5 w-1/3 bg-indigo-500/10 rounded-full" />
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  </div>

                  <div className="flex items-center gap-5 bg-blue-600 p-7 rounded-[2rem] shadow-xl shadow-blue-600/30">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Zap size={28} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-white font-black text-xl leading-tight">100% Signal Match</p>
                      <p className="text-blue-100 text-sm font-medium">Enhanced Conversions Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Background Glows */}
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-600/10 blur-[120px] rounded-full" />
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.4em] text-[11px] mb-6 block">
                The Competitive Advantage
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-10 leading-[1.05]">
                Bridging the Gap Between <span className="text-blue-600">Tracking</span> and <span className="text-indigo-600">Profit.</span>
              </h2>
              
              <div className="space-y-10">
                {advantages.map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500">
                        <CheckCircle2 size={18} className="text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-lg leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verified Badge */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="mt-14 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 dark:text-white mb-1">Guaranteed Implementation</p>
                  <p className="text-slate-500 dark:text-slate-400 font-bold">
                    We offer a free <span className="text-blue-600">Google Ads account audit</span> to ensure your tracking is flawless.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}