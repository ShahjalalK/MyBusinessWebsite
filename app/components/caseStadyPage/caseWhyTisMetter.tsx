"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, LineChart, ShieldCheck, TrendingDown, CheckCircle2 } from 'lucide-react'

export default function TrustSection() {
  const problems = [
    { icon: <TrendingDown className="text-red-500" />, text: "Waste Ad Budget on Poor Decisions" },
    { icon: <AlertTriangle className="text-amber-500" />, text: "Lose 30% or More of Your Data" },
    { icon: <LineChart className="text-red-400" />, text: "Inaccurate Conversion Attribution" }
  ];

  const solution = "Structured tracking setups solve these problems by providing a clear blueprint of your customer journey and ensuring every dollar spent is accounted for.";

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mb-6">
                <ShieldCheck size={16} /> Strategic Insight
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-tight">
                Why Accurate <br />
                <span className="text-blue-600">Tracking Matters</span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                Without proper tracking, businesses lose valuable data, make poor decisions, and waste ad budget. These case studies demonstrate how structured tracking setups can solve these problems.
              </p>

              <div className="space-y-4">
                {problems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Visual Graphic/Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-600 blur-[100px] opacity-10 rounded-full" />
              
              <div className="relative bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">The Solution</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                    "{solution}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                    <div className="text-3xl font-black text-blue-600 mb-1">100%</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Data Control</div>
                  </div>
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center">
                    <div className="text-3xl font-black text-emerald-600 mb-1">Max</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Ad Efficiency</div>
                  </div>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600 rounded-3xl -z-10 rotate-12" />
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}