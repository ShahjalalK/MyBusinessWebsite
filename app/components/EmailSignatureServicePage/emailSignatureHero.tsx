"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Smartphone, Laptop, Send, ArrowRight, ShieldCheck, Sparkles, Inbox, Mail } from 'lucide-react'
import Link from 'next/link'

export default function EmailSignatureHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white dark:bg-[#020617] overflow-hidden pt-28 pb-16">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Content */}
          <div className="w-full lg:w-[45%] text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 py-2 px-4 mb-6 text-[12px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800/50">
                <Sparkles size={14} /> Premium Signature Solutions
              </span>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                Turn Every Email <br />
                Into a <span className="text-blue-600">Growth Tool.</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                Stop wasting the bottom of your emails. We build <span className="text-slate-900 dark:text-white font-bold">highly-optimized, clickable signatures</span> that boost your brand authority and increase conversions instantly.
              </p>

              {/* Trust Features */}
              <div className="flex flex-col gap-4 mb-10">
                {[
                  "Optimized for Gmail, Outlook & Apple Mail",
                  "100% Responsive & Clickable Elements",
                  "HIPAA & Legal Statement Compliant"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Enhanced Buttons */}
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/contact" 
                  className="group bg-[#041f60] dark:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 hover:shadow-blue-500/40 active:scale-95 hover:-translate-y-0.5"
                >
                  Order Custom Design <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link href="/samples" 
                  className="group border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  View Live Samples
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Re-designed Email Inbox Preview */}
          <div className="w-full lg:w-[55%] relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Inbox Window UI */}
              <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Inbox Header */}
                <div className="bg-white dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Inbox className="text-blue-600" size={20} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">New Message</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Email Fields */}
                <div className="p-6 space-y-4">
                  <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 text-sm">
                    <span className="text-slate-400 w-16">To:</span>
                    <span className="text-slate-900 dark:text-white font-medium">Potential Client</span>
                  </div>
                  <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 text-sm">
                    <span className="text-slate-400 w-16">Subject:</span>
                    <span className="text-slate-900 dark:text-white font-medium">Partnership Opportunity</span>
                  </div>
                  
                  {/* Email Body Message */}
                  <div className="py-6 space-y-3">
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>

                  {/* The Actual Signature - This looks like a real signature now */}
                  <div className="mt-8 pt-8 border-t border-dashed border-slate-300 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Signature Photo */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#041f60] to-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shrink-0">
                        SJ
                      </div>
                      
                      {/* Signature Details */}
                      <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Shahjalal Jalal</h4>
                        <p className="text-blue-600 font-semibold text-sm mb-4">Tracking & Analytics Specialist</p>
                        
                        <div className="grid grid-cols-1 gap-1 text-[13px] text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center justify-center md:justify-start gap-2">
                            <Smartphone size={14} className="text-blue-500" /> +880 1700 000000
                          </span>
                          <span className="flex items-center justify-center md:justify-start gap-2">
                            <Laptop size={14} className="text-blue-500" /> www.trackflow.agency
                          </span>
                        </div>

                        {/* Social Buttons for Signature */}
                        <div className="flex gap-2 justify-center md:justify-start">
                          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer text-xs font-bold">L</div>
                          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer text-xs font-bold">T</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Action Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 flex items-center gap-4">
                   <div className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                     Send <Send size={14} />
                   </div>
                   <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700" />
                </div>
              </div>

              {/* Floating Status Badges - These explain the benefit */}
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 md:right-[-20px] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700 z-30 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Inbox Status</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">100% Deliverable</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-8 left-[-20px] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700 z-30 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Optimization</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Anti-Spam Tested</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}