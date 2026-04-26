"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaClipboardCheck, FaPlug, FaMicroscope, FaRocket } from 'react-icons/fa'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    icon: <FaClipboardCheck />,
    step: "01",
    title: "Account & Tracking Audit",
    desc: "I perform a rigorous google ads account audit and Pixel health check. Using my custom google ads audit checklist, I identify exactly where your tracking leaks are occurring.",
    color: "bg-blue-600",
    shadow: "shadow-blue-500/20"
  },
  {
    icon: <FaPlug />,
    step: "02",
    title: "Server-Side Tagging Setup",
    desc: "Implementing robust gtm server side tracking to bypass iOS 14+ restrictions. This server side tagging gtm architecture ensures data durability and improved website performance.",
    color: "bg-indigo-600",
    shadow: "shadow-indigo-500/20"
  },
  {
    icon: <FaMicroscope />,
    step: "03",
    title: "CAPI Signal Validation",
    desc: "Deploying the facebook capi with advanced event deduplication. I verify every signal using Meta's Test Events tool to ensure 100% data accuracy for your campaigns.",
    color: "bg-cyan-500",
    shadow: "shadow-cyan-500/20"
  },
  {
    icon: <FaRocket />,
    step: "04",
    title: "ROAS Scaling & Reporting",
    desc: "As a google ads specialist, I provide a final technical report with actionable insights. Your setup is now ready to scale with a high-score Conversion API configuration.",
    color: "bg-blue-800",
    shadow: "shadow-blue-900/20"
  }
];

export default function CapiProcessSection() {
  return (
    <section className="py-28 bg-white dark:bg-[#020617] relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10"></div>

      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">The Workflow</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
            My Proven <span className="text-blue-600 italic">4-Step</span> <br /> 
            Tracking Framework.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            From technical audit to profit-ready data pipelines—I handle your <span className="text-slate-900 dark:text-white underline decoration-blue-500/30">facebook capi</span> setup in under 5 business days.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          
          {/* Connector Line (Animated) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-1 bg-slate-100 dark:bg-slate-900 -z-10">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500"
            />
          </div>

          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="relative group"
            >
              {/* Step Circle with Icon */}
              <div className="relative mb-8">
                <div className={`w-24 h-24 ${item.color} ${item.shadow} rounded-[2.5rem] flex items-center justify-center text-white text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10 overflow-hidden`}>
                   <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                   {item.icon}
                </div>
                
                {/* Step Number Badge */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-[#041f60] dark:text-white text-lg font-black shadow-xl border border-slate-100 dark:border-slate-800 z-20 transition-transform group-hover:scale-110">
                   {item.step}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-4 pr-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-[15px]">
                  {item.desc}
                </p>
                
                <div className="lg:hidden flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest pt-2">
                   <span>Next Step</span> <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Process Guarantee / CTA Area */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-28 relative group"
        >
          <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
          <div className="relative p-10 md:p-14 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-10 justify-between overflow-hidden">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-600 shrink-0 animate-bounce transition-all duration-1000">
                 <FaRocket size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Hire a Professional Specialist.</h4>
                <p className="text-slate-500 dark:text-slate-400 font-bold">
                  Guaranteed deployment in: <span className="text-blue-600 font-black italic">72 Hours</span>
                </p>
              </div>
            </div>
            
            <Link href="/book-audit" className="group w-full md:w-auto px-12 py-5 bg-[#041f60] dark:bg-blue-600 text-white rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-4 active:scale-95">
                Start My Free Audit <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  )
}