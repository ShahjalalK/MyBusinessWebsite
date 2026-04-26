"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Globe2, 
  Award, 
  Verified, 
  Layers, 
  Star,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'

/**
 * SEO & Conversion Optimization:
 * 1. Keywords: Clickable signatures, professional brand identity, brand consistency.
 * 2. Trust Signals: International track record, 100% satisfaction, device-agnostic testing.
 */

const achievements = [
  {
    icon: <Layers size={24} />,
    number: "50+",
    title: "Project Milestone",
    desc: "Successfully crafted premium clickable signatures for diverse corporate brands and local startups."
  },
  {
    icon: <Globe2 size={24} />,
    number: "Global",
    title: "Worldwide Outreach",
    desc: "Delivering professional email branding solutions to clients across USA, UK, and Europe via global platforms."
  },
  {
    icon: <Verified size={24} />,
    number: "100%",
    title: "Client Trust",
    desc: "Maintaining a perfect success rate by prioritizing mobile-responsive designs and technical precision."
  }
];

export default function EmailSignatureProofExperience() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/40 font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Trophy size={14} /> Global Track Record
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Elite Branding Trusted By <br />
            <span className="text-amber-600 italic font-serif">Industry Leaders.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            We specialize in transforming standard emails into powerful marketing tools with clickable HTML signatures that ensure <span className="text-slate-900 dark:text-white font-bold">brand consistency</span> and professionalism.
          </p>
        </div>

        {/* Achievement Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {achievements.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-center group hover:-translate-y-2 transition-all duration-500"
            >
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 w-fit mx-auto rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">
                {item.number}
              </h3>
              <p className="text-amber-600 text-xs font-black uppercase tracking-widest mb-4">
                {item.title}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Experience Insight Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group"
           >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 text-amber-400">
                   <Star size={20} fill="currentColor" />
                   <Star size={20} fill="currentColor" />
                   <Star size={20} fill="currentColor" />
                   <Star size={20} fill="currentColor" />
                   <Star size={20} fill="currentColor" />
                </div>
                <h4 className="text-2xl font-black mb-4 tracking-tight">Proven Design Excellence</h4>
                <p className="text-slate-400 text-base leading-relaxed font-medium">
                   Our signatures are engineered with high-quality HTML code, ensuring they are <span className="text-white">fully responsive</span> and bypass spam filters while looking pixel-perfect on every screen.
                </p>
              </div>
              <TrendingUp className="absolute bottom-[-20px] right-[-20px] text-white/5 size-40 group-hover:rotate-12 transition-transform duration-700" />
           </motion.div>

           <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center"
           >
              <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-6">
                 <CheckCircle2 size={18} /> Optimized & Tested
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Enterprise-Grade Reliability</h4>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-medium">
                We perform rigorous cross-platform testing on <span className="text-slate-900 dark:text-white font-bold">Outlook, Gmail, and Apple Mail</span> to guarantee your signature works flawlessly from the moment you install it.
              </p>
           </motion.div>
        </div>

        {/* Trust Footer */}
        <div className="mt-16 text-center">
           <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 italic">
              <Award size={14} className="text-amber-500" /> Professional Identity • Technical Precision • Global Standards
           </p>
        </div>

      </div>
    </section>
  )
}