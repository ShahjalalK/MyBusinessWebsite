"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, BarChart3, Mail, ShieldCheck, Zap } from 'lucide-react'

export default function BlogCTA() {
  return (

    <>
    <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900 dark:bg-slate-900/50 rounded-[3rem] p-8 md:p-16 lg:p-20 shadow-2xl relative overflow-hidden border border-slate-800">
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Content */}
              <div className="lg:col-span-7 text-center lg:text-left">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                >
                  <Zap size={14} className="fill-current" /> Grow Your Business
                </motion.div>
                
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-[1.1]">
                  Need Help With <br />
                  <span className="text-blue-500 text-glow-blue">Tracking or Ads?</span>
                </h2>
                
                <p className="text-xl text-slate-400 font-medium mb-12 leading-relaxed">
                  If you're struggling with inaccurate data, poor ad performance, or tracking issues — we can help you set up a reliable system that works.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                  <Link 
                    href="/book-audit" 
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                  >
                    Get Free Tracking Audit <BarChart3 size={20} className="group-hover:rotate-12 transition-transform" />
                  </Link>
                  
                  <Link 
                    href="/contact" 
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-transparent border-2 border-slate-700 hover:border-blue-500 text-white rounded-2xl font-black transition-all hover:bg-blue-500/5"
                  >
                    Contact Us <Mail size={20} />
                  </Link>
                </div>
              </div>

              {/* Right Side Image/Graphic */}
              <div className="lg:col-span-5 hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 rounded-full animate-pulse" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2.5rem] shadow-3xl">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                         <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                            <ShieldCheck size={24} />
                         </div>
                         <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status</div>
                            <div className="text-white font-black text-sm">Tracking 100% Secure</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                         <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                            <Zap size={24} />
                         </div>
                         <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Performance</div>
                            <div className="text-white font-black text-sm">Ad Results Skyrocketing</div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* More Guides Coming Soon Section */}
<div className="py-12 border-t border-slate-100 dark:border-slate-800/50">
  <motion.div 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    className="flex flex-col items-center justify-center text-center space-y-4"
  >
    <div className="flex items-center gap-3">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">
        Stay Tuned
      </p>
    </div>
    
    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white opacity-80 italic">
      "More expert guides coming soon..."
    </h3>
    
    <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-30 rounded-full" />
  </motion.div>
</div>
    
    </>
    
  )
}