"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, EyeOff, ShieldAlert, WifiOff, XCircle } from 'lucide-react'
import Link from 'next/link';

const painPoints = [
  {
    icon: <WifiOff className="text-red-500" size={32} />,
    title: "Data Loss via Ad-Blockers",
    description: "Over 40% of internet users use ad-blockers. Standard browser-side pixels are automatically blocked, meaning you lose almost half of your conversion data."
  },
  {
    icon: <EyeOff className="text-orange-500" size={32} />,
    title: "iOS Privacy Restrictions",
    description: "Apple's ITP and iOS 14.5+ updates kill third-party cookies. Without server-side tracking, your tracking window drops from 28 days to just 24 hours."
  },
  {
    icon: <ShieldAlert className="text-yellow-500" size={32} />,
    title: "Pixel Not Firing Properly",
    description: "Browser crashes, slow loading, and script interference often prevent your pixel from firing. You're flying blind without seeing the full customer journey."
  },
  {
    icon: <XCircle className="text-rose-600" size={32} />,
    title: "Inaccurate Attribution",
    description: "When data is missing, Google and Meta's AI can't optimize. You end up spending money on keywords and ads that aren't actually bringing sales."
  }
];

export default function ServerProblemSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
      
      {/* Background Decorative Text */}
      <div className="absolute top-10 left-10 text-[15rem] font-black text-slate-200/20 dark:text-slate-800/20 pointer-events-none select-none">
        LOSS
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6"
          >
            <AlertTriangle size={14} /> The Problem
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-[1.1]">
            Is Your Tracking <br />
            <span className="text-red-600 underline decoration-wavy underline-offset-8">Bleeding Money?</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            Traditional tracking is broken. Privacy updates and ad-blockers are making your marketing data 40-60% inaccurate. If you can't measure it, you can't scale it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 md:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-red-500/50 transition-all duration-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
              <div className="mb-6 inline-block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                {point.icon}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                {point.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Warning Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 max-w-5xl mx-auto p-8 bg-red-600 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left"
        >
          <div>
            <h4 className="text-2xl font-black text-white mb-2">Stop guessing. Start tracking.</h4>
            <p className="text-red-100 font-medium">Your competitors are already moving to server-side. Don't get left behind.</p>
          </div>
          <Link href="/contact" className="px-8 py-4 bg-white text-red-600 rounded-2xl font-black hover:bg-slate-100 transition-colors shrink-0">
            Fix My Tracking Now
          </Link>
        </motion.div>

      </div>
    </section>
  )
}