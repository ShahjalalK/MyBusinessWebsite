"use client"
import React from 'react'
import { motion } from 'framer-motion'
// Next.js এর আসল Link ইম্পোর্ট করতে হবে এখান থেকে
import NextLink from 'next/link' 
import { TrendingUp, Target, Database, ShieldCheck, Sparkles, MousePointer2, Link as LinkIcon } from 'lucide-react'

const benefits = [
  {
    icon: <Database className="text-blue-500" size={28} />,
    title: "More Accurate Data",
    description: "Capture 100% of user interactions. No more 'missing conversions' or gaps in your Google Analytics 4 or Meta Pixel reports."
  },
  {
    icon: <Target className="text-indigo-500" size={28} />,
    title: "Better Ad Optimization",
    description: "Give Meta and Google's AI the clean data they need to find your ideal customers. Better data leads to higher quality leads."
  },
  {
    icon: <TrendingUp className="text-emerald-500" size={28} />,
    title: "Higher ROI & Lower CPA",
    description: "When your tracking is accurate, your Cost Per Acquisition (CPA) drops, and your Return on Ad Spend (ROAS) skyrockets."
  },
  {
    icon: <ShieldCheck className="text-purple-500" size={28} />,
    title: "Reduced Data Loss",
    description: "Successfully bypass iOS 14+ restrictions and ad-blockers, recovering up to 30-50% of data that was previously invisible."
  }
];

export default function ServerBenefitsSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-xs mb-4"
          >
            <Sparkles size={16} /> Why Choose Server-Side
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Everything You Need to <br />
            <span className="text-blue-600">Scale Your Business.</span>
          </h2>
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
              className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-all duration-300">
                  {React.isValidElement(benefit.icon) && 
                    React.cloneElement(benefit.icon as React.ReactElement<any>, {
                      className: "group-hover:text-white transition-colors duration-300"
                    })
                  }
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Call-to-Action Card */}
        <div className="mt-20 p-[1px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] shadow-2xl shadow-blue-500/10">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.4rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h4 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Ready to stop losing data?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                Let's set up your server-side tracking environment today.
              </p>
            </div>

            {/* FIXED NEXT.JS LINK */}
            <NextLink href="/book-audit" className="w-full md:w-auto group">
              <div className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all duration-300 shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] cursor-pointer active:scale-95">
                <span className="text-base tracking-wide">Get a Free Audit</span>
                <MousePointer2 
                  size={22} 
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" 
                />
              </div>
            </NextLink>
          </div>
        </div>

      </div>
    </section>
  )
}