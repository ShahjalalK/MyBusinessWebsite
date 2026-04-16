"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Zap, BarChart3 } from 'lucide-react'

// টাইপস্ক্রিপ্টের জন্য ইন্টারফেস ডিফাইন করা ভালো প্র্যাকটিস
interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  desc: string;
}

export default function CaseStudiesHero() {
  const metrics: MetricProps[] = [
    { icon: <TrendingUp size={24} className="text-blue-600" />, label: "Avg. ROI Increase", value: "+115%", desc: "E-commerce Clients" },
    { icon: <Target size={24} className="text-blue-600" />, label: "Data Recovery", value: "30-50%", desc: "Bypassing Ad-blockers" },
    { icon: <BarChart3 size={24} className="text-blue-600" />, label: "CPA Reduction", value: "-25%", desc: "Google Ads Optimization" }
  ];

  return (
    <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 pt-16 pb-20 lg:pt-20 lg:pb-32">
      
      {/* Visual Effect: Background Pattern & Glow */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" 
           style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 z-10 relative">
        <div className="max-w-6xl mx-auto text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-blue-200 dark:border-blue-900 shadow-inner"
          >
            <Zap size={16} className="fill-current" /> Result-Driven Success Stories
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[1.05] mb-10 tracking-tighter"
          >
            From Data Gaps <br />
            <span className="text-blue-600">to Doubling ROI.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto font-semibold mb-16 leading-relaxed"
          >
            Discover how TrackFlow Agency helps e-commerce and lead-generation businesses bypass ad-blockers, recover lost data, and optimize their marketing spend.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left bg-slate-50 dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800"
          >
              {metrics.map((metric, i) => (
                <div key={i} className="flex items-start gap-5"> {/* key হিসেবে i (index) ব্যবহার করা হয়েছে */}
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 shrink-0">
                        {metric.icon}
                    </div>
                    <div>
                        <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{metric.label}</div>
                        <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white my-1 tracking-tighter">{metric.value}</div>
                        <p className="text-sm font-semibold text-slate-500 leading-tight">{metric.desc}</p>
                    </div>
                </div>
              ))}
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}