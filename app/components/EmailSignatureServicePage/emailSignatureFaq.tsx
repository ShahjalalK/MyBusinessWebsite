"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Plus, Minus, MessageCircle, ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link';

// ১. FAQ ডাটা লিস্ট
const faqs = [
  {
    question: "Which email platforms do you support?",
    answer: "We create email signatures that work perfectly with Gmail, Outlook, Apple Mail, and most major email clients."
  },
  {
    question: "Will all links be clickable?",
    answer: "Yes, all important elements such as your phone number, email address, website, and social media links will be fully clickable."
  },
  {
    question: "Will the signature work on mobile devices?",
    answer: "Absolutely. Your email signature will be mobile-friendly and display properly on all screen sizes."
  },
  {
    question: "How long does delivery take?",
    answer: "Most email signatures are delivered within 24–48 hours, depending on the complexity and revisions."
  },
  {
    question: "Do you provide revisions?",
    answer: "Yes, we offer revisions to ensure your signature looks exactly the way you want."
  },
  {
    question: "Can you create signatures for my entire team?",
    answer: "Yes, we can design consistent email signatures for your whole team to maintain a professional brand image."
  },
  {
    question: "Do I need coding knowledge to use the signature?",
    answer: "No, you don’t need any technical skills. We provide simple step-by-step instructions (or video guide) to help you install it easily."
  },
  {
    question: "Will images or icons break in email clients?",
    answer: "No, we use optimized hosting and clean HTML methods to ensure your signature displays correctly without broken images."
  },
  {
    question: "Can you match my brand colors and style?",
    answer: "Yes, we design your signature based on your brand identity, including colors, logo, and overall style."
  }
];

// পেমেন্ট সংক্রান্ত বিশেষ FAQ
const paymentFaqs = [
  {
    icon: <ExternalLink size={20} className="text-emerald-500" />,
    question: "Can I order through Fiverr?",
    answer: "Yes, you can place your order through Fiverr for platform security, or work with us directly — whichever is more convenient for you."
  },
  {
    icon: <CreditCard size={20} className="text-blue-500" />,
    question: "What payment methods do you accept?",
    answer: "We accept payments via Payoneer and Nsave for direct clients. Fiverr orders are handled through Fiverr’s secure system."
  }
];

export default function EmailSignatureFAQSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white dark:bg-slate-950 font-sans">
      <div className="container mx-auto px-6">
        
        {/* Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <HelpCircle size={14} /> Common Questions
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Got Questions? <br />
            <span className="text-slate-400 font-serif italic italic text-3xl md:text-5xl">We’ve Got Answers.</span>
          </h2>
        </div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden"
            >
              <button 
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors"
              >
                <span className="text-lg font-bold text-slate-900 dark:text-white pr-4 leading-tight">
                  {faq.question}
                </span>
                <div className="text-slate-400">
                  {activeIdx === idx ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              
              <AnimatePresence>
                {activeIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white dark:bg-slate-900"
                  >
                    <p className="p-6 pt-0 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Special Payment/Trust Section */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentFaqs.map((pfaq, idx) => (
            <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                 {pfaq.icon}
                 <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{pfaq.question}</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {pfaq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action Footer */}
        <div className="mt-16 text-center">
           <div className="inline-flex flex-col items-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-4">Still have questions?</p>
              <Link href="/contact" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-transform">
                <MessageCircle size={16} /> Contact Us Directly
              </Link>
           </div>
        </div>

      </div>
    </section>
  )
}