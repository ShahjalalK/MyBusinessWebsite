"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Database, Globe2, ArrowUpRight } from 'lucide-react'

const stats = [
  {
    label: "Data Accuracy Recovered",
    value: "98%",
    desc: "Average tracking precision restored for our clients after iOS 14.5 restrictions.",
    icon: <Database className="w-6 h-6 text-blue-600" />,
  },
  {
    label: "Total Ad Spend Managed",
    value: "$2.5M+",
    desc: "Trusted by global brands to optimize and scale their Google Ads budget for maximum ROI.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
  },
  {
    label: "Global Clients Served",
    value: "50+",
    desc: "Successful partnerships across the USA, UK, Canada, and Australia.",
    icon: <Globe2 className="w-6 h-6 text-indigo-600" />,
  },
  {
    label: "Conversion Lift",
    value: "35%",
    desc: "Average increase in reported conversions after implementing Server-Side Tracking.",
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
              Our Track Record
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              Real Data. <span className="text-slate-400 italic">Real Results.</span> <br />
              Zero <span className="text-blue-500 underline underline-offset-8">Guesswork.</span>
            </h2>
          </div>
          <div className="md:text-right">
             <p className="text-slate-400 font-medium max-w-xs mb-6">
                We measure our success by the growth of your business. Here is what we have achieved so far.
             </p>
             <button className="flex items-center gap-2 text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-xl">
                View Case Studies <ArrowUpRight className="w-4 h-4" />
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
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2.5rem] bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-700 group-hover:scale-110 group-hover:border-blue-500/50 transition-all">
                {stat.icon}
              </div>
              
              <div className="mb-4">
                <h4 className="text-5xl font-black text-white mb-2 tracking-tighter group-hover:text-blue-500 transition-colors">
                  {stat.value}
                </h4>
                <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4">
                  {stat.label}
                </p>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Achievement Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 pt-10 border-t border-slate-800 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
        >
          <p className="text-xs font-black uppercase tracking-[0.4em] w-full text-center mb-4">Trusted Partner of</p>
          <span className="text-2xl font-black">GOOGLE ADS</span>
          <span className="text-2xl font-black">META BUSINESS</span>
          <span className="text-2xl font-black">SHOPIFY PLUS</span>
          <span className="text-2xl font-black">GA4 EXPERT</span>
        </motion.div>

      </div>
    </section>
  )
}