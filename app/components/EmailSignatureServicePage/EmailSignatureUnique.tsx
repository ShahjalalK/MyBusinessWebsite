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

/**
 * SEO & Performance Optimization:
 * 1. Keywords: Hand-coded HTML, Spam-filter optimized, Cross-platform reliability.
 * 2. Focus: Technical precision over just visual aesthetics.
 */

const advantages = [
  {
    icon: <Cpu size={24} />,
    title: "Hand-Coded HTML Engine",
    desc: "We don't use automated generators. We write clean, table-based HTML code to ensure 100% compatibility with complex email clients."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Anti-Spam Optimization",
    desc: "Our code structure is optimized to bypass spam filters, ensuring your professional identity always reaches the inbox, not the junk folder."
  },
  {
    icon: <MousePointerClick size={24} />,
    title: "Precision Clickability",
    desc: "Every social icon, phone number, and CTA is rigorously tested to be fully functional and trackable across all touchpoints."
  },
  {
    icon: <History size={24} />,
    title: "Proven Global Expertise",
    desc: "With 50+ successful deliveries worldwide, we understand the technical nuances of different regional email standards."
  },
  {
    icon: <Settings2 size={24} />,
    title: "Zero-Skill Deployment",
    desc: "We provide simplified setup files and video walkthroughs, making installation seamless even for non-technical users."
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
            <Zap size={14} fill="currentColor" /> Why Choose Our Technical Approach
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-8">
            Engineering Signatures — <br />
            <span className="text-blue-500 italic font-serif">Built for Conversion.</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            While others focus only on aesthetics, we prioritize <span className="text-white font-bold">technical reliability</span>. We combine premium design with robust HTML to ensure your brand works flawlessly everywhere.
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
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
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
            <div className="bg-slate-950 p-10 rounded-[2.8rem] h-full flex flex-col justify-center relative overflow-hidden">
              <div className="mb-8 relative z-10">
                <Flame size={48} className="text-orange-500 mb-6 animate-pulse" />
                <h4 className="text-3xl font-black mb-4 leading-tight">
                  Responsive & Reliable — <br /> Every Single Pixel.
                </h4>
                <p className="text-slate-400 text-base font-medium">
                  We perform rigorous cross-platform testing to guarantee that your <span className="text-white">clickable signature</span> looks perfect on Outlook, Gmail, and Mobile.
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Pixel-Perfect HTML Accuracy</span>
                </div>
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Cross-Device Synchronization</span>
                </div>
                <div className="flex items-center gap-3">
                   <CheckCircle size={20} className="text-blue-500" />
                   <span className="text-sm font-bold tracking-tight">Cloud-Optimized Asset Hosting</span>
                </div>
              </div>

              {/* Decorative Background Glow */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
            </div>
          </motion.div>
        </div>

        {/* Strong Positioning Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-24 pt-12 border-t border-white/10 text-center"
        >
           <h4 className="text-xl md:text-2xl font-black tracking-tighter opacity-80">
             "Our mission is to replace broken designs with <span className="text-blue-500">high-performance branding</span> that works on every screen."
           </h4>
           <div className="mt-8 flex flex-wrap justify-center gap-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
              <span>Gmail Optimized</span>
              <span>•</span>
              <span>Outlook Certified</span>
              <span>•</span>
              <span>Apple Mail Ready</span>
           </div>
        </motion.div>

      </div>
    </section>
  )
}