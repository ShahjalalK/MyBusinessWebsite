"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  XCircle, 
  Smartphone, 
  Link2Off, 
  ImageOff, 
  UserX, 
  MousePointerClick, 
  AlertCircle 
} from 'lucide-react'

// ১. প্রবলেম ডাটা লিস্ট
const problems = [
  {
    icon: <UserX size={28} />,
    title: "Unprofessional Image",
    desc: "Your signature looks inconsistent, making your brand appear amateur to high-ticket clients."
  },
  {
    icon: <Link2Off size={28} />,
    title: "Non-Clickable Links",
    desc: "Website, social media, or phone links aren't clickable, killing potential engagement instantly."
  },
  {
    icon: <Smartphone size={28} />,
    title: "Mobile Mess",
    desc: "Signature breaks or looks distorted on mobile devices, frustrating 60% of your recipients."
  },
  {
    icon: <ImageOff size={28} />,
    title: "Broken Images",
    desc: "Images don't load properly or appear as 'red X' boxes, ruining your first impression."
  },
  {
    icon: <MousePointerClick size={28} />,
    title: "Manual Data Entry",
    desc: "Wasting time manually typing contact details in every email instead of having an automated identity."
  },
  {
    icon: <AlertCircle size={28} />,
    title: "Platform Conflicts",
    desc: "Poor formatting in Gmail, Outlook, or Apple Mail makes your brand look chaotic."
  }
];

export default function EmailSignatureProblem() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden font-sans">
      <div className="container mx-auto px-6">
        
        {/* Title Area */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <XCircle size={14} /> The Hidden Cost of Bad Branding
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Is Your Email Signature <br />
            <span className="text-red-600 font-serif italic">Hurting Your Business?</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Many professionals still use outdated signatures—and it’s costing them credibility and massive opportunities every single day.
          </p>
        </div>

        {/* Problem Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {problems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 group"
            >
              {/* Icon Container with Hover Fix */}
              <div className="mb-6 p-4 bg-white dark:bg-slate-800 w-fit rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-300">
                {React.cloneElement(item.icon, {
                  className: "text-red-600 group-hover:text-white transition-colors duration-300"
                })}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {item.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Red Impact Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-red-600 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-red-600/20"
        >
          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-8 leading-[1.1]">
              "Your email is often the first impression you make."
            </h3>
            <p className="text-white/90 text-lg md:text-xl font-medium mb-0 leading-relaxed">
              A weak or broken signature reduces trust, confuses clients, and causes you to lose potential leads. 
              <span className="block mt-6 text-white font-black underline decoration-4 underline-offset-8 italic">
                 It's time for a professional transformation.
              </span>
            </p>
          </div>
          
          {/* Decorative Background Text */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white opacity-[0.07] text-[120px] font-black whitespace-nowrap uppercase tracking-tighter select-none pointer-events-none">
            First Impression
          </div>
        </motion.div>

        {/* Bottom Pro Tip Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-md">Pro Tip</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold tracking-tight text-center">
              Most professionals underestimate how much impact a simple email signature has on their brand.
            </p>
        </div>

      </div>
    </section>
  )
}