"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Target, LineChart, ShieldCheck } from 'lucide-react'

const solutions = [
  {
    icon: <LayoutGrid size={28} />, 
    title: "Expert Campaign Management",
    description: "As a Google Ads specialist, we build high-intent Alpha-Beta structures and SKAGs that ensure your ads reach qualified buyers at the lowest possible CPC."
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Server-Side GTM Tracking",
    description: "We implement advanced GTM server side tracking to bypass iOS 14.5+ limitations, capturing 100% conversion data for better algorithm optimization."
  },
  {
    icon: <LineChart size={28} />,
    title: "Data-Driven ROAS Scaling",
    description: "Our method focuses on continuous bid management and negative keyword scrubbing to scale your ROAS and maximize every dollar of ad spend."
  }
];

export default function GoogleAdsSolutionSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Header: Optimized for Service keywords */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 rounded-full"
          >
            The Strategy for High-Performance Ads
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Our Method to <span className="text-blue-600">Scale Your Sales.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
            We integrate technical precision with elite tracking to ensure your Google Ads campaigns dominate the market and deliver consistent growth.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {solutions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-8 shadow-sm group-hover:bg-blue-600 text-blue-600 group-hover:text-white transition-all duration-300">
                {item.icon}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                {item.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {item.description}
              </p>

              <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                Performance Audit <Target size={14} />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}