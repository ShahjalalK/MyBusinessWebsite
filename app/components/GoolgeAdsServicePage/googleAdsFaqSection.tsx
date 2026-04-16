"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react'

const faqs = [
  {
    question: "How can I get started with your service?",
    answer: "You can simply contact us through our website or place an order via Fiverr. We’ll discuss your goals and guide you through the next steps."
  },
  {
    question: "Do you work outside of Fiverr?",
    answer: "Yes, we work both on Fiverr and directly with clients. You can choose the platform that is most convenient for you."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept secure payments via Payoneer and Nsave for direct clients. Fiverr orders are processed through Fiverr’s payment system."
  },
  {
    question: "Do you provide conversion tracking setup?",
    answer: "Yes, we set up accurate conversion tracking, including server-side tracking, to ensure reliable and complete data."
  },
  {
    question: "How long does it take to see results?",
    answer: "Most campaigns start showing initial results within 2–4 weeks. However, performance depends on your industry, competition, and budget."
  },
  {
    question: "Will I get reports and updates?",
    answer: "Yes, we provide regular performance reports along with clear insights and recommendations."
  },
   {
    question: "Do you work with eCommerce businesses?",
    answer: "Yes, we specialize in eCommerce and lead generation campaigns."
  },
   {
    question: "What makes your service different from others?",
    answer: "We don’t just run ads — we ensure your tracking is accurate and your data is reliable. This helps us optimize campaigns more effectively and improve ROI."
  },
  {
    question: "Can you fix my existing Google Ads account?",
    answer: "Yes, we can audit, fix, and optimize your existing campaigns to improve performance."
  },
  {
    question: "Do you offer a free consultation?",
    answer: "Yes, we offer a free consultation to understand your business and suggest the best strategy."
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
                Everything you need to know about our Google Ads solutions and how they help your business grow.
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