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

// ১. সলিউশন ফিচার লিস্ট
const features = [
  {
    icon: <Sparkles size={24} />,
    title: "Brand-Tailored Design",
    desc: "Professionally designed signatures that perfectly align with your unique brand identity."
  },
  {
    icon: <Zap size={24} />,
    title: "Fully Clickable Links",
    desc: "Every link (phone, email, website, social media) is interactive and ready to convert."
  },
  {
    icon: <Smartphone size={24} />,
    title: "Mobile-First Response",
    desc: "100% responsive designs that look flawless on iPhones, Androids, and tablets."
  },
  {
    icon: <Layers size={24} />,
    title: "Platform Compatibility",
    desc: "Seamless integration with Gmail, Outlook, Apple Mail, and all major email clients."
  },
  {
    icon: <Code2 size={24} />,
    title: "Clean HTML Code",
    desc: "Pixel-perfect hand-coded HTML with zero formatting issues or display bugs."
  },
  {
    icon: <Users2 size={24} />,
    title: "Team-Wide Consistency",
    desc: "Ensure every member of your team carries the same professional brand image."
  }
];

export default function EmailSignatureSolution() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 overflow-hidden font-sans">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <CheckCircle2 size={14} /> The Ultimate Solution
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Turn Every Email Into A <br />
            <span className="text-emerald-600 font-serif italic">Powerful Branding Tool</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            We create clean, professional, and fully clickable email signatures that build instant trust and make it effortless for clients to connect with you.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
            >
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 w-fit rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Why It Works Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 dark:bg-emerald-950 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-white text-3xl md:text-4xl font-black tracking-tight mb-6">
                Why It Works 🚀
              </h3>
              <p className="text-slate-300 text-lg font-medium leading-relaxed mb-8">
                Our signatures are engineered for both <span className="text-emerald-400 font-bold">Design</span> and <span className="text-emerald-400 font-bold">Functionality</span>. Every email you send becomes a consistent, professional touchpoint that drives conversions.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                 <Link href="/contact" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 rounded-xl flex items-center gap-2 transition-all uppercase text-xs tracking-widest active:scale-95">
                    Get Your Signature <ArrowRight size={16} />
                 </Link>
              </div>
            </div>
            
            <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm">
                <p className="text-white/80 text-base font-medium italic leading-relaxed text-center">
                  "Whether you’re an individual professional or a growing team, we make sure your email signature looks perfect across all devices and platforms."
                </p>
            </div>
          </div>
          
          {/* Decorative Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
        </motion.div>

        {/* Final Conversion Line */}
        <div className="mt-16 text-center">
           <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
           >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-600 dark:text-slate-300 text-sm font-bold tracking-tight">
                A simple upgrade can instantly improve your brand image and client trust.
              </p>
           </motion.div>
        </div>

      </div>
    </section>
  )
}