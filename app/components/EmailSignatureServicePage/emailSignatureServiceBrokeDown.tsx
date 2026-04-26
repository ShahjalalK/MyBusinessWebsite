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
  Layout,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link';

const services = [
  {
    icon: <Palette size={26} />,
    title: "Signature Brand Design",
    desc: "Custom designs tailored to your corporate identity, utilizing your logo and brand colors.",
    color: "bg-blue-500"
  },
  {
    icon: <Code2 size={26} />,
    title: "Hand-Coded HTML",
    desc: "Pixel-perfect, clickable HTML code ensuring your links work flawlessly on every click.",
    color: "bg-emerald-500"
  },
  {
    icon: <Smartphone size={26} />,
    title: "Mobile-Adaptive Layout",
    desc: "Responsive designs optimized for flawless display across all mobile devices and tablets.",
    color: "bg-purple-500"
  },
  {
    icon: <MailCheck size={26} />,
    title: "Platform Optimization",
    desc: "100% compatibility with Gmail, Outlook, Apple Mail, and professional email clients.",
    color: "bg-orange-500"
  },
  {
    icon: <Wrench size={26} />,
    title: "Technical Installation",
    desc: "Step-by-step documentation and support to set up your signature without any hassle.",
    color: "bg-pink-500"
  },
  {
    icon: <Users size={26} />,
    title: "Team-Wide Consistency",
    desc: "Maintain a unified and professional brand image across your entire organization.",
    color: "bg-cyan-500"
  }
];

export default function EmailSignatureServicesBreakdown() {
  return (
    <section className="py-24 bg-[#050a1a] font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header - Center Aligned for Better Impact */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] mb-8"
          >
            <Layout size={14} /> Our Expertise
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-8">
            Complete Solutions for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 italic">Digital Branding.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            We handle everything from creative design to technical HTML coding, delivering a signature that works as hard as you do.
          </p>
        </div>

        {/* Services Grid - Modern Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
              className="relative group p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 backdrop-blur-sm"
            >
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 ${service.color} opacity-0 blur-[60px] group-hover:opacity-20 transition-opacity rounded-full`} />
              
              <div className="relative z-10">
                <div className={`mb-8 p-4 w-fit rounded-2xl text-white ${service.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  {service.icon}
                </div>
                
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
                  {service.title}
                </h3>
                
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">
                  {service.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final CTA Card - Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-24 p-1 rounded-[3rem] bg-gradient-to-br from-blue-500/20 to-emerald-500/20"
        >
          <div className="bg-[#0b1224] rounded-[2.9rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <h4 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter">
                Ready to elevate your emails? 🚀
              </h4>
              <p className="text-slate-400 text-lg font-medium">
                Join 500+ professionals using our clickable HTML signatures.
              </p>
            </div>
            
            <Link href="/contact" className="flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
              Start Project Now <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  )
}