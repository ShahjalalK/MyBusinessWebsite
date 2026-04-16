"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } }
}

export default function CaseStudy() {
  const cases = [
    {
      title: "Fixing Data Tracking for Scalable E-commerce Growth",
      desc: "Implemented Facebook CAPI to improve data accuracy between Shopify and Meta Ads, helping ensure more reliable tracking and better ad optimization.",
      tags: ["FB CAPI", "E-commerce"],
      imgText: "E-commerce GA4 Dashboard",
      link : "/case-studies/ecommerce-tracking-fix" // আপনার তৈরি করা নতুন পেজের লিঙ্ক দিন
    },
    {
      title: "Improving Lead Tracking with Server-Side Setup",
      desc: "Set up server-side tracking with Google Tag Manager to reduce data loss and improve conversion tracking accuracy for better Google Ads performance.",
      tags: ["SST + GTM", "Local Business"],
      imgText: "Local Business Analytics Setup",
      link : "/case-studies/local-business-audit"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-2xl">
            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
              Proven Track Record
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.9]">
              Success <span className="text-blue-600">Stories.</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed">
              We don't just track data; we drive revenue. See how our technical expertise translates into business growth.
            </p>
          </div>
          
          <Link 
            href="/case-studies"
            className="group px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-white font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
          >
            View Demo Projects
            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </Link>
        </motion.div>

        {/* Case Studies Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {cases.map((item, index) => (
            <motion.div 
              key={index}
              variants={fadeInUp}
              className="group relative flex flex-col"
            >
              {/* পুরো কার্ডটিকে ক্লিকেবল করার জন্য ইনভিজিবল লিঙ্ক */}
              <Link href={item.link} className="absolute inset-0 z-30" aria-label={item.title} />

              {/* Image Card */}
              <div className="relative h-[400px] w-full overflow-hidden rounded-[2.5rem] mb-8 bg-slate-200 dark:bg-slate-800 shadow-2xl shadow-blue-500/5 transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                
                <div className="w-full h-full flex items-center justify-center p-12">
                  <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] flex items-center justify-center relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors group-hover:border-blue-500/50">
                    <span className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">{item.imgText}</span>
                  </div>
                </div>

                <div className="absolute top-6 left-6 z-20">
                   <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-white/20">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Case #0{index + 1}</p>
                   </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-2">
                <div className="flex items-center gap-4 mb-6">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-1.5 rounded-full uppercase">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors leading-[1.1] tracking-tighter">
                  {item.title}
                </h3>
                
                {/* লাফানো বন্ধ করতে line-clamp-none সরিয়ে দেওয়া হয়েছে */}
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base mb-8 line-clamp-2 h-[3rem]">
                  {item.desc}
                </p>

                <div className="inline-flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-[0.2em]">
                  View Case Details
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}