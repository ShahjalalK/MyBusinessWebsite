"use client"
import React from 'react'
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } }
}

export default function WorkingProcess() {
  const steps = [
    {
      num: "01",
      title: "Audit & Plan",
      desc: "We analyze your current tracking setup and identify data gaps.",
      color: "blue"
    },
    {
      num: "02",
      title: "SST Setup",
      desc: "Implementing GTM Server-Side Tracking for maximum privacy and accuracy.",
      color: "indigo"
    },
    {
      num: "03",
      title: "API Integration",
      desc: "Connecting Facebook CAPI and GA4 for real-time conversion data.",
      color: "purple"
    },
    {
      num: "04",
      title: "Scale & Optimize",
      desc: "Scale your Google Ads using precise data to increase your overall ROI.",
      color: "green"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
            Our 4-Step <span className="text-blue-600">Success Process</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            We follow a proven workflow to ensure your tracking is flawless and your ads perform at their best.
          </p>
        </motion.div>

        <div className="relative">
          {/* কানেক্টিং ডটেড লাইন (Desktop Only) */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-800 -z-0" />

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="relative text-center group"
              >
                {/* Number Circle */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-16 h-16 bg-${step.color}-50 dark:bg-${step.color}-900/20 text-${step.color}-600 dark:text-${step.color}-400 border-2 border-${step.color}-100 dark:border-${step.color}-800 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl font-black shadow-sm group-hover:shadow-lg transition-all duration-300`}
                >
                  {step.num}
                </motion.div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed px-4">
                  {step.desc}
                </p>

                {/* মোবাইল স্ক্রিনের জন্য ছোট কানেক্টিং লাইন */}
                {index !== steps.length - 1 && (
                  <div className="md:hidden w-px h-12 bg-slate-200 dark:bg-slate-800 mx-auto my-4" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}