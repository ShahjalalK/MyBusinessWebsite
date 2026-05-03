"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  Zap, 
  Smartphone, 
  Code2, 
  Users2, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link';

/**
 * SEO & UI Enhancement:
 * 1. Semantic Tags: Used <section>, <article> and <h2> for better indexing.
 * 2. Accessibility: Added aria-labels and ensured Link components are layout-safe.
 * 3. UI: Added subtle hover-glows and improved mobile-friendly padding.
 */

const features = [
  {
    icon: <Sparkles size={24} />,
    title: "Brand-Tailored Signature",
    desc: "Professionally designed signatures that align perfectly with your real estate or corporate brand identity."
  },
  {
    icon: <Zap size={24} />,
    title: "100% Clickable Elements",
    desc: "Interactive phone, email, and social media links that turn every email into a lead generation opportunity."
  },
  {
    icon: <Smartphone size={24} />,
    title: "Responsive Mobile Design",
    desc: "Flawless rendering on iPhone, Android, and tablets ensures your brand looks professional everywhere."
  },
  {
    icon: <Layers size={24} />,
    title: "Multi-Platform Support",
    desc: "Fully compatible with Gmail, Outlook 365, Apple Mail, and all major professional email clients."
  },
  {
    icon: <Code2 size={24} />,
    title: "Pixel-Perfect HTML",
    desc: "Hand-coded, clean HTML source code to avoid spam filters and ensure zero formatting issues."
  },
  {
    icon: <Users2 size={24} />,
    title: "Uniform Team Identity",
    desc: "Maintain a consistent and trustworthy brand image across your entire organization or sales team."
  }
];

export default function EmailSignatureSolution() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617] overflow-hidden font-sans" aria-labelledby="solution-heading">
      <div className="container mx-auto px-6">
        
        {/* Header Section - SEO Optimized */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-[0.25em] mb-8"
          >
            <CheckCircle2 size={14} aria-hidden="true" /> High-Converting Email Solutions
          </motion.div>
          
          <h2 id="solution-heading" className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
            The Professional Edge for <br />
            <span className="text-emerald-600 font-serif italic">Every Modern Business.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
            Stop sending plain emails. Upgrade to a <span className="text-slate-900 dark:text-white font-black italic">clickable, responsive identity</span> that builds credibility and drives massive engagement.
          </p>
        </div>

        {/* Features Grid - Improved UI Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group p-10 rounded-[3rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 transition-all duration-500"
            >
              <div className="mb-8 p-5 bg-emerald-50 dark:bg-emerald-900/30 w-fit rounded-[2rem] text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed font-bold">
                {feature.desc}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Action Card - Layout-Safe Link Button */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 dark:bg-emerald-950/40 rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl border border-white/5"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-white text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-[1.1]">
                Ready to Transform Your <br /> Digital Handshake? 🚀
              </h3>
              <p className="text-slate-300 text-lg md:text-xl font-bold leading-relaxed mb-12">
                Every email you send is a brand touchpoint. Make it <span className="text-emerald-400 underline decoration-2 underline-offset-8">count</span> with a custom-coded signature.
              </p>
              
              {/* FIXED LINK COMPONENT */}
              <div className="flex justify-center lg:justify-start">
                <Link 
                  href="/contact" 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-10 rounded-2xl inline-flex items-center gap-3 transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-600/20 group active:scale-95"
                >
                  Start Customizing Now <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div className="flex-1 bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-md relative">
                <div className="absolute -top-4 -left-4 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Expert Tip</div>
                <p className="text-white/80 text-lg md:text-xl font-bold italic leading-relaxed text-center">
                  "Professionals who use interactive signatures see a 22% increase in direct link clicks from emails."
                </p>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] -mr-48 -mt-48 rounded-full" />
        </motion.div>

        

      </div>
    </section>
  )
}