"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Database, Globe2, ArrowUpRight } from 'lucide-react'

const stats = [
  {
    label: "Tracking Accuracy",
    value: "98%+",
    desc: "Average data precision restored for clients by bypassing iOS restrictions through GA4 Server-Side setup.",
    icon: <Database className="w-6 h-6 text-blue-600" />,
  },
  {
    label: "Ad Spend Managed",
    value: "$2.5M+",
    desc: "Experienced in optimizing large-scale Google Ads campaigns to ensure every dollar drives maximum ROI.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
  },
  {
    label: "Global Reach",
    value: "50+",
    desc: "Delivering bulletproof tracking and marketing solutions to agencies across the USA, UK, and Australia.",
    icon: <Globe2 className="w-6 h-6 text-indigo-600" />,
  },
  {
    label: "Reported Conversion Lift",
    value: "35%+",
    desc: "Observed increase in trackable conversions after implementing Facebook CAPI and GTM Server-Side tagging.",
    icon: <Users className="w-6 h-6 text-cyan-600" />,
  }
]

export default function OurResults() {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
            >
              Our Impact in Numbers
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              Data-Driven Growth. <br />
              <span className="text-slate-400 italic">Proven by Performance.</span>
            </h2>
          </div>
          <div className="md:text-right">
             <p className="text-slate-400 font-medium max-w-xs mb-6 text-sm">
                We don't just set up tags; we build measurement infrastructures that help you make better business decisions.
             </p>
             <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 transition-all px-6 py-4 rounded-xl group">
                See Case Studies <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2.5rem] bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-700 group-hover:scale-110 group-hover:border-blue-500/50 transition-all">
                {stat.icon}
              </div>
              
              <div className="mb-4">
                <h4 className="text-5xl font-black text-white mb-2 tracking-tighter group-hover:text-blue-500 transition-colors">
                  {stat.value}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  {stat.label}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Achievement Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 pt-10 border-t border-slate-800/50 flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
        >
          <span className="text-sm font-black tracking-[0.2em]">GOOGLE ADS CERTIFIED</span>
          <span className="text-sm font-black tracking-[0.2em]">META PARTNER</span>
          <span className="text-sm font-black tracking-[0.2em]">GTM EXPERT</span>
          <span className="text-sm font-black tracking-[0.2em]">GA4 SPECIALIST</span>
        </motion.div>

      </div>
    </section>
  )
}