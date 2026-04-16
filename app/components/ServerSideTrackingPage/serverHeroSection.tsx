"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Globe, Server, Target, BarChart3, ShieldOff, CheckCircle2, XCircle, Activity } from 'lucide-react'
import Link from 'next/link';

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (এরর দূর করার জন্য)
interface DataParticleProps {
  color: string;
  duration: number;
  delay: number;
  isBlocked?: boolean;
}

// ২. ডাটা কণা কম্পোনেন্ট
const DataParticle = ({ color, duration, delay, isBlocked = false }: DataParticleProps) => (
  <motion.div
    initial={{ x: 0, opacity: 0 }}
    animate={isBlocked 
      ? { x: [0, 120, 100], opacity: [0, 1, 1, 0] } 
      : { x: [0, 320], opacity: [0, 1, 1, 0] }
    }
    transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${color} shadow-lg shadow-current z-20`}
  />
);

export default function ServerSideHero() {
  const [mode, setMode] = useState<'browser' | 'server'>('server');

  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev === 'browser' ? 'server' : 'browser'));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-slate-950 overflow-hidden text-white">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30rem] h-[30rem] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* বাম পাশ: কন্টেন্ট */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-8"
            >
              <Activity size={14} className="animate-pulse" /> 100% Signal Resilience
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-8"
            >
              Bypass Ad-Blockers with <br />
              <span className="text-blue-500">Server-Side Tracking.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-xl mb-10"
            >
              Recover lost data from iOS 14+ and browser privacy updates. We use GTM Server-Side to restore your marketing data accuracy.
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="/contact" className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group active:scale-95">
                Recover My Data <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setMode('browser')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'browser' ? 'bg-red-500 text-white' : 'text-slate-500'}`}
                >
                  Browser
                </button>
                <button 
                  onClick={() => setMode('server')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'server' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  Server
                </button>
              </div>
            </div>
          </div>

          {/* ডান পাশ: ভিজ্যুয়াল এনিমেশন */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 backdrop-blur-sm overflow-hidden">
              
              <div className="flex items-center justify-between mb-16 relative z-30">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                    <Globe size={28} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Website</span>
                </div>

                {/* মাঝখানের দেয়াল/সার্ভার */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {mode === 'browser' ? (
                      <motion.div 
                        key="browser-wall"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="h-32 w-1.5 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] relative">
                          <ShieldOff className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 bg-slate-900 rounded-full" size={20} />
                        </div>
                        <span className="text-[9px] font-black text-red-500 uppercase">Ad-Blocker</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="server-node"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="h-32 w-1.5 bg-blue-500/20 rounded-full border border-blue-500/30 border-dashed relative">
                           <Server className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 bg-slate-900 rounded-xl p-1 shadow-[0_0_20px_rgba(59,130,246,0.3)]" size={32} />
                        </div>
                        <span className="text-[9px] font-black text-blue-400 uppercase">Cloud Server</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* প্ল্যাটফর্ম আইকনগুলো */}
                <div className="flex flex-col gap-4">
                  {/* Facebook SVG (Lucide এর বদলে সরাসরি SVG) */}
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'server' ? "text-blue-500" : "text-slate-600"}>
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                    <Target size={20} className={mode === 'server' ? "text-yellow-500" : "text-slate-600"} />
                  </div>
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                    <BarChart3 size={20} className={mode === 'server' ? "text-orange-500" : "text-slate-600"} />
                  </div>
                </div>
              </div>

              {/* ডাটা ফ্লো এনিমেশন */}
              <div className="absolute left-20 top-0 w-full h-full pointer-events-none z-20">
                {mode === 'browser' ? (
                  <>
                    <DataParticle color="bg-red-500" duration={2} delay={0} isBlocked={true} />
                    <DataParticle color="bg-red-500" duration={2} delay={0.7} isBlocked={true} />
                  </>
                ) : (
                  <>
                    <DataParticle color="bg-blue-400" duration={1.5} delay={0} />
                    <DataParticle color="bg-blue-400" duration={1.5} delay={0.5} />
                  </>
                )}
              </div>

              {/* স্ট্যাটাস ইন্ডিকেটর */}
              <div className={`mt-10 p-4 rounded-2xl border transition-all duration-500 ${mode === 'browser' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="flex items-center gap-3">
                  {mode === 'browser' ? (
                    <><XCircle className="text-red-500" size={18}/> <p className="text-[10px] font-black text-red-200 uppercase tracking-widest">Signal Lost: Tracking Blocked</p></>
                  ) : (
                    <><CheckCircle2 className="text-emerald-500" size={18}/> <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Signal Restored: Data Verified</p></>
                  )}
                </div>
              </div>

            </div>

            {/* Floating Stats */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -bottom-6 -right-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl z-40"
            >
              <div className={`text-2xl font-black mb-1 ${mode === 'server' ? 'text-blue-500' : 'text-red-500'}`}>
                {mode === 'server' ? '99.8%' : '62.4%'}
              </div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Match Accuracy</div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}