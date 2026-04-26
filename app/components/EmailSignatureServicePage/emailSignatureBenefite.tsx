"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  MousePointer2, 
  ShieldCheck, 
  TrendingUp, 
  SmartphoneNfc, 
  Clock, 
  Lightbulb,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react'

/**
 * SEO & UI Enhancement Notes:
 * 1. Keywords: Used "Professional First Impression," "Brand Growth," and "Mobile-Friendly Email Signature."
 * 2. UI: Added a "Glassmorphism" effect for the Why It Matters card.
 * 3. Layout: Improved grid spacing and added subtle border-glow on hover.
 */

const benefits = [
  {
    icon: <Trophy size={24} />,
    title: "Elite Professional Image",
    desc: "Transform your emails into high-end digital business cards. Instantly gain trust from premium clients."
  },
  {
    icon: <MousePointer2 size={24} />,
    title: "High Engagement CTR",
    desc: "Integrated clickable links for your website, social media, and portfolio drive more traffic effortlessly."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Unified Brand Authority",
    desc: "Maintain a consistent and polished corporate identity for you and your entire team across every inbox."
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Passive Lead Generation",
    desc: "Turn your daily emails into a marketing channel that promotes your services and offers 24/7."
  },
  {
    icon: <SmartphoneNfc size={24} />,
    title: "Perfect Cross-Device UX",
    desc: "Flawless rendering on desktop and mobile ensures your signature never looks broken or unprofessional."
  },
  {
    icon: <Clock size={24} />,
    title: "Seamless Integration",
    desc: "Once setup, your signature works automatically. No more manual entry of contact details in every reply."
  }
];

export default function EmailSignatureBenefitSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#020617] font-sans overflow-hidden" aria-labelledby="benefit-heading">
      <div className="container mx-auto px-6">
        
        {/* Section Header - SEO Focus */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-20 border-b border-slate-100 dark:border-slate-800/50 pb-12">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase text-[11px] tracking-[0.3em] mb-6"
            >
              <TrendingUp size={14} className="animate-bounce-slow" /> Maximizing Your Branding ROI
            </motion.div>
            <h2 id="benefit-heading" className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
              More Than A Signature — <br />
              <span className="text-blue-600 font-serif italic">Your Digital Handshake.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold leading-relaxed max-w-xl">
              A professional signature is an investment that strengthens trust and turns <span className="text-slate-900 dark:text-white">routine emails</span> into <span className="text-blue-600">business growth.</span>
            </p>
          </div>
          
          {/* Stats Badge - UI UI Element */}
          <div className="hidden lg:block relative group">
              <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative p-8 bg-slate-50 dark:bg-slate-900/80 rounded-[2rem] border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                <p className="text-slate-900 dark:text-white font-black text-4xl tracking-tighter mb-1">100%</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Design Accuracy</p>
              </div>
          </div>
        </div>

        {/* Benefits Grid - Clean UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {benefits.map((benefit, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="relative group p-6 rounded-3xl hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all duration-500"
            >
              <div className="mb-6 flex flex-col gap-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 w-fit rounded-2xl group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed font-bold pl-4 border-l-2 border-slate-100 dark:border-slate-800 group-hover:border-blue-600 transition-all">
                {benefit.desc}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Why It Matters - Premium Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-20 rounded-[4rem] bg-slate-900 dark:bg-slate-950 border border-slate-800 relative overflow-hidden group shadow-2xl"
        >
          {/* Decorative Glow */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full group-hover:bg-blue-600/20 transition-all" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-14">
            <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-600/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Lightbulb size={50} className="text-white animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">
                Small Detail, Massive ROI 💡
              </h4>
              <p className="text-slate-400 text-lg md:text-xl font-bold leading-relaxed max-w-2xl">
                In the professional world, consistency is key. A custom signature ensures you never miss a chance to <span className="text-white underline decoration-blue-600 decoration-4 underline-offset-8">promote your presence</span> and build instant authority.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Conversion Signal */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
             <ExternalLink size={14} className="text-blue-600" />
             <p className="text-slate-500 dark:text-slate-400 text-[12px] font-black uppercase tracking-widest">
               Optimized for Gmail, Outlook, Apple Mail & More.
             </p>
          </div>
        </div>

      </div>
    </section>
  )
}