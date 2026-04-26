"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Server, Share2, BarChart3, CheckCircle2, Terminal } from 'lucide-react'

const solutionFeatures = [
  {
    icon: Server, 
    title: "Server-Side Tagging GTM",
    description: "We migrate your tracking from the user's browser to a secure cloud server. This ensures that even if a browser blocks a script, your data flows directly to GA4 and other platforms.",
    points: ["Google Cloud/Stape Setup", "First-Party Loader Implementation", "Bypass 100% of Ad-Blockers"],
    color: "text-blue-500"
  },
  {
    icon: Share2,
    title: "Advanced Facebook CAPI",
    description: "Our Meta Conversions API (CAPI) setup bypasses iOS 14+ restrictions by sending events directly from your server to Meta, drastically improving attribution and ad performance.",
    points: ["Server-to-Server Integration", "Event Deduplication Logic", "Advanced Match Quality Score"],
    color: "text-indigo-500"
  },
  {
    icon: BarChart3,
    title: "GA4 Server-Side Accuracy",
    description: "Say goodbye to 40% data gaps. We restore your tracking accuracy to near 100%, allowing the AI to optimize your campaigns for the highest possible ROI.",
    points: ["Clean GA4 Implementation", "Extended Cookie Life (ITP Fix)", "Enhanced User Data Tracking"],
    color: "text-emerald-500"
  }
];

export default function ServerSolutionSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#020617]">
      <div className="container mx-auto px-6">
        
        {/* Header with SEO Keywords */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mb-4"
            >
              <Terminal size={16} /> Technical Infrastructure
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]">
              Next-Gen Tracking <br />
              <span className="text-blue-600">Engineered for ROI.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-sm leading-relaxed">
            We don't just fix pixels; we rebuild your entire data infrastructure for a privacy-first, server-side era.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutionFeatures.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative group overflow-hidden cursor-default transition-all duration-500"
              >
                {/* Blue Hover Slide Effect */}
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

                <div className="relative z-10">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-white/20 transition-all duration-300 ${item.color} group-hover:text-white`}>
                    <IconComponent size={32} />
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-white transition-colors tracking-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 group-hover:text-blue-50 transition-colors">
                    {item.description}
                  </p>

                  <ul className="space-y-4">
                    {item.points.map((point, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors">
                        <CheckCircle2 size={18} className="text-blue-600 group-hover:text-blue-200 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Results/Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-around gap-12"
        >
          <div className="text-center group">
            <div className="text-6xl font-black text-slate-900 dark:text-white mb-2 transition-transform group-hover:scale-110">99%</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Signal Reliability</div>
          </div>
          <div className="hidden md:block w-px h-16 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center group">
            <div className="text-6xl font-black text-blue-600 mb-2 transition-transform group-hover:scale-110">+35%</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Data Recovery</div>
          </div>
          <div className="hidden md:block w-px h-16 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center group">
            <div className="text-6xl font-black text-slate-900 dark:text-white mb-2 transition-transform group-hover:scale-110">0%</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ad-Blocker Impact</div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}