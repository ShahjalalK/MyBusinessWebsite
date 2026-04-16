"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'

export default function ContactFAQShort() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How fast do you respond?",
      answer: "I usually respond within 2 to 24 hours. For urgent project discussions, reaching out via WhatsApp or Fiverr is the fastest way."
    },
    {
      question: "Do you offer free consultation?",
      answer: "Yes, I offer a 15-minute free consultation call or technical audit to understand your business goals and suggest the best tracking or marketing strategy."
    },
    {
      question: "What are the available payment methods?",
      answer: "I primarily work through Fiverr and Upwork for secure transactions. For direct long-term projects, I accept Payoneer and direct bank transfers."
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-4 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full">
              <HelpCircle size={14} /> Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Quick Answers
            </h2>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-[2rem] transition-all duration-300 ${
                  openIndex === index 
                  ? 'border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    openIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
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
                      <div className="px-8 pb-6 text-slate-500 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-2 pt-4 text-sm">
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