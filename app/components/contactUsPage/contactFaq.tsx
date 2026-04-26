"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, MessageSquare, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'

export default function ContactFAQShort() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How fast do you respond?",
      answer: "I usually respond within 2 to 24 hours. For urgent project discussions, reaching out via WhatsApp or Fiverr is the fastest way to get a real-time update.",
      icon: <MessageSquare size={20} className="text-blue-500" />
    },
    {
      question: "Do you offer free consultation?",
      answer: "Absolutely. I offer a 15-minute free technical audit. We can analyze your current GTM/GA4 setup and identify any tracking leakages before you commit to a project.",
      icon: <Sparkles size={20} className="text-orange-500" />
    },
    {
      question: "What are the available payment methods?",
      answer: "I primarily work through Fiverr and Upwork to ensure secure transactions for both parties. For long-term retainers, I also accept Payoneer and direct bank transfers.",
      icon: <CreditCard size={20} className="text-emerald-500" />
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Section Heading */}
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4 bg-blue-50 dark:bg-blue-900/30 px-5 py-2 rounded-full border border-blue-100 dark:border-blue-800"
            >
              <HelpCircle size={14} /> Intelligence Center
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              Still Have <span className="text-blue-600">Questions?</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              Everything you need to know before we start working together.
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-5">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
                    isOpen 
                    ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-900/10 shadow-2xl shadow-blue-500/5' 
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-8 py-8 flex items-center gap-6 text-left"
                  >
                    {/* Icon Slot */}
                    <div className={`hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center transition-all duration-500 ${
                        isOpen ? 'bg-white dark:bg-slate-800 shadow-lg' : 'bg-slate-100 dark:bg-slate-800/50 group-hover:scale-110'
                    }`}>
                        {faq.icon}
                    </div>

                    <div className="flex-1">
                        <span className={`text-xl font-black transition-colors duration-300 ${
                            isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                        }`}>
                        {faq.question}
                        </span>
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <div className="px-8 sm:pl-[6.5rem] pr-8 pb-8">
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed">
                                {faq.answer}
                            </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Trust Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} className="text-emerald-500" /> Secure & Confidential Discussions Guaranteed
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}