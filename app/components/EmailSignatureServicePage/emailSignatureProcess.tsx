"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  Code2, 
  Eye, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link';

// ১. প্রসেস স্টেপস ডাটা
const steps = [
  {
    icon: <ClipboardList size={28} />,
    title: "Share Your Details",
    desc: "Provide your name, job title, contact information, logo, and design preferences. You can even choose a style you love."
  },
  {
    icon: <Code2 size={28} />,
    title: "Design & Development",
    desc: "We create your custom signature and hand-code it in clean HTML to ensure everything is pixel-perfect and clickable."
  },
  {
    icon: <Eye size={28} />,
    title: "Review & Revisions",
    desc: "You receive a preview of your signature. We make any necessary adjustments until it matches your expectations perfectly."
  },
  {
    icon: <Send size={28} />,
    title: "Delivery & Setup",
    desc: "Once approved, we deliver your ready-to-use signature with a simple installation guide or video tutorial."
  }
];

export default function EmailSignatureProcessSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Zap size={14} fill="currentColor" /> Streamlined Workflow
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Simple, Fast, and <br />
            <span className="text-blue-600 italic">Hassle-Free.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            We follow a clear process to deliver your professional email signature quickly and efficiently—without any confusion or delays.
          </p>
        </div>

        {/* Timeline Grid Area */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Decorative Connecting Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-1/4 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              {/* Step Number & Icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 dark:bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950">
                  0{idx + 1}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                {step.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium px-2">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Final Conclusion Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mt-20 p-8 md:p-12 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={32} />
               </div>
               <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ready to Use in Minutes</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No technical skills needed—just follow the guide and you're live.</p>
               </div>
            </div>
            
            <Link href="/contact" className="bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all uppercase text-xs tracking-widest active:scale-95 shadow-xl shadow-blue-600/10">
               Start Your Project <ArrowRight size={16} />
            </Link>
          </div>

          {/* Background Decorative Blur */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mb-32 rounded-full" />
        </motion.div>

        {/* Conversion Footer */}
        <div className="mt-12 text-center">
           <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">
             ⚡ From details to delivery — we make it smooth and effortless.
           </p>
        </div>

      </div>
    </section>
  )
}