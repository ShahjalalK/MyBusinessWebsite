"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, MapPin, ArrowRight, Activity, Database, Zap, ShieldCheck, Globe2, BarChart3 } from 'lucide-react'

export default function ContactHero() {
  const contactInfo = [
    { 
      icon: <Mail className="text-blue-600" size={20} />, 
      label: "Official Email", 
      value: "shahjalal@trackflowpro.com",
      link: "mailto:shahjalal@trackflowpro.com"
    },
    { 
      icon: <Phone className="text-blue-600" size={20} />, 
      label: "Direct Support", 
      value: "+88 01303-233683",
      link: "tel:+01303233683"
    },
    { 
      icon: <Globe2 className="text-blue-600" size={20} />, 
      label: "Global Reach", 
      value: "Available Worldwide",
      link: "/contact"
    }
  ];

  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Tech Mesh Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#2563eb 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side: SEO-Driven Messaging */}
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em]"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </div>
              Ready to Hire a Google Ads Expert?
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85]"
              >
                Let’s Scale <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 italic">
                   Your ROI.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-500 dark:text-slate-400 max-w-lg font-medium leading-relaxed"
              >
                Whether it's a technical <span className="text-blue-600 font-bold underline">GA4 audit</span>, <span className="text-blue-600 font-bold underline">GTM Server-side setup</span>, or <span className="text-blue-600 font-bold underline">Meta CAPI</span>—I'm here to fix your data leaks and boost your ad performance.
              </motion.p>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {contactInfo.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm"
                >
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</h4>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{item.value}</p>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Right Side: Enhanced Data Visualization Hero */}
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10 aspect-square w-full max-w-[500px] mx-auto"
            >
              {/* Central Core (Data Hub) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-blue-600/10 blur-3xl animate-pulse"></div>
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-900 border border-blue-500/20 rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                    <Database size={60} className="text-blue-600" />
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white border-4 border-white dark:border-slate-900">
                       <ShieldCheck size={20} />
                    </div>
                </div>
              </div>

              {/* Orbiting Tech Stack Icons */}
              {[
                { icon: <Activity className="text-orange-500" />, pos: "top-0 left-1/4", label: "Server-Side" },
                { icon: <Zap className="text-yellow-500" />, pos: "bottom-1/4 right-0", label: "Fast Tracking" },
                { icon: <BarChart3 className="text-blue-500" />, pos: "top-1/2 -left-4", label: "High ROI" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i, ease: "easeInOut" }}
                  className={`absolute ${item.pos} p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col items-center gap-1 border border-slate-100 dark:border-slate-700 z-20`}
                >
                  {item.icon}
                  <span className="text-[8px] font-black uppercase text-slate-400">{item.label}</span>
                </motion.div>
              ))}

              {/* Data Success Overlay - Highlighting Accuracy */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-10 right-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 rounded-2xl shadow-2xl z-30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                    CAPI
                  </div>
                  <div>
                    <p className="text-[9px] font-black opacity-60 uppercase tracking-tighter">Conversion Accuracy</p>
                    <p className="text-sm font-bold italic">99.9% Verified</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}