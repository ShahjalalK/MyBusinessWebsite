"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaExclamationTriangle, FaMobileAlt, FaDatabase, FaChartLine } from 'react-icons/fa'
import { AiOutlineCloseCircle } from 'react-icons/ai'

const problems = [
  {
    icon: <FaMobileAlt className="text-red-500" />,
    title: "iOS 14+ Updates",
    desc: "Apple's privacy updates block standard pixel tracking, making your Facebook Ads go blind on iPhone users."
  },
  {
    icon: <FaDatabase className="text-red-500" />,
    title: "Missing Conversions",
    desc: "Up to 40% of your sales and leads aren't being reported back to Ads Manager due to browser restrictions."
  },
  {
    icon: <AiOutlineCloseCircle className="text-red-500" size={28} />,
    title: "Inaccurate Pixel Data",
    desc: "Cookie-based pixels are dying. Relying on them leads to duplicate data or missing attribution entirely."
  },
  {
    icon: <FaChartLine className="text-red-500" />,
    title: "Dropping Ad Performance",
    desc: "When Facebook can't see who converted, its algorithm can't optimize, leading to higher CPA and lower ROAS."
  }
];

export default function CapiProblemSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest"
          >
            <FaExclamationTriangle /> The Tracking Crisis
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            Is Your Business Blindly <br /> 
            <span className="text-red-600">Burning Ad Budget?</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Traditional Facebook Pixel tracking is broken. If you haven't switched to CAPI, you are losing money every single day.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="group p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none transition-all"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 text-2xl transition-transform group-hover:rotate-12">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Warning Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 p-6 rounded-3xl bg-red-600/5 border border-red-600/10 text-center"
        >
          <p className="text-red-600 dark:text-red-400 font-bold text-sm">
            ⚠️ Without CAPI, your Facebook Ads algorithm is working with only 60% of the truth.
          </p>
        </motion.div>

      </div>
    </section>
  )
}