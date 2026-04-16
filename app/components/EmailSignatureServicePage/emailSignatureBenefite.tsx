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
  ArrowUpRight
} from 'lucide-react'

// ১. বেনিফিট ডাটা লিস্ট
const benefits = [
  {
    icon: <Trophy size={24} />,
    title: "Strong Professional Image",
    desc: "Make every email look clean, modern, and trustworthy. Instantly stand out from the competition."
  },
  {
    icon: <MousePointer2 size={24} />,
    title: "More Client Engagement",
    desc: "Let clients easily click and connect with you through integrated phone, email, or social links."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Consistent Branding",
    desc: "Maintain a uniform and polished look for you or your entire team across every single email."
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Better Business Visibility",
    desc: "Promote your website, services, and social profiles effortlessly in every email you send."
  },
  {
    icon: <SmartphoneNfc size={24} />,
    title: "Mobile-Friendly Experience",
    desc: "Your signature looks perfect on all devices—ensuring a flawless experience on desktop and mobile."
  },
  {
    icon: <Clock size={24} />,
    title: "Time-Saving & Efficiency",
    desc: "No more manually adding contact details. Everything is automated and ready to go instantly."
  }
];

export default function EmailSignatureBenefitSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 font-sans">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16 border-b border-slate-100 dark:border-slate-800 pb-12">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-[0.3em] mb-4"
            >
              <TrendingUp size={14} /> The ROI of Quality Design
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
              More Than Just A Signature — <br />
              <span className="text-blue-600 italic">A Better First Impression.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
              When you upgrade to a professional clickable email signature, you don’t just improve looks — you strengthen your entire brand communication.
            </p>
          </div>
          
          <div className="hidden lg:block">
             <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter">100%</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Brand Growth</p>
             </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium pl-2 border-l-2 border-slate-100 dark:border-slate-800 group-hover:border-blue-600 transition-all">
                {benefit.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Deep Insight / Why It Matters Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mt-24 p-10 md:p-16 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20">
              <Lightbulb size={48} className="text-yellow-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                Why It Matters 💡
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                Every email you send is an opportunity. A professional signature helps you make a lasting impression, build trust, and turn <span className="text-blue-600 font-bold">simple conversations into real business opportunities.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Small Conversion Line */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2">
            <ArrowUpRight size={14} className="text-blue-600" /> Small detail, big impact — generate more leads quietly.
          </p>
        </div>

      </div>
    </section>
  )
}