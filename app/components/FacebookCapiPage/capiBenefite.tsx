"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaChartLine, FaBullseye, FaUserCheck, FaDatabase } from 'react-icons/fa'
import { BsArrowUpRightCircleFill } from 'react-icons/bs'
import { Rocket, ShieldCheck, Zap, BarChart3 } from 'lucide-react'

const benefits = [
  {
    icon: <Rocket className="w-8 h-8" />,
    title: "Skyrocket Your ROAS",
    desc: "Precision tracking through conversion api allows Meta’s AI to find high-intent buyers. Most of my clients experience a 20-30% boost in Return on Ad Spend within the first month.",
    color: "from-blue-600 to-cyan-500",
    tag: "Efficiency"
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Zero Data Loss (iOS 14+)",
    desc: "Bypass ad-blockers and privacy restrictions effortlessly. With gtm server side tracking, you stop guessing and start seeing 100% of your customer journey clearly.",
    color: "from-indigo-600 to-blue-500",
    tag: "Security"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Faster Ad Learning",
    desc: "Feed Meta’s algorithm with real-time, high-quality signals. Faster data processing means your ads exit the 'learning phase' quicker, saving you significant testing budget.",
    color: "from-blue-700 to-indigo-600",
    tag: "Speed"
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Lower CPA & Scale",
    desc: "Accurate tracking means less wasted spend on non-converters. By reducing your Cost Per Action (CPA), you gain the confidence to scale your budget profitably.",
    color: "from-cyan-600 to-blue-500",
    tag: "Growth"
  }
];

export default function CapiBenefitsSection() {
  return (
    <section className="py-28 bg-white dark:bg-[#020617] relative overflow-hidden">
      
      {/* Premium Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] -z-10"></div>
      
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <span className="w-12 h-[2px] bg-blue-600"></span>
              <span className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px]">
                Business Impact
              </span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
              Transform Ads Into A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500">
                Revenue Machine.
              </span>
            </h2>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="lg:max-w-[320px] p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
          >
            <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-sm">
              "Tracking is the fuel of your Meta Ads. Without CAPI, you're driving with half a tank."
            </p>
          </motion.div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative p-[1px] rounded-[3.5rem] overflow-hidden"
            >
              {/* Gradient Border on Hover */}
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 group-hover:bg-gradient-to-br transition-all duration-500 z-0 shadow-sm"
                   style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }}>
              </div>

              <div className="relative bg-white dark:bg-slate-950 p-10 md:p-12 rounded-[3.4rem] h-full flex flex-col items-start space-y-8 z-10 transition-all duration-500 group-hover:translate-y-[-4px]">
                
                {/* Icon & Badge */}
                <div className="w-full flex justify-between items-start">
                  <div className={`p-4 rounded-3xl bg-gradient-to-br ${benefit.color} text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500`}>
                    {benefit.icon}
                  </div>
                  <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {benefit.tag}
                  </span>
                </div>
                
                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">
                    {benefit.desc}
                  </p>
                </div>

                {/* Bottom Link */}
                <div className="pt-4 mt-auto w-full border-t border-slate-50 dark:border-slate-900 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-blue-600 font-black text-[11px] uppercase tracking-widest">
                     <BsArrowUpRightCircleFill size={22} className="group-hover:rotate-45 transition-transform duration-300" />
                     <span>Client Case Study</span>
                   </div>
                   <div className="flex gap-1">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="w-1 h-1 rounded-full bg-blue-600/30" />
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA / Summary */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 text-center max-w-4xl mx-auto"
        >
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-12"></div>
          <h4 className="text-slate-900 dark:text-white font-black text-2xl md:text-3xl tracking-tight mb-4">
            Ready to reclaim your lost data?
          </h4>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-[0.3em]">
            Spend Less <span className="mx-2 text-blue-600">•</span> Earn More <span className="mx-2 text-blue-600">•</span> Track Everything
          </p>
        </motion.div>

      </div>
    </section>
  )
}