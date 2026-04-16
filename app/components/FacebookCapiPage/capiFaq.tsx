"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaQuestionCircle } from 'react-icons/fa'
import Link from 'next/link';

const faqs = [
  {
    question: "What exactly is Facebook Conversion API (CAPI)?",
    answer: "CAPI is a server-to-server tracking tool that sends data directly from your website's server to Facebook. Unlike the standard browser pixel, it isn't affected by ad-blockers, iOS 14 privacy updates, or cookie restrictions."
  },
  {
    question: "Is it really necessary for my business in 2026?",
    answer: "Yes! Browser-based tracking is losing up to 40% of data. Without CAPI, your Facebook Ads are 'blind' to a large portion of your audience, leading to higher costs and poor optimization. It's now a requirement for serious advertisers."
  },
  {
    question: "How long does the setup take?",
    answer: "A standard professional setup usually takes 3 to 5 business days. This includes the initial audit, server configuration, event matching, and a minimum of 48 hours of testing to ensure data accuracy."
  },
  {
    question: "Is it compatible with my website (Shopify, WordPress, etc.)?",
    answer: "Absolutely! I can implement CAPI on almost any platform including WordPress, Shopify, Next.js, and custom-coded sites using Google Tag Manager (GTM) Server-Side."
  },
  {
    question: "What do you need from me to get started?",
    answer: "I will need access to your Facebook Business Manager, Google Tag Manager, and your website's backend. Don't worry, I'll provide a simple guide or jump on a quick call to help you with the access."
  }
];

export default function CapiFAQSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Left: Heading */}
          <div className="lg:col-span-1 space-y-6">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 text-3xl">
              <FaQuestionCircle />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              Common <br /> <span className="text-blue-600">Questions.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Everything you need to know about the setup process and how it benefits your business. 
            </p>
            <div className="pt-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Still have questions?
              </p>
              <Link href="/contact" className="text-blue-600 font-black hover:underline mt-2 inline-block">
                Contact me directly →
              </Link>
            </div>
          </div>

          {/* Right: Accordion */}
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className={`border rounded-[2rem] transition-all duration-300 ${
                  activeIdx === idx 
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <button
                  onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-8 text-left"
                >
                  <span className={`text-lg font-black tracking-tight ${
                    activeIdx === idx ? 'text-blue-600' : 'text-slate-900 dark:text-white'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    activeIdx === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {activeIdx === idx ? <FaMinus size={12} /> : <FaPlus size={12} />}
                  </div>
                </button>

                <AnimatePresence>
                  {activeIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}