"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, 
  Code2, 
  Smartphone, 
  MailCheck, 
  Wrench, 
  Users, 
  RotateCcw,
  CheckCircle,
  Layout
} from 'lucide-react'

// ১. সার্ভিস ব্রেকডাউন ডাটা
const services = [
  {
    icon: <Palette size={24} />,
    title: "Custom Signature Design",
    desc: "Tailored to your brand identity, including logo, brand colors, and professional typography."
  },
  {
    icon: <Code2 size={24} />,
    title: "HTML Coding (Clickable)",
    desc: "Professionally hand-coded HTML ensuring all links like phone, website, and social icons work perfectly."
  },
  {
    icon: <Smartphone size={24} />,
    title: "Mobile-Responsive Layout",
    desc: "A layout designed to look flawless on desktop, tablet, and mobile devices automatically."
  },
  {
    icon: <MailCheck size={24} />,
    title: "Platform Compatibility",
    desc: "Tested to work smoothly across Gmail, Outlook, Apple Mail, and all major email clients."
  },
  {
    icon: <Wrench size={24} />,
    title: "Easy Installation Guide",
    desc: "Simple step-by-step or video instructions to install your signature without any technical hassle."
  },
  {
    icon: <Users size={24} />,
    title: "Multiple Team Signatures",
    desc: "Need it for your team? We ensure a consistent and polished brand image for every member."
  },
  {
    icon: <RotateCcw size={24} />,
    title: "Revisions & Support",
    desc: "Unlimited revisions until you're satisfied, plus post-delivery support for any setup help."
  }
];

export default function EmailSignatureServicesBreakdown() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50 font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-3xl mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mb-4"
          >
            <Layout size={14} /> Comprehensive Solutions
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Everything You Need For A <br />
            <span className="text-blue-600 underline decoration-slate-200 underline-offset-8 italic">Perfect Email Signature</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            We provide a complete, done-for-you solution — from design to coding — so you can start using your professional signature without any hassle.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col group"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="p-3 bg-white dark:bg-slate-800 text-blue-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {service.icon}
                </div>
                <span className="text-slate-200 dark:text-slate-800 font-black text-4xl group-hover:text-slate-300 dark:group-hover:text-slate-700 transition-colors">
                  0{idx + 1}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {service.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Final Conclusion Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mt-24 p-8 md:p-12 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-4">
                <CheckCircle size={16} /> Ready to Use
              </div>
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight">
                Simple, Clean, and Ready to Use 🚀
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Our goal is to deliver a high-quality email signature that works flawlessly — so you can focus on your business while we handle the rest.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-8 md:pt-0 md:pl-12">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No technical skills needed</p>
               <div className="px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-600/20">
                  Full Setup Handled
               </div>
            </div>
          </div>
        </motion.div>

        {/* Optional Conversion Line */}
        <div className="mt-12 text-center opacity-60">
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
             From initial design to final setup — we take care of it all.
           </p>
        </div>

      </div>
    </section>
  )
}