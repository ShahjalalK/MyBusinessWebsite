"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ShieldAlert, Cpu, BarChart, Sparkles, MailCheck } from 'lucide-react'
import Link from 'next/link'

const technicalSolutions = [
  {
    title: "Clickable Email Signature Branding",
    problem: "Generic, unprofessional emails failing to convert or build brand trust.",
    solution: "Custom, interactive clickable email signature with tracking and social links.",
    impact: "100% Brand Authority",
    category: "Professional Branding",
    link: "/services/email-signature"
  },
  {
    title: "Server-Side Tagging GTM Infrastructure",
    problem: "Losing 30%+ conversion data due to iOS 14+ and Browser ITP restrictions.",
    solution: "Implementing GTM server side tracking to recover and control your own data.",
    impact: "Max Data Accuracy",
    category: "Data Integrity",
    link: "/services/server-side-tracking"
  },
  {
    title: "Deep Google Ads Account Audit",
    problem: "Wasting budget on broken tags, bot traffic, and poor ROAS reporting.",
    solution: "Professional google ads account audit with a 20-point technical checklist.",
    impact: "Scalable Ad Growth",
    category: "Audit Expert",
    link: "/services/google-ads-audit"
  }
]

export default function ResultsProof() {
  return (
    <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <MailCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Full Stack Marketing & Tracking</span>
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
              First Impression to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400 italic">FINAL CONVERSION.</span>
            </h2>
          </div>
          <div className="max-w-xs">
            <p className="text-slate-400 font-medium leading-relaxed border-l-4 border-blue-600 pl-6 py-2">
              From professional branding with <strong>clickable email signatures</strong> to high-level <strong>GTM server-side tracking</strong>—we cover it all.
            </p>
          </div>
        </div>

        {/* Technical Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {technicalSolutions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group relative p-12 rounded-[3.5rem] bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/50 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full">
                  {item.category}
                </span>
                <Sparkles className="w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-colors" />
              </div>

              <h4 className="text-2xl md:text-3xl font-black mb-8 group-hover:text-blue-400 transition-colors tracking-tight">
                {item.title}
              </h4>

              <div className="space-y-6 mb-12">
                <div className="flex gap-4">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-slate-400 font-medium">
                    <strong className="text-slate-200 block text-[10px] uppercase">Problem</strong> 
                    {item.problem}
                  </p>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-400 font-medium">
                    <strong className="text-slate-200 block text-[10px] uppercase">Solution</strong> 
                    {item.solution}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/80 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Key Result</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tighter">{item.impact}</p>
                </div>
                <Link href={item.link} className="inline-flex">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all transform group-hover:rotate-12">
                    <ArrowUpRight className="w-7 h-7 text-white" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Line */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:opacity-100 transition-all">
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
             <BarChart className="w-4 h-4"/> Certified Ads Specialist
           </div>
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
             <MailCheck className="w-4 h-4"/> Branding Expert
           </div>
        </div>
      </div>
    </section>
  )
}