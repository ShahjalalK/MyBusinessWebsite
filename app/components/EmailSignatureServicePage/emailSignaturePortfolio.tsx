"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link';

// ১. ইন্টারন্যাশনাল ক্লায়েন্টদের জন্য অ্যাট্রাক্টিভ পোর্টফোলিও ডাটা
const portfolioImages = [
  {
    category: "Real Estate Mogul",
    client: "Luxury Properties NY",
    image: "/email-signature/signature1.png", // আপনার স্ক্রিনশটের পাথ এখানে দেবেন
    description: "High-impact signature designed for top-tier real estate brokers to drive more property inquiries.",
    tag: "Clean & Corporate"
  },
  {
    category: "E-commerce Expert",
    client: "Velocity Brands",
    image: "/email-signature/signature2.png", // আপনার স্ক্রিনশটের পাথ এখানে দেবেন
    description: "Modern, clickable signature focusing on social proof and brand authority for digital agencies.",
    tag: "Modern & Bold"
  },
  {
    category: "Real Estate Mogul",
    client: "Luxury Properties NY",
    image: "/email-signature/signature3.png", // আপনার স্ক্রিনশটের পাথ এখানে দেবেন
    description: "High-impact signature designed for top-tier real estate brokers to drive more property inquiries.",
    tag: "Clean & Corporate"
  },
  {
    category: "E-commerce Expert",
    client: "Velocity Brands",
    image: "/email-signature/signature4.png", // আপনার স্ক্রিনশটের পাথ এখানে দেবেন
    description: "Modern, clickable signature focusing on social proof and brand authority for digital agencies.",
    tag: "Modern & Bold"
  }
];

export default function GlobalSignaturePortfolio() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* USA/Global Standard Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-2 mb-4"
          >
            <span className="bg-blue-600/10 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/20">
              Premium Branding Tools
            </span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-[0.95]">
            Turn Every Email Into A <span className="text-blue-600 italic font-serif">Sales Machine.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Stop losing leads with blurry, unprofessional images. We craft 100% responsive, high-converting HTML signatures that command attention.
          </p>
        </div>

        {/* Portfolio Grid - Displaying Screenshots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {portfolioImages.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group"
            >
              {/* Client Badge */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-black text-lg leading-tight">{item.client}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{item.category}</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-md border border-emerald-500/20 uppercase">
                  Live Preview
                </div>
              </div>

              {/* Mockup Frame for Screenshot */}
              <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/10 group-hover:-translate-y-2">
                {/* Browser Toolbar UI */}
                <div className="bg-slate-200/50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>

                {/* The Actual Image/Screenshot */}
                <div className="p-4 bg-white dark:bg-white flex items-center justify-center min-h-[300px]">
                   <img 
                    src={item.image} 
                    alt={item.client} 
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                   />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
              </div>

              {/* Description */}
              <p className="mt-6 text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed px-2">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Global CTA - Targeted for USA Clients */}
        <div className="mt-24 text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link href="/contact" className="bg-slate-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white font-black py-6 px-12 rounded-2xl shadow-3xl flex items-center gap-4 transition-all uppercase text-sm tracking-[0.2em]">
              Start My Brand Transformation <ArrowRight size={20} className="animate-pulse" />
            </Link>
          </motion.div>
          <p className="mt-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-yellow-500" /> Limited Slots Available for This Week
          </p>
        </div>

      </div>
    </section>
  )
}