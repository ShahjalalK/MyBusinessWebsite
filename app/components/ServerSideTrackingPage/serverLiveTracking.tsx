"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Server, Database, ShieldCheck, XCircle, CheckCircle2, Zap } from 'lucide-react'

export default function ServerLiveTrackingSection() {
  const [activeTab, setActiveTab] = useState<'browser' | 'server'>('browser');

  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
            See the <span className="text-blue-500 text-outline-white">Difference</span> in Real-Time
          </h2>
          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('browser')}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'browser' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
            >
              Old Browser Way
            </button>
            <button 
              onClick={() => setActiveTab('server')}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'server' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
            >
              Our Server-Side Way
            </button>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="relative max-w-5xl mx-auto p-12 rounded-[3rem] bg-slate-900/50 border border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
            
            {/* Step 1: User Browser */}
            <div className="flex flex-col items-center z-10">
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                <Globe size={32} className={activeTab === 'browser' ? 'text-red-400' : 'text-blue-400'} />
              </div>
              <p className="font-bold text-sm">User Browser</p>
              <span className="text-[10px] text-slate-500 uppercase font-black">Safari / Chrome</span>
            </div>

            {/* Connecting Lines & Animated Particles */}
            <div className="flex-1 w-full h-1 bg-slate-800 relative hidden md:block overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'browser' ? (
                  <motion.div 
                    key="browser-flow"
                    initial={{ x: "-100%" }}
                    animate={{ x: "40%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                  />
                ) : (
                  <motion.div 
                    key="server-flow"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Server (Only shows for Server Mode) */}
            <div className={`flex flex-col items-center transition-all duration-500 z-10 ${activeTab === 'browser' ? 'opacity-30 grayscale' : 'opacity-100'}`}>
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 border-2 transition-all duration-500 ${activeTab === 'server' ? 'bg-blue-600/20 border-blue-500 shadow-2xl shadow-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
                <Server size={40} className={activeTab === 'server' ? 'text-blue-400' : 'text-slate-600'} />
              </div>
              <p className="font-bold text-sm">GTM Server</p>
              <span className="text-[10px] text-slate-500 uppercase font-black">Secure Gateway</span>
            </div>

            {/* Connecting Lines 2 */}
            <div className="flex-1 w-full h-1 bg-slate-800 relative hidden md:block overflow-hidden">
               {activeTab === 'server' && (
                 <motion.div 
                   initial={{ x: "-100%" }}
                   animate={{ x: "100%" }}
                   transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.7 }}
                   className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                 />
               )}
            </div>

            {/* Step 3: Destinations */}
            <div className="flex flex-col items-center z-10">
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 relative">
                <Database size={32} className="text-slate-500" />
                {/* Status Indicator */}
                <div className="absolute -top-2 -right-2 transition-all duration-500">
                  {activeTab === 'browser' ? (
                    <div className="bg-red-500 p-1 rounded-full"><XCircle size={16} /></div>
                  ) : (
                    <div className="bg-emerald-500 p-1 rounded-full"><CheckCircle2 size={16} /></div>
                  )}
                </div>
              </div>
              <p className="font-bold text-sm">Ad Platforms</p>
              <span className="text-[10px] text-slate-500 uppercase font-black">GA4 / Meta / GADS</span>
            </div>

            {/* Obstacle (Only for Browser) */}
            {activeTab === 'browser' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-2 rounded-xl backdrop-blur-md">
                   <p className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                     <ShieldCheck size={14} /> Blocked by Ad-Blocker / iOS 14
                   </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Result Message */}
          <div className="mt-16 p-8 rounded-[2rem] bg-white/5 border border-white/10 text-center">
            {activeTab === 'browser' ? (
              <p className="text-red-400 font-medium">
                <strong className="text-white">The Result:</strong> You lose up to 30-40% of your data. Ad algorithms get confused, and your ROAS drops because they can't see who actually converted.
              </p>
            ) : (
              <p className="text-emerald-400 font-medium">
                <strong className="text-white">The Result:</strong> 100% Data Delivery. Even with ad-blockers, the server sends signals directly to APIs. Ad algorithms get "smarter" and your CPA decreases.
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}