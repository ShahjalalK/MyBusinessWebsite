"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Plus, Minus, MessageCircle, ExternalLink, CreditCard, ShieldCheck } from 'lucide-react'
import Link from 'next/link';

/**
 * SEO Optimization:
 * 1. Targeted Keywords: Clickable email signature, HTML email branding, Mobile-responsive signature.
 * 2. Trust Factors: SSL secure hosting, cross-platform testing (Outlook, Gmail, Apple Mail).
 */

const faqs = [
  {
    question: "Which email platforms do you support?",
    answer: "Our signatures are hand-coded in universal HTML, making them fully compatible with Gmail, Outlook (Desktop & Web), Apple Mail, iPhone, and HubSpot."
  },
  {
    question: "Will every element be fully clickable?",
    answer: "Absolutely. We ensure your phone numbers, website links, social media icons, and even your call-to-action buttons are 100% clickable and trackable."
  },
  {
    question: "Is the signature mobile-responsive?",
    answer: "Yes, we use advanced 'fluid-grid' coding techniques to ensure your signature looks pixel-perfect and scales correctly on both iOS and Android devices."
  },
  {
    question: "How long does the delivery take?",
    answer: "Standard delivery is within 24–48 hours. We prioritize precision to ensure the code is error-free before it reaches your inbox."
  },
  {
    question: "Can I include legal disclaimers or HIPAA statements?",
    answer: "Yes, we frequently work with lawyers and medical professionals to include necessary legal disclaimers and HIPAA-compliant text in their branding."
  },
  {
    question: "Do you offer bulk signatures for large teams?",
    answer: "Certainly. We can maintain brand consistency across your entire organization, whether you have 5 or 500+ employees."
  },
  {
    question: "Do I need technical skills to install it?",
    answer: "Not at all. We provide a simplified installation guide and a personalized video tutorial to help you go live in less than 2 minutes."
  },
  {
    question: "Will my images look broken or blocked?",
    answer: "We use premium cloud hosting for images and optimized HTML attributes to ensure your logo and icons display correctly across most email clients without breaking."
  }
];

const paymentFaqs = [
  {
    icon: <ExternalLink size={20} className="text-emerald-500" />,
    question: "Available on Fiverr & Upwork?",
    answer: "Yes, we are active on major freelance marketplaces for secure transactions, or you can opt for a direct collaboration for a more personalized experience."
  },
  {
    icon: <CreditCard size={20} className="text-blue-500" />,
    question: "Secure Payment Methods",
    answer: "We accept Payoneer and Nsave for direct projects. For marketplace orders, all payments are protected by the platform's escrow system."
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
            <HelpCircle size={14} /> Global Support
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Expert Insights & <br />
            <span className="text-slate-400 font-serif italic text-3xl md:text-5xl">Solutions for You.</span>
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

        {/* Payment & Trust Section */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentFaqs.map((pfaq, idx) => (
            <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

        {/* CTA Section */}
        <div className="mt-16 text-center">
           <div className="inline-flex flex-col items-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-4">Need more technical details?</p>
              <Link href="/contact" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                <MessageCircle size={16} /> Consult an Expert
              </Link>
           </div>
        </div>

        {/* SEO Micro-Footer */}
        <div className="mt-12 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">
                Custom HTML Coding • Cross-Platform Testing • Responsive Email Branding
            </p>
        </div>

      </div>
    </section>
  )
}