"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, MessageCircle, Sparkles } from 'lucide-react'
import Link from 'next/link';

const faqs = [
  {
    question: "How does Server-Side Tracking bypass ad-blockers?",
    answer: "Traditional tracking happens in the browser, which ad-blockers can easily detect. We move the tracking logic to your own server (Stape or Google Cloud). Since the data flows from your custom domain (e.g., tracking.yourwebsite.com), it appears as first-party data, making it invisible to ad-blockers and iOS restrictions."
  },
  {
    question: "Can you recover my lost Facebook Ads data?",
    answer: "Absolutely. By implementing Meta Conversion API (CAPI) via Server-Side GTM, we send events directly from your server. This bypasses Safari's ITP and iOS 14+ limitations, typically recovering 20-40% of conversions that are usually 'lost' in the browser."
  },
  {
    question: "Will this improve my Google Ads performance?",
    answer: "Yes. Better data accuracy directly impacts Google's Smart Bidding. By feeding GA4 and Google Ads clean, server-side data, your CPA (Cost Per Acquisition) often drops because the algorithm can finally see which ads are actually driving results."
  },
  {
    question: "Do I need a separate server for this?",
    answer: "You don't need to manage a physical server. We use specialized platforms like Stape.io or Google Cloud Platform (GCP). We'll guide you through the most cost-effective setup based on your monthly traffic."
  },
  {
    question: "How do you handle event deduplication?",
    answer: "This is crucial. We use unique Event IDs for both browser and server events. This ensures that if both signals reach the platform (like Meta or Google), they are merged into one, preventing double-counting and maintaining 100% data integrity."
  },
  {
    question: "What is your Audit process before setup?",
    answer: "We perform a 'Deep Tracking Audit' using a technical checklist. We check your current GTM container, pixel health, and data layer accuracy. Only after identifying the gaps do we proceed with the server-side migration."
  }
];

export default function ServerFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-[#020617] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Left Side: Dynamic Header */}
          <div className="lg:w-2/5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sticky top-32"
            >
              <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6">
                <HelpCircle size={16} /> Knowledge Base
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
                Demystifying <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
                  Data Tracking.
                </span>
              </h2>
              <p className="text-slate-400 font-bold text-lg mb-10 leading-relaxed">
                Everything you need to know about migrating to a first-party tracking infrastructure.
              </p>
              
              <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 backdrop-blur-sm group hover:border-blue-500/50 transition-all duration-500">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:rotate-12 transition-transform">
                    <MessageCircle size={24} />
                </div>
                <h4 className="text-white font-black text-xl mb-3">Have a specific challenge?</h4>
                <p className="text-slate-400 font-medium text-sm mb-6">
                  If you have a custom setup or unique tracking issues, let's talk directly.
                </p>
                <Link href="/book-audit" className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black text-sm hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                  Book a Free Audit <Sparkles size={16} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Accordion */}
          <div className="lg:w-3/5 space-y-5">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                  openIndex === index 
                  ? 'border-blue-500/50 bg-blue-600/5 shadow-2xl shadow-blue-500/5' 
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-10 py-8 flex items-center justify-between text-left"
                >
                  <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${
                    openIndex === index ? 'text-blue-500' : 'text-white'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    openIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-800 text-slate-400'
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
                    >
                      <div className="px-10 pb-10 text-slate-400 font-bold text-[16px] leading-relaxed border-t border-slate-800/50 pt-6">
                        {faq.answer}
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