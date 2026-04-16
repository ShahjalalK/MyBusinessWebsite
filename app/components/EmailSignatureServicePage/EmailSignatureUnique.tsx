"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Cpu, 
  ShieldCheck, 
  MousePointerClick, 
  History, 
  Settings2, 
  Flame,
  Zap,
  CheckCircle
} from 'lucide-react'

// ১. এডভান্টেজ ডাটা লিস্ট
const advantages = [
  {
    icon: <Cpu size={24} />,
    title: "Design + Clean HTML",
    desc: "We don't just design—we hand-code optimized HTML to ensure flawless performance and zero bugs."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Zero Formatting Issues",
    desc: "Rigorous testing across multiple email clients (Gmail, Outlook, Apple Mail) for a consistent look."
  },
  {
    icon: <MousePointerClick size={24} />,
    title: "Fully Clickable & Functional",
    desc: "Every element is structured properly so your links, icons, and CTA work smoothly without errors."
  },
  {
    icon: <History size={24} />,
    title: "Real-World Experience",
    desc: "With 40+ projects completed, our work is based on practical experience, not just theory."
  },
  {
    icon: <Settings2 size={24} />,
    title: "Simplicity & Usability",
    desc: "Easy to install, easy to use. We prioritize a hassle-free experience for you and your team."
  }
];

export default function EmailSignatureUniqueAdvantage() {
  return (
    <section className="py-24 bg-slate-950 text-white font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-4xl mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6"
          >
            <Zap size={14} fill="currentColor" /> Why Choose Us
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-8">
            More Than Just Design — <br />
            <span className="text-blue-500 italic">Focus on Performance.</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Most providers only focus on looks. We go beyond—combining clean design with technical precision to ensure your signature works perfectly in real-world use.
          </p>
        </div>

        {/* Advantage Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: List */}
          <div className="lg:col-span-7 space-y-6">
            {advantages.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group"
              >
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Visual Highlight Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="lg:col-span-5 sticky top-24 bg-gradient-to-br from-blue-600 to-indigo-800 p-1 rounded-[3rem] shadow-2xl shadow-blue-500/20"
          >
            <div className="bg-slate-950 p-10 rounded-[2.8rem] h-full flex flex-col justify-center">
              <div className="mb-8">
                <Flame size={48} className="text-orange-500 mb-6 animate-pulse" />
                <h4 className="text-3xl font-black mb-4 leading-tight">
                  Built for Real Usage — <br /> Not Just Looks.
                </h4>
                <p className="text-slate-400 text-base font-medium">
                  We understand how email clients behave. We design signatures that actually work—not just look good in a static preview.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Hand-Coded HTML Accuracy</span>
                </div>
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Cross-Platform Reliability</span>
                </div>
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Optimized Image Hosting</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Strong Positioning Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-24 pt-12 border-t border-white/10 text-center"
        >
           <h4 className="text-xl md:text-2xl font-black tracking-tighter">
             "We don't just create signatures — we deliver reliable, <span className="text-blue-500">professional branding tools</span> that work everywhere."
           </h4>
        </motion.div>

      </div>
    </section>
  )
}