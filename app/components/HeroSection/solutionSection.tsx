"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, BarChart, DatabaseZap, ShieldCheck } from 'lucide-react'

const solutions = [
  {
    title: "GTM Server-Side Tagging", // Optimized Title from Keyword Data
    desc: "We migrate your tracking from the browser to a first-party server container, effectively bypassing iOS 14+ restrictions and ad-blockers.",
    icon: <DatabaseZap className="w-6 h-6 text-blue-600" />,
    benefit: "100% Data Precision"
  },
  {
    title: "First-Party Data Accuracy",
    desc: "By implementing server-side cookies, we ensure your GA4 and Meta Conversion API (CAPI) receive clean, undisputed data for better attribution.",
    icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
    benefit: "Fix Tracking Gaps"
  },
  {
    title: "High-ROI Google Ads Strategy", // Keyword focus
    desc: "Leveraging accurate tracking to optimize your Google Ads campaigns, focusing on scaling the high-intent keywords that drive revenue.",
    icon: <BarChart className="w-6 h-6 text-indigo-600" />,
    benefit: "Maximum ROAS"
  }
]

export default function SolutionSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/30 dark:bg-blue-900/10 -skew-x-12 translate-x-20 z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-wrap items-center -mx-4">
          
          {/* Left Side: Technical Summary Visual */}
          <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3rem] shadow-2xl">
                <div className="bg-slate-900 rounded-[2.8rem] overflow-hidden p-8 aspect-square flex flex-col justify-center">
                  <h3 className="text-3xl font-black text-white mb-6 leading-tight">
                    From <span className="text-red-500 line-through">Data Loss</span> <br />
                    To <span className="text-emerald-500 italic">Precision.</span>
                  </h3>
                  <div className="space-y-4">
                    {[
                      "Server-Side GTM Architecture",
                      "Meta Conversions API (CAPI)",
                      "First-Party Cookie Setup",
                      "Google Ads Performance Audit"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-white font-bold text-sm tracking-wide">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating ROI Badge */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700"
              >
                <p className="text-blue-600 font-black text-3xl">40%+</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Data Accuracy <br/> Increase</p>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2 px-4 lg:pl-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block">
                The Solution
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-tight">
                Bulletproof <span className="text-blue-600">Tracking</span> Infrastructure for Modern Marketing.
              </h2>
              
              <div className="space-y-10">
                {solutions.map((sol, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="w-12 h-12 shrink-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      {sol.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        {sol.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2 font-medium">
                        {sol.desc}
                      </p>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded uppercase tracking-widest">
                        {sol.benefit}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}