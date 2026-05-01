"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Video, Clock, CheckCircle } from 'lucide-react'

export default function ContactBookCallSection() {
  return (
    <section className="py-20 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
          
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side: Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                <Video size={14} /> Video Consultation
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                Prefer a Face-to-Face <br /> Strategy Session?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                Book a free 15-minute discovery call to discuss your tracking issues, ad goals, or professional email branding.
              </p>
              
              <div className="space-y-3">
                {["Check my real-time availability", "Instant Zoom/Meet link", "No back-and-forth emails"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle size={16} className="text-green-500" /> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Calendly Action */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
              <Calendar size={48} className="text-blue-600 mb-6 animate-bounce" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Select a Date & Time</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 font-medium">
                Pick a slot that works best for you and let's talk business.
              </p>
              
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/book-audit" // এখানে আপনার Calendly লিঙ্ক দিন
                target="_blank"
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg text-center shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
              >
                Open Calendar <Clock size={20} />
              </motion.a>
              
              <p className="mt-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Fast & Secure Booking
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}