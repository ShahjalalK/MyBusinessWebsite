"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, EyeOff, ShieldAlert, WifiOff, XCircle, TrendingDown } from 'lucide-react'
import Link from 'next/link';

const painPoints = [
  {
    icon: <WifiOff className="text-red-500" size={32} />,
    title: "Data Loss via Ad-Blockers",
    description: "Over 40% of internet users now use ad-blockers. Standard browser-side pixels are automatically blocked, causing you to lose nearly half of your conversion data instantly."
  },
  {
    icon: <EyeOff className="text-orange-500" size={32} />,
    title: "iOS Privacy & ITP Restrictions",
    description: "Apple’s ITP and iOS 14.5+ updates kill third-party cookies. Without GTM Server-Side tracking, your attribution window shrinks from 28 days to just 24 hours."
  },
  {
    icon: <TrendingDown className="text-yellow-500" size={32} />,
    title: "High CPA & Blind Scaling",
    description: "Missing data prevents Google and Meta’s AI from optimizing. You end up wasting budget on underperforming ads, leading to a much higher Cost Per Acquisition (CPA)."
  },
  {
    icon: <XCircle className="text-rose-600" size={32} />,
    title: "Inaccurate Attribution",
    description: "Slow loading and browser crashes often prevent pixels from firing. Without a full view of the customer journey, you're scaling based on guesswork, not facts."
  }
];

export default function ServerProblemSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
      
      {/* Background Decorative Text - 'LOSS' for visual impact */}
      <div className="absolute top-10 left-10 text-[12rem] md:text-[20rem] font-black text-slate-200/30 dark:text-slate-900/40 pointer-events-none select-none leading-none uppercase">
        Loss
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6"
          >
            <AlertTriangle size={14} /> Critical Tracking Gap
          </motion.div>
          
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
            Is Your Marketing <br />
            <span className="text-red-600 relative inline-block">
              Bleeding Money?
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-red-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Privacy updates and ad-blockers are making your marketing data <span className="text-red-500 font-bold">40-60% inaccurate</span>. If you can't measure it, you can't scale it. Are you ready to stop the guesswork?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group p-8 md:p-12 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[3rem] hover:border-red-500/40 transition-all duration-500 shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="mb-8 inline-block p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-slate-100 dark:border-slate-700">
                {point.icon}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-red-600 transition-colors">
                {point.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Action Banner for Conversion API & Audit */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-6xl mx-auto p-1 bg-gradient-to-r from-red-600 to-rose-700 rounded-[2.5rem] shadow-[0_20px_50px_rgba(225,29,72,0.3)]"
        >
          <div className="bg-slate-900/10 backdrop-blur-md rounded-[2.4rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-1 text-center lg:text-left">
              <h4 className="text-3xl font-black text-white mb-4 tracking-tight">Stop Guessing. Get a Data Accuracy Audit.</h4>
              <p className="text-red-100 text-lg font-medium opacity-90">Find out exactly how much signal loss is hurting your ROI with our <span className="font-bold underline text-white">Free Google Ads & Tracking Audit</span>.</p>
            </div>
            <Link href="/contact" className="w-full lg:w-auto px-10 py-6 bg-white text-red-600 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 shrink-0">
              Run My Free Audit
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  )
}