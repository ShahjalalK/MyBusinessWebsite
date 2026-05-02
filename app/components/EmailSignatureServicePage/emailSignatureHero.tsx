"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Smartphone, Laptop, Send, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function EmailSignatureHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white dark:bg-[#020617] overflow-hidden pt-28 pb-16">
      
      {/* Dynamic Background Elements - আরও রিফাইন্ড করা হয়েছে */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[5%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* লেফট কন্টেন্ট */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 py-2 px-4 mb-8 text-[12px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-md rounded-full border border-blue-100 dark:border-blue-800/50">
                <Sparkles size={14} className="text-blue-500" /> Trusted by 500+ Professionals
              </span>

              <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 leading-[0.9] tracking-tight">
                Signature that <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 italic">Closes Deals.</span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl leading-relaxed font-medium">
                Transform your everyday emails into a <span className="text-slate-900 dark:text-white font-bold">personalized stamp</span> of authority. Build 100% responsive, clickable signatures for high-growth teams.
              </p>

              {/* ফিডব্যাক এন্ড ট্রাস্ট */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mb-12">
                {[
                  "One-Click CTA Buttons",
                  "HIPAA Statement Compliant",
                  "Social Media Integration",
                  "Gmail & Outlook Optimized"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-semibold text-[15px]">
                    <div className="bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA বাটন - সম্পূর্ণ নতুন ডিজাইন */}
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/contact" 
                  className="group relative bg-[#041f60] dark:bg-blue-600 text-white font-bold py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_20px_40px_-15px_rgba(4,31,96,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(4,31,96,0.5)] dark:shadow-blue-900/40 active:scale-95 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out" />
                  <span className="relative z-10">Order Custom Design</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform relative z-10" />
                </Link>

                <Link href="/samples" 
                  className="group border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-5 px-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95"
                >
                  View Case Studies
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ডান পাশ: ভিজ্যুয়াল প্রিভিউ */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* মেইন প্রিভিউ উইন্ডো */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-white dark:border-slate-800/50 p-3 relative z-20">
                <div className="bg-white dark:bg-[#020617] rounded-[3rem] p-8 md:p-14 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                  
                  {/* Browser Bar */}
                  <div className="flex items-center gap-4 mb-14">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400/20" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400/20" />
                    </div>
                    <div className="flex-1 h-9 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center px-4">
                       <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                  </div>

                  {/* Dummy Content */}
                  <div className="space-y-4 mb-14">
                    <div className="h-2.5 w-24 bg-blue-600/20 rounded-full" />
                    <div className="h-4 w-full bg-slate-50 dark:bg-slate-900 rounded-full" />
                    <div className="h-4 w-5/6 bg-slate-50 dark:bg-slate-900 rounded-full" />
                  </div>

                  {/* প্রিমিয়াম সিগনেচার কার্ড */}
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative p-0.5 bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-400 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 transition-all duration-500"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-[2.4rem] p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-10">
                      <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#041f60] to-blue-600 flex items-center justify-center text-white font-black text-5xl shadow-2xl">
                          SJ
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
                          <CheckCircle2 size={18} fill="currentColor" />
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Shahjalal Jalal</h4>
                        <p className="text-blue-600 font-bold text-[13px] uppercase tracking-widest mb-6">Digital Presence Specialist</p>
                        
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400 font-bold text-sm">
                            <Smartphone size={16} className="text-blue-500/50" /> +880 1700 000000
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400 font-bold text-sm">
                            <Laptop size={16} className="text-blue-500/50" /> www.trackflow.agency
                          </div>
                        </div>

                        <div className="flex gap-3 justify-center md:justify-start">
                          {['LinkedIn', 'Twitter'].map((social) => (
                            <button key={social} className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-all uppercase tracking-tighter border border-slate-100 dark:border-slate-800 hover:border-blue-500">
                              {social}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ফ্লোটিং ব্যাজ */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -top-10 -right-6 bg-slate-900 dark:bg-blue-600 text-white p-7 rounded-[3rem] shadow-2xl z-30 flex flex-col items-center border border-white/20"
              >
                <ShieldCheck className="text-emerald-400 mb-2" size={32} />
                <span className="text-xs font-black tracking-tighter italic">HIPAA READY</span>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}