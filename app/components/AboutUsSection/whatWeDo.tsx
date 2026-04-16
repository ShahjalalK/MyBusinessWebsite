"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Monitor, BarChart, Mail, CheckCircle2 } from 'lucide-react'

const coreExpertise = [
  {
    title: "Precision Tracking",
    desc: "We specialize in GTM Server-Side setups that recover data lost to ad-blockers and privacy restrictions.",
    features: ["Server-Side GTM", "GA4 Configuration", "Cookie Recovery"],
    icon: <Monitor className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Strategic Ads",
    desc: "Our Google Ads experts focus on high-intent keywords and conversion-optimized campaigns.",
    features: ["Search & PMax", "ROI Focused", "Audience Scaling"],
    icon: <BarChart className="w-6 h-6 text-indigo-600" />
  },
  {
    title: "Brand Assets",
    desc: "We design professional, clickable HTML email signatures that boost your brand authority.",
    features: ["Interactive Design", "Cross-Platform", "CTA Integrated"],
    icon: <Mail className="w-6 h-6 text-cyan-600" />
  }
]

export default function WhatWeDo() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4 text-left">Core Expertise</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              The Specialized Skills We <span className="text-blue-600">Bring to the Table.</span>
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm text-left md:text-right">
            Instead of being a "jack of all trades," we focus on the critical areas that drive actual revenue for your agency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreExpertise.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{item.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>

              <ul className="space-y-3">
                {item.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}