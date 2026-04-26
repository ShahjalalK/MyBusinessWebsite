"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingDown, EyeOff, ZapOff } from 'lucide-react'

const pains = [
  {
    icon: <TrendingDown className="text-red-500" size={28} />,
    title: "Wasting Money on Clicks",
    description: "Are you paying for clicks that never turn into customers? High ad spend with zero ROI is the silent killer of eCommerce businesses."
  },
  {
    icon: <EyeOff className="text-red-500" size={28} />,
    title: "Broken Conversion Tracking",
    description: "Most Google Ads setups lose 30-50% of data due to iOS 14+ updates. Without GTM Server-side tracking, you are flying blind."
  },
  {
    icon: <ZapOff className="text-red-500" size={28} />,
    title: "High CPC & Low Quality Scores",
    description: "Poorly structured campaigns lead to expensive Cost-Per-Click (CPC). You are overpaying Google because your ads aren't optimized."
  }
];

export default function GoogleAdsProblemSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-6">
        
        {/* Header: Optimized with 'Google Ads Audit' context */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-red-600 font-black uppercase tracking-widest text-xs mb-4"
          >
            <AlertCircle size={16} /> Common Advertising Failures
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Stop Burning Your Budget on <span className="text-red-600">Poorly Tracked Ads.</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed">
            Most businesses fail with Google Ads not because the platform is bad, but because their technical foundation—like GA4 and Server-side GTM—is broken.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pains.map((pain, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              // SEO Tip: Using descriptive titles for service awareness
              viewport={{ once: true }}
              className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-red-500/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {pain.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                {pain.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-sm">
                {pain.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer Note: Internal linking / Conversion focus */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 p-6 rounded-2xl bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-center"
        >
          <p className="text-slate-700 dark:text-slate-300 font-bold">
            Does this sound like your account? <span className="text-red-600">It’s time for a professional Google Ads account audit.</span>
          </p>
        </motion.div>

      </div>
    </section>
  )
}