"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Database, Globe2, ArrowUpRight, ShieldCheck, BarChart3, Zap } from 'lucide-react'

const stats = [
  {
    label: "Data Integrity",
    value: "High-Precision",
    desc: "Implementing advanced GA4 Server-Side setups designed to restore tracking accuracy and recover missing signals.",
    icon: <Database className="w-6 h-6 text-blue-600" />,
  },
  {
    label: "Ads Strategy",
    value: "ROI Focused",
    desc: "Expert management of Google Ads campaigns with a focus on high-intent keywords and budget optimization.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
  },
  {
    label: "Global Standards",
    value: "Market Ready",
    desc: "Deployment of high-performance measurement infrastructures optimized for businesses in the USA, UK, and Australia.",
    icon: <Globe2 className="w-6 h-6 text-indigo-600" />,
  },
  {
    label: "Attribution",
    value: "Advanced CAPI",
    desc: "Enhanced visibility into the customer journey through seamless Meta Conversions API and GTM integration.",
    icon: <Users className="w-6 h-6 text-cyan-600" />,
  }
]

export default function OurResults() {
  return (
    <section className="py-24 bg-[#020617] text-white overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <Zap size={16} className="text-blue-500 fill-blue-500" />
              <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                Performance Excellence
              </span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
              Strategic Tracking. <br />
              <span className="text-slate-500 italic font-light">Growth Solutions.</span>
            </h2>
            
            <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
              We specialize in building resilient measurement infrastructures that turn complex data into sustainable business success.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
             <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Privacy Compliant</span>
                </div>
                <p className="text-xs text-slate-500">Industry-leading setups following GDPR & CCPA frameworks.</p>
             </div>
             
             <button className="flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white transition-all px-8 py-5 rounded-2xl group shadow-lg shadow-blue-600/20 active:scale-95">
                Work With Us <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
          </motion.div>
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
              whileHover={{ y: -12, backgroundColor: "rgba(30, 41, 59, 0.6)" }}
              className="p-10 rounded-[3rem] bg-slate-800/30 border border-slate-800 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <BarChart3 size={120} />
              </div>

              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-10 border border-slate-700 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                {stat.icon}
              </div>
              
              <div className="mb-6">
                <h4 className="text-4xl font-black text-white mb-2 tracking-tighter group-hover:text-blue-500 transition-colors leading-tight">
                  {stat.value}
                </h4>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-500/80">
                  {stat.label}
                </p>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-28 pt-12 border-t border-slate-800/50 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 hover:opacity-100 transition-opacity duration-1000"
        >
          {["ADS SPECIALIST", "GTM SERVER-SIDE", "GA4 EXPERTISE", "CONVERSIONS API"].map((badge, i) => (
            <span key={i} className="text-[10px] md:text-xs font-black tracking-[0.3em] hover:text-blue-500 cursor-default transition-colors">
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}