"use client"
import React from 'react'
import { motion } from 'framer-motion'
import NextLink from 'next/link' 
import { TrendingUp, Target, Database, ShieldCheck, Sparkles, MousePointer2 } from 'lucide-react'

const benefits = [
  {
    icon: <Database className="text-blue-500" size={28} />,
    title: "100% Data Accuracy",
    description: "Capture every user interaction without gaps. Eliminate 'missing conversions' in your GA4 and Meta Pixel reports by bypassing browser limitations."
  },
  {
    icon: <Target className="text-indigo-500" size={28} />,
    title: "Precision Ad Optimization",
    description: "Feed Meta and Google's AI with high-quality, clean data. Better signal quality allows ad platforms to find your ideal customers more efficiently."
  },
  {
    icon: <TrendingUp className="text-emerald-500" size={28} />,
    title: "Skyrocket ROAS & ROI",
    description: "Accurate tracking leads to smarter bidding. Watch your Cost Per Acquisition (CPA) drop as your Return on Ad Spend (ROAS) reaches new heights."
  },
  {
    icon: <ShieldCheck className="text-purple-500" size={28} />,
    title: "Bypass iOS & Ad-Blockers",
    description: "Recover up to 40% of lost data. Our server-side setup ensures your tracking remains invisible to ad-blockers and resilient against iOS 14+ restrictions."
  }
];

export default function ServerBenefitsSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#020617] relative">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px] mb-4"
          >
            <Sparkles size={14} /> Competitive Advantage
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
            Stop Guessing. <br />
            <span className="text-blue-600">Start Scaling with Data.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Our advanced tracking infrastructure gives you the clarity needed to dominate your market.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-500 group"
            >
              <div className="flex flex-col sm:flex-row items-start gap-8">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500 shrink-0">
                  {React.isValidElement(benefit.icon) && 
                    React.cloneElement(benefit.icon as React.ReactElement<any>, {
                      className: "group-hover:text-white transition-colors duration-500",
                      size: 32
                    })
                  }
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Call-to-Action Card with SEO Keyword */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-[1px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-[3rem] shadow-2xl shadow-blue-500/20"
        >
          <div className="bg-white dark:bg-slate-950 p-8 md:p-14 rounded-[2.9rem] flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left max-w-xl">
              <h4 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight">
                Not sure if your tracking is broken?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                Get a comprehensive <span className="text-blue-600 underline underline-offset-4">Google Ads Audit</span> and uncover hidden data leaks.
              </p>
            </div>

            <NextLink href="/book-audit" className="w-full lg:w-auto group">
              <div className="flex items-center justify-center gap-3 px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] cursor-pointer active:scale-95">
                <span className="text-lg tracking-wide">Claim Your Free Audit</span>
                <MousePointer2 
                  size={24} 
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" 
                />
              </div>
            </NextLink>
          </div>
        </motion.div>

      </div>
    </section>
  )
}