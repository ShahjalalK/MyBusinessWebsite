"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Server, Share2, BarChart3, CheckCircle2, Terminal } from 'lucide-react'

const solutionFeatures = [
  {
    icon: <Server size={32} />, // এখানে কালার ক্লাস সরিয়ে দিয়েছি কারণ নিচে ডাইনামিক করা হয়েছে
    title: "Server-Side GTM Setup",
    description: "We move your tracking from the user's browser to a secure cloud server. This ensures that even if a browser blocks a script, your data still flows safely to its destination.",
    points: ["Google Cloud/Stape Setup", "Custom Loader Implementation", "Bypass Ad-Blockers"],
    color: "text-blue-500" // প্রতিটি আইকনের জন্য আলাদা ডিফল্ট কালার
  },
  {
    icon: <Share2 size={32} />,
    title: "Conversion API (CAPI) Integration",
    description: "Direct server-to-server integration with Meta, Google, and TikTok. We bypass browser limitations to send events directly to ad platforms for better optimization.",
    points: ["Meta Conversions API", "Google Ads Offline Conversions", "Enhanced Match Quality"],
    color: "text-indigo-500"
  },
  {
    icon: <BarChart3 size={32} />,
    title: "Data Accuracy Improvement",
    description: "Say goodbye to 40% data loss. We restore your tracking accuracy to near 100%, allowing Google and Meta's AI to find your best customers at a lower cost.",
    points: ["Deduplication Logic", "Event Match Quality (EMQ) Fix", "First-Party Cookie Extension"],
    color: "text-emerald-500"
  }
];

export default function ServerSolutionSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mb-4"
            >
              <Terminal size={16} /> Our Solution
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Modern Tracking <br />
              <span className="text-blue-600 font-outline-2">Engineered for Results.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-sm">
            We don't just fix pixels; we rebuild your entire data infrastructure for the privacy-first era.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutionFeatures.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative group overflow-hidden"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

              <div className="relative z-10">
                {/* আইকন কন্টেইনার */}
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-white/20 transition-all duration-300">
                  {/* আইকন কালার হোভারে সাদা হয়ে যাবে */}
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: `transition-colors duration-300 group-hover:text-white ${item.color}`
                  })}
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 group-hover:text-blue-50 transition-colors">
                  {item.description}
                </p>

                <ul className="space-y-3">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors">
                      <CheckCircle2 size={16} className="text-blue-600 group-hover:text-blue-200" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stat/Benefit */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-center gap-10"
        >
          <div className="text-center">
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">99%</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Event Accuracy</div>
          </div>
          <div className="hidden md:block w-[1px] h-12 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-5xl font-black text-blue-600 mb-2">+35%</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Data Recovery</div>
          </div>
          <div className="hidden md:block w-[1px] h-12 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">0%</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Ad-Blocker Impact</div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}