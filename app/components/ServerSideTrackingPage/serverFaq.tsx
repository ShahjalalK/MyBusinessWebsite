"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react'

const faqs = [
  {
    question: "What is server-side tracking?",
    answer: "Server-side tracking sends data from your server instead of the user’s browser, which makes your tracking more accurate and reliable by bypassing client-side limitations."
  },
  {
    question: "Why is server-side tracking important?",
    answer: "Due to ad blockers, browser restrictions (like Safari's ITP), and privacy updates, a significant amount of data can be lost. Server-side tracking helps recover that data and improves tracking accuracy."
  },
  {
    question: "How much data can be recovered?",
    answer: "In many cases, businesses can recover a noticeable portion (typically 20-40%) of lost data. The exact amount depends on your current setup and traffic sources."
  },
  {
    question: "Do I really need server-side tracking?",
    answer: "If you are running paid ads or relying on accurate analytics to make business decisions, server-side tracking is highly recommended to ensure better data quality and campaign performance."
  },
  {
    question: "Will it work with Google Ads and GA4?",
    answer: "Yes, server-side tracking works perfectly with Google Ads, GA4, and other analytics tools to improve data accuracy and cross-platform attribution."
  },
  {
    question: "Do you set up Facebook Conversion API (CAPI)?",
    answer: "Yes, we implement Facebook Conversion API along with server-side tracking to ensure browser and server events are deduplicated correctly for better optimization."
  },
  {
    question: "How long does the setup take?",
    answer: "Typically, the setup takes between 2 to 5 business days depending on the complexity of your website and tracking requirements."
  },
  {
    question: "Will my website slow down?",
    answer: "No, it actually improves site speed! By moving heavy tracking scripts to the server, there are fewer scripts running in the user’s browser, leading to faster load times."
  },
  {
    question: "Do you provide testing and validation?",
    answer: "Yes, we thoroughly test and validate the setup using GTM Preview mode and platform-specific debug tools to ensure everything is tracking properly."
  },
  {
    question: "Can you fix my existing tracking issues?",
    answer: "Absolutely. We can audit your current setup, identify existing bugs or data gaps, and fix them to restore data integrity."
  },
  {
    question: "What do you need to get started?",
    answer: "We typically need access to your website backend, Google Tag Manager, analytics platforms (GA4), and relevant ad accounts (Meta/Google Ads)."
  },
  {
    question: "Do you offer ongoing support?",
    answer: "Yes, we provide post-setup support and ongoing optimization to ensure your tracking stays updated with the latest browser changes and privacy laws."
  }
];

export default function ServerFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Side: Header & CTA */}
          <div className="lg:w-1/3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] mb-4">
                <HelpCircle size={16} /> Questions & Answers
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
                Still have <br />
                <span className="text-blue-600 font-outline-2">Questions?</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Everything you need to know about our server-side tracking solutions and how they help your business grow.
              </p>
              
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <MessageCircle className="text-blue-600 mb-4" size={32} />
                <p className="text-slate-900 dark:text-white font-black mb-2">Can't find what you're looking for?</p>
                <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2">
                  Contact Support Directly <Plus size={14} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Accordion */}
          <div className="lg:w-2/3 space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-[2rem] border transition-all duration-300 ${
                  openIndex === index 
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <span className={`text-lg font-black tracking-tight ${
                    openIndex === index ? 'text-blue-600' : 'text-slate-900 dark:text-white'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    openIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {openIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
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