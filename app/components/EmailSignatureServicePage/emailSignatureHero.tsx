"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, MousePointerClick, Smartphone, Laptop, Send, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function EmailSignatureHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white dark:bg-[#020617] overflow-hidden pt-20 pb-12">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* লেফট কন্টেন্ট */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 py-2 px-4 mb-6 text-[11px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800">
                <ShieldCheck size={14} className="animate-spin-slow" /> Trusted by 500+ Professionals
              </span>

              <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-[0.95] tracking-tighter">
                Signature that <br />
                <span className="text-blue-600 italic">Closes Deals.</span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed font-medium">
                Transform your everyday emails into a <span className="text-slate-900 dark:text-white font-bold">personalized stamp</span> of authority. We build 100% responsive, <span className="font-bold underline decoration-blue-500/30">clickable email signatures</span> for high-growth teams.
              </p>

              {/* ফিডব্যাক এন্ড ট্রাস্ট */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-12">
                {[
                  "One-Click CTA Buttons",
                  "HIPAA Statement Compliant",
                  "Social Media Integration",
                  "Gmail & Outlook Optimized"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold text-[15px]">
                    <div className="bg-emerald-500/10 p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA বাটন */}
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/contact" className="group bg-[#041f60] dark:bg-blue-600 text-white font-black py-5 px-10 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 hover:-translate-y-1">
                  Order Custom Design <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link href="/samples" className="border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black py-5 px-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                  View Case Studies
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ডান পাশ: ভিজ্যুয়াল প্রিভিউ */}
         <div className="w-full lg:w-1/2 relative group">
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    className="relative"
  >
    {/* মেইন প্রিভিউ উইন্ডো (Browser UI Look) */}
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border border-white dark:border-slate-800 p-2 relative z-20 overflow-hidden">
      
      {/* ইনার বর্ডার ও কন্টেন্ট এরিয়া */}
      <div className="bg-white dark:bg-[#020617] rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800/50">
        
        {/* উইন্ডো কন্ট্রোল ও ইউআরএল বার */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center px-4">
             <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* ডামি ইমেল কন্টেন্ট */}
        <div className="space-y-4 mb-12">
          <div className="h-2 w-20 bg-blue-600/20 rounded-full" />
          <div className="h-4 w-full bg-slate-50 dark:bg-slate-900 rounded-full" />
          <div className="h-4 w-3/4 bg-slate-50 dark:bg-slate-900 rounded-full" />
        </div>

        {/* প্রিমিয়াম সিগনেচার কার্ড ডিজাইন */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative p-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/20"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[1.9rem] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* প্রোফাইল ইমেজ সেকশন */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-inner">
                {/* প্রোফাইল ছবি না থাকলে ইনিশিয়াল */}
                <div className="w-full h-full bg-gradient-to-br from-[#041f60] to-blue-600 flex items-center justify-center text-white font-black text-4xl">
                  SJ
                </div>
              </div>
              {/* ভেরিফাইড ব্যাজ */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white">
                <CheckCircle2 size={14} fill="currentColor" className="text-white" />
              </div>
            </div>

            {/* টেক্সট ডিটেইলস */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Shahjalal Jalal
              </h4>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.15em] mb-4">
                Digital Presence Specialist
              </p>
              
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 dark:text-slate-400 font-bold text-xs group/item cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/item:text-blue-600 transition-colors">
                    <Smartphone size={14} />
                  </div>
                  +880 1700 000000
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 dark:text-slate-400 font-bold text-xs group/item cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/item:text-blue-600 transition-colors">
                    <Laptop size={14} />
                  </div>
                  www.trackflow.agency
                </div>
              </div>

              {/* সোশ্যাল বাটন গ্রিড */}
              <div className="flex gap-2 justify-center md:justify-start">
                {['LinkedIn', 'Twitter', 'Instagram'].map((social) => (
                  <button key={social} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wider">
                    {social}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>

    {/* ফ্লোটিং মেটা-ব্যাজ (HIPAA Compliant) */}
    <motion.div 
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-6 -right-6 md:right-0 bg-[#041f60] text-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-30 flex flex-col items-center gap-1 border border-white/10"
    >
      <ShieldCheck className="text-emerald-400 mb-1" size={28} />
      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Compliance</span>
      <span className="text-xs font-black">HIPAA READY</span>
    </motion.div>

    {/* ইনবক্স ফিডব্যাক ব্যাজ */}
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      className="absolute bottom-12 -left-12 hidden md:flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl z-30 border border-slate-100 dark:border-slate-700"
    >
      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
        <Send size={18} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
        <p className="text-sm font-black text-slate-900 dark:text-white">Inbox Optimized</p>
      </div>
    </motion.div>

  </motion.div>
</div>

        </div>
      </div>
    </section>
  )
}