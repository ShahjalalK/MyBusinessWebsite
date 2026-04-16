"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, MousePointerClick, Smartphone, Laptop, Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function EmailSignatureHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-slate-50 dark:bg-slate-950 overflow-hidden pt-16 pb-12">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[5%] w-72 h-72 bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* ১. লেফট কন্টেন্ট: অফার এবং হেডলাইন */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 py-2 px-4 mb-6 text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Mail size={14} /> Transform Your Professional Emails
              </span>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tighter">
                Professional <span className="text-blue-600">Clickable</span> <br />
                Email Signatures.
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                Turn every email you send into a powerful branding tool. Clean, responsive, and 100% compatible with <span className="font-bold text-slate-900 dark:text-white">Gmail, Outlook & Apple Mail.</span>
              </p>

              {/* ফিউচার লিস্ট */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  "One-Click CTA Buttons",
                  "Responsive Mobile Layout",
                  "Social Media Integration",
                  "No Coding Required"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA বাটন সেট */}
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95">
                  Order Your Signature <ArrowRight size={18} />
                </Link>
                <Link href="/real-state-agent-signature.html" download="Real_Estate_Signature.html"  className="border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black py-4 px-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-95">
                  Get a Free Sample
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ২. ডান পাশ: সিগনেচার প্রিভিউ ভিজ্যুয়াল */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* মেইন ইমেল উইন্ডো */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative z-20">
                {/* ইমেল হেডার ইউআই */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>

                {/* ইমেল বডি টেক্সট */}
                <div className="space-y-3 mb-10">
                  <div className="h-4 w-full bg-slate-50 dark:bg-slate-800/50 rounded" />
                  <div className="h-4 w-[90%] bg-slate-50 dark:bg-slate-800/50 rounded" />
                  <div className="h-4 w-[40%] bg-slate-50 dark:bg-slate-800/50 rounded" />
                </div>

                {/* এনিমেটেড ইমেল সিগনেচার (The Hero Product) */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="p-6 border-l-4 border-blue-600 bg-blue-50/30 dark:bg-blue-600/5 rounded-r-2xl flex flex-col md:flex-row items-center md:items-start gap-6 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MousePointerClick className="text-blue-600 animate-bounce" size={20} />
                  </div>

                  {/* প্রোফাইল ইমেজ */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border-4 border-white dark:border-slate-800">
                    SJ
                  </div>

                  {/* সিগনেচার ডিটেইলস */}
                  <div className="text-center md:text-left">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">Shahjalal Jalal</h4>
                    <p className="text-sm text-blue-600 font-bold mb-3 uppercase tracking-tighter">Digital Ads Specialist</p>
                    
                    <div className="space-y-1 mb-4">
                      <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-2">
                         <Smartphone size={12} /> +880 1XXX XXXXXX
                      </p>
                      <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-2">
                         <Laptop size={12} /> www.trackflow.agency
                      </p>
                    </div>

                    {/* ক্লিকযোগ্য বাটন ইফেক্ট */}
                    <div className="flex gap-2 justify-center md:justify-start">
                      {['FB', 'LI', 'TW'].map((social) => (
                        <div key={social} className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors">
                          {social}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ফ্লোটিং মেথড ব্যাজ */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl z-30 flex items-center gap-2 font-black text-sm"
              >
                <Send size={18} /> Inbox Ready
              </motion.div>

              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-30 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compatibility</p>
                <div className="flex gap-3 grayscale opacity-70">
                   <span className="text-xs font-black dark:text-white">GMAIL</span>
                   <span className="text-xs font-black dark:text-white">OUTLOOK</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}