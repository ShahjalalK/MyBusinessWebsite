"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaQuestionCircle, FaArrowRight } from 'react-icons/fa'
import Link from 'next/link';

const faqs = [
  {
    question: "What exactly is Facebook Conversion API (CAPI)?",
    answer: "CAPI is a server-to-server tracking tool that sends data directly from your server to Meta. Unlike the standard browser pixel, it bypasses ad-blockers and iOS privacy restrictions. As a google ads specialist, I recommend this to recover up to 40% of lost conversion data."
  },
  {
    question: "Why should I use GTM Server-Side tracking?",
    answer: "Implementing gtm server side tracking allows you to own your data. It improves website speed, enhances data privacy compliance, and provides a much stronger signal for Facebook and Google Ads algorithms compared to traditional tracking."
  },
  {
    question: "How long does a professional CAPI setup take?",
    answer: "A standard high-performance setup takes 3 to 5 business days. This includes a deep google ads account audit, server configuration, advanced event deduplication, and 48 hours of rigorous validation."
  },
  {
    question: "Is this compatible with Shopify, WordPress, or Next.js?",
    answer: "Yes! Whether it's a Shopify store, a WordPress site, or a custom Next.js application, I can implement a robust facebook capi and GA4 server-side architecture using GTM."
  },
  {
    question: "What is your process for a Google Ads account audit?",
    answer: "I use a proprietary google ads audit checklist to identify tracking leaks, conversion discrepancies, and low-quality event matching. This ensures your ad spend is optimized for actual sales, not just clicks."
  }
];

export default function CapiFAQSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  return (
    <section className="py-28 bg-white dark:bg-[#020617] relative overflow-hidden">
      
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[120px] -z-0"></div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Side: Sticky Content */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-blue-500/20">
                <FaQuestionCircle />
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] lg:max-w-xs">
                Clarity in <br /> <span className="text-blue-600 italic">Tracking.</span>
              </h2>
              
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg leading-relaxed">
                Everything you need to know about professional tracking and why businesses hire a specialized <span className="text-blue-600">google ads specialist</span>.
              </p>

              <div className="pt-6">
                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Need more help?</p>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">Have a custom tracking issue?</h4>
                      <Link href="/book-audit" className="inline-flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:gap-5 transition-all">
                        Get Free Audit <FaArrowRight />
                      </Link>
                   </div>
                   {/* Decorative icon */}
                   <FaQuestionCircle className="absolute -bottom-4 -right-4 text-slate-200 dark:text-slate-800 text-8xl opacity-20 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Accordion Grid */}
          <div className="lg:col-span-8 space-y-5">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group rounded-[2.5rem] transition-all duration-500 border overflow-hidden ${
                  activeIdx === idx 
                  ? 'border-blue-600/50 bg-blue-50/20 dark:bg-blue-600/5 shadow-2xl shadow-blue-500/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-blue-200 dark:hover:border-blue-900'
                }`}
              >
                <button
                  onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-8 md:p-10 text-left outline-none"
                >
                  <span className={`text-xl md:text-2xl font-black tracking-tight leading-snug pr-6 transition-colors duration-300 ${
                    activeIdx === idx ? 'text-blue-600' : 'text-slate-900 dark:text-white group-hover:text-blue-600'
                  }`}>
                    {faq.question}
                  </span>
                  
                  <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    activeIdx === idx 
                    ? 'bg-blue-600 text-white rotate-180' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600'
                  }`}>
                    {activeIdx === idx ? <FaMinus size={14} /> : <FaPlus size={14} />}
                  </div>
                </button>

                <AnimatePresence>
                  {activeIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "circOut" }}
                    >
                      <div className="px-8 md:px-10 pb-10">
                        <div className="h-px w-full bg-gradient-to-r from-blue-600/20 to-transparent mb-6"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg leading-relaxed lg:max-w-2xl">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}