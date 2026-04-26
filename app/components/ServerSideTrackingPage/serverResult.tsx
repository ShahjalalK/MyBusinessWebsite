"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, ArrowUpRight, CheckCircle, Database, Zap, ShieldCheck } from 'lucide-react'

const caseStudies = [
  {
    client: "E-commerce Giant (Shopify)",
    challenge: "Losing 35% of attribution due to iOS 14+ & Safari ITP.",
    result: "9.2/10 Match Quality Score",
    recovery: "+42% Conversion Recovery",
    tags: ["GA4 Server-Side", "Facebook CAPI"]
  },
  {
    client: "Real Estate SaaS (USA)",
    challenge: "Inaccurate lead tracking & high CPA.",
    result: "100% Offline Conversions Sync",
    recovery: "24% Reduction in CPA",
    tags: ["Google Ads OCI", "GTM Server"]
  }
];

export default function ServerResultsSection() {
  return (
    <section className="py-24 bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4"
            >
              <BarChart size={14} /> Case Studies & Metrics
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              Evidence of <span className="text-blue-600 italic">Precision.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs text-lg leading-snug">
            We transform "Dark Data" into actionable growth signals for global brands.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <motion.div 
            whileHover={{ y: -10 }}
            className="p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
              <Database size={28} />
            </div>
            <h3 className="text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">99.2%</h3>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Data Stream Accuracy</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="p-12 bg-blue-600 rounded-[3rem] shadow-2xl shadow-blue-500/30 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-8">
                <Zap size={28} />
              </div>
              <h3 className="text-6xl font-black text-white mb-2 tracking-tighter">+42%</h3>
              <p className="text-blue-100 font-black uppercase tracking-widest text-[11px]">Average Data Recovery</p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <BarChart size={120} />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-8">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">0%</h3>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Ad-Blocker Signal Loss</p>
          </motion.div>
        </div>

        {/* Previous Work Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {caseStudies.map((work, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] hover:border-blue-500/50 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                    {work.client}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                  <ArrowUpRight size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">The Challenge</p>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{work.challenge}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-blue-600 uppercase mb-2 tracking-widest">Key Result</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{work.result}</p>
                  <p className="text-sm font-bold text-emerald-500 mt-1">{work.recovery}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}