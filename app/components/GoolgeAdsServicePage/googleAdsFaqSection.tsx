"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link';

const faqs = [
  {
    question: "How can I hire a Google Ads expert for my business?",
    answer: "Getting started is seamless. You can book a consultation directly through our site or hire a Google Ads expert from our team via Fiverr. We focus on a data-first strategy to ensure your scaling is profitable from day one."
  },
  {
    question: "What is included in a professional Google Ads account audit?",
    answer: "Our deep Google ads account audit covers tracking integrity, conversion leakage, quality score optimization, and competitor gap analysis. We don't just find errors; we provide a roadmap for $10k+ monthly spend scaling."
  },
  {
    question: "Why should I implement server side tagging GTM?",
    answer: "Traditional pixel tracking is losing 30-40% of data due to iOS 14+ and ad-blockers. By using server side tagging GTM and GA4, we recover this data, allowing Google's smart bidding to work with 100% accuracy."
  },
  {
    question: "What makes your Google Ads specialist team different?",
    answer: "We are more than just managers; we are technical architects. Every Google Ads specialist on our team is expert in both creative copywriting and advanced server-side measurement protocols like Meta CAPI."
  },
  {
    question: "Do you provide GA4 and Meta Conversion API setup?",
    answer: "Yes, we specialize in eCommerce tracking. We integrate Meta conversions API (Facebook CAPI) and GA4 server side tracking to give you a unified view of your customer journey and increase your ROAS."
  },
  {
    question: "Can you fix my current Google Ads tracking errors?",
    answer: "Absolutely. We can perform an audit checklist of your current setup, fix GTM container errors, and migrate your tracking to a privacy-first server-side environment for long-term stability."
  }
];

export default function ServerFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Left Side: Modern Header */}
          <div className="lg:w-5/12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="sticky top-32"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 mb-6">
                <Sparkles size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expertise & Support</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                Mastering Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Digital Growth.</span>
              </h2>
              
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-10 max-w-md">
                Find answers to common questions about our technical measurement framework and how we help businesses scale with 100% data accuracy.
              </p>
              
              <div className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-blue-500/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl group-hover:bg-blue-600/20 transition-colors" />
                <h4 className="text-xl font-black dark:text-white mb-2">Need a tailored plan?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Get a free Google Ads audit checklist and strategy call.</p>
                <Link 
                  href="/book-audit" 
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 w-fit"
                >
                  Book Free Consultation <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Enhanced Accordion */}
          <div className="lg:w-7/12 space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group rounded-[2rem] border transition-all duration-500 ${
                  openIndex === index 
                  ? 'border-blue-500/50 bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-7 flex items-center justify-between text-left"
                >
                  <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                    openIndex === index ? 'text-blue-600' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    openIndex === index 
                    ? 'bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-600/10 group-hover:text-blue-600'
                  }`}>
                    {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8">
                        <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800 mb-6" />
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
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