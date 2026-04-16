"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, ArrowUpRight, CheckCircle, Database, Zap } from 'lucide-react'

const caseStudies = [
  {
    client: "E-commerce Brand (Shopify)",
    challenge: "Losing 35% data on iOS devices.",
    result: "98% Tracking Accuracy",
    recovery: "+37% Data Recovered",
    tags: ["GA4 Server-Side", "Facebook CAPI"]
  },
  {
    client: "SaaS Platform",
    challenge: "Inaccurate lead attribution.",
    result: "100% Lead Match Rate",
    recovery: "Zero Ad-Blocker Impact",
    tags: ["Google Ads OCI", "GTM Server"]
  }
];

export default function ServerResultsSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] mb-4"
            >
              <BarChart size={14} /> Proven Results
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              Real Impact, <span className="text-blue-600">Measured in Data.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs">
            We help businesses recover lost signals and turn dark data into profitable insights.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-2">98%</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Tracking Accuracy</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="p-10 bg-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-500/20"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-5xl font-black text-white mb-2">+40%</h3>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Data Recovery Rate</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-2">0%</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ad-Blocker Interference</p>
          </motion.div>
        </div>

        {/* Previous Work / Case Studies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((work, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-blue-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{work.client}</h4>
                  <div className="flex gap-2 mt-2">
                    {work.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase tracking-tighter">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Challenge</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{work.challenge}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Result</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{work.result}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}