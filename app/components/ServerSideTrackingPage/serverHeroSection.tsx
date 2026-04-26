"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Globe, Server, Target, BarChart3, ShieldOff, CheckCircle2, XCircle, Activity } from 'lucide-react'
import Link from 'next/link';

// ডাটা কণা কম্পোনেন্ট
const DataParticle = ({ color, duration, delay, isBlocked = false }: { color: string, duration: number, delay: number, isBlocked?: boolean }) => (
  <motion.div
    initial={{ x: 0, opacity: 0 }}
    animate={isBlocked 
      ? { x: [0, 100, 80], opacity: [0, 1, 1, 0] } 
      : { x: [0, 280], opacity: [0, 1, 1, 0] }
    }
    transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${color} shadow-[0_0_10px_currentcolor] z-20`}
  />
);

export default function ServerSideHero() {
  const [mode, setMode] = useState<'browser' | 'server'>('server');

  // অটোমেটিক মোড সুইচিং যাতে ইউজার পার্থক্যটা বুঝতে পারে
  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev === 'browser' ? 'server' : 'browser'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 bg-slate-950 overflow-hidden text-white">
      
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30rem] h-[30rem] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* বাম পাশ: কন্টেন্ট (SEO optimized) */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8"
            >
              <Activity size={14} className="animate-pulse" /> Privacy-First Solution
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-8"
            >
              Bypass Filters. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Restore Accuracy.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-xl mb-10"
            >
              Recover up to <span className="text-white font-bold">30% lost data</span> from iOS 14+ and Ad-Blockers. We implement <span className="text-blue-400 italic">GTM Server-Side Tracking</span> to keep your Meta CAPI and GA4 signals 100% intact.
            </motion.p>

            <div className="flex flex-wrap items-center gap-6">
              <Link href="/contact" className="w-full sm:w-auto px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-3 group active:scale-95">
                Fix My Tracking <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              
              <div className="flex bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
                <button 
                  onClick={() => setMode('browser')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'browser' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Browser
                </button>
                <button 
                  onClick={() => setMode('server')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'server' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Server
                </button>
              </div>
            </div>
          </div>

          {/* ডান পাশ: ভিজ্যুয়াল এনিমেশন (Interactive) */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative bg-slate-900/40 border border-slate-800/50 rounded-[4rem] p-12 backdrop-blur-xl overflow-hidden shadow-2xl">
              
              <div className="flex items-center justify-between mb-20 relative z-30">
                {/* Website Source */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                    <Globe size={32} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Your Store</span>
                </div>

                {/* Central Infrastructure */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {mode === 'browser' ? (
                      <motion.div 
                        key="browser-wall"
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -90 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="h-32 w-2 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] relative">
                          <ShieldOff className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-red-600 rounded-full p-1" size={24} />
                        </div>
                        <span className="text-[10px] font-black text-red-500 uppercase">Ad-Blocker</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="server-node"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="h-32 w-2 bg-blue-500/20 rounded-full border border-blue-500/30 border-dashed relative">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 p-2 rounded-2xl border border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                             <Server className="text-blue-400" size={32} />
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">GTM Cloud</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ad Platforms */}
                <div className="flex flex-col gap-5">
                  {[
                    { icon: 'F', color: 'text-blue-500', label: 'CAPI' },
                    { icon: <Target size={20} />, color: 'text-yellow-500', label: 'Ads' },
                    { icon: <BarChart3 size={20} />, color: 'text-orange-500', label: 'GA4' }
                  ].map((plat, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                       <span className={`text-[9px] font-bold uppercase transition-opacity ${mode === 'server' ? 'opacity-100 text-slate-400' : 'opacity-0'}`}>{plat.label}</span>
                       <div className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 transition-all ${mode === 'server' ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'grayscale opacity-30'}`}>
                        <span className={`${plat.color} font-black text-lg`}>{plat.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ডাটা ফ্লো এনিমেশন লজিক */}
              <div className="absolute left-24 top-0 w-full h-full pointer-events-none z-20">
                <AnimatePresence>
                  {mode === 'browser' ? (
                    <>
                      <DataParticle key="b1" color="bg-red-400" duration={1.8} delay={0} isBlocked={true} />
                      <DataParticle key="b2" color="bg-red-400" duration={1.8} delay={0.6} isBlocked={true} />
                    </>
                  ) : (
                    <>
                      <DataParticle key="s1" color="bg-blue-400" duration={1.2} delay={0} />
                      <DataParticle key="s2" color="bg-blue-400" duration={1.2} delay={0.4} />
                      <DataParticle key="s3" color="bg-emerald-400" duration={1.2} delay={0.8} />
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* নিচের স্ট্যাটাস বার */}
              <div className={`mt-8 p-5 rounded-2xl border transition-all duration-700 ${mode === 'browser' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mode === 'browser' ? (
                      <XCircle className="text-red-500 animate-pulse" size={20}/>
                    ) : (
                      <CheckCircle2 className="text-emerald-500 animate-bounce" size={20}/>
                    )}
                    <div className="flex flex-col">
                      <p className={`text-xs font-black uppercase tracking-widest ${mode === 'browser' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {mode === 'browser' ? 'Tracking Blocked' : 'Server-to-Server Active'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium italic">
                        {mode === 'browser' ? 'Lost 30-40% of conversion signals' : '100% secure signal transmission'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Floating Stats Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-8 -right-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-[2.5rem] shadow-2xl z-40"
            >
              <div className={`text-3xl font-black mb-1 transition-colors duration-500 ${mode === 'server' ? 'text-emerald-500' : 'text-red-500'}`}>
                {mode === 'server' ? '99.9%' : '61.2%'}
              </div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Signal Quality</div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}