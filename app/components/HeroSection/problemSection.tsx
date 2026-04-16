"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ShieldOff, MousePointerClick, TrendingDown, PanelsLeftBottomIcon, ArrowUpRight } from 'lucide-react'
import Link from 'next/link';

const MotionLink = motion(Link);

const problems = [
  {
    title: "iOS 14+ Data Loss",
    desc: "Apple's privacy updates are blocking up to 40% of your conversion data, making your ads look like they're failing.",
    icon: <ShieldOff className="w-6 h-6 text-red-500" />,
  },
  {
    title: "Ad-Blocker Interference",
    desc: "Standard browser tracking is easily blocked by extensions, leaving huge gaps in your customer journey maps.",
    icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
  },
  {
    title: "Inaccurate Attribution",
    desc: "If you don't know exactly where your sales are coming from, you're burning your ad budget on the wrong keywords.",
    icon: <TrendingDown className="w-6 h-6 text-rose-500" />,
  },
  {
    title: "Poor Email Authority",
    desc: "Plain text signatures or broken links make your professional outreach look amateur and untrustworthy.",
    icon: <MousePointerClick className="w-6 h-6 text-amber-500" />,
  }
]

export default function ProblemSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/20">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-red-600 dark:text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
          >
            The Hard Truth
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
            Stop Flying Blind With <br />
            <span className="text-red-600">Broken Data.</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Most businesses are losing thousands of dollars every month simply because their tracking is outdated. Are you one of them?
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((prob, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 md:p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-red-500/30 transition-all duration-300 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-14 h-14 shrink-0 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {prob.icon}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {prob.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {prob.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

   
 <motion.div 
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.5 }} // স্ক্রিনের মাঝখানে আসলে অ্যানিমেশন হবে
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="mt-24 text-center p-12 md:p-16 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.1)] border border-blue-50 dark:border-slate-800 relative overflow-hidden"
>
  {/* ডেকোরেটিভ ব্যাকগ্রাউন্ড গ্লো (খুবই হালকা) */}
  <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -z-0" />
  <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-100/30 dark:bg-red-900/10 rounded-full blur-3xl -z-0" />

  <div className="relative z-10">
    <p className="text-slate-800 dark:text-white font-bold text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-balance">
      "Most e-commerce businesses are unknowingly losing <span className="text-red-500 font-extrabold underline decoration-red-500/30 underline-offset-8">30% to 40% of their conversion data</span> due to iOS 14+ restrictions and browser ad-blockers."
    </p>
    
    <div className="mt-8 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.3em] bg-red-600/10 px-4 py-2 rounded-full border border-red-600/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
        The Industry Reality
      </div>
      <p className="text-slate-500 text-[12px] font-bold italic">
        Source: Modern Tracking Audit Insights
      </p>
    </div>

    {/* একটি ছোট অ্যাকশন বাটন বাCTA */}
    <MotionLink 
        href="/book-audit"
        whileHover={{ 
          scale: 1.05,
          y: -2,
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" 
        }}
        whileTap={{ scale: 0.95 }}
        className="mt-12 inline-flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black py-4 px-10 rounded-[1.25rem] transition-colors duration-300 shadow-sm group"
      >
        {/* আইকন কন্টেইনার */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40 transition-colors">
          <PanelsLeftBottomIcon className="w-5 h-5 text-[#4285F4]" />
        </div>
        
        <span className="text-sm md:text-base tracking-tight">
          Get A Free Tracking Audit
        </span>
        
        {/* অ্যারো আইকন যা হোভারে মুভ করবে */}
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
      </MotionLink>
  </div>
</motion.div>
      </div>
    </section>
  )
}