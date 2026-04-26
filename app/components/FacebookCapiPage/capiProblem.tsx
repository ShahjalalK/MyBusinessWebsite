"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaExclamationTriangle, FaMobileAlt, FaDatabase, FaChartLine } from 'react-icons/fa'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { AlertCircle, ArrowDownNarrowWide, Target } from 'lucide-react'

const problems = [
  {
    icon: <FaMobileAlt className="text-red-500" />,
    title: "iOS 14+ Privacy Wall",
    desc: "Apple's updates block third-party cookies, making your standard Facebook Pixel tracking go blind on iPhone users."
  },
  {
    icon: <FaDatabase className="text-red-500" />,
    title: "40% Data Leakage",
    desc: "Browser restrictions and ad-blockers mean up to 40% of your sales are never reported back to Meta Ads Manager."
  },
  {
    icon: <AiOutlineCloseCircle className="text-red-500" size={28} />,
    title: "Signal Mismatch",
    desc: "Relying solely on browser-based pixels leads to missing attributions and inaccurate event match quality scores."
  },
  {
    icon: <FaChartLine className="text-red-500" />,
    title: "Spiking Ad Costs",
    desc: "When the algorithm lacks data, it can't optimize properly—leading to high CPA and significantly lower ROAS."
  }
];

export default function CapiProblemSection() {
  return (
    <section className="py-28 bg-[#fffefe] dark:bg-slate-950 relative overflow-hidden">
      
      {/* Visual Accent: Red Danger Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-20 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 text-[11px] font-black uppercase tracking-[0.2em]"
          >
            <AlertCircle size={14} className="animate-pulse" /> Critical Tracking Warning
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
            Is Your Ad Budget <br /> 
            <span className="text-red-600 underline decoration-red-600/20 underline-offset-8">Disappearing?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Traditional <strong>Facebook Pixel tracking</strong> is no longer enough. Without a proper <strong>Meta Conversions API</strong> setup, your campaigns are running on guesswork.
          </p>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-red-900/5 hover:border-red-500/30 transition-all duration-500"
            >
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Target size={80} className="text-red-600" />
              </div>

              <div className="w-16 h-16 bg-red-50 dark:bg-red-600/10 rounded-2xl flex items-center justify-center mb-8 text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                {item.icon}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                {item.title}
              </h3>
              
              <p className="text-[15px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Action-Oriented Warning Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-col items-center"
        >
          <div className="px-10 py-6 rounded-[2.5rem] bg-slate-900 dark:bg-red-600/10 border border-red-600/20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            
            <p className="relative z-10 text-red-500 dark:text-red-400 font-black text-base md:text-lg flex flex-col md:flex-row items-center gap-3">
              <ArrowDownNarrowWide className="animate-bounce" />
              Without CAPI, your marketing data is only 60% accurate. Fix it today.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}