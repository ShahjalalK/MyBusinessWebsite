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
      title: "GA4 & GTM Audit", // SEO Keyword: GA4 Audit
      desc: "Detailed analysis of your current tracking setup to identify data gaps and fix tracking errors.",
      color: "blue"
    },
    {
      num: "02",
      title: "Server-Side Setup", // SEO Keyword: Server-Side Tracking
      desc: "Implementing GTM Server-Side Tracking to bypass iOS restrictions and improve data privacy.",
      color: "indigo"
    },
    {
      num: "03",
      title: "CAPI Integration", // SEO Keyword: Conversion API / CAPI
      desc: "Connecting Meta Conversions API and GA4 for accurate server-to-server event tracking.",
      color: "purple"
    },
    {
      num: "04",
      title: "Ads ROI Scaling", // SEO Keyword: Google Ads ROI
      desc: "Using precise tracking data to optimize your Google Ads and increase overall conversion ROI.",
      color: "green"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section - SEO Optimized Title */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
            Our Data-Driven <span className="text-blue-600">Tracking Workflow</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            A proven 4-step process for flawless <strong>Server-Side Tracking</strong> and <strong>Google Ads optimization</strong> to maximize your marketing performance.
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
            {/* Semantic Step Content */}
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

                {/* Title using strong terminology */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                
                {/* Descriptive text with niche-specific keywords */}
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