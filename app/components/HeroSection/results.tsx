"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ShieldAlert, Cpu, BarChart } from 'lucide-react'
import Link from 'next/link'

const technicalSolutions = [
  {
    title: "Server-Side Tracking Architecture",
    problem: "Data loss (30%+) due to iOS 14+ and Browser ITP.",
    solution: "Moving tracking from Browser to Server via GTM for 100% data control.",
    impact: "Max Data Accuracy",
    category: "GTM Server-Side",
    link: "/case-studies/local-business-audit"
  },
  {
    title: "Meta CAPI & GA4 Integration",
    problem: "Cookie blocking and poor ad attribution.",
    solution: "Direct Server-to-Server communication using Meta Conversion API.",
    impact: "Lower CPA Potential",
    category: "Conversion API",
    link: "/case-studies/ecommerce-tracking-fix"
  },
  {
    title: "Technical Tracking Audit",
    problem: "Broken tags, duplicate events, and inaccurate ROAS reporting.",
    solution: "Deep audit of data layer and event firing to ensure clean data flow.",
    impact: "Reliable Ad Scaling",
    category: "Data Audit",
    link: "/services/tracking-audit"
  }
]

export default function ResultsProof() {
  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Technical Expertise</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              Solving Complex <br />
              <span className="text-[#4285F4] uppercase italic">Tracking Challenges.</span>
            </h2>
          </div>
          <p className="text-slate-400 font-medium max-w-xs text-left md:text-right leading-relaxed border-l-2 md:border-l-0 md:border-r-2 border-blue-500/30 pl-4 md:pr-4">
            I build high-performance tracking infrastructures that help businesses scale ads with 100% accurate data.
          </p>
        </div>

        {/* Technical Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {technicalSolutions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative p-10 rounded-[3rem] bg-slate-900/50 border border-slate-800 hover:border-[#4285F4]/50 transition-all duration-500"
            >
              {/* Category Tag */}
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4285F4] bg-blue-400/5 px-3 py-1 rounded-full mb-8 inline-block">
                {item.category}
              </span>

              <h4 className="text-2xl font-black mb-6 group-hover:text-[#4285F4] transition-colors leading-tight">
                {item.title}
              </h4>

              <div className="space-y-6 mb-12">
                <div className="flex gap-3">
                  <div className="mt-1"><ShieldAlert className="w-4 h-4 text-red-500/70" /></div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    <span className="text-slate-200 font-bold">The Problem:</span> {item.problem}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    <span className="text-slate-200 font-bold">The Solution:</span> {item.solution}
                  </p>
                </div>
              </div>

              {/* Footer Metric */}
              <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Core Advantage</p>
                  <p className="text-2xl font-black text-[#34a853] tracking-tighter">{item.impact}</p>
                </div>
                <Link href={item.link}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-[#4285F4] group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all cursor-pointer">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Line - Skills Focus */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-20 grayscale hover:opacity-50 transition-opacity duration-700 pointer-events-none">
           <div className="flex items-center gap-2"><BarChart className="w-5 h-5"/> <span className="text-sm font-black tracking-[0.3em] uppercase">Google Analytics Certified</span></div>
           <div className="flex items-center gap-2"><BarChart className="w-5 h-5"/> <span className="text-sm font-black tracking-[0.3em] uppercase">Conversion Specialist</span></div>
           <div className="flex items-center gap-2"><BarChart className="w-5 h-5"/> <span className="text-sm font-black tracking-[0.3em] uppercase">Server-Side Expert</span></div>
        </div>
      </div>
    </section>
  )
}